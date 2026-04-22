/**
 * Proxy SkySMS OTP send/verify through the local API server (keeps X-API-Key off the client).
 * Docs: https://skysms.skyio.site — POST /api/v1/otp/send, GET /api/v1/otp/verify
 */

/**
 * Same host as `VITE_EMAIL_API_ENDPOINT` (email uses `/api/send-email`).
 * Mirrors `email-otp.ts`: in production, localhost in env is ignored so Vercel can use same-origin `/api/*`.
 */
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

const DEFAULT_OTP_MESSAGE =
  'SecureAuth signup code {{otp}}. Valid 2 minutes. Do not share with anyone.';

export async function sendSkysmsRegistrationOtp(
  phoneNumber: string,
  expireSeconds: number = 120
): Promise<void> {
  const base = getLocalApiOrigin();
  if (!base) {
    throw new Error('Set VITE_EMAIL_API_ENDPOINT to your API server URL (same host as SkySMS proxy).');
  }

  const url = `${base}/api/skysms/otp/send`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: phoneNumber,
      message: DEFAULT_OTP_MESSAGE,
      expire: expireSeconds,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.message || data.error || `SkySMS send failed (${res.status})`);
  }
  if (data.success === false) {
    throw new Error(data.message || data.error || 'SkySMS send failed');
  }
}

export async function verifySkysmsRegistration(
  email: string,
  phoneNumber: string,
  otp: string
): Promise<{ passwordHash: string } | null> {
  const base = getLocalApiOrigin();
  if (!base) {
    throw new Error('Set VITE_EMAIL_API_ENDPOINT to your API server URL.');
  }

  const url = `${base}/api/skysms/verify-registration`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      phone_number: phoneNumber,
      otp: otp.trim(),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    passwordHash?: string;
    message?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.message || data.error || `Verification failed (${res.status})`);
  }
  if (!data.success || !data.passwordHash) {
    return null;
  }
  return { passwordHash: data.passwordHash };
}
