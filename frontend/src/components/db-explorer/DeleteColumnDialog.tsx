import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { AlertTriangle } from 'lucide-react';

interface DeleteColumnDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cascade: boolean) => Promise<void>;
  columnName: string;
  tableName: string;
  schemaName: string;
  isLoading?: boolean;
}

export const DeleteColumnDialog: React.FC<DeleteColumnDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  columnName,
  tableName,
  schemaName,
  isLoading = false,
}) => {
  const [cascade, setCascade] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const expectedConfirmText = columnName;

  const handleConfirm = async () => {
    await onConfirm(cascade);
    setConfirmText('');
    setCascade(false);
  };

  const handleClose = () => {
    if (!isLoading) {
      setConfirmText('');
      setCascade(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Delete Column</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {schemaName}.{tableName}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">
              ⚠️ Permanent Action
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-400">
              <li>All data in this column will be permanently deleted</li>
              <li>This action cannot be undone</li>
              <li>Dependent views, functions, or constraints may be affected</li>
              <li>Consider backing up your data before proceeding</li>
            </ul>
          </div>

          {/* Column Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Column to delete:</div>
            <div className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 mt-1">
              {columnName}
            </div>
          </div>

          {/* Cascade Option */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
            <input
              type="checkbox"
              id="cascade"
              checked={cascade}
              onChange={(e) => setCascade(e.target.checked)}
              disabled={isLoading}
              className="mt-1 rounded"
            />
            <label htmlFor="cascade" className="cursor-pointer flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">CASCADE</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Automatically drop objects that depend on this column (views, constraints, etc.).
                <br />
                <strong>Warning:</strong> This may delete more than just the column!
              </div>
            </label>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type the column name <strong className="text-red-600">{expectedConfirmText}</strong> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedConfirmText}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-red-500
                font-mono"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={isLoading || confirmText !== expectedConfirmText}
          >
            {isLoading ? 'Deleting...' : 'Delete Column'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

