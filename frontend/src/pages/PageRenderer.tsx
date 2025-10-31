import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Editor, Frame } from '@craftjs/core';
import lz from 'lz-string';
import { ComponentLibrary } from '@/components/craft';
import api from '@/lib/api';
import { Loading } from '@/components/common/Loading';

export const PageRenderer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [pageConfig, setPageConfig] = useState<string | null>(null);
  const [pageName, setPageName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get(`/pages/slug/${slug}`);
        const page = response.data;
        
        setPageName(page.name);
        
        if (page.pageConfig) {
          const decompressed = lz.decompressFromBase64(page.pageConfig);
          if (decompressed) {
            setPageConfig(decompressed);
          } else {
            setError('Failed to decompress page configuration');
          }
        } else {
          setError('Page configuration is empty');
        }
      } catch (err: any) {
        console.error('Failed to load page:', err);
        setError(err.response?.data?.error || 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!pageConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {pageName && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {pageName}
          </h1>
        </div>
      )}
      
      <Editor resolver={ComponentLibrary} enabled={false}>
        <Frame data={pageConfig}>
          {/* Page content rendered here */}
        </Frame>
      </Editor>
    </div>
  );
};

