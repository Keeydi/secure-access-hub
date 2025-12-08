/**
 * Email OTP utilities
 * 
 * Email Service Options:
 * - resend: Uses Resend API (requires backend API endpoint for security)
 * - mock: Development mode (logs to console)
 * 
 * For production, set up a backend API endpoint to send emails
 * to keep your API keys secure.
 */

/**
 * Generate a random 6-digit OTP code
 * @returns 6-digit OTP code as string
 */
export function generateEmailOtp(): string {
  // Generate a random 6-digit number
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

/**
 * Email OTP configuration
 */
export interface EmailConfig {
  from: string;
  subject: string;
  service?: 'mailgun' | 'sendgrid' | 'resend' | 'mock';
  apiEndpoint?: string; // Backend API endpoint for sending emails
}

// Detect if we're in development or production
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// Get API endpoint from env, but filter out localhost URLs in production
const getApiEndpoint = () => {
  const envEndpoint = import.meta.env.VITE_EMAIL_API_ENDPOINT;
  
  // If no endpoint is set, use default relative path
  if (!envEndpoint) {
    return '/api/send-email';
  }
  
  // If it's a localhost URL and we're in production, ignore it and use default
  if (isProduction && envEndpoint.includes('localhost')) {
    console.warn('Localhost API endpoint detected in production, using default /api/send-email');
    return '/api/send-email';
  }
  
  return envEndpoint;
};

// Get email service from env, with proper defaults
const getEmailService = (): 'mailgun' | 'sendgrid' | 'resend' | 'mock' => {
  const envService = import.meta.env.VITE_EMAIL_SERVICE;
  
  // If explicitly set to 'mailgun', use it
  if (envService === 'mailgun') {
    return 'mailgun';
  }
  
  // If explicitly set to 'sendgrid', use it
  if (envService === 'sendgrid') {
    return 'sendgrid';
  }
  
  // If explicitly set to 'resend', use it
  if (envService === 'resend') {
    return 'resend';
  }
  
  // If explicitly set to 'mock', use it
  if (envService === 'mock') {
    return 'mock';
  }
  
  // Default: use 'mailgun' in production, 'mock' in development
  return isProduction ? 'mailgun' : 'mock';
};

const defaultEmailConfig: EmailConfig = {
  from: 'noreply@secureauth.com',
  subject: 'Your SecureAuth Verification Code',
  // Use the service determined by getEmailService
  service: getEmailService(),
  // Use relative path for Vercel serverless function (works in both dev and prod)
  apiEndpoint: getApiEndpoint(),
};

/**
 * Send email via backend API endpoint
 */
async function sendEmailViaAPI(
  email: string,
  code: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<boolean> {
  const apiEndpoint = defaultEmailConfig.apiEndpoint || '/api/send-email';
  
  try {
    // Build full URL if it's a relative path
    const url = apiEndpoint.startsWith('http') 
      ? apiEndpoint 
      : `${window.location.origin}${apiEndpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject,
        html: htmlBody,
        text: textBody,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to send email' }));
      throw new Error(error.message || 'Failed to send email');
    }

    return true;
  } catch (error) {
    console.error('Failed to send email via API:', error);
    
    // In development, if API fails, log a helpful message
    if (import.meta.env.DEV) {
      console.warn(
        'Email API endpoint is not available. ' +
        'In development, you can either:\n' +
        '1. Use mock mode (default): Set VITE_EMAIL_SERVICE=mock\n' +
        '2. Run Vercel dev server: npx vercel dev\n' +
        '3. Set up a local backend server'
      );
    }
    
    return false;
  }
}

/**
 * Send OTP code via email
 * @param email Recipient email address
 * @param code OTP code to send
 * @param config Optional email configuration
 * @returns Promise resolving to true if sent successfully
 */
export async function sendEmailOtp(
  email: string,
  code: string,
  config: Partial<EmailConfig> = {}
): Promise<boolean> {
  const emailConfig = { ...defaultEmailConfig, ...config };
  const htmlBody = formatEmailBody(code);
  const textBody = formatEmailBodyText(code);

  try {
    switch (emailConfig.service) {
      case 'mailgun':
      case 'sendgrid':
      case 'resend':
        // Use backend API endpoint to send email (recommended for production)
        const sent = await sendEmailViaAPI(email, code, emailConfig.subject, htmlBody, textBody);
        
        if (!sent) {
          // In production, don't fall back to mock - return error
          if (isProduction) {
            const serviceName = emailConfig.service === 'mailgun' ? 'Mailgun' : 
                               emailConfig.service === 'sendgrid' ? 'SendGrid' : 'Resend';
            console.error(`Failed to send email via ${serviceName} API. Check your API key and serverless function configuration.`);
            return false;
          }
          
          // Only fall back to mock in development
          console.warn('Email API failed, falling back to mock mode (development only)');
          console.log(`[MOCK EMAIL] Sending OTP to ${email}: ${code}`);
          console.log(`Subject: ${emailConfig.subject}`);
          console.log(`Body: Your verification code is: ${code}`);
          console.log(`This code expires in 2 minutes.`);
          return true;
        }
        
        return sent;

      case 'mock':
      default:
        // Mock email service - logs to console in development
        console.log(`[MOCK EMAIL] Sending OTP to ${email}: ${code}`);
        console.log(`Subject: ${emailConfig.subject}`);
        console.log(`Body: Your verification code is: ${code}`);
        console.log(`This code expires in 2 minutes.`);
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return true;
    }
  } catch (error) {
    console.error('Failed to send email OTP:', error);
    return false;
  }
}

/**
 * Format email body with OTP code
 * @param code OTP code
 * @returns Formatted email body HTML
 */
export function formatEmailBody(code: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .code { font-size: 32px; font-weight: bold; color: #800000; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 5px; margin: 20px 0; }
        .warning { color: #666; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Your Verification Code</h2>
        <p>Your SecureAuth verification code is:</p>
        <div class="code">${code}</div>
        <p class="warning">This code will expire in 2 minutes. Do not share this code with anyone.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format email body as plain text
 * @param code OTP code
 * @returns Formatted email body text
 */
export function formatEmailBodyText(code: string): string {
  return `
Your SecureAuth verification code is: ${code}

This code will expire in 2 minutes. Do not share this code with anyone.

If you didn't request this code, please ignore this email.
  `.trim();
}
