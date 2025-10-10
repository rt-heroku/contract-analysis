"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = exports.cn = exports.getNotificationColor = exports.getStatusColor = exports.getInitials = exports.truncateString = exports.formatFileSize = exports.formatRelativeTime = exports.formatDateTime = exports.formatDate = void 0;
const date_fns_1 = require("date-fns");
const formatDate = (date) => {
    return (0, date_fns_1.format)(new Date(date), 'MMM dd, yyyy');
};
exports.formatDate = formatDate;
const formatDateTime = (date) => {
    return (0, date_fns_1.format)(new Date(date), 'MMM dd, yyyy HH:mm');
};
exports.formatDateTime = formatDateTime;
const formatRelativeTime = (date) => {
    return (0, date_fns_1.formatDistanceToNow)(new Date(date), { addSuffix: true });
};
exports.formatRelativeTime = formatRelativeTime;
const formatFileSize = (bytes) => {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
exports.formatFileSize = formatFileSize;
const truncateString = (str, maxLength) => {
    if (str.length <= maxLength)
        return str;
    return str.substring(0, maxLength) + '...';
};
exports.truncateString = truncateString;
const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0).toUpperCase() || '';
    const last = lastName?.charAt(0).toUpperCase() || '';
    return `${first}${last}` || '?';
};
exports.getInitials = getInitials;
const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
        case 'completed':
        case 'succeeded':
        case 'success':
            return 'text-green-600 bg-green-100';
        case 'processing':
        case 'in_progress':
            return 'text-blue-600 bg-blue-100';
        case 'failed':
        case 'error':
            return 'text-red-600 bg-red-100';
        default:
            return 'text-gray-600 bg-gray-100';
    }
};
exports.getStatusColor = getStatusColor;
const getNotificationColor = (type) => {
    switch (type) {
        case 'success':
            return 'bg-green-50 border-green-200';
        case 'error':
            return 'bg-red-50 border-red-200';
        case 'warning':
            return 'bg-yellow-50 border-yellow-200';
        case 'info':
        default:
            return 'bg-blue-50 border-blue-200';
    }
};
exports.getNotificationColor = getNotificationColor;
const cn = (...classes) => {
    return classes.filter(Boolean).join(' ');
};
exports.cn = cn;
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
exports.debounce = debounce;
//# sourceMappingURL=helpers.js.map