import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';
import { 
  ArrowRight, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Building, 
  MapPin, 
  Phone, 
  Calendar,
  ShieldCheck,
  Package,
  Users
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
  const [analyzing, setAnalyzing] = useState(false);
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
          {/* Document Information */}
          <Card title="Document Information">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Document Name</p>
                <p className="font-medium text-gray-900">{contractAnalysis.mulesoftResponse?.documentName || contractAnalysis.documentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Document ID</p>
                <p className="font-mono text-xs text-gray-700">{contractAnalysis.mulesoftResponse?.id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Processing Status</p>
                <div className="flex items-center gap-2">
                  {(contractAnalysis.mulesoftResponse?.status || contractAnalysis.status)?.toLowerCase().includes('success') ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-600">Success</span>
                    </>
                  ) : (contractAnalysis.mulesoftResponse?.status || contractAnalysis.status)?.includes('VALIDATION') ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-600 text-xs">{contractAnalysis.mulesoftResponse?.status || contractAnalysis.status}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-600 text-xs">{contractAnalysis.mulesoftResponse?.status || contractAnalysis.status}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Document Summary */}
            {contractAnalysis.mulesoftResponse?.documentSummary && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Document Summary</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {contractAnalysis.mulesoftResponse.documentSummary.replace(/^NOT PARSED:\s*/i, '')}
                </p>
              </div>
            )}
          </Card>

          {/* Parties Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Distributor */}
            {contractAnalysis.mulesoftResponse?.distributor?.distributor && (
              <Card title={
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary-600" />
                  <span>Distributor</span>
                </div>
              }>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {contractAnalysis.mulesoftResponse.distributor.distributor.name}
                    </p>
                  </div>
                  {contractAnalysis.mulesoftResponse.distributor.distributor.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{contractAnalysis.mulesoftResponse.distributor.distributor.address.address}</p>
                        <p>
                          {contractAnalysis.mulesoftResponse.distributor.distributor.address.city}, {contractAnalysis.mulesoftResponse.distributor.distributor.address.state} {contractAnalysis.mulesoftResponse.distributor.distributor.address.zipcode}
                        </p>
                      </div>
                    </div>
                  )}
                  {contractAnalysis.mulesoftResponse.distributor.distributor.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{contractAnalysis.mulesoftResponse.distributor.distributor.phone}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Retailer */}
            {contractAnalysis.mulesoftResponse?.retailer?.retailer && (
              <Card title={
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-green-600" />
                  <span>Retailer</span>
                </div>
              }>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {contractAnalysis.mulesoftResponse.retailer.retailer.name}
                    </p>
                  </div>
                  {contractAnalysis.mulesoftResponse.retailer.retailer.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{contractAnalysis.mulesoftResponse.retailer.retailer.address.address}</p>
                        <p>
                          {contractAnalysis.mulesoftResponse.retailer.retailer.address.city}, {contractAnalysis.mulesoftResponse.retailer.retailer.address.state} {contractAnalysis.mulesoftResponse.retailer.retailer.address.zipcode}
                        </p>
                      </div>
                    </div>
                  )}
                  {contractAnalysis.mulesoftResponse.retailer.retailer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{contractAnalysis.mulesoftResponse.retailer.retailer.phone}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Agreement Dates */}
          {contractAnalysis.mulesoftResponse?.createdDates && (
            <Card title={
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span>Agreement Information</span>
              </div>
            }>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Agreement Date</p>
                  <p className="font-medium text-gray-900">
                    {contractAnalysis.mulesoftResponse.createdDates.agreedDate || 
                     contractAnalysis.mulesoftResponse.createdDates.agreed_date || 'N/A'}
                  </p>
                </div>
                {contractAnalysis.mulesoftResponse.createdDates.parties && Array.isArray(contractAnalysis.mulesoftResponse.createdDates.parties) && contractAnalysis.mulesoftResponse.createdDates.parties.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Parties</p>
                    <div className="space-y-1">
                      {contractAnalysis.mulesoftResponse.createdDates.parties.map((party: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-gray-500" />
                          <span className="text-sm text-gray-800">{party}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Contract Terms */}
          {contractAnalysis.mulesoftResponse?.terms && (
            <Card title={
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Contract Terms</span>
              </div>
            }>
              {/* Handle terms as array */}
              {Array.isArray(contractAnalysis.mulesoftResponse.terms) && contractAnalysis.mulesoftResponse.terms.length > 0 && (
                <div className="space-y-3">
                  {contractAnalysis.mulesoftResponse.terms.map((term: string, index: number) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-blue-700">{index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-800 flex-1">{term}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Handle terms as string */}
              {typeof contractAnalysis.mulesoftResponse.terms === 'string' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {contractAnalysis.mulesoftResponse.terms}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Purpose */}
          {contractAnalysis.mulesoftResponse?.purpose && (
            <Card title="Agreement Purpose">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {contractAnalysis.mulesoftResponse.purpose.replace(/^NOT PARSED:\s*/i, '')}
                </p>
              </div>
            </Card>
          )}

          {/* Promotional Math */}
          {contractAnalysis.mulesoftResponse?.promotionalMath && (
            <Card title="Promotional Mathematics">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {contractAnalysis.mulesoftResponse.promotionalMath.replace(/^NOT PARSED:\s*/i, '')}
                </p>
              </div>
            </Card>
          )}

          {/* Display Requirements */}
          {contractAnalysis.mulesoftResponse?.display && (
            <Card title="Display Requirements">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {contractAnalysis.mulesoftResponse.display.replace(/^NOT PARSED:\s*/i, '')}
                </p>
              </div>
            </Card>
          )}

          {/* Termination */}
          {contractAnalysis.mulesoftResponse?.termination && (
            <Card title="Termination Clause">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {contractAnalysis.mulesoftResponse.termination.replace(/^NOT PARSED:\s*/i, '')}
                </p>
              </div>
            </Card>
          )}

          {/* Compliance */}
          {contractAnalysis.mulesoftResponse?.compliance && Array.isArray(contractAnalysis.mulesoftResponse.compliance) && contractAnalysis.mulesoftResponse.compliance.length > 0 && (
            <Card title={
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <span>Compliance Requirements</span>
              </div>
            }>
              <div className="space-y-2">
                {contractAnalysis.mulesoftResponse.compliance.map((item: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-800">{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Products */}
          {contractAnalysis.mulesoftResponse?.products && Array.isArray(contractAnalysis.mulesoftResponse.products) && contractAnalysis.mulesoftResponse.products.length > 0 && (
            <Card title={
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                <span>Products ({contractAnalysis.mulesoftResponse.products.length})</span>
              </div>
            }>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Units Sold (Ref)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ref. Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contractAnalysis.mulesoftResponse.products.map((product: any, index: number) => {
                      // Handle product which might be a string or an object
                      const productName = typeof product === 'object' && product !== null
                        ? product.name || 'Unknown Product'
                        : product || 'Unknown Product';
                      const unitsSold = typeof product === 'object' && product !== null
                        ? (product.units_sold || product['units sold (ref)'] || 'N/A')
                        : 'N/A';
                      const refPrice = typeof product === 'object' && product !== null
                        ? (product.ref_price || product['ref. price'] || 'N/A')
                        : 'N/A';
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {productName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {unitsSold}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {refPrice !== 'N/A' && !isNaN(Number(refPrice)) ? `$${Number(refPrice).toFixed(2)}` : refPrice}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Full Response (JSON) - Collapsible */}
          {contractAnalysis.mulesoftResponse && (
            <Card title="Full MuleSoft IDP Response (Raw JSON)">
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-gray-700 hover:text-gray-900 py-2">
                  Click to expand raw JSON response
                </summary>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs mt-2 border border-gray-200">
                  {JSON.stringify(contractAnalysis.mulesoftResponse, null, 2)}
                </pre>
              </details>
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

