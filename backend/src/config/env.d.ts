interface Config {
    port: number;
    nodeEnv: string;
    databaseUrl: string;
    jwtSecret: string;
    jwtExpiration: string;
    jwtRefreshExpiration: string;
    mulesoftApiBaseUrl: string;
    mulesoftApiUsername: string;
    mulesoftApiPassword: string;
    mulesoftApiTimeout: number;
    maxFileSizePdf: number;
    maxFileSizeExcel: number;
    corsOrigin: string;
    sessionSecret: string;
}
declare const config: Config;
export default config;
//# sourceMappingURL=env.d.ts.map