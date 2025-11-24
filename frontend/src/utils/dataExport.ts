/**
 * Data Export Utilities
 * Supports CSV, JSON, SQL, Excel, and clipboard operations
 */

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  delimiter?: string;
  tableName?: string;
  schemaName?: string;
}

/**
 * Export data to CSV format
 */
export const exportToCSV = (data: any[], options: ExportOptions = {}): void => {
  const { filename = 'export.csv', includeHeaders = true, delimiter = ',' } = options;
  
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  let csv = '';

  // Add headers
  if (includeHeaders) {
    csv += headers.map(h => `"${h}"`).join(delimiter) + '\n';
  }

  // Add rows
  data.forEach(row => {
    csv += headers.map(h => {
      const value = row[h];
      if (value === null || value === undefined) return '""';
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(delimiter) + '\n';
  });

  downloadFile(csv, filename, 'text/csv');
};

/**
 * Export data to JSON format
 */
export const exportToJSON = (data: any[], options: ExportOptions = {}): void => {
  const { filename = 'export.json' } = options;
  
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
};

/**
 * Export data to SQL INSERT statements
 */
export const exportToSQL = (data: any[], options: ExportOptions = {}): void => {
  const { 
    filename = 'export.sql', 
    tableName = 'exported_table',
    schemaName = 'public'
  } = options;
  
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const columns = Object.keys(data[0]);
  let sql = `-- SQL Export\n-- Table: ${schemaName}.${tableName}\n-- Rows: ${data.length}\n\n`;

  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'number') return value;
      if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      return `'${String(value).replace(/'/g, "''")}'`;
    }).join(', ');

    sql += `INSERT INTO ${schemaName}.${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
  });

  downloadFile(sql, filename, 'text/plain');
};

/**
 * Export data to Excel-compatible format (TSV)
 */
export const exportToExcel = (data: any[], options: ExportOptions = {}): void => {
  const { filename = 'export.xlsx' } = options;
  exportToCSV(data, { ...options, filename, delimiter: '\t' });
};

/**
 * Copy data to clipboard
 */
export const copyToClipboard = async (data: any[], format: 'csv' | 'json' | 'sql' | 'tsv' = 'csv'): Promise<boolean> => {
  try {
    let content = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'sql':
        const columns = Object.keys(data[0]);
        data.forEach(row => {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null || value === undefined) return 'NULL';
            if (typeof value === 'number') return value;
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
          }).join(', ');
          content += `(${values}),\n`;
        });
        break;
      case 'tsv':
        const headers = Object.keys(data[0]);
        content = headers.join('\t') + '\n';
        data.forEach(row => {
          content += headers.map(h => row[h] ?? '').join('\t') + '\n';
        });
        break;
      case 'csv':
      default:
        const cols = Object.keys(data[0]);
        content = cols.join(',') + '\n';
        data.forEach(row => {
          content += cols.map(c => {
            const val = row[c];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return JSON.stringify(val);
            return String(val);
          }).join(',') + '\n';
        });
    }

    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Helper function to download file
 */
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export DDL (Data Definition Language) for database objects
 */
export const exportDDL = (ddl: string, objectName: string, objectType: string): void => {
  const filename = `${objectType}_${objectName}.sql`;
  downloadFile(ddl, filename, 'text/plain');
};

