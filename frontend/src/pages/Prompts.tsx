import React, { useState, useEffect, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loading } from '@/components/common/Loading';
import { AlertDialog } from '@/components/common/AlertDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Save, X, Download, Upload as UploadIcon, Star, Copy } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface Variable {
  id?: number;
  variableName: string;
  displayName: string;
  description?: string;
  isRequired: boolean;
  isFlowVariable: boolean;
  defaultValue?: string;
  variableType: string;
}

interface FlowVariable {
  name: string;
  type: string;
}

interface Flow {
  name: string;
  description: string;
  url: string;
  method: string;
  vars: FlowVariable[];
}

interface Prompt {
  id: number;
  name: string;
  description: string | null;
  content: string;
  isActive: boolean;
  isDefault: boolean;
  category: string | null;
  flowName: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  variables: Variable[];
}

export const Prompts: React.FC = () => {
  const { can } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [saving, setSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog states
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

  // Flow state
  const [flows, setFlows] = useState<Flow[]>([]);
  const [_selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [newVariableName, setNewVariableName] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: '',
    flowName: '',
    isActive: true,
  });
  const [variables, setVariables] = useState<Variable[]>([]);

  useEffect(() => {
    fetchPrompts();
    fetchFlows();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await api.get('/prompts');
      setPrompts(response.data.prompts);
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlows = async () => {
    try {
      const response = await api.get('/flows');
      setFlows(response.data.flows || []);
    } catch (error) {
      console.error('Failed to fetch flows:', error);
    }
  };

  const handleFlowSelect = (flowName: string) => {
    const flow = flows.find(f => f.name === flowName);
    setSelectedFlow(flow || null);
    setFormData({ ...formData, flowName });

    if (flow) {
      // Add flow variables to the variables list (marked as flow variables)
      const flowVars: Variable[] = flow.vars.map(v => ({
        variableName: v.name,
        displayName: v.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: `Flow variable (${v.type})`,
        isRequired: true,
        isFlowVariable: true,
        variableType: v.type,
      }));
      
      // Keep user-created variables, replace flow variables
      const userVars = variables.filter(v => !v.isFlowVariable);
      setVariables([...flowVars, ...userVars]);
    }
  };

  const handleAddVariable = () => {
    if (!newVariableName.trim()) return;
    
    // Check if variable already exists
    if (variables.some(v => v.variableName === newVariableName.trim())) {
      setAlertDialog({
        isOpen: true,
        title: 'Variable Exists',
        message: 'A variable with this name already exists.',
        type: 'warning',
      });
      return;
    }

    const newVar: Variable = {
      variableName: newVariableName.trim(),
      displayName: newVariableName.trim().replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      isRequired: false,
      isFlowVariable: false,
      variableType: 'text',
    };

    setVariables([...variables, newVar]);
    setNewVariableName('');
  };

  const handleRemoveVariable = (variableName: string) => {
    // Don't allow removing flow variables
    const variable = variables.find(v => v.variableName === variableName);
    if (variable?.isFlowVariable) {
      setAlertDialog({
        isOpen: true,
        title: 'Cannot Remove',
        message: 'Flow variables cannot be removed as they are required by the selected flow.',
        type: 'warning',
      });
      return;
    }
    setVariables(variables.filter(v => v.variableName !== variableName));
  };

  const handleVariableDragStart = (e: React.DragEvent, variableName: string) => {
    e.dataTransfer.setData('text/plain', `{{${variableName}}}`);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const extractVariables = (content: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const vars: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const variable = match[1].trim();
      if (!vars.includes(variable)) {
        vars.push(variable);
      }
    }

    return vars;
  };

  const handleContentChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFormData({ ...formData, content: value });
      
      // Auto-detect variables from content
      const detectedVarNames = extractVariables(value);
      
      // Keep all flow variables (they're mandatory regardless of content)
      const flowVars = variables.filter(v => v.isFlowVariable);
      
      // Process detected variables
      const contentVars: Variable[] = [];
      detectedVarNames.forEach(varName => {
        // Skip if it's already a flow variable
        if (flowVars.some(v => v.variableName === varName)) {
          return;
        }
        
        // Check if it already exists as a custom variable
        const existing = variables.find(v => v.variableName === varName && !v.isFlowVariable);
        contentVars.push(existing || {
          variableName: varName,
          displayName: varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          isRequired: true,
          isFlowVariable: false,
          variableType: 'text',
        });
      });
      
      // Combine flow variables with detected content variables
      setVariables([...flowVars, ...contentVars]);
    }
  };

  const handleExport = () => {
    const fileName = `${formData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    const blob = new Blob([formData.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setShowImportModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'text/markdown' || file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt'))) {
      handleFileRead(file);
    } else {
      setAlertDialog({
        isOpen: true,
        title: 'Invalid File Type',
        message: 'Please drop a .md or .txt file',
        type: 'warning',
      });
    }
  };

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormData({ ...formData, content });
      handleContentChange(content);
      setShowImportModal(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleCreateNew = () => {
    setEditingPrompt(null);
    setFormData({
      name: '',
      description: '',
      content: '',
      category: '',
      flowName: '',
      isActive: true,
    });
    setVariables([]);
    setSelectedFlow(null);
    setShowForm(true);
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    
    // Find and set the flow if prompt has one
    if (prompt.flowName) {
      const flow = flows.find(f => f.name === prompt.flowName);
      setSelectedFlow(flow || null);
    } else {
      setSelectedFlow(null);
    }
    
    setFormData({
      name: prompt.name,
      description: prompt.description || '',
      content: prompt.content,
      category: prompt.category || '',
      flowName: prompt.flowName || '',
      isActive: prompt.isActive,
    });
    setVariables(prompt.variables);
    setShowForm(true);
  };

  const handleDuplicate = (prompt: Prompt) => {
    setEditingPrompt(null); // Not editing, creating a new one
    
    // Find and set the flow if prompt has one
    if (prompt.flowName) {
      const flow = flows.find(f => f.name === prompt.flowName);
      setSelectedFlow(flow || null);
    } else {
      setSelectedFlow(null);
    }
    
    setFormData({
      name: `Copy - ${prompt.name}`,
      description: prompt.description || '',
      content: prompt.content,
      category: prompt.category || '',
      flowName: prompt.flowName || '',
      isActive: prompt.isActive,
    });
    // Remove IDs from variables so they're treated as new
    setVariables(prompt.variables.map(v => ({
      variableName: v.variableName,
      displayName: v.displayName,
      description: v.description,
      isRequired: v.isRequired,
      isFlowVariable: v.isFlowVariable,
      defaultValue: v.defaultValue,
      variableType: v.variableType,
    })));
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        ...formData,
        variables: variables.map(v => ({
          variableName: v.variableName,
          displayName: v.displayName,
          description: v.description || '',
          isRequired: v.isRequired,
          isFlowVariable: v.isFlowVariable,
          defaultValue: v.defaultValue || '',
          variableType: v.variableType,
        })),
      };

      if (editingPrompt) {
        await api.put(`/prompts/${editingPrompt.id}`, payload);
      } else {
        await api.post('/prompts', payload);
      }

      setShowForm(false);
      fetchPrompts();
      
      setAlertDialog({
        isOpen: true,
        title: editingPrompt ? 'Prompt Updated' : 'Prompt Created',
        message: editingPrompt ? 'Prompt has been successfully updated.' : 'Prompt has been successfully created.',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Failed to save prompt:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Save Failed',
        message: error.response?.data?.error || 'Failed to save prompt',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    // Check permissions
    if (!can.deletePrompts) {
      setAlertDialog({
        isOpen: true,
        title: 'Permission Denied',
        message: 'You do not have permission to delete prompts. Please contact an administrator.',
        type: 'warning',
      });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Prompt',
      message: 'Are you sure you want to delete this prompt? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/prompts/${id}`);
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          fetchPrompts();
          
          setAlertDialog({
            isOpen: true,
            title: 'Prompt Deleted',
            message: 'Prompt has been successfully deleted.',
            type: 'success',
          });
        } catch (error) {
          console.error('Failed to delete prompt:', error);
          setAlertDialog({
            isOpen: true,
            title: 'Delete Failed',
            message: 'Failed to delete prompt',
            type: 'error',
          });
        }
      },
    });
  };

  const handleToggleActive = async (prompt: Prompt) => {
    try {
      await api.put(`/prompts/${prompt.id}`, {
        isActive: !prompt.isActive,
      });
      fetchPrompts();
    } catch (error) {
      console.error('Failed to toggle prompt:', error);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.put(`/prompts/${id}/set-default`);
      fetchPrompts();
    } catch (error: any) {
      console.error('Failed to set default:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Set Default Failed',
        message: error.response?.data?.error || 'Failed to set default prompt',
        type: 'error',
      });
    }
  };

  const handleUnsetDefault = async (id: number) => {
    try {
      await api.put(`/prompts/${id}/unset-default`);
      fetchPrompts();
    } catch (error: any) {
      console.error('Failed to unset default:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Unset Default Failed',
        message: error.response?.data?.error || 'Failed to unset default prompt',
        type: 'error',
      });
    }
  };

  const filteredPrompts = prompts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  // Render the Import Modal at root level (available in both list and form views)
  const importModal = showImportModal && (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setShowImportModal(false)}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Import Prompt</h2>
            <button
              onClick={() => setShowImportModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your .md or .txt file here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse
            </p>
            <Button variant="outline" onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}>
              Select File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,text/markdown,text/plain"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Supported formats: .md, .txt
          </p>
        </div>
      </div>
    </>
  );

  if (showForm) {
    return (
      <>
        {importModal}
      <div className="flex flex-col overflow-hidden bg-white rounded-lg shadow-sm" style={{ height: 'calc(100vh - 96px)' }}>
        {/* Compact Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
            </h1>
            <p className="text-sm text-gray-600">
              Use <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{'{{variable_name}}'}</code> for placeholders
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleImportClick}
              variant="outline"
              size="sm"
              className="text-sm py-1.5 px-3"
              title="Import from .md or .txt file"
            >
              <UploadIcon className="w-3.5 h-3.5 mr-1.5" />
              Import
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="text-sm py-1.5 px-3"
              disabled={!formData.content}
              title="Export to .md file"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
            {editingPrompt && (
              <Button
                onClick={() => handleDuplicate(editingPrompt)}
                variant="outline"
                size="sm"
                className="text-sm py-1.5 px-3"
                title="Duplicate this prompt"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Duplicate
              </Button>
            )}
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
              size="sm"
              className="text-sm py-1.5 px-3"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.content}
              size="sm"
              className="bg-primary-600 hover:bg-primary-700 text-sm py-1.5 px-3"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? 'Saving...' : 'Save Prompt'}
            </Button>
          </div>
        </div>

        {/* Form Fields - Compact */}
        <div className="px-6 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Prompt Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Contract Analysis"
                className="text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category
              </label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Analysis"
                className="text-sm bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description"
                className="text-sm bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            {/* Flow Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Flow
              </label>
              <select
                value={formData.flowName}
                onChange={(e) => handleFlowSelect(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a flow...</option>
                {flows.map((flow) => (
                  <option key={flow.name} value={flow.name}>
                    {flow.name} - {flow.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Variable Management */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Variables
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={newVariableName}
                  onChange={(e) => setNewVariableName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddVariable()}
                  placeholder="Add variable"
                  className="flex-1 text-sm bg-white"
                />
                <Button
                  onClick={handleAddVariable}
                  variant="outline"
                  size="sm"
                  className="px-2"
                  disabled={!newVariableName.trim()}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Variables List */}
          <div className="mt-2 flex flex-wrap gap-1.5 min-h-[24px]">
            {variables.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No variables. Add variables or select a flow.</p>
            ) : (
              variables.map((variable) => (
                <div
                  key={variable.variableName}
                  draggable={true}
                  onDragStart={(e) => handleVariableDragStart(e, variable.variableName)}
                  title={variable.description || variable.displayName}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border cursor-move text-xs font-medium transition-colors ${
                    variable.isFlowVariable
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                      : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{variable.variableName}</span>
                  {!variable.isFlowVariable && (
                    <button
                      onClick={() => handleRemoveVariable(variable.variableName)}
                      className="hover:text-red-600 transition-colors"
                      title="Remove variable"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Markdown Editor - Takes Remaining Space */}
        <div className="flex-1 flex flex-col min-h-0 px-6 py-3 border-b border-gray-200">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Prompt Content * (Markdown) - 💡 Drag variables above into editor
          </label>
          <div data-color-mode="light" className="flex-1 min-h-0 border border-gray-200 rounded-lg overflow-hidden">
            <MDEditor
              value={formData.content}
              onChange={handleContentChange}
              height="100%"
              preview="edit"
            />
          </div>
        </div>

        {/* Fixed Bottom - Variables Detected */}
        <div className="px-6 py-2 border-t border-gray-200 flex-shrink-0 bg-gray-50">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Variables detected:</span> {variables.length > 0 ? variables.map(v => v.variableName).join(', ') : 'None'}
          </p>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      {importModal}
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prompt Library</h1>
          <p className="text-gray-600 mt-1">Manage AI prompts with variables for document processing</p>
        </div>
        {can.createPrompts && (
          <Button
            onClick={handleCreateNew}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Prompt
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPrompts.map((prompt) => (
          <Card key={prompt.id}>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{prompt.name}</h3>
                    {prompt.isDefault && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Default
                      </span>
                    )}
                    {!prompt.isActive && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {prompt.category && (
                    <span className="text-sm text-primary-600">
                      {prompt.category}
                    </span>
                  )}
                  {prompt.description && (
                    <p className="text-sm text-gray-600 mt-1">{prompt.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{prompt.variables.length} variables</span>
                <span>•</span>
                <span>
                  By {prompt.creator.firstName || prompt.creator.email}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {can.editPrompts && (
                  <>
                    <Button
                      onClick={() => handleEdit(prompt)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDuplicate(prompt)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </Button>
                    <Button
                      onClick={() => handleToggleActive(prompt)}
                      variant="outline"
                      size="sm"
                    >
                      {prompt.isActive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {prompt.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </>
                )}
                {can.setDefaultPrompt && (
                  <Button
                    onClick={() => prompt.isDefault ? handleUnsetDefault(prompt.id) : handleSetDefault(prompt.id)}
                    variant="outline"
                    size="sm"
                    className={prompt.isDefault ? "text-yellow-600 hover:bg-yellow-50" : ""}
                  >
                    <Star className={`w-4 h-4 mr-2 ${prompt.isDefault ? 'fill-current' : ''}`} />
                    {prompt.isDefault ? 'Unset Default' : 'Set as Default'}
                  </Button>
                )}
                {can.deletePrompts && (
                  <Button
                    onClick={() => handleDelete(prompt.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredPrompts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No prompts found</p>
          <Button
            onClick={handleCreateNew}
            className="mt-4 bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Prompt
          </Button>
        </div>
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="danger"
      />
    </div>
    </>
  );
};

