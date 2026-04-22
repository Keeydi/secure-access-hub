/**
 * Vercel serverless: proxy SkySMS OTP send (same behavior as server/index.js).
 * Env: SKYSMS_API_KEY, optional SKYSMS_API_BASE_URL
 */

function skysmsBaseUrl() {
  return (process.env.SKYSMS_API_BASE_URL || 'https://skysms.skyio.site').replace(/\/$/, '');
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
    if (!apiKey) {
      return res.status(503).json({ error: 'SKYSMS_API_KEY is not configured' });
    }

    const url = `${skysmsBaseUrl()}/api/v1/otp/send`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(data);
  } catch (e) {
    console.error('SkySMS proxy send:', e);
    return res.status(500).json({ error: 'SkySMS proxy failed', message: e.message });
  }
}
