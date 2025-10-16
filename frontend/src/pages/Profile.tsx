import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loading } from '@/components/common/Loading';
import { AlertDialog } from '@/components/common/AlertDialog';
import { User, Mail, Calendar, Upload, X, Camera, Save, Send } from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatarBase64?: string;
  roles: string[];
  createdAt: string;
  lastLogin?: string;
}

export const Profile: React.FC = () => {
  const { refreshAuth } = useAuth();
  const { can, isViewer } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');
      setProfile(response.data.profile);
      setFormData({
        firstName: response.data.profile.firstName || '',
        lastName: response.data.profile.lastName || '',
        phone: response.data.profile.phone || '',
        bio: response.data.profile.bio || '',
      });
      if (response.data.profile.avatarBase64) {
        setAvatarPreview(`data:image/png;base64,${response.data.profile.avatarBase64}`);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.put('/users/profile', formData);
      
      // Upload avatar if changed
      if (avatarPreview && avatarPreview !== `data:image/png;base64,${profile?.avatarBase64}`) {
        const formData = new FormData();
        if (fileInputRef.current?.files?.[0]) {
          formData.append('avatar', fileInputRef.current.files[0]);
          await api.post('/users/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else if (!avatarPreview && profile?.avatarBase64) {
        // Remove avatar
        await api.delete('/users/avatar');
      }

      await fetchProfile();
      await refreshAuth();
      setEditMode(false);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      alert(error.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const handleRequestPermissions = async () => {
    try {
      setRequesting(true);
      await api.post('/users/request-permissions');
      setAlertDialog({
        isOpen: true,
        title: 'Request Sent',
        message: 'Permission request sent! An administrator will review your request.',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Failed to request permissions:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Request Failed',
        message: error.response?.data?.error || 'Failed to send permission request',
        type: 'error',
      });
    } finally {
      setRequesting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">
            {isViewer ? 'View your personal information' : 'Manage your personal information'}
          </p>
        </div>
        <div className="flex gap-3">
          {!editMode && can.editProfile && (
            <Button
              onClick={() => setEditMode(true)}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Edit Profile
            </Button>
          )}
          {can.requestPermissions && (
            <Button
              onClick={handleRequestPermissions}
              isLoading={requesting}
              disabled={requesting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Request Permissions
            </Button>
          )}
        </div>
      </div>

      {/* Profile Picture */}
      <Card title="Profile Picture">
        <div className="flex items-center gap-6">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                <User className="w-16 h-16 text-gray-400" />
              </div>
            )}
            {editMode && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {profile.firstName || profile.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : 'No name set'}
            </h3>
            <p className="text-gray-600 mb-4">{profile.email}</p>
            
            {editMode && (
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Picture
                </Button>
                {avatarPreview && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </Button>
                )}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Recommended: Square image, at least 200x200px, max 5MB
            </p>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card title="Personal Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            {editMode ? (
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Enter your first name"
              />
            ) : (
              <p className="text-gray-900">{profile.firstName || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            {editMode ? (
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Enter your last name"
              />
            ) : (
              <p className="text-gray-900">{profile.lastName || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <p className="text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              {profile.email}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            {editMode ? (
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            ) : (
              <p className="text-gray-900">{profile.phone || 'Not set'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            {editMode ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-gray-900">{profile.bio || 'Not set'}</p>
            )}
          </div>
        </div>

        {editMode && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button
              onClick={handleSaveProfile}
              isLoading={saving}
              disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Button
              onClick={() => {
                setEditMode(false);
                setFormData({
                  firstName: profile.firstName || '',
                  lastName: profile.lastName || '',
                  phone: profile.phone || '',
                  bio: profile.bio || '',
                });
                if (profile.avatarBase64) {
                  setAvatarPreview(`data:image/png;base64,${profile.avatarBase64}`);
                } else {
                  setAvatarPreview(null);
                }
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        )}
      </Card>

      {/* Account Information */}
      <Card title="Account Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Created
            </label>
            <p className="text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              {formatDate(profile.createdAt)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Login
            </label>
            <p className="text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              {formatDate(profile.lastLogin)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles
            </label>
            <div className="flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium capitalize"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
};

