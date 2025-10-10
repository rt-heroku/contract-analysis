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
exports.Sidebar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const AppContext_1 = require("@/context/AppContext");
const AuthContext_1 = require("@/context/AuthContext");
const api_1 = __importDefault(require("@/lib/api"));
const types_1 = require("@/types");
const lucide_react_1 = require("lucide-react");
const helpers_1 = require("@/utils/helpers");
const iconMap = {
    home: lucide_react_1.Home,
    user: lucide_react_1.User,
    'file-text': lucide_react_1.FileText,
    history: lucide_react_1.History,
    'credit-card': lucide_react_1.CreditCard,
    shield: lucide_react_1.Shield,
    settings: lucide_react_1.Settings,
};
const Sidebar = () => {
    const { sidebarOpen } = (0, AppContext_1.useApp)();
    const { user } = (0, AuthContext_1.useAuth)();
    const location = (0, react_router_dom_1.useLocation)();
    const [menuItems, setMenuItems] = (0, react_1.useState)([]);
    const [expandedItems, setExpandedItems] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchMenu = async () => {
            try {
                const response = await api_1.default.get('/system/menu');
                setMenuItems(response.data.menu);
            }
            catch (error) {
                console.error('Failed to fetch menu:', error);
                // Fallback menu if API fails
                setMenuItems([
                    { id: 1, title: 'Dashboard', icon: 'home', route: '/dashboard', orderIndex: 1, isActive: true, children: [] },
                    { id: 2, title: 'Processing', icon: 'file-text', route: '/processing', orderIndex: 2, isActive: true, children: [] },
                    { id: 3, title: 'History', icon: 'history', route: '/history', orderIndex: 3, isActive: true, children: [] },
                    { id: 4, title: 'Profile', icon: 'user', route: '/profile', orderIndex: 4, isActive: true, children: [] },
                    { id: 5, title: 'Settings', icon: 'settings', route: '/settings', orderIndex: 5, isActive: true, children: [] },
                ]);
            }
        };
        if (user) {
            fetchMenu();
        }
        else {
            // Show default menu when not logged in
            setMenuItems([
                { id: 1, title: 'Dashboard', icon: 'home', route: '/dashboard', orderIndex: 1, isActive: true, children: [] },
                { id: 2, title: 'Processing', icon: 'file-text', route: '/processing', orderIndex: 2, isActive: true, children: [] },
            ]);
        }
    }, [user]);
    const toggleExpanded = (id) => {
        setExpandedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
    const renderMenuItem = (item, depth = 0) => {
        const Icon = iconMap[item.icon || 'file-text'] || lucide_react_1.FileText;
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.includes(item.id);
        const isActive = item.route ? location.pathname === item.route : false;
        return ((0, jsx_runtime_1.jsxs)("div", { children: [hasChildren ? ((0, jsx_runtime_1.jsxs)("button", { onClick: () => toggleExpanded(item.id), className: (0, helpers_1.cn)('w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors', depth > 0 && 'pl-12'), children: [(0, jsx_runtime_1.jsx)(Icon, { className: "w-5 h-5" }), (0, jsx_runtime_1.jsx)("span", { className: "flex-1 text-left font-medium", children: item.title }), isExpanded ? ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "w-4 h-4" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: "w-4 h-4" }))] })) : ((0, jsx_runtime_1.jsxs)(react_router_dom_1.Link, { to: item.route || '#', className: (0, helpers_1.cn)('flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors', isActive && 'bg-primary-50 text-primary-700 border-r-4 border-primary-600', depth > 0 && 'pl-12'), children: [(0, jsx_runtime_1.jsx)(Icon, { className: "w-5 h-5" }), (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: item.title })] })), hasChildren && isExpanded && ((0, jsx_runtime_1.jsx)("div", { children: item.children.map(child => renderMenuItem(child, depth + 1)) }))] }, item.id));
    };
    if (!sidebarOpen)
        return null;
    return ((0, jsx_runtime_1.jsxs)("aside", { className: "w-64 bg-white border-r border-gray-200 flex flex-col h-screen", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-16 flex items-center px-6 border-b border-gray-200", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-5 h-5 text-white" }) }), (0, jsx_runtime_1.jsx)("span", { className: "font-bold text-lg text-gray-900", children: "DocProcess" })] }) }), (0, jsx_runtime_1.jsx)("nav", { className: "flex-1 overflow-y-auto py-4", children: menuItems.map(item => renderMenuItem(item)) }), (0, jsx_runtime_1.jsx)("div", { className: "p-4 border-t border-gray-200", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-xs text-gray-500", children: "Powered by" }), (0, jsx_runtime_1.jsx)("img", { src: "/images/logos/MuleSoft-RGB-icon.png", alt: "MuleSoft", className: "h-6 w-6 object-contain", onError: (e) => {
                                // Hide image if it fails to load
                                e.target.style.display = 'none';
                            } }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-gray-500 font-medium", children: "MuleSoft" })] }) })] }));
};
exports.Sidebar = Sidebar;
//# sourceMappingURL=Sidebar.js.map