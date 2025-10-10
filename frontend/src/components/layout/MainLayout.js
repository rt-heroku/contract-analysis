"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainLayout = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("@/context/AuthContext");
const Sidebar_1 = require("./Sidebar");
const TopBar_1 = require("./TopBar");
const Loading_1 = require("@/components/common/Loading");
const MainLayout = ({ children }) => {
    const { user, isLoading } = (0, AuthContext_1.useAuth)();
    if (isLoading) {
        return (0, jsx_runtime_1.jsx)(Loading_1.Loading, { fullScreen: true, text: "Loading..." });
    }
    if (!user) {
        return (0, jsx_runtime_1.jsx)(react_router_dom_1.Navigate, { to: "/login", replace: true });
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex h-screen bg-gray-50", children: [(0, jsx_runtime_1.jsx)(Sidebar_1.Sidebar, {}), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 flex flex-col overflow-hidden", children: [(0, jsx_runtime_1.jsx)(TopBar_1.TopBar, {}), (0, jsx_runtime_1.jsx)("main", { className: "flex-1 overflow-y-auto", children: (0, jsx_runtime_1.jsx)("div", { className: "container mx-auto px-6 py-8", children: children }) })] })] }));
};
exports.MainLayout = MainLayout;
//# sourceMappingURL=MainLayout.js.map