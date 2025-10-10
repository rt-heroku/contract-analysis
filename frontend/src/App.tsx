import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Processing } from './pages/Processing';
import { AnalysisDetails } from './pages/AnalysisDetails';

function App() {
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
            <Route path="/profile" element={<MainLayout><div className="p-8">Profile - Coming Soon</div></MainLayout>} />
            <Route path="/history" element={<MainLayout><div className="p-8">History - Coming Soon</div></MainLayout>} />
            <Route path="/analysis/:id" element={<MainLayout><AnalysisDetails /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><div className="p-8">Settings - Coming Soon</div></MainLayout>} />
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
}

export default App;

