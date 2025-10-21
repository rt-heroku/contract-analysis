import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { GenericIDPRenderer } from '@/components/idp/GenericIDPRenderer';
import { ContractRenderer } from '@/components/idp/ContractRenderer';
import { PurchaseOrderRenderer } from '@/components/idp/PurchaseOrderRenderer';
import { InvoiceRenderer } from '@/components/idp/InvoiceRenderer';
import { 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';

interface ContractAnalysis {
  id: number;
  uploadId: number;
  jobId: string;
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
  const [loading, setLoading] = useState(true);
  const [contractAnalysis, setContractAnalysis] = useState<ContractAnalysis | null>(null);
  const [error, setError] = useState('');
  const [pollingAttempts, setPollingAttempts] = useState(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const loadContractAnalysis = async () => {
      // First, try to load immediately (in case data already exists)
      try {
        const response = await api.get(`/analysis/${analysisRecordId}/contract`);
        
        if (response.data.contractAnalysis) {
          // Data already exists! Load it immediately (no polling needed)
          console.log('IDP response already exists, loading immediately');
          if (isMounted) {
            setContractAnalysis(response.data.contractAnalysis);
            setLoading(false);
            setError('');
          }
          return; // Exit early, no need to poll
        }
      } catch (err: any) {
        // If data doesn't exist yet, we'll start polling below
        console.log('IDP response not ready yet, starting polling...');
      }

      // Data doesn't exist yet, start polling
      const pollContractAnalysis = async () => {
        const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max
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
                timeoutId = setTimeout(poll, 2000); // Poll every 2 seconds
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
                timeoutId = setTimeout(poll, 2000);
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

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [analysisRecordId]);

  const handleAnalyze = () => {
    // Navigate to analysis setup page
    navigate(`/analysis-setup/${analysisRecordId}`);
  };

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
        <img 
          src="/images/logos/MuleSoft-RGB-icon.png" 
          alt="MuleSoft" 
          className="w-16 h-16 object-contain"
          onError={(e) => {
            // Fallback if logo doesn't exist
            e.currentTarget.style.display = 'none';
          }}
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MuleSoft's IDP Response</h1>
          <p className="text-gray-600 mt-1">
            Document processing completed successfully
          </p>
        </div>
      </div>

      {/* Smart Document Renderer */}
      {renderDocumentContent(contractAnalysis.mulesoftResponse)}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <Button
          onClick={handleAnalyze}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
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
    </div>
  );
};

