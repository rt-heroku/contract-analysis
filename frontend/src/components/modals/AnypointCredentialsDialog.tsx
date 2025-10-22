import React, { useState } from 'react';
import { X, AlertTriangle, Save } from 'lucide-react';
import { Button } from '../common/Button';

interface AnypointCredentialsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (username: string, password: string, saveCredentials: boolean) => void;
}

export const AnypointCredentialsDialog: React.FC<AnypointCredentialsDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [saveCredentials, setSaveCredentials] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onSubmit(username, password, saveCredentials);
      setUsername('');
      setPassword('');
      setSaveCredentials(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Anypoint Credentials Required
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Manual validation requires Anypoint credentials to proceed.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anypoint Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your Anypoint username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anypoint Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your Anypoint password"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="saveCredentials"
                checked={saveCredentials}
                onChange={(e) => setSaveCredentials(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="saveCredentials" className="text-sm text-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Save className="w-4 h-4" />
                  <span className="font-medium">Save credentials</span>
                </div>
                <div className="text-xs text-gray-500 leading-relaxed">
                  Credentials will be encrypted and stored in the database for future use.
                </div>
              </label>
            </div>

            {saveCredentials && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  <strong>Security Warning:</strong> Do not store admin or super user credentials.
                  Only save standard user credentials with minimal necessary permissions.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!username || !password}
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

