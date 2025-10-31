import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Play, Edit, Trash2, Copy, FormInput } from 'lucide-react';
import api from '@/lib/api';

interface Process {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  executionMode: string;
  triggerType: string;
  isActive: boolean;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
  _count: {
    processExecutions: number;
  };
}

export const Processes: React.FC = () => {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
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
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/processes');
      setProcesses(response.data.processes || []);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load processes',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Process',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.delete(`/processes/${id}`);
          setAlertDialog({
            isOpen: true,
            title: 'Success',
            message: 'Process deleted successfully',
            type: 'success',
          });
          loadProcesses();
        } catch (error: any) {
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Failed to delete process',
            type: 'error',
          });
        }
      },
    });
  };

  const handleExecute = async (id: number, name: string) => {
    try {
      await api.post(`/processes/${id}/execute`, {});
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `Process "${name}" execution started`,
        type: 'success',
      });
      setTimeout(() => navigate('/executions'), 1500);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to execute process',
        type: 'error',
      });
    }
  };

  const handleClone = async (id: number, name: string) => {
    try {
      await api.post(`/processes/${id}/clone`, { name: `${name} (Copy)` });
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Process cloned successfully',
        type: 'success',
      });
      loadProcesses();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to clone process',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading processes...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Processes</h1>
          <p className="text-gray-600 mt-1">Create and manage automated workflows</p>
        </div>
        <Button
          onClick={() => navigate('/process-designer')}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-5 h-5" />
          <span>New Process</span>
        </Button>
      </div>

      {processes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No processes yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first process</p>
            <Button onClick={() => navigate('/process-designer')} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create Process
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {processes.map((process) => (
            <Card key={process.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{process.name}</h3>
                  {process.description && (
                    <p className="text-sm text-gray-600 mb-2">{process.description}</p>
                  )}
                </div>
                <Badge variant={process.isActive ? 'success' : 'default'}>
                  {process.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="font-medium capitalize">{process.executionMode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trigger:</span>
                  <span className="font-medium">
                    {process.triggerType === 'manual' && '🖱️ Manual'}
                    {process.triggerType === 'ui_form' && '📋 UI Form'}
                    {process.triggerType === 'api' && '🔗 API'}
                    {process.triggerType === 'schedule' && '⏰ Schedule'}
                    {process.triggerType === 'event' && '⚡ Event'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Executions:</span>
                  <span className="font-medium">{process._count.processExecutions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created by:</span>
                  <span className="font-medium">
                    {process.creator.firstName} {process.creator.lastName}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                {process.triggerType === 'ui_form' ? (
                  <Button
                    onClick={() => navigate(`/process/trigger/${process.id}`)}
                    className="flex-1 flex items-center justify-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white text-sm py-2"
                  >
                    <FormInput className="w-4 h-4" />
                    <span>Open Form</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleExecute(process.id, process.name)}
                    className="flex-1 flex items-center justify-center space-x-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Run</span>
                  </Button>
                )}
                <Button
                  onClick={() => navigate(`/process-designer/${process.id}`)}
                  className="flex items-center justify-center px-3 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleClone(process.id, process.name)}
                  className="flex items-center justify-center px-3 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(process.id, process.name)}
                  className="flex items-center justify-center px-3 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />

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

