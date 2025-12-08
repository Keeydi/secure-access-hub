import crypto from 'crypto-browserify';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Make Node.js crypto available for otplib
// Note: window.crypto is read-only, so we use globalThis and a custom property
// Buffer and process are already set up in polyfills.ts
if (typeof globalThis !== 'undefined') {
  // Set Node.js crypto on globalThis (not window.crypto which is read-only)
  if (!(globalThis as any).nodeCrypto) {
    (globalThis as any).nodeCrypto = crypto;
  }
  // Also try to set it as crypto if it doesn't exist (for modules that check globalThis.crypto)
  if (!(globalThis as any).crypto || !(globalThis as any).crypto.createHmac) {
    try {
      (globalThis as any).crypto = crypto;
    } catch (e) {
      // If setting fails, use nodeCrypto as fallback
      console.warn('Could not set globalThis.crypto, using nodeCrypto');
    }
  }
}

// Configure TOTP settings
authenticator.options = {
  window: [2, 2], // Allow 2 time steps before and after current time (60 seconds each = 2 minutes total window)
  step: 30, // 30-second time steps (standard TOTP)
};

/**
 * Generate a new TOTP secret for a user
 * @param email User's email (used in the label)
 * @returns TOTP secret
 */
export function generateTotpSecret(email: string): string {
  // Use browser-compatible random generation
  // Generate 20 bytes (160 bits) for a strong secret
  const array = new Uint8Array(20);
  // Use browser's native crypto.getRandomValues (Web Crypto API)
  // Not the Node.js crypto polyfill
  const webCrypto = typeof window !== 'undefined' 
    ? window.crypto 
    : (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.getRandomValues 
       ? (globalThis as any).crypto 
       : null);
  
  if (webCrypto && webCrypto.getRandomValues) {
    webCrypto.getRandomValues(array);
  } else {
    // Fallback: use Node.js crypto if available
    const nodeCrypto = (globalThis as any).nodeCrypto || (globalThis as any).crypto;
    if (nodeCrypto && nodeCrypto.randomBytes) {
      const randomBytes = nodeCrypto.randomBytes(20);
      array.set(randomBytes);
    } else {
      throw new Error('No crypto.getRandomValues available');
    }
  }
  
  // Convert to base32 format (TOTP standard - RFC 4648)
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  let bits = 0;
  let value = 0;
  
  for (let i = 0; i < array.length; i++) {
    value = (value << 8) | array[i];
    bits += 8;
    
    while (bits >= 5) {
      secret += base32Chars[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    secret += base32Chars[(value << (5 - bits)) & 31];
  }
  
  // Ensure secret is at least 16 characters (80 bits minimum for TOTP)
  // Pad to 32 characters if needed (standard length)
  while (secret.length < 16) {
    const paddingArray = new Uint8Array(1);
    // Use browser's native crypto.getRandomValues
    const webCrypto = typeof window !== 'undefined' 
      ? window.crypto 
      : (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.getRandomValues 
         ? (globalThis as any).crypto 
         : null);
    
    if (webCrypto && webCrypto.getRandomValues) {
      webCrypto.getRandomValues(paddingArray);
    } else {
      // Fallback: use Node.js crypto if available
      const nodeCrypto = (globalThis as any).nodeCrypto || (globalThis as any).crypto;
      if (nodeCrypto && nodeCrypto.randomBytes) {
        const randomBytes = nodeCrypto.randomBytes(1);
        paddingArray[0] = randomBytes[0];
      } else {
        // Last resort: use Math.random (not cryptographically secure, but better than nothing)
        paddingArray[0] = Math.floor(Math.random() * 256);
      }
    }
    const paddingValue = paddingArray[0];
    secret += base32Chars[paddingValue & 31];
  }
  
  // Return 32-character secret (standard TOTP secret length)
  return secret.slice(0, 32);
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
    // Trim whitespace and ensure it's a 6-digit code
    const cleanToken = token.trim();
    if (!/^\d{6}$/.test(cleanToken)) {
      console.warn('TOTP verification: Invalid token format');
      return false;
    }
    
    // Verify the code
    const isValid = authenticator.verify({ token: cleanToken, secret });
    
    if (!isValid) {
      console.warn('TOTP verification failed. Token:', cleanToken, 'Secret length:', secret.length);
      // For debugging: generate what the current code should be
      try {
        const expectedCode = authenticator.generate(secret);
        console.warn('Current expected code:', expectedCode);
      } catch (e) {
        console.warn('Could not generate expected code for debugging');
      }
    }
    
    return isValid;
  } catch (error) {
    console.error('TOTP verification error:', error);
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

