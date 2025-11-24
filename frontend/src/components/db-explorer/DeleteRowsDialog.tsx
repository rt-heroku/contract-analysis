import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

interface DeleteRowsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  rowCount: number;
  tableName: string;
  schemaName: string;
  hasDependencies?: boolean;
  dependencyInfo?: string[];
}

export const DeleteRowsDialog: React.FC<DeleteRowsDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  rowCount,
  tableName,
  schemaName,
  hasDependencies = false,
  dependencyInfo = [],
}) => {
  const [deleting, setDeleting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
      // Error will be handled by parent
    } finally {
      setDeleting(false);
      setConfirmed(false);
    }
  };

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Delete {rowCount === 1 ? 'Row' : 'Rows'}?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Table:</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
              {schemaName}.{tableName}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Rows to delete:</span>
            <span className="font-bold text-red-600 dark:text-red-400">{rowCount}</span>
          </div>
        </div>

        {/* Warnings */}
        <div className="space-y-3">
          {hasDependencies && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">
                    Foreign Key Constraints Detected
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-1">
                    This table has foreign key relationships. Deletion may fail or cascade to related tables
                    depending on constraint settings.
                  </p>
                  {dependencyInfo.length > 0 && (
                    <ul className="mt-2 text-sm text-yellow-800 dark:text-yellow-400 list-disc list-inside">
                      {dependencyInfo.map((dep, idx) => (
                        <li key={idx}>{dep}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-300">
                  Permanent Deletion
                </h3>
                <p className="text-sm text-red-800 dark:text-red-400 mt-1">
                  {rowCount === 1 
                    ? 'This row will be permanently deleted from the database.'
                    : `All ${rowCount} selected rows will be permanently deleted from the database.`
                  }
                  {' '}This operation cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        {rowCount > 1 && (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <input
              type="checkbox"
              id="confirmDelete"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="confirmDelete" className="text-sm text-gray-700 dark:text-gray-300">
              I understand that {rowCount} rows will be permanently deleted
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting || (rowCount > 1 && !confirmed)}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete {rowCount === 1 ? 'Row' : `${rowCount} Rows`}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

