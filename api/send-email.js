/**
 * Vercel Serverless Function for Email Sending via SMTP
 * 
 * This function handles email sending using custom SMTP server.
 * 
 * Environment Variables (set in Vercel dashboard):
 * - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com, smtp.office365.com)
 * - SMTP_PORT: SMTP server port (usually 587 for TLS, 465 for SSL)
 * - SMTP_SECURE: Use SSL (true for port 465, false for port 587)
 * - SMTP_USER: SMTP username (usually your email address)
 * - SMTP_PASS: SMTP password (or app-specific password)
 * - SMTP_FROM_EMAIL: Sender email address
 * - SMTP_FROM_NAME: Sender name (optional, defaults to "SecureAuth")
 * 
 * Note: Make sure 'nodemailer' package is installed
 */

import nodemailer from 'nodemailer';

// ============================================
// SMTP Configuration (Custom Email Server)
// ============================================

let smtpTransporter = null;

function getSmtpTransporter() {
  if (smtpTransporter) {
    return smtpTransporter;
  }

  // Validate required environment variables
  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP_HOST environment variable is missing');
  }
  if (!process.env.SMTP_PORT) {
    throw new Error('SMTP_PORT environment variable is missing');
  }
  if (!process.env.SMTP_USER) {
    throw new Error('SMTP_USER environment variable is missing');
  }
  if (!process.env.SMTP_PASS) {
    throw new Error('SMTP_PASS environment variable is missing');
  }

  // Create transporter with trimmed and validated values
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpPort = parseInt((process.env.SMTP_PORT || '587').trim(), 10);
  const smtpSecure = (process.env.SMTP_SECURE || 'false').trim() === 'true' || smtpPort === 465;
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();

  // Validate hostname
  if (!smtpHost || smtpHost.length === 0) {
    throw new Error('SMTP_HOST is empty or not set');
  }

  // Validate hostname format (basic check)
  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(smtpHost)) {
    throw new Error(`Invalid SMTP_HOST format: ${smtpHost}`);
  }

  console.log('Creating SMTP transporter:', {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    user: smtpUser ? `${smtpUser.substring(0, 3)}***` : 'not set',
  });

  smtpTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // Additional options for better compatibility
    tls: {
      rejectUnauthorized: false, // For self-signed certificates
    },
    // Connection timeout
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  return smtpTransporter;
}

// ============================================
// Email Sending Function
// ============================================

async function sendViaSMTP(to, subject, html, text) {
  const transporter = getSmtpTransporter();
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'SecureAuth';
  const from = `${fromName} <${fromEmail}>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
  });

  return {
    success: true,
    messageId: info.messageId,
    message: 'Email sent successfully via SMTP'
  };
}

// ============================================
// Main Handler
// ============================================

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  // CORS headers for browser requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { to, subject, html, text } = req.body;

    // Validate required fields
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'to, subject, and html are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ 
        error: 'Invalid email address',
        message: 'Please provide a valid email address'
      });
    }

    // Log configuration for debugging
    console.log('Email service configuration:', {
      hasSMTPConfig: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
    });

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return res.status(500).json({
        error: 'SMTP not configured',
        message: 'SMTP environment variables are missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in Vercel dashboard.'
      });
    }

    let result;
    let errorMessage;

    try {
      result = await sendViaSMTP(to, subject, html, text);

      console.log('Email sent successfully:', {
        service: 'smtp',
        to,
        subject,
        messageId: result.messageId
      });

      return res.status(200).json(result);

    } catch (error) {
      console.error('SMTP sending error:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      
      // Provide helpful error messages
      if (error.code === 'EAUTH') {
        errorMessage = 'SMTP authentication failed. Check your SMTP_USER and SMTP_PASS.';
      } else if (error.code === 'ECONNECTION') {
        errorMessage = 'Could not connect to SMTP server. Check SMTP_HOST and SMTP_PORT.';
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Failed to send email via SMTP. Check your SMTP configuration.';
      }
      
      return res.status(500).json({ 
        error: 'Failed to send email',
        message: errorMessage,
        service: 'smtp',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }

  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    });
  }
}
