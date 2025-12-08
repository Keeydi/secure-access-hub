/**
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




