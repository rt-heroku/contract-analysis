import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
declare class AdminController {
    getUsers(req: AuthenticatedRequest, res: Response): Promise<void>;
    getUser(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateUser(req: AuthenticatedRequest, res: Response): Promise<void>;
    deleteUser(req: AuthenticatedRequest, res: Response): Promise<void>;
    resetUserPassword(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getActivityLogs(req: AuthenticatedRequest, res: Response): Promise<void>;
    getApiLogs(req: AuthenticatedRequest, res: Response): Promise<void>;
    getSystemSettings(_req: AuthenticatedRequest, res: Response): Promise<void>;
}
declare const _default: AdminController;
export default _default;
//# sourceMappingURL=admin.controller.d.ts.map