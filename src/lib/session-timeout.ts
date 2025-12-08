import { verifyAccessToken, refreshAccessToken, isTokenExpired } from './jwt';
import * as api from './api';

/**
 * Session timeout configuration (30 minutes)
 */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Check if session is expired and handle refresh
 * @param accessToken Current access token
 * @param refreshToken Current refresh token
 * @returns Object with isValid boolean and new tokens if refreshed
 */
export async function checkSessionTimeout(
  accessToken: string,
  refreshToken: string | null
): Promise<{
  isValid: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
}> {
  // Check if token is expired
  if (isTokenExpired(accessToken)) {
    // Try to refresh if refresh token exists
    if (refreshToken) {
      const newTokenPair = await refreshAccessToken(refreshToken);
      if (newTokenPair) {
<<<<<<< HEAD
        // Update session in database
        const payload = await verifyAccessToken(newTokenPair.accessToken);
        if (payload) {
=======
        // Get user ID from the old token (decode without verification since it's expired)
        const decoded = JSON.parse(atob(accessToken.split('.')[1]));
        const userId = decoded.userId;
        
        if (userId) {
>>>>>>> 0a1eb77ec4824a157bc10dbecb418f4dfac42964
          try {
            // Delete old session
            await api.deleteSession(accessToken);
            // Create new session
            await api.createSession(
              userId,
              newTokenPair.accessToken,
              newTokenPair.refreshToken,
              newTokenPair.expiresAt,
              null,
              null
            );
          } catch (error) {
            console.error('Failed to update session:', error);
          }
        }

        return {
          isValid: true,
          accessToken: newTokenPair.accessToken,
          refreshToken: newTokenPair.refreshToken,
          expiresAt: newTokenPair.expiresAt,
        };
      }
    }
    // If refresh failed, session is invalid
    return { isValid: false };
  }

  // Token is still valid
  return { isValid: true };
}

/**
 * Get time until session expires
 * @param accessToken Access token
 * @returns Milliseconds until expiry, or 0 if expired
 */
export function getTimeUntilExpiry(accessToken: string): number {
  if (isTokenExpired(accessToken)) {
    return 0;
  }

  try {
    const decoded = JSON.parse(atob(accessToken.split('.')[1]));
    const exp = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    return Math.max(0, exp - now);
  } catch (error) {
    return 0;
  }
}

/**
 * Format time remaining until expiry
 * @param ms Milliseconds until expiry
 * @returns Formatted string (e.g., "5 minutes")
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) {
    return 'expired';
  }

  const minutes = Math.floor(ms / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);

  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
}

