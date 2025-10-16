import { useAuth } from '@/context/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes('admin') || false;
  const isUser = user?.roles?.includes('user') || false;
  const isViewer = user?.roles?.includes('viewer') || false;

  // Permission checks
  const can = {
    // Processing permissions
    processDocuments: isAdmin || isUser,
    uploadFiles: isAdmin || isUser,
    
    // Analysis permissions
    viewAnalysis: true, // Everyone can view
    deleteAnalysis: isAdmin,
    rerunAnalysis: isAdmin || isUser, // Viewers can rerun but without calling MuleSoft
    exportPDF: true, // Everyone can export
    
    // Document library permissions
    viewDocuments: true, // Everyone can view
    uploadDocuments: isAdmin || isUser,
    deleteDocuments: isAdmin || isUser,
    analyzeDocuments: isAdmin || isUser,
    downloadDocuments: true, // Everyone can download
    
    // Prompt permissions
    viewPrompts: true, // Everyone can view
    createPrompts: isAdmin,
    editPrompts: isAdmin,
    deletePrompts: isAdmin,
    setDefaultPrompt: isAdmin,
    
    // Flow permissions
    viewFlows: isAdmin,
    createFlows: isAdmin,
    editFlows: isAdmin,
    deleteFlows: isAdmin,
    
    // User management
    viewUsers: isAdmin,
    createUsers: isAdmin,
    editUsers: isAdmin,
    deleteUsers: isAdmin,
    
    // Profile permissions
    editProfile: isAdmin || isUser, // Viewers have read-only
    requestPermissions: isViewer, // Only viewers can request permissions
    
    // Admin permissions
    viewAdminPanel: isAdmin,
    viewLogs: isAdmin,
    viewSessions: isAdmin,
    manageSettings: isAdmin,
  };

  return {
    isAdmin,
    isUser,
    isViewer,
    can,
  };
};

