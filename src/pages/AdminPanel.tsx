import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Shield, Activity, Search, MoreVertical, CheckCircle, XCircle, Loader2, Edit, Key, UserX, UserCheck, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import * as api from '@/lib/api';
import type { AuditLog, User } from '@/lib/api';
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
import { getClientIpAddress, getCachedClientIp } from '@/lib/ip-address';
import { sendEmailOtp } from '@/lib/email-otp';
import { Badge } from '@/components/ui/badge';

export default function AdminPanel() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const { toast } = useToast();

  // Filter states for Users
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | 'all'>('all');
  const [userMfaFilter, setUserMfaFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Filter states for Audit Logs
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logDateFilter, setLogDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Modal states
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [editEmail, setEditEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('StandardUser');
  const [actionLoading, setActionLoading] = useState(false);

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
          toast({
            title: 'Error',
            description: 'Failed to load users',
            variant: 'destructive',
          });
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
          toast({
            title: 'Error',
            description: 'Failed to load audit logs',
            variant: 'destructive',
          });
        } finally {
          setLogsLoading(false);
        }
      }
    };

    loadData();
  }, [activeTab, toast]);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditEmail(user.email);
    setEditUserOpen(true);
  };

  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setChangeRoleOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetPasswordOpen(true);
  };

  const handleDeactivate = (user: User) => {
    setSelectedUser(user);
    setDeactivateOpen(true);
  };

  const saveEditUser = async () => {
    if (!selectedUser || !editEmail.trim()) return;

    try {
      setActionLoading(true);
      await api.updateUserEmail(selectedUser.id, editEmail.trim());
      
      // Create audit log
      let ipAddress = getCachedClientIp();
      if (!ipAddress) {
        ipAddress = await getClientIpAddress();
      }
      const userAgent = navigator.userAgent;
      await api.createAuditLog(
        user?.id || null,
        `Updated user email: ${selectedUser.email} -> ${editEmail.trim()}`,
        ipAddress,
        userAgent
      );

      toast({
        title: 'Success',
        description: 'User email updated successfully',
      });

      // Reload users
      const users = await api.getAllUsers();
      setUsersList(users);
      setEditUserOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user email',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const saveChangeRole = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await api.updateUserRole(selectedUser.id, selectedRole);
      
      // Create audit log
      let ipAddress = getCachedClientIp();
      if (!ipAddress) {
        ipAddress = await getClientIpAddress();
      }
      const userAgent = navigator.userAgent;
      await api.createAuditLog(
        user?.id || null,
        `Changed user role: ${selectedUser.email} -> ${selectedRole}`,
        ipAddress,
        userAgent
      );

      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });

      // Reload users
      const users = await api.getAllUsers();
      setUsersList(users);
      setChangeRoleOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmResetPassword = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const token = await api.adminResetPassword(selectedUser.id);
      
      // Create reset link
      const resetLink = `${window.location.origin}/reset-password?token=${token}`;
      
      // Send email with reset link
      const emailSent = await sendEmailOtp(
        selectedUser.email,
        `Password Reset Link: ${resetLink}`,
        {
          subject: 'Password Reset Request (Admin Initiated)',
        }
      );

      if (emailSent) {
        // Create audit log
        let ipAddress = getCachedClientIp();
        if (!ipAddress) {
          ipAddress = await getClientIpAddress();
        }
        const userAgent = navigator.userAgent;
        await api.createAuditLog(
          user?.id || null,
          `Password reset initiated for: ${selectedUser.email}`,
          ipAddress,
          userAgent
        );

        toast({
          title: 'Success',
          description: 'Password reset email sent successfully',
        });
      } else {
        throw new Error('Failed to send email');
      }

      setResetPasswordOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeactivate = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const isCurrentlyActive = selectedUser.isActive !== false;
      
      if (isCurrentlyActive) {
        await api.deactivateUser(selectedUser.id);
      } else {
        await api.activateUser(selectedUser.id);
      }

      // Create audit log
      let ipAddress = getCachedClientIp();
      if (!ipAddress) {
        ipAddress = await getClientIpAddress();
      }
      const userAgent = navigator.userAgent;
      await api.createAuditLog(
        user?.id || null,
        `${isCurrentlyActive ? 'Deactivated' : 'Activated'} user: ${selectedUser.email}`,
        ipAddress,
        userAgent
      );

      toast({
        title: 'Success',
        description: `User ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully`,
      });

      // Reload users
      const users = await api.getAllUsers();
      setUsersList(users);
      setDeactivateOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `Failed to ${selectedUser.isActive !== false ? 'deactivate' : 'activate'} user`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

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

  // Filter users based on all criteria
  const filteredUsers = usersList.filter((u) => {
    // Search filter
    const matchesSearch = u.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Role filter
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    
    // MFA filter
    const matchesMfa = 
      userMfaFilter === 'all' || 
      (userMfaFilter === 'enabled' && u.mfaEnabled) ||
      (userMfaFilter === 'disabled' && !u.mfaEnabled);
    
    // Status filter
    const matchesStatus = 
      userStatusFilter === 'all' ||
      (userStatusFilter === 'active' && u.isActive !== false) ||
      (userStatusFilter === 'inactive' && u.isActive === false);
    
    return matchesSearch && matchesRole && matchesMfa && matchesStatus;
  });

  // Filter audit logs based on criteria
  const getDateFilterStart = () => {
    const now = new Date();
    switch (logDateFilter) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  };

  const filteredAuditLogs = auditLogs.filter((log) => {
    // Search filter (action or user)
    const matchesSearch = 
      !logSearchQuery.trim() ||
      log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(logSearchQuery.toLowerCase());
    
    // Date filter
    const dateFilterStart = getDateFilterStart();
    const matchesDate = 
      !dateFilterStart ||
      new Date(log.createdAt) >= dateFilterStart;
    
    return matchesSearch && matchesDate;
  });

  // Count active filters
  const activeUserFilters = [
    userRoleFilter !== 'all',
    userMfaFilter !== 'all',
    userStatusFilter !== 'all',
    searchQuery.trim() !== '',
  ].filter(Boolean).length;

  const activeLogFilters = [
    logDateFilter !== 'all',
    logSearchQuery.trim() !== '',
  ].filter(Boolean).length;

  const clearUserFilters = () => {
    setUserRoleFilter('all');
    setUserMfaFilter('all');
    setUserStatusFilter('all');
    setSearchQuery('');
  };

  const clearLogFilters = () => {
    setLogDateFilter('all');
    setLogSearchQuery('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1 capitalize">
            Manage Users, Roles, And View Audit Logs
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
        </div>

        {activeTab === 'users' ? (
          <div className="glass rounded-xl p-6">
            {/* Filters Section */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters</span>
                  {activeUserFilters > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeUserFilters} active
                    </Badge>
                  )}
                </div>
                {activeUserFilters > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearUserFilters}
                    className="h-8 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Role Filter */}
                <Select value={userRoleFilter} onValueChange={(value) => setUserRoleFilter(value as UserRole | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="StandardUser">Standard User</SelectItem>
                    <SelectItem value="RestrictedUser">Restricted User</SelectItem>
                  </SelectContent>
                </Select>

                {/* MFA Filter */}
                <Select value={userMfaFilter} onValueChange={(value) => setUserMfaFilter(value as 'all' | 'enabled' | 'disabled')}>
                  <SelectTrigger>
                    <SelectValue placeholder="MFA Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All MFA Status</SelectItem>
                    <SelectItem value="enabled">MFA Enabled</SelectItem>
                    <SelectItem value="disabled">MFA Disabled</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={userStatusFilter} onValueChange={(value) => setUserStatusFilter(value as 'all' | 'active' | 'inactive')}>
                  <SelectTrigger>
                    <SelectValue placeholder="User Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {usersList.length} users
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
                        Status
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
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
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
                          <td className="py-4 px-4">
                            {u.isActive !== false ? (
                              <span className="inline-flex items-center gap-1 text-xs text-success">
                                <UserCheck className="h-4 w-4" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-destructive">
                                <UserX className="h-4 w-4" />
                                Inactive
                              </span>
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
                                <DropdownMenuItem onClick={() => handleEditUser(u)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeRole(u)}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Change Role
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetPassword(u)}>
                                  <Key className="h-4 w-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeactivate(u)}
                                >
                                  {u.isActive !== false ? (
                                    <>
                                      <UserX className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Activate
                                    </>
                                  )}
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
        ) : (
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6">Recent Activity</h2>
            
            {/* Audit Log Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters</span>
                  {activeLogFilters > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeLogFilters} active
                    </Badge>
                  )}
                </div>
                {activeLogFilters > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearLogFilters}
                    className="h-8 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by action or user..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Date Filter */}
                <Select value={logDateFilter} onValueChange={(value) => setLogDateFilter(value as 'all' | 'today' | '7days' | '30days')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredAuditLogs.length} of {auditLogs.length} audit logs
            </div>

            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAuditLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {auditLogs.length === 0 ? 'No audit logs found' : 'No audit logs match your filters'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAuditLogs.map((log) => (
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
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the email address for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditUser} disabled={actionLoading || !editEmail.trim()}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleOpen} onOpenChange={setChangeRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                <SelectTrigger id="role">
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
            <Button variant="outline" onClick={() => setChangeRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveChangeRole} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the password for {selectedUser?.email}? 
              A password reset link will be sent to their email address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate/Activate Dialog */}
      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.isActive !== false ? 'Deactivate User' : 'Activate User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selectedUser?.isActive !== false ? 'deactivate' : 'activate'} {selectedUser?.email}? 
              {selectedUser?.isActive !== false 
                ? ' The user will not be able to log in until reactivated.'
                : ' The user will be able to log in again.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeactivate} 
              disabled={actionLoading}
              className={selectedUser?.isActive !== false ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                selectedUser?.isActive !== false ? 'Deactivate' : 'Activate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
