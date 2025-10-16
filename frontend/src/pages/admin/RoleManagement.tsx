import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loading } from '@/components/common/Loading';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Shield, Plus, Edit, Trash2, Save, Users as UsersIcon, Check } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  description?: string;
  category: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  rolePermissions?: { permission: Permission }[];
  _count?: { userRoles: number };
}

export const RoleManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
  });

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

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/roles'),
        api.get('/roles/permissions/by-category'),
      ]);
      setRoles(rolesRes.data.roles);
      setPermissions(permsRes.data.permissions);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load roles and permissions',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = async (role: Role) => {
    try {
      setSelectedRole(role);
      const response = await api.get(`/roles/${role.id}/permissions`);
      const permissionIds = response.data.permissions.map((p: any) => p.permissionId);
      setSelectedPermissions(permissionIds);
    } catch (error) {
      console.error('Failed to fetch role permissions:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load role permissions',
        type: 'error',
      });
    }
  };

  const handleTogglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAll = (category: string) => {
    const categoryPermissions = permissions[category];
    const allSelected = categoryPermissions.every((p) => selectedPermissions.includes(p.id));
    
    if (allSelected) {
      // Deselect all in category
      setSelectedPermissions((prev) =>
        prev.filter((id) => !categoryPermissions.some((p) => p.id === id))
      );
    } else {
      // Select all in category
      const newPermissions = categoryPermissions
        .filter((p) => !selectedPermissions.includes(p.id))
        .map((p) => p.id);
      setSelectedPermissions((prev) => [...prev, ...newPermissions]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      await api.post('/roles/permissions/bulk-update', {
        roleId: selectedRole.id,
        permissionIds: selectedPermissions,
      });

      await fetchData();
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Role permissions updated successfully',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Failed to save permissions:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to save permissions',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOrUpdateRole = async () => {
    try {
      if (!roleFormData.name) {
        setAlertDialog({
          isOpen: true,
          title: 'Validation Error',
          message: 'Role name is required',
          type: 'error',
        });
        return;
      }

      setSaving(true);

      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, roleFormData);
      } else {
        await api.post('/roles', roleFormData);
      }

      await fetchData();
      resetRoleForm();

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Role ${editingRole ? 'updated' : 'created'} successfully`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Failed to save role:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to save role',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = (role: Role) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Role',
      message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.${
        role._count?.userRoles ? ` This role is assigned to ${role._count.userRoles} user(s).` : ''
      }`,
      onConfirm: async () => {
        try {
          await api.delete(`/roles/${role.id}`);
          await fetchData();
          if (selectedRole?.id === role.id) {
            setSelectedRole(null);
            setSelectedPermissions([]);
          }
          setAlertDialog({
            isOpen: true,
            title: 'Success',
            message: 'Role deleted successfully',
            type: 'success',
          });
        } catch (error: any) {
          console.error('Failed to delete role:', error);
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Failed to delete role',
            type: 'error',
          });
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description || '',
    });
    setShowRoleForm(true);
  };

  const resetRoleForm = () => {
    setEditingRole(null);
    setRoleFormData({ name: '', description: '' });
    setShowRoleForm(false);
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Role Management
          </h1>
          <p className="text-gray-600 mt-1">Manage roles and their permissions</p>
        </div>
        <Button
          onClick={() => setShowRoleForm(true)}
          className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </Button>
      </div>

      {/* Create/Edit Role Form */}
      {showRoleForm && (
        <Card title={editingRole ? 'Edit Role' : 'Create Role'}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Name *
              </label>
              <Input
                value={roleFormData.name}
                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                placeholder="e.g., manager, analyst"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Input
                value={roleFormData.description}
                onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                placeholder="Brief description of the role"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={handleCreateOrUpdateRole}
                isLoading={saving}
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingRole ? 'Update' : 'Create'}
              </Button>
              <Button onClick={resetRoleForm} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <Card title="Roles" className="lg:col-span-1">
          <div className="space-y-2">
            {roles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No roles yet</p>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedRole?.id === role.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectRole(role)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 capitalize flex items-center gap-2">
                        {role.name}
                        {role._count && role._count.userRoles > 0 && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <UsersIcon className="w-3 h-3" />
                            {role._count.userRoles}
                          </span>
                        )}
                      </h4>
                      {role.description && (
                        <p className="text-xs text-gray-600 mt-1">{role.description}</p>
                      )}
                      {role.rolePermissions && (
                        <p className="text-xs text-gray-500 mt-1">
                          {role.rolePermissions.length} permission{role.rolePermissions.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRole(role);
                        }}
                        className="p-1"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role);
                        }}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Permissions Editor */}
        <div className="lg:col-span-2">
          {!selectedRole ? (
            <Card>
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Select a role to manage its permissions</p>
              </div>
            </Card>
          ) : (
            <Card title={`Permissions for ${selectedRole.name.charAt(0).toUpperCase() + selectedRole.name.slice(1)}`}>
              <div className="flex justify-end mb-4">
                <Button
                  onClick={handleSavePermissions}
                  isLoading={saving}
                  disabled={saving}
                  className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Permissions
                </Button>
              </div>
              <div className="space-y-6">
                {Object.entries(permissions).map(([category, perms]) => {
                  const allSelected = perms.every((p) => selectedPermissions.includes(p.id));

                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{category}</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectAll(category)}
                          className="flex items-center gap-2"
                        >
                          <Check className="w-3 h-3" />
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {perms.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-start gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission.id)}
                              onChange={() => handleTogglePermission(permission.id)}
                              className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {permission.name.split('.').pop()?.replace(/_/g, ' ')}
                              </div>
                              {permission.description && (
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </div>
  );
};

