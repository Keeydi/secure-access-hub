import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as api from '@/lib/api';
import { sendEmailOtp } from '@/lib/email-otp';
import { getClientIpAddress, getCachedClientIp } from '@/lib/ip-address';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if user exists
      const user = await api.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not (security best practice)
        setSuccess(true);
        setLoading(false);
        return;
      }

      // Generate password reset token
      const token = await api.createPasswordResetToken(user.id);

      // Create reset link
      const resetLink = `${window.location.origin}/reset-password?token=${token}`;

      // Send email with reset link
      // For now, we'll use the email OTP sending function structure
      // In production, send the actual reset link via email
      const emailSent = await sendEmailOtp(
        email,
        `Password Reset Link: ${resetLink}`,
        {
          subject: 'Password Reset Request',
        }
      );

      if (emailSent) {
        // Get IP address for audit log
        let ipAddress = getCachedClientIp();
        if (!ipAddress) {
          ipAddress = await getClientIpAddress();
        }
        const userAgent = navigator.userAgent;
        
        // Create audit log
        await api.createAuditLog(user.id, 'Password reset requested', ipAddress, userAgent);
        setSuccess(true);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg p-8 shadow-sm text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Check Your Email</h2>
            <p className="text-muted-foreground mb-6">
              If an account with that email exists, we've sent a password reset link.
              Please check your email and follow the instructions.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-semibold text-foreground">SecureAuth</span>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-2">Reset Password</h2>
          <p className="text-muted-foreground mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

