import React from 'react';
interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
    duration?: number;
}
export declare const Toast: React.FC<ToastProps>;
export declare const ToastContainer: React.FC<{
    toasts: any[];
}>;
export {};
//# sourceMappingURL=Toast.d.ts.map