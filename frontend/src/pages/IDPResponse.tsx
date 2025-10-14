import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { ArrowRight, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
  const [analyzing, setAnalyzing] = useState(false);
  const [contractAnalysis, setContractAnalysis] = useState<ContractAnalysis | null>(null);
  const [error, setError] = useState('');
  const [pollingAttempts, setPollingAttempts] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
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
                timeoutId = setTimeout(poll, 2000); // Poll every 2 seconds
              } else if (isMounted) {
                setError('Timeout: Contract processing is taking longer than expected. Please try again.');
                setLoading(false);
              }
            } else {
              // Real error, stop polling
              console.error('Failed to fetch contract analysis:', err);
              if (isMounted) {
                setError(errorMessage || 'Failed to load IDP response');
                setLoading(false);
              }
            }
          }
        };

        poll();
      };

      pollContractAnalysis();
    };

    if (analysisRecordId) {
      loadContractAnalysis();
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [analysisRecordId]);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      setError('');
      
      // Trigger the analyze step
      await api.post(`/analysis/${analysisRecordId}/analyze`);
      
      // Navigate to analysis details page
      navigate(`/analysis/${analysisRecordId}`);
    } catch (err: any) {
      console.error('Failed to start analysis:', err);
      setError(err.response?.data?.error || 'Failed to start analysis');
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md">
          <Loading size="lg" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Document with MuleSoft IDP
            </h3>
            <p className="text-gray-600 mb-2">
              Extracting terms, products, and key information from your contract...
            </p>
            <p className="text-sm text-gray-500">
              This usually takes 10-15 seconds
            </p>
            {pollingAttempts > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Checking... (attempt {pollingAttempts}/30)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error && !contractAnalysis) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-xl font-semibold text-red-600">Error Loading IDP Response</h3>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={() => navigate('/processing')}>
              Back to Processing
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Logo */}
      <div className="flex items-center gap-4">
        <img 
          src="/uploads/logos/MuleSoft-RGB-icon.png" 
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

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* IDP Response Details */}
      {contractAnalysis && (
        <>
          <Card title="Document Information">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Document Name</p>
                <p className="font-medium text-gray-900">{contractAnalysis.documentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="flex items-center gap-2">
                  {contractAnalysis.status === 'success' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-600">Success</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-600">{contractAnalysis.status}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Contract Terms */}
          {contractAnalysis.terms && contractAnalysis.terms.length > 0 && (
            <Card title="Extracted Terms">
              <div className="space-y-3">
                {contractAnalysis.terms.map((term, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-800">{term}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Products */}
          {contractAnalysis.products && contractAnalysis.products.length > 0 && (
            <Card title="Extracted Products">
              <div className="space-y-2">
                {contractAnalysis.products.map((product, index) => (
                  <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-gray-800">{product}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Full Response (JSON) */}
          {contractAnalysis.mulesoftResponse && (
            <Card title="Full MuleSoft IDP Response">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(contractAnalysis.mulesoftResponse, null, 2)}
              </pre>
            </Card>
          )}

          {/* Analyze Button */}
          <div className="flex gap-4">
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              isLoading={analyzing}
              size="lg"
              className="bg-primary-600 hover:bg-primary-700"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              {analyzing ? 'Starting Analysis...' : 'Analyze with AI'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/processing')}
              disabled={analyzing}
            >
              Back to Processing
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

