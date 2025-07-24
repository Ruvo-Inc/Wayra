import React, { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon, 
  ClipboardIcon, 
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { User } from '../../types/adventure';

interface TOTPModalProps {
  isOpen: boolean;
  user: User | null;
  isEnabled: boolean;
  onClose: () => void;
  onEnabled?: () => void;
}

export const TOTPModal: React.FC<TOTPModalProps> = ({
  isOpen,
  user,
  isEnabled: initialIsEnabled,
  onClose,
  onEnabled
}) => {
  const [secret, setSecret] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [totpUrl, setTotpUrl] = useState<string | null>(null);
  const [firstCode, setFirstCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isEnabled, setIsEnabled] = useState(initialIsEnabled);
  const [reauthError, setReauthError] = useState(false);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle keyboard events
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      return () => document.removeEventListener('keydown', handleKeydown);
    }
  }, [isOpen, onClose]);

  // Fetch setup info when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSetupInfo();
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const generateQRCode = async (secret: string) => {
    try {
      // In a real implementation, you would use a QR code library like 'qrcode'
      // For now, we'll use a placeholder or external service
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(secret)}`;
      setQrCodeDataUrl(qrCodeUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const fetchSetupInfo = async () => {
    try {
      const response = await fetch('/auth/browser/v1/account/authenticators/totp', {
        method: 'GET'
      });
      const data = await response.json();

      if (response.status === 404) {
        setSecret(data.meta.secret);
        const url = `otpauth://totp/AdventureLog:${user?.username}?secret=${data.meta.secret}&issuer=AdventureLog`;
        setTotpUrl(url);
        generateQRCode(url);
      } else if (response.ok) {
        onClose();
      } else {
        console.error('Error fetching TOTP setup info');
      }
    } catch (error) {
      console.error('Error fetching TOTP setup info:', error);
    }
  };

  const sendTotp = async () => {
    if (!firstCode) {
      alert('Please enter the authenticator code');
      return;
    }

    setLoading(true);
    setReauthError(false);

    try {
      const response = await fetch('/auth/browser/v1/account/authenticators/totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: firstCode
        }),
        credentials: 'include'
      });

      if (response.ok) {
        console.log('MFA enabled successfully');
        setIsEnabled(true);
        onEnabled?.();
        getRecoveryCodes();
      } else {
        if (response.status === 401) {
          setReauthError(true);
        }
        console.error('Error enabling MFA');
      }
    } catch (error) {
      console.error('Error enabling MFA:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecoveryCodes = async () => {
    try {
      const response = await fetch('/auth/browser/v1/account/authenticators/recovery-codes', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setRecoveryCodes(data.data.unused_codes);
      } else {
        console.error('Error fetching recovery codes');
      }
    } catch (error) {
      console.error('Error fetching recovery codes:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5" />
            Enable Multi-Factor Authentication
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code */}
          {qrCodeDataUrl && (
            <div className="flex items-center justify-center">
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code for TOTP setup" 
                className="w-64 h-64 border border-gray-200 dark:border-gray-700 rounded-lg"
              />
            </div>
          )}

          {/* Secret Key */}
          {secret && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Manual Entry Key
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={secret}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(secret)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center gap-1"
                >
                  <ClipboardIcon className="w-4 h-4" />
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Authenticator Code Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Enter Authenticator Code
            </label>
            <input
              type="text"
              placeholder="000000"
              value={firstCode}
              onChange={(e) => setFirstCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={6}
            />
          </div>

          {/* Recovery Codes */}
          {recoveryCodes.length > 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">Recovery Codes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Save these codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </p>
                <button
                  onClick={() => copyToClipboard(recoveryCodes.join(', '))}
                  className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center gap-1 mx-auto"
                >
                  <ClipboardIcon className="w-4 h-4" />
                  Copy All
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, index) => (
                  <input
                    key={index}
                    type="text"
                    value={code}
                    readOnly
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-center font-mono"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reauth Error */}
          {reauthError && (
            <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">
                Session expired. Please refresh the page and try again.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Close
          </button>
          {!isEnabled && (
            <button
              onClick={sendTotp}
              disabled={loading || !firstCode}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
            >
              {loading ? 'Enabling...' : 'Enable MFA'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TOTPModal;
