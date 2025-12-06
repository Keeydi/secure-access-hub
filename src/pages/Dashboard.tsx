import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Shield, Users, Key, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Active Users', value: '2,847', icon: Users },
  { label: 'Auth Requests', value: '14.2K', icon: Key },
  { label: 'MFA Adoption', value: '67%', icon: Shield },
  { label: 'Success Rate', value: '99.2%', icon: TrendingUp },
];

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.email.split('@')[0]}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-6 bg-card rounded-lg border border-border"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 bg-card rounded-lg border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Account Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium text-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Role</span>
                <span className="text-sm font-medium text-primary">{user?.role}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-muted-foreground">MFA Status</span>
                <span className={`text-sm font-medium ${user?.mfaEnabled ? 'text-primary' : 'text-muted-foreground'}`}>
                  {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-card rounded-lg border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">Security Status</h2>
            <div className="text-center py-6">
              <Shield className="h-12 w-12 text-primary mx-auto mb-3" />
              <p className="font-semibold text-foreground">All Systems Secure</p>
              <p className="text-sm text-muted-foreground mt-1">
                No security threats detected
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
