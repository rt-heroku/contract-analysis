#!/usr/bin/env node

/**
 * Demonstration script for IDP Multi-Page Merger
 * 
 * This script demonstrates how the merger handles the user's example
 * with a 2-page purchase order JSON.
 * 
 * Run with: node demo-idp-merger.js
 */

// Simplified merger implementation for demo (matches TypeScript version)
function mergeMultiPageIDPResponse(data) {
  if (!data?.pages || !Array.isArray(data.pages) || data.pages.length === 0) {
    return data;
  }

  if (data.pages.length === 1) {
    return {
      ...data,
      fields: data.pages[0].fields || {},
      tables: data.pages[0].tables || {},
    };
  }

  const mergedFields = mergeFields(data.pages);
  const mergedTables = mergeTables(data.pages);

  return {
    ...data,
    fields: mergedFields,
    tables: mergedTables,
    originalPages: data.pages,
  };
}

function mergeFields(pages) {
  const allFieldKeys = new Set();
  pages.forEach(page => {
    if (page.fields) {
      Object.keys(page.fields).forEach(key => allFieldKeys.add(key));
    }
  });

  const mergedFields = {};
  allFieldKeys.forEach(fieldKey => {
    const valuesAcrossPages = pages.map(page => page.fields?.[fieldKey]);
    mergedFields[fieldKey] = mergeFieldValue(valuesAcrossPages);
  });

  return mergedFields;
}

function mergeFieldValue(values) {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');

  if (nonNullValues.length === 0) return null;
  if (nonNullValues.length === 1) return nonNullValues[0];

  if (typeof nonNullValues[0] === 'object' && !Array.isArray(nonNullValues[0])) {
    return mergeNestedObject(nonNullValues);
  }

  const uniqueValues = [...new Set(nonNullValues.map(v => JSON.stringify(v)))];

  if (uniqueValues.length === 1) {
    return nonNullValues[0];
  }

  if (typeof nonNullValues[0] === 'string') {
    return nonNullValues.join('\n');
  }

  return nonNullValues[0];
}

