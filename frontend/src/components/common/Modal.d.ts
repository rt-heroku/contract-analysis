import React, { ReactNode } from 'react';
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
}
export declare const Modal: React.FC<ModalProps>;
export {};
//# sourceMappingURL=Modal.d.ts.map