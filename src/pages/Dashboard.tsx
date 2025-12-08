import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Shield, Users, Key, TrendingUp } from 'lucide-react';
import { getDashboardStats } from '@/lib/api';

interface StatCard {
  label: string;
  value: string;
  icon: typeof Users;
}

export default function Dashboard() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [stats, setStats] = useState<StatCard[]>([
    { label: 'Active Users', value: '...', icon: Users },
    { label: 'Auth Requests', value: '...', icon: Key },
    { label: 'MFA Adoption', value: '...', icon: Shield },
    { label: 'Success Rate', value: '...', icon: TrendingUp },
  ]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Format number with commas and K/M suffixes
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  // Format percentage
  const formatPercentage = (num: number): string => {
    return num.toFixed(1) + '%';
  };

  // Load dashboard statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const dashboardStats = await getDashboardStats();

        setStats([
          { label: 'Active Users', value: formatNumber(dashboardStats.activeUsers), icon: Users },
          { label: 'Auth Requests', value: formatNumber(dashboardStats.authRequests), icon: Key },
          { label: 'MFA Adoption', value: formatPercentage(dashboardStats.mfaAdoption), icon: Shield },
          { label: 'Success Rate', value: formatPercentage(dashboardStats.successRate), icon: TrendingUp },
        ]);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        // Keep default "..." values on error
      } finally {
        setStatsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
                  <p className={`text-2xl font-bold mt-1 ${statsLoading ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {statsLoading ? '...' : stat.value}
                  </p>
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
