import React from 'react';
import { Card } from '@/components/common/Card';
import {
  FileText, Package, MapPin, Building, Calendar, CreditCard,
  Truck, DollarSign, User, Phone, Globe, Mail, Hash
} from 'lucide-react';

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

const PartyCard: React.FC<{ title: string; party: any; icon: React.ReactNode; color: string }> = ({ title, party, icon, color }) => {
  if (!party) return null;

  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl shadow-md overflow-hidden border border-gray-100`}>
      <div className="bg-white bg-opacity-90 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
            {icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        
        <div className="space-y-3">
          {party.name && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Company Name</p>
              <p className="text-base font-semibold text-gray-900">{party.name}</p>
            </div>
          )}
          
          {party.addressBlock && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Address
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {party.addressBlock}
              </p>
            </div>
          )}
          
          {(party.city || party.state || party.zipCode) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building className="w-4 h-4 text-gray-400" />
              <span>
                {party.city && <span>{party.city}</span>}
                {party.state && <span>, {party.state}</span>}
                {party.zipCode && <span> {party.zipCode}</span>}
              </span>
            </div>
          )}
          
          {party.country && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="w-4 h-4 text-gray-400" />
              <span>{party.country}</span>
            </div>
          )}
          
          {party.headerPhone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{party.headerPhone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PurchaseOrderRenderer: React.FC<PurchaseOrderRendererProps> = ({ data }) => {
  if (!data || !data.pages || data.pages.length === 0) {
    return <p className="text-gray-600">No purchase order data available.</p>;
  }

  // Get the first page (usually has all the main data)
  const firstPage = data.pages[0];
  const fields = firstPage?.fields || {};
  const parties = fields.parties || {};
  const tables = firstPage?.tables || {};

  return (
    <div className="space-y-6">
      {/* Purchase Order Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Purchase Order</h2>
            <p className="text-blue-100">Document extracted and processed</p>
          </div>
          <div className="bg-white rounded-xl px-6 py-3 shadow-lg">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">PO Number</p>
            <p className="text-2xl font-bold text-blue-700">
              {fields.purchaseOrderNumber || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Order Information
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Order Date
              </p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(fields.purchaseOrderDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Total Amount
              </p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(fields.total)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                Payment Terms
              </p>
              <p className="text-lg font-semibold text-gray-900">{fields.paymentTerms || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Truck className="w-3 h-3" />
                FOB
              </p>
              <p className="text-lg font-semibold text-gray-900">{fields.fob || 'N/A'}</p>
            </div>
          </div>

          {(fields.deliveryDate || fields.requiredByDate || fields.shipVia || fields.carrier) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {fields.deliveryDate && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Delivery Date</p>
                    <p className="text-sm text-gray-700">{formatDate(fields.deliveryDate)}</p>
                  </div>
                )}
                {fields.requiredByDate && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Required By</p>
                    <p className="text-sm text-gray-700">{formatDate(fields.requiredByDate)}</p>
                  </div>
                )}
                {fields.shipVia && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ship Via</p>
                    <p className="text-sm text-gray-700">{fields.shipVia}</p>
                  </div>
                )}
                {fields.carrier && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Carrier</p>
                    <p className="text-sm text-gray-700">{fields.carrier}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Parties Section */}
      {parties && Object.keys(parties).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Parties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {parties.vendor && (
              <PartyCard
                title="Vendor"
                party={parties.vendor}
                icon={<Building className="w-5 h-5 text-white" />}
                color="from-purple-400 to-purple-500"
              />
            )}
            {parties.buyer && (
              <PartyCard
                title="Buyer"
                party={parties.buyer}
                icon={<User className="w-5 h-5 text-white" />}
                color="from-blue-400 to-blue-500"
              />
            )}
            {parties.shipTo && (
              <PartyCard
                title="Ship To"
                party={parties.shipTo}
                icon={<Truck className="w-5 h-5 text-white" />}
                color="from-green-400 to-green-500"
              />
            )}
            {parties.billTo && (
              <PartyCard
                title="Bill To"
                party={parties.billTo}
                icon={<CreditCard className="w-5 h-5 text-white" />}
                color="from-orange-400 to-orange-500"
              />
            )}
          </div>
        </div>
      )}

      {/* Line Items Table */}
      {tables.table1 && Array.isArray(tables.table1) && tables.table1.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Line Items ({tables.table1.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Line
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Product Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {tables.table1.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {item.lineNumber || index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                      {item.productCode || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-pre-line">
                      {item.description || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {item.quantity || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                      {formatCurrency(item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {(fields.subtotal || fields.tax || fields.total) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Order Summary
            </h3>
          </div>
          <div className="p-6">
            <div className="max-w-md ml-auto space-y-3">
              {fields.subtotal && (
                <div className="flex justify-between items-center pb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-lg font-medium text-gray-900">{formatCurrency(fields.subtotal)}</span>
                </div>
              )}
              {fields.tax && (
                <div className="flex justify-between items-center pb-2">
                  <span className="text-gray-600">Tax:</span>
                  <span className="text-lg font-medium text-gray-900">{formatCurrency(fields.tax)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(fields.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

