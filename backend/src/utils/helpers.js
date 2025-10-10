"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.formatFileSize = exports.isValidFileType = exports.getFileExtension = exports.sanitizeHeaders = exports.getUserAgent = exports.getClientIp = void 0;
const express_1 = require("express");
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
    }
    return req.socket.remoteAddress || 'unknown';
};
exports.getClientIp = getClientIp;
const getUserAgent = (req) => {
    return req.headers['user-agent'] || 'unknown';
};
exports.getUserAgent = getUserAgent;
const sanitizeHeaders = (headers) => {
    const sanitized = { ...headers };
    // Remove sensitive headers
    delete sanitized['authorization'];
    delete sanitized['cookie'];
    delete sanitized['x-api-key'];
    return sanitized;
};
exports.sanitizeHeaders = sanitizeHeaders;
const getFileExtension = (filename) => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};
exports.getFileExtension = getFileExtension;
const isValidFileType = (mimetype, uploadType) => {
    if (uploadType === 'contract') {
        return mimetype === 'application/pdf';
    }
    else {
        return (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimetype === 'application/vnd.ms-excel' ||
            mimetype === 'text/csv');
    }
};
exports.isValidFileType = isValidFileType;
const formatFileSize = (bytes) => {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
exports.formatFileSize = formatFileSize;
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.sleep = sleep;
//# sourceMappingURL=helpers.js.map