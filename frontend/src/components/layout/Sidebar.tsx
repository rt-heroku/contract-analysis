import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { MenuItem } from '@/types';
import { 
  Home, User, FileText, History, CreditCard, 
  Shield, Settings, ChevronDown, ChevronRight, Folder, GitBranch
} from 'lucide-react';
import { cn } from '@/utils/helpers';

const iconMap: any = {
  home: Home,
  user: User,
  'file-text': FileText,
  history: History,
  'credit-card': CreditCard,
  shield: Shield,
  settings: Settings,
  folder: Folder,
  'git-branch': GitBranch,
};

export const Sidebar: React.FC = () => {
  const { sidebarOpen } = useApp();
  const { user } = useAuth();
  const location = useLocation();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [appName, setAppName] = useState('DocProcess');
  const [appLogo, setAppLogo] = useState('');

  // Fetch app settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings/public');
        const settings = response.data.settings;
        if (settings.app_name) setAppName(settings.app_name);
        if (settings.app_logo_url) setAppLogo(settings.app_logo_url);
      } catch (error) {
        // Use defaults
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // Default menu as fallback (basic items only - admin items come from database)
    const defaultMenu = [
      { id: 1, title: 'Dashboard', icon: 'home', route: '/dashboard', orderIndex: 1, isActive: true, children: [] },
      { id: 2, title: 'Processing', icon: 'file-text', route: '/processing', orderIndex: 2, isActive: true, children: [] },
      { id: 3, title: 'Prompts', icon: 'file-text', route: '/prompts', orderIndex: 3, isActive: true, children: [] },
      { id: 4, title: 'History', icon: 'history', route: '/history', orderIndex: 5, isActive: true, children: [] },
      { id: 5, title: 'Profile', icon: 'user', route: '/profile', orderIndex: 6, isActive: true, children: [] },
    ];

    const fetchMenu = async () => {
      try {
        const response = await api.get('/system/menu');
        console.log('📋 Menu API Response:', response.data);
        
        const menu = response.data.menu && response.data.menu.length > 0 ? response.data.menu : defaultMenu;
        console.log('📋 Menu to display:', menu);
        console.log('📋 Final menu items:', menu);
        setMenuItems(menu);
      } catch (error) {
        console.error('❌ Error fetching menu:', error);
        // Silently fall back to default menu
        setMenuItems(defaultMenu);
      }
    };

    if (user) {
      fetchMenu();
    } else {
      // Show limited menu when not logged in
      setMenuItems([
        { id: 1, title: 'Dashboard', icon: 'home', route: '/dashboard', orderIndex: 1, isActive: true, children: [] },
        { id: 2, title: 'Processing', icon: 'file-text', route: '/processing', orderIndex: 2, isActive: true, children: [] },
      ]);
    }
  }, [user]);

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const Icon = iconMap[item.icon || 'file-text'] || FileText;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.route ? location.pathname === item.route : false;

    return (
      <div key={item.id}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors',
              depth > 0 && 'pl-12'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="flex-1 text-left font-medium">{item.title}</span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <Link
            to={item.route || '#'}
            className={cn(
              'flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors',
              isActive && 'bg-primary-50 text-primary-700 border-r-4 border-primary-600',
              depth > 0 && 'pl-12'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.title}</span>
          </Link>
        )}

        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {appLogo ? (
            <img 
              src={appLogo} 
              alt={appName} 
              className="h-8 w-8 object-contain"
              onError={(e) => {
                // Fallback to icon if image fails
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="font-bold text-lg text-gray-900">{appName}</span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-gray-500">Powered by</span>
          <img 
            src="/images/logos/MuleSoft-RGB-icon.png" 
            alt="MuleSoft" 
            className="h-6 w-6 object-contain"
            onError={(e) => {
              // Hide image if it fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="text-xs text-gray-500 font-medium">MuleSoft</span>
        </div>
      </div>
    </aside>
  );
};

