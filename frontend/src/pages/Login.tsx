import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { validateEmail } from '@/utils/validation';
import api from '@/lib/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    stayLoggedIn: false,
  });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDemoCredentials, setShowDemoCredentials] = useState(true);

  // Fetch system settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings/public');
        const settings = response.data.settings;
        if (settings.show_demo_credentials !== undefined) {
          setShowDemoCredentials(settings.show_demo_credentials === 'true' || settings.show_demo_credentials === true);
        }
      } catch (error) {
        // Use default (true)
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Validation
    const newErrors = { email: '', password: '' };
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    if (newErrors.email || newErrors.password) return;

    setIsLoading(true);
    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error: any) {
      setErrorMessage(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img 
              src="/images/logos/MuleSoft-RGB-icon.png" 
              alt="MuleSoft" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Document Analyzer</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              placeholder="admin@demo.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              placeholder="Enter your password"
              required
            />

            <div className="flex items-center">
              <input
                id="stayLoggedIn"
                type="checkbox"
                checked={formData.stayLoggedIn}
                onChange={(e) => setFormData({ ...formData, stayLoggedIn: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="stayLoggedIn" className="ml-2 text-sm text-gray-700">
                Stay logged in
              </label>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Create one
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          {showDemoCredentials && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-900 mb-2">Demo Credentials:</p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>Admin: admin@demo.com / Admin@123</p>
                <p>User: user@demo.com / User@123</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-600">Powered by</span>
            <img 
              src="/images/logos/MuleSoft-RGB-icon.png" 
              alt="MuleSoft" 
              className="h-5 w-5 object-contain"
            />
            <span className="text-sm text-gray-600 font-medium">MuleSoft</span>
          </div>
          <p className="text-xs text-gray-500">
            Created by Rodrigo Torres
          </p>
          <p className="text-xs text-gray-500">
            <a href="mailto:rodrigo.torres@salesforce.com" className="hover:text-primary-600">
              rodrigo.torres@salesforce.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};


