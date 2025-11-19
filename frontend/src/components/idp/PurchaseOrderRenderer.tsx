import React from 'react';
import { Card } from '@/components/common/Card';
import {
  FileText, Package, MapPin, Building, CreditCard,
  Truck, User
} from 'lucide-react';
import { mergeMultiPageIDPResponse } from '@/utils/idpMerger';

interface PurchaseOrderRendererProps {
  data: any;
}

const formatCurrency = (value: any): string => {
  if (!value) return 'N/A';
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : value;
  return isNaN(numValue) ? String(value) : `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date: any): string => {
  if (!date) return 'N/A';
  return String(date);
};

export const PurchaseOrderRenderer: React.FC<PurchaseOrderRendererProps> = ({ data }) => {
  if (!data || !data.pages || data.pages.length === 0) {
    return <p className="text-gray-600">No purchase order data available.</p>;
  }

  // Merge multi-page data intelligently
  const mergedData = mergeMultiPageIDPResponse(data);
  const fields = mergedData.fields || {};
  const parties = fields.parties || {};
  const tables = mergedData.tables || {};

  return (
    <div className="space-y-4">

      {/* Key Information */}
      <Card>
        <div className="p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Order Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Order Date</p>
              <p className="font-medium text-gray-900">{formatDate(fields.purchaseOrderDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">PO Number</p>
              <p className="font-medium text-gray-900">{fields.purchaseOrderNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="font-medium text-green-600">{formatCurrency(fields.total)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Payment Terms</p>
              <p className="font-medium text-gray-900">{fields.paymentTerms || 'N/A'}</p>
            </div>
          </div>

          {(fields.deliveryDate || fields.requiredByDate || fields.shipVia || fields.carrier || fields.fob) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {fields.fob && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">FOB</p>
                    <p className="text-sm text-gray-700">{fields.fob}</p>
                  </div>
                )}
                {fields.deliveryDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Delivery Date</p>
                    <p className="text-sm text-gray-700">{formatDate(fields.deliveryDate)}</p>
                  </div>
                )}
                {fields.requiredByDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Required By</p>
                    <p className="text-sm text-gray-700">{formatDate(fields.requiredByDate)}</p>
                  </div>
                )}
                {fields.shipVia && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ship Via</p>
                    <p className="text-sm text-gray-700">{fields.shipVia}</p>
                  </div>
                )}
                {fields.carrier && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Carrier</p>
                    <p className="text-sm text-gray-700">{fields.carrier}</p>
                  </div>
                )}
                {fields.tax && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tax</p>
                    <p className="text-sm text-gray-700">{formatCurrency(fields.tax)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Parties Section */}
      {parties && Object.keys(parties).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parties.vendor && (
            <Card>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary-600" />
                  Vendor
                </h3>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">{parties.vendor.name}</p>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      {parties.vendor.street && <div>{parties.vendor.street}</div>}
                      <div>
                        {parties.vendor.city && <span>{parties.vendor.city}</span>}
                        {parties.vendor.state && <span>, {parties.vendor.state}</span>}
                        {parties.vendor.zipCode && <span> {parties.vendor.zipCode}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
          {parties.buyer && (
            <Card>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Buyer
                </h3>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">{parties.buyer.name}</p>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      {parties.buyer.street && <div>{parties.buyer.street}</div>}
                      <div>
                        {parties.buyer.city && <span>{parties.buyer.city}</span>}
                        {parties.buyer.state && <span>, {parties.buyer.state}</span>}
                        {parties.buyer.zipCode && <span> {parties.buyer.zipCode}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
          {parties.shipTo && (
            <Card>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Ship To
                </h3>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">{parties.shipTo.name}</p>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      {parties.shipTo.street && <div>{parties.shipTo.street}</div>}
                      <div>
                        {parties.shipTo.city && <span>{parties.shipTo.city}</span>}
                        {parties.shipTo.state && <span>, {parties.shipTo.state}</span>}
                        {parties.shipTo.zipCode && <span> {parties.shipTo.zipCode}</span>}
                      </div>
                      {parties.shipTo.country && <div>{parties.shipTo.country}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
          {parties.billTo && (
            <Card>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                  Bill To
                </h3>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">{parties.billTo.name}</p>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      {parties.billTo.street && <div>{parties.billTo.street}</div>}
                      <div>
                        {parties.billTo.city && <span>{parties.billTo.city}</span>}
                        {parties.billTo.state && <span>, {parties.billTo.state}</span>}
                        {parties.billTo.zipCode && <span> {parties.billTo.zipCode}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Line Items Tables - Render all tables */}
      {Object.entries(tables).map(([tableName, tableData]: [string, any]) => {
        if (!Array.isArray(tableData) || tableData.length === 0) return null;
        
        // Get all unique column keys from the table data
        const columnKeys = Array.from(
          new Set(tableData.flatMap(row => Object.keys(row)))
        );
        
        // Format table name for display
        const tableTitle = tableName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        return (
          <Card key={tableName}>
            <div className="p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-600" />
                {tableTitle} ({tableData.length} items)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Line
                      </th>
                      {columnKeys.map(key => (
                        <th key={key} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-700">
                          {item.lineNumber || index + 1}
                        </td>
                        {columnKeys.map(key => (
                          <td 
                            key={key} 
                            className={`px-3 py-3 text-sm text-gray-700 ${
                              key === 'description' ? 'whitespace-pre-wrap' : ''
                            } ${
                              ['quantity', 'unitPrice', 'price', 'total'].includes(key) ? 'text-right font-medium' : ''
                            }`}
                          >
                            {key === 'unitPrice' || key === 'price' || key === 'total'
                              ? formatCurrency(item[key])
                              : item[key] || 'N/A'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        );
      })}

    </div>
  );
};

