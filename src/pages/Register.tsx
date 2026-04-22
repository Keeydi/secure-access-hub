import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, CheckCircle, Mail, Loader2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { normalizePhilippinePhone } from '@/lib/phone';
import { cn } from '@/lib/utils';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
];

type OtpDelivery = 'email' | 'sms';

function maskPhilippinePhoneDisplay(raw: string): string {
  const n = normalizePhilippinePhone(raw);
  if (!n || n.length < 10) return raw.trim() || 'your number';
  return `${n.slice(0, 6)}***${n.slice(-3)}`;
}

export default function Register() {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [deliveryChoice, setDeliveryChoice] = useState<OtpDelivery>('email');
  const [verificationChannel, setVerificationChannel] = useState<OtpDelivery | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const { sendRegistrationOtp, verifyRegistrationOtp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'verify') {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const allRequirementsMet = passwordRequirements.every((req) => req.test(password));
    if (!allRequirementsMet) {
      setError('Password does not meet requirements');
      return;
    }

    if (deliveryChoice === 'sms') {
      const normalized = normalizePhilippinePhone(phone);
      if (!normalized) {
        setError('Enter a valid Philippine mobile number (+639XXXXXXXXX or 09XXXXXXXXX).');
        return;
      }
    }

    setSendingOtp(true);

    try {
      const phoneForOtp = deliveryChoice === 'sms' ? phone : undefined;
      const sent = await sendRegistrationOtp(email, password, phoneForOtp);
      if (sent) {
        setVerificationChannel(deliveryChoice);
        setStep('verify');
        toast({
          title: 'Verification Code Sent',
          description:
            deliveryChoice === 'sms'
              ? `A 6-digit code was sent via SMS to ${maskPhilippinePhoneDisplay(phone)}.`
              : `A verification code has been sent to ${email}. Please check your email.`,
        });
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send verification code.';
      setError(errorMessage);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1);
    setVerificationCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setVerificationCode(newCode);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fullCode = verificationCode.join('');
    if (fullCode.length !== 6) {
      setError('Please enter a complete 6-digit code');
      setLoading(false);
      return;
    }

    try {
      const phoneForVerify = verificationChannel === 'sms' ? phone : undefined;
      await verifyRegistrationOtp(email, fullCode, phoneForVerify?.trim() || undefined);

      toast({
        title: 'Registration Successful',
        description: 'Your account has been created. Please sign in to continue.',
      });

      navigate('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid or expired verification code.';
      setError(errorMessage);
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSendingOtp(true);

    try {
      const phoneForOtp = verificationChannel === 'sms' ? phone : undefined;
      const sent = await sendRegistrationOtp(email, password, phoneForOtp);
      if (sent) {
        toast({
          title: 'Code Resent',
          description:
            verificationChannel === 'sms'
              ? 'A new code was sent via SMS.'
              : 'A new verification code has been sent to your email.',
        });
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError('Failed to resend code. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code.';
      setError(errorMessage);
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-2xl font-semibold text-foreground">SecureAuth</span>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          {step === 'form' ? (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">Sign Up</h2>
              <p className="text-muted-foreground mb-6">Create your account to get started</p>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={sendingOtp}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-foreground">Verification code via</Label>
                  <RadioGroup
                    value={deliveryChoice}
                    onValueChange={(v) => {
                      const next = v as OtpDelivery;
                      setDeliveryChoice(next);
                      if (next === 'email') setPhone('');
                    }}
                    disabled={sendingOtp}
                    className="grid gap-3"
                  >
                    <label
                      htmlFor="reg-otp-email"
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                        deliveryChoice === 'email'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/40',
                      )}
                    >
                      <RadioGroupItem value="email" id="reg-otp-email" className="mt-1" />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <Mail className="h-4 w-4 text-primary" />
                          Email
                        </div>
                        <p className="text-xs text-muted-foreground">
                          6-digit code sent to your inbox (SMTP).
                        </p>
                      </div>
                    </label>
                    <label
                      htmlFor="reg-otp-sms"
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                        deliveryChoice === 'sms'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/40',
                      )}
                    >
                      <RadioGroupItem value="sms" id="reg-otp-sms" className="mt-1" />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 font-medium text-foreground">
                          <Smartphone className="h-4 w-4 text-primary" />
                          SMS (Philippines)
                        </div>
                        <p className="text-xs text-muted-foreground">
                          6-digit code via SkySMS. Point{' '}
                          <code className="text-[11px]">VITE_EMAIL_API_ENDPOINT</code> at your API server
                          (same host as <code className="text-[11px]">/api/skysms/*</code>).
                        </p>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {deliveryChoice === 'sms' && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">
                      Mobile number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+639171234567 or 09171234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={sendingOtp}
                      autoComplete="tel"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={sendingOtp}
                  />
                  {password && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {passwordRequirements.map((req) => (
                        <div
                          key={req.label}
                          className={`flex items-center gap-1 text-xs ${
                            req.test(password) ? 'text-success' : 'text-muted-foreground'
                          }`}
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={sendingOtp}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={sendingOtp}>
                  {sendingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending verification code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  {verificationChannel === 'sms' ? (
                    <Smartphone className="h-8 w-8 text-primary" />
                  ) : (
                    <Mail className="h-8 w-8 text-primary" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {verificationChannel === 'sms' ? 'Verify Your Phone' : 'Verify Your Email'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {verificationChannel === 'sms'
                    ? "We've sent a 6-digit code via SMS to"
                    : "We've sent a 6-digit verification code to"}
                </p>
                <p className="font-medium text-foreground mt-1">
                  {verificationChannel === 'sms' ? maskPhilippinePhoneDisplay(phone) : email}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifySubmit}>
                <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-mono rounded border border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      disabled={loading}
                    />
                  ))}
                </div>

                <Button type="submit" className="w-full mb-3" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Create Account'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={sendingOtp}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    {sendingOtp ? 'Sending...' : "Didn't receive code? Resend"}
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      if (verificationChannel) setDeliveryChoice(verificationChannel);
                      setVerificationChannel(null);
                      setError('');
                      setVerificationCode(['', '', '', '', '', '']);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    ← Edit signup details
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
