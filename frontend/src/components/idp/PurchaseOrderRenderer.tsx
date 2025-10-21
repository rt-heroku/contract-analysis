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

      {/* Line Items Table */}
      {tables.table1 && Array.isArray(tables.table1) && tables.table1.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Line Items ({tables.table1.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Line
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Code
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tables.table1.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm text-gray-700">
                        {item.lineNumber || index + 1}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700 font-mono">
                        {item.productCode || 'N/A'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700 whitespace-pre-wrap">
                        {item.description || 'N/A'}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700 text-right">
                        {item.quantity || 0}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
};

