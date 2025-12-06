/**
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

