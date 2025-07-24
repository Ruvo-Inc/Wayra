import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  UserIcon, 
  MapPinIcon, 
  ShieldCheckIcon, 
  CogIcon, 
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { User } from '../../types/adventure';

interface AvatarProps {
  user: User;
  onLogout?: () => void;
  className?: string;
}

interface MenuItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  section: 'main' | 'secondary';
  textColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  user,
  onLogout,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Get display name
  const displayName = user.firstName 
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user.username || 'User';

  // Get initials for fallback
  const initials = user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.firstName?.[0] || user.username?.[0] || '?';

  // Menu items
  const menuItems: MenuItem[] = [
    {
      path: `/profile/${user.username}`,
      icon: UserIcon,
      label: 'Profile',
      section: 'main'
    },
    {
      path: '/adventures',
      icon: MapPinIcon,
      label: 'My Adventures',
      section: 'main'
    },
    {
      path: '/settings',
      icon: CogIcon,
      label: 'Settings',
      section: 'secondary'
    }
  ];

  // Add admin item if user is staff
  const adminMenuItem: MenuItem | null = user.isStaff ? {
    path: '/admin',
    icon: ShieldCheckIcon,
    label: 'Admin Panel',
    section: 'secondary',
    textColor: 'text-yellow-600'
  } : null;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleMenuItemClick = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const handleLogout = () => {
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center justify-center w-10 h-10 rounded-full ring-2 ring-blue-200 hover:ring-blue-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {user.profilePic ? (
          <img 
            src={user.profilePic} 
            alt="Profile" 
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {initials.toUpperCase()}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
          <div className="p-4">
            {/* User Info Header */}
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-200">
              <div className="w-12 h-12 rounded-full ring-2 ring-blue-200 overflow-hidden">
                {user.profilePic ? (
                  <img 
                    src={user.profilePic} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {initials.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base text-gray-900 truncate">
                  Hello, {displayName}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  @{user.username}
                </p>
              </div>
            </div>

            {/* Main Menu Items */}
            <div className="space-y-1 mb-3">
              {menuItems.filter(item => item.section === 'main').map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleMenuItemClick(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Secondary Menu Items */}
            <div className="space-y-1 mb-3">
              {adminMenuItem && (
                <button
                  onClick={() => handleMenuItemClick(adminMenuItem.path)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <adminMenuItem.icon className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-600 font-medium">{adminMenuItem.label}</span>
                </button>
              )}

              {menuItems.filter(item => item.section === 'secondary').map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleMenuItemClick(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