function mergeNestedObject(objects) {
  const result = {};

  const allKeys = new Set();
  objects.forEach(obj => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => allKeys.add(key));
    }
  });

  allKeys.forEach(key => {
    const valuesForKey = objects.map(obj => obj?.[key]).filter(v => v !== null && v !== undefined);

    if (valuesForKey.length === 0) {
      result[key] = null;
    } else if (valuesForKey.length === 1) {
      result[key] = valuesForKey[0];
    } else if (typeof valuesForKey[0] === 'object' && !Array.isArray(valuesForKey[0])) {
      result[key] = mergeNestedObject(valuesForKey);
    } else {
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
}

function mergeTables(pages) {
  const allTableNames = new Set();
  pages.forEach(page => {
    if (page.tables) {
      Object.keys(page.tables).forEach(name => allTableNames.add(name));
    }
  });

  const mergedTables = {};

  allTableNames.forEach(tableName => {
    const tablesAcrossPages = pages
      .map((page, idx) => ({ pageNum: page.page || idx + 1, data: page.tables?.[tableName] }))
      .filter(t => t.data && Array.isArray(t.data) && t.data.length > 0);

    if (tablesAcrossPages.length === 0) {
      return;
    }

    if (tablesAcrossPages.length === 1) {
      mergedTables[tableName] = tablesAcrossPages[0].data;
      return;
    }

    const firstTable = tablesAcrossPages[0].data;
    const allHaveSameColumns = tablesAcrossPages.every(t => haveSameColumns(firstTable, t.data));

    if (allHaveSameColumns) {
      const mergedRows = [];
      tablesAcrossPages.forEach(t => {
        mergedRows.push(...t.data);
      });
      mergedTables[tableName] = mergedRows;
    } else {
      tablesAcrossPages.forEach(t => {
        const tableKey = tablesAcrossPages.length > 1 
          ? `${tableName}_page${t.pageNum}` 
          : tableName;
        mergedTables[tableKey] = t.data;
      });
    }
  });

  return mergedTables;
}

function haveSameColumns(arr1, arr2) {
  if (!arr1?.length || !arr2?.length) return false;

  const keys1 = Object.keys(arr1[0]).sort();
  const keys2 = Object.keys(arr2[0]).sort();

  return JSON.stringify(keys1) === JSON.stringify(keys2);
}

// User's example data
const userExampleData = {
  "id": "36607f2d-69e5-49f3-9c4c-86ca31925296",
  "pages": [
    {
      "page": 1,
      "fields": {
        "fob": null,
        "tax": null,
        "total": null,
        "emails": null,
        "carrier": null,
        "parties": {
          "buyer": {
            "city": null,
            "name": "Warren Derrick",
            "state": null,
            "street": null,
            "address": null,
            "country": null,
            "zipCode": null,
            "headerUrl": null,
            "headerName": "Warren Derrick",
            "headerPhone": "843-207-8181",
            "addressBlock": null,
            "headerAddress": "ATLANTIC COAST ELECTRIC SUPPLY 3\nSUMMERVILLE BRANCH\n332A INTERNATIONAL CIRCLE\nSUMMERVILLE, SC 29483"
          },
          "billTo": {
            "city": "SUMMERVILLE,",
            "name": "ATLANTIC COAST ELECTRIC SUPPLY",
            "state": "SC",
            "street": "PO Box 879",
            "address": "ATLANTIC COAST ELECTRIC SUPPLY\nPO Box 879\nSUMMERVILLE, SC 29484",
            "country": null,
            "zipCode": 29484,
            "addressBlock": "PO Box 879\nSUMMERVILLE, SC 29484"
          },
          "shipTo": {
            "city": "SUMMERVILLE,",
            "name": "ATLANTIC COAST ELECTRIC SUPPLY 3",
            "state": "SC",
            "street": "332A INTERNATIONAL CIRCLE",
            "address": "ATLANTIC COAST ELECTRIC SUPPLY 3\nSUMMERVILLE BRANCH\n332A INTERNATIONAL CIRCLE\nSUMMERVILLE, SC 29483",
            "country": null,
            "zipCode": 29483,
            "addressBlock": "332A INTERNATIONAL CIRCLE\nSUMMERVILLE, SC 29483"
          },
          "vendor": {
            "city": "SUMMERVILLE,",
            "name": "ATLANTIC COAST ELECTRIC SUPPLY 3\n-",
            "state": "SC",
            "street": "Pressley Rd",
            "address": "ATLANTIC COAST ELECTRIC SUPPLY 3\n-\nSUMMERVILLE BRANCH\n332A INTERNATIONAL CIRCLE\nSUMMERVILLE, SC 29483",
            "country": null,
            "zipCode": 29483,
            "headerUrl": null,
            "headerName": "ATLANTIC COAST ELECTRIC SUPPLY 3\n-",
            "headerPhone": "843-207-8181",
            "addressBlock": "SUMMERVILLE BRANCH\n332A INTERNATIONAL CIRCLE\nSUMMERVILLE, SC 29483",
            "headerAddress": "ATLANTIC COAST ELECTRIC SUPPLY 3\n-\nSUMMERVILLE BRANCH\n332A INTERNATIONAL CIRCLE\nSUMMERVILLE, SC 29483"
          }
        },
        "shipVia": "VC VENDOR CHOICE",
        "subtotal": null,
        "amountDue": null,
        "signatures": [],
        "deliveryDate": null,
        "paymentTerms": "Net 30 Days",
        "requiredByDate": null,
        "purchaseOrderDate": "08/25/2025",
        "purchaseOrderNumber": "P1129124"
      },
      "tables": {
        "table1": [
          {
            "price": 984.55,
            "quantity": 240,
            "unitPrice": "4102.280/M",
            "description": "SW XH3/0BN CU\n*COMPARTMENT REEL #1*\n*MARK \"VFD-JB\"*",
            "unitOfMeasure": "ea"
          },
          {
            "price": 984.55,
            "quantity": 240,
            "unitPrice": "4102.280/M",
            "description": "SW XH3/0OE CU\n*COMPARTMENT REEL #1*\n*MARK \"VFD-JB\"*",
            "unitOfMeasure": "ea"
          },
          {
            "price": 984.55,
            "quantity": 240,
            "unitPrice": "4102.280/M",
            "description": "SW XH3/0YW CU\n*COMPARTMENT REEL #1*\n*MARK \"VFD-JB\"*",
            "unitOfMeasure": "ea"
          }
        ]
      }
    },
    {
      "page": 2,
      "fields": {
        "fob": null,
        "tax": 0,
        "total": 11491.48,
        "emails": null,
        "carrier": null,
        "parties": {
          "buyer": {
            "city": null,
            "name": "ATLANTIC COAST\nELECTRIC SUPPLY",
            "state": null,
            "street": null,
            "address": null,
            "country": null,
            "zipCode": null,
            "headerUrl": null,
            "headerName": "ATLANTIC COAST\nELECTRIC SUPPLY",
            "headerPhone": null,
            "addressBlock": null,
            "headerAddress": null
          },
          "billTo": {
            "city": null,
            "name": null,
            "state": null,
            "street": null,
            "address": null,
            "country": null,
            "zipCode": null,
            "addressBlock": null
          },
          "shipTo": {
            "city": null,
            "name": null,
            "state": null,
            "street": null,
            "address": null,
            "country": null,
            "zipCode": null,
            "addressBlock": null
          },
          "vendor": {
            "city": null,
            "name": null,
            "state": null,
            "street": null,
            "address": null,
            "country": null,
            "zipCode": null,
            "headerUrl": null,
            "headerName": null,
            "headerPhone": null,
            "addressBlock": null,
            "headerAddress": null
          }
        },
        "shipVia": null,
        "subtotal": 11491.48,
        "amountDue": 11491.48,
        "signatures": [],
        "deliveryDate": null,
        "paymentTerms": null,
        "requiredByDate": null,
        "purchaseOrderDate": "08/25/2025",
        "purchaseOrderNumber": "P1129124"
      },
      "tables": {
        "table1": [
          {
            "price": 468.86,
            "quantity": 540,
            "unitPrice": "868.250/M",
            "description": "SW XH6GN 6 XHHW GREEN\n*GROUNDS*\n*1 X 540'*",
            "unitOfMeasure": "ea"
          }
        ]
      }
    }
  ],
  "status": "SUCCEEDED",
  "prompts": {
    "ShippingInx": {
      "answer": {
        "value": "PLEASE PROCESS FOR IMMEDIATE RELEASE PER QUOTE K310582"
      },
      "prompt": "What are the shipping instructions?",
      "source": "llm"
    },
    "quoteNumber": {
      "answer": {
        "value": "K310582"
      },
      "prompt": "What is the quote Number?",
      "source": "llm"
    },
    "vendorNumber": {
      "answer": {
        "value": 4239
      },
      "prompt": "what is the vendor Number?",
      "source": "llm"
    }
  },
  "documentName": "P1129124-0001.pdf"
};

// Run the merger
console.log('==================================================');
console.log('IDP MULTI-PAGE MERGER DEMONSTRATION');
console.log('==================================================\n');

console.log('Input: 2-page Purchase Order JSON\n');
console.log('Page 1 fields:', Object.keys(userExampleData.pages[0].fields).length, 'keys');
console.log('Page 1 table1 rows:', userExampleData.pages[0].tables.table1.length);
console.log('Page 2 fields:', Object.keys(userExampleData.pages[1].fields).length, 'keys');
console.log('Page 2 table1 rows:', userExampleData.pages[1].tables.table1.length);
console.log('\n--------------------------------------------------\n');

const merged = mergeMultiPageIDPResponse(userExampleData);

console.log('MERGED RESULT:\n');

console.log('📋 FIELDS MERGED:\n');

// Show key merged fields
console.log('✓ purchaseOrderNumber:', merged.fields.purchaseOrderNumber);
console.log('  → Same in both pages, not repeated\n');

console.log('✓ purchaseOrderDate:', merged.fields.purchaseOrderDate);
console.log('  → Same in both pages, not repeated\n');

console.log('✓ shipVia:', merged.fields.shipVia);
console.log('  → From page 1 (page 2 is null)\n');

console.log('✓ paymentTerms:', merged.fields.paymentTerms);
console.log('  → From page 1 (page 2 is null)\n');

console.log('✓ tax:', merged.fields.tax);
console.log('  → From page 2 (page 1 is null)\n');

console.log('✓ total:', merged.fields.total);
console.log('  → From page 2 (page 1 is null)\n');

console.log('✓ subtotal:', merged.fields.subtotal);
console.log('  → From page 2 (page 1 is null)\n');

console.log('✓ amountDue:', merged.fields.amountDue);
console.log('  → From page 2 (page 1 is null)\n');

console.log('✓ parties.buyer.name:', JSON.stringify(merged.fields.parties.buyer.name));
console.log('  → Different values concatenated with newline\n');

console.log('✓ parties.buyer.headerPhone:', merged.fields.parties.buyer.headerPhone);
console.log('  → From page 1 (page 2 is null)\n');

console.log('✓ parties.buyer.headerName:', merged.fields.parties.buyer.headerName);
console.log('  → Merged from both pages\n');

console.log('✓ parties.vendor.name:', merged.fields.parties.vendor.name);
console.log('  → From page 1 (page 2 is null)\n');

console.log('✓ parties.billTo.name:', merged.fields.parties.billTo.name);
console.log('  → From page 1 (page 2 is null)\n');

console.log('--------------------------------------------------\n');

console.log('📊 TABLES MERGED:\n');

console.log('✓ table1: Total rows =', merged.tables.table1.length);
console.log('  → 3 rows from page 1 + 1 row from page 2 = 4 rows');
console.log('  → Same columns across pages, so merged into single table\n');

console.log('Table rows:');
merged.tables.table1.forEach((row, idx) => {
  console.log(`  ${idx + 1}. ${row.description.substring(0, 30)}... | Qty: ${row.quantity} | Price: $${row.price}`);
});

console.log('\n--------------------------------------------------\n');

console.log('✅ MERGE COMPLETE!\n');
console.log('Summary:');
console.log('- All non-null fields extracted from both pages');
console.log('- No duplicate values for fields that are the same');
console.log('- Different values concatenated with newline');
console.log('- Table rows merged (same column structure)');
console.log('- Nested objects (parties) properly merged');
console.log('\n==================================================\n');

// Save merged result to file for inspection
const fs = require('fs');
const outputPath = './merged-idp-output.json';
fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
console.log(`📄 Full merged output saved to: ${outputPath}\n`);

