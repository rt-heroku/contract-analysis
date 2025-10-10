"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const helpers_1 = require("@/utils/helpers");
exports.Input = (0, react_1.forwardRef)(({ label, error, helperText, className, ...props }, ref) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full", children: [label && ((0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: [label, props.required && (0, jsx_runtime_1.jsx)("span", { className: "text-red-500 ml-1", children: "*" })] })), (0, jsx_runtime_1.jsx)("input", { ref: ref, className: (0, helpers_1.cn)('w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors', error ? 'border-red-500' : 'border-gray-300', props.disabled && 'bg-gray-100 cursor-not-allowed', className), ...props }), error && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-red-600", children: error })), helperText && !error && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-sm text-gray-500", children: helperText }))] }));
});
exports.Input.displayName = 'Input';
//# sourceMappingURL=Input.js.map