/**
 * Example Backend API Endpoint for Sending Emails
 * 
 * This is a Node.js/Express example. You can adapt this to:
 * - Next.js API routes
 * - Supabase Edge Functions
 * - AWS Lambda
 * - Any backend framework
 * 
 * IMPORTANT: Keep your Resend API key secure on the backend!
 */

const express = require('express');
const { Resend } = require('resend');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'SecureAuth <noreply@yourdomain.com>', // Update with your verified domain
      to: [to],
      subject: subject,
      html: html,
      text: text,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    res.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Email API server running on port ${PORT}`);
});




