import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
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

// Mock data for UI development
const MOCK_EXTRACTION = {
  document: "Dreamfields_Distribution_Agreement_Puff_Utica_REC.pdf",
  status: "SUCCEEDED",
  terms: [
    "Promotional discount funded 50% by Distributor and 50% by Retailer (25/25 split). SRP markdowns must comply with state minimums. Approved mechanics: price-drop",
    " bundle (2 for)",
    " cart add-on. Limits: 4 units per customer/day."
  ],
  products: [
    "Infused Jeeter XL 2g Blueberry Kush - Units sold (ref): 4",
    "Infused Jeeter 1g Blue ZKZ - Units sold (ref): 3",
    "Infused Jeeter 1g Preroll Strawberry Cough - Units sold (ref): 3",
    "Infused Jeeter Resin Cannons 0.5g X 3 Prerolls Scott's OG - Units sold (ref): 3",
    "Infused Baby Jeeter 0.5g X 5 (2.5g) Preroll Island Papaya - Units sold (ref): 3",
    "Infused Baby Jeeter 0.5g X 5 Tropicali - Units sold (ref): 3",
    "Infused Baby Jeeter 0.5g X 5 (2.5g) Preroll Pink Lemon - Units sold (ref): 3",
    "Infused Baby Jeeter 0.5g X 5 Sour Tsunami - Units sold (ref): 3",
    "Infused Jeeter 1g Preroll Milkman - Units sold (ref): 3",
    "Infused Baby Jeeter 0.5g X 5 Peaches - Units sold (ref): 3"
  ]
};

