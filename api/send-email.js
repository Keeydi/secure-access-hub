/**
 * Vercel Serverless Function for Email Sending
 * 
 * This function handles email sending via SendGrid API.
 * Deploy this along with your frontend to Vercel.
 * 
 * Environment Variables Required (set in Vercel dashboard):
 * - SENDGRID_API_KEY: Your SendGrid API key
 * - SENDGRID_FROM_EMAIL: Sender email (e.g., noreply@yourdomain.com)
 * 
 * Note: Make sure '@sendgrid/mail' package is installed in your project dependencies
 */

import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
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

    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SENDGRID_API_KEY is not configured');
      return res.status(500).json({ 
        error: 'Email service not configured',
        message: 'SENDGRID_API_KEY environment variable is missing'
      });
    }

    // Get from email - SendGrid accepts email or "Name <email@example.com>"
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@sendgrid.net';

    // Send email via SendGrid
    const msg = {
      to,
      from: fromEmail,
      subject,
      html,
    };

    try {
      await sgMail.send(msg);
      
      return res.status(200).json({ 
        success: true,
        message: 'Email sent successfully'
      });
    } catch (error) {
      console.error('SendGrid API error:', error);
      
      // SendGrid error handling
      let errorMessage = 'Failed to send email';
      if (error.response) {
        errorMessage = error.response.body?.errors?.[0]?.message || errorMessage;
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
