import React, { useState, useRef, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, X, ChevronDown } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  placeholder?: string;
}

// Get all available Lucide icon names
const getAvailableIcons = (): string[] => {
  const iconNames = Object.keys(LucideIcons).filter(
    (key) =>
      key !== 'createLucideIcon' &&
      key !== 'default' &&
      typeof (LucideIcons as any)[key] === 'function'
  );
  return iconNames.sort();
};

export const IconPicker: React.FC<IconPickerProps> = ({
  value,
  onChange,
  placeholder = 'Select an icon',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const availableIcons = getAvailableIcons();

  // Filter icons based on search term (show all if search is empty)
  const filteredIcons = searchTerm
    ? availableIcons.filter((iconName) =>
        iconName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableIcons;

  // Get the icon component
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) {
      console.warn(`Icon "${iconName}" not found in lucide-react`);
      return <span className="w-4 h-4 inline-block bg-gray-200 rounded" title={iconName} />;
    }
    try {
      return <IconComponent className="w-4 h-4" />;
    } catch (error) {
      console.error(`Error rendering icon "${iconName}":`, error);
      return <span className="w-4 h-4 inline-block bg-gray-200 rounded" title={iconName} />;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {value ? (
              <>
                {getIconComponent(value)}
                <span className="text-sm text-gray-900 truncate">{value}</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {value && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Clear selection"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </div>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search icons..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                autoFocus
              />
            </div>
          </div>

          {/* Icon List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredIcons.length > 0 ? (
              <div className="p-1">
                {filteredIcons.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleSelect(iconName)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors ${
                      value === iconName ? 'bg-primary-50 text-primary-700' : 'text-gray-900'
                    }`}
                  >
                    <div className="flex-shrink-0">{getIconComponent(iconName)}</div>
                    <span className="truncate">{iconName}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No icons found matching "{searchTerm}"
              </div>
            )}
          </div>

          {/* Footer with count */}
          <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
            {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''} available
          </div>
        </div>
      )}
    </div>
  );
};

