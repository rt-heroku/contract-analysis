import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Loading } from './Loading';
import { Search, X, UserPlus, Users } from 'lucide-react';
import api from '@/lib/api';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisId: number;
  onShareSuccess?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  analysisId,
  onShareSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [sharedUsers, setSharedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSharedUsers();
    }
  }, [isOpen, analysisId]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const fetchSharedUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analysis/${analysisId}/shared-users`);
      setSharedUsers(response.data.sharedUsers || []);
    } catch (error) {
      console.error('Failed to fetch shared users:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setSearching(true);
      const response = await api.get('/users/search', {
        params: { q: searchTerm },
      });
      // Filter out users already shared with
      const filtered = response.data.users.filter(
        (user: User) => !sharedUsers.some((su) => su.id === user.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleShare = async (user: User) => {
    try {
      await api.post(`/analysis/${analysisId}/share`, {
        userId: user.id,
      });
      setSharedUsers([...sharedUsers, user]);
      setSearchResults(searchResults.filter((u) => u.id !== user.id));
      setSearchTerm('');
      if (onShareSuccess) {
        onShareSuccess();
      }
    } catch (error: any) {
      console.error('Failed to share:', error);
      setError(error.response?.data?.error || 'Failed to share');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUnshare = async (userId: number) => {
    try {
      await api.delete(`/analysis/${analysisId}/share/${userId}`);
      setSharedUsers(sharedUsers.filter((u) => u.id !== userId));
      if (onShareSuccess) {
        onShareSuccess();
      }
    } catch (error: any) {
      console.error('Failed to unshare:', error);
      setError(error.response?.data?.error || 'Failed to unshare');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Analysis">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Search Users */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search users to share with
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-10"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loading size="sm" />
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleShare(user)}
                    className="bg-primary-600 hover:bg-primary-700 flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Share
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shared Users List */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">
              Shared with ({sharedUsers.length})
            </label>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loading size="md" />
            </div>
          ) : sharedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Not shared with anyone yet</p>
              <p className="text-xs mt-1">Search and add users above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sharedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-xs text-blue-700">{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleUnshare(user.id)}
                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Remove share"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button onClick={onClose} variant="outline">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

