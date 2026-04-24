/**
 * Vercel: verify SkySMS OTP for MFA sign-in (service role loads phone).
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
    const otp = (req.body?.otp || '').toString().trim();
    if (!user_id || !otp) {
      return res.status(400).json({ error: 'user_id and otp are required' });
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

    const verifyUrl = `${skysmsBaseUrl()}/api/v1/otp/verify?otp=${encodeURIComponent(
      otp
    )}&phone_number=${encodeURIComponent(row.mfa_phone_number)}`;
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

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error('verify-mfa-login:', e);
    return res.status(500).json({ success: false, message: e.message || 'Verification failed' });
  }
}
