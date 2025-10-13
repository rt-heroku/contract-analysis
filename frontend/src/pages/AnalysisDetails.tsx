import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Loading } from '@/components/common/Loading';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

export const AnalysisDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'extraction' | 'analysis'>('extraction');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMarkdown, setShowMarkdown] = useState(false);
  
  // Real data from API
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [extraction, setExtraction] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisStatus, setAnalysisStatus] = useState<'processing' | 'completed' | 'failed'>('processing');

  // Fetch analysis data from API and poll for updates
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval>;

    const fetchAnalysis = async () => {
      try {
        const response = await api.get(`/analysis/${id}`);
        const data = response.data.analysis;
        
        setAnalysisData(data);
        setAnalysisStatus(data.status);

        // If we have contract analysis, set extraction data
        if (data.contractAnalysis) {
          setExtraction({
            document: data.contractAnalysis.documentName || 'Document',
            status: data.contractAnalysis.status || 'PROCESSING',
            terms: data.contractAnalysis.terms || [],
            products: data.contractAnalysis.products || []
          });
        }

        // If we have data analysis, set result
        if (data.dataAnalysis) {
          setAnalysisResult({
            status: data.status,
            analysisMarkdown: data.dataAnalysis.analysisMarkdown || '',
            dataTable: data.dataAnalysis.dataTable || [],
            jsonData: data.dataAnalysis.mulesoftResponse?.jsonData || null
          });
        }

        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          if (pollInterval) clearInterval(pollInterval);
          setLoading(false);
        }

      } catch (err: any) {
        console.error('Failed to fetch analysis:', err);
        setError(err.response?.data?.error || 'Failed to load analysis');
        setLoading(false);
        if (pollInterval) clearInterval(pollInterval);
      }
    };

    // Initial fetch
    fetchAnalysis();

    // Poll every 5 seconds while processing
    pollInterval = setInterval(() => {
      if (analysisStatus === 'processing') {
        fetchAnalysis();
      } else {
        clearInterval(pollInterval);
      }
    }, 5000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id, analysisStatus]);

  const handleExportPDF = async () => {
    if (!extraction || !analysisResult) {
      alert('Please wait for analysis to complete before exporting PDF');
      return;
    }

    // Convert markdown to HTML using marked
    const markdownHtml = marked(analysisResult.analysisMarkdown || '');

    // Create a comprehensive PDF with all sections
    const pdfContent = document.createElement('div');
    pdfContent.style.padding = '40px';
    pdfContent.style.fontFamily = 'Arial, sans-serif';
    pdfContent.style.maxWidth = '800px';
    
    // Build complete PDF content with REAL data
    pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #1a202c; margin-bottom: 10px;">Contract Analysis Report</h1>
        <p style="color: #718096; font-size: 14px;">Generated: ${new Date().toLocaleDateString()}</p>
      </div>

      <div style="margin-bottom: 40px; padding: 20px; background: #f7fafc; border-radius: 8px;">
        <h2 style="color: #2d3748; margin-bottom: 15px; border-bottom: 2px solid #4299e1; padding-bottom: 10px;">📄 Document Extraction</h2>
        <p><strong>Document:</strong> ${extraction.document}</p>
        <p><strong>Status:</strong> <span style="color: #48bb78;">${extraction.status}</span></p>
        
        <h3 style="color: #4a5568; margin-top: 20px;">Terms:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${extraction.terms.map((term: string) => `<li style="margin: 5px 0;">${term}</li>`).join('')}
        </ul>
        
        <h3 style="color: #4a5568; margin-top: 20px;">Products:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${extraction.products.map((product: string) => `<li style="margin: 5px 0;">${product}</li>`).join('')}
        </ul>
      </div>

      <div style="margin-bottom: 40px; line-height: 1.8; color: #2d3748;">
        <h2 style="color: #2d3748; margin-bottom: 15px; border-bottom: 2px solid #4299e1; padding-bottom: 10px;">📊 Analysis Report</h2>
        <div style="
          font-size: 14px;
        ">
          ${markdownHtml}
        </div>
      </div>
      
      <style>
        /* Style markdown content for PDF */
        h1 { color: #1a202c; font-size: 24px; margin: 20px 0 10px 0; border-bottom: 2px solid #4299e1; padding-bottom: 8px; }
        h2 { color: #2d3748; font-size: 20px; margin: 18px 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        h3 { color: #4a5568; font-size: 16px; margin: 15px 0 6px 0; }
        h4 { color: #718096; font-size: 14px; margin: 12px 0 4px 0; }
        p { margin: 8px 0; line-height: 1.6; }
        ul, ol { margin: 10px 0; padding-left: 25px; }
        li { margin: 5px 0; }
        strong { color: #1a202c; font-weight: 600; }
        code { background: #f7fafc; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 13px; }
        pre { background: #f7fafc; padding: 15px; border-radius: 6px; overflow-x: auto; margin: 15px 0; }
        blockquote { border-left: 4px solid #4299e1; padding-left: 15px; margin: 15px 0; color: #4a5568; }
        table { border-collapse: collapse; width: 100%; margin: 15px 0; }
        th { background: #f7fafc; padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-weight: 600; }
        td { padding: 8px; border: 1px solid #e2e8f0; }
      </style>

      <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #718096; font-size: 12px;">
        <p>Generated by DocProcess Platform • Powered by MuleSoft</p>
        <p>${new Date().toLocaleString()}</p>
      </div>
    `;

    // Configure PDF options
    const options = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `Analysis_Report_${extraction.document.replace('.pdf', '')}_${Date.now()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    // Generate and download PDF
    try {
      await html2pdf().set(options).from(pdfContent).save();
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Show loading state
  if (loading && !analysisData) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loading size="lg" />
          <p className="text-gray-600">Loading analysis data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">Error Loading Analysis</h3>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <Button onClick={() => navigate('/history')} className="mt-4">
            Back to History
          </Button>
        </Card>
      </div>
    );
  }

  // Show failed state
  if (analysisStatus === 'failed') {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-xl font-semibold text-red-600">Processing Failed</h3>
              <p className="text-sm text-gray-600 mt-1">
                The document processing could not be completed.
              </p>
            </div>
          </div>
          
          {analysisData?.errorMessage && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-1">Error Details:</p>
              <p className="text-sm text-red-700">{analysisData.errorMessage}</p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-600">
              <strong>Possible reasons:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
              <li>MuleSoft service is not running or not reachable</li>
              <li>Network connectivity issues</li>
              <li>Service timeout (processing took longer than expected)</li>
              <li>Invalid document format or corrupted file</li>
            </ul>
          </div>

          <div className="mt-6 flex gap-3">
            <Button 
              onClick={() => {
                // Navigate to processing page with jobId to load existing uploads
                const jobId = analysisData?.jobId;
                if (jobId) {
                  navigate(`/processing?jobId=${jobId}`);
                } else {
                  navigate('/processing');
                }
              }} 
              className="bg-primary-600 hover:bg-primary-700"
            >
              Retry with Same Files
            </Button>
            <Button 
              variant="secondary"
              onClick={() => navigate('/history')}
            >
              Back to History
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Use real data only
  if (!extraction || !analysisResult) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loading size="lg" />
          <p className="text-gray-600">Waiting for MuleSoft analysis to complete...</p>
          <p className="text-sm text-gray-500">This may take 1-2 minutes</p>
        </div>
      </div>
    );
  }

  const displayExtraction = extraction;
  const displayAnalysis = analysisResult;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/history')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analysis Details</h1>
            <p className="text-gray-600 mt-1">
              Document: <span className="font-medium">{displayExtraction.document}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Download className="w-5 h-5" />
            Download PDF Report
          </Button>
          <Badge variant={displayExtraction.status === 'SUCCEEDED' ? 'success' : 'warning'}>
            {displayExtraction.status}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('extraction')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'extraction'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Document Extraction
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'analysis'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {analysisStatus === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-600" />
              )}
              Final Analysis
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'extraction' && (
        <div className="space-y-6">
          {/* Terms Section */}
          <Card title="Extracted Terms">
            <div className="space-y-3">
              {displayExtraction.terms.map((term: string, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <p className="text-gray-800">{term}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Products Section */}
          <Card title="Extracted Products">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayExtraction.products.map((product: string, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {analysisStatus === 'processing' ? (
            <Card>
              <div className="text-center py-16">
                <Loading size="lg" />
                <p className="text-gray-700 font-medium mt-6">
                  Analyzing document and generating report...
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  This usually takes 30-60 seconds
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* JSON Data Table */}
              <Card 
                title="Analysis Summary"
                actions={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowMarkdown(!showMarkdown)}
                  >
                    {showMarkdown ? 'Show Summary' : 'Show Full Report'}
                  </Button>
                }
              >
                {!showMarkdown ? (
                  displayAnalysis.jsonData ? (
                    <div className="space-y-6">
                      {/* Compliance Score Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg border-2 border-indigo-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-indigo-600 text-sm font-medium uppercase tracking-wide">Compliance Score</p>
                            <p className="text-5xl font-bold text-indigo-900 mt-2">
                              {displayAnalysis.jsonData.compliance_score || 'N/A'}
                            </p>
                          </div>
                          <CheckCircle className="w-16 h-16 text-indigo-600 opacity-20" />
                        </div>
                      </div>

                      {/* Validation Summary Grid */}
                      {displayAnalysis.jsonData.validation_summary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                            <p className="text-green-600 text-sm font-medium">Matched Products</p>
                            <p className="text-3xl font-bold text-green-900 mt-1">
                              {displayAnalysis.jsonData.validation_summary.matched_products?.length || 0}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                            <p className="text-red-600 text-sm font-medium">Missing Products</p>
                            <p className="text-3xl font-bold text-red-900 mt-1">
                              {displayAnalysis.jsonData.validation_summary.missing_products?.length || 0}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                            <p className="text-yellow-600 text-sm font-medium">Quantity Issues</p>
                            <p className="text-3xl font-bold text-yellow-900 mt-1">
                              {displayAnalysis.jsonData.validation_summary.quantity_discrepancies?.length || 0}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                            <p className="text-purple-600 text-sm font-medium">Pricing Issues</p>
                            <p className="text-3xl font-bold text-purple-900 mt-1">
                              {displayAnalysis.jsonData.validation_summary.pricing_issues?.length || 0}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Contract Terms */}
                      {displayAnalysis.jsonData.contract_summary?.terms && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Contract Terms</h3>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <ul className="space-y-2">
                              {displayAnalysis.jsonData.contract_summary.terms.map((term: string, index: number) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-blue-600 mt-1">•</span>
                                  <span className="text-gray-700">{term}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Quantity Discrepancies Table */}
                      {displayAnalysis.jsonData.validation_summary?.quantity_discrepancies?.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">⚠️ Quantity Discrepancies</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-red-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                                    Product
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                                    Expected
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                                    Actual
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                                    Difference
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {displayAnalysis.jsonData.validation_summary.quantity_discrepancies.map((item: any, index: number) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                      {item.product}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                      {item.expected}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                      {item.actual}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                      <Badge variant="error">
                                        +{item.actual - item.expected}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Anomalies */}
                      {displayAnalysis.jsonData.anomalies_detected?.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">🔍 Anomalies Detected</h3>
                          <div className="space-y-3">
                            {displayAnalysis.jsonData.anomalies_detected.map((anomaly: any, index: number) => (
                              <div key={index} className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                <h4 className="font-semibold text-yellow-900 mb-2">{anomaly.issue}</h4>
                                <p className="text-sm text-yellow-800 mb-1"><strong>Explanation:</strong> {anomaly.explanation}</p>
                                <p className="text-sm text-yellow-800"><strong>Possible Cause:</strong> {anomaly.possible_cause}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {displayAnalysis.jsonData.recommendations?.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Recommendations</h3>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <ol className="space-y-2 list-decimal list-inside">
                              {displayAnalysis.jsonData.recommendations.map((rec: string, index: number) => (
                                <li key={index} className="text-blue-900">{rec}</li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-2">Detailed analysis summary not available.</p>
                      <p className="text-sm">The markdown report below contains the full analysis.</p>
                    </div>
                  )
                ) : (
                  <div className="markdown-content prose max-w-none">
                    <ReactMarkdown>{displayAnalysis.analysisMarkdown || displayAnalysis.markdownReport}</ReactMarkdown>
                  </div>
                )}
              </Card>

              {/* Full Markdown Report Section - Always Visible */}
              <Card 
                title="📄 Full Analysis Report"
                actions={
                  <Button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export to PDF
                  </Button>
                }
              >
                <div className="markdown-content prose max-w-none">
                  <ReactMarkdown>{displayAnalysis.markdownReport}</ReactMarkdown>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};

