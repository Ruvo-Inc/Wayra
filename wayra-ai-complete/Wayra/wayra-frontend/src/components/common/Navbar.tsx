import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  MapPinIcon,
  QueueListIcon,
  GlobeAltIcon,
  MapIcon,
  CalendarIcon,
  UsersIcon,
  EllipsisHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Avatar } from './Avatar';
import { User } from '../../types/adventure';

interface NavbarProps {
  user?: User | null;
  onLogout?: () => void;
}

interface NavigationItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const themes = [
  { name: 'light', label: 'Light' },
  { name: 'dark', label: 'Dark' },
  { name: 'cupcake', label: 'Cupcake' },
  { name: 'bumblebee', label: 'Bumblebee' },
  { name: 'emerald', label: 'Emerald' },
  { name: 'corporate', label: 'Corporate' },
  { name: 'synthwave', label: 'Synthwave' },
  { name: 'retro', label: 'Retro' },
  { name: 'cyberpunk', label: 'Cyberpunk' },
  { name: 'valentine', label: 'Valentine' },
  { name: 'halloween', label: 'Halloween' },
  { name: 'garden', label: 'Garden' },
  { name: 'forest', label: 'Forest' },
  { name: 'aqua', label: 'Aqua' },
  { name: 'lofi', label: 'Lo-Fi' },
  { name: 'pastel', label: 'Pastel' },
  { name: 'fantasy', label: 'Fantasy' },
  { name: 'wireframe', label: 'Wireframe' },
  { name: 'black', label: 'Black' },
  { name: 'luxury', label: 'Luxury' },
  { name: 'dracula', label: 'Dracula' },
  { name: 'cmyk', label: 'CMYK' },
  { name: 'autumn', label: 'Autumn' },
  { name: 'business', label: 'Business' },
  { name: 'acid', label: 'Acid' },
  { name: 'lemonade', label: 'Lemonade' },
  { name: 'night', label: 'Night' },
  { name: 'coffee', label: 'Coffee' },
  { name: 'winter', label: 'Winter' }
];

const languages = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  nl: 'Nederlands',
  sv: 'Svenska',
  zh: '中文',
  pl: 'Polski',
  ko: '한국어',
  no: 'Norsk',
  ru: 'Русский'
};

export const Navbar: React.FC<NavbarProps> = ({ user = null, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [currentLocale, setCurrentLocale] = useState('en');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const navigationItems: NavigationItem[] = [
    { path: '/adventures', icon: MapPinIcon, label: 'Adventures' },
    { path: '/collections', icon: QueueListIcon, label: 'Collections' },
    { path: '/worldtravel', icon: GlobeAltIcon, label: 'World Travel' },
    { path: '/map', icon: MapIcon, label: 'Map' },
    { path: '/calendar', icon: CalendarIcon, label: 'Calendar' },
    { path: '/users', icon: UsersIcon, label: 'Users' }
  ];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize theme from localStorage or document
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (router.pathname === '/search') {
        router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  // Handle theme change
  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  // Handle language change
  const handleLanguageChange = (locale: string) => {
    setCurrentLocale(locale);
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    window.location.reload();
  };

  // Handle logout
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsMobileMenuOpen(false);
    setIsSettingsOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Mobile menu + Logo */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center gap-3 p-2 text-2xl font-bold tracking-tight text-gray-900 hover:text-blue-600 transition-colors"
            >
              <img src="/favicon.png" alt="AdventureLog" className="w-8 h-8" />
              <span className="hidden sm:inline">AdventureLog</span>
            </button>
          </div>

          {/* Center - Desktop Navigation */}
          {user && (
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    router.pathname === item.path
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Right side - Search + User + Settings */}
          <div className="flex items-center gap-3">
            {/* Desktop Search */}
            {user && (
              <form onSubmit={handleSearch} className="hidden lg:flex items-center">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-64 focus:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 rounded">
                    /
                  </kbd>
                </div>
              </form>
            )}

            {/* Auth Buttons (Desktop) */}
            {!user && (
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => handleNavigation('/login')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation('/signup')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* User Avatar */}
            {user && <Avatar user={user} onLogout={handleLogout} />}

            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
              </button>

              {/* Settings Dropdown Menu */}
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
                  <div className="p-4 space-y-4">
                    {/* Quick Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() => window.open('https://adventurelog.app', '_blank')}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Documentation
                      </button>
                      <button
                        onClick={() => window.open('https://discord.gg/wRbQ9Egr8C', '_blank')}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Discord
                      </button>
                      <button
                        onClick={() => window.open('https://seanmorley.com/sponsor', '_blank')}
                        className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Support 💖
                      </button>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      {/* Language Selection */}
                      <div className="mb-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                          <GlobeAltIcon className="w-4 h-4" />
                          Language
                        </h3>
                        <select
                          value={currentLocale}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Object.entries(languages).map(([code, name]) => (
                            <option key={code} value={code}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Theme Selection */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Theme</h3>
                        <select
                          value={currentTheme}
                          onChange={(e) => handleThemeChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {themes.map((theme) => (
                            <option key={theme.name} value={theme.name}>
                              {theme.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-4">
            {user ? (
              <>
                {/* Navigation Items */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Navigation
                  </h3>
                  {navigationItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                        router.pathname === item.path
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Mobile Search */}
                <div className="pt-4 border-t border-gray-200">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <MagnifyingGlassIcon className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* Auth Buttons */
              <div className="space-y-2">
                <button
                  onClick={() => handleNavigation('/login')}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNavigation('/signup')}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(isMobileMenuOpen || isSettingsOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsSettingsOpen(false);
          }}
        />
      )}
    </nav>
  );
};
