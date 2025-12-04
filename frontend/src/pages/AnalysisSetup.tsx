import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { AlertDialog } from '@/components/common/AlertDialog';
import { 
  FileSpreadsheet, 
  X,
  ArrowRight,
  GitBranch,
  Database
} from 'lucide-react';

interface Flow {
  id: number;
  name: string;
  description?: string;
  url: string;
  method: string;
  mulesoftApiId: number;
  apiName: string;
  vars?: Array<{
    name: string;
    type: string;
    mandatory: boolean;
  }>;
}

interface Prompt {
  id: number;
  name: string;
  content: string;
  flowName: string | null;
  isDefault?: boolean;
  variables: Array<{
    id: number;
    variableName: string;
    displayName: string;
    defaultValue: string | null;
    isRequired: boolean;
    isFlowVariable: boolean;
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
  const [jobId, setJobId] = useState<string | null>(null);
  const [existingDataUpload, setExistingDataUpload] = useState<any>(null);
  
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

  // Load flows, prompts, and analysis record
  useEffect(() => {
    const loadData = async () => {
      try {
      const [flowsRes, promptsRes, analysisRes] = await Promise.all([
        api.get('/flows'),
        api.get('/prompts'),
        api.get(`/analysis/${analysisRecordId}`)
      ]);
      
      setFlows(flowsRes.data.flows || []);
      setPrompts(promptsRes.data.prompts || []);
      
      // Get jobId from analysis record
      // Backend returns { analysis }, not { analysisRecord }
      const recordJobId = analysisRes.data.analysis?.jobId;
      if (recordJobId) {
        setJobId(recordJobId);
        console.log('📋 Using jobId from analysis record:', recordJobId);
          
          // Check for existing data uploads with this jobId
          try {
            const uploadsRes = await api.get(`/uploads/by-job/${recordJobId}`);
            console.log('📦 All uploads for jobId:', uploadsRes.data.uploads);
            const dataUploads = uploadsRes.data.uploads?.filter((u: any) => u.uploadType === 'data');
            console.log('📊 Data uploads filtered:', dataUploads);
            
            if (dataUploads && dataUploads.length > 0) {
              const latestDataUpload = dataUploads[0]; // Most recent
              setExistingDataUpload(latestDataUpload);
              setDataUploadId(latestDataUpload.id);
              console.log('✅ Found existing data upload:', latestDataUpload.filename, 'ID:', latestDataUpload.id);
            } else {
              console.log('⚠️ No data uploads found for this jobId');
            }
          } catch (uploadErr: any) {
            console.error('❌ Error fetching uploads:', uploadErr.response?.data || uploadErr.message);
          }
        }
        
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
  }, [analysisRecordId]);

  const initializeVariables = (prompt: Prompt) => {
    const initialValues: Record<string, string> = {};
    prompt.variables?.forEach(variable => {
      initialValues[variable.variableName] = variable.defaultValue || '';
    });
    setVariableValues(initialValues);
  };

  // Handle data file drop
  const onDropData = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setDataFile(file);
    setExistingDataUpload(null); // Clear existing upload when new file is selected

    // Upload immediately
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', 'data');
      formData.append('analysisRecordId', analysisRecordId || '');
      
      // IMPORTANT: Use the same jobId as the contract to link them together
      if (jobId) {
        formData.append('jobId', jobId);
        console.log('📋 Uploading Excel with jobId:', jobId);
      } else {
        console.warn('⚠️ No jobId found - Excel upload will get a new jobId');
      }

      const response = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDataUploadId(response.data.upload.id);
      console.log('✅ Excel uploaded with jobId:', response.data.upload.jobId);
      
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

  const handleRemoveExistingUpload = () => {
    setExistingDataUpload(null);
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
    // Data file is now optional - some flows/prompts may not require it
    // Variables are also optional - they will be populated from files/JSON if not provided

    try {
      setAnalyzing(true);

      const payload: any = {};

      // Only include dataUploadId if file was uploaded
      if (dataUploadId) {
        payload.dataUploadId = dataUploadId;
      }

      if (selectedFlow) {
        payload.flowId = selectedFlow.id;
      }

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
          Configure analysis parameters (data file is optional)
        </p>
      </div>

      {/* Informational Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">ℹ️ Note:</span> Data file upload is optional. Some flows and prompts work with only the extracted contract data and don't require additional data files.
        </p>
      </div>

      {/* Step 1: Upload Data File */}
      <Card title="Step 1: Upload Data File (Optional)">
        {existingDataUpload && !dataFile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{existingDataUpload.filename}</p>
                  <p className="text-sm text-blue-600">Existing file from previous upload</p>
                </div>
              </div>
              <button
                onClick={handleRemoveExistingUpload}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                disabled={analyzing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              This file will be used unless you upload a new one
            </p>
          </div>
        ) : !dataFile ? (
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
                <p className="text-xs text-blue-600 mt-2">
                  Optional - Some flows and prompts may not require a data file
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

      {/* Step 2: Select MuleSoft Flow */}
      {flows.length > 0 && (
        <Card title="Step 2: Select MuleSoft Flow">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <GitBranch className="w-4 h-4" />
              <span>Choose a MuleSoft flow to process the data</span>
            </div>
            <select
              value={selectedFlow?.id || ''}
              onChange={(e) => {
                const flow = flows.find(f => f.id === parseInt(e.target.value));
                setSelectedFlow(flow || null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={analyzing}
            >
              <option value="">-- Select a Flow --</option>
              {flows.map(flow => (
                <option key={flow.id} value={flow.id}>
                  {flow.apiName} - {flow.name} {flow.description && `(${flow.description})`}
                </option>
              ))}
            </select>
            
            {selectedFlow && selectedFlow.description && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Description:</span> {selectedFlow.description}
                </p>
                {selectedFlow.vars && selectedFlow.vars.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-blue-900 mb-1">Flow Variables:</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {selectedFlow.vars.map((v, idx) => (
                        <li key={idx}>
                          • {v.name} ({v.type}){v.mandatory && <span className="text-red-600"> *required</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
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
                  <span>Variables (Optional)</span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                  <p className="text-xs text-blue-900">
                    <span className="font-medium">ℹ️ Note:</span> Variables are optional. If left empty, they will be automatically populated from your uploaded files (contract PDF and data Excel/CSV).
                  </p>
                </div>
                {selectedPrompt.variables.map(variable => (
                  <div key={variable.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {variable.displayName}
                      {variable.isFlowVariable && (
                        <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                          Auto-populated from files
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={variableValues[variable.variableName] || ''}
                      onChange={(e) => setVariableValues({
                        ...variableValues,
                        [variable.variableName]: e.target.value,
                      })}
                      placeholder={variable.defaultValue || `Optional - Leave empty to use file content`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={analyzing}
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
          disabled={analyzing}
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

