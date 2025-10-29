import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';

interface IconUploadProps {
  currentIcon?: string;
  onIconChange: (iconDataUrl: string | null) => void;
  label?: string;
  helpText?: string;
}

export const IconUpload: React.FC<IconUploadProps> = ({
  currentIcon,
  onIconChange,
  label = 'Icon',
  helpText = 'Upload PNG, JPG, or SVG (max 512KB)',
}) => {
  const [preview, setPreview] = useState<string | null>(currentIcon || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a PNG, JPG, or SVG file');
      return;
    }

    // Validate file size (max 512KB)
    const maxSize = 512 * 1024; // 512KB
    if (file.size > maxSize) {
      setError('File size must be less than 512KB');
      return;
    }

    setError(null);

    // Read file and convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      onIconChange(dataUrl);
    };
    reader.onerror = () => {
      setError('Error reading file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onIconChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div className="flex items-start space-x-4">
        {/* Preview */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
            {preview ? (
              <img
                src={preview}
                alt="Icon preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-2">
          <div className="flex space-x-2">
            <Button
              type="button"
              onClick={handleClick}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="w-4 h-4" />
              <span>{preview ? 'Change' : 'Upload'} Icon</span>
            </Button>
            
            {preview && (
              <Button
                type="button"
                onClick={handleRemove}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <X className="w-4 h-4" />
                <span>Remove</span>
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />

          {error ? (
            <p className="text-xs text-red-600">{error}</p>
          ) : (
            <p className="text-xs text-gray-500">{helpText}</p>
          )}
        </div>
      </div>
    </div>
  );
};

