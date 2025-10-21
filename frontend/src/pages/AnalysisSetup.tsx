import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { AlertDialog } from '@/components/common/AlertDialog';
import { 
  Upload, 
  FileSpreadsheet, 
  X,
  ArrowRight,
  GitBranch,
  Database
} from 'lucide-react';

interface Flow {
  id: number;
  name: string;
  definition: any;
}

interface Prompt {
  id: number;
  name: string;
  content: string;
  flowName: string | null;
  variables: Array<{
    id: number;
    name: string;
    defaultValue: string | null;
    isMandatory: boolean;
    isFromFlow: boolean;
  }>;
}

export const AnalysisSetup: React.FC = () => {
  const navigate = useNavigate();
  const { analysisRecordId } = useParams<{ analysisRecordId: string }>();
  
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [dataUploadId, setDataUploadId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  // Load flows and prompts
  useEffect(() => {
    const loadData = async () => {
      try {
        const [flowsRes, promptsRes] = await Promise.all([
          api.get('/flows'),
          api.get('/prompts')
        ]);
        
        setFlows(flowsRes.data.flows || []);
        setPrompts(promptsRes.data.prompts || []);
        
        // Auto-select default prompt if available
        const defaultPrompt = promptsRes.data.prompts?.find((p: Prompt) => p.isDefault);
        if (defaultPrompt) {
          setSelectedPrompt(defaultPrompt);
          initializeVariables(defaultPrompt);
        }
      } catch (err: any) {
        console.error('Failed to load data:', err);
        setAlertDialog({
          isOpen: true,
          title: 'Error',
          message: err.response?.data?.error || 'Failed to load flows and prompts',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const initializeVariables = (prompt: Prompt) => {
    const initialValues: Record<string, string> = {};
    prompt.variables?.forEach(variable => {
      initialValues[variable.name] = variable.defaultValue || '';
    });
    setVariableValues(initialValues);
  };

  // Handle data file drop
  const onDropData = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setDataFile(file);

    // Upload immediately
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', 'data');
      formData.append('analysisRecordId', analysisRecordId || '');

      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDataUploadId(response.data.upload.id);
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Data file uploaded successfully',
        type: 'success',
      });
    } catch (err: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Upload Failed',
        message: err.response?.data?.error || 'Failed to upload data file',
        type: 'error',
      });
      setDataFile(null);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps: getDataRootProps, getInputProps: getDataInputProps, isDragActive: isDataDragActive } = useDropzone({
    onDrop: onDropData,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: uploading || !!dataFile,
  });

  const handleRemoveDataFile = () => {
    setDataFile(null);
    setDataUploadId(null);
  };

  const handlePromptChange = (promptId: number) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (prompt) {
      setSelectedPrompt(prompt);
      initializeVariables(prompt);
      
      // Auto-select flow if prompt has flowName
      if (prompt.flowName) {
        const flow = flows.find(f => f.name === prompt.flowName);
        if (flow) {
          setSelectedFlow(flow);
        }
      }
    }
  };

  const handleAnalyze = async () => {
    // Validation
    if (!dataUploadId) {
      setAlertDialog({
        isOpen: true,
        title: 'Missing Data',
        message: 'Please upload an Excel or CSV data file',
        type: 'warning',
      });
      return;
    }

    // Check mandatory variables
    if (selectedPrompt) {
      const mandatoryVars = selectedPrompt.variables?.filter(v => v.isMandatory) || [];
      const missingVars = mandatoryVars.filter(v => !variableValues[v.name]);
      
      if (missingVars.length > 0) {
        setAlertDialog({
          isOpen: true,
          title: 'Missing Variables',
          message: `Please provide values for: ${missingVars.map(v => v.name).join(', ')}`,
          type: 'warning',
        });
        return;
      }
    }

    try {
      setAnalyzing(true);

      const payload: any = {
        dataUploadId,
      };

      if (selectedPrompt) {
        payload.prompt = {
          id: selectedPrompt.id,
          name: selectedPrompt.name,
        };
        payload.variables = variableValues;
      }

      // Call the analyze endpoint
      await api.post(`/analysis/${analysisRecordId}/run`, payload);

      // Navigate to analysis details
      setTimeout(() => {
        navigate(`/analysis/${analysisRecordId}`);
      }, 1000);
    } catch (err: any) {
      setAnalyzing(false);
      setAlertDialog({
        isOpen: true,
        title: 'Analysis Failed',
        message: err.response?.data?.error || 'Failed to start analysis',
        type: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analysis Setup</h1>
        <p className="text-gray-600 mt-1">
          Upload data file and configure analysis parameters
        </p>
      </div>

      {/* Step 1: Upload Data File */}
      <Card title="Step 1: Upload Data File (Excel/CSV)">
        {!dataFile ? (
          <div
            {...getDataRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDataDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getDataInputProps()} />
            <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            {uploading ? (
              <Loading size="sm" />
            ) : (
              <>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {isDataDragActive ? 'Drop the file here' : 'Drop data file here or click to browse'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports: Excel (.xls, .xlsx) and CSV (.csv)
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">{dataFile.name}</p>
                <p className="text-sm text-gray-600">
                  {(dataFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveDataFile}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              disabled={analyzing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </Card>

      {/* Step 2: Select Flow (Optional) */}
      {flows.length > 0 && (
        <Card title="Step 2: Select Flow (Optional)">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <GitBranch className="w-4 h-4" />
              <span>Choose a predefined workflow</span>
            </div>
            <select
              value={selectedFlow?.id || ''}
              onChange={(e) => {
                const flow = flows.find(f => f.id === Number(e.target.value));
                setSelectedFlow(flow || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={analyzing}
            >
              <option value="">-- No Flow Selected --</option>
              {flows.map(flow => (
                <option key={flow.id} value={flow.id}>
                  {flow.name}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {/* Step 3: Select Prompt & Enter Variables */}
      {prompts.length > 0 && (
        <Card title="Step 3: Select Prompt & Variables (Optional)">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Prompt
              </label>
              <select
                value={selectedPrompt?.id || ''}
                onChange={(e) => handlePromptChange(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={analyzing}
              >
                <option value="">-- No Prompt Selected --</option>
                {prompts.map(prompt => (
                  <option key={prompt.id} value={prompt.id}>
                    {prompt.name}
                    {prompt.isDefault && ' (Default)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Variables */}
            {selectedPrompt && selectedPrompt.variables && selectedPrompt.variables.length > 0 && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Database className="w-4 h-4" />
                  <span>Variables</span>
                </div>
                {selectedPrompt.variables.map(variable => (
                  <div key={variable.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {variable.name}
                      {variable.isMandatory && <span className="text-red-600 ml-1">*</span>}
                      {variable.isFromFlow && (
                        <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                          From Flow
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={variableValues[variable.name] || ''}
                      onChange={(e) => setVariableValues({
                        ...variableValues,
                        [variable.name]: e.target.value,
                      })}
                      placeholder={variable.defaultValue || `Enter ${variable.name}`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={analyzing || (variable.isFromFlow && !variable.isMandatory)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleAnalyze}
          disabled={!dataUploadId || analyzing}
          isLoading={analyzing}
          size="lg"
          className="bg-primary-600 hover:bg-primary-700"
        >
          <ArrowRight className="w-5 h-5 mr-2" />
          {analyzing ? 'Starting Analysis...' : 'Analyze'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(`/idp-response/${analysisRecordId}`)}
          disabled={analyzing}
        >
          Back to Extraction
        </Button>
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

