import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Settings, Users, LogOut, Menu, X, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'MFA Setup', path: '/mfa-setup', icon: Key },
  { label: 'Admin Panel', path: '/admin', icon: Users, adminOnly: true },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'Admin'
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              <span className="text-lg font-semibold text-sidebar-foreground">SecureAuth</span>
            </Link>
            <button
              className="lg:hidden text-sidebar-foreground hover:text-sidebar-primary"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium">
                  {user?.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.email}</p>
                <p className="text-xs text-sidebar-foreground/70">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start mt-2"
              onClick={logout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background">
          <div className="flex items-center h-full px-6">
            <button
              className="lg:hidden mr-4 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              {user?.mfaEnabled ? (
                <span className="flex items-center gap-2 text-sm text-primary">
                  <Shield className="h-4 w-4" />
                  MFA Active
                </span>
              ) : (
                <Link
                  to="/mfa-setup"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Shield className="h-4 w-4" />
                  Enable MFA
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
