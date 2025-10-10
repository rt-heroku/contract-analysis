import { Request } from 'express';

export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
  }
  return req.socket.remoteAddress || 'unknown';
};

export const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};

export const sanitizeHeaders = (headers: any): any => {
  const sanitized = { ...headers };
  // Remove sensitive headers
  delete sanitized['authorization'];
  delete sanitized['cookie'];
  delete sanitized['x-api-key'];
  return sanitized;
};

export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

export const isValidFileType = (
  mimetype: string,
  uploadType: 'contract' | 'data'
): boolean => {
  if (uploadType === 'contract') {
    return mimetype === 'application/pdf';
  } else {
    return (
      mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimetype === 'application/vnd.ms-excel' ||
      mimetype === 'text/csv'
    );
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};


