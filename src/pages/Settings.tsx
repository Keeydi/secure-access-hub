import { Navigate } from 'react-router-dom';
import { User, Lock, Bell, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

export default function Settings() {
  const { isAuthenticated, user, isLoading } = useAuth();

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
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={user?.role} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <Button>Save Changes</Button>
          </div>
        </div>

        {/* Security Section */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Security</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`text-sm ${
                    user?.mfaEnabled ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <Button variant="outline" size="sm" asChild>
                  <a href="/mfa-setup">Configure</a>
                </Button>
              </div>
            </div>
            <div className="border-t border-border pt-6">
              <p className="font-medium mb-4">Change Password</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <Input id="current" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new">New Password</Label>
                  <Input id="new" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <Input id="confirm" type="password" />
                </div>
                <Button>Update Password</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Login alerts', desc: 'Get notified of new sign-ins to your account' },
              { label: 'Security alerts', desc: 'Receive alerts about suspicious activity' },
              { label: 'Product updates', desc: 'Stay updated on new features and improvements' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </div>

        {/* Sessions Section */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Active Sessions</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Current Session</p>
                <p className="text-sm text-muted-foreground">
                  Chrome on macOS • Active now
                </p>
              </div>
              <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">
                Current
              </span>
            </div>
            <Button variant="outline" className="w-full">
              Sign Out All Other Sessions
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass rounded-xl p-6 border-destructive/20">
          <div className="flex items-center gap-3 mb-6">
            <Trash2 className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="destructive">Delete Account</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
