import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const requireRole: (allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=roleCheck.d.ts.map