import { SignJWT, jwtVerify, decodeJwt } from 'jose';

// JWT secret - in production, this should be in environment variables
// For now, using a default that should be changed in production
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = import.meta.env.VITE_JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

// Token expiration times (in seconds)
const ACCESS_TOKEN_EXPIRY = 30 * 60; // 30 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  exp?: number;
  iat?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// Convert secrets to Uint8Array for jose
const getSecretKey = (secret: string): Uint8Array => {
  return new TextEncoder().encode(secret);
};

const accessSecretKey = getSecretKey(JWT_SECRET);
const refreshSecretKey = getSecretKey(JWT_REFRESH_SECRET);

/**
 * Generate JWT access and refresh token pair
 * @param userId User ID
 * @param email User email
 * @param role User role
 * @returns Token pair with expiration date
 */
export async function generateTokenPair(
  userId: string,
  email: string,
  role: string
): Promise<TokenPair> {
  const now = Math.floor(Date.now() / 1000);

  // Create access token
  const accessToken = await new SignJWT({
    userId,
    email,
    role,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + ACCESS_TOKEN_EXPIRY)
    .sign(accessSecretKey);

  // Create refresh token
  const refreshToken = await new SignJWT({
    userId,
    email,
    role,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + REFRESH_TOKEN_EXPIRY)
    .sign(refreshSecretKey);

  // Calculate expiration date (30 minutes from now)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  return {
    accessToken,
    refreshToken,
    expiresAt,
  };
}

/**
 * Verify and decode an access token
 * @param token JWT access token
 * @returns Decoded token payload or null if invalid
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecretKey);
    const decoded = payload as TokenPayload;
    if (decoded.type !== 'access') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify and decode a refresh token
 * @param token JWT refresh token
 * @returns Decoded token payload or null if invalid
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecretKey);
    const decoded = payload as TokenPayload;
    if (decoded.type !== 'refresh') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Refresh an access token using a refresh token
 * @param refreshToken Refresh token
 * @returns New token pair or null if refresh token is invalid
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return null;
  }

  return generateTokenPair(payload.userId, payload.email, payload.role);
}

/**
 * Decode token without verification (for inspection only)
 * @param token JWT token
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return decodeJwt(token) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a token is expired (without verification)
 * @param token JWT token
 * @returns True if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const exp = typeof decoded.exp === 'number' ? decoded.exp : parseInt(String(decoded.exp));
  return Date.now() >= exp * 1000;
}
