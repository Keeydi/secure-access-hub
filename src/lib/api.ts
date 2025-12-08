import { supabase } from './supabase';
import type { UserRole } from '@/contexts/AuthContext';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  mfaEnabled: boolean;
  createdAt: string;
}

export interface LoginResult {
  requiresMfa: boolean;
  user: User;
}

export interface SessionData {
  token: string;
  refreshToken: string | null;
  expiresAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  ip: string;
  time: string;
  userAgent: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditLogRow {
  id: string;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  user_id: string | null;
  users: { email: string } | null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, mfa_enabled, created_at')
    .eq('email', normalizedEmail)
    .maybeSingle(); // Use maybeSingle() instead of single() - returns null instead of error when no rows

  if (error) {
    console.error('Error fetching user by email:', error);
    // Check for RLS policy error
    if (error.code === '42501') {
      console.error('RLS Policy Error: User read blocked. Please run the RLS fix SQL in Supabase.');
    }
    // For other errors, return null (user doesn't exist or can't be accessed)
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    mfaEnabled: data.mfa_enabled,
    createdAt: data.created_at,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, mfa_enabled, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    mfaEnabled: data.mfa_enabled,
    createdAt: data.created_at,
  };
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  passwordHash: string,
  role: UserRole = 'StandardUser'
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role,
      mfa_enabled: false,
      totp_enabled: false,
      email_otp_enabled: false,
    })
    .select('id, email, role, mfa_enabled, created_at')
    .single();

  if (error) {
    console.error('Error creating user:', error);
    // Check for duplicate email
    if (error.code === '23505') {
      throw new Error('User with this email already exists');
    }
    // Check for RLS policy error
    if (error.code === '42501') {
      throw new Error(
        'RLS Policy Error: User creation blocked. Please run the RLS fix SQL in Supabase. See RLS_FIX_INSTRUCTIONS.md'
      );
    }
    throw new Error(`Failed to create user: ${error.message} (Code: ${error.code || 'unknown'})`);
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    mfaEnabled: data.mfa_enabled,
    createdAt: data.created_at,
  };
}

/**
 * Get password hash for a user
 */
export async function getPasswordHash(email: string): Promise<string | null> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const { data, error } = await supabase
    .from('users')
    .select('password_hash')
    .eq('email', normalizedEmail)
    .maybeSingle(); // Use maybeSingle() instead of single()

  if (error || !data) {
    return null;
  }

  return data.password_hash;
}

/**
 * Update user MFA status
 */
export async function updateUserMfa(
  userId: string,
  mfaEnabled: boolean,
  mfaSecret?: string | null
): Promise<void> {
  const updateData: {
    mfa_enabled: boolean;
    mfa_secret?: string | null;
    totp_enabled?: boolean;
    email_otp_enabled?: boolean;
    updated_at: string;
  } = {
    mfa_enabled: mfaEnabled,
    updated_at: new Date().toISOString(),
  };

  if (mfaSecret !== undefined) {
    updateData.mfa_secret = mfaSecret;
    updateData.totp_enabled = mfaEnabled;
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update MFA: ${error.message}`);
  }
}

/**
 * Create a session
 */
export async function createSession(
  userId: string,
  token: string,
  refreshToken: string | null,
  expiresAt: Date,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  const { error } = await supabase.from('sessions').insert({
    user_id: userId,
    token,
    refresh_token: refreshToken,
    expires_at: expiresAt.toISOString(),
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (error) {
    console.error('Error creating session:', error);
    // Check for RLS policy error
    if (error.code === '42501') {
      throw new Error(
        'RLS Policy Error: Session creation blocked. Please run the RLS fix SQL in Supabase. See RLS_FIX_INSTRUCTIONS.md'
      );
    }
    throw new Error(`Failed to create session: ${error.message} (Code: ${error.code || 'unknown'})`);
  }
}

/**
 * Delete a session
 */
export async function deleteSession(token: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('token', token);

  if (error) {
    throw new Error(`Failed to delete session: ${error.message}`);
  }
}

/**
 * Get user's MFA secret
 */
export async function getMfaSecret(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('mfa_secret')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.mfa_secret;
}

/**
 * Create an OTP code
 */
export async function createOtpCode(
  userId: string,
  code: string,
  type: 'email' | 'totp',
  expiresAt: Date
): Promise<void> {
  const { error } = await supabase.from('otp_codes').insert({
    user_id: userId,
    code,
    type,
    expires_at: expiresAt.toISOString(),
    used: false,
  });

  if (error) {
    throw new Error(`Failed to create OTP code: ${error.message}`);
  }
}

/**
 * Verify and mark OTP code as used
 */
export async function verifyOtpCode(
  userId: string,
  code: string,
  type: 'email' | 'totp'
): Promise<boolean> {
  const { data, error } = await supabase
    .from('otp_codes')
    .select('id, expires_at, used')
    .eq('user_id', userId)
    .eq('code', code)
    .eq('type', type)
    .eq('used', false)
    .single();

  if (error || !data) {
    return false;
  }

  // Check if expired
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    return false;
  }

  // Mark as used
  const { error: updateError } = await supabase
    .from('otp_codes')
    .update({ used: true })
    .eq('id', data.id);

  if (updateError) {
    return false;
  }

  return true;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
  userId: string | null,
  action: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    ip_address: ipAddress,
    user_agent: userAgent,
    details,
  });

  if (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging failures shouldn't break the app
    // But log RLS errors for debugging
    if (error.code === '42501') {
      console.warn('RLS Policy Error: Audit log creation blocked. Please run the RLS fix SQL.');
    }
  }
}

/**
 * Get audit logs with user email
 */
export async function getAuditLogs(limit: number = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      action,
      ip_address,
      user_agent,
      details,
      created_at,
      user_id,
      users(email)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get audit logs: ${error.message}`);
  }

  // Format the data for easier use
  return data.map((log: AuditLogRow): AuditLog => ({
    id: log.id,
    action: log.action,
    user: log.users?.email || (log.user_id ? 'User ID: ' + log.user_id.substring(0, 8) : 'System'),
    ip: log.ip_address || 'N/A',
    time: formatTimeAgo(new Date(log.created_at)),
    userAgent: log.user_agent,
    details: log.details,
    createdAt: log.created_at,
  }));
}

