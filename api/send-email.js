/**
 * Vercel Serverless Function for Email Sending
 * 
 * Supports multiple email sending methods:
 * 1. SMTP (Direct - Custom email server)
 * 2. Resend API (Third-party service)
 * 
 * Environment Variables (set in Vercel dashboard):
 * 
 * For SMTP (Custom):
 * - EMAIL_SERVICE=smtp
 * - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com, smtp.office365.com)
 * - SMTP_PORT: SMTP server port (usually 587 for TLS, 465 for SSL)
 * - SMTP_SECURE: Use SSL (true for port 465, false for port 587)
 * - SMTP_USER: SMTP username (usually your email address)
 * - SMTP_PASS: SMTP password (or app-specific password)
 * - SMTP_FROM_EMAIL: Sender email address
 * - SMTP_FROM_NAME: Sender name (optional, defaults to "SecureAuth")
 * 
 * For Resend API:
 * - EMAIL_SERVICE=resend
 * - RESEND_API_KEY: Your Resend API key (starts with re_)
 * - RESEND_FROM_EMAIL: Sender email address (optional)
 * 
 * Note: Make sure required packages are installed (nodemailer for SMTP, resend for Resend)
 */

import nodemailer from 'nodemailer';
import { Resend } from 'resend';

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
// Resend API Configuration
// ============================================

let resendClient = null;

function getResendClient() {
  if (resendClient) {
    return resendClient;
  }

  // Validate required environment variable
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY environment variable is missing');
  }

  // Validate API key format
  if (!resendApiKey.startsWith('re_')) {
    throw new Error('Invalid RESEND_API_KEY format. It should start with "re_"');
  }

  console.log('Initializing Resend client with API key:', resendApiKey.substring(0, 10) + '...');
  
  resendClient = new Resend(resendApiKey);
  return resendClient;
}

// ============================================
// Email Sending Functions
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

async function sendViaResend(to, subject, html, text) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'SecureAuth <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject: subject,
    html: html,
    text: text || html.replace(/<[^>]*>/g, ''),
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }

  return {
    success: true,
    id: data?.id,
    message: 'Email sent successfully via Resend'
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

    // Determine which email service to use
    const emailService = (process.env.EMAIL_SERVICE || 'smtp').toLowerCase();

    let result;
    let errorMessage;

    try {
      if (emailService === 'resend') {
        result = await sendViaResend(to, subject, html, text);
      } else if (emailService === 'smtp') {
        result = await sendViaSMTP(to, subject, html, text);
      } else {
        return res.status(400).json({
          error: 'Invalid email service',
          message: `EMAIL_SERVICE must be either 'smtp' or 'resend'. Current value: ${emailService}`
        });
      }

      console.log('Email sent successfully:', {
        service: emailService,
        to,
        subject,
        messageId: result.messageId || result.id
      });

      return res.status(200).json(result);

    } catch (error) {
      console.error(`${emailService.toUpperCase()} sending error:`, error);
      
      // Provide helpful error messages
      if (emailService === 'smtp') {
        if (error.code === 'EAUTH') {
          errorMessage = 'SMTP authentication failed. Check your SMTP_USER and SMTP_PASS.';
        } else if (error.code === 'ECONNECTION') {
          errorMessage = 'Could not connect to SMTP server. Check SMTP_HOST and SMTP_PORT.';
        } else {
          errorMessage = error.message || 'Failed to send email via SMTP';
        }
      } else {
        errorMessage = error.message || 'Failed to send email via Resend';
      }
      
      return res.status(500).json({ 
        error: 'Failed to send email',
        message: errorMessage,
        service: emailService
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
