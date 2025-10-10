import { Request } from 'express';
export declare const getClientIp: (req: Request) => string;
export declare const getUserAgent: (req: Request) => string;
export declare const sanitizeHeaders: (headers: any) => any;
export declare const getFileExtension: (filename: string) => string;
export declare const isValidFileType: (mimetype: string, uploadType: "contract" | "data") => boolean;
export declare const formatFileSize: (bytes: number) => string;
export declare const sleep: (ms: number) => Promise<void>;
//# sourceMappingURL=helpers.d.ts.map