import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { Layers } from '@craftjs/layers';
import lz from 'lz-string';
import { ComponentLibrary, Container, Column } from '@/components/craft';
import { ComponentToolbar } from '@/components/craft/ComponentToolbar';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { AlertDialog } from '@/components/common/AlertDialog';
import { 
  Save, 
  Eye, 
  Settings as SettingsIcon,
  Square,
  Type,
  MousePointer,
  Image,
  Table,
  Columns as ColumnsIcon,
  AppWindow,
  Box,
  Menu,
  AlignLeft
} from 'lucide-react';
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
  const { connectors } = useEditor();
  const [showText, setShowText] = useState(false);

  // Map component names to icons
  const componentIcons: Record<string, any> = {
    'Container': Box,
    'CraftText': Type,
    'CraftButton': MousePointer,
    'CraftCard': Square,
    'CraftImage': Image,
    'DataTable': Table,
    'Columns': ColumnsIcon,
    'Column': AlignLeft,
    'Modal': AppWindow,
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">Components</h3>
        <button
          onClick={() => setShowText(!showText)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={showText ? 'Show icons only' : 'Show icons with text'}
        >
          <Menu className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      
      <div className={`space-y-2 ${showText ? '' : 'grid grid-cols-2 gap-2'}`}>
        {Object.entries(ComponentLibrary).map(([key, Component]) => {
          const Icon = componentIcons[key] || Box;
          
          // Special handling for Columns component - create with Column children
          if (key === 'Columns') {
            return (
              <button
                key={key}
                ref={(ref) =>
                  ref && connectors.create(
                    ref,
                    <Element is={Component} canvas>
                      <Element is={Column} canvas />
                      <Element is={Column} canvas />
                    </Element>
                  )
                }
                className={`${
                  showText 
                    ? 'w-full p-3 text-left' 
                    : 'aspect-square p-2 flex flex-col items-center justify-center'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}
                title={key}
              >
                <Icon className={`${showText ? 'w-4 h-4 inline-block mr-2' : 'w-6 h-6 mb-1'}`} />
                {showText && <span className="font-medium text-sm">{key}</span>}
                {!showText && <span className="text-xs mt-1 text-center leading-tight">{key}</span>}
              </button>
            );
          }
          
          // Regular components
          return (
            <button
              key={key}
              ref={(ref) =>
                ref && connectors.create(
                  ref,
                  <Element is={Component} canvas={key === 'Container' || key === 'Column' || key === 'Modal'} />
                )
              }
              className={`${
                showText 
                  ? 'w-full p-3 text-left' 
                  : 'aspect-square p-2 flex flex-col items-center justify-center'
              } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}
              title={key}
            >
              <Icon className={`${showText ? 'w-4 h-4 inline-block mr-2' : 'w-6 h-6 mb-1'}`} />
              {showText && <span className="font-medium text-sm">{key}</span>}
              {!showText && <span className="text-xs mt-1 text-center leading-tight">{key}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const SettingsPanel: React.FC = () => {
  const [layersHeight, setLayersHeight] = useState(250);
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const settingsPanel = document.querySelector('.settings-panel') as HTMLElement;
        if (settingsPanel) {
          const panelRect = settingsPanel.getBoundingClientRect();
          const newHeight = panelRect.bottom - e.clientY;
          setLayersHeight(Math.max(150, Math.min(500, newHeight)));
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  const { selected, actions } = useEditor((state, query) => {
    const currentNodeId = state.events.selected.values().next().value;
    
    let selectedNode = null;
    if (currentNodeId) {
      selectedNode = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.displayName || state.nodes[currentNodeId].data.name,
        settings: state.nodes[currentNodeId].related?.settings,
        isDeletable: query.node(currentNodeId).isDeletable(),
      };
    }

    return {
      selected: selectedNode,
    };
  });

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col settings-panel">
      {/* Settings Section - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Settings</h3>
        </div>

        {selected ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {selected.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Component ID: {selected.id.substring(0, 8)}...
              </p>
            </div>

            {selected.settings && React.createElement(selected.settings)}

            {selected.isDeletable && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => actions.delete(selected.id)}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Delete Component
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <SettingsIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select a component to edit its properties
            </p>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`h-1 cursor-ns-resize hover:bg-primary-500 transition-colors ${
          isResizing ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      />

      {/* Layers Section - Fixed Height, Resizable */}
      <div
        className="border-t border-gray-200 dark:border-gray-700 flex flex-col"
        style={{ height: `${layersHeight}px` }}
      >
        <div className="p-4 pb-2">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Layers</h3>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 layers-dark-mode">
          <Layers expandRootOnLoad={true} />
        </div>
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
    }
  };

  const handleSave = async () => {
    try {
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
    }
  };

  return (
    <>
      <Editor
        resolver={ComponentLibrary}
        enabled={enabled}
        onNodesChange={(query) => {
          // Store editor state globally for save
          (window as any).craftjsState = query;
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
                  className="min-h-screen bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-600"
                  paddingTop={8}
                  paddingRight={8}
                  paddingBottom={8}
                  paddingLeft={8}
                >
                  {/* Components will be dropped here */}
                </Element>
              </Frame>
            </div>

            {/* Right Sidebar - Settings Panel */}
            <SettingsPanel />
          </div>
        </div>
        
        {/* Component Toolbar - appears above selected components */}
        <ComponentToolbar />
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

