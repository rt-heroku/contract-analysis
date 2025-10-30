import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface SaveProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, version: string) => void;
  currentName: string;
  currentVersion: string;
  isPublished: boolean;
  requireVersionUpdate?: boolean;
}

export const SaveProcessModal: React.FC<SaveProcessModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentName,
  currentVersion,
  isPublished,
  requireVersionUpdate = false,
}) => {
  const [name, setName] = useState(currentName);
  const [version, setVersion] = useState(currentVersion);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setVersion(currentVersion);
      setError('');
    }
  }, [isOpen, currentName, currentVersion]);

  const parseVersion = (versionString: string): number[] => {
    // Extract numbers from version string (e.g., "v1.2.3" -> [1, 2, 3])
    const cleaned = versionString.replace(/^v/i, '');
    return cleaned.split('.').map(num => parseInt(num) || 0);
  };

  const compareVersions = (version1: string, version2: string): number => {
    const v1Parts = parseVersion(version1);
    const v2Parts = parseVersion(version2);
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1 = v1Parts[i] || 0;
      const v2 = v2Parts[i] || 0;
      
      if (v1 > v2) return 1;
      if (v1 < v2) return -1;
    }
    
    return 0;
  };

  const validateVersion = (newVersion: string): boolean => {
    // Check format
    const versionRegex = /^v?\d+(\.\d+)*$/i;
    if (!versionRegex.test(newVersion)) {
      setError('Version must be in format: v1.0 or 1.0.0');
      return false;
    }

    // If not published or requireVersionUpdate, must be higher than current
    if (!isPublished || requireVersionUpdate) {
      const comparison = compareVersions(newVersion, currentVersion);
      if (comparison <= 0) {
        setError(`Version must be higher than ${currentVersion}`);
        return false;
      }
    }

    setError('');
    return true;
  };

  const handleSave = () => {
    // Validate name
    if (!name.trim()) {
      setError('Process name is required');
      return;
    }

    // Validate version
    if (!validateVersion(version)) {
      return;
    }

    // Ensure version has 'v' prefix
    const formattedVersion = version.startsWith('v') ? version : `v${version}`;
    
    onSave(name.trim(), formattedVersion);
  };

  const handleVersionChange = (value: string) => {
    setVersion(value);
    setError('');
  };

  const suggestNextVersion = () => {
    const parts = parseVersion(currentVersion);
    
    // Increment patch version (last number)
    if (parts.length === 0) {
      return 'v1.0';
    }
    
    if (parts.length === 1) {
      return `v${parts[0] + 1}.0`;
    }
    
    // Increment the last part
    parts[parts.length - 1] += 1;
    return `v${parts.join('.')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {requireVersionUpdate ? 'Publish Process' : 'Save Process'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {requireVersionUpdate 
                ? 'Update version and publish your process'
                : 'Set process name and version'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Process Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Process Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter process name"
              autoFocus={!currentName}
            />
          </div>

          {/* Version */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Version *
              </label>
              {(!isPublished || requireVersionUpdate) && (
                <button
                  onClick={() => setVersion(suggestNextVersion())}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Suggest: {suggestNextVersion()}
                </button>
              )}
            </div>
            <input
              type="text"
              value={version}
              onChange={(e) => handleVersionChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., v1.0 or 1.0.0"
              autoFocus={!!currentName}
            />
            {(!isPublished || requireVersionUpdate) && (
              <p className="text-xs text-gray-500 mt-1">
                Must be higher than current version: {currentVersion}
              </p>
            )}
          </div>

          {/* Current Version Info */}
          {requireVersionUpdate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Current version:</strong> {currentVersion}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Publishing requires a version increment
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info Message */}
          {!isPublished && !requireVersionUpdate && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                💡 This is a draft process. You can save without incrementing the version.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
          >
            {requireVersionUpdate ? 'Publish' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

