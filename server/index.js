/**
 * Local API: SMTP email + SkySMS OTP proxy (keeps API keys off the browser).
 * SkySMS: https://skysms.skyio.site — POST /api/v1/otp/send, GET /api/v1/otp/verify
 *
 * server/.env — see server/.env.example
 */

import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const defaultCors =
  process.env.CORS_ORIGINS ||
  'http://localhost:8080,http://localhost:5173,http://localhost:3000';
const corsOrigins = defaultCors.split(',').map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json());

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

// SMTP (lazy; only required when /api/send-email is used)
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  const smtpHost = process.env.SMTP_HOST.trim();
  const smtpPort = parseInt(process.env.SMTP_PORT.trim(), 10);
  const smtpSecure =
    (process.env.SMTP_SECURE || 'false').trim() === 'true' || smtpPort === 465;
  const smtpUser = process.env.SMTP_USER.trim();
  const smtpPass = process.env.SMTP_PASS.trim();

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: smtpUser, pass: smtpPass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
  return transporter;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'secure-access-hub-api' });
});

app.post('/api/send-email', async (req, res) => {
  try {
    const smtpTransporter = getTransporter();
    if (!smtpTransporter) {
      return res.status(503).json({
        error: 'SMTP not configured',
        message: 'Set SMTP_* variables to enable /api/send-email',
      });
    }

    const { to, subject, html, text } = req.body;
    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['to', 'subject', 'html'],
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'SecureAuth';
    const from = `${fromName} <${fromEmail}>`;

    const info = await smtpTransporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });

    res.json({
      success: true,
      messageId: info.messageId,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('SMTP sending error:', error);
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Check SMTP_USER and SMTP_PASS.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to SMTP server. Check SMTP_HOST and SMTP_PORT.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    res.status(500).json({ error: 'Failed to send email', message: errorMessage });
  }
});

app.post('/api/skysms/otp/send', async (req, res) => {
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
    res.status(upstream.status).json(data);
  } catch (e) {
    console.error('SkySMS proxy send error:', e);
    res.status(500).json({ error: 'SkySMS proxy failed', message: e.message });
  }
});

app.post('/api/skysms/verify-registration', async (req, res) => {
  try {
    const apiKey = process.env.SKYSMS_API_KEY;
    const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    if (!apiKey) {
      return res.status(503).json({ error: 'SKYSMS_API_KEY is not configured' });
    }
    if (!baseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(503).json({
        error: 'Supabase service credentials missing',
        message: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for SMS registration verify',
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

    const sel = await fetch(selUrl, {
      headers: supabaseHeaders(),
    });
    const rows = await sel.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row?.password_hash) {
      return res.status(400).json({ success: false, message: 'No pending registration for this email and phone' });
    }

    const expiresAt = new Date(row.expires_at);
    if (expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Registration code expired' });
    }

    const patch = await fetch(
      `${baseUrl}/rest/v1/email_verification_otps?id=eq.${row.id}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders(), Prefer: 'return=minimal' },
        body: JSON.stringify({ used: true }),
      }
    );
    if (!patch.ok) {
      const t = await patch.text();
      console.error('Supabase patch failed:', t);
      return res.status(500).json({ success: false, message: 'Failed to finalize registration' });
    }

    res.json({ success: true, passwordHash: row.password_hash });
  } catch (e) {
    console.error('verify-registration error:', e);
    res.status(500).json({ success: false, message: e.message || 'Verification failed' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 API server: http://localhost:${PORT}`);
  console.log(`   POST /api/send-email  (SMTP, optional)`);
  console.log(`   POST /api/skysms/otp/send`);
  console.log(`   POST /api/skysms/verify-registration\n`);
});