/**
 * Format time ago (e.g., "2 min ago", "1 hour ago")
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
}

/**
 * Create backup codes
 */
export async function createBackupCodes(
  userId: string,
  codes: string[]
): Promise<void> {
  const backupCodes = codes.map((code) => ({
    user_id: userId,
    code,
    used: false,
  }));

  const { error } = await supabase.from('backup_codes').insert(backupCodes);

  if (error) {
    throw new Error(`Failed to create backup codes: ${error.message}`);
  }
}

/**
 * Generate and store backup codes for a user
 */
export async function generateBackupCodes(userId: string): Promise<string[]> {
  // Generate 8 backup codes
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    // Generate a random code: XXXX-XXXX-XXXX format
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${part1}-${part2}-${part3}`;
    codes.push(code);
  }

  // Store codes in database
  const backupCodes = codes.map((code) => ({
    user_id: userId,
    code,
    used: false,
  }));

  const { error } = await supabase.from('backup_codes').insert(backupCodes);

  if (error) {
    throw new Error(`Failed to generate backup codes: ${error.message}`);
  }

  return codes;
}

/**
 * Get backup codes for a user
 */
export async function getBackupCodes(userId: string) {
  const { data, error } = await supabase
    .from('backup_codes')
    .select('id, code, used, created_at')
    .eq('user_id', userId)
    .eq('used', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get backup codes: ${error.message}`);
  }

  return data;
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('backup_codes')
    .select('id')
    .eq('user_id', userId)
    .eq('code', code)
    .eq('used', false)
    .single();

  if (error || !data) {
    return false;
  }

  // Mark as used
  const { error: updateError } = await supabase
    .from('backup_codes')
    .update({ used: true })
    .eq('id', data.id);

  if (updateError) {
    return false;
  }

  return true;
}

/**
 * Record failed login attempt
 */
export async function recordFailedLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string | null
): Promise<void> {
  const { error } = await supabase.from('failed_login_attempts').insert({
    email: email.toLowerCase(),
    ip_address: ipAddress,
    success,
  });

  if (error) {
    console.error('Failed to record login attempt:', error);
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * Get failed login attempts count for rate limiting
 */
export async function getFailedLoginAttemptsCount(
  email: string,
  since: Date
): Promise<number> {
  const { count, error } = await supabase
    .from('failed_login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('email', email.toLowerCase())
    .eq('success', false)
    .gte('attempted_at', since.toISOString());

  if (error) {
    return 0;
  }

  return count || 0;
}

/**
 * Get all users (for admin panel)
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, mfa_enabled, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get users: ${error.message}`);
  }

  return data.map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    mfaEnabled: user.mfa_enabled,
    createdAt: user.created_at,
  }));
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`);
  }
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * Generate and store password reset token
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  // Generate a secure random token
  const token = crypto.randomUUID() + '-' + Date.now().toString(36);
  
  // Set expiry to 1 hour
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  const { error } = await supabase.from('password_reset_tokens').insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
    used: false,
  });

  if (error) {
    throw new Error(`Failed to create password reset token: ${error.message}`);
  }

  return token;
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{
  valid: boolean;
  userId: string | null;
}> {
  const { data, error } = await supabase
    .from('password_reset_tokens')
    .select('user_id, expires_at, used')
    .eq('token', token)
    .eq('used', false)
    .single();

  if (error || !data) {
    return { valid: false, userId: null };
  }

  // Check if expired
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    return { valid: false, userId: null };
  }

  return { valid: true, userId: data.user_id };
}

/**
 * Mark password reset token as used
 */
export async function markPasswordResetTokenAsUsed(token: string): Promise<void> {
  const { error } = await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('token', token);

  if (error) {
    throw new Error(`Failed to mark token as used: ${error.message}`);
  }
}

/**
 * Create email verification OTP (for registration)
 */
export async function createEmailVerificationOtp(
  email: string,
  code: string,
  passwordHash: string,
  expiresAt: Date
): Promise<void> {
  const { error } = await supabase.from('email_verification_otps').insert({
    email: email.toLowerCase().trim(),
    code,
    password_hash: passwordHash,
    expires_at: expiresAt.toISOString(),
    used: false,
  });

  if (error) {
    throw new Error(`Failed to create email verification OTP: ${error.message}`);
  }
}

/**
 * Verify email verification OTP and get stored password hash
 */
export async function verifyEmailVerificationOtp(
  email: string,
  code: string
): Promise<{ passwordHash: string } | null> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const { data, error } = await supabase
    .from('email_verification_otps')
    .select('id, password_hash, expires_at, used')
    .eq('email', normalizedEmail)
    .eq('code', code)
    .eq('used', false)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // Check if expired
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    return null;
  }

  // Mark as used
  const { error: updateError } = await supabase
    .from('email_verification_otps')
    .update({ used: true })
    .eq('id', data.id);

  if (updateError) {
    console.error('Failed to mark OTP as used:', updateError);
  }

  return {
    passwordHash: data.password_hash,
  };
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: string,
  newPasswordHash: string
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      password_hash: newPasswordHash,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update password: ${error.message}`);
  }
}

