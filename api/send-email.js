/**
 * Vercel Serverless Function for Email Sending
 * 
 * This function handles email sending via Resend API.
 * Deploy this along with your frontend to Vercel.
 * 
 * Environment Variables Required (set in Vercel dashboard):
 * - RESEND_API_KEY: Your Resend API key
 * - RESEND_FROM_EMAIL: Sender email (default: SecureAuth <onboarding@resend.dev>)
 * 
 * Note: Make sure 'resend' package is installed in your project dependencies
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return res.status(500).json({ 
        error: 'Email service not configured',
        message: 'RESEND_API_KEY environment variable is missing'
      });
    }

    // Get from email - ensure proper format
    let fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    // Validate and format the from email
    // Resend accepts: "email@example.com" or "Name <email@example.com>"
    if (!fromEmail.includes('<') && !fromEmail.includes('@')) {
      // If it's just a name without email, use default
      fromEmail = 'SecureAuth <onboarding@resend.dev>';
    } else if (!fromEmail.includes('<') && fromEmail.includes('@')) {
      // If it's just an email, use it as is
      fromEmail = fromEmail.trim();
    } else if (fromEmail.includes('<') && fromEmail.includes('>')) {
      // If it's already in "Name <email>" format, use it as is
      fromEmail = fromEmail.trim();
    } else {
      // Fallback to default
      fromEmail = 'SecureAuth <onboarding@resend.dev>';
    }

    // Check if we're in test mode (using onboarding@resend.dev)
    // Resend test accounts can only send to the account owner's email
    const isTestMode = fromEmail.includes('onboarding@resend.dev') || fromEmail === 'onboarding@resend.dev';
    const testEmail = process.env.RESEND_TEST_EMAIL || 'darnaylakarl@gmail.com';
    
    // In test mode, only send to the verified test email
    const recipientEmail = isTestMode ? testEmail : to;
    
    if (isTestMode && to !== testEmail) {
      console.warn(`Resend test mode: Redirecting email from ${to} to ${testEmail}`);
      // Log the original recipient for debugging
      console.log(`Original recipient: ${to}, OTP code would be sent to: ${testEmail}`);
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: isTestMode && to !== testEmail 
        ? `[TEST MODE - Original: ${to}] ${subject}`
        : subject,
      html: isTestMode && to !== testEmail
        ? `<p><strong>TEST MODE:</strong> This email was originally intended for ${to}</p><br>${html}`
        : html,
    });

    if (error) {
      console.error('Resend API error:', error);
      return res.status(400).json({ 
        error: 'Failed to send email',
        message: error.message || 'Unknown error occurred'
      });
    }

    return res.status(200).json({ 
      success: true, 
      data,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    });
  }
}

