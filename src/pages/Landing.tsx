import { Link } from 'react-router-dom';
import { Shield, Lock, Users, Key, Activity, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Lock,
    title: 'Multi-Factor Authentication',
    description: 'Secure your accounts with TOTP authenticator apps and email OTP verification.',
  },
  {
    icon: Users,
    title: 'Role-Based Access Control',
    description: 'Granular permissions with Admin, Standard, and Restricted user roles.',
  },
  {
    icon: Key,
    title: 'Secure Sessions',
    description: 'JWT-based session management with automatic timeout and refresh tokens.',
  },
  {
    icon: Activity,
    title: 'Audit Logging',
    description: 'Track all authentication attempts, role changes, and admin actions.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">SecureAuth</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Enterprise-Grade Security</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight animate-fade-in">
            Multi-Factor Authentication
            <br />
            <span className="text-gradient">Access Control System</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto animate-fade-in">
            Secure Your Online Business Platforms with Advanced Authentication and Role-Based Access Control
          </p>
          
          <p className="text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto animate-fade-in">
            Comprehensive audit logging, MFA support, and granular permissions for modern businesses
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in">
            <Link to="/register">
              <Button size="lg" className="px-8 py-6 text-lg glow-primary group">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-fade-in">
            <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <Shield className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium text-foreground">MFA Enabled</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <Users className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium text-foreground">RBAC System</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <Key className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium text-foreground">Secure Sessions</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <Activity className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium text-foreground">Audit Logs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-muted">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-foreground text-center mb-12">
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 bg-card rounded-lg border border-border"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">SecureAuth</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 SecureAuth. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
