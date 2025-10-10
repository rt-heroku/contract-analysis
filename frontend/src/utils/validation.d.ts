export declare const validateEmail: (email: string) => boolean;
export declare const validatePassword: (password: string) => {
    isValid: boolean;
    errors: string[];
};
export declare const getPasswordStrength: (password: string) => {
    strength: "weak" | "medium" | "strong";
    score: number;
};
export declare const validateFileType: (file: File, type: "contract" | "data") => {
    isValid: boolean;
    error?: string;
};
export declare const validateFileSize: (file: File, type: "contract" | "data") => {
    isValid: boolean;
    error?: string;
};
//# sourceMappingURL=validation.d.ts.map