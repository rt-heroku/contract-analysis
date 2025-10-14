import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  const [activeTab, setActiveTab] = useState<'extraction' | 'analysis' | 'json' | 'markdown'>('extraction');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownView, setMarkdownView] = useState<'preview' | 'code'>('preview');
  
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
            analysisMarkdown: data.dataAnalysis.analysisMarkdown || data.dataAnalysis.mulesoftResponse?.analysis_markdown || '',
            dataTable: data.dataAnalysis.dataTable || [],
            jsonData: data.dataAnalysis.mulesoftResponse?.jsonData || null,
            mulesoftResponse: data.dataAnalysis.mulesoftResponse || null
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

      <div style="margin-bottom: 40px; padding: 20px; background: #f7fafc; border-radius: 8px; page-break-after: always;">
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

      <div style="margin-bottom: 40px; line-height: 1.8; color: #2d3748; page-break-before: always;">
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
          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'json'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              JSON Response
            </div>
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'markdown'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Full Report
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

                      {/* Contract Summary */}
                      {displayAnalysis.jsonData.contract_summary && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <h3 className="text-lg font-semibold mb-4">Contract Summary</h3>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Document</p>
                              <p className="text-gray-900">{displayAnalysis.jsonData.contract_summary.document}</p>
                            </div>
                            {displayAnalysis.jsonData.contract_summary.terms && (
                              <div>
                                <p className="text-sm font-medium text-gray-500 mb-2">Terms</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {displayAnalysis.jsonData.contract_summary.terms.map((term: string, idx: number) => (
                                    <li key={idx} className="text-gray-700">{term}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {displayAnalysis.jsonData.contract_summary.promo_funding && (
                              <div>
                                <p className="text-sm font-medium text-gray-500">Promotional Funding</p>
                                <p className="text-gray-900">
                                  Distributor: {(displayAnalysis.jsonData.contract_summary.promo_funding.distributor_pct * 100).toFixed(0)}% | 
                                  Retailer: {(displayAnalysis.jsonData.contract_summary.promo_funding.retailer_pct * 100).toFixed(0)}%
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Line Items Analysis Table */}
                      {displayAnalysis.jsonData.line_items_analysis && displayAnalysis.jsonData.line_items_analysis.length > 0 && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                          <h3 className="text-lg font-semibold mb-4">Line Items Analysis</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Disc</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flags</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {displayAnalysis.jsonData.line_items_analysis.map((item: any, idx: number) => (
                                  <tr key={idx} className={item.flags && item.flags.length > 0 ? 'bg-red-50' : ''}>
                                    <td className="px-4 py-3 text-sm text-gray-900">{item.product_name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">{item.items_sold_with_multiplier}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">${item.unit_price_paid}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">${item.discount_value_per_unit} ({(item.discount_percent * 100).toFixed(1)}%)</td>
                                    <td className="px-4 py-3 text-sm text-gray-900">${item.discount_value_total}</td>
                                    <td className="px-4 py-3 text-sm">
                                      {item.flags && item.flags.length > 0 ? (
                                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                          {item.flags.join(', ')}
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">OK</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Totals Summary */}
                      {displayAnalysis.jsonData.totals_summary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                            <p className="text-blue-600 text-sm font-medium">Total Items Sold</p>
                            <p className="text-3xl font-bold text-blue-900 mt-1">
                              {displayAnalysis.jsonData.totals_summary.grand_items_sold_with_multiplier || 0}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                            <p className="text-purple-600 text-sm font-medium">Total Discount</p>
                            <p className="text-3xl font-bold text-purple-900 mt-1">
                              ${displayAnalysis.jsonData.totals_summary.grand_discount_value || 0}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                            <p className="text-green-600 text-sm font-medium">Distributor Owes</p>
                            <p className="text-3xl font-bold text-green-900 mt-1">
                              ${displayAnalysis.jsonData.totals_summary.grand_distributor_owes_retailer || 0}
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                            <p className="text-yellow-600 text-sm font-medium">Retailer Funded</p>
                            <p className="text-3xl font-bold text-yellow-900 mt-1">
                              ${displayAnalysis.jsonData.totals_summary.grand_retailer_funded_amount || 0}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {displayAnalysis.jsonData.recommendations && displayAnalysis.jsonData.recommendations.length > 0 && (
                        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                          <h3 className="text-lg font-semibold text-yellow-900 mb-3">💡 Recommendations</h3>
                          <ol className="space-y-2 list-decimal list-inside">
                            {displayAnalysis.jsonData.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-yellow-900">{rec}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="mb-2">No analysis data available.</p>
                    </div>
                  )
                ) : (
                  <div className="markdown-content prose prose-slate max-w-none
                                prose-table:border-collapse prose-table:w-full prose-table:text-sm
                                prose-thead:bg-gradient-to-r prose-thead:from-blue-500 prose-thead:to-indigo-600
                                prose-th:text-white prose-th:font-semibold prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-blue-400
                                prose-td:p-3 prose-td:border prose-td:border-gray-300
                                prose-tr:even:bg-gray-50 prose-tr:hover:bg-blue-50 prose-tr:transition-colors">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {((displayAnalysis.analysisMarkdown || displayAnalysis.markdownReport) || '').replace(/\\n/g, '\n')}
                    </ReactMarkdown>
                  </div>
                )}
              </Card>

              {/* Full Markdown Report Section - Only if markdown exists */}
              {displayAnalysis.markdownReport && (
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
                  <div className="markdown-content prose prose-slate max-w-none
                                prose-table:border-collapse prose-table:w-full prose-table:text-sm
                                prose-thead:bg-gradient-to-r prose-thead:from-blue-500 prose-thead:to-indigo-600
                                prose-th:text-white prose-th:font-semibold prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-blue-400
                                prose-td:p-3 prose-td:border prose-td:border-gray-300
                                prose-tr:even:bg-gray-50 prose-tr:hover:bg-blue-50 prose-tr:transition-colors">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {(displayAnalysis.markdownReport || '').replace(/\\n/g, '\n')}
                    </ReactMarkdown>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* JSON Response Tab */}
      {activeTab === 'json' && (
        <div className="space-y-6">
          <Card title="MuleSoft Response (JSON)">
            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
              <code className="text-gray-800">
                {JSON.stringify(analysisResult, null, 2)}
              </code>
            </pre>
          </Card>
        </div>
      )}

      {/* Markdown Tab */}
      {activeTab === 'markdown' && (
        <div className="space-y-6">
          <Card 
            title="Analysis Report"
            actions={
              <div className="flex gap-2">
                <Button
                  variant={markdownView === 'preview' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setMarkdownView('preview')}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Preview
                </Button>
                <Button
                  variant={markdownView === 'code' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setMarkdownView('code')}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Code
                </Button>
              </div>
            }
          >
            {analysisResult?.analysisMarkdown ? (
              <>
                {markdownView === 'preview' ? (
                  <div className="markdown-content prose prose-slate max-w-none bg-white p-6 rounded-lg border border-gray-200 
                                prose-headings:text-gray-900 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                                prose-p:text-gray-700 prose-strong:text-gray-900
                                prose-table:border-collapse prose-table:w-full prose-table:text-sm
                                prose-thead:bg-gradient-to-r prose-thead:from-blue-500 prose-thead:to-indigo-600
                                prose-th:text-white prose-th:font-semibold prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-blue-400
                                prose-td:p-3 prose-td:border prose-td:border-gray-300
                                prose-tr:even:bg-gray-50 prose-tr:hover:bg-blue-50 prose-tr:transition-colors
                                prose-ul:list-disc prose-ul:pl-5 prose-li:text-gray-700
                                prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analysisResult.analysisMarkdown.replace(/\\n/g, '\n')}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg text-sm overflow-x-auto">
                    <code>
                      {analysisResult.analysisMarkdown}
                    </code>
                  </pre>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">No markdown content available.</p>
                <p className="text-sm text-gray-400">
                  The MuleSoft response did not include markdown. Check the JSON Response tab for the full data.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

