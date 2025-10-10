"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisDetails = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const react_markdown_1 = __importDefault(require("react-markdown"));
const html2pdf_js_1 = __importDefault(require("html2pdf.js"));
const Card_1 = require("@/components/common/Card");
const Button_1 = require("@/components/common/Button");
const Badge_1 = require("@/components/common/Badge");
const Loading_1 = require("@/components/common/Loading");
const lucide_react_1 = require("lucide-react");
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
const AnalysisDetails = () => {
    const { id: _id } = (0, react_router_dom_1.useParams)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [activeTab, setActiveTab] = (0, react_1.useState)('extraction');
    const [analysisStatus, setAnalysisStatus] = (0, react_1.useState)('processing');
    const [showMarkdown, setShowMarkdown] = (0, react_1.useState)(false);
    // Simulate polling for analysis completion
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => {
            setAnalysisStatus('ready');
        }, 3000); // Simulate 3 second processing
        return () => clearTimeout(timer);
    }, []);
    const handleExportPDF = async () => {
        // Create a comprehensive PDF with all sections
        const pdfContent = document.createElement('div');
        pdfContent.style.padding = '40px';
        pdfContent.style.fontFamily = 'Arial, sans-serif';
        pdfContent.style.maxWidth = '800px';
        // Build complete PDF content
        pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #1a202c; margin-bottom: 10px;">Contract Analysis Report</h1>
        <p style="color: #718096; font-size: 14px;">Generated: ${new Date().toLocaleDateString()}</p>
      </div>

      <div style="margin-bottom: 40px; padding: 20px; background: #f7fafc; border-radius: 8px;">
        <h2 style="color: #2d3748; margin-bottom: 15px; border-bottom: 2px solid #4299e1; padding-bottom: 10px;">📄 Document Extraction</h2>
        <p><strong>Document:</strong> ${MOCK_EXTRACTION.document}</p>
        <p><strong>Status:</strong> <span style="color: #48bb78;">${MOCK_EXTRACTION.status}</span></p>
        
        <h3 style="color: #4a5568; margin-top: 20px;">Terms:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${MOCK_EXTRACTION.terms.map(term => `<li style="margin: 5px 0;">${term}</li>`).join('')}
        </ul>
        
        <h3 style="color: #4a5568; margin-top: 20px;">Products:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${MOCK_EXTRACTION.products.map(product => `<li style="margin: 5px 0;">${product}</li>`).join('')}
        </ul>
      </div>

      <div style="margin-bottom: 40px;">
        <h2 style="color: #2d3748; margin-bottom: 15px; border-bottom: 2px solid #4299e1; padding-bottom: 10px;">📊 Analysis Summary</h2>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f7fafc;">
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">Metric</th>
              <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">Total Products</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">${MOCK_ANALYSIS_RESULT.jsonData.summary.totalProducts}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">Total Units</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">${MOCK_ANALYSIS_RESULT.jsonData.summary.totalUnits}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">Distribution Model</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">${MOCK_ANALYSIS_RESULT.jsonData.summary.distributionModel}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 12px;">Compliance Status</td>
              <td style="border: 1px solid #e2e8f0; padding: 12px;"><strong style="color: #48bb78;">${MOCK_ANALYSIS_RESULT.jsonData.summary.complianceStatus}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 40px;">
        ${document.querySelector('.markdown-content')?.innerHTML || MOCK_ANALYSIS_RESULT.markdownReport}
      </div>

      <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #718096; font-size: 12px;">
        <p>Generated by DocProcess Platform • Powered by MuleSoft</p>
        <p>${new Date().toLocaleString()}</p>
      </div>
    `;
        // Configure PDF options
        const options = {
            margin: [10, 10, 10, 10],
            filename: `Analysis_Report_${MOCK_EXTRACTION.document.replace('.pdf', '')}_${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // Generate and download PDF
        try {
            await (0, html2pdf_js_1.default)().set(options).from(pdfContent).save();
        }
        catch (error) {
            console.error('PDF generation error:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-7xl mx-auto space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsxs)(Button_1.Button, { variant: "secondary", onClick: () => navigate('/history'), className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ArrowLeft, { className: "w-4 h-4" }), "Back"] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold text-gray-900", children: "Analysis Details" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-gray-600 mt-1", children: ["Document: ", (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: MOCK_EXTRACTION.document })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsxs)(Button_1.Button, { onClick: handleExportPDF, className: "flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { className: "w-5 h-5" }), "Download PDF Report"] }), (0, jsx_runtime_1.jsx)(Badge_1.Badge, { variant: MOCK_EXTRACTION.status === 'SUCCEEDED' ? 'success' : 'warning', children: MOCK_EXTRACTION.status })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "border-b border-gray-200", children: (0, jsx_runtime_1.jsxs)("nav", { className: "flex gap-4", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setActiveTab('extraction'), className: `px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'extraction'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-4 h-4" }), "Document Extraction"] }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setActiveTab('analysis'), className: `px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'analysis'
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [analysisStatus === 'ready' ? ((0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-4 h-4 text-green-600" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "w-4 h-4 text-yellow-600" })), "Final Analysis"] }) })] }) }), activeTab === 'extraction' && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)(Card_1.Card, { title: "Extracted Terms", children: (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: MOCK_EXTRACTION.terms.map((term, index) => ((0, jsx_runtime_1.jsx)("div", { className: "p-4 bg-blue-50 border border-blue-200 rounded-lg", children: (0, jsx_runtime_1.jsx)("p", { className: "text-gray-800", children: term }) }, index))) }) }), (0, jsx_runtime_1.jsx)(Card_1.Card, { title: "Extracted Products", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full divide-y divide-gray-200", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-gray-50", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "#" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Product Name" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "bg-white divide-y divide-gray-200", children: MOCK_EXTRACTION.products.map((product, index) => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-500", children: index + 1 }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-900", children: product })] }, index))) })] }) }) })] })), activeTab === 'analysis' && ((0, jsx_runtime_1.jsx)("div", { className: "space-y-6", children: analysisStatus === 'processing' ? ((0, jsx_runtime_1.jsx)(Card_1.Card, { children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center py-16", children: [(0, jsx_runtime_1.jsx)(Loading_1.Loading, { size: "lg" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-700 font-medium mt-6", children: "Analyzing document and generating report..." }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 text-sm mt-2", children: "This usually takes 30-60 seconds" })] }) })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Card_1.Card, { title: "Analysis Summary", actions: (0, jsx_runtime_1.jsx)(Button_1.Button, { variant: "secondary", size: "sm", onClick: () => setShowMarkdown(!showMarkdown), children: showMarkdown ? 'Show Summary' : 'Show Full Report' }), children: !showMarkdown ? ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-blue-600 text-sm font-medium", children: "Total Products" }), (0, jsx_runtime_1.jsx)("p", { className: "text-3xl font-bold text-blue-900 mt-1", children: MOCK_ANALYSIS_RESULT.jsonData.summary.totalProducts })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-green-600 text-sm font-medium", children: "Total Units" }), (0, jsx_runtime_1.jsx)("p", { className: "text-3xl font-bold text-green-900 mt-1", children: MOCK_ANALYSIS_RESULT.jsonData.summary.totalUnits })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-purple-600 text-sm font-medium", children: "Distribution Model" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-bold text-purple-900 mt-1", children: MOCK_ANALYSIS_RESULT.jsonData.summary.distributionModel })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-emerald-600 text-sm font-medium", children: "Compliance" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-lg font-bold text-emerald-900 mt-1 flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-5 h-5" }), MOCK_ANALYSIS_RESULT.jsonData.summary.complianceStatus] })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold text-gray-900 mb-3", children: "Key Terms" }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-gray-50 p-4 rounded-lg space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium text-gray-700", children: "Funding:" }), (0, jsx_runtime_1.jsx)("span", { className: "text-gray-900", children: MOCK_ANALYSIS_RESULT.jsonData.keyTerms.fundingStructure })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium text-gray-700", children: "Compliance:" }), (0, jsx_runtime_1.jsx)("span", { className: "text-gray-900", children: MOCK_ANALYSIS_RESULT.jsonData.keyTerms.pricingCompliance })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium text-gray-700", children: "Mechanics:" }), (0, jsx_runtime_1.jsx)("span", { className: "text-gray-900", children: MOCK_ANALYSIS_RESULT.jsonData.keyTerms.approvedMechanics.join(', ') })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium text-gray-700", children: "Limit:" }), (0, jsx_runtime_1.jsx)("span", { className: "text-gray-900", children: MOCK_ANALYSIS_RESULT.jsonData.keyTerms.customerLimit })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold text-gray-900 mb-3", children: "Product Breakdown" }), (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full divide-y divide-gray-200", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-gray-50", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Product" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Category" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Units Sold" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "bg-white divide-y divide-gray-200", children: MOCK_ANALYSIS_RESULT.jsonData.productBreakdown.map((item, index) => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-900", children: item.product }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm", children: (0, jsx_runtime_1.jsx)(Badge_1.Badge, { variant: item.category === 'Premium' ? 'success' :
                                                                                item.category === 'Specialty' ? 'warning' : 'default', children: item.category }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: item.unitsSold })] }, index))) })] }) })] })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "markdown-content prose max-w-none", children: (0, jsx_runtime_1.jsx)(react_markdown_1.default, { children: MOCK_ANALYSIS_RESULT.markdownReport }) })) }), (0, jsx_runtime_1.jsx)(Card_1.Card, { title: "\uD83D\uDCC4 Full Analysis Report", actions: (0, jsx_runtime_1.jsxs)(Button_1.Button, { onClick: handleExportPDF, className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Download, { className: "w-4 h-4" }), "Export to PDF"] }), children: (0, jsx_runtime_1.jsx)("div", { className: "markdown-content prose max-w-none", children: (0, jsx_runtime_1.jsx)(react_markdown_1.default, { children: MOCK_ANALYSIS_RESULT.markdownReport }) }) })] })) }))] }));
};
exports.AnalysisDetails = AnalysisDetails;
//# sourceMappingURL=AnalysisDetails.js.map