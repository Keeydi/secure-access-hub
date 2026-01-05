/**
 * Email API Server
 * 
 * This is a simple Express server that handles email sending via SMTP.
 * Run this server to enable real email sending from your frontend in development.
 * 
 * Setup:
 * 1. npm install
 * 2. Create .env file with SMTP configuration:
 *    SMTP_HOST=smtp.gmail.com
 *    SMTP_PORT=587
 *    SMTP_SECURE=false
 *    SMTP_USER=your-email@gmail.com
 *    SMTP_PASS=your-app-password
 *    SMTP_FROM_EMAIL=your-email@gmail.com
 *    SMTP_FROM_NAME=SecureAuth
 * 3. npm start
 */

import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Initialize SMTP transporter
let transporter = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  // Validate required environment variables
  if (!process.env.SMTP_HOST) {
    console.error('⚠️  SMTP_HOST not found in environment variables!');
    process.exit(1);
  }
  if (!process.env.SMTP_PORT) {
    console.error('⚠️  SMTP_PORT not found in environment variables!');
    process.exit(1);
  }
  if (!process.env.SMTP_USER) {
    console.error('⚠️  SMTP_USER not found in environment variables!');
    process.exit(1);
  }
  if (!process.env.SMTP_PASS) {
    console.error('⚠️  SMTP_PASS not found in environment variables!');
    process.exit(1);
  }

  const smtpHost = process.env.SMTP_HOST.trim();
  const smtpPort = parseInt(process.env.SMTP_PORT.trim(), 10);
  const smtpSecure = (process.env.SMTP_SECURE || 'false').trim() === 'true' || smtpPort === 465;
  const smtpUser = process.env.SMTP_USER.trim();
  const smtpPass = process.env.SMTP_PASS.trim();

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  return transporter;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'email-api-smtp' });
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    // Validation
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['to', 'subject', 'html']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Get transporter
    const smtpTransporter = getTransporter();
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'SecureAuth';
    const from = `${fromName} <${fromEmail}>`;

    // Send email using SMTP
    const info = await smtpTransporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
    });

    console.log(`✅ Email sent successfully to ${to} (ID: ${info.messageId})`);
    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('SMTP sending error:', error);
    
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Check your SMTP_USER and SMTP_PASS.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to SMTP server. Check SMTP_HOST and SMTP_PORT.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      error: 'Failed to send email',
      message: errorMessage
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Email API server running on http://localhost:${PORT}`);
  console.log(`📧 Ready to send emails via SMTP\n`);
  console.log(`⚠️  Make sure your frontend .env has:`);
  console.log(`   VITE_EMAIL_SERVICE=smtp`);
  console.log(`   VITE_EMAIL_API_ENDPOINT=http://localhost:${PORT}/api/send-email\n`);
});
