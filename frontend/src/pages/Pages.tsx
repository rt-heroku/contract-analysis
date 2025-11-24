import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Edit, Trash2, Eye, Download, Upload, FileText } from 'lucide-react';
import api from '@/lib/api';

interface DynamicPage {
  id: number;
  name: string;
  slug: string;
  description?: string;
  status: string;
  createdAt: string;
  creator?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export const Pages: React.FC = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState<DynamicPage[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pages');
      setPages(response.data.pages || []);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load pages',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (page: DynamicPage) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Page',
      message: `Are you sure you want to delete "${page.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.delete(`/pages/${page.id}`);
          setAlertDialog({
            isOpen: true,
            title: 'Success',
            message: 'Page deleted successfully',
            type: 'success',
          });
          loadPages();
        } catch (error: any) {
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: error.response?.data?.error || 'Failed to delete page',
            type: 'error',
          });
        }
      },
    });
  };

  const handleExport = async (page: DynamicPage) => {
    try {
      const response = await api.get(`/pages/${page.id}/export`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${page.slug}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Page exported successfully',
        type: 'success',
      });
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to export page',
        type: 'error',
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const pageData = JSON.parse(text);

      // Import as a new page (remove ID)
      const { id, createdAt, updatedAt, createdBy, lastModifiedBy, ...importData } = pageData;

      await api.post('/pages/import', { pages: [importData] });

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Page imported successfully',
        type: 'success',
      });

      loadPages();
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to import page. Please check the file format.',
        type: 'error',
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600 dark:text-gray-400">Loading pages...</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pages</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage custom dynamic pages
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => navigate('/page-builder')}>
              <Plus className="w-4 h-4 mr-2" />
              New Page
            </Button>
          </div>
        </div>

        {pages.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No pages yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by creating your first custom page
              </p>
              <Button onClick={() => navigate('/page-builder')}>
                Create Page
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <Card key={page.id}>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {page.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      /{page.slug}
                    </p>
                    {page.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {page.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      By {page.creator?.firstName || page.creator?.email || 'Unknown'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(page.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/page/${page.slug}`)}
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/page-builder/${page.id}`)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(page)}
                      title="Export"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(page)}
                      title="Delete"
                      className="ml-auto"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

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
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </>
  );
};

