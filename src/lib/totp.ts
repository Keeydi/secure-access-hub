import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Configure TOTP settings
authenticator.options = {
  window: [1, 1], // Allow 1 time step before and after current time
};

/**
 * Generate a new TOTP secret for a user
 * @param email User's email (used in the label)
 * @returns TOTP secret
 */
export function generateTotpSecret(email: string): string {
  return authenticator.generateSecret();
}

/**
 * Generate TOTP URI for QR code
 * @param email User's email
 * @param secret TOTP secret
 * @param issuer Application name
 * @returns TOTP URI string
 */
export function generateTotpUri(
  email: string,
  secret: string,
  issuer: string = 'SecureAuth'
): string {
  return authenticator.keyuri(email, issuer, secret);
}

/**
 * Generate QR code data URL for TOTP setup
 * @param uri TOTP URI
 * @returns Promise resolving to QR code data URL
 */
export async function generateQRCode(uri: string): Promise<string> {
  try {
    return await QRCode.toDataURL(uri);
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify a TOTP code
 * @param token TOTP code entered by user
 * @param secret TOTP secret stored for the user
 * @returns True if code is valid, false otherwise
 */
export function verifyTotp(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
}

/**
 * Generate a TOTP code (for testing/debugging)
 * @param secret TOTP secret
 * @returns Current TOTP code
 */
export function generateTotpCode(secret: string): string {
  return authenticator.generate(secret);
}

