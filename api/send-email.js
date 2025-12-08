/**
 * Vercel Serverless Function for Email Sending
 * 
 * This function handles email sending via SMTP (custom email service).
 * You can use any SMTP provider: Gmail, Outlook, custom SMTP server, etc.
 * 
 * Environment Variables Required (set in Vercel dashboard):
 * - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com, smtp.office365.com)
 * - SMTP_PORT: SMTP server port (usually 587 for TLS, 465 for SSL)
 * - SMTP_SECURE: Use SSL (true for port 465, false for port 587)
 * - SMTP_USER: SMTP username (usually your email address)
 * - SMTP_PASS: SMTP password (or app-specific password)
 * - SMTP_FROM_EMAIL: Sender email address
 * - SMTP_FROM_NAME: Sender name (optional, defaults to "Secure Access Hub")
 * 
 * Note: Make sure 'nodemailer' package is installed
 */

import nodemailer from 'nodemailer';

// Create reusable transporter (will be initialized on first use)
let transporter = null;

function getTransporter() {
  if (transporter) {
    return transporter;
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

  // Create transporter
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Additional options for better compatibility
    tls: {
      rejectUnauthorized: false, // For self-signed certificates
    },
  });

  return transporter;
}

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

    // Get transporter
    let smtpTransporter;
    try {
      smtpTransporter = getTransporter();
    } catch (error) {
      console.error('SMTP configuration error:', error);
      return res.status(500).json({ 
        error: 'Email service not configured',
        message: error.message || 'SMTP configuration is missing or invalid'
      });
    }

    // Get from email and name
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'Secure Access Hub';
    const from = `${fromName} <${fromEmail}>`;

    // Send email via SMTP
    try {
      const info = await smtpTransporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      });

      console.log('Email sent successfully:', {
        messageId: info.messageId,
        to,
        subject,
      });

      return res.status(200).json({ 
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully'
      });
    } catch (error) {
      console.error('SMTP sending error:', error);
      
      // Provide helpful error messages
      let errorMessage = 'Failed to send email';
      if (error.code === 'EAUTH') {
        errorMessage = 'SMTP authentication failed. Check your SMTP_USER and SMTP_PASS.';
      } else if (error.code === 'ECONNECTION') {
        errorMessage = 'Could not connect to SMTP server. Check SMTP_HOST and SMTP_PORT.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return res.status(400).json({ 
        error: 'Failed to send email',
        message: errorMessage
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
