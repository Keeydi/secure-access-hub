/**
 * Vercel: verify SkySMS OTP then persist SMS MFA on user (service role).
 * Env: SKYSMS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, optional SKYSMS_API_BASE_URL
 */

function skysmsBaseUrl() {
  return (process.env.SKYSMS_API_BASE_URL || 'https://skysms.skyio.site').replace(/\/$/, '');
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.SKYSMS_API_KEY;
    const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    if (!apiKey) {
      return res.status(503).json({ error: 'SKYSMS_API_KEY is not configured' });
    }
    if (!baseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(503).json({
        error: 'Supabase service credentials missing',
        message: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
      });
    }

    const user_id = (req.body?.user_id || '').toString().trim();
    const phone_number = (req.body?.phone_number || '').toString().trim();
    const otp = (req.body?.otp || '').toString().trim();
    if (!user_id || !phone_number || !otp) {
      return res.status(400).json({ error: 'user_id, phone_number, and otp are required' });
    }

    const verifyUrl = `${skysmsBaseUrl()}/api/v1/otp/verify?otp=${encodeURIComponent(
      otp
    )}&phone_number=${encodeURIComponent(phone_number)}`;
    const skyRes = await fetch(verifyUrl, {
      method: 'GET',
      headers: { 'X-API-Key': apiKey },
    });
    const skyData = await skyRes.json().catch(() => ({}));
    if (!skyRes.ok || skyData?.success === false || skyData?.valid === false) {
      return res.status(400).json({
        success: false,
        message: skyData?.message || skyData?.error || 'Invalid or expired SMS code',
      });
    }

    const patch = await fetch(`${baseUrl}/rest/v1/users?id=eq.${encodeURIComponent(user_id)}`, {
      method: 'PATCH',
      headers: { ...supabaseHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({
        mfa_enabled: true,
        sms_otp_enabled: true,
        mfa_phone_number: phone_number,
        totp_enabled: false,
        email_otp_enabled: false,
        mfa_secret: null,
        updated_at: new Date().toISOString(),
      }),
    });
    if (!patch.ok) {
      const t = await patch.text();
      console.error('verify-mfa-setup Supabase patch:', t);
      return res.status(500).json({ success: false, message: 'Failed to save SMS MFA' });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('verify-mfa-setup:', e);
    return res.status(500).json({ success: false, message: e.message || 'Verification failed' });
  }
}
