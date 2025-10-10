"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileSize = exports.validateFileType = exports.getPasswordStrength = exports.validatePassword = exports.validateEmail = void 0;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
};
exports.validatePassword = validatePassword;
const getPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8)
        score++;
    if (password.length >= 12)
        score++;
    if (/[A-Z]/.test(password))
        score++;
    if (/[a-z]/.test(password))
        score++;
    if (/[0-9]/.test(password))
        score++;
    if (/[^A-Za-z0-9]/.test(password))
        score++;
    if (score <= 2) {
        return { strength: 'weak', score };
    }
    else if (score <= 4) {
        return { strength: 'medium', score };
    }
    else {
        return { strength: 'strong', score };
    }
};
exports.getPasswordStrength = getPasswordStrength;
const validateFileType = (file, type) => {
    if (type === 'contract') {
        if (file.type !== 'application/pdf') {
            return { isValid: false, error: 'Only PDF files are allowed for contracts' };
        }
    }
    else {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];
        if (!validTypes.includes(file.type)) {
            return { isValid: false, error: 'Only Excel (.xlsx) or CSV files are allowed' };
        }
    }
    return { isValid: true };
};
exports.validateFileType = validateFileType;
const validateFileSize = (file, type) => {
    const maxSize = type === 'contract' ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB for PDF, 50MB for Excel
    if (file.size > maxSize) {
        return {
            isValid: false,
            error: `File size exceeds ${type === 'contract' ? '10MB' : '50MB'} limit`,
        };
    }
    return { isValid: true };
};
exports.validateFileSize = validateFileSize;
//# sourceMappingURL=validation.js.map