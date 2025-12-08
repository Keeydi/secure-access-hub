/**
 * Vercel Serverless Function for Email Sending
 * 
 * This function handles email sending via Mailgun API.
 * Deploy this along with your frontend to Vercel.
 * 
 * Environment Variables Required (set in Vercel dashboard):
 * - MAILGUN_API_KEY: Your Mailgun API key
 * - MAILGUN_DOMAIN: Your Mailgun domain (e.g., sandbox123.mailgun.org or your verified domain)
 * - MAILGUN_FROM_EMAIL: Sender email (e.g., noreply@yourdomain.com)
 * 
 * Note: Make sure 'mailgun.js' and 'form-data' packages are installed
 */

import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Initialize Mailgun client
let mg;
if (process.env.MAILGUN_API_KEY) {
  const mailgun = new Mailgun(formData);
  mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
  });
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
    const { to, subject, html } = req.body;

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

    // Check if Mailgun is configured
    if (!process.env.MAILGUN_API_KEY) {
      console.error('MAILGUN_API_KEY is not configured');
      return res.status(500).json({ 
        error: 'Email service not configured',
        message: 'MAILGUN_API_KEY environment variable is missing'
      });
    }

    if (!process.env.MAILGUN_DOMAIN) {
      console.error('MAILGUN_DOMAIN is not configured');
      return res.status(500).json({ 
        error: 'Email service not configured',
        message: 'MAILGUN_DOMAIN environment variable is missing'
      });
    }

    // Initialize Mailgun client if not already initialized
    if (!mg) {
      const mailgun = new Mailgun(formData);
      mg = mailgun.client({
        username: 'api',
        key: process.env.MAILGUN_API_KEY,
      });
    }

    // Get from email - use provided or default
    const fromEmail = process.env.MAILGUN_FROM_EMAIL || `noreply@${process.env.MAILGUN_DOMAIN}`;

    // Send email via Mailgun
    try {
      const messageData = {
        from: fromEmail,
        to: [to],
        subject,
        html,
      };

      // Log for debugging (remove in production)
      console.log('Sending email via Mailgun:', {
        domain: process.env.MAILGUN_DOMAIN,
        from: fromEmail,
        to: to,
        hasApiKey: !!process.env.MAILGUN_API_KEY,
        apiKeyLength: process.env.MAILGUN_API_KEY?.length,
      });

      const response = await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
      
      return res.status(200).json({ 
        success: true,
        id: response.id,
        message: 'Email sent successfully'
      });
    } catch (error) {
      console.error('Mailgun API error:', error);
      
      // Mailgun error handling
      let errorMessage = 'Failed to send email';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
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
