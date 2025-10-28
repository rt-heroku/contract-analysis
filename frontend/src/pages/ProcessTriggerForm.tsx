import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { AlertDialog } from '@/components/common/AlertDialog';
import { Loading } from '@/components/common/Loading';
import { Play, Upload, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

interface TriggerField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'file' | 'select' | 'number' | 'date' | 'checkbox' | 'radio' | 'email';
  placeholder?: string;
  required?: boolean;
  accept?: string;
  options?: string[];
  default?: any;
  rows?: number;
  min?: number;
  max?: number;
}

interface TriggerConfig {
  fields: TriggerField[];
  submitButtonText?: string;
  successMessage?: string;
  redirectAfterSubmit?: string;
}

interface ProcessTrigger {
  id: number;
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig: TriggerConfig;
}

export const ProcessTriggerForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [trigger, setTrigger] = useState<ProcessTrigger | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fileData, setFileData] = useState<Record<string, File>>({});

  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    loadTriggerConfig();
  }, [id]);

  const loadTriggerConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/processes/${id}/trigger-config`);
      const triggerData = response.data.trigger;
      setTrigger(triggerData);

      // Set default values
      const defaults: Record<string, any> = {};
      if (triggerData.triggerConfig?.fields) {
        triggerData.triggerConfig.fields.forEach((field: TriggerField) => {
          if (field.default !== undefined) {
            defaults[field.name] = field.default;
          }
        });
      }
      setFormData(defaults);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to load process configuration',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (fieldName: string, file: File | null) => {
    if (!file) {
      const newFileData = { ...fileData };
      delete newFileData[fieldName];
      setFileData(newFileData);
      setFormData({ ...formData, [fieldName]: null });
      return;
    }

    setFileData({ ...fileData, [fieldName]: file });

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData({ ...formData, [fieldName]: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  const validateForm = (): boolean => {
    if (!trigger?.triggerConfig?.fields) return true;

    for (const field of trigger.triggerConfig.fields) {
      if (field.required && !formData[field.name]) {
        setAlertDialog({
          isOpen: true,
          title: 'Validation Error',
          message: `${field.label} is required`,
          type: 'warning',
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const response = await api.post(`/processes/${id}/trigger`, {
        executionContext: formData,
      });

      const successMessage = trigger?.triggerConfig?.successMessage || 'Process started successfully!';
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: `${successMessage}\nExecution ID: ${response.data.executionId}`,
        type: 'success',
      });

      // Redirect after a delay
      const redirectPath = trigger?.triggerConfig?.redirectAfterSubmit || '/executions';
      setTimeout(() => {
        navigate(redirectPath);
      }, 2000);
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to start process',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: TriggerField) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'date':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  required={field.required}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </div>
            ))}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                const file = e.dataTransfer.files[0];
                if (file) {
                  handleFileChange(field.name, file);
                }
              }}
              onClick={() => document.getElementById(`file-${field.name}`)?.click()}
            >
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {fileData[field.name]
                  ? fileData[field.name].name
                  : 'Drag & drop file here or click to browse'}
              </p>
              {field.accept && (
                <p className="text-xs text-gray-500 mt-1">
                  Accepted: {field.accept}
                </p>
              )}
              <input
                id={`file-${field.name}`}
                type="file"
                accept={field.accept}
                onChange={(e) => handleFileChange(field.name, e.target.files?.[0] || null)}
                required={field.required}
                className="hidden"
              />
            </div>
            {fileData[field.name] && (
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm text-gray-700">{fileData[field.name].name}</span>
                <button
                  type="button"
                  onClick={() => handleFileChange(field.name, null)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (!trigger) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Process Not Found</h2>
          <p className="text-gray-600 mb-4">The requested process does not exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/processes')}>
            Back to Processes
          </Button>
        </div>
      </div>
    );
  }

  if (trigger.triggerType !== 'ui_form') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Trigger Type</h2>
          <p className="text-gray-600 mb-4">This process cannot be triggered via UI form.</p>
          <Button onClick={() => navigate('/processes')}>
            Back to Processes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button
          onClick={() => navigate('/processes')}
          className="flex items-center space-x-2 mb-4 bg-gray-200 hover:bg-gray-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Processes</span>
        </Button>

        <h1 className="text-3xl font-bold text-gray-900">{trigger.name}</h1>
        {trigger.description && (
          <p className="text-gray-600 mt-2">{trigger.description}</p>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {trigger.triggerConfig?.fields?.map((field) => (
            <div key={field.name}>
              {field.type !== 'checkbox' && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              )}
              {renderField(field)}
            </div>
          ))}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={() => navigate('/processes')}
              className="bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Play className="w-4 h-4" />
              <span>{submitting ? 'Starting...' : trigger.triggerConfig?.submitButtonText || 'Start Process'}</span>
            </Button>
          </div>
        </form>
      </Card>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => {
          setAlertDialog({ ...alertDialog, isOpen: false });
          if (alertDialog.type === 'success') {
            const redirectPath = trigger?.triggerConfig?.redirectAfterSubmit || '/executions';
            navigate(redirectPath);
          }
        }}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
};

