import { useState, useEffect } from 'react';
import { Button } from '@/components/common/Button';
import { X, Plus, Trash2 } from 'lucide-react';

interface NodeEditModalProps {
  isOpen: boolean;
  node: any;
  allActions: any[];
  onClose: () => void;
  onSave: (nodeId: string, data: any, outputSchema?: any, inputSchema?: any) => void;
}

export const NodeEditModal = ({ isOpen, node, allActions: _allActions, onClose, onSave }: NodeEditModalProps) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (node) {
      setFormData(node.data.config || {});
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSave = () => {
    onSave(node.id, formData);
    onClose();
  };

  const renderFieldsByActionType = () => {
    const actionName = node.data.actionName?.toLowerCase() || '';

    // REST API Call
    if (actionName.includes('rest') || actionName.includes('api')) {
      return renderRestApiFields();
    }

    // Script
    if (actionName.includes('script')) {
      return renderScriptFields();
    }

    // IDP Extract
    if (actionName.includes('idp')) {
      return renderIdpFields();
    }

    // If Then Else
    if (actionName.includes('if')) {
      return renderIfThenElseFields();
    }

    // For Each
    if (actionName.includes('foreach') || actionName.includes('for_each')) {
      return renderForEachFields();
    }

    // While Loop
    if (actionName.includes('while')) {
      return renderWhileFields();
    }

    // Transform
    if (actionName.includes('transform')) {
      return renderTransformFields();
    }

    // Validate
    if (actionName.includes('validate')) {
      return renderValidateFields();
    }

    // Set Variable / Set Payload
    if (actionName.includes('variable') || actionName.includes('payload')) {
      return renderVariableFields();
    }

    // Default generic fields
    return renderGenericFields();
  };

  const renderRestApiFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
          <select
            value={formData.method || 'GET'}
            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
          </select>
        </div>
        <div className="col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">URL / Endpoint</label>
          <input
            type="text"
            value={formData.url || ''}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://api.example.com/endpoint or /api/users"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Headers</label>
        {Object.entries(formData.headers || {}).map(([key, value]) => (
          <div key={key} className="flex space-x-2 mb-2">
            <input
              type="text"
              value={key}
              disabled
              className="w-1/3 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
            <input
              type="text"
              value={value as string}
              onChange={(e) => setFormData({
                ...formData,
                headers: { ...formData.headers, [key]: e.target.value }
              })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <Button
              onClick={() => {
                const newHeaders = { ...formData.headers };
                delete newHeaders[key];
                setFormData({ ...formData, headers: newHeaders });
              }}
              className="px-3 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button
          onClick={() => {
            const key = prompt('Header name:');
            if (key) {
              setFormData({
                ...formData,
                headers: { ...(formData.headers || {}), [key]: '' }
              });
            }
          }}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Header
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Request Body</label>
        <textarea
          value={formData.body || ''}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
          rows={6}
          placeholder='{"key": "{{input.value}}"}'
        />
      </div>
    </div>
  );

  const renderScriptFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">JavaScript Code</label>
        <textarea
          value={formData.code || ''}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
          rows={12}
          placeholder={`// Available: input, context, console\nconst result = input.value * 2;\nreturn { output: result };`}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (ms)</label>
        <input
          type="number"
          value={formData.timeout || 5000}
          onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          min="100"
          max="30000"
        />
      </div>
    </div>
  );

  const renderIdpFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">IDP Execution ID</label>
        <input
          type="number"
          value={formData.idpExecutionId || ''}
          onChange={(e) => setFormData({ ...formData, idpExecutionId: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
        <input
          type="text"
          value={formData.documentType || 'contract'}
          onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="contract, invoice, etc."
        />
      </div>
    </div>
  );

  const renderIfThenElseFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
        <input
          type="text"
          value={formData.condition || ''}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="{{input.value}} > 100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use {`{{variable}}`} for dynamic values. Supports: ==, !=, &gt;, &lt;, &gt;=, &lt;=, &&, ||
        </p>
      </div>
    </div>
  );

  const renderForEachFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Array</label>
        <input
          type="text"
          value={formData.array || ''}
          onChange={(e) => setFormData({ ...formData, array: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="{{input.items}}"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Item Variable Name</label>
        <input
          type="text"
          value={formData.itemVar || 'item'}
          onChange={(e) => setFormData({ ...formData, itemVar: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="item"
        />
      </div>
    </div>
  );

  const renderWhileFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
        <input
          type="text"
          value={formData.condition || ''}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="{{context.counter}} < 10"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Max Iterations</label>
        <input
          type="number"
          value={formData.maxIterations || 100}
          onChange={(e) => setFormData({ ...formData, maxIterations: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          min="1"
          max="1000"
        />
      </div>
    </div>
  );

  const renderTransformFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Transformation Script</label>
        <textarea
          value={formData.transform || ''}
          onChange={(e) => setFormData({ ...formData, transform: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
          rows={8}
          placeholder={`// Transform input data\nreturn {\n  fullName: input.firstName + " " + input.lastName,\n  age: parseInt(input.age)\n};`}
        />
      </div>
    </div>
  );

  const renderValidateFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">JSON Schema</label>
        <textarea
          value={formData.schema || ''}
          onChange={(e) => setFormData({ ...formData, schema: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
          rows={10}
          placeholder={`{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" },\n    "age": { "type": "number" }\n  },\n  "required": ["name"]\n}`}
        />
      </div>
    </div>
  );

  const renderVariableFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Variable Name</label>
        <input
          type="text"
          value={formData.variableName || ''}
          onChange={(e) => setFormData({ ...formData, variableName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="myVariable"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
        <textarea
          value={formData.value || ''}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={4}
          placeholder="{{input.data}} or static value"
        />
      </div>
    </div>
  );

  const renderGenericFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Configuration (JSON)</label>
        <textarea
          value={JSON.stringify(formData, null, 2)}
          onChange={(e) => {
            try {
              setFormData(JSON.parse(e.target.value));
            } catch (err) {
              // Invalid JSON, ignore
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
          rows={10}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Action</h2>
            <p className="text-sm text-gray-600 mt-1">{node.data.label}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Node Label</label>
            <input
              type="text"
              value={formData.nodeLabel || node.data.label}
              onChange={(e) => setFormData({ ...formData, nodeLabel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Custom label for this node"
            />
          </div>

          {renderFieldsByActionType()}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button onClick={onClose} className="bg-gray-200 hover:bg-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

