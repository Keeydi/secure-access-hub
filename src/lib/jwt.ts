import jwt from 'jsonwebtoken';

// JWT secret - in production, this should be in environment variables
// For now, using a default that should be changed in production
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = import.meta.env.VITE_JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '30m'; // 30 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Generate JWT access and refresh token pair
 * @param userId User ID
 * @param email User email
 * @param role User role
 * @returns Token pair with expiration date
 */
export function generateTokenPair(
  userId: string,
  email: string,
  role: string
): TokenPair {
  const accessPayload: TokenPayload = {
    userId,
    email,
    role,
    type: 'access',
  };

  const refreshPayload: TokenPayload = {
    userId,
    email,
    role,
    type: 'refresh',
  };

  const accessToken = jwt.sign(accessPayload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

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
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
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
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
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
export function refreshAccessToken(refreshToken: string): TokenPair | null {
  const payload = verifyRefreshToken(refreshToken);
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
    return jwt.decode(token) as TokenPayload;
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

  const exp = typeof decoded.exp === 'number' ? decoded.exp : parseInt(decoded.exp);
  return Date.now() >= exp * 1000;
}

