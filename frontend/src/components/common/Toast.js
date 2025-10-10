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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToastContainer = exports.Toast = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const helpers_1 = require("@/utils/helpers");
const Toast = ({ message, type = 'info', onClose, duration = 5000, }) => {
    (0, react_1.useEffect)(() => {
        if (duration) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);
    const icons = {
        success: (0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-5 h-5 text-green-500" }),
        error: (0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-5 h-5 text-red-500" }),
        warning: (0, jsx_runtime_1.jsx)(lucide_react_1.AlertTriangle, { className: "w-5 h-5 text-yellow-500" }),
        info: (0, jsx_runtime_1.jsx)(lucide_react_1.Info, { className: "w-5 h-5 text-blue-500" }),
    };
    const colors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200',
        info: 'bg-blue-50 border-blue-200',
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, helpers_1.cn)('flex items-center gap-3 p-4 rounded-lg border shadow-lg slide-in', colors[type]), children: [icons[type], (0, jsx_runtime_1.jsx)("p", { className: "flex-1 text-sm font-medium text-gray-900", children: message }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "w-4 h-4" }) })] }));
};
exports.Toast = Toast;
// Toast container for managing multiple toasts
const ToastContainer = ({ toasts }) => {
    return ((0, jsx_runtime_1.jsx)("div", { className: "fixed top-4 right-4 z-50 space-y-2 max-w-md", children: toasts.map((toast) => ((0, jsx_runtime_1.jsx)(exports.Toast, { ...toast }, toast.id))) }));
};
exports.ToastContainer = ToastContainer;
//# sourceMappingURL=Toast.js.map