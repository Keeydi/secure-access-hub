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

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'SecureAuth <onboarding@resend.dev>',
      to,
      subject,
      html,
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

