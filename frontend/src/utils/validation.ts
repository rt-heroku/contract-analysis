export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getPasswordStrength = (password: string): {
  strength: 'weak' | 'medium' | 'strong';
  score: number;
} => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return { strength: 'weak', score };
  } else if (score <= 4) {
    return { strength: 'medium', score };
  } else {
    return { strength: 'strong', score };
  }
};

export const validateFileType = (
  file: File,
  type: 'contract' | 'data'
): { isValid: boolean; error?: string } => {
  if (type === 'contract') {
    if (file.type !== 'application/pdf') {
      return { isValid: false, error: 'Only PDF files are allowed for contracts' };
    }
  } else {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (!validTypes.includes(file.type)) {
      return { isValid: false, error: 'Only Excel (.xlsx) or CSV files are allowed' };
    }
  }
  return { isValid: true };
};

export const validateFileSize = (
  file: File,
  type: 'contract' | 'data'
): { isValid: boolean; error?: string } => {
  const maxSize = type === 'contract' ? 10 * 1024 * 1024 : 50 * 1024 * 1024; // 10MB for PDF, 50MB for Excel
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${type === 'contract' ? '10MB' : '50MB'} limit`,
    };
  }
  return { isValid: true };
};

