import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Loading } from '@/components/common/Loading';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  console.log('🏗️ [MainLayout] Render - isLoading:', isLoading, 'user:', user?.email);

  if (isLoading) {
    console.log('🏗️ [MainLayout] Still loading...');
    return <Loading fullScreen text="Loading..." />;
  }

  if (!user) {
    console.log('🏗️ [MainLayout] No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('🏗️ [MainLayout] User authenticated, rendering layout');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto">
            <div className="container mx-auto px-4 pt-6 pb-2">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

