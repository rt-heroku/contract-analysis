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
exports.Dashboard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("@/context/AuthContext");
const api_1 = __importDefault(require("@/lib/api"));
const Card_1 = require("@/components/common/Card");
const Button_1 = require("@/components/common/Button");
const Badge_1 = require("@/components/common/Badge");
const Loading_1 = require("@/components/common/Loading");
const lucide_react_1 = require("lucide-react");
const helpers_1 = require("@/utils/helpers");
const Dashboard = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { user } = (0, AuthContext_1.useAuth)();
    const [stats, setStats] = (0, react_1.useState)(null);
    const [recentAnalyses, setRecentAnalyses] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            try {
                const [statsRes, analysesRes] = await Promise.all([
                    api_1.default.get('/analysis/statistics'),
                    api_1.default.get('/analysis?limit=5'),
                ]);
                setStats(statsRes.data.statistics);
                setRecentAnalyses(analysesRes.data.analyses || []);
            }
            catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    if (loading) {
        return (0, jsx_runtime_1.jsx)(Loading_1.Loading, { fullScreen: true, text: "Loading dashboard..." });
    }
    const statCards = [
        {
            title: 'Total Analyses',
            value: stats?.total || 0,
            icon: lucide_react_1.FileText,
            color: 'text-blue-600 bg-blue-100',
        },
        {
            title: 'Completed',
            value: stats?.completed || 0,
            icon: lucide_react_1.CheckCircle,
            color: 'text-green-600 bg-green-100',
        },
        {
            title: 'Processing',
            value: stats?.processing || 0,
            icon: lucide_react_1.Clock,
            color: 'text-yellow-600 bg-yellow-100',
        },
        {
            title: 'Failed',
            value: stats?.failed || 0,
            icon: lucide_react_1.XCircle,
            color: 'text-red-600 bg-red-100',
        },
    ];
    const getStatusVariant = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'processing': return 'warning';
            case 'failed': return 'error';
            default: return 'default';
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h1", { className: "text-3xl font-bold text-gray-900", children: ["Welcome back, ", user?.firstName || 'User', "!"] }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mt-1", children: "Here's what's happening with your document processing" })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return ((0, jsx_runtime_1.jsx)(Card_1.Card, { className: "p-0", children: (0, jsx_runtime_1.jsx)("div", { className: "p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-600 font-medium", children: stat.title }), (0, jsx_runtime_1.jsx)("p", { className: "text-3xl font-bold text-gray-900 mt-2", children: stat.value })] }), (0, jsx_runtime_1.jsx)("div", { className: `w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`, children: (0, jsx_runtime_1.jsx)(Icon, { className: "w-6 h-6" }) })] }) }) }, index));
                }) }), (0, jsx_runtime_1.jsx)(Card_1.Card, { title: "Quick Actions", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-4", children: [(0, jsx_runtime_1.jsxs)(Button_1.Button, { onClick: () => navigate('/processing'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Upload, { className: "w-4 h-4 mr-2" }), "Upload Documents"] }), (0, jsx_runtime_1.jsxs)(Button_1.Button, { variant: "secondary", onClick: () => navigate('/history'), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-4 h-4 mr-2" }), "View History"] })] }) }), (0, jsx_runtime_1.jsx)(Card_1.Card, { title: "Recent Analyses", subtitle: "Your latest document processing results", children: recentAnalyses.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "text-center py-12", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600", children: "No analyses yet" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 text-sm mt-1", children: "Start by uploading documents" }), (0, jsx_runtime_1.jsx)(Button_1.Button, { onClick: () => navigate('/processing'), className: "mt-4", children: "Upload Documents" })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: recentAnalyses.map((analysis) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer", onClick: () => navigate(`/analysis/${analysis.id}`), children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4 flex-1", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-5 h-5 text-primary-600" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-medium text-gray-900", children: analysis.contractUpload?.filename || 'Document Analysis' }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: (0, helpers_1.formatRelativeTime)(analysis.createdAt) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)(Badge_1.Badge, { variant: getStatusVariant(analysis.status), children: analysis.status }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-gray-500", children: (0, helpers_1.formatDateTime)(analysis.createdAt) })] })] }, analysis.id))) })) })] }));
};
exports.Dashboard = Dashboard;
//# sourceMappingURL=Dashboard.js.map