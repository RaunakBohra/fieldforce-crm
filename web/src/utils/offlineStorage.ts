/**
 * Offline Storage Utility
 *
 * Uses IndexedDB (via localforage) to store data offline.
 * Automatically syncs to server when connection is restored.
 *
 * Features:
 * - Store visits, orders, payments offline
 * - Queue API requests for background sync
 * - Detect online/offline status
 * - Automatic sync when online
 */

import localforage from 'localforage';

// Configure localforage
const offlineStore = localforage.createInstance({
  name: 'fieldforce-crm',
  storeName: 'offline_data',
  description: 'Offline data storage for Field Force CRM'
});

const syncQueue = localforage.createInstance({
  name: 'fieldforce-crm',
  storeName: 'sync_queue',
  description: 'Queue of pending API requests to sync'
});

// Types
export interface QueuedRequest {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
}

export interface OfflineVisit {
  id: string;
  contactId: string;
  contactName?: string;
  latitude?: number;
  longitude?: number;
  checkInTime: string;
  status: 'DRAFT' | 'PENDING_SYNC';
  createdAt: number;
}

export interface OfflineOrder {
  id: string;
  contactId: string;
  items: any[];
  total: number;
  status: 'DRAFT' | 'PENDING_SYNC';
  createdAt: number;
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Add event listeners for online/offline status
 */
export function setupOnlineStatusListener(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  const handleOnline = () => {
    console.log('🟢 Back online! Syncing data...');
    onOnline();
  };

  const handleOffline = () => {
    console.log('🔴 Offline mode activated');
    onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// ============================================================
// Offline Data Storage
// ============================================================

/**
 * Save a visit offline (when no internet)
 */
export async function saveOfflineVisit(visit: OfflineVisit): Promise<void> {
  const visits = await getOfflineVisits();
  visits.push(visit);
  await offlineStore.setItem('visits', visits);
  console.log('📦 Visit saved offline:', visit.id);
}

/**
 * Get all offline visits
 */
export async function getOfflineVisits(): Promise<OfflineVisit[]> {
  const visits = await offlineStore.getItem<OfflineVisit[]>('visits');
  return visits || [];
}

/**
 * Remove a synced visit from offline storage
 */
export async function removeOfflineVisit(visitId: string): Promise<void> {
  const visits = await getOfflineVisits();
  const filtered = visits.filter(v => v.id !== visitId);
  await offlineStore.setItem('visits', filtered);
  console.log('✅ Offline visit removed after sync:', visitId);
}

/**
 * Save an order offline
 */
export async function saveOfflineOrder(order: OfflineOrder): Promise<void> {
  const orders = await getOfflineOrders();
  orders.push(order);
  await offlineStore.setItem('orders', orders);
  console.log('📦 Order saved offline:', order.id);
}

/**
 * Get all offline orders
 */
export async function getOfflineOrders(): Promise<OfflineOrder[]> {
  const orders = await offlineStore.getItem<OfflineOrder[]>('orders');
  return orders || [];
}

/**
 * Remove a synced order from offline storage
 */
export async function removeOfflineOrder(orderId: string): Promise<void> {
  const orders = await getOfflineOrders();
  const filtered = orders.filter(o => o.id !== orderId);
  await offlineStore.setItem('orders', filtered);
  console.log('✅ Offline order removed after sync:', orderId);
}

// ============================================================
// Sync Queue for API Requests
// ============================================================

/**
 * Add an API request to the sync queue
 */
export async function queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): Promise<string> {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const queuedRequest: QueuedRequest = {
    ...request,
    id,
    timestamp: Date.now(),
    retries: 0
  };

  await syncQueue.setItem(id, queuedRequest);
  console.log('📤 Request queued for sync:', id);
  return id;
}

/**
 * Get all queued requests
 */
export async function getQueuedRequests(): Promise<QueuedRequest[]> {
  const requests: QueuedRequest[] = [];
  await syncQueue.iterate<QueuedRequest, void>((value) => {
    requests.push(value);
  });
  return requests.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Remove a request from the queue after successful sync
 */
export async function removeQueuedRequest(id: string): Promise<void> {
  await syncQueue.removeItem(id);
  console.log('✅ Request synced and removed from queue:', id);
}

/**
 * Update request retry count
 */
export async function incrementRetry(id: string): Promise<void> {
  const request = await syncQueue.getItem<QueuedRequest>(id);
  if (request) {
    request.retries += 1;
    await syncQueue.setItem(id, request);
  }
}

// ============================================================
// Cache Management
// ============================================================

/**
 * Cache contacts for offline use
 */
export async function cacheContacts(contacts: any[]): Promise<void> {
  await offlineStore.setItem('contacts', contacts);
  await offlineStore.setItem('contacts_cached_at', Date.now());
  console.log(`📦 Cached ${contacts.length} contacts`);
}

/**
 * Get cached contacts
 */
export async function getCachedContacts(): Promise<any[]> {
  const contacts = await offlineStore.getItem<any[]>('contacts');
  return contacts || [];
}

/**
 * Cache products for offline use
 */
export async function cacheProducts(products: any[]): Promise<void> {
  await offlineStore.setItem('products', products);
  await offlineStore.setItem('products_cached_at', Date.now());
  console.log(`📦 Cached ${products.length} products`);
}

/**
 * Get cached products
 */
export async function getCachedProducts(): Promise<any[]> {
  const products = await offlineStore.getItem<any[]>('products');
  return products || [];
}

/**
 * Check if cache is stale (older than 1 hour)
 */
export async function isCacheStale(key: string): Promise<boolean> {
  const cachedAt = await offlineStore.getItem<number>(`${key}_cached_at`);
  if (!cachedAt) return true;

  const oneHour = 60 * 60 * 1000;
  return Date.now() - cachedAt > oneHour;
}

// ============================================================
// Sync Logic
// ============================================================

/**
 * Sync all offline data to server
 * Call this when app comes back online
 */
export async function syncOfflineData(apiClient: {
  checkIn: (data: any) => Promise<any>;
  createOrder: (data: any) => Promise<any>;
}): Promise<{ success: number; failed: number }> {
  if (!isOnline()) {
    console.log('⚠️ Cannot sync: still offline');
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  // Sync offline visits
  const visits = await getOfflineVisits();
  for (const visit of visits) {
    try {
      await apiClient.checkIn({
        contactId: visit.contactId,
        latitude: visit.latitude,
        longitude: visit.longitude,
      });
      await removeOfflineVisit(visit.id);
      success++;
    } catch (error) {
      console.error('Failed to sync visit:', visit.id, error);
      failed++;
    }
  }

  // Sync offline orders
  const orders = await getOfflineOrders();
  for (const order of orders) {
    try {
      await apiClient.createOrder({
        contactId: order.contactId,
        items: order.items,
      });
      await removeOfflineOrder(order.id);
      success++;
    } catch (error) {
      console.error('Failed to sync order:', order.id, error);
      failed++;
    }
  }

  // Sync queued requests
  const queuedRequests = await getQueuedRequests();
  for (const request of queuedRequests) {
    try {
      const response = await fetch(request.endpoint, {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.data),
      });

      if (response.ok) {
        await removeQueuedRequest(request.id);
        success++;
      } else {
        await incrementRetry(request.id);
        failed++;
      }
    } catch (error) {
      console.error('Failed to sync request:', request.id, error);
      await incrementRetry(request.id);
      failed++;
    }
  }

  console.log(`✅ Sync complete: ${success} succeeded, ${failed} failed`);
  return { success, failed };
}

/**
 * Clear all offline data (use with caution!)
 */
export async function clearOfflineData(): Promise<void> {
  await offlineStore.clear();
  await syncQueue.clear();
  console.log('🗑️ All offline data cleared');
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  visits: number;
  orders: number;
  queuedRequests: number;
  contacts: number;
  products: number;
}> {
  const visits = await getOfflineVisits();
  const orders = await getOfflineOrders();
  const requests = await getQueuedRequests();
  const contacts = await getCachedContacts();
  const products = await getCachedProducts();

  return {
    visits: visits.length,
    orders: orders.length,
    queuedRequests: requests.length,
    contacts: contacts.length,
    products: products.length,
  };
}
