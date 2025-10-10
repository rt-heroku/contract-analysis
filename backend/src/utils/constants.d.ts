export declare const ROLES: {
    readonly ADMIN: "admin";
    readonly USER: "user";
};
export declare const ACTION_TYPES: {
    readonly AUTH: {
        readonly LOGIN: "auth.login";
        readonly LOGOUT: "auth.logout";
        readonly REGISTER: "auth.register";
        readonly REFRESH: "auth.refresh";
        readonly SESSION_EXPIRED: "auth.session_expired";
        readonly LOGIN_FAILED: "auth.login_failed";
    };
    readonly USER: {
        readonly VIEW_PROFILE: "user.view_profile";
        readonly UPDATE_PROFILE: "user.update_profile";
        readonly UPDATE_AVATAR: "user.update_avatar";
        readonly CHANGE_PASSWORD: "user.change_password";
    };
    readonly UPLOAD: {
        readonly FILE_UPLOAD: "upload.file_upload";
        readonly FILE_UPLOAD_FAILED: "upload.file_upload_failed";
    };
    readonly PROCESSING: {
        readonly START: "processing.start";
        readonly CONTRACT_PROCESSING: "processing.contract";
        readonly DATA_ANALYSIS: "processing.data_analysis";
        readonly COMPLETED: "processing.completed";
        readonly FAILED: "processing.failed";
    };
    readonly ANALYSIS: {
        readonly VIEW: "analysis.view";
        readonly VIEW_LIST: "analysis.view_list";
        readonly DELETE: "analysis.delete";
        readonly EXPORT_PDF: "analysis.export_pdf";
        readonly EXPORT_EXCEL: "analysis.export_excel";
    };
    readonly ADMIN: {
        readonly VIEW_USERS: "admin.view_users";
        readonly VIEW_USER: "admin.view_user";
        readonly UPDATE_USER: "admin.update_user";
        readonly DELETE_USER: "admin.delete_user";
        readonly VIEW_LOGS: "admin.view_logs";
        readonly VIEW_API_LOGS: "admin.view_api_logs";
    };
    readonly NOTIFICATION: {
        readonly VIEW: "notification.view";
        readonly MARK_READ: "notification.mark_read";
    };
    readonly NAVIGATION: {
        readonly PAGE_VIEW: "navigation.page_view";
    };
};
export declare const ANALYSIS_STATUS: {
    readonly PROCESSING: "processing";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
};
export declare const NOTIFICATION_TYPES: {
    readonly SUCCESS: "success";
    readonly ERROR: "error";
    readonly INFO: "info";
    readonly WARNING: "warning";
};
export declare const UPLOAD_TYPES: {
    readonly CONTRACT: "contract";
    readonly DATA: "data";
};
export declare const FILE_SIZE_LIMITS: {
    readonly PDF: number;
    readonly EXCEL: number;
};
export declare const JWT_EXPIRATION: string;
export declare const JWT_REFRESH_EXPIRATION: string;
export declare const MULESOFT_API_TIMEOUT: number;
//# sourceMappingURL=constants.d.ts.map