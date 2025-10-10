"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authApi = void 0;
const api_1 = __importDefault(require("./api"));
const types_1 = require("@/types");
exports.authApi = {
    async login(credentials) {
        const response = await api_1.default.post('/auth/login', credentials);
        return response.data;
    },
    async register(data) {
        const response = await api_1.default.post('/auth/register', data);
        return response.data;
    },
    async logout() {
        await api_1.default.post('/auth/logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    async refreshToken() {
        const response = await api_1.default.post('/auth/refresh');
        return response.data;
    },
    async getCurrentUser() {
        const response = await api_1.default.get('/auth/me');
        return response.data;
    },
    getStoredUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
    getStoredToken() {
        return localStorage.getItem('token');
    },
    storeAuth(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },
    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};
//# sourceMappingURL=auth.js.map