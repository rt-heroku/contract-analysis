import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
declare class UploadController {
    uploadFile(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getUserUploads(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteUpload(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: UploadController;
export default _default;
//# sourceMappingURL=upload.controller.d.ts.map