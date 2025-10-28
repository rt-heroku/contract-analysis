import React, { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { AlertDialog } from '@/components/common/AlertDialog';
import { FileText, Network, Save, GitBranch, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

interface Action {
  id: number;
  name: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  actionType: string;
  isSystem: boolean;
  isActive: boolean;
}

const iconMap: Record<string, any> = {
  FileText,
  Network,
  Save,
  GitBranch,
  RefreshCw,
};

export const Actions: React.FC = () => {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/actions');
      setActions(response.data.actions || []);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load actions',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredActions = filter === 'all' 
    ? actions 
    : actions.filter(a => a.category === filter);

  const categories = [...new Set(actions.map(a => a.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading actions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Action Library</h1>
        <p className="text-gray-600 mt-1">Available actions for building processes</p>
      </div>

      <div className="mb-6 flex space-x-2">
        <Button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}
        >
          All
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            onClick={() => setFilter(cat)}
            className={filter === cat ? 'bg-blue-600 text-white' : 'bg-gray-200'}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredActions.map((action) => {
          const IconComponent = iconMap[action.icon] || FileText;
          
          return (
            <Card key={action.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-3">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: action.color + '20' }}
                >
                  <IconComponent
                    className="w-6 h-6"
                    style={{ color: action.color }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">{action.displayName}</h3>
                    <Badge variant={action.isSystem ? 'default' : 'success'}>
                      {action.isSystem ? 'System' : 'Custom'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                  <div className="mt-3 text-xs text-gray-500">
                    Category: <span className="font-medium">{action.category}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

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

