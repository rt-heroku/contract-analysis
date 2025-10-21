import React from 'react';
import { Card } from '@/components/common/Card';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Building,
  MapPin,
  Phone,
  Calendar,
  ShieldCheck,
  Package,
  Users
} from 'lucide-react';

interface ContractRendererProps {
  data: any;
}

export const ContractRenderer: React.FC<ContractRendererProps> = ({ data }) => {
  if (!data) {
    return <p className="text-gray-600">No contract data available.</p>;
  }

  // Extract data from paginated or flat structure
  const getFields = () => {
    // If paginated format (pages array exists)
    if (data.pages && Array.isArray(data.pages) && data.pages.length > 0) {
      return data.pages[0].fields || {};
    }
    // Otherwise use root-level data (old format)
    return data;
  };

  const fields = getFields();
  
  // Helper to format keys for display
  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  };

  return (
    <div className="space-y-4">
      {/* Document Information */}
      <Card title="Document Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Document Name</p>
            <p className="font-medium text-gray-900">{data.documentName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Document ID</p>
            <p className="font-mono text-xs text-gray-700">{data.id || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Processing Status</p>
            <div className="flex items-center gap-2">
              {data.status?.toLowerCase().includes('success') ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-600">Success</span>
                </>
              ) : data.status?.includes('VALIDATION') ? (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium text-yellow-600 text-xs">{data.status}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-600 text-xs">{data.status || 'Processing'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Document Summary */}
        {data.documentSummary && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Document Summary</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {data.documentSummary.replace(/^NOT PARSED:\s*/i, '')}
            </p>
          </div>
        )}
      </Card>

      {/* Parties Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Distributor */}
        {fields.distributor?.distributor && (
          <Card>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-primary-600" />
                Distributor
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {fields.distributor.distributor.name}
                  </p>
                </div>
                {fields.distributor.distributor.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{fields.distributor.distributor.address.address}</p>
                      <p>
                        {fields.distributor.distributor.address.city}, {fields.distributor.distributor.address.state} {fields.distributor.distributor.address.zipcode}
                      </p>
                    </div>
                  </div>
                )}
                {fields.distributor.distributor.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{fields.distributor.distributor.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Retailer */}
        {fields.retailer?.retailer && (
          <Card>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-green-600" />
                Retailer
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {fields.retailer.retailer.name}
                  </p>
                </div>
                {fields.retailer.retailer.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{fields.retailer.retailer.address.address}</p>
                      <p>
                        {fields.retailer.retailer.address.city}, {fields.retailer.retailer.address.state} {fields.retailer.retailer.address.zipcode}
                      </p>
                    </div>
                  </div>
                )}
                {fields.retailer.retailer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{fields.retailer.retailer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Agreement Dates */}
      {fields.createdDates && (
        <Card>
          <div className="p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Agreement Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Agreement Date</p>
                <p className="font-medium text-gray-900">
                  {fields.createdDates.agreedDate || 
                   fields.createdDates.agreed_date || 'N/A'}
                </p>
              </div>
              {fields.createdDates.parties && Array.isArray(fields.createdDates.parties) && fields.createdDates.parties.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Parties</p>
                  <div className="space-y-1">
                    {fields.createdDates.parties.map((party: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-sm text-gray-800">{party}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Contract Terms */}
      {fields.terms && (
        <Card>
          <div className="p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Contract Terms
            </h3>
            {/* Handle terms as array */}
            {Array.isArray(fields.terms) && fields.terms.length > 0 && (
              <div className="space-y-3">
                {fields.terms.map((term: string, index: number) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-700">{index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-800 flex-1">{term}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Handle terms as string */}
            {typeof fields.terms === 'string' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {fields.terms}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Purpose */}
      {fields.purpose && (
        <Card title="Agreement Purpose">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">
              {fields.purpose.replace(/^NOT PARSED:\s*/i, '')}
            </p>
          </div>
        </Card>
      )}

      {/* Promotional Math */}
      {fields.promotionalMath && (
        <Card title="Promotional Mathematics">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">
              {fields.promotionalMath.replace(/^NOT PARSED:\s*/i, '')}
            </p>
          </div>
        </Card>
      )}

      {/* Display Requirements */}
      {fields.display && (
        <Card title="Display Requirements">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">
              {fields.display.replace(/^NOT PARSED:\s*/i, '')}
            </p>
          </div>
        </Card>
      )}

      {/* Termination */}
      {fields.termination && (
        <Card title="Termination Clause">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">
              {fields.termination.replace(/^NOT PARSED:\s*/i, '')}
            </p>
          </div>
        </Card>
      )}

      {/* Compliance */}
      {fields.compliance && Array.isArray(fields.compliance) && fields.compliance.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              Compliance Requirements
            </h3>
            <div className="space-y-2">
              {fields.compliance.map((item: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Products */}
      {fields.products && Array.isArray(fields.products) && fields.products.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              Products ({fields.products.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Units Sold (Ref)
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ref. Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fields.products.map((product: any, index: number) => {
                    // Handle product which might be a string or an object
                    const productName = typeof product === 'object' && product !== null
                      ? product.name || 'Unknown Product'
                      : product || 'Unknown Product';
                    const unitsSold = typeof product === 'object' && product !== null
                      ? (product.units_sold || product['units sold (ref)'] || 'N/A')
                      : 'N/A';
                    const refPrice = typeof product === 'object' && product !== null
                      ? (product.ref_price || product['ref. price'] || 'N/A')
                      : 'N/A';
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-900">
                          {productName}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700">
                          {unitsSold}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700">
                          {refPrice !== 'N/A' && !isNaN(Number(refPrice)) ? `$${Number(refPrice).toFixed(2)}` : refPrice}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Full Response (JSON) - Collapsible */}
      {data && (
        <Card title="Full MuleSoft IDP Response (Raw JSON)">
          <details className="cursor-pointer">
            <summary className="text-sm font-medium text-gray-700 hover:text-gray-900 py-2">
              Click to expand raw JSON response
            </summary>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs mt-2 border border-gray-200 font-mono">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
};
