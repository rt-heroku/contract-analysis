import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const logActivity: (actionType: string, getDescription: (req: AuthenticatedRequest) => string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=activityLogger.d.ts.map