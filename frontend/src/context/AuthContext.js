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
exports.AuthProvider = exports.useAuth = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const types_1 = require("@/types");
const auth_1 = require("@/lib/auth");
const api_1 = require("@/lib/api");
const AuthContext = (0, react_1.createContext)(undefined);
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
exports.useAuth = useAuth;
const AuthProvider = ({ children }) => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        // Check for stored auth on mount
        const storedUser = auth_1.authApi.getStoredUser();
        const storedToken = auth_1.authApi.getStoredToken();
        if (storedUser && storedToken) {
            setUser(storedUser);
        }
        setIsLoading(false);
    }, []);
    const login = async (credentials) => {
        try {
            const response = await auth_1.authApi.login(credentials);
            auth_1.authApi.storeAuth(response.token, response.user);
            setUser(response.user);
        }
        catch (error) {
            throw new Error((0, api_1.handleApiError)(error));
        }
    };
    const register = async (data) => {
        try {
            await auth_1.authApi.register(data);
            // After registration, automatically log in
            await login({
                email: data.email,
                password: data.password,
            });
        }
        catch (error) {
            throw new Error((0, api_1.handleApiError)(error));
        }
    };
    const logout = async () => {
        try {
            await auth_1.authApi.logout();
        }
        catch (error) {
            // Ignore error, clear auth anyway
        }
        finally {
            auth_1.authApi.clearAuth();
            setUser(null);
        }
    };
    const refreshAuth = async () => {
        try {
            const response = await auth_1.authApi.getCurrentUser();
            setUser(response.user);
            auth_1.authApi.storeAuth(auth_1.authApi.getStoredToken() || '', response.user);
        }
        catch (error) {
            auth_1.authApi.clearAuth();
            setUser(null);
        }
    };
    return ((0, jsx_runtime_1.jsx)(AuthContext.Provider, { value: {
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            register,
            logout,
            refreshAuth,
        }, children: children }));
};
exports.AuthProvider = AuthProvider;
//# sourceMappingURL=AuthContext.js.map