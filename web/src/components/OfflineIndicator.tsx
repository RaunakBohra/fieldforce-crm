import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { isOnline, setupOnlineStatusListener, getStorageStats } from '../utils/offlineStorage';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingData, setPendingData] = useState({ visits: 0, orders: 0, queuedRequests: 0 });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Setup online/offline listeners
    const cleanup = setupOnlineStatusListener(
      () => {
        setOnline(true);
        handleAutoSync();
      },
      () => setOnline(false)
    );

    // Initial stats load
    loadStats();

    // Poll stats every 30 seconds
    const interval = setInterval(loadStats, 30000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  const loadStats = async () => {
    const stats = await getStorageStats();
    setPendingData({
      visits: stats.visits,
      orders: stats.orders,
      queuedRequests: stats.queuedRequests,
    });
  };

  const handleAutoSync = async () => {
    if (!online || syncing) return;

    const hasPendingData = pendingData.visits > 0 || pendingData.orders > 0 || pendingData.queuedRequests > 0;
    if (!hasPendingData) return;

    // Trigger manual sync from parent component via event
    window.dispatchEvent(new CustomEvent('offline-sync-requested'));
  };

  const handleManualSync = () => {
    if (!online || syncing) return;
    window.dispatchEvent(new CustomEvent('offline-sync-requested'));
  };

  const totalPending = pendingData.visits + pendingData.orders + pendingData.queuedRequests;

  if (!showDetails && online && totalPending === 0) {
    // Don't show indicator when online with no pending data
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`
          rounded-lg shadow-lg p-4 min-w-[300px]
          ${online ? 'bg-white border border-neutral-200' : 'bg-danger-600 text-white'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {online ? (
              <Wifi className="h-5 w-5 text-success-600" />
            ) : (
              <WifiOff className="h-5 w-5" />
            )}
            <span className="font-medium">
              {online ? 'Online' : 'Offline Mode'}
            </span>
          </div>

          {totalPending > 0 && (
            <span className="bg-accent-600 text-white text-xs font-bold rounded-full px-2 py-1">
              {totalPending}
            </span>
          )}
        </div>

        {/* Status message */}
        <p className={`text-sm mb-3 ${online ? 'text-neutral-600' : 'text-white'}`}>
          {online ? (
            totalPending > 0 ? (
              'You have unsynced data'
            ) : (
              'All data synced'
            )
          ) : (
            'Data will sync when connection restored'
          )}
        </p>

        {/* Pending data details */}
        {totalPending > 0 && (
          <div className={`space-y-1 mb-3 text-sm ${online ? 'text-neutral-700' : 'text-white'}`}>
            {pendingData.visits > 0 && (
              <div className="flex items-center justify-between">
                <span>Visits</span>
                <span className="font-medium">{pendingData.visits}</span>
              </div>
            )}
            {pendingData.orders > 0 && (
              <div className="flex items-center justify-between">
                <span>Orders</span>
                <span className="font-medium">{pendingData.orders}</span>
              </div>
            )}
            {pendingData.queuedRequests > 0 && (
              <div className="flex items-center justify-between">
                <span>Other requests</span>
                <span className="font-medium">{pendingData.queuedRequests}</span>
              </div>
            )}
          </div>
        )}

        {/* Sync button */}
        {online && totalPending > 0 && (
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="w-full bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sync Now
              </>
            )}
          </button>
        )}

        {/* Last sync timestamp */}
        {lastSync && online && (
          <p className="text-xs text-neutral-500 mt-2 text-center">
            Last synced: {lastSync.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
