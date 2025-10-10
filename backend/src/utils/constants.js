"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MULESOFT_API_TIMEOUT = exports.JWT_REFRESH_EXPIRATION = exports.JWT_EXPIRATION = exports.FILE_SIZE_LIMITS = exports.UPLOAD_TYPES = exports.NOTIFICATION_TYPES = exports.ANALYSIS_STATUS = exports.ACTION_TYPES = exports.ROLES = void 0;
exports.ROLES = {
    ADMIN: 'admin',
    USER: 'user',
};
exports.ACTION_TYPES = {
    AUTH: {
        LOGIN: 'auth.login',
        LOGOUT: 'auth.logout',
        REGISTER: 'auth.register',
        REFRESH: 'auth.refresh',
        SESSION_EXPIRED: 'auth.session_expired',
        LOGIN_FAILED: 'auth.login_failed',
    },
    USER: {
        VIEW_PROFILE: 'user.view_profile',
        UPDATE_PROFILE: 'user.update_profile',
        UPDATE_AVATAR: 'user.update_avatar',
        CHANGE_PASSWORD: 'user.change_password',
    },
    UPLOAD: {
        FILE_UPLOAD: 'upload.file_upload',
        FILE_UPLOAD_FAILED: 'upload.file_upload_failed',
    },
    PROCESSING: {
        START: 'processing.start',
        CONTRACT_PROCESSING: 'processing.contract',
        DATA_ANALYSIS: 'processing.data_analysis',
        COMPLETED: 'processing.completed',
        FAILED: 'processing.failed',
    },
    ANALYSIS: {
        VIEW: 'analysis.view',
        VIEW_LIST: 'analysis.view_list',
        DELETE: 'analysis.delete',
        EXPORT_PDF: 'analysis.export_pdf',
        EXPORT_EXCEL: 'analysis.export_excel',
    },
    ADMIN: {
        VIEW_USERS: 'admin.view_users',
        VIEW_USER: 'admin.view_user',
        UPDATE_USER: 'admin.update_user',
        DELETE_USER: 'admin.delete_user',
        VIEW_LOGS: 'admin.view_logs',
        VIEW_API_LOGS: 'admin.view_api_logs',
    },
    NOTIFICATION: {
        VIEW: 'notification.view',
        MARK_READ: 'notification.mark_read',
    },
    NAVIGATION: {
        PAGE_VIEW: 'navigation.page_view',
    },
};
exports.ANALYSIS_STATUS = {
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
};
exports.NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning',
};
exports.UPLOAD_TYPES = {
    CONTRACT: 'contract',
    DATA: 'data',
};
exports.FILE_SIZE_LIMITS = {
    PDF: parseInt(process.env.MAX_FILE_SIZE_PDF || '10485760'), // 10MB
    EXCEL: parseInt(process.env.MAX_FILE_SIZE_EXCEL || '52428800'), // 50MB
};
exports.JWT_EXPIRATION = process.env.JWT_EXPIRATION || '4h';
exports.JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
exports.MULESOFT_API_TIMEOUT = parseInt(process.env.MULESOFT_API_TIMEOUT || '30000');
//# sourceMappingURL=constants.js.map