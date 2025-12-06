/**
 * Email OTP utilities
 * 
 * Note: For production, integrate with an email service like:
 * - SendGrid
 * - AWS SES
 * - Mailgun
 * - Nodemailer with SMTP
 * 
 * This implementation provides a structure that can be easily
 * swapped with a real email service.
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
  service?: 'sendgrid' | 'ses' | 'smtp' | 'mock';
}

const defaultEmailConfig: EmailConfig = {
  from: 'noreply@secureauth.com',
  subject: 'Your SecureAuth Verification Code',
  service: 'mock', // Change to 'sendgrid', 'ses', etc. for production
};

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

  try {
    switch (emailConfig.service) {
      case 'mock':
        // Mock email service - logs to console in development
        // In production, replace with actual email service
        console.log(`[MOCK EMAIL] Sending OTP to ${email}: ${code}`);
        console.log(`Subject: ${emailConfig.subject}`);
        console.log(`Body: Your verification code is: ${code}`);
        console.log(`This code expires in 2 minutes.`);
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return true;

      case 'sendgrid':
        // TODO: Implement SendGrid integration
        // const sgMail = require('@sendgrid/mail');
        // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        // await sgMail.send({...});
        throw new Error('SendGrid integration not yet implemented');

      case 'ses':
        // TODO: Implement AWS SES integration
        throw new Error('AWS SES integration not yet implemented');

      case 'smtp':
        // TODO: Implement SMTP integration
        throw new Error('SMTP integration not yet implemented');

      default:
        throw new Error(`Unknown email service: ${emailConfig.service}`);
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

