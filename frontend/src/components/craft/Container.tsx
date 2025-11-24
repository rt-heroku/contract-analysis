import React, { useState, useEffect } from 'react';
import { useNode } from '@craftjs/core';
import { Upload, Plus } from 'lucide-react';
import api from '@/lib/api';

interface ContainerProps {
  children?: React.ReactNode;
  // Dimensions
  width?: string;
  height?: string;
  // Colors
  background?: string;
  textColor?: string;
  // Margin (individual sides)
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  // Padding (individual sides)
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  // Decoration
  borderRadius?: number;
  boxShadow?: number;
  // Alignment (Flexbox)
  flexDirection?: 'row' | 'column';
  alignItems?: 'flex-start' | 'center' | 'flex-end';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  fillSpace?: boolean;
  // File Drop
  enableFileDrop?: boolean;
  acceptedFileTypes?: string;
  storeId?: string;
  maxFileSize?: number; // in MB
  maxFiles?: number;
  showUploadStatus?: boolean;
  className?: string;
}

export const Container: React.FC<ContainerProps> & { craft?: any } = ({
  children,
  width = 'auto',
  height = 'auto',
  background = 'transparent',
  textColor = 'inherit',
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
  paddingTop = 4,
  paddingRight = 4,
  paddingBottom = 4,
  paddingLeft = 4,
  borderRadius = 0,
  boxShadow = 0,
  flexDirection = 'column',
  alignItems = 'flex-start',
  justifyContent = 'flex-start',
  fillSpace = false,
  enableFileDrop = false,
  acceptedFileTypes = '.pdf,.jpg,.jpeg,.png,.doc,.docx',
  storeId = '',
  maxFileSize = 10,
  maxFiles = 5,
  showUploadStatus = true,
  className = '',
}) => {
  const {
    connectors: { connect, drag },
    selected,
  } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, status: string}>>([]);
  const [isUploading, setIsUploading] = useState(false);

  const shadowStyles = [
    'none',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  ];

  const handleDragOver = (e: React.DragEvent) => {
    if (!enableFileDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!enableFileDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (!enableFileDrop) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Validate file count
    if (maxFiles && files.length > maxFiles) {
      console.warn(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const acceptedExtensions = acceptedFileTypes.split(',').map(ext => ext.trim().toLowerCase());
      const isValidType = acceptedExtensions.includes(fileExtension);
      const isValidSize = file.size <= maxFileSize * 1024 * 1024; // Convert MB to bytes

      if (!isValidType) {
        console.warn(`File type ${fileExtension} not accepted`);
      }
      if (!isValidSize) {
        console.warn(`File ${file.name} exceeds maximum size of ${maxFileSize}MB`);
      }

      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return;

    // Upload files
    setIsUploading(true);
    const uploadResults = await Promise.all(
      validFiles.map(async (file) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          if (storeId) {
            formData.append('storeId', storeId);
          }

          // TODO: Replace with actual upload endpoint
          // const response = await api.post('/stores/upload', formData);
          
          return { name: file.name, status: 'success' };
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          return { name: file.name, status: 'error' };
        }
      })
    );

    setUploadedFiles([...uploadedFiles, ...uploadResults]);
    setIsUploading(false);
  };

  return (
    <div
      ref={(ref) => ref && connect(drag(ref))}
      className={`${selected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''} ${className} border border-dashed ${isDragging && enableFileDrop ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width,
        height,
        background,
        color: textColor,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        paddingTop: `${paddingTop * 4}px`,
        paddingRight: `${paddingRight * 4}px`,
        paddingBottom: `${paddingBottom * 4}px`,
        paddingLeft: `${paddingLeft * 4}px`,
        borderRadius: `${borderRadius}px`,
        boxShadow: shadowStyles[boxShadow],
        display: 'flex',
        flexDirection,
        alignItems,
        justifyContent,
        flex: fillSpace ? '1 1 0%' : '0 1 auto',
        minHeight: '100px',
      }}
    >
      {children || (
        <div className="text-gray-400 dark:text-gray-500 text-center py-8 text-sm w-full">
          {enableFileDrop ? (
            <>
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <div className="font-medium mb-1">
                {isDragging ? 'Release to upload files' : 'Drop files here or drop components'}
              </div>
              <div className="text-xs opacity-75 mb-2">
                Accepted: {acceptedFileTypes}
              </div>
              <div className="text-xs opacity-75">
                Max {maxFiles} files, {maxFileSize}MB each
              </div>
            </>
          ) : (
            <>
              <div className="font-medium mb-1">Drop components here</div>
              <div className="text-xs opacity-75">
                Alignment settings will affect child components
              </div>
            </>
          )}
        </div>
      )}

      {/* Upload Status */}
      {enableFileDrop && showUploadStatus && uploadedFiles.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg max-w-xs">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Uploaded Files
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${file.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-gray-600 dark:text-gray-400 truncate">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploading Indicator */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30 flex items-center justify-center rounded-lg">
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
            <div className="text-sm text-gray-700 dark:text-gray-300">Uploading files...</div>
          </div>
        </div>
      )}
    </div>
  );
};

const ContainerSettings: React.FC = () => {
  const {
    actions: { setProp },
    width,
    height,
    background,
    textColor,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    borderRadius,
    boxShadow,
    flexDirection,
    alignItems,
    justifyContent,
    fillSpace,
    enableFileDrop,
    acceptedFileTypes,
    storeId,
    maxFileSize,
    maxFiles,
    showUploadStatus,
  } = useNode((node) => ({
    width: node.data.props.width,
    height: node.data.props.height,
    background: node.data.props.background,
    textColor: node.data.props.textColor,
    marginTop: node.data.props.marginTop,
    marginRight: node.data.props.marginRight,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
    paddingTop: node.data.props.paddingTop,
    paddingRight: node.data.props.paddingRight,
    paddingBottom: node.data.props.paddingBottom,
    paddingLeft: node.data.props.paddingLeft,
    borderRadius: node.data.props.borderRadius,
    boxShadow: node.data.props.boxShadow,
    flexDirection: node.data.props.flexDirection,
    alignItems: node.data.props.alignItems,
    justifyContent: node.data.props.justifyContent,
    fillSpace: node.data.props.fillSpace,
    enableFileDrop: node.data.props.enableFileDrop,
    acceptedFileTypes: node.data.props.acceptedFileTypes,
    storeId: node.data.props.storeId,
    maxFileSize: node.data.props.maxFileSize,
    maxFiles: node.data.props.maxFiles,
    showUploadStatus: node.data.props.showUploadStatus,
  }));

  return (
    <div className="space-y-6">
      {/* Dimensions */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Dimensions</h4>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={width}
              onChange={(e) => setProp((props: any) => (props.width = e.target.value))}
              placeholder="auto"
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 self-center">×</span>
            <input
              type="text"
              value={height}
              onChange={(e) => setProp((props: any) => (props.height = e.target.value))}
              placeholder="auto"
              className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
        </div>
      </div>

      {/* Colors */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Colors</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Background</label>
            <input
              type="text"
              value={background}
              onChange={(e) => setProp((props: any) => (props.background = e.target.value))}
              placeholder="transparent"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Text Color</label>
            <input
              type="text"
              value={textColor}
              onChange={(e) => setProp((props: any) => (props.textColor = e.target.value))}
              placeholder="inherit"
              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
            />
          </div>
        </div>
      </div>

      {/* Margin */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Margin <span className="text-xs font-normal text-gray-500">{marginTop}px {marginRight}px {marginBottom}px {marginLeft}px</span>
        </h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Top</span>
              <span>Right</span>
            </div>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={marginTop}
                onChange={(e) => setProp((props: any) => (props.marginTop = parseInt(e.target.value)))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={marginRight}
                onChange={(e) => setProp((props: any) => (props.marginRight = parseInt(e.target.value)))}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Bottom</span>
              <span>Left</span>
            </div>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={marginBottom}
                onChange={(e) => setProp((props: any) => (props.marginBottom = parseInt(e.target.value)))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={marginLeft}
                onChange={(e) => setProp((props: any) => (props.marginLeft = parseInt(e.target.value)))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Padding */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Padding <span className="text-xs font-normal text-gray-500">{paddingTop * 4}px {paddingRight * 4}px {paddingBottom * 4}px {paddingLeft * 4}px</span>
        </h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Top</span>
              <span>Right</span>
            </div>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="20"
                value={paddingTop}
                onChange={(e) => setProp((props: any) => (props.paddingTop = parseInt(e.target.value)))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="20"
                value={paddingRight}
                onChange={(e) => setProp((props: any) => (props.paddingRight = parseInt(e.target.value)))}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Bottom</span>
              <span>Left</span>
            </div>
            <div className="flex gap-2">
              <input
                type="range"
                min="0"
                max="20"
                value={paddingBottom}
                onChange={(e) => setProp((props: any) => (props.paddingBottom = parseInt(e.target.value)))}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="20"
                value={paddingLeft}
                onChange={(e) => setProp((props: any) => (props.paddingLeft = parseInt(e.target.value)))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Decoration */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Decoration</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Radius</label>
            <input
              type="range"
              min="0"
              max="50"
              value={borderRadius}
              onChange={(e) => setProp((props: any) => (props.borderRadius = parseInt(e.target.value)))}
              className="w-full"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{borderRadius}px</span>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Shadow</label>
            <input
              type="range"
              min="0"
              max="4"
              value={boxShadow}
              onChange={(e) => setProp((props: any) => (props.boxShadow = parseInt(e.target.value)))}
              className="w-full"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {['None', 'Small', 'Medium', 'Large', 'Extra Large'][boxShadow]}
            </span>
          </div>
        </div>
      </div>

      {/* Alignment */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Alignment</h4>
        <div className="grid grid-cols-2 gap-4">
          {/* Flex Direction */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Flex Direction</label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="flexDirection"
                  value="row"
                  checked={flexDirection === 'row'}
                  onChange={(e) => setProp((props: any) => (props.flexDirection = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Row</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="flexDirection"
                  value="column"
                  checked={flexDirection === 'column'}
                  onChange={(e) => setProp((props: any) => (props.flexDirection = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Column</span>
              </label>
            </div>
          </div>

          {/* Fill Space */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Fill Space</label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fillSpace"
                  checked={fillSpace}
                  onChange={() => setProp((props: any) => (props.fillSpace = true))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fillSpace"
                  checked={!fillSpace}
                  onChange={() => setProp((props: any) => (props.fillSpace = false))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">No</span>
              </label>
            </div>
          </div>

          {/* Align Items */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Align Items</label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="alignItems"
                  value="flex-start"
                  checked={alignItems === 'flex-start'}
                  onChange={(e) => setProp((props: any) => (props.alignItems = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Start</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="alignItems"
                  value="center"
                  checked={alignItems === 'center'}
                  onChange={(e) => setProp((props: any) => (props.alignItems = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Center</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="alignItems"
                  value="flex-end"
                  checked={alignItems === 'flex-end'}
                  onChange={(e) => setProp((props: any) => (props.alignItems = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">End</span>
              </label>
            </div>
          </div>

          {/* Justify Content */}
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Justify Content</label>
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="justifyContent"
                  value="flex-start"
                  checked={justifyContent === 'flex-start'}
                  onChange={(e) => setProp((props: any) => (props.justifyContent = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Start</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="justifyContent"
                  value="center"
                  checked={justifyContent === 'center'}
                  onChange={(e) => setProp((props: any) => (props.justifyContent = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Center</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="justifyContent"
                  value="flex-end"
                  checked={justifyContent === 'flex-end'}
                  onChange={(e) => setProp((props: any) => (props.justifyContent = e.target.value))}
                  className="text-primary-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">End</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* File Drop Configuration */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">File Drop (Experimental)</h4>
        <div className="space-y-3">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableFileDrop}
                onChange={(e) => setProp((props: any) => (props.enableFileDrop = e.target.checked))}
                className="text-primary-600"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Enable File Drop</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              Allow users to drag and drop files into this container
            </p>
          </div>

          {enableFileDrop && (
            <>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Accepted File Types
                </label>
                <input
                  type="text"
                  value={acceptedFileTypes}
                  onChange={(e) => setProp((props: any) => (props.acceptedFileTypes = e.target.value))}
                  placeholder=".pdf,.jpg,.png"
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Comma-separated list of file extensions
                </p>
              </div>

              <StoreSelector
                selectedStoreId={storeId}
                onChange={(newStoreId) => setProp((props: any) => (props.storeId = newStoreId))}
              />

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Max File Size (MB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxFileSize}
                  onChange={(e) => setProp((props: any) => (props.maxFileSize = parseInt(e.target.value)))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Max Files
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={maxFiles}
                  onChange={(e) => setProp((props: any) => (props.maxFiles = parseInt(e.target.value)))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUploadStatus}
                    onChange={(e) => setProp((props: any) => (props.showUploadStatus = e.target.checked))}
                    className="text-primary-600"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Show Upload Status</span>
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Store Selector Component with Create New Store option
const StoreSelector: React.FC<{
  selectedStoreId: string;
  onChange: (storeId: string) => void;
}> = ({ selectedStoreId, onChange }) => {
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/stores');
      // Ensure we always have an array
      const storesData = Array.isArray(response.data) ? response.data : [];
      setStores(storesData);
    } catch (error: any) {
      console.error('Failed to fetch stores:', error);
      setError('Failed to load stores');
      setStores([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) return;

    try {
      setError('');
      const response = await api.post('/stores', { 
        name: newStoreName,
        type: 'file_storage', // Simple file storage type
        description: `File storage for ${newStoreName}`
      });
      const newStore = response.data;
      setStores([...stores, { id: newStore.id || newStore._id, name: newStore.name }]);
      onChange(newStore.id || newStore._id);
      setNewStoreName('');
      setShowCreateModal(false);
    } catch (error: any) {
      console.error('Failed to create store:', error);
      setError(error.response?.data?.error || 'Failed to create store');
    }
  };

  return (
    <div>
      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
        Target Store
      </label>
      {error && !showCreateModal && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <select
          value={selectedStoreId}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
          disabled={loading}
        >
          <option value="">
            {loading ? 'Loading stores...' : stores.length === 0 ? 'No stores available' : 'Select a store...'}
          </option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-2 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-xs flex items-center gap-1"
          title="Create new store"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {stores.length === 0 ? 'Create a store to enable file uploads' : 'Files will be uploaded to this store'}
      </p>

      {/* Create Store Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
              setNewStoreName('');
              setError('');
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Create New Store
            </h3>
            {error && (
              <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <input
              type="text"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newStoreName.trim()) {
                  handleCreateStore();
                }
              }}
              placeholder="Store name (e.g., Customer Documents)"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded mb-3"
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              A simple file storage will be created for uploading files.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewStoreName('');
                  setError('');
                }}
                className="px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStore}
                disabled={!newStoreName.trim()}
                className="px-3 py-1.5 text-xs text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded transition-colors"
              >
                Create Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Container.craft = {
  displayName: 'Container',
  props: {
    width: 'auto',
    height: 'auto',
    background: 'transparent',
    textColor: 'inherit',
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    paddingTop: 4,
    paddingRight: 4,
    paddingBottom: 4,
    paddingLeft: 4,
    borderRadius: 0,
    boxShadow: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    fillSpace: false,
    enableFileDrop: false,
    acceptedFileTypes: '.pdf,.jpg,.jpeg,.png,.doc,.docx',
    storeId: '',
    maxFileSize: 10,
    maxFiles: 5,
    showUploadStatus: true,
    className: '',
  },
  rules: {
    canDrag: () => true,
    canDrop: () => true,
    canMoveIn: () => true,
    canMoveOut: () => true,
  },
  related: {
    settings: ContainerSettings,
  },
};

