import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { AlertDialog } from '@/components/common/AlertDialog';
import { User, Search, Edit, Trash2, Plus, Shield, Mail, Calendar } from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface RoleData {
  id: number;
  name: string;
  description: string;
}

export const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Create/Edit User Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [userFormData, setUserFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'viewer',
    defaultMenuItem: '',
  });

  // Alert Dialog
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [pagination.page]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/admin/roles');
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm || undefined,
        },
      });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await api.delete(`/admin/users/${userToDelete.id}`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
      
      setAlertDialog({
        isOpen: true,
        title: 'User Deleted',
        message: 'User has been successfully deleted.',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Delete Failed',
        message: error.response?.data?.error || 'Failed to delete user',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { isActive: !isActive });
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to update user status:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Update Failed',
        message: error.response?.data?.error || 'Failed to update user status',
        type: 'error',
      });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setUserFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'viewer',
      defaultMenuItem: '',
    });
    setShowUserModal(true);
  };

  const handleOpenEditModal = (user: UserData) => {
    setEditingUser(user);
    setUserFormData({
      email: user.email,
      password: '', // Don't populate password for edit
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      defaultMenuItem: '',
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      setSaving(true);
      
      if (editingUser) {
        // Update existing user
        await api.put(`/admin/users/${editingUser.id}`, userFormData);
      } else {
        // Create new user
        await api.post('/admin/users', userFormData);
      }
      
      setShowUserModal(false);
      fetchUsers();
      
      setAlertDialog({
        isOpen: true,
        title: editingUser ? 'User Updated' : 'User Created',
        message: editingUser 
          ? 'User has been successfully updated.' 
          : 'User has been successfully created.',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Failed to save user:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Save Failed',
        message: error.response?.data?.error || 'Failed to save user',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
        </div>
        <Button 
          onClick={handleOpenCreateModal}
          className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        {users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                            {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email.split('@')[0]}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={user.role === 'admin' ? 'error' : 'default'}>
                          <Shield className="w-3 h-3 mr-1" />
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          className="focus:outline-none"
                        >
                          <Badge variant={user.isActive ? 'success' : 'default'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>No users found</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try a different search term</p>
            )}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete user <strong>{userToDelete?.email}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              isLoading={deleting}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => !saving && setShowUserModal(false)}
        title={editingUser ? 'Edit User' : 'Create New User'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={userFormData.firstName}
              onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
              placeholder="John"
            />
            <Input
              label="Last Name"
              value={userFormData.lastName}
              onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
              placeholder="Doe"
            />
          </div>
          
          <Input
            label="Email"
            type="email"
            value={userFormData.email}
            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
            placeholder="user@example.com"
            required
            disabled={!!editingUser}
          />
          
          <Input
            label={editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            value={userFormData.password}
            onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
            placeholder="••••••••"
            required={!editingUser}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={userFormData.role}
              onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {roles.find(r => r.name === userFormData.role)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Landing Page (Optional)
            </label>
            <select
              value={userFormData.defaultMenuItem}
              onChange={(e) => setUserFormData({ ...userFormData, defaultMenuItem: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Use role default</option>
              <option value="dashboard">Dashboard</option>
              <option value="history">History</option>
              <option value="processing">Processing</option>
              <option value="prompts">Prompts</option>
              <option value="profile">Profile</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Page to show after login (viewers default to History)
            </p>
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setShowUserModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              isLoading={saving}
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
};

