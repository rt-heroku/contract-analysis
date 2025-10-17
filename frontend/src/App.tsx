// import React from 'react'; // Not needed with new JSX transform
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Processing } from './pages/Processing';
import { AnalysisDetails } from './pages/AnalysisDetails';
import { IDPResponse } from './pages/IDPResponse';
import { Settings } from './pages/Settings';
import { Prompts } from './pages/Prompts';
import { Flows } from './pages/Flows';
import { History } from './pages/History';
import { Profile } from './pages/Profile';
import { Notifications } from './pages/Notifications';
import { Documents } from './pages/Documents';
import { IdpExecutions } from './pages/IdpExecutions';
import { Logs } from './pages/admin/Logs';
import { UserManagement } from './pages/admin/UserManagement';
import { RoleManagement } from './pages/admin/RoleManagement';
import { MenuManagement } from './pages/admin/MenuManagement';

const App = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/processing" element={<MainLayout><Processing /></MainLayout>} />
            <Route path="/documents" element={<MainLayout><Documents /></MainLayout>} />
            <Route path="/prompts" element={<MainLayout><Prompts /></MainLayout>} />
            <Route path="/flows" element={<MainLayout><Flows /></MainLayout>} />
            <Route path="/idp-executions" element={<MainLayout><IdpExecutions /></MainLayout>} />
            <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
            <Route path="/history" element={<MainLayout><History /></MainLayout>} />
            <Route path="/idp-response/:analysisRecordId" element={<MainLayout><IDPResponse /></MainLayout>} />
            <Route path="/analysis/:id" element={<MainLayout><AnalysisDetails /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
            <Route path="/notifications" element={<MainLayout><Notifications /></MainLayout>} />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={<MainLayout><UserManagement /></MainLayout>} />
            <Route path="/admin/roles" element={<MainLayout><RoleManagement /></MainLayout>} />
            <Route path="/admin/menu" element={<MainLayout><MenuManagement /></MainLayout>} />
            <Route path="/admin/logs" element={<MainLayout><Logs /></MainLayout>} />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;

