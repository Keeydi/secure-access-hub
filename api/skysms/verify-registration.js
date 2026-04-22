/**
 * Vercel serverless: SkySMS verify + load registration row from Supabase.
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

    const email = (req.body?.email || '').toString().trim().toLowerCase();
    const phone_number = (req.body?.phone_number || '').toString().trim();
    const otp = (req.body?.otp || '').toString().trim();
    if (!email || !phone_number || !otp) {
      return res.status(400).json({ error: 'email, phone_number, and otp are required' });
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

    const selUrl =
      `${baseUrl}/rest/v1/email_verification_otps?select=id,password_hash,expires_at,used` +
      `&email=eq.${encodeURIComponent(email)}` +
      `&phone_number=eq.${encodeURIComponent(phone_number)}` +
      `&otp_delivery=eq.skysms&used=eq.false` +
      `&order=created_at.desc&limit=1`;

    const sel = await fetch(selUrl, { headers: supabaseHeaders() });
    const rows = await sel.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row?.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'No pending registration for this email and phone',
      });
    }

    const expiresAt = new Date(row.expires_at);
    if (expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Registration code expired' });
    }

    const patch = await fetch(`${baseUrl}/rest/v1/email_verification_otps?id=eq.${row.id}`, {
      method: 'PATCH',
      headers: { ...supabaseHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({ used: true }),
    });
    if (!patch.ok) {
      const t = await patch.text();
      console.error('Supabase patch failed:', t);
      return res.status(500).json({ success: false, message: 'Failed to finalize registration' });
    }

    return res.status(200).json({ success: true, passwordHash: row.password_hash });
  } catch (e) {
    console.error('verify-registration:', e);
    return res.status(500).json({ success: false, message: e.message || 'Verification failed' });
  }
}
