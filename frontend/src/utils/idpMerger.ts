/**
 * Utility functions for merging multi-page IDP responses
 * 
 * Handles intelligent merging of:
 * - Fields: merge non-null values, concatenate different values
 * - Tables: merge rows if columns match, create separate tables if different
 */

interface Page {
  page: number;
  fields: Record<string, any>;
  tables: Record<string, any[]>;
}

interface MergedIDPResponse {
  fields: Record<string, any>;
  tables: Record<string, any[]>;
}

/**
 * Check if two arrays have the same set of keys (for table comparison)
 */
const haveSameColumns = (arr1: any[], arr2: any[]): boolean => {
  if (!arr1?.length || !arr2?.length) return false;
  
  const keys1 = Object.keys(arr1[0]).sort();
  const keys2 = Object.keys(arr2[0]).sort();
  
  return JSON.stringify(keys1) === JSON.stringify(keys2);
};

/**
 * Merge a single field value from multiple pages
 * Rules:
 * - If only one has a non-null value: use that value
 * - If multiple pages have the same value: don't repeat
 * - If multiple pages have different values: concatenate with newline
 */
const mergeFieldValue = (values: any[]): any => {
  // Filter out null/undefined values
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNullValues.length === 0) return null;
  if (nonNullValues.length === 1) return nonNullValues[0];
  
  // Check if it's a nested object (like parties)
  if (typeof nonNullValues[0] === 'object' && !Array.isArray(nonNullValues[0])) {
    return mergeNestedObject(nonNullValues);
  }
  
  // For primitive values, check if they're all the same
  const uniqueValues = [...new Set(nonNullValues.map(v => JSON.stringify(v)))];
  
  if (uniqueValues.length === 1) {
    // All values are the same, return one
    return nonNullValues[0];
  }
  
  // Different values - concatenate with newline for strings
  if (typeof nonNullValues[0] === 'string') {
    return nonNullValues.join('\n');
  }
  
  // For numbers or other types, return the first non-null value
  return nonNullValues[0];
};

/**
 * Merge nested objects (like parties with buyer, vendor, etc.)
 */
const mergeNestedObject = (objects: any[]): any => {
  const result: any = {};
  
  // Get all keys from all objects
  const allKeys = new Set<string>();
  objects.forEach(obj => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => allKeys.add(key));
    }
  });
  
  // Merge each key
  allKeys.forEach(key => {
    const valuesForKey = objects.map(obj => obj?.[key]).filter(v => v !== null && v !== undefined);
    
    if (valuesForKey.length === 0) {
      result[key] = null;
    } else if (valuesForKey.length === 1) {
      result[key] = valuesForKey[0];
    } else if (typeof valuesForKey[0] === 'object' && !Array.isArray(valuesForKey[0])) {
      // Recursively merge nested objects
      result[key] = mergeNestedObject(valuesForKey);
    } else {
      // For primitives, use the first non-null or concatenate if different
      const uniqueVals = [...new Set(valuesForKey.map(v => JSON.stringify(v)))];
      if (uniqueVals.length === 1) {
        result[key] = valuesForKey[0];
      } else if (typeof valuesForKey[0] === 'string') {
        result[key] = valuesForKey.join('\n');
      } else {
        result[key] = valuesForKey[0];
      }
    }
  });
  
  return result;
};

/**
 * Merge fields from multiple pages
 */
const mergeFields = (pages: Page[]): Record<string, any> => {
  const allFieldKeys = new Set<string>();
  
  // Collect all field keys
  pages.forEach(page => {
    if (page.fields) {
      Object.keys(page.fields).forEach(key => allFieldKeys.add(key));
    }
  });
  
  const mergedFields: Record<string, any> = {};
  
  // Merge each field
  allFieldKeys.forEach(fieldKey => {
    const valuesAcrossPages = pages.map(page => page.fields?.[fieldKey]);
    mergedFields[fieldKey] = mergeFieldValue(valuesAcrossPages);
  });
  
  return mergedFields;
};

/**
 * Merge tables from multiple pages
 * Rules:
 * - If tables have the same columns: merge rows
 * - If tables have different columns: create separate tables (table1_page1, table1_page2, etc.)
 */
const mergeTables = (pages: Page[]): Record<string, any[]> => {
  const allTableNames = new Set<string>();
  
  // Collect all table names
  pages.forEach(page => {
    if (page.tables) {
      Object.keys(page.tables).forEach(name => allTableNames.add(name));
    }
  });
  
  const mergedTables: Record<string, any[]> = {};
  
  allTableNames.forEach(tableName => {
    const tablesAcrossPages = pages
      .map((page, idx) => ({ pageNum: page.page || idx + 1, data: page.tables?.[tableName] }))
      .filter(t => t.data && Array.isArray(t.data) && t.data.length > 0);
    
    if (tablesAcrossPages.length === 0) {
      return;
    }
    
    if (tablesAcrossPages.length === 1) {
      // Only one page has this table
      mergedTables[tableName] = tablesAcrossPages[0].data;
      return;
    }
    
    // Check if all tables have the same columns
    const firstTable = tablesAcrossPages[0].data;
    const allHaveSameColumns = tablesAcrossPages.every(t => haveSameColumns(firstTable, t.data));
    
    if (allHaveSameColumns) {
      // Merge all rows into one table
      const mergedRows: any[] = [];
      tablesAcrossPages.forEach(t => {
        mergedRows.push(...t.data);
      });
      mergedTables[tableName] = mergedRows;
    } else {
      // Different columns - create separate tables
      tablesAcrossPages.forEach(t => {
        const tableKey = tablesAcrossPages.length > 1 
          ? `${tableName}_page${t.pageNum}` 
          : tableName;
        mergedTables[tableKey] = t.data;
      });
    }
  });
  
  return mergedTables;
};

/**
 * Main function to merge multi-page IDP response
 */
export const mergeMultiPageIDPResponse = (data: any): any => {
  // If not paginated, return as-is
  if (!data?.pages || !Array.isArray(data.pages) || data.pages.length === 0) {
    return data;
  }
  
  // If only one page, extract and return it
  if (data.pages.length === 1) {
    return {
      ...data,
      fields: data.pages[0].fields || {},
      tables: data.pages[0].tables || {},
    };
  }
  
  // Merge multiple pages
  const mergedFields = mergeFields(data.pages);
  const mergedTables = mergeTables(data.pages);
  
  return {
    ...data,
    fields: mergedFields,
    tables: mergedTables,
    // Keep original pages for reference if needed
    originalPages: data.pages,
  };
};

/**
 * Check if data is in paginated format
 */
export const isPaginatedIDPResponse = (data: any): boolean => {
  return Array.isArray(data?.pages) && data.pages.length > 0;
};

