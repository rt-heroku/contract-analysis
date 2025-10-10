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
exports.TopBar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const AppContext_1 = require("@/context/AppContext");
const AuthContext_1 = require("@/context/AuthContext");
const api_1 = __importDefault(require("@/lib/api"));
const lucide_react_1 = require("lucide-react");
const helpers_1 = require("@/utils/helpers");
const TopBar = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { toggleSidebar } = (0, AppContext_1.useApp)();
    const { user, logout } = (0, AuthContext_1.useAuth)();
    const [showUserMenu, setShowUserMenu] = (0, react_1.useState)(false);
    const [unreadCount, setUnreadCount] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await api_1.default.get('/notifications/unread-count');
                setUnreadCount(response.data.unreadCount);
            }
            catch (error) {
                // Ignore errors
            }
        };
        if (user) {
            fetchUnreadCount();
            const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [user]);
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    return ((0, jsx_runtime_1.jsxs)("header", { className: "h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4", children: [(0, jsx_runtime_1.jsx)("button", { onClick: toggleSidebar, className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Menu, { className: "w-5 h-5 text-gray-700" }) }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 max-w-2xl", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search analyses, documents...", className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => navigate('/notifications'), className: "relative p-2 hover:bg-gray-100 rounded-lg transition-colors", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bell, { className: "w-5 h-5 text-gray-700" }), unreadCount > 0 && ((0, jsx_runtime_1.jsx)("span", { className: "absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center", children: unreadCount > 9 ? '9+' : unreadCount }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setShowUserMenu(!showUserMenu), className: "flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-medium text-sm", children: (0, helpers_1.getInitials)(user?.firstName, user?.lastName) }), (0, jsx_runtime_1.jsxs)("div", { className: "text-left hidden md:block", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-900", children: user?.firstName || user?.email?.split('@')[0] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: user?.email })] })] }), showUserMenu && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-10", onClick: () => setShowUserMenu(false) }), (0, jsx_runtime_1.jsxs)("div", { className: "absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                                    navigate('/profile');
                                                    setShowUserMenu(false);
                                                }, className: "w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.User, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: "Profile" })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                                    navigate('/settings');
                                                    setShowUserMenu(false);
                                                }, className: "w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: "Settings" })] }), (0, jsx_runtime_1.jsx)("hr", { className: "my-2" }), (0, jsx_runtime_1.jsxs)("button", { onClick: handleLogout, className: "w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.LogOut, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { children: "Sign Out" })] })] })] }))] })] })] }));
};
exports.TopBar = TopBar;
//# sourceMappingURL=TopBar.js.map