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
import { Settings } from './pages/Settings';
import { Prompts } from './pages/Prompts';
import { History } from './pages/History';
import { Profile } from './pages/Profile';

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
            <Route path="/prompts" element={<MainLayout><Prompts /></MainLayout>} />
            <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
            <Route path="/history" element={<MainLayout><History /></MainLayout>} />
            <Route path="/analysis/:id" element={<MainLayout><AnalysisDetails /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
            <Route path="/notifications" element={<MainLayout><div className="p-8">Notifications - Coming Soon</div></MainLayout>} />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={<MainLayout><div className="p-8">User Management - Coming Soon</div></MainLayout>} />
            <Route path="/admin/logs" element={<MainLayout><div className="p-8">System Logs - Coming Soon</div></MainLayout>} />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;

