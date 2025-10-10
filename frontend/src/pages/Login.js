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
exports.Login = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("@/context/AuthContext");
const Button_1 = require("@/components/common/Button");
const Input_1 = require("@/components/common/Input");
const validation_1 = require("@/utils/validation");
const lucide_react_1 = require("lucide-react");
const Login = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { login } = (0, AuthContext_1.useAuth)();
    const [formData, setFormData] = (0, react_1.useState)({
        email: '',
        password: '',
        stayLoggedIn: false,
    });
    const [errors, setErrors] = (0, react_1.useState)({ email: '', password: '' });
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [errorMessage, setErrorMessage] = (0, react_1.useState)('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        // Validation
        const newErrors = { email: '', password: '' };
        if (!formData.email) {
            newErrors.email = 'Email is required';
        }
        else if (!(0, validation_1.validateEmail)(formData.email)) {
            newErrors.email = 'Invalid email address';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        if (newErrors.email || newErrors.password)
            return;
        setIsLoading(true);
        try {
            await login(formData);
            navigate('/dashboard');
        }
        catch (error) {
            setErrorMessage(error.message || 'Login failed. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-md", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center mb-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl mb-4", children: (0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-8 h-8 text-white" }) }), (0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold text-gray-900", children: "Document Processing" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mt-2", children: "Sign in to your account" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-lg p-8", children: [errorMessage && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm", children: errorMessage })), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsx)(Input_1.Input, { label: "Email Address", type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), error: errors.email, placeholder: "admin@demo.com", required: true }), (0, jsx_runtime_1.jsx)(Input_1.Input, { label: "Password", type: "password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), error: errors.password, placeholder: "Enter your password", required: true }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("input", { id: "stayLoggedIn", type: "checkbox", checked: formData.stayLoggedIn, onChange: (e) => setFormData({ ...formData, stayLoggedIn: e.target.checked }), className: "w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" }), (0, jsx_runtime_1.jsx)("label", { htmlFor: "stayLoggedIn", className: "ml-2 text-sm text-gray-700", children: "Stay logged in" })] }), (0, jsx_runtime_1.jsx)(Button_1.Button, { type: "submit", fullWidth: true, isLoading: isLoading, children: "Sign In" })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 text-center", children: (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-600", children: ["Don't have an account?", ' ', (0, jsx_runtime_1.jsx)(react_router_dom_1.Link, { to: "/register", className: "text-primary-600 hover:text-primary-700 font-medium", children: "Create one" })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold text-blue-900 mb-2", children: "Demo Credentials:" }), (0, jsx_runtime_1.jsxs)("div", { className: "text-xs text-blue-700 space-y-1", children: [(0, jsx_runtime_1.jsx)("p", { children: "Admin: admin@demo.com / Admin@123" }), (0, jsx_runtime_1.jsx)("p", { children: "User: user@demo.com / User@123" })] })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-center text-sm text-gray-600 mt-8", children: "Powered by MuleSoft" })] }) }));
};
exports.Login = Login;
//# sourceMappingURL=Login.js.map