import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import * as api from '@/lib/api';
import type { User } from '@/lib/api';
import { hashPassword, comparePassword } from '@/lib/password';
import { generateTokenPair, verifyAccessToken, refreshAccessToken, isTokenExpired } from '@/lib/jwt';
import { generateTotpSecret, generateTotpUri, generateQRCode, verifyTotp } from '@/lib/totp';
import { generateEmailOtp, sendEmailOtp } from '@/lib/email-otp';
import { checkLoginRateLimit, getRateLimitErrorMessage } from '@/lib/rate-limit';
import { checkSessionTimeout, getTimeUntilExpiry, SESSION_TIMEOUT_MS } from '@/lib/session-timeout';
import { getClientIpAddress, getCachedClientIp } from '@/lib/ip-address';

export type UserRole = 'Admin' | 'StandardUser' | 'RestrictedUser';

// Re-export User type for convenience
export type { User };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  mfaVerified: boolean;
  isLoading: boolean; // Track if session is being restored
  login: (email: string, password: string) => Promise<{ requiresMfa: boolean }>;
  verifyMfa: (code: string, type?: 'totp' | 'email') => Promise<boolean>;
  logout: () => void;
  sendRegistrationOtp: (email: string, password: string) => Promise<boolean>;
  verifyRegistrationOtp: (email: string, code: string) => Promise<void>;
  enableMfa: () => void;
  disableMfa: () => void;
  setupTotp: () => Promise<{ secret: string; qrCode: string; uri: string }>;
  setupEmailOtp: () => Promise<boolean>;
  verifyTotpSetup: (code: string, secret: string) => Promise<boolean>;
  verifyEmailOtpSetup: (code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session storage keys
const SESSION_USER_KEY = 'auth_user';
const SESSION_MFA_VERIFIED_KEY = 'auth_mfa_verified';
const SESSION_ACCESS_TOKEN_KEY = 'auth_access_token';
const SESSION_REFRESH_TOKEN_KEY = 'auth_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start as loading
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionLoadedRef = useRef(false); // Track if session has been loaded

  // Helper to get client IP and user agent
  const getClientInfo = async () => {
    // Try to get cached IP first (synchronous)
    let ipAddress = getCachedClientIp();
    
    // If no cached IP, fetch it (async)
    if (!ipAddress) {
      ipAddress = await getClientIpAddress();
    }
    
    return {
      ipAddress: ipAddress || null,
      userAgent: navigator.userAgent,
    };
  };

  const clearSession = () => {
    // Clear interval if running
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }

    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(SESSION_MFA_VERIFIED_KEY);
    sessionStorage.removeItem(SESSION_ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_REFRESH_TOKEN_KEY);
    setUser(null);
    setMfaVerified(false);
  };

  const logout = useCallback(async () => {
    const storedAccessToken = sessionStorage.getItem(SESSION_ACCESS_TOKEN_KEY);
    
    if (user && storedAccessToken) {
      try {
        // Delete session from database
        await api.deleteSession(storedAccessToken);
        const { ipAddress, userAgent } = await getClientInfo();
        await api.createAuditLog(user.id, 'User logout', ipAddress, userAgent);
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
    
    clearSession();
  }, [user]);

  // Start monitoring session timeout
  const startSessionTimeoutMonitoring = useCallback((
    accessToken: string,
    refreshToken: string | null
  ) => {
    // Clear any existing interval
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
    }

    // Check session every minute
    sessionCheckIntervalRef.current = setInterval(async () => {
      const sessionCheck = await checkSessionTimeout(accessToken, refreshToken);

      if (!sessionCheck.isValid) {
        // Session expired, logout user
        await logout();
        // Show notification (you might want to use a toast here)
        console.warn('Session expired due to inactivity');
      } else if (sessionCheck.accessToken) {
        // Token was refreshed, update stored tokens
        accessToken = sessionCheck.accessToken;
        if (sessionCheck.refreshToken) {
          refreshToken = sessionCheck.refreshToken;
        }
        sessionStorage.setItem(SESSION_ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) {
          sessionStorage.setItem(SESSION_REFRESH_TOKEN_KEY, refreshToken);
        }
      }
    }, 60 * 1000); // Check every minute
  }, [logout]);

  // Load user and validate token on mount (only once)
  useEffect(() => {
    // Prevent multiple runs
    if (sessionLoadedRef.current) {
      return;
    }

    const loadSession = async () => {
      setIsLoading(true);
      const storedUser = sessionStorage.getItem(SESSION_USER_KEY);
      const storedAccessToken = sessionStorage.getItem(SESSION_ACCESS_TOKEN_KEY);
      const storedRefreshToken = sessionStorage.getItem(SESSION_REFRESH_TOKEN_KEY);
      const storedMfaVerified = sessionStorage.getItem(SESSION_MFA_VERIFIED_KEY);
      
      if (storedUser && storedAccessToken) {
        try {
          // Check session timeout and refresh if needed
          const sessionCheck = await checkSessionTimeout(
            storedAccessToken,
            storedRefreshToken
          );

          if (sessionCheck.isValid) {
            // Update tokens if refreshed
            const finalAccessToken = sessionCheck.accessToken || storedAccessToken;
            const finalRefreshToken = sessionCheck.refreshToken || storedRefreshToken;
            
            if (sessionCheck.accessToken) {
              sessionStorage.setItem(SESSION_ACCESS_TOKEN_KEY, finalAccessToken);
              if (sessionCheck.refreshToken) {
                sessionStorage.setItem(SESSION_REFRESH_TOKEN_KEY, finalRefreshToken);
              }
            }

            const user = JSON.parse(storedUser);
            setUser(user);
            setMfaVerified(storedMfaVerified === 'true');

            // Start session timeout monitoring
            startSessionTimeoutMonitoring(finalAccessToken, finalRefreshToken);
          } else {
            // Session expired, clear it
            clearSession();
          }
        } catch (error) {
          console.error('Failed to load session:', error);
          clearSession();
        }
      }
      
      setIsLoading(false);
      sessionLoadedRef.current = true;
    };

    loadSession();

    // Cleanup on unmount
    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const login = async (email: string, password: string): Promise<{ requiresMfa: boolean }> => {
    const { ipAddress, userAgent } = await getClientInfo();
    
    // Check rate limit before attempting login
    const rateLimit = await checkLoginRateLimit(email);
    if (rateLimit.isBlocked) {
      const errorMessage = getRateLimitErrorMessage(rateLimit.resetAt);
      throw new Error(errorMessage);
    }
    
    // Get user data
    const userData = await api.getUserByEmail(email);
    if (!userData) {
      await api.recordFailedLoginAttempt(email, false, ipAddress);
      // Check rate limit again after failed attempt
      const newRateLimit = await checkLoginRateLimit(email);
      if (newRateLimit.isBlocked) {
        throw new Error(getRateLimitErrorMessage(newRateLimit.resetAt));
      }
      throw new Error('Invalid credentials');
    }

    // Get password hash and compare
    const passwordHash = await api.getPasswordHash(email);
    if (!passwordHash) {
      await api.recordFailedLoginAttempt(email, false, ipAddress);
      // Check rate limit again after failed attempt
      const newRateLimit = await checkLoginRateLimit(email);
      if (newRateLimit.isBlocked) {
        throw new Error(getRateLimitErrorMessage(newRateLimit.resetAt));
      }
      throw new Error('Invalid credentials');
    }

    // Compare password using bcrypt
    const isPasswordValid = await comparePassword(password, passwordHash);
    if (!isPasswordValid) {
      await api.recordFailedLoginAttempt(email, false, ipAddress);
      // Check rate limit again after failed attempt
      const newRateLimit = await checkLoginRateLimit(email);
      if (newRateLimit.isBlocked) {
        throw new Error(getRateLimitErrorMessage(newRateLimit.resetAt));
      }
      throw new Error('Invalid credentials');
    }

    // Generate JWT tokens
    const tokenPair = await generateTokenPair(userData.id, userData.email, userData.role);
    
    // Store session in database
    await api.createSession(
      userData.id,
      tokenPair.accessToken,
      tokenPair.refreshToken,
      tokenPair.expiresAt,
      ipAddress,
      userAgent
    );
    
    // Store in session storage
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userData));
    sessionStorage.setItem(SESSION_ACCESS_TOKEN_KEY, tokenPair.accessToken);
    sessionStorage.setItem(SESSION_REFRESH_TOKEN_KEY, tokenPair.refreshToken);
    
    // Create audit log
    await api.createAuditLog(userData.id, 'User login', ipAddress, userAgent);
    await api.recordFailedLoginAttempt(email, true, ipAddress);

    if (userData.mfaEnabled) {
      setMfaVerified(false);
      sessionStorage.setItem(SESSION_MFA_VERIFIED_KEY, 'false');
      setUser(userData);
      setIsLoading(false); // Set loading to false after login
      return { requiresMfa: true };
    }
    
    setMfaVerified(true);
    sessionStorage.setItem(SESSION_MFA_VERIFIED_KEY, 'true');
    setUser(userData);
    setIsLoading(false); // Set loading to false after login
    
    // Start session timeout monitoring
    startSessionTimeoutMonitoring(tokenPair.accessToken, tokenPair.refreshToken);
    
    return { requiresMfa: false };
  };

  const verifyMfa = async (code: string, type: 'totp' | 'email' | 'backup' = 'email'): Promise<boolean> => {
    if (!user) {
      return false;
    }

    // Note: Rate limiting for MFA verification could be added here
    // For now, we rely on OTP expiry (120 seconds) as the primary protection

    let isValid = false;

    if (type === 'backup') {
      // Verify backup code
      isValid = await api.verifyBackupCode(user.id, code);
    } else if (type === 'totp') {
      // Verify TOTP code
      const mfaSecret = await api.getMfaSecret(user.id);
      if (!mfaSecret) {
        return false;
      }
      isValid = verifyTotp(code, mfaSecret);
    } else {
      // Verify Email OTP code (expiry is checked in verifyOtpCode - 120 seconds)
      isValid = await api.verifyOtpCode(user.id, code, 'email');
    }
    
    if (isValid) {
      setMfaVerified(true);
      sessionStorage.setItem(SESSION_MFA_VERIFIED_KEY, 'true');
      setIsLoading(false); // Set loading to false after MFA verification
      const { ipAddress, userAgent } = await getClientInfo();
      await api.createAuditLog(user.id, `MFA verified (${type})`, ipAddress, userAgent);
      
      // Generate new tokens after MFA verification
      const tokenPair = await generateTokenPair(user.id, user.email, user.role);
      const storedAccessToken = sessionStorage.getItem(SESSION_ACCESS_TOKEN_KEY);
      
      // Update session in database
      if (storedAccessToken) {
        await api.deleteSession(storedAccessToken);
      }
      
      await api.createSession(
        user.id,
        tokenPair.accessToken,
        tokenPair.refreshToken,
        tokenPair.expiresAt,
        null,
        userAgent
      );
      
      sessionStorage.setItem(SESSION_ACCESS_TOKEN_KEY, tokenPair.accessToken);
      sessionStorage.setItem(SESSION_REFRESH_TOKEN_KEY, tokenPair.refreshToken);
      
      // Start session timeout monitoring
      startSessionTimeoutMonitoring(tokenPair.accessToken, tokenPair.refreshToken);
      
      return true;
    }

    return false;
  };

  /**
   * Send email verification OTP for registration
   */
  const sendRegistrationOtp = async (email: string, password: string): Promise<boolean> => {
    // Check if user already exists
    const existingUser = await api.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password using bcrypt
    const passwordHash = await hashPassword(password);
    
    // Generate OTP code
    const code = generateEmailOtp();
    
    // Set expiry to 2 minutes (120 seconds)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 120);

    // Store OTP with password hash temporarily
    await api.createEmailVerificationOtp(email, code, passwordHash, expiresAt);

    // Send email
    const sent = await sendEmailOtp(email, code, {
      subject: 'Verify Your Email - SecureAuth Registration',
    });
    
    return sent;
  };

  /**
   * Verify email OTP and create user account
   */
  const verifyRegistrationOtp = async (email: string, code: string): Promise<void> => {
    // Verify OTP and get password hash
    const verification = await api.verifyEmailVerificationOtp(email, code);
    
    if (!verification) {
      throw new Error('Invalid or expired verification code');
    }

    const { ipAddress, userAgent } = await getClientInfo();
    
    try {
      // Create user account
      const newUser = await api.createUser(email, verification.passwordHash, 'StandardUser');
      
      // Create audit log for registration
      await api.createAuditLog(newUser.id, 'User registration', ipAddress, userAgent);
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed. Please try again.');
    }
  };

  const setupTotp = async (): Promise<{ secret: string; qrCode: string; uri: string }> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const secret = generateTotpSecret(user.email);
    const uri = generateTotpUri(user.email, secret);
    const qrCode = await generateQRCode(uri);

    return { secret, qrCode, uri };
  };

  const setupEmailOtp = async (): Promise<boolean> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Generate OTP code
    const code = generateEmailOtp();
    
    // Set expiry to 2 minutes (120 seconds)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 120);

    // Store OTP in database
    await api.createOtpCode(user.id, code, 'email', expiresAt);

    // Send email
    const sent = await sendEmailOtp(user.email, code);
    
    if (sent) {
      const { ipAddress, userAgent } = await getClientInfo();
      await api.createAuditLog(user.id, 'Email OTP sent', ipAddress, userAgent);
    }

    return sent;
  };

  const verifyTotpSetup = async (code: string, secret: string): Promise<boolean> => {
    if (!user) {
      return false;
    }

    // Verify the code matches the secret
    const isValid = verifyTotp(code, secret);
    
    if (isValid) {
      // Store the secret in database
      await api.updateUserMfa(user.id, true, secret);
      
      const updatedUser = { ...user, mfaEnabled: true };
      setUser(updatedUser);
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
      
      const { ipAddress, userAgent } = await getClientInfo();
      await api.createAuditLog(user.id, 'TOTP MFA enabled', ipAddress, userAgent);
      return true;
    }

    return false;
  };

  const verifyEmailOtpSetup = async (code: string): Promise<boolean> => {
    if (!user) {
      return false;
    }

    // Verify OTP code
    const isValid = await api.verifyOtpCode(user.id, code, 'email');
    
    if (isValid) {
      // Enable email OTP MFA
      await api.updateUserMfa(user.id, true);
      
      const updatedUser = { ...user, mfaEnabled: true };
      setUser(updatedUser);
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
      
      const { ipAddress, userAgent } = await getClientInfo();
      await api.createAuditLog(user.id, 'Email OTP MFA enabled', ipAddress, userAgent);
      return true;
    }

    return false;
  };

  const enableMfa = async () => {
    if (!user) return;

    try {
      // This is a legacy method - use setupTotp or setupEmailOtp instead
      await api.updateUserMfa(user.id, true);
      
      const updatedUser = { ...user, mfaEnabled: true };
      setUser(updatedUser);
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
      
      const { ipAddress, userAgent } = await getClientInfo();
      await api.createAuditLog(user.id, 'MFA enabled', ipAddress, userAgent);
    } catch (error) {
      throw new Error('Failed to enable MFA');
    }
  };

  const disableMfa = async () => {
    if (!user) return;

    try {
      // Disable MFA - updateUserMfa will clear both TOTP and email OTP flags
      await api.updateUserMfa(user.id, false, null);
      
      const updatedUser = { ...user, mfaEnabled: false };
      setUser(updatedUser);
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
      
      const { ipAddress, userAgent } = await getClientInfo();
      await api.createAuditLog(user.id, 'MFA disabled', ipAddress, userAgent);
    } catch (error) {
      throw new Error('Failed to disable MFA');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && mfaVerified,
        mfaVerified,
        isLoading,
        login,
        verifyMfa,
        logout,
        sendRegistrationOtp,
        verifyRegistrationOtp,
        enableMfa,
        disableMfa,
        setupTotp,
        setupEmailOtp,
        verifyTotpSetup,
        verifyEmailOtpSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
