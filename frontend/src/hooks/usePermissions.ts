import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export const usePermissions = () => {
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes('admin') || false;
  const isUser = user?.roles?.includes('user') || false;
  const isViewer = user?.roles?.includes('viewer') || false;

  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user permissions from database
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await api.get('/roles/me/permissions');
        const permissionNames = response.data.permissions.map((p: any) => p.name);
        setUserPermissions(permissionNames);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        // Fall back to empty array if API fails
        setUserPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPermissions();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Helper function to check if user has a specific permission
  const hasPermission = (permissionName: string) => {
    return userPermissions.includes(permissionName);
  };

  // Permission checks using database permissions
  const can = {
    // Processing permissions
    processDocuments: hasPermission('documents.process'),
    uploadFiles: hasPermission('documents.upload'),
    
    // Analysis permissions
    viewAnalysis: hasPermission('analysis.view'),
    deleteAnalysis: hasPermission('analysis.delete'),
    rerunAnalysis: hasPermission('analysis.rerun'),
    shareAnalysis: hasPermission('analysis.share'),
    exportPDF: hasPermission('analysis.view'), // Can export if can view
    
    // Document library permissions
    viewDocuments: hasPermission('documents.download'),
    uploadDocuments: hasPermission('documents.upload'),
    deleteDocuments: hasPermission('documents.delete'),
    analyzeDocuments: hasPermission('documents.analyze'),
    downloadDocuments: hasPermission('documents.download'),
    
    // Prompt permissions
    viewPrompts: hasPermission('prompts.view'),
    createPrompts: hasPermission('prompts.create'),
    editPrompts: hasPermission('prompts.edit'),
    deletePrompts: hasPermission('prompts.delete'),
    setDefaultPrompt: hasPermission('prompts.set_default'),
    
    // Flow permissions
    viewFlows: hasPermission('flows.view'),
    createFlows: hasPermission('flows.create'),
    editFlows: hasPermission('flows.edit'),
    deleteFlows: hasPermission('flows.delete'),
    
    // User management
    viewUsers: hasPermission('admin.users.view'),
    createUsers: hasPermission('admin.users.create'),
    editUsers: hasPermission('admin.users.edit'),
    deleteUsers: hasPermission('admin.users.delete'),
    
    // Role management
    viewRoles: hasPermission('admin.roles.view'),
    createRoles: hasPermission('admin.roles.create'),
    editRoles: hasPermission('admin.roles.edit'),
    deleteRoles: hasPermission('admin.roles.delete'),
    
    // Menu management
    viewMenu: hasPermission('admin.menu.view'),
    createMenu: hasPermission('admin.menu.create'),
    editMenu: hasPermission('admin.menu.edit'),
    deleteMenu: hasPermission('admin.menu.delete'),
    assignMenu: hasPermission('admin.menu.assign'),
    
    // Profile permissions
    viewProfile: hasPermission('profile.view'),
    editProfile: hasPermission('profile.edit'),
    changePassword: hasPermission('profile.change_password'),
    requestPermissions: hasPermission('profile.request_permissions'),
    
    // Admin permissions
    viewAdminPanel: hasPermission('admin.users.view') || hasPermission('admin.roles.view') || hasPermission('admin.menu.view'),
    viewLogs: hasPermission('admin.logs.view'),
    viewSettings: hasPermission('admin.settings.view'),
    manageSettings: hasPermission('admin.settings.edit'),
  };

  return {
    isAdmin,
    isUser,
    isViewer,
    can,
    loading,
    hasPermission,
  };
};
