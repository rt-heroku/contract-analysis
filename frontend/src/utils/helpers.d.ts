export declare const formatDate: (date: string | Date) => string;
export declare const formatDateTime: (date: string | Date) => string;
export declare const formatRelativeTime: (date: string | Date) => string;
export declare const formatFileSize: (bytes: number) => string;
export declare const truncateString: (str: string, maxLength: number) => string;
export declare const getInitials: (firstName?: string, lastName?: string) => string;
export declare const getStatusColor: (status: string) => string;
export declare const getNotificationColor: (type: string) => string;
export declare const cn: (...classes: (string | undefined | null | false)[]) => string;
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => ((...args: Parameters<T>) => void);
//# sourceMappingURL=helpers.d.ts.map