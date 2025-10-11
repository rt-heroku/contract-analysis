import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import { Button } from './Button';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttonText?: string;
  onButtonClick?: () => void;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'OK',
  onButtonClick,
}) => {
  if (!isOpen) return null;

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      onClose();
    }
  };

  const config = {
    success: {
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
    error: {
      icon: XCircle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonColor: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
  };

  const { icon: Icon, iconBg, iconColor, buttonColor } = config[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${iconBg}`}>
              <Icon className={`w-8 h-8 ${iconColor}`} />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            {message}
          </p>

          {/* Action */}
          <Button
            onClick={handleButtonClick}
            className={`w-full text-white ${buttonColor}`}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

