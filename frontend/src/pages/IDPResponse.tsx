import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { GenericIDPRenderer } from '@/components/idp/GenericIDPRenderer';
import { ContractRenderer } from '@/components/idp/ContractRenderer';
import { PurchaseOrderRenderer } from '@/components/idp/PurchaseOrderRenderer';
import { InvoiceRenderer } from '@/components/idp/InvoiceRenderer';
import { AnypointCredentialsDialog } from '@/components/modals/AnypointCredentialsDialog';
import { AlertDialog } from '@/components/common/AlertDialog';
import { 
  ArrowRight, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ContractAnalysis {
  id: number;
  uploadId: number;
  jobId: string;
  executionId?: string;
  idpExecutionId?: number;
  documentName: string;
  status: string;
  terms: string[];
  products: string[];
  mulesoftResponse: any;
  createdAt: string;
}

export const IDPResponse: React.FC = () => {
  const navigate = useNavigate();
  const { analysisRecordId } = useParams<{ analysisRecordId: string }>();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [contractAnalysis, setContractAnalysis] = useState<ContractAnalysis | null>(null);
  const [error, setError] = useState('');
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [idpExecutionId, setIdpExecutionId] = useState<number | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const loadContractAnalysis = async () => {
      // First, try to load immediately (in case data already exists)
      try {
        const response = await api.get(`/analysis/${analysisRecordId}/contract`);
        
        if (response.data.contractAnalysis) {
          // Data already exists! Load it immediately (no polling needed)
          console.debug('[IDPResponse] Data already exists, loading immediately');
          if (isMounted) {
            setContractAnalysis(response.data.contractAnalysis);
            setLoading(false);
            setError('');
          }
          return; // Exit early, no need to poll
        }
      } catch (err: any) {
        // If data doesn't exist yet, we'll start polling below
        console.debug('[IDPResponse] Data not ready yet, starting polling...');
      }

      // Data doesn't exist yet, start polling
      const pollContractAnalysis = async () => {
        const maxAttempts = 60; // 60 attempts * 10 seconds = 600 seconds (10 minutes) max
        let attempts = 0;

        const poll = async () => {
          if (!isMounted) return; // Stop polling if component unmounted

          try {
            setPollingAttempts(attempts + 1);
            const response = await api.get(`/analysis/${analysisRecordId}/contract`);
            
            if (response.data.contractAnalysis) {
              // Success! Contract analysis is ready
              if (isMounted) {
                setContractAnalysis(response.data.contractAnalysis);
                setLoading(false);
                setError('');
              }
            } else {
              // Still processing, try again
              attempts++;
              if (attempts < maxAttempts && isMounted) {
                timeoutId = setTimeout(poll, 10000); // Poll every 10 seconds
              } else if (isMounted) {
                setError('Timeout: Contract processing is taking longer than expected. Please try again.');
                setLoading(false);
              }
            }
          } catch (err: any) {
            const errorMessage = err.response?.data?.error || '';
            
            // If it's still processing (404 or "not yet available"), keep polling
            if (errorMessage.includes('not yet available') || errorMessage.includes('Please wait')) {
              attempts++;
              if (attempts < maxAttempts && isMounted) {
                timeoutId = setTimeout(poll, 10000); // Poll every 10 seconds
              } else if (isMounted) {
                setError('Timeout: Contract processing is taking longer than expected. Please try again.');
                setLoading(false);
              }
            } else {
              // Real error - stop polling
              if (isMounted) {
                setError(errorMessage || 'Failed to load contract analysis');
                setLoading(false);
              }
            }
          }
        };

        poll();
      };

      pollContractAnalysis();
    };

    loadContractAnalysis();

    // Load IDP execution ID from URL if available
    const idpExecId = searchParams.get('idpExecutionId');
    if (idpExecId) {
      setIdpExecutionId(parseInt(idpExecId));
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [analysisRecordId, searchParams]); // Removed contractAnalysis to prevent re-polling loop

  // Separate effect to handle idpExecutionId fallback from contractAnalysis
  useEffect(() => {
    if (!idpExecutionId && contractAnalysis?.idpExecutionId) {
      setIdpExecutionId(contractAnalysis.idpExecutionId);
    }
  }, [contractAnalysis, idpExecutionId]);

  const handleAnalyze = () => {
    // Navigate to analysis setup page
    navigate(`/analysis-setup/${analysisRecordId}`);
  };

  const checkProcessingStatus = async () => {
    if (!contractAnalysis || !contractAnalysis.executionId || !idpExecutionId) {
      console.debug('[IDPResponse] Cannot check status:', { 
        hasContractAnalysis: !!contractAnalysis, 
        hasExecutionId: !!contractAnalysis?.executionId, 
        hasIdpExecutionId: !!idpExecutionId 
      });
      setAlertDialog({
        isOpen: true,
        title: 'Missing Information',
        message: 'Cannot check status: Missing execution ID or IDP configuration',
        type: 'warning',
      });
      return;
    }

    try {
      setIsCheckingStatus(true);
      console.debug('[IDPResponse] Checking status for:', {
        executionId: contractAnalysis.executionId,
        jobId: contractAnalysis.jobId,
        idpExecutionId,
      });
      
      const response = await api.post('/idp-status/status', {
        executionId: contractAnalysis.executionId,
        jobId: contractAnalysis.jobId,
        idpExecutionId: idpExecutionId,
      });

      if (response.data.status) {
        console.debug('[IDPResponse] Status updated:', response.data.status);
        // Update contract analysis with new status
        setContractAnalysis(prev => prev ? {
          ...prev,
          status: response.data.status.status || response.data.status.documentStatus || prev.status,
          mulesoftResponse: response.data.status,
        } : null);
        
        setAlertDialog({
          isOpen: true,
          title: 'Status Updated',
          message: 'Document processing status has been refreshed',
          type: 'success',
        });
      }
    } catch (error: any) {
      console.error('Failed to check status:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to check processing status',
        type: 'error',
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleManualValidationClick = async () => {
    if (!contractAnalysis || !contractAnalysis.executionId) {
      console.debug('[IDPResponse] Cannot request review:', { 
        hasContractAnalysis: !!contractAnalysis, 
        hasExecutionId: !!contractAnalysis?.executionId 
      });
      setAlertDialog({
        isOpen: true,
        title: 'Missing Information',
        message: 'Cannot request review: Missing execution ID',
        type: 'warning',
      });
      return;
    }

    // Try to request review (may need credentials)
    try {
      console.debug('[IDPResponse] Requesting review for:', {
        executionId: contractAnalysis.executionId,
        jobId: contractAnalysis.jobId,
        idpExecutionId,
      });
      
      const response = await api.post('/idp-status/review', {
        executionId: contractAnalysis.executionId,
        jobId: contractAnalysis.jobId,
        idpExecutionId: idpExecutionId,
      });

      if (response.data.review) {
        console.debug('[IDPResponse] Review data received, navigating to review page');
        // Navigate to review page with the data
        navigate(`/idp-review/${analysisRecordId}?executionId=${contractAnalysis.executionId}&jobId=${contractAnalysis.jobId}&idpExecutionId=${idpExecutionId}&contractUploadId=${contractAnalysis.uploadId}`);
      }
    } catch (error: any) {
      console.error('[IDPResponse] Failed to request review:', error);
      if (error.response?.data?.needsCredentials) {
        console.debug('[IDPResponse] Credentials required, showing dialog');
        // Show credentials dialog
        setShowCredentialsDialog(true);
      } else {
        setAlertDialog({
          isOpen: true,
          title: 'Error',
          message: error.response?.data?.error || 'Failed to request review',
          type: 'error',
        });
      }
    }
  };

  const handleCredentialsSubmit = async (username: string, password: string, saveCredentials: boolean) => {
    if (!contractAnalysis || !contractAnalysis.executionId) {
      return;
    }

    try {
      const response = await api.post('/idp-status/review', {
        executionId: contractAnalysis.executionId,
        jobId: contractAnalysis.jobId,
        idpExecutionId: idpExecutionId,
        anypointUsername: username,
        anypointPassword: password,
        saveCredentials: saveCredentials,
      });

      setShowCredentialsDialog(false);

      if (response.data.review) {
        // Navigate to review page
        navigate(`/idp-review/${analysisRecordId}?executionId=${contractAnalysis.executionId}&jobId=${contractAnalysis.jobId}&idpExecutionId=${idpExecutionId}&contractUploadId=${contractAnalysis.uploadId}`);
      }
    } catch (error: any) {
      setAlertDialog({
        isOpen: true,
        title: 'Error',
        message: error.response?.data?.error || 'Failed to request review with credentials',
        type: 'error',
      });
    }
  };

  // Check if we need to poll status on mount or when approved
  useEffect(() => {
    const approved = searchParams.get('approved');
    if (approved === 'true' && contractAnalysis) {
      // Reload status after approval
      checkProcessingStatus();
    }
  }, [searchParams, contractAnalysis]);

  // Detect document type and render appropriate component
  const detectDocumentType = (data: any): 'purchaseOrder' | 'invoice' | 'contract' | 'generic' => {
    if (!data) return 'generic';
    
    // Check if it's a paginated response
    if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
      const firstPageFields = data.pages[0]?.fields || {};
      
      // Check for Purchase Order
      if ('purchaseOrderNumber' in firstPageFields) {
        return 'purchaseOrder';
      }
      
      // Check for Invoice
      if ('invoiceNumber' in firstPageFields) {
        return 'invoice';
      }
    }
    
    // Default to contract for non-paginated or unrecognized documents
    return 'contract';
  };

  const renderDocumentContent = (data: any) => {
    const docType = detectDocumentType(data);
    
    switch (docType) {
      case 'purchaseOrder':
        return <PurchaseOrderRenderer data={data} />;
      case 'invoice':
        return <InvoiceRenderer data={data} />;
      case 'contract':
        return <ContractRenderer data={data} />;
      default:
        return <GenericIDPRenderer data={data} />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-gray-600">
            Waiting for MuleSoft IDP to process the document...
          </p>
          {pollingAttempts > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Attempt {pollingAttempts} of 30
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/processing')}
            >
              Back to Processing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!contractAnalysis) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">No contract analysis data found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Logo */}
      <div className="flex items-center gap-4">
        {/* <img 
          src="/images/logos/MuleSoft-RGB-icon.png" 
          alt="MuleSoft" 
          className="w-16 h-16 object-contain"
          onError={(e) => {
            // Fallback if logo doesn't exist
            e.currentTarget.style.display = 'none';
          }}
        /> */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MuleSoft's IDP Response</h1>
          <p className="text-gray-600 mt-1">
            Document processing completed successfully
          </p>
        </div>
      </div>

      {/* Document Information Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Document Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Document Name</p>
            <p className="font-medium text-gray-900">
              {contractAnalysis.mulesoftResponse?.documentName || contractAnalysis.documentName || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Document ID</p>
            <p className="font-mono text-xs text-gray-700">
              {contractAnalysis.mulesoftResponse?.id || contractAnalysis.jobId || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Processing Status</p>
            <div className="flex items-center gap-2">
              {(contractAnalysis.mulesoftResponse?.status || contractAnalysis.status) === 'SUCCEEDED' ? (
                <>
                  <AlertCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-600 text-sm">
                    {contractAnalysis.mulesoftResponse?.status || contractAnalysis.status || 'Processing'}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-600 text-sm">
                    {contractAnalysis.mulesoftResponse?.status || contractAnalysis.status || 'Processing'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner for Manual Validation */}
      {contractAnalysis && contractAnalysis.status === 'MANUAL_VALIDATION_REQUIRED' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Manual Validation Required</h3>
              <p className="text-sm text-amber-700">
                This document requires manual review and approval before proceeding to analysis.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={checkProcessingStatus}
                disabled={isCheckingStatus}
                title="Refresh status"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={handleManualValidationClick}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Review & Approve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Document Renderer */}
      {renderDocumentContent(contractAnalysis.mulesoftResponse)}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <Button
          onClick={handleAnalyze}
          disabled={contractAnalysis?.status !== 'SUCCEEDED'}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title={contractAnalysis?.status !== 'SUCCEEDED' ? 'Processing must be completed successfully before analyzing' : ''}
        >
          <ArrowRight className="w-5 h-5 mr-2" />
          Continue to Analysis
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/processing')}
          className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        >
          Back to Processing
        </Button>
      </div>

      {contractAnalysis?.status !== 'SUCCEEDED' && (
        <p className="text-sm text-gray-500 text-center mt-4">
          {contractAnalysis?.status === 'MANUAL_VALIDATION_REQUIRED' 
            ? 'Manual validation must be completed before proceeding to analysis.'
            : 'Processing must complete successfully before proceeding to analysis.'}
        </p>
      )}

      <AnypointCredentialsDialog
        isOpen={showCredentialsDialog}
        onClose={() => setShowCredentialsDialog(false)}
        onSubmit={handleCredentialsSubmit}
      />

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

