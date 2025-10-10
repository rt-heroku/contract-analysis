import React, { useState, useEffect, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loading } from '@/components/common/Loading';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Save, X, Download, Upload as UploadIcon, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Variable {
  id?: number;
  variableName: string;
  displayName: string;
  description?: string;
  isRequired: boolean;
  defaultValue?: string;
  variableType: string;
}

interface Prompt {
  id: number;
  name: string;
  description: string | null;
  content: string;
  isActive: boolean;
  isDefault: boolean;
  category: string | null;
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [saving, setSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is admin
  const isAdmin = user?.roles?.some((role: string) => role.toLowerCase() === 'admin');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: '',
    isActive: true,
  });
  const [variables, setVariables] = useState<Variable[]>([]);

  useEffect(() => {
    fetchPrompts();
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
      
      // Auto-detect variables
      const detectedVars = extractVariables(value);
      const newVariables = detectedVars.map(varName => {
        // Check if variable already exists
        const existing = variables.find(v => v.variableName === varName);
        return existing || {
          variableName: varName,
          displayName: varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          isRequired: true,
          variableType: 'text',
        };
      });
      setVariables(newVariables);
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
      alert('Please drop a .md or .txt file');
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
      isActive: true,
    });
    setVariables([]);
    setShowForm(true);
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      description: prompt.description || '',
      content: prompt.content,
      category: prompt.category || '',
      isActive: prompt.isActive,
    });
    setVariables(prompt.variables);
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
    } catch (error: any) {
      console.error('Failed to save prompt:', error);
      alert(error.response?.data?.error || 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      await api.delete(`/prompts/${id}`);
      fetchPrompts();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      alert('Failed to delete prompt');
    }
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
      alert(error.response?.data?.error || 'Failed to set default prompt');
    }
  };

  const handleUnsetDefault = async (id: number) => {
    try {
      await api.put(`/prompts/${id}/unset-default`);
      fetchPrompts();
    } catch (error: any) {
      console.error('Failed to unset default:', error);
      alert(error.response?.data?.error || 'Failed to unset default prompt');
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
      <div className="h-screen flex flex-col max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
            </h1>
            <p className="text-gray-600 mt-1">
              Use <code className="bg-gray-100 px-2 py-1 rounded">{'{{variable_name}}'}</code> for placeholders
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleImportClick}
              variant="outline"
              title="Import from .md or .txt file"
            >
              <UploadIcon className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              disabled={!formData.content}
              title="Export to .md file"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.content}
              className="bg-primary-600 hover:bg-primary-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Prompt'}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto min-h-0 space-y-4">
          <Card title="Prompt Details">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Contract Analysis Prompt"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Contract, Data Analysis"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of what this prompt does"
                />
              </div>

              <div className="flex flex-col" style={{ height: 'calc(100vh - 500px)', minHeight: '400px' }}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt Content * (Markdown)
                </label>
                <div data-color-mode="light" className="flex-1">
                  <MDEditor
                    value={formData.content}
                    onChange={handleContentChange}
                    height="100%"
                    preview="edit"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Variables detected: {variables.length > 0 ? variables.map(v => v.variableName).join(', ') : 'None'}
                </p>
              </div>
            </div>
          </Card>

          {variables.length > 0 && (
            <Card title="Variables Configuration">
            <div className="space-y-4">
              {variables.map((variable, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variable Name
                      </label>
                      <Input
                        value={variable.variableName}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <Input
                        value={variable.displayName}
                        onChange={(e) => {
                          const newVars = [...variables];
                          newVars[index].displayName = e.target.value;
                          setVariables(newVars);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={variable.variableType}
                        onChange={(e) => {
                          const newVars = [...variables];
                          newVars[index].variableType = e.target.value;
                          setVariables(newVars);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="text">Text</option>
                        <option value="file">File</option>
                        <option value="number">Number</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <Input
                        value={variable.description || ''}
                        onChange={(e) => {
                          const newVars = [...variables];
                          newVars[index].description = e.target.value;
                          setVariables(newVars);
                        }}
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <label className="flex items-center mt-8">
                        <input
                          type="checkbox"
                          checked={variable.isRequired}
                          onChange={(e) => {
                            const newVars = [...variables];
                            newVars[index].isRequired = e.target.checked;
                            setVariables(newVars);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Required</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </Card>
          )}
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      {importModal}
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prompt Library</h1>
          <p className="text-gray-600 mt-1">Manage AI prompts with variables for document processing</p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Prompt
        </Button>
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
                <Button
                  onClick={() => handleEdit(prompt)}
                  variant="outline"
                  size="sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleToggleActive(prompt)}
                  variant="outline"
                  size="sm"
                >
                  {prompt.isActive ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {prompt.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                {isAdmin && (
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
                <Button
                  onClick={() => handleDelete(prompt.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
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
    </div>
    </>
  );
};

