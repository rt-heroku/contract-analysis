import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
declare class SystemController {
    getMenu(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    private buildMenuTree;
    getPublicSettings(_req: AuthenticatedRequest, res: Response): Promise<void>;
}
declare const _default: SystemController;
export default _default;
//# sourceMappingURL=system.controller.d.ts.map