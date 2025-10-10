import React, { ReactNode } from 'react';
interface AppContextType {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
}
export declare const useApp: () => AppContextType;
interface AppProviderProps {
    children: ReactNode;
}
export declare const AppProvider: React.FC<AppProviderProps>;
export {};
//# sourceMappingURL=AppContext.d.ts.map