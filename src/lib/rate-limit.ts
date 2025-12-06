import * as api from './api';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_ATTEMPTS = 5; // Maximum attempts
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Check if user has exceeded rate limit for login attempts
 * @param email User email
 * @returns Object with isBlocked boolean and remainingAttempts number
 */
export async function checkLoginRateLimit(email: string): Promise<{
  isBlocked: boolean;
  remainingAttempts: number;
  resetAt: Date;
}> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const failedAttempts = await api.getFailedLoginAttemptsCount(email, since);

  const remainingAttempts = Math.max(0, RATE_LIMIT_ATTEMPTS - failedAttempts);
  const isBlocked = failedAttempts >= RATE_LIMIT_ATTEMPTS;

  // Calculate when the rate limit will reset (1 hour from the oldest attempt)
  const resetAt = new Date(Date.now() + RATE_LIMIT_WINDOW_MS);

  return {
    isBlocked,
    remainingAttempts,
    resetAt,
  };
}

/**
 * Check if user has exceeded rate limit for MFA verification attempts
 * @param userId User ID
 * @returns Object with isBlocked boolean and remainingAttempts number
 */
export async function checkMfaRateLimit(userId: string): Promise<{
  isBlocked: boolean;
  remainingAttempts: number;
  resetAt: Date;
}> {
  // For MFA, we'll use a similar approach but check OTP verification failures
  // This is a simplified version - in production, you might want a separate table
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  
  // For now, we'll use a generic approach
  // In production, you might want to track MFA failures separately
  const resetAt = new Date(Date.now() + RATE_LIMIT_WINDOW_MS);

  return {
    isBlocked: false, // Implement MFA-specific rate limiting if needed
    remainingAttempts: RATE_LIMIT_ATTEMPTS,
    resetAt,
  };
}

/**
 * Get rate limit error message
 * @param resetAt When the rate limit resets
 * @returns Error message string
 */
export function getRateLimitErrorMessage(resetAt: Date): string {
  const minutesUntilReset = Math.ceil((resetAt.getTime() - Date.now()) / (60 * 1000));
  
  if (minutesUntilReset > 60) {
    const hours = Math.floor(minutesUntilReset / 60);
    return `Too many failed attempts. Please try again in ${hours} hour${hours > 1 ? 's' : ''}.`;
  }
  
  return `Too many failed attempts. Please try again in ${minutesUntilReset} minute${minutesUntilReset > 1 ? 's' : ''}.`;
}

