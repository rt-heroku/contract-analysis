import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { Layers } from '@craftjs/layers';
import lz from 'lz-string';
import { ComponentLibrary, Container } from '@/components/craft';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { AlertDialog } from '@/components/common/AlertDialog';
import { Save, Eye, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

const TopBar: React.FC<{
  name: string;
  slug: string;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onSave: () => void;
  onTogglePreview: () => void;
  enabled: boolean;
}> = ({ name, slug, onNameChange, onSlugChange, onSave, onTogglePreview, enabled }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Page Builder</h1>
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Page Name"
          className="w-64"
        />
        <Input
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          placeholder="page-slug"
          className="w-64"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onTogglePreview}>
          <Eye className="w-4 h-4 mr-2" />
          {enabled ? 'Preview' : 'Edit'}
        </Button>
        <Button onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Page
        </Button>
      </div>
    </div>
  );
};

const Toolbox: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
      <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Components</h3>
      <div className="space-y-2">
        {Object.keys(ComponentLibrary).map((key) => (
          <button
            key={key}
            className="w-full p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 text-left font-medium text-sm"
          >
            {key}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100 text-sm">Layers</h3>
        <Layers expandRootOnLoad={true} />
      </div>
    </div>
  );
};

export const PageBuilder: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(true);
  const [name, setName] = useState('New Page');
  const [slug, setSlug] = useState('new-page');
  const [loading, setLoading] = useState(false);
  
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

  useEffect(() => {
    if (id) {
      loadPage(parseInt(id));
    }
  }, [id]);

  const loadPage = async (pageId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/pages/${pageId}`);
      const page = response.data;
      
      setName(page.name);
      setSlug(page.slug);
      
      // Decompress and load page config
      if (page.pageConfig) {
        const decompressed = lz.decompressFromBase64(page.pageConfig);
        if (decompressed) {
          // The Editor will load this via the Frame data prop
          // For now, we just store it in state
        }
      }
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load page',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Get the serialized state from the editor
      const editorState = (window as any).craftjsState;
      if (!editorState) {
        setAlertDialog({
          isOpen: true,
          title: 'Error',
          message: 'No editor state found. Please try again.',
          type: 'error',
        });
        return;
      }

      const json = editorState.query.serialize();
      const compressed = lz.compressToBase64(json);

      if (id) {
        await api.put(`/pages/${id}`, { 
          name, 
          slug, 
          pageConfig: compressed 
        });
      } else {
        await api.post('/pages', { 
          name, 
          slug, 
          pageConfig: compressed 
        });
      }

      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Page saved successfully!',
        type: 'success',
      });

      setTimeout(() => navigate('/pages'), 1500);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to save page',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Editor
        resolver={ComponentLibrary}
        enabled={enabled}
        onRender={(render) => {
          // Store editor state globally for save
          (window as any).craftjsState = render;
        }}
      >
        <div className="h-screen flex flex-col">
          <TopBar
            name={name}
            slug={slug}
            onNameChange={setName}
            onSlugChange={setSlug}
            onSave={handleSave}
            onTogglePreview={() => setEnabled(!enabled)}
            enabled={enabled}
          />

          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Component Toolbox */}
            <div className="w-64">
              <Toolbox />
            </div>

            {/* Main Canvas */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto p-8">
              <Frame>
                <Element
                  is={Container}
                  canvas
                  className="min-h-screen bg-white dark:bg-gray-800 rounded-lg shadow-lg"
                  padding={8}
                >
                  {/* Components will be dropped here */}
                </Element>
              </Frame>
            </div>

            {/* Right Sidebar - Settings Panel */}
            <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
              <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select a component to edit its properties
              </p>
              {/* Component settings will appear here when a component is selected */}
            </div>
          </div>
        </div>
      </Editor>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </>
  );
};

