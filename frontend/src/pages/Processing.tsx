import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Loading } from '@/components/common/Loading';
import { FileText, Upload, X, CheckCircle } from 'lucide-react';
import { validateFileType, validateFileSize } from '@/utils/validation';
import { formatFileSize } from '@/utils/helpers';

export const Processing: React.FC = () => {
  const navigate = useNavigate();
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  // const [uploading, setUploading] = useState(false); // Unused for now
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');

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
      const processRes = await api.post('/analysis/start', {
        contractUploadId: contractUploadRes.data.upload.id,
        dataUploadId: dataUploadRes.data.upload.id,
      });

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

