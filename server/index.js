/**
 * Email API Server
 * 
 * This is a simple Express server that handles email sending.
 * Run this server to enable real email sending from your frontend.
 * 
 * Setup:
 * 1. npm install
 * 2. Create .env file with RESEND_API_KEY=your_key_here
 * 3. npm start
 */

import express from 'express';
import { Resend } from 'resend';
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

// Initialize Resend
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error('⚠️  RESEND_API_KEY not found in environment variables!');
  console.error('   Create a .env file with: RESEND_API_KEY=re_your_api_key_here');
  process.exit(1);
}

const resend = new Resend(resendApiKey);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'email-api' });
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

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'SecureAuth <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
    });

    if (error) {
      console.error('Resend API error:', error);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: error.message 
      });
    }

    console.log(`✅ Email sent successfully to ${to} (ID: ${data?.id})`);
    res.json({ 
      success: true, 
      id: data?.id,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Email API server running on http://localhost:${PORT}`);
  console.log(`📧 Ready to send emails via Resend\n`);
  console.log(`⚠️  Make sure your frontend .env has:`);
  console.log(`   VITE_EMAIL_SERVICE=resend`);
  console.log(`   VITE_EMAIL_API_ENDPOINT=http://localhost:${PORT}/api/send-email\n`);
});




