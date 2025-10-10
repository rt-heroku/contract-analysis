import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
declare class AnalysisController {
    startProcessing(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAnalysis(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getAnalysisHistory(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    deleteAnalysis(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getStatistics(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: AnalysisController;
export default _default;
//# sourceMappingURL=analysis.controller.d.ts.map