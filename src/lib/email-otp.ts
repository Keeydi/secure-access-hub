/**
 * Email OTP utilities
 * 
 * Uses SMTP server for sending emails via backend API endpoint
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
  apiEndpoint?: string; // Backend API endpoint for sending emails
}

// Get API endpoint from env
const getApiEndpoint = () => {
  const envEndpoint = import.meta.env.VITE_EMAIL_API_ENDPOINT;
  
  // If no endpoint is set, use default relative path
  if (!envEndpoint) {
    return '/api/send-email';
  }
  
  // If it's a localhost URL and we're in production, ignore it and use default
  if (import.meta.env.PROD && envEndpoint.includes('localhost')) {
    console.warn('Localhost API endpoint detected in production, using default /api/send-email');
    return '/api/send-email';
  }
  
  return envEndpoint;
};

const defaultEmailConfig: EmailConfig = {
  from: 'noreply@secureauth.com',
  subject: 'Your SecureAuth Verification Code',
  apiEndpoint: getApiEndpoint(),
};

/**
 * Send email via backend API endpoint (SMTP)
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
    return false;
  }
}

/**
 * Send OTP code via email using SMTP
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
    const sent = await sendEmailViaAPI(email, code, emailConfig.subject, htmlBody, textBody);
    
    if (!sent) {
      console.error('Failed to send email via SMTP. Check your configuration and serverless function.');
      return false;
    }
    
    return true;
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