const MOCK_ANALYSIS_RESULT = {
  status: "Ready",
  jsonData: {
    summary: {
      totalProducts: 10,
      totalUnits: 31,
      distributionModel: "50/50 Split",
      complianceStatus: "Compliant"
    },
    keyTerms: {
      fundingStructure: "50% Distributor, 50% Retailer (25/25 split)",
      pricingCompliance: "SRP markdowns comply with state minimums",
      approvedMechanics: ["price-drop", "bundle (2 for)", "cart add-on"],
      customerLimit: "4 units per customer/day"
    },
    productBreakdown: [
      { product: "Infused Jeeter XL 2g Blueberry Kush", unitsSold: 4, category: "Premium" },
      { product: "Infused Jeeter 1g Blue ZKZ", unitsSold: 3, category: "Standard" },
      { product: "Infused Jeeter 1g Preroll Strawberry Cough", unitsSold: 3, category: "Standard" },
      { product: "Infused Jeeter Resin Cannons", unitsSold: 3, category: "Specialty" },
      { product: "Baby Jeeter Island Papaya", unitsSold: 3, category: "Mini" },
      { product: "Baby Jeeter Tropicali", unitsSold: 3, category: "Mini" },
      { product: "Baby Jeeter Pink Lemon", unitsSold: 3, category: "Mini" },
      { product: "Baby Jeeter Sour Tsunami", unitsSold: 3, category: "Mini" },
      { product: "Infused Jeeter Milkman", unitsSold: 3, category: "Standard" },
      { product: "Baby Jeeter Peaches", unitsSold: 3, category: "Mini" }
    ]
  },
  markdownReport: `# Distribution Agreement Analysis Report

## Document Information
- **File**: Dreamfields_Distribution_Agreement_Puff_Utica_REC.pdf
- **Analysis Date**: ${new Date().toLocaleDateString()}
- **Status**: ✅ Complete

---

## Executive Summary

This distribution agreement establishes a **50/50 promotional discount funding model** between the Distributor and Retailer, with a 25/25 split structure. All pricing mechanisms comply with state-mandated minimum pricing requirements.

### Key Metrics
- **Total Products**: 10
- **Total Units Sold**: 31
- **Compliance Status**: ✅ Fully Compliant
- **Distribution Model**: 50% Distributor / 50% Retailer

---

## Terms & Conditions

### Funding Structure
The promotional discount is funded equally between parties:
- **Distributor Contribution**: 50% (25% effective split)
- **Retailer Contribution**: 50% (25% effective split)

### Pricing Compliance
All suggested retail price (SRP) markdowns must:
- Comply with state minimum pricing requirements
- Follow approved promotional mechanics
- Maintain regulatory compliance

### Approved Promotional Mechanics
1. **Price Drop**: Direct price reduction at point of sale
2. **Bundle Offers**: "2 for" promotional pricing
3. **Cart Add-On**: Additional product incentives

### Purchase Limitations
- **Maximum per customer**: 4 units per day
- **Enforcement**: Point-of-sale restrictions apply

---

## Product Analysis

### Premium Category (1 product)
- **Infused Jeeter XL 2g Blueberry Kush**
  - Units Sold: 4
  - Performance: High demand premium product

### Standard Category (3 products)
| Product | Units Sold | Notes |
|---------|-----------|-------|
| Infused Jeeter 1g Blue ZKZ | 3 | Standard performance |
| Infused Jeeter 1g Strawberry Cough | 3 | Consistent sales |
| Infused Jeeter 1g Milkman | 3 | Steady demand |

### Specialty Category (1 product)
- **Infused Jeeter Resin Cannons 0.5g X 3**
  - Units Sold: 3
  - Specialty Scott's OG blend

### Mini Category (5 products)
| Product | Units Sold | Size |
|---------|-----------|------|
| Baby Jeeter Island Papaya | 3 | 0.5g X 5 (2.5g) |
| Baby Jeeter Tropicali | 3 | 0.5g X 5 |
| Baby Jeeter Pink Lemon | 3 | 0.5g X 5 (2.5g) |
| Baby Jeeter Sour Tsunami | 3 | 0.5g X 5 |
| Baby Jeeter Peaches | 3 | 0.5g X 5 |

---

## Distribution Insights

### Sales Performance
- **Average units per product**: 3.1 units
- **Top performer**: Infused Jeeter XL 2g Blueberry Kush (4 units)
- **Category breakdown**: 
  - Mini products: 48% (5 products)
  - Standard products: 29% (3 products)
  - Premium products: 10% (1 product)
  - Specialty products: 10% (1 product)

### Compliance Verification
✅ All terms comply with state regulations  
✅ Promotional mechanics approved  
✅ Customer limits enforced  
✅ Pricing structure validated  

---

## Recommendations

1. **Expand Premium Line**: Consider increasing inventory of premium 2g products based on strong performance
2. **Bundle Opportunities**: Leverage approved "2 for" mechanics for Mini category products
3. **Seasonal Promotions**: Implement cart add-on strategy during peak periods
4. **Compliance Monitoring**: Continue regular audits to maintain regulatory compliance

---

## Conclusion

The distribution agreement demonstrates a balanced, compliant approach to promotional funding with strong product diversity. The 50/50 split model ensures fair distribution of promotional costs while maintaining competitive pricing within state regulatory frameworks.

**Overall Status**: ✅ Approved and Compliant

---

*Report generated by DreamFields Document Processing System*  
*For questions or clarifications, contact your distribution manager*
`
};

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
            dataTable: data.dataAnalysis.dataTable || []
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

      <div style="margin-bottom: 40px;">
        ${document.querySelector('.markdown-content')?.innerHTML || analysisResult.analysisMarkdown}
      </div>

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

  // Use real data or fallback to mock for display
  const displayExtraction = extraction || MOCK_EXTRACTION;
  const displayAnalysis = analysisResult || MOCK_ANALYSIS_RESULT;

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
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <p className="text-blue-600 text-sm font-medium">Total Products</p>
                        <p className="text-3xl font-bold text-blue-900 mt-1">
                          {MOCK_ANALYSIS_RESULT.jsonData.summary.totalProducts}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <p className="text-green-600 text-sm font-medium">Total Units</p>
                        <p className="text-3xl font-bold text-green-900 mt-1">
                          {MOCK_ANALYSIS_RESULT.jsonData.summary.totalUnits}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <p className="text-purple-600 text-sm font-medium">Distribution Model</p>
                        <p className="text-lg font-bold text-purple-900 mt-1">
                          {MOCK_ANALYSIS_RESULT.jsonData.summary.distributionModel}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
                        <p className="text-emerald-600 text-sm font-medium">Compliance</p>
                        <p className="text-lg font-bold text-emerald-900 mt-1 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          {MOCK_ANALYSIS_RESULT.jsonData.summary.complianceStatus}
                        </p>
                      </div>
                    </div>

                    {/* Key Terms */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Terms</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-700">Funding:</span>
                          <span className="text-gray-900">{MOCK_ANALYSIS_RESULT.jsonData.keyTerms.fundingStructure}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-700">Compliance:</span>
                          <span className="text-gray-900">{MOCK_ANALYSIS_RESULT.jsonData.keyTerms.pricingCompliance}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-700">Mechanics:</span>
                          <span className="text-gray-900">{MOCK_ANALYSIS_RESULT.jsonData.keyTerms.approvedMechanics.join(', ')}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-700">Limit:</span>
                          <span className="text-gray-900">{MOCK_ANALYSIS_RESULT.jsonData.keyTerms.customerLimit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Product Breakdown Table */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Breakdown</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Units Sold
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {MOCK_ANALYSIS_RESULT.jsonData.productBreakdown.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {item.product}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  <Badge variant={
                                    item.category === 'Premium' ? 'success' :
                                    item.category === 'Specialty' ? 'warning' : 'default'
                                  }>
                                    {item.category}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                  {item.unitsSold}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
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
                  <ReactMarkdown>{MOCK_ANALYSIS_RESULT.markdownReport}</ReactMarkdown>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};

