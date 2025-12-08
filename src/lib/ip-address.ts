/**
<<<<<<< HEAD
 * IP Address utilities
 * 
 * In a browser environment, we can't directly access the client's IP address.
 * We use a third-party service to fetch it, with caching to avoid repeated calls.
 */

const IP_CACHE_KEY = 'client_ip_address';
const IP_CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour cache

interface IpCache {
  ip: string;
  timestamp: number;
}

/**
 * Get the client's IP address
 * Uses a free IP detection service with caching
 * 
 * @returns Promise<string | null> The IP address or null if unavailable
 */
export async function getClientIpAddress(): Promise<string | null> {
  // Check cache first
  const cached = getCachedIp();
  if (cached) {
    return cached;
  }

  try {
    // Try multiple IP detection services for reliability
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://api64.ipify.org?format=json',
      'https://ipapi.co/json/',
    ];

    for (const service of ipServices) {
      try {
        const response = await fetch(service, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) continue;

        const data = await response.json();
        const ip = data.ip || data.query || null;

        if (ip && isValidIpAddress(ip)) {
          // Cache the IP
          cacheIp(ip);
          return ip;
        }
      } catch (error) {
        // Try next service
        console.warn(`IP detection service failed: ${service}`, error);
        continue;
      }
    }

    // If all services fail, return null
    console.warn('All IP detection services failed');
    return null;
  } catch (error) {
    console.error('Error fetching IP address:', error);
    return null;
  }
}

/**
 * Get cached IP address if still valid
 */
function getCachedIp(): string | null {
  try {
    const cached = sessionStorage.getItem(IP_CACHE_KEY);
    if (!cached) return null;

    const cache: IpCache = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (within expiry time)
    if (now - cache.timestamp < IP_CACHE_EXPIRY) {
      return cache.ip;
    }

    // Cache expired, remove it
    sessionStorage.removeItem(IP_CACHE_KEY);
    return null;
  } catch (error) {
    // Invalid cache, remove it
    sessionStorage.removeItem(IP_CACHE_KEY);
    return null;
  }
}

/**
 * Cache IP address
 */
function cacheIp(ip: string): void {
  try {
    const cache: IpCache = {
      ip,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(IP_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // Ignore storage errors (e.g., private browsing mode)
    console.warn('Failed to cache IP address:', error);
  }
}

/**
 * Validate IP address format (IPv4 or IPv6)
 */
function isValidIpAddress(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Get client IP address synchronously (returns cached value only)
 * Use this when you need IP immediately but can't await
 * 
 * @returns string | null The cached IP address or null
 */
export function getCachedClientIp(): string | null {
  return getCachedIp();
}




=======
 * Get client IP address
 * 
 * Note: In a production environment, IP addresses should ideally be captured
 * server-side from request headers (X-Forwarded-For, X-Real-IP, etc.)
 * 
 * This client-side implementation uses a third-party service as a fallback.
 * For production, consider:
 * 1. Using server-side API endpoints that capture IP from headers
 * 2. Using a service like Cloudflare Workers or similar
 * 3. Capturing IP during initial page load and storing in session
 */

let cachedIpAddress: string | null = null;

/**
 * Get client IP address using ipify.org API
 * Falls back to null if service is unavailable
 */
export async function getClientIpAddress(): Promise<string | null> {
  // Return cached IP if available
  if (cachedIpAddress) {
    return cachedIpAddress;
  }

  try {
    // Try ipify.org first (free, no API key required)
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ip) {
        cachedIpAddress = data.ip;
        return data.ip;
      }
    }
  } catch (error) {
    console.warn('Failed to get IP from ipify.org:', error);
  }

  // Fallback: Try alternative service
  try {
    const response = await fetch('https://api64.ipify.org?format=json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ip) {
        cachedIpAddress = data.ip;
        return data.ip;
      }
    }
  } catch (error) {
    console.warn('Failed to get IP from alternative service:', error);
  }

  // If all services fail, return null
  // In production, you might want to use server-side capture instead
  return null;
}

/**
 * Clear cached IP address (useful for testing or when IP might change)
 */
export function clearIpCache(): void {
  cachedIpAddress = null;
}

>>>>>>> 0a1eb77ec4824a157bc10dbecb418f4dfac42964
