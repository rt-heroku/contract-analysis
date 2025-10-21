import React from 'react';
import { Card } from '@/components/common/Card';
import { FileText, AlertCircle } from 'lucide-react';

interface InvoiceRendererProps {
  data: any;
}

export const InvoiceRenderer: React.FC<InvoiceRendererProps> = ({ data }) => {
  // Placeholder for invoice-specific rendering
  // Will be implemented with actual invoice data structure
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <FileText className="w-12 h-12 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Invoice</h2>
            <p className="text-indigo-100">Document extracted and processed</p>
          </div>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <div className="flex items-start gap-3 text-blue-700">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-2">Invoice Renderer - Coming Soon</p>
              <p className="text-sm text-gray-600">
                This invoice-specific renderer will be implemented once we have the invoice data structure.
                For now, the generic renderer will handle invoice documents.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Fallback to showing raw data */}
      <Card title="Invoice Data">
        <div className="p-6">
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs border border-gray-200">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </Card>
    </div>
  );
};

