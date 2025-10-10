import { MuleSoftContractResponse, MuleSoftDataResponse } from '../types';
declare class MuleSoftService {
    private makeRequest;
    /**
     * Process contract document
     */
    processContractDocument(jobId: string, userId?: number, uploadId?: number): Promise<MuleSoftContractResponse>;
    /**
     * Analyze data file
     */
    analyzeDataFile(jobId: string, userId?: number, analysisId?: number): Promise<MuleSoftDataResponse>;
    /**
     * Test API connection
     */
    testConnection(): Promise<boolean>;
}
declare const _default: MuleSoftService;
export default _default;
//# sourceMappingURL=muleSoft.service.d.ts.map