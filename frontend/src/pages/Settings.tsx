import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loading } from '@/components/common/Loading';
import { Upload, Save, Image as ImageIcon, Shield } from 'lucide-react';

interface Setting {
  id: number;
  settingKey: string;
  settingValue: string | null;
  description: string | null;
  isSecret: boolean;
}

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkAdminAccess();
    fetchSettings();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await api.get('/users/me');
      const isAdmin = response.data.user.roles?.some((r: any) => r.name === 'admin');
      if (!isAdmin) {
        navigate('/dashboard');
      }
    } catch (error) {
      navigate('/dashboard');
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/all');
      setSettings(response.data.settings);
      
      // Set logo preview
      const logoSetting = response.data.settings.find((s: Setting) => s.settingKey === 'app_logo_url');
      if (logoSetting?.settingValue) {
        setLogoPreview(logoSetting.settingValue);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (settingKey: string, value: string) => {
    setSettings(prev =>
      prev.map(s => s.settingKey === settingKey ? { ...s, settingValue: value } : s)
    );
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await api.post('/settings/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setLogoPreview(response.data.logoUrl);
      setLogoFile(null);
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to upload logo' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      // Update each setting
      for (const setting of settings) {
        await api.put(`/settings/${setting.settingKey}`, {
          settingValue: setting.settingValue,
        });
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save settings' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  const appSettings = settings.filter(s => s.settingKey.startsWith('app_'));
  const mulesoftSettings = settings.filter(s => s.settingKey.startsWith('mulesoft_'));
  const otherSettings = settings.filter(s => !s.settingKey.startsWith('app_') && !s.settingKey.startsWith('mulesoft_'));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure application and integration settings</p>
        </div>
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Application Settings */}
      <Card title="Application Settings">
        <div className="space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Logo
            </label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-32 h-32 object-contain border border-gray-300 rounded-lg bg-white p-2"
                  />
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </label>
                {logoFile && (
                  <Button
                    onClick={handleUploadLogo}
                    disabled={saving}
                    className="ml-2 bg-primary-600 hover:bg-primary-700"
                  >
                    Upload Logo
                  </Button>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Recommended: Square image, PNG or SVG, max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* App Name */}
          {appSettings.map(setting => (
            setting.settingKey !== 'app_logo_url' && (
              <div key={setting.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {setting.settingKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                <Input
                  value={setting.settingValue || ''}
                  onChange={(e) => handleSettingChange(setting.settingKey, e.target.value)}
                  placeholder={setting.description || ''}
                />
                {setting.description && (
                  <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                )}
              </div>
            )
          ))}
        </div>
      </Card>

      {/* MuleSoft API Settings */}
      <Card title="MuleSoft API Configuration">
        <div className="space-y-4">
          {mulesoftSettings.map(setting => (
            <div key={setting.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                {setting.settingKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                {setting.isSecret && (
                  <span title="Secret setting">
                    <Shield className="w-4 h-4 text-yellow-600" />
                  </span>
                )}
              </label>
              <Input
                type={setting.isSecret ? 'password' : 'text'}
                value={setting.settingValue || ''}
                onChange={(e) => handleSettingChange(setting.settingKey, e.target.value)}
                placeholder={setting.description || ''}
              />
              {setting.description && (
                <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Other Settings */}
      {otherSettings.length > 0 && (
        <Card title="Advanced Settings">
          <div className="space-y-4">
            {otherSettings.map(setting => (
              <div key={setting.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  {setting.settingKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  {setting.isSecret && (
                    <span title="Secret setting">
                      <Shield className="w-4 h-4 text-yellow-600" />
                    </span>
                  )}
                </label>
                <Input
                  type={setting.isSecret ? 'password' : 'text'}
                  value={setting.settingValue || ''}
                  onChange={(e) => handleSettingChange(setting.settingKey, e.target.value)}
                  placeholder={setting.description || ''}
                />
                {setting.description && (
                  <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

