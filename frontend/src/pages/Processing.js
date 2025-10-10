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
exports.Processing = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const react_dropzone_1 = require("react-dropzone");
const api_1 = __importDefault(require("@/lib/api"));
const Card_1 = require("@/components/common/Card");
const Button_1 = require("@/components/common/Button");
const Modal_1 = require("@/components/common/Modal");
const Loading_1 = require("@/components/common/Loading");
const lucide_react_1 = require("lucide-react");
const validation_1 = require("@/utils/validation");
const helpers_1 = require("@/utils/helpers");
const Processing = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const [contractFile, setContractFile] = (0, react_1.useState)(null);
    const [dataFile, setDataFile] = (0, react_1.useState)(null);
    // const [uploading, setUploading] = useState(false); // Unused for now
    const [processing, setProcessing] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [processingStatus, setProcessingStatus] = (0, react_1.useState)('');
    const onContractDrop = (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const typeValidation = (0, validation_1.validateFileType)(file, 'contract');
            const sizeValidation = (0, validation_1.validateFileSize)(file, 'contract');
            if (!typeValidation.isValid) {
                setError(typeValidation.error);
                return;
            }
            if (!sizeValidation.isValid) {
                setError(sizeValidation.error);
                return;
            }
            setContractFile(file);
            setError('');
        }
    };
    const onDataDrop = (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const typeValidation = (0, validation_1.validateFileType)(file, 'data');
            const sizeValidation = (0, validation_1.validateFileSize)(file, 'data');
            if (!typeValidation.isValid) {
                setError(typeValidation.error);
                return;
            }
            if (!sizeValidation.isValid) {
                setError(sizeValidation.error);
                return;
            }
            setDataFile(file);
            setError('');
        }
    };
    const contractDropzone = (0, react_dropzone_1.useDropzone)({
        onDrop: onContractDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        multiple: false,
    });
    const dataDropzone = (0, react_dropzone_1.useDropzone)({
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
            const contractUploadRes = await api_1.default.post('/uploads', contractFormData, {
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
            const dataUploadRes = await api_1.default.post('/uploads', dataFormData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Start processing
            setProcessingStatus('Starting document processing...');
            const processRes = await api_1.default.post('/analysis/start', {
                contractUploadId: contractUploadRes.data.upload.id,
                dataUploadId: dataUploadRes.data.upload.id,
            });
            // Navigate to analysis page
            setTimeout(() => {
                navigate(`/analysis/${processRes.data.analysisRecordId}`);
            }, 1000);
        }
        catch (err) {
            setError(err.response?.data?.error || 'Processing failed. Please try again.');
            setProcessing(false);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-4xl mx-auto space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold text-gray-900", children: "Document Processing" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mt-1", children: "Upload your contract PDF and data file to start processing" })] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg text-red-700", children: error })), (0, jsx_runtime_1.jsx)(Card_1.Card, { title: "Step 1: Upload Contract PDF", children: (0, jsx_runtime_1.jsxs)("div", { ...contractDropzone.getRootProps(), className: `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${contractDropzone.isDragActive
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-400'}`, children: [(0, jsx_runtime_1.jsx)("input", { ...contractDropzone.getInputProps() }), contractFile ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-6 h-6 text-green-600" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "text-left", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-medium text-gray-900", children: contractFile.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: (0, helpers_1.formatFileSize)(contractFile.size) })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        setContractFile(null);
                                    }, className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-5 h-5 text-gray-500" }) })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-700 font-medium", children: "Drop your contract PDF here, or click to browse" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500 mt-2", children: "Supports PDF files up to 10MB" })] }))] }) }), (0, jsx_runtime_1.jsx)(Card_1.Card, { title: "Step 2: Upload Data File (Excel/CSV)", children: (0, jsx_runtime_1.jsxs)("div", { ...dataDropzone.getRootProps(), className: `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dataDropzone.isDragActive
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-400'}`, children: [(0, jsx_runtime_1.jsx)("input", { ...dataDropzone.getInputProps() }), dataFile ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-6 h-6 text-green-600" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "text-left", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-medium text-gray-900", children: dataFile.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: (0, helpers_1.formatFileSize)(dataFile.size) })] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: (e) => {
                                        e.stopPropagation();
                                        setDataFile(null);
                                    }, className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-5 h-5 text-gray-500" }) })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Upload, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-700 font-medium", children: "Drop your data file here, or click to browse" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500 mt-2", children: "Supports Excel (.xlsx) and CSV files up to 50MB" })] }))] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-4", children: [(0, jsx_runtime_1.jsx)(Button_1.Button, { onClick: handleProcess, disabled: !contractFile || !dataFile || processing, isLoading: processing, size: "lg", children: "Process Documents" }), (0, jsx_runtime_1.jsx)(Button_1.Button, { variant: "secondary", onClick: () => {
                            setContractFile(null);
                            setDataFile(null);
                            setError('');
                        }, disabled: processing, size: "lg", children: "Clear All" })] }), (0, jsx_runtime_1.jsx)(Modal_1.Modal, { isOpen: processing, onClose: () => { }, title: "Processing Documents", showCloseButton: false, children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center py-8", children: [(0, jsx_runtime_1.jsx)(Loading_1.Loading, { size: "lg" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-700 font-medium mt-6", children: processingStatus }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 text-sm mt-2", children: "This may take a few moments..." })] }) })] }));
};
exports.Processing = Processing;
//# sourceMappingURL=Processing.js.map