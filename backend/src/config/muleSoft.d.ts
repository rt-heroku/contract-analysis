export interface MuleSoftConfig {
    baseUrl: string;
    username: string;
    password: string;
    timeout: number;
    endpoints: {
        processDocument: string;
        analyzeData: string;
    };
}
declare const muleSoftConfig: MuleSoftConfig;
export default muleSoftConfig;
//# sourceMappingURL=muleSoft.d.ts.map