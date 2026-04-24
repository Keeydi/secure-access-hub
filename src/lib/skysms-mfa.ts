import { sendSkysmsOtp } from '@/lib/skysms-registration';

const MFA_SETUP_OTP_MESSAGE =
  'SecureAuth MFA setup code {{otp}}. Valid 2 minutes. Do not share with anyone.';

function getLocalApiOrigin(): string {
  const emailEp = import.meta.env.VITE_EMAIL_API_ENDPOINT as string | undefined;

  if (import.meta.env.PROD && emailEp?.includes('localhost')) {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
  }

  if (emailEp?.includes('/api/send-email')) {
    const withoutPath = emailEp.replace(/\/api\/send-email\/?$/, '');
    if (withoutPath.startsWith('http://') || withoutPath.startsWith('https://')) {
      return withoutPath;
    }
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
  }

  if (emailEp) {
    try {
      return new URL(emailEp).origin;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

export async function sendSkysmsMfaSetupOtp(phoneNumber: string): Promise<void> {
  return sendSkysmsOtp(phoneNumber, MFA_SETUP_OTP_MESSAGE, 120);
}

export async function sendSkysmsMfaLoginOtpByUserId(userId: string): Promise<void> {
  const base = getLocalApiOrigin();
  if (!base) {
    throw new Error('Set VITE_EMAIL_API_ENDPOINT to your API server URL (same host as SkySMS proxy).');
  }

  const url = `${base}/api/skysms/send-mfa-login-otp`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });

  const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.message || data.error || `SMS send failed (${res.status})`);
  }
  if (data.success === false) {
    throw new Error(data.message || data.error || 'SMS send failed');
  }
}

export async function verifySkysmsMfaLogin(userId: string, otp: string): Promise<boolean> {
  const base = getLocalApiOrigin();
  if (!base) {
    throw new Error('Set VITE_EMAIL_API_ENDPOINT to your API server URL.');
  }

  const url = `${base}/api/skysms/verify-mfa-login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, otp: otp.trim() }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.message || data.error || `Verification failed (${res.status})`);
  }
  return data.success === true;
}

export async function verifySkysmsMfaSetup(
  userId: string,
  phoneNumber: string,
  otp: string
): Promise<boolean> {
  const base = getLocalApiOrigin();
  if (!base) {
    throw new Error('Set VITE_EMAIL_API_ENDPOINT to your API server URL.');
  }

  const url = `${base}/api/skysms/verify-mfa-setup`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      phone_number: phoneNumber.trim(),
      otp: otp.trim(),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    message?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.message || data.error || `Verification failed (${res.status})`);
  }
  return data.success === true;
}
