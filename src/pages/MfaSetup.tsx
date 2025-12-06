import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Smartphone, Mail, CheckCircle, Copy, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { generateBackupCodes } from '@/lib/api';

export default function MfaSetup() {
  const { isAuthenticated, user, disableMfa, setupTotp, setupEmailOtp, verifyTotpSetup, verifyEmailOtpSetup } = useAuth();
  const [step, setStep] = useState<'choose' | 'totp' | 'email' | 'backup' | 'complete'>('choose');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const { toast } = useToast();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Initialize TOTP setup when step changes to 'totp'
  useEffect(() => {
    if (step === 'totp' && !totpSecret && user) {
      const initializeTotp = async () => {
        try {
          setLoading(true);
          const { secret, qrCode, uri } = await setupTotp();
          setTotpSecret(secret);
          setQrCode(qrCode);
          setTotpUri(uri);
        } catch (error) {
          setError('Failed to initialize TOTP setup');
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      initializeTotp();
    }
  }, [step, totpSecret, setupTotp, user]);

  // Send email OTP when step changes to 'email'
  useEffect(() => {
    if (step === 'email' && !emailOtpSent && user) {
      const sendOtp = async () => {
        try {
          setLoading(true);
          const sent = await setupEmailOtp();
          if (sent) {
            setEmailOtpSent(true);
            toast({
              title: 'Code Sent',
              description: 'A verification code has been sent to your email.',
            });
          } else {
            setError('Failed to send verification code. Please try again.');
          }
        } catch (error) {
          setError('Failed to send verification code');
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      sendOtp();
    }
  }, [step, emailOtpSent, setupEmailOtp, user, toast]);

  const handleTotpVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (!totpSecret) {
      setError('TOTP setup not initialized');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const isValid = await verifyTotpSetup(verificationCode, totpSecret);
      
      if (isValid) {
        // Generate backup codes
        const codes = await generateBackupCodes(user!.id);
        setBackupCodes(codes);
        setStep('backup');
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOtpVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const isValid = await verifyEmailOtpSetup(verificationCode);
      
      if (isValid) {
        // Generate backup codes
        const codes = await generateBackupCodes(user!.id);
        setBackupCodes(codes);
        setStep('backup');
      } else {
        setError('Invalid or expired code. Please try again.');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setStep('complete');
    toast({
      title: 'MFA Enabled',
      description: 'Your account is now protected with two-factor authentication.',
    });
  };

  const handleDisable = () => {
    disableMfa();
    setStep('choose');
    toast({
      title: 'MFA Disabled',
      description: 'Two-factor authentication has been disabled.',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Backup codes copied to clipboard.',
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">MFA Setup</h1>
          <p className="text-muted-foreground mt-1">
            Secure your account with two-factor authentication
          </p>
        </div>

        {user?.mfaEnabled && step === 'choose' ? (
          <div className="glass rounded-xl p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold mb-2">MFA is Enabled</h2>
            <p className="text-muted-foreground mb-6">
              Your account is protected with two-factor authentication.
            </p>
            <Button variant="destructive" onClick={handleDisable}>
              Disable MFA
            </Button>
          </div>
        ) : step === 'choose' ? (
          <div className="space-y-4">
            <button
              onClick={() => setStep('totp')}
              className="w-full glass rounded-xl p-6 text-left hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Authenticator App</h3>
                  <p className="text-sm text-muted-foreground">
                    Use an app like Google Authenticator, Authy, or Microsoft Authenticator
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setStep('email')}
              className="w-full glass rounded-xl p-6 text-left hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email OTP</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive a one-time code via email each time you sign in
                  </p>
                </div>
              </div>
            </button>
          </div>
        ) : step === 'totp' ? (
          <div className="glass rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-6 text-center">
              Set Up Authenticator App
            </h2>

            {loading && !qrCode ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : qrCode ? (
              <div className="text-center mb-8">
                <div className="w-48 h-48 mx-auto mb-4 rounded-xl bg-white p-4 flex items-center justify-center">
                  <img src={qrCode} alt="QR Code" className="w-full h-full" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code with your authenticator app
                </p>
                {totpUri && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted font-mono text-sm break-all">
                    <span className="max-w-xs truncate">{totpUri}</span>
                    <button
                      onClick={() => copyToClipboard(totpUri)}
                      className="text-primary hover:text-primary/80 flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Failed to generate QR code</p>
                <Button variant="outline" className="mt-4" onClick={() => setStep('choose')}>
                  Back
                </Button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-4 mb-6 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Enter the 6-digit code from your app
              </p>
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={verificationCode[i] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        const newCode = verificationCode.split('');
                        newCode[i] = val;
                        setVerificationCode(newCode.join(''));
                        if (val && e.target.nextElementSibling) {
                          (e.target.nextElementSibling as HTMLInputElement).focus();
                        }
                      }
                    }}
                    className="w-12 h-14 text-center text-xl font-mono rounded-lg border border-border bg-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                ))}
              </div>
            </div>

            {qrCode && (
              <>
                <div className="flex gap-4 mt-8">
                  <Button variant="outline" className="flex-1" onClick={() => setStep('choose')}>
                    Back
                  </Button>
                  <Button 
                    className="flex-1 glow-primary" 
                    onClick={handleTotpVerify}
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : step === 'email' ? (
          <div className="glass rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-6 text-center">
              Set Up Email OTP
            </h2>

            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-2">
                {emailOtpSent ? 'Verification code sent to' : 'We'll send a verification code to'}
              </p>
              <p className="font-medium">{user?.email}</p>
              {!emailOtpSent && loading && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Sending code...</span>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 mb-6 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Enter the 6-digit code sent to your email
              </p>
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={verificationCode[i] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        const newCode = verificationCode.split('');
                        newCode[i] = val;
                        setVerificationCode(newCode.join(''));
                      }
                    }}
                    className="w-12 h-14 text-center text-xl font-mono rounded-lg border border-border bg-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                ))}
              </div>
            </div>

            {emailOtpSent && (
              <div className="flex gap-4 mt-8">
                <Button variant="outline" className="flex-1" onClick={() => setStep('choose')}>
                  Back
                </Button>
                <Button 
                  className="flex-1 glow-primary" 
                  onClick={handleEmailOtpVerify}
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : step === 'backup' ? (
          <div className="glass rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-2 text-center">
              Save Your Backup Codes
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              Store these codes in a safe place. You can use them to access your account if you lose your device.
            </p>

            {backupCodes.length > 0 ? (
              <>
                <div className="bg-muted rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="p-2 bg-background rounded">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Generating backup codes...</p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy All Codes
            </Button>

            <Button className="w-full glow-primary" onClick={handleComplete}>
              I've Saved My Codes
            </Button>
          </div>
        ) : (
          <div className="glass rounded-xl p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold mb-2">MFA Setup Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Your account is now protected with two-factor authentication.
            </p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
