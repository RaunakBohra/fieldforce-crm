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
  const API_URL = import.meta.env.VITE_API_URL;

  const response = await fetch(`${API_URL}/api/csrf-token`, {
    method: 'GET',
    credentials: 'include', // Important: Include cookies
  });

  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }

  const data = await response.json();
  if (data.success && data.data?.csrfToken) {
    cachedToken = data.data.csrfToken;
    return data.data.csrfToken;
  }

  throw new Error('Invalid CSRF token response');
}

/**
 * Get CSRF token (from cookie or fetch from server)
 */
export async function getCsrfToken(): Promise<string> {
  // Try to get from cookie first
  const cookieToken = getCsrfTokenFromCookie();
  if (cookieToken) {
    cachedToken = cookieToken;
    return cookieToken;
  }

  // If no cookie, fetch from server
  if (!cachedToken) {
    cachedToken = await fetchCsrfToken();
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
