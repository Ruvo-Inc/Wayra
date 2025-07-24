'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HomeIcon,
  MapPinIcon,
  FolderIcon,
  ChartBarIcon,
  GlobeAltIcon,
  PlusIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid,
  MapPinIcon as MapPinIconSolid,
  FolderIcon as FolderIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  GlobeAltIcon as GlobeAltIconSolid,
  PaperAirplaneIcon as PaperAirplaneIconSolid
} from '@heroicons/react/24/solid';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    description: 'Overview and quick actions'
  },
  {
    name: 'Adventures',
    href: '/adventures',
    icon: MapPinIcon,
    iconSolid: MapPinIconSolid,
    description: 'Manage your travel experiences'
  },
  {
    name: 'Collections',
    href: '/collections',
    icon: FolderIcon,
    iconSolid: FolderIconSolid,
    description: 'Organize adventures into collections'
  },
  {
    name: 'Travel Search',
    href: '/travel',
    icon: PaperAirplaneIcon,
    iconSolid: PaperAirplaneIconSolid,
    description: 'Search flights and hotels'
  },
  {
    name: 'Statistics',
    href: '/stats',
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
    description: 'View your travel analytics'
  },
  {
    name: 'Geography',
    href: '/geography',
    icon: GlobeAltIcon,
    iconSolid: GlobeAltIconSolid,
    description: 'Explore your travel footprint'
  }
];

const quickActions = [
  {
    name: 'New Adventure',
    href: '/adventures?create=true',
    icon: PlusIcon,
    color: 'bg-blue-600 hover:bg-blue-700'
  },
  {
    name: 'New Collection',
    href: '/collections?create=true',
    icon: PlusIcon,
    color: 'bg-green-600 hover:bg-green-700'
  }
];

export const Navigation: React.FC = () => {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  if (!user) {
    return null; // Don't show navigation if user is not authenticated
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <Link href="/" className="flex items-center">
              <GlobeAltIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Wayra</span>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = isActive(item.href) ? item.iconSolid : item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        isActive(item.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <div>
                      <div>{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Quick Actions */}
            <div className="px-2 mt-6">
              <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Actions
              </h3>
              <div className="mt-2 space-y-1">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white transition-colors ${action.color}`}
                  >
                    <action.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                    {action.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* User Menu */}
            <div className="px-2 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center px-2 py-2">
                <div className="flex-shrink-0">
                  {user.photoURL ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.photoURL}
                      alt={user.displayName || user.email || 'User'}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user.displayName || user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>
              
              <div className="mt-2 space-y-1">
                <Link
                  href="/settings"
                  className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                >
                  <Cog6ToothIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="group flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                >
                  <ArrowRightOnRectangleIcon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile menu button */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <GlobeAltIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Wayra</span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
              
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 px-2 space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = isActive(item.href) ? item.iconSolid : item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                          isActive(item.href)
                            ? 'bg-blue-100 text-blue-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon
                          className={`mr-4 flex-shrink-0 h-6 w-6 ${
                            isActive(item.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                {/* Mobile Quick Actions */}
                <div className="px-2 mt-6">
                  <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Quick Actions
                  </h3>
                  <div className="mt-2 space-y-1">
                    {quickActions.map((action) => (
                      <Link
                        key={action.name}
                        href={action.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md text-white transition-colors ${action.color}`}
                      >
                        <action.icon className="mr-4 flex-shrink-0 h-6 w-6" />
                        {action.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile User Menu */}
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {user.photoURL ? (
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.photoURL}
                        alt={user.displayName || user.email || 'User'}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-800">
                      {user.displayName || user.email}
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
