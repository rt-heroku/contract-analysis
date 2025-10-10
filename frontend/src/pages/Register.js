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
exports.Register = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const AuthContext_1 = require("@/context/AuthContext");
const Button_1 = require("@/components/common/Button");
const Input_1 = require("@/components/common/Input");
const validation_1 = require("@/utils/validation");
const lucide_react_1 = require("lucide-react");
const Register = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { register } = (0, AuthContext_1.useAuth)();
    const [formData, setFormData] = (0, react_1.useState)({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
    });
    const [errors, setErrors] = (0, react_1.useState)({});
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [errorMessage, setErrorMessage] = (0, react_1.useState)('');
    const passwordValidation = (0, validation_1.validatePassword)(formData.password);
    const passwordStrength = (0, validation_1.getPasswordStrength)(formData.password);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        // Validation
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = 'Email is required';
        }
        else if (!(0, validation_1.validateEmail)(formData.email)) {
            newErrors.email = 'Invalid email address';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        else if (!passwordValidation.isValid) {
            newErrors.password = passwordValidation.errors[0];
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0)
            return;
        setIsLoading(true);
        try {
            await register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
            });
            navigate('/dashboard');
        }
        catch (error) {
            setErrorMessage(error.message || 'Registration failed. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    const getStrengthColor = () => {
        switch (passwordStrength.strength) {
            case 'weak': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'strong': return 'bg-green-500';
            default: return 'bg-gray-300';
        }
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-md", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center mb-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl mb-4", children: (0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { className: "w-8 h-8 text-white" }) }), (0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold text-gray-900", children: "Create Account" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mt-2", children: "Get started with document processing" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-lg p-8", children: [errorMessage && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm", children: errorMessage })), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsx)(Input_1.Input, { label: "First Name", value: formData.firstName, onChange: (e) => setFormData({ ...formData, firstName: e.target.value }), placeholder: "John" }), (0, jsx_runtime_1.jsx)(Input_1.Input, { label: "Last Name", value: formData.lastName, onChange: (e) => setFormData({ ...formData, lastName: e.target.value }), placeholder: "Doe" })] }), (0, jsx_runtime_1.jsx)(Input_1.Input, { label: "Email Address", type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), error: errors.email, placeholder: "john@example.com", required: true }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(Input_1.Input, { label: "Password", type: "password", value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), error: errors.password, placeholder: "Create a strong password", required: true }), formData.password && ((0, jsx_runtime_1.jsxs)("div", { className: "mt-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-1", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-1 h-2 bg-gray-200 rounded-full overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: `h-full transition-all ${getStrengthColor()}`, style: { width: `${(passwordStrength.score / 6) * 100}%` } }) }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-medium text-gray-600 capitalize", children: passwordStrength.strength })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1 mt-2", children: [passwordValidation.errors.map((error, index) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-xs", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.XCircle, { className: "w-3 h-3 text-red-500" }), (0, jsx_runtime_1.jsx)("span", { className: "text-red-600", children: error })] }, index))), passwordValidation.isValid && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 text-xs", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-3 h-3 text-green-500" }), (0, jsx_runtime_1.jsx)("span", { className: "text-green-600", children: "Password meets all requirements" })] }))] })] }))] }), (0, jsx_runtime_1.jsx)(Input_1.Input, { label: "Confirm Password", type: "password", value: formData.confirmPassword, onChange: (e) => setFormData({ ...formData, confirmPassword: e.target.value }), error: errors.confirmPassword, placeholder: "Confirm your password", required: true }), (0, jsx_runtime_1.jsx)(Button_1.Button, { type: "submit", fullWidth: true, isLoading: isLoading, children: "Create Account" })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 text-center", children: (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-600", children: ["Already have an account?", ' ', (0, jsx_runtime_1.jsx)(react_router_dom_1.Link, { to: "/login", className: "text-primary-600 hover:text-primary-700 font-medium", children: "Sign in" })] }) })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-center text-sm text-gray-600 mt-8", children: "Powered by MuleSoft" })] }) }));
};
exports.Register = Register;
//# sourceMappingURL=Register.js.map