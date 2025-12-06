import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/lib/api';
import { generateEmailOtp, sendEmailOtp } from '@/lib/email-otp';

export default function MfaVerify() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaType, setMfaType] = useState<'totp' | 'email'>('totp');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifyMfa, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    inputRefs.current[0]?.focus();
    
    // Determine MFA type and send email OTP if needed
    const determineMfaType = async () => {
      if (user) {
        // Check if user has TOTP enabled (has mfa_secret)
        const mfaSecret = await api.getMfaSecret(user.id);
        if (mfaSecret) {
          setMfaType('totp');
        } else {
          // Assume email OTP and send code
          setMfaType('email');
          try {
            // Generate and send email OTP
            const otpCode = generateEmailOtp();
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + 120); // 2 minutes
            
            await api.createOtpCode(user.id, otpCode, 'email', expiresAt);
            const sent = await sendEmailOtp(user.email, otpCode);
            
            if (sent) {
              setEmailOtpSent(true);
            }
          } catch (error) {
            console.error('Failed to send email OTP:', error);
          }
        }
      }
    };
    
    determineMfaType();
  }, [user]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setCode(newCode);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fullCode = code.join('');
    
    // Check if it's a backup code (format: XXXX-XXXX-XXXX, 12 characters with dashes)
    const isBackupCodeFormat = fullCode.length === 12 && /^\d{4}-\d{4}-\d{4}$/.test(fullCode.replace(/\s/g, ''));
    const cleanCode = fullCode.replace(/\s/g, '').replace(/-/g, '');
    
    if (cleanCode.length < 6 && !isBackupCodeFormat) {
      setError('Please enter a complete code');
      setLoading(false);
      return;
    }

    try {
      let success = false;
      
      // Try backup code first if format matches
      if (isBackupCodeFormat) {
        success = await verifyMfa(cleanCode, 'backup');
      } else if (cleanCode.length === 6) {
        // Try regular MFA code
        success = await verifyMfa(cleanCode, mfaType);
        
        // If regular MFA fails, try as backup code (in case user entered backup code without dashes)
        if (!success) {
          success = await verifyMfa(cleanCode, 'backup');
        }
      }
      
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid or expired verification code');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Two-Factor Authentication</h2>
          <p className="text-muted-foreground mb-4 text-center text-sm">
            {mfaType === 'totp' 
              ? 'Enter the 6-digit code from your authenticator app'
              : emailOtpSent
              ? `Enter the 6-digit code sent to ${user?.email}`
              : 'Sending verification code to your email...'}
          </p>
          <p className="text-muted-foreground mb-8 text-center text-xs">
            Or enter a backup code (12 digits, with or without dashes)
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-mono rounded border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              ))}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
