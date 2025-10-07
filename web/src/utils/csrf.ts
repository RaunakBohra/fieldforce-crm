/**
 * CSRF Token Management Utility
 * Implements client-side Double Submit Cookie pattern
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

let cachedToken: string | null = null;

/**
 * Get CSRF token from cookie
 */
function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === CSRF_TOKEN_KEY) {
      return value;
    }
  }
  return null;
}

/**
 * Fetch CSRF token from server
 */
async function fetchCsrfToken(): Promise<string> {
  const API_URL = import.meta.env.VITE_API_URL || 'https://fieldforce-crm-api.rnkbohra.workers.dev';

  console.log('[CSRF Debug] Fetching token from:', API_URL);

  try {
    const response = await fetch(`${API_URL}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include', // Important: Include cookies for CSRF cookie
    });

    console.log('[CSRF Debug] Response status:', response.status);
    console.log('[CSRF Debug] Response headers:', Array.from(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('[CSRF Debug] Response data:', data);

    if (data.success && data.data?.csrfToken) {
      cachedToken = data.data.csrfToken;
      console.log('[CSRF Debug] Token cached:', data.data.csrfToken.substring(0, 20) + '...');
      return data.data.csrfToken;
    }

    throw new Error('Invalid CSRF token response format');
  } catch (error) {
    console.error('[CSRF Debug] Token fetch error:', error);
    throw error;
  }
}

/**
 * Get CSRF token (from cookie or fetch from server)
 */
export async function getCsrfToken(): Promise<string> {
  console.log('[CSRF Debug] getCsrfToken called');
  console.log('[CSRF Debug] Build timestamp:', '2025-10-07 08:00'); // To verify new build

  // Try to get from cookie first
  const cookieToken = getCsrfTokenFromCookie();
  console.log('[CSRF Debug] Cookie token:', cookieToken ? cookieToken.substring(0, 20) + '...' : 'Not found');
  console.log('[CSRF Debug] All cookies:', document.cookie);

  if (cookieToken) {
    cachedToken = cookieToken;
    return cookieToken;
  }

  // If no cookie, fetch from server
  if (!cachedToken) {
    console.log('[CSRF Debug] No cached token, fetching from server');
    cachedToken = await fetchCsrfToken();
  } else {
    console.log('[CSRF Debug] Using cached token:', cachedToken.substring(0, 20) + '...');
  }

  return cachedToken;
}

/**
 * Get CSRF token synchronously (returns null if not cached)
 */
export function getCsrfTokenSync(): string | null {
  return getCsrfTokenFromCookie() || cachedToken;
}

/**
 * Clear cached CSRF token
 */
export function clearCsrfToken(): void {
  cachedToken = null;
}

/**
 * Get CSRF header name
 */
export function getCsrfHeaderName(): string {
  return CSRF_HEADER_NAME;
}

/**
 * Initialize CSRF token (call this on app startup)
 */
export async function initializeCsrfToken(): Promise<void> {
  try {
    await getCsrfToken();
  } catch (error) {
    console.error('Failed to initialize CSRF token:', error);
  }
}
