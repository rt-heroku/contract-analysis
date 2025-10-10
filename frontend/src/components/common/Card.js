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
exports.Card = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const helpers_1 = require("@/utils/helpers");
const Card = ({ children, className, title, subtitle, action, actions, }) => {
    const actionElement = actions || action; // Support both props
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, helpers_1.cn)('bg-white rounded-lg shadow-sm border border-gray-200', className), children: [(title || actionElement) && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [(0, jsx_runtime_1.jsxs)("div", { children: [title && (0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold text-gray-900", children: title }), subtitle && (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500 mt-1", children: subtitle })] }), actionElement && (0, jsx_runtime_1.jsx)("div", { children: actionElement })] })), (0, jsx_runtime_1.jsx)("div", { className: "p-6", children: children })] }));
};
exports.Card = Card;
//# sourceMappingURL=Card.js.map