"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Loading = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const Loading = ({ fullScreen = false, size = 'md', text, }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };
    const spinner = ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `${sizes[size]} border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin` }), text && (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 text-sm", children: text })] }));
    if (fullScreen) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50", children: spinner }));
    }
    return spinner;
};
exports.Loading = Loading;
//# sourceMappingURL=Loading.js.map