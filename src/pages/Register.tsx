import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, CheckCircle, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
];

export default function Register() {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
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

    setSendingOtp(true);

    try {
      const sent = await sendRegistrationOtp(email, password);
      if (sent) {
        setStep('verify');
        toast({
          title: 'Verification Code Sent',
          description: `A verification code has been sent to ${email}. Please check your email.`,
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
      await verifyRegistrationOtp(email, fullCode);
      
      // Show success toast
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created. Please sign in to continue.',
      });
      
      // Redirect to login page
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
      const sent = await sendRegistrationOtp(email, password);
      if (sent) {
        toast({
          title: 'Code Resent',
          description: 'A new verification code has been sent to your email.',
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
              <p className="text-muted-foreground mb-6">
                Create your account to get started
              </p>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
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
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={sendingOtp}
                >
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
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h2>
                <p className="text-muted-foreground text-sm">
                  We've sent a 6-digit verification code to
                </p>
                <p className="font-medium text-foreground mt-1">{email}</p>
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
                      ref={(el) => (inputRefs.current[index] = el)}
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

                <Button 
                  type="submit" 
                  className="w-full mb-3" 
                  disabled={loading}
                >
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
                      setError('');
                      setVerificationCode(['', '', '', '', '', '']);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    ← Change email
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
