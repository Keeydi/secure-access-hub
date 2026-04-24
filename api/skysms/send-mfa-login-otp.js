/**
 * Vercel: send SkySMS sign-in OTP using phone on file (service role).
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

const MFA_LOGIN_OTP_MESSAGE =
  'SecureAuth sign-in code {{otp}}. Valid 2 minutes. Do not share with anyone.';

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
        message: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for SMS MFA',
      });
    }

    const user_id = (req.body?.user_id || '').toString().trim();
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const selUrl = `${baseUrl}/rest/v1/users?id=eq.${encodeURIComponent(
      user_id
    )}&select=mfa_phone_number,sms_otp_enabled,mfa_enabled`;
    const sel = await fetch(selUrl, { headers: supabaseHeaders() });
    const rows = await sel.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row?.mfa_phone_number || !row.sms_otp_enabled || !row.mfa_enabled) {
      return res.status(400).json({
        success: false,
        message: 'SMS MFA is not enabled for this account',
      });
    }

    const url = `${skysmsBaseUrl()}/api/v1/otp/send`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        phone_number: row.mfa_phone_number,
        message: MFA_LOGIN_OTP_MESSAGE,
        expire: 120,
      }),
    });
    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (e) {
    console.error('send-mfa-login-otp:', e);
    return res.status(500).json({ error: 'SMS send failed', message: e.message });
  }
}
