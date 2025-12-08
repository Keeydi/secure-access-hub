/**
 * Client IP Address Utility
 * 
 * Fetches the client's public IP address using external services
 * and caches it in sessionStorage to avoid repeated API calls.
 */

const IP_CACHE_KEY = 'client_ip_address';
const IP_CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour cache

interface IpCache {
  ip: string;
  timestamp: number;
}

/**
 * Get cached IP address from sessionStorage
 */
export function getCachedClientIp(): string | null {
  try {
    const cached = sessionStorage.getItem(IP_CACHE_KEY);
    if (cached) {
      const data: IpCache = JSON.parse(cached);
      if (Date.now() - data.timestamp < IP_CACHE_EXPIRY) {
        return data.ip;
      } else {
        sessionStorage.removeItem(IP_CACHE_KEY); // Cache expired
      }
    }
  } catch (error) {
    console.warn('Failed to read cached IP:', error);
  }
  return null;
}

/**
 * Set cached IP address in sessionStorage
 */
function setCachedIp(ip: string) {
  try {
    const data: IpCache = { ip, timestamp: Date.now() };
    sessionStorage.setItem(IP_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache IP:', error);
  }
}

/**
 * Validate IP address format (IPv4 or IPv6)
 */
function isValidIp(ip: string): boolean {
  // Basic IPv4 and IPv6 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-fA-F]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Fetch client's public IP address from external services
 * Uses multiple fallback services for reliability
 */
export async function getClientIpAddress(): Promise<string | null> {
  // Check cache first
  const cached = getCachedClientIp();
  if (cached) {
    return cached;
  }

  // Try ipify.org first
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.ip && isValidIp(data.ip)) {
        setCachedIp(data.ip);
        return data.ip;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch IP from ipify.org:', error);
  }

  // Fallback to ipapi.co
  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.ip && isValidIp(data.ip)) {
        setCachedIp(data.ip);
        return data.ip;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch IP from ipapi.co:', error);
  }

  console.warn('Could not determine client IP address from any service.');
  return null;
}


