import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Loading } from '@/components/common/Loading';
import { Input } from '@/components/common/Input';
import { FileText, Upload, X, CheckCircle, Search, AlertCircle } from 'lucide-react';
import { validateFileType, validateFileSize } from '@/utils/validation';
import { formatFileSize } from '@/utils/helpers';

interface PromptVariable {
  id: number;
  variableName: string;
  displayName: string;
  description?: string;
  isRequired: boolean;
  defaultValue?: string;
  variableType: 'text' | 'file' | 'number' | 'json';
}

interface Prompt {
  id: number;
  name: string;
  description?: string;
  content: string;
  isActive: boolean;
  isDefault: boolean;
  category?: string;
  variables: PromptVariable[];
}

export const Processing: React.FC = () => {
  const navigate = useNavigate();
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  // const [uploading, setUploading] = useState(false); // Unused for now
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');

  // Prompt selection
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [promptSearch, setPromptSearch] = useState('');
  const [showPromptDropdown, setShowPromptDropdown] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Fetch available prompts
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await api.get('/prompts');
        const activePrompts = response.data.filter((p: Prompt) => p.isActive);
        setPrompts(activePrompts);

        // Auto-select default prompt or the only prompt
        if (activePrompts.length > 0) {
          // First, check if there's a default prompt
          const defaultPrompt = activePrompts.find((p: Prompt) => p.isDefault);
          
          if (defaultPrompt) {
            // Select the default prompt
            setSelectedPrompt(defaultPrompt);
            setPromptSearch(defaultPrompt.name);
          } else if (activePrompts.length === 1) {
            // If there's only one prompt, select it
            setSelectedPrompt(activePrompts[0]);
            setPromptSearch(activePrompts[0].name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch prompts:', error);
      }
    };
    fetchPrompts();
  }, []);

  // Initialize variable values with defaults when prompt is selected
  useEffect(() => {
    if (selectedPrompt) {
      const initialValues: Record<string, string> = {};
      selectedPrompt.variables.forEach((variable) => {
        initialValues[variable.variableName] = variable.defaultValue || '';
      });
      setVariableValues(initialValues);
    } else {
      setVariableValues({});
    }
  }, [selectedPrompt]);

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setPromptSearch(prompt.name);
    setShowPromptDropdown(false);
  };

  const handleVariableChange = (variableName: string, value: string) => {
    setVariableValues((prev) => ({
      ...prev,
      [variableName]: value,
    }));
  };

  const validateVariables = (): boolean => {
    if (!selectedPrompt) return true;

    for (const variable of selectedPrompt.variables) {
      if (variable.isRequired && !variableValues[variable.variableName]) {
        setError(`Required variable "${variable.displayName}" is missing`);
        return false;
      }
    }
    return true;
  };

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptSearch.toLowerCase()) ||
    (prompt.description && prompt.description.toLowerCase().includes(promptSearch.toLowerCase())) ||
    (prompt.category && prompt.category.toLowerCase().includes(promptSearch.toLowerCase()))
  );

  const onContractDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const typeValidation = validateFileType(file, 'contract');
      const sizeValidation = validateFileSize(file, 'contract');

      if (!typeValidation.isValid) {
        setError(typeValidation.error!);
        return;
      }
      if (!sizeValidation.isValid) {
        setError(sizeValidation.error!);
        return;
      }

      setContractFile(file);
      setError('');
    }
  };

  const onDataDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const typeValidation = validateFileType(file, 'data');
      const sizeValidation = validateFileSize(file, 'data');

      if (!typeValidation.isValid) {
        setError(typeValidation.error!);
        return;
      }
      if (!sizeValidation.isValid) {
        setError(sizeValidation.error!);
        return;
      }

      setDataFile(file);
      setError('');
    }
  };

  const contractDropzone = useDropzone({
    onDrop: onContractDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    multiple: false,
  });

  const dataDropzone = useDropzone({
    onDrop: onDataDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleProcess = async () => {
    if (!contractFile || !dataFile) {
      setError('Please upload both contract and data files');
      return;
    }

    // Validate required variables if prompt is selected
    if (!validateVariables()) {
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Upload contract file (generates jobId)
      setProcessingStatus('Uploading contract...');
      const contractFormData = new FormData();
      contractFormData.append('file', contractFile);
      contractFormData.append('uploadType', 'contract');
      
      const contractUploadRes = await api.post('/uploads', contractFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Get the jobId from the contract upload response
      const jobId = contractUploadRes.data.upload.jobId;
      console.log('📝 Job ID for this session:', jobId);

      // Upload data file WITH THE SAME jobId
      setProcessingStatus('Uploading data file...');
      const dataFormData = new FormData();
      dataFormData.append('file', dataFile);
      dataFormData.append('uploadType', 'data');
      dataFormData.append('jobId', jobId); // ✅ Pass the same jobId
      
      const dataUploadRes = await api.post('/uploads', dataFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Start processing
      setProcessingStatus('Starting document processing...');
      const processPayload: any = {
        contractUploadId: contractUploadRes.data.upload.id,
        dataUploadId: dataUploadRes.data.upload.id,
      };

      // Include prompt data if selected
      if (selectedPrompt) {
        processPayload.promptId = selectedPrompt.id;
        processPayload.promptVariables = variableValues;
      }

      const processRes = await api.post('/analysis/start', processPayload);

      // Navigate to analysis page
      setTimeout(() => {
        navigate(`/analysis/${processRes.data.analysisRecordId}`);
      }, 1000);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Processing failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Document Processing</h1>
        <p className="text-gray-600 mt-1">
          Upload your contract PDF and data file to start processing
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Contract Upload */}
      <Card title="Step 1: Upload Contract PDF">
        <div
          {...contractDropzone.getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            contractDropzone.isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400'
          }`}
        >
          <input {...contractDropzone.getInputProps()} />
          {contractFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{contractFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(contractFile.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setContractFile(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">
                Drop your contract PDF here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports PDF files up to 10MB
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Data Upload */}
      <Card title="Step 2: Upload Data File (Excel/CSV)">
        <div
          {...dataDropzone.getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dataDropzone.isDragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400'
          }`}
        >
          <input {...dataDropzone.getInputProps()} />
          {dataFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{dataFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(dataFile.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDataFile(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">
                Drop your data file here, or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supports Excel (.xlsx) and CSV files up to 50MB
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Prompt Selection (Optional) */}
      <Card title="Step 3: AI Prompt (Optional)">
        <p className="text-sm text-gray-600 mb-4">
          Select an AI prompt to enhance the analysis with custom instructions and variables.
        </p>

        {/* Prompt Search */}
        <div className="relative mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search prompts..."
              value={promptSearch}
              onChange={(e) => {
                setPromptSearch(e.target.value);
                setShowPromptDropdown(true);
              }}
              onFocus={() => setShowPromptDropdown(true)}
              className="pl-10"
            />
          </div>

          {/* Prompt Dropdown */}
          {showPromptDropdown && filteredPrompts.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowPromptDropdown(false)}
              />
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filteredPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handlePromptSelect(prompt)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{prompt.name}</div>
                    {prompt.description && (
                      <div className="text-sm text-gray-600 mt-1">{prompt.description}</div>
                    )}
                    {prompt.category && (
                      <div className="text-xs text-gray-500 mt-1">
                        Category: {prompt.category}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Selected Prompt Display */}
        {selectedPrompt && (
          <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-primary-900">{selectedPrompt.name}</h3>
                {selectedPrompt.description && (
                  <p className="text-sm text-primary-700 mt-1">{selectedPrompt.description}</p>
                )}
                {selectedPrompt.variables.length > 0 && (
                  <p className="text-xs text-primary-600 mt-2">
                    {selectedPrompt.variables.length} variable(s) detected
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedPrompt(null);
                  setPromptSearch('');
                  setVariableValues({});
                }}
                className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-primary-600" />
              </button>
            </div>
          </div>
        )}

        {/* Variable Inputs */}
        {selectedPrompt && selectedPrompt.variables.length > 0 && (
          <div className="space-y-4">
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-900 mb-4">Configure Variables</h4>
              {selectedPrompt.variables.map((variable) => (
                <div key={variable.id} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {variable.displayName}
                    {variable.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {variable.description && (
                    <p className="text-xs text-gray-500 mb-2">{variable.description}</p>
                  )}
                  
                  {variable.variableType === 'text' && (
                    <Input
                      type="text"
                      value={variableValues[variable.variableName] || ''}
                      onChange={(e) => handleVariableChange(variable.variableName, e.target.value)}
                      placeholder={`Enter ${variable.displayName.toLowerCase()}`}
                      className={variable.isRequired && !variableValues[variable.variableName] ? 'border-red-300' : ''}
                    />
                  )}

                  {variable.variableType === 'number' && (
                    <Input
                      type="number"
                      value={variableValues[variable.variableName] || ''}
                      onChange={(e) => handleVariableChange(variable.variableName, e.target.value)}
                      placeholder={`Enter ${variable.displayName.toLowerCase()}`}
                      className={variable.isRequired && !variableValues[variable.variableName] ? 'border-red-300' : ''}
                    />
                  )}

                  {variable.variableType === 'json' && (
                    <textarea
                      value={variableValues[variable.variableName] || ''}
                      onChange={(e) => handleVariableChange(variable.variableName, e.target.value)}
                      placeholder={`Enter JSON for ${variable.displayName.toLowerCase()}`}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm ${
                        variable.isRequired && !variableValues[variable.variableName] ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  )}

                  {variable.variableType === 'file' && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <AlertCircle className="w-4 h-4 inline-block mr-2 text-gray-500" />
                      File variables will be automatically populated from uploaded documents
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {prompts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No active prompts available.</p>
            <p className="text-sm mt-2">Create prompts in the Prompts page to use them here.</p>
          </div>
        )}
      </Card>

      {/* Process Button */}
      <div className="flex gap-4">
        <Button
          onClick={handleProcess}
          disabled={!contractFile || !dataFile || processing}
          isLoading={processing}
          size="lg"
        >
          Process Documents
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setContractFile(null);
            setDataFile(null);
            setSelectedPrompt(null);
            setPromptSearch('');
            setVariableValues({});
            setError('');
          }}
          disabled={processing}
          size="lg"
        >
          Clear All
        </Button>
      </div>

      {/* Processing Modal */}
      <Modal
        isOpen={processing}
        onClose={() => {}}
        title="Processing Documents"
        showCloseButton={false}
      >
        <div className="text-center py-8">
          <Loading size="lg" />
          <p className="text-gray-700 font-medium mt-6">{processingStatus}</p>
          <p className="text-gray-500 text-sm mt-2">
            This may take a few moments...
          </p>
        </div>
      </Modal>
    </div>
  );
};

