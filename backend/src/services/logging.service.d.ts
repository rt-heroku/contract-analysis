import { ActivityLogData, ApiLogData } from '../types';
declare class LoggingService {
    /**
     * Log user activity
     */
    logActivity(data: ActivityLogData): Promise<void>;
    /**
     * Log API call
     */
    logApiCall(data: ApiLogData): Promise<void>;
    /**
     * Get user activity logs
     */
    getUserActivityLogs(userId: number, page?: number, limit?: number): Promise<{
        logs: {
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            jobId: string | null;
            status: string;
            id: number;
            createdAt: Date;
            userId: number | null;
            ipAddress: string | null;
            userAgent: string | null;
            actionType: string;
            actionDescription: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Get all activity logs (admin)
     */
    getAllActivityLogs(filters: {
        userId?: number;
        actionType?: string;
        startDate?: Date;
        endDate?: Date;
    }, page?: number, limit?: number): Promise<{
        logs: ({
            user: {
                id: number;
                email: string;
                firstName: string | null;
                lastName: string | null;
            } | null;
        } & {
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            jobId: string | null;
            status: string;
            id: number;
            createdAt: Date;
            userId: number | null;
            ipAddress: string | null;
            userAgent: string | null;
            actionType: string;
            actionDescription: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Get API logs (admin)
     */
    getApiLogs(filters: {
        userId?: number;
        startDate?: Date;
        endDate?: Date;
        status?: number;
    }, page?: number, limit?: number): Promise<{
        logs: ({
            user: {
                id: number;
                email: string;
                firstName: string | null;
                lastName: string | null;
            } | null;
        } & {
            jobId: string | null;
            id: number;
            createdAt: Date;
            userId: number | null;
            requestMethod: string;
            requestUrl: string;
            requestHeaders: import("@prisma/client/runtime/library").JsonValue | null;
            requestBody: import("@prisma/client/runtime/library").JsonValue | null;
            responseStatus: number | null;
            responseBody: import("@prisma/client/runtime/library").JsonValue | null;
            responseTimeMs: number | null;
            errorMessage: string | null;
            relatedRecordType: string | null;
            relatedRecordId: number | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
declare const _default: LoggingService;
export default _default;
//# sourceMappingURL=logging.service.d.ts.map