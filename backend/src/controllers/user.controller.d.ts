import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
declare class UserController {
    getProfile(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateProfile(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    updateAvatar(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    changePassword(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getActivityLogs(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=user.controller.d.ts.map