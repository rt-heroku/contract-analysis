import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
declare class AuthController {
    register(req: AuthenticatedRequest, res: Response): Promise<void>;
    login(req: AuthenticatedRequest, res: Response): Promise<void>;
    logout(req: AuthenticatedRequest, res: Response): Promise<void>;
    refreshToken(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=auth.controller.d.ts.map