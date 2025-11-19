/**
 * Test cases for IDP multi-page merger
 */

import { mergeMultiPageIDPResponse } from './idpMerger';

describe('IDP Multi-Page Merger', () => {
  test('merges multi-page purchase order with same table columns', () => {
    const multiPagePO = {
      id: '36607f2d-69e5-49f3-9c4c-86ca31925296',
      pages: [
        {
          page: 1,
          fields: {
            fob: null,
            tax: null,
            total: null,
            shipVia: 'VC VENDOR CHOICE',
            paymentTerms: 'Net 30 Days',
            purchaseOrderDate: '08/25/2025',
            purchaseOrderNumber: 'P1129124',
            parties: {
              buyer: {
                name: 'Warren Derrick',
                headerPhone: '843-207-8181',
              },
              vendor: {
                name: 'ATLANTIC COAST ELECTRIC SUPPLY 3',
                city: 'SUMMERVILLE,',
                state: 'SC',
                zipCode: 29483,
              },
            },
          },
          tables: {
            table1: [
              {
                price: 984.55,
                quantity: 240,
                unitPrice: '4102.280/M',
                description: 'SW XH3/0BN CU\n*COMPARTMENT REEL #1*',
                unitOfMeasure: 'ea',
              },
              {
                price: 984.55,
                quantity: 240,
                unitPrice: '4102.280/M',
                description: 'SW XH3/0OE CU\n*COMPARTMENT REEL #1*',
                unitOfMeasure: 'ea',
              },
            ],
          },
        },
        {
          page: 2,
          fields: {
            fob: null,
            tax: 0,
            total: 11491.48,
            shipVia: null,
            paymentTerms: null,
            purchaseOrderDate: '08/25/2025',
            purchaseOrderNumber: 'P1129124',
            parties: {
              buyer: {
                name: 'ATLANTIC COAST\nELECTRIC SUPPLY',
                headerPhone: null,
              },
            },
          },
          tables: {
            table1: [
              {
                price: 468.86,
                quantity: 540,
                unitPrice: '868.250/M',
                description: 'SW XH6GN 6 XHHW GREEN',
                unitOfMeasure: 'ea',
              },
            ],
          },
        },
      ],
      status: 'SUCCEEDED',
      documentName: 'P1129124-0001.pdf',
    };

    const merged = mergeMultiPageIDPResponse(multiPagePO);

    // Fields should be merged
    expect(merged.fields.purchaseOrderNumber).toBe('P1129124'); // Same value, not repeated
    expect(merged.fields.purchaseOrderDate).toBe('08/25/2025'); // Same value, not repeated
    expect(merged.fields.shipVia).toBe('VC VENDOR CHOICE'); // From page 1 (page 2 is null)
    expect(merged.fields.paymentTerms).toBe('Net 30 Days'); // From page 1 (page 2 is null)
    expect(merged.fields.tax).toBe(0); // From page 2 (page 1 is null)
    expect(merged.fields.total).toBe(11491.48); // From page 2 (page 1 is null)

    // Parties should be merged with different buyer names concatenated
    expect(merged.fields.parties.buyer.name).toContain('Warren Derrick');
    expect(merged.fields.parties.buyer.headerPhone).toBe('843-207-8181'); // From page 1

    // Vendor info should be from page 1 (page 2 doesn't have it)
    expect(merged.fields.parties.vendor.name).toBe('ATLANTIC COAST ELECTRIC SUPPLY 3');

    // Tables with same columns should be merged
    expect(merged.tables.table1).toHaveLength(3); // 2 from page 1 + 1 from page 2
    expect(merged.tables.table1[0].description).toContain('SW XH3/0BN CU');
    expect(merged.tables.table1[2].description).toContain('SW XH6GN 6 XHHW GREEN');
  });

  test('creates separate tables when columns differ', () => {
    const multiPageWithDifferentTables = {
      id: 'test-id',
      pages: [
        {
          page: 1,
          fields: {},
          tables: {
            table1: [
              { productCode: 'ABC', description: 'Item 1', price: 100 },
              { productCode: 'DEF', description: 'Item 2', price: 200 },
            ],
          },
        },
        {
          page: 2,
          fields: {},
          tables: {
            table1: [
              { itemId: 'X123', name: 'Product A', cost: 50, quantity: 10 },
              { itemId: 'Y456', name: 'Product B', cost: 75, quantity: 5 },
            ],
          },
        },
      ],
      status: 'SUCCEEDED',
    };

    const merged = mergeMultiPageIDPResponse(multiPageWithDifferentTables);

    // Should have two separate tables
    expect(merged.tables.table1_page1).toBeDefined();
    expect(merged.tables.table1_page2).toBeDefined();
    expect(merged.tables.table1_page1).toHaveLength(2);
    expect(merged.tables.table1_page2).toHaveLength(2);
    expect(merged.tables.table1_page1[0].productCode).toBe('ABC');
    expect(merged.tables.table1_page2[0].itemId).toBe('X123');
  });

  test('handles single page without modification', () => {
    const singlePage = {
      id: 'single-page',
      pages: [
        {
          page: 1,
          fields: { name: 'Test', value: 100 },
          tables: { table1: [{ id: 1, desc: 'Item' }] },
        },
      ],
      status: 'SUCCEEDED',
    };

    const merged = mergeMultiPageIDPResponse(singlePage);

    expect(merged.fields.name).toBe('Test');
    expect(merged.fields.value).toBe(100);
    expect(merged.tables.table1).toHaveLength(1);
  });

  test('handles non-paginated data', () => {
    const flatData = {
      id: 'flat',
      name: 'Test',
      value: 100,
      status: 'SUCCEEDED',
    };

    const result = mergeMultiPageIDPResponse(flatData);

    // Should return data as-is
    expect(result).toEqual(flatData);
  });

  test('merges nested objects correctly', () => {
    const multiPageNested = {
      id: 'nested-test',
      pages: [
        {
          page: 1,
          fields: {
            party: {
              name: 'Company A',
              address: { street: '123 Main St', city: 'NYC' },
              phone: null,
            },
          },
          tables: {},
        },
        {
          page: 2,
          fields: {
            party: {
              name: null,
              address: { street: null, city: 'NYC', zipCode: '10001' },
              phone: '555-1234',
            },
          },
          tables: {},
        },
      ],
      status: 'SUCCEEDED',
    };

    const merged = mergeMultiPageIDPResponse(multiPageNested);

    // Name should be from page 1
    expect(merged.fields.party.name).toBe('Company A');
    // Phone should be from page 2
    expect(merged.fields.party.phone).toBe('555-1234');
    // Address street should be from page 1
    expect(merged.fields.party.address.street).toBe('123 Main St');
    // Address city should be 'NYC' (same in both)
    expect(merged.fields.party.address.city).toBe('NYC');
    // Address zipCode should be from page 2
    expect(merged.fields.party.address.zipCode).toBe('10001');
  });

  test('concatenates different string values with newline', () => {
    const multiPageDifferentValues = {
      id: 'diff-values',
      pages: [
        {
          page: 1,
          fields: { notes: 'First note' },
          tables: {},
        },
        {
          page: 2,
          fields: { notes: 'Second note' },
          tables: {},
        },
      ],
      status: 'SUCCEEDED',
    };

    const merged = mergeMultiPageIDPResponse(multiPageDifferentValues);

    expect(merged.fields.notes).toBe('First note\nSecond note');
  });
});

