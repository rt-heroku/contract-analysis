import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
declare class NotificationController {
    getNotifications(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    markAsRead(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: NotificationController;
export default _default;
//# sourceMappingURL=notification.controller.d.ts.map