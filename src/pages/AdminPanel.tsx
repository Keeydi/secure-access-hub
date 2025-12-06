import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Shield, Activity, Search, MoreVertical, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import * as api from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface MockUser {
  id: string;
  email: string;
  role: UserRole;
  mfaEnabled: boolean;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const mockUsersList: MockUser[] = [
  { id: '1', email: 'admin@example.com', role: 'Admin', mfaEnabled: true, status: 'active', lastLogin: '2 min ago' },
  { id: '2', email: 'john@example.com', role: 'StandardUser', mfaEnabled: true, status: 'active', lastLogin: '1 hour ago' },
  { id: '3', email: 'sarah@example.com', role: 'StandardUser', mfaEnabled: false, status: 'active', lastLogin: '3 hours ago' },
  { id: '4', email: 'mike@example.com', role: 'RestrictedUser', mfaEnabled: false, status: 'inactive', lastLogin: '2 days ago' },
  { id: '5', email: 'jane@example.com', role: 'Admin', mfaEnabled: true, status: 'active', lastLogin: '5 hours ago' },
];

export default function AdminPanel() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'failed-attempts'>('users');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const { toast } = useToast();
  
  // Dialog states
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ open: boolean; userId: string | null; currentRole: UserRole | null }>({
    open: false,
    userId: null,
    currentRole: null,
  });
  const [editUserDialog, setEditUserDialog] = useState<{ open: boolean; userId: string | null; currentEmail: string | null }>({
    open: false,
    userId: null,
    currentEmail: null,
  });
  const [deleteUserDialog, setDeleteUserDialog] = useState<{ open: boolean; userId: string | null; userEmail: string | null }>({
    open: false,
    userId: null,
    userEmail: null,
  });
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; userId: string | null; userEmail: string | null }>({
    open: false,
    userId: null,
    userEmail: null,
  });
  
  const [newRole, setNewRole] = useState<UserRole>('StandardUser');
  const [newEmail, setNewEmail] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'Admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to view this page.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Load users and audit logs
  useEffect(() => {
    const loadData = async () => {
      if (activeTab === 'users') {
        try {
          setLoading(true);
          const users = await api.getAllUsers();
          setUsersList(users);
        } catch (error) {
          console.error('Failed to load users:', error);
        } finally {
          setLoading(false);
        }
      } else if (activeTab === 'logs') {
        try {
          setLogsLoading(true);
          const logs = await api.getAuditLogs(100);
          setAuditLogs(logs);
        } catch (error) {
          console.error('Failed to load audit logs:', error);
        } finally {
          setLogsLoading(false);
        }
      } else if (activeTab === 'failed-attempts') {
        try {
          setAttemptsLoading(true);
          const attempts = await api.getFailedLoginAttempts(100);
          setFailedAttempts(attempts);
        } catch (error) {
          console.error('Failed to load failed login attempts:', error);
        } finally {
          setAttemptsLoading(false);
        }
      }
    };

    loadData();
  }, [activeTab]);

  const filteredUsers = usersList.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleChangeRole = async () => {
    if (!roleChangeDialog.userId || !newRole) return;
    
    try {
      await api.updateUserRole(roleChangeDialog.userId, newRole);
      const { getClientIpAddress } = await import('@/lib/ip-address');
      const ipAddress = await getClientIpAddress();
      await api.createAuditLog(roleChangeDialog.userId, `Role changed to ${newRole} by admin`, ipAddress, null);
      
      // Refresh users list
      const users = await api.getAllUsers();
      setUsersList(users);
      
      toast({
        title: 'Role updated',
        description: `User role has been changed to ${newRole}.`,
      });
      
      setRoleChangeDialog({ open: false, userId: null, currentRole: null });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role.',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = async () => {
    if (!editUserDialog.userId || !newEmail) return;
    
    try {
      await api.updateUserEmail(editUserDialog.userId, newEmail);
      const { getClientIpAddress } = await import('@/lib/ip-address');
      const ipAddress = await getClientIpAddress();
      await api.createAuditLog(editUserDialog.userId, `Email updated by admin`, ipAddress, null);
      
      // Refresh users list
      const users = await api.getAllUsers();
      setUsersList(users);
      
      toast({
        title: 'Email updated',
        description: `User email has been updated.`,
      });
      
      setEditUserDialog({ open: false, userId: null, currentEmail: null });
      setNewEmail('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user email.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserDialog.userId) return;
    
    try {
      await api.deleteUser(deleteUserDialog.userId);
      const { getClientIpAddress } = await import('@/lib/ip-address');
      const ipAddress = await getClientIpAddress();
      await api.createAuditLog(deleteUserDialog.userId, 'User deleted by admin', ipAddress, null);
      
      // Refresh users list
      const users = await api.getAllUsers();
      setUsersList(users);
      
      toast({
        title: 'User deleted',
        description: 'User has been permanently deleted.',
      });
      
      setDeleteUserDialog({ open: false, userId: null, userEmail: null });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user.',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordDialog.userId) return;
    
    try {
      const token = await api.adminInitiatePasswordReset(resetPasswordDialog.userId);
      const resetLink = `${window.location.origin}/reset-password?token=${token}`;
      setResetToken(resetLink);
      
      toast({
        title: 'Password reset link generated',
        description: 'Copy the reset link and share it with the user.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate password reset link.',
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">
            Manage users, roles, and view audit logs
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
          >
            <Users className="h-4 w-4 mr-2" />
            Users
          </Button>
          <Button
            variant={activeTab === 'logs' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('logs')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Audit Logs
          </Button>
          <Button
            variant={activeTab === 'failed-attempts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('failed-attempts')}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Failed Attempts
          </Button>
        </div>

        {activeTab === 'users' ? (
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button>Add User</Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        MFA
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span className="font-medium">{u.email}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                u.role === 'Admin'
                                  ? 'bg-primary/10 text-primary'
                                  : u.role === 'StandardUser'
                                  ? 'bg-secondary text-secondary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {u.mfaEnabled ? (
                              <CheckCircle className="h-5 w-5 text-success" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-sm">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditUserDialog({ open: true, userId: u.id, currentEmail: u.email });
                                    setNewEmail(u.email);
                                  }}
                                >
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRoleChangeDialog({ open: true, userId: u.id, currentRole: u.role });
                                    setNewRole(u.role);
                                  }}
                                >
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setResetPasswordDialog({ open: true, userId: u.id, userEmail: u.email });
                                    setResetToken(null);
                                  }}
                                >
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setDeleteUserDialog({ open: true, userId: u.id, userEmail: u.email });
                                  }}
                                >
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'logs' ? (
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6">Recent Activity</h2>
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No audit logs found
              </div>
            ) : (
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">{log.user}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{log.time}</p>
                      <p className="text-xs text-muted-foreground font-mono">{log.ip}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6">Failed Login Attempts</h2>
            {attemptsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : failedAttempts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No failed login attempts found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        IP Address
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        Attempted At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedAttempts.map((attempt) => {
                      const attemptedAt = new Date(attempt.attemptedAt);
                      const timeAgo = getTimeAgo(attemptedAt);
                      
                      return (
                        <tr
                          key={attempt.id}
                          className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span className="font-medium">{attempt.email}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-mono text-muted-foreground">
                              {attempt.ipAddress || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-muted-foreground text-sm">
                            {timeAgo}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Change Role Dialog */}
        <Dialog open={roleChangeDialog.open} onOpenChange={(open) => setRoleChangeDialog({ open, userId: null, currentRole: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change User Role</DialogTitle>
              <DialogDescription>
                Select a new role for this user. Current role: {roleChangeDialog.currentRole}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">New Role</Label>
                <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="StandardUser">Standard User</SelectItem>
                    <SelectItem value="RestrictedUser">Restricted User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleChangeDialog({ open: false, userId: null, currentRole: null })}>
                Cancel
              </Button>
              <Button onClick={handleChangeRole}>Change Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={editUserDialog.open} onOpenChange={(open) => setEditUserDialog({ open, userId: null, currentEmail: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update the user's email address.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUserDialog({ open: false, userId: null, currentEmail: null })}>
                Cancel
              </Button>
              <Button onClick={handleEditUser}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={deleteUserDialog.open} onOpenChange={(open) => setDeleteUserDialog({ open, userId: null, userEmail: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user account for{' '}
                <strong>{deleteUserDialog.userEmail}</strong> and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => setResetPasswordDialog({ open, userId: null, userEmail: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset User Password</DialogTitle>
              <DialogDescription>
                Generate a password reset link for {resetPasswordDialog.userEmail}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {resetToken ? (
                <div className="space-y-2">
                  <Label>Password Reset Link</Label>
                  <div className="flex gap-2">
                    <Input value={resetToken} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(resetToken);
                        toast({
                          title: 'Copied',
                          description: 'Reset link copied to clipboard.',
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link with the user. It will expire in 1 hour.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click "Generate Reset Link" to create a password reset link for this user.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setResetPasswordDialog({ open: false, userId: null, userEmail: null });
                setResetToken(null);
              }}>
                {resetToken ? 'Close' : 'Cancel'}
              </Button>
              {!resetToken && (
                <Button onClick={handleResetPassword}>Generate Reset Link</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
