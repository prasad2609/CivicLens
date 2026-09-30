'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Bell,
  Globe,
  CheckCircle,
  Menu,
  X,
  MapPin,
  FileText,
  BarChart3,
  Building2,
  Bot,
  PlusCircle,
} from 'lucide-react';
import { civicStore } from '@/lib/store';
import { UserRole, AppNotification, UserProfile } from '@/types';
import { TRANSLATIONS } from '@/lib/translations';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<UserProfile>(civicStore.getCurrentUser());
  const [language, setLanguage] = useState<'en' | 'ta'>(civicStore.getLanguage());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      setCurrentUser(civicStore.getCurrentUser());
      setLanguage(civicStore.getLanguage());
      setNotifications(civicStore.getNotifications());
    };
    update();
    const unsub = civicStore.subscribe(update);
    return unsub;
  }, []);

  const t = TRANSLATIONS[language];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleRoleChange = (role: UserRole, deptId?: string) => {
    civicStore.switchRole(role, deptId);
  };

  const handleLanguageToggle = () => {
    const newLang = language === 'en' ? 'ta' : 'en';
    civicStore.setLanguage(newLang);
  };

  const handleMarkNotifRead = (id: string) => {
    civicStore.markNotificationAsRead(id);
  };

  const handleMarkAllRead = () => {
    civicStore.markAllNotificationsAsRead();
  };

  // Dynamic navigation based on role
  const getNavLinks = () => {
    const links = [
      { href: '/map', label: t.map, icon: MapPin },
      { href: '/issues', label: 'Issues Explorer', icon: FileText },
      { href: '/dashboard', label: t.dashboard, icon: BarChart3 },
      { href: '/projects', label: t.projects, icon: Building2 },
      { href: '/assistant', label: 'Civic Assistant', icon: Bot },
    ];

    if (currentUser.role === 'citizen') {
      links.splice(1, 0, { href: '/my-complaints', label: t.myComplaints, icon: FileText });
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Demo Role Switcher Top Bar (Highlighted for evaluation / presentation) */}
      <div className="bg-slate-900 text-white text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-600 font-bold uppercase tracking-wider text-[10px]">
            Demo Environment
          </span>
          <span className="hidden sm:inline text-slate-300">
            Active Role: <strong className="text-white capitalize">{(currentUser?.role || 'citizen').replace('_', ' ')}</strong> ({currentUser?.full_name || 'Citizen'})
          </span>
        </div>

        {/* Quick Role Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 mr-1 hidden md:inline">Switch Role:</span>
          <button
            onClick={() => handleRoleChange('citizen')}
            className={`px-2 py-0.5 rounded transition ${
              currentUser?.role === 'citizen'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Citizen
          </button>
          <button
            onClick={() => handleRoleChange('officer', 'dept-roads')}
            className={`px-2 py-0.5 rounded transition ${
              currentUser?.role === 'officer' && currentUser?.department_id === 'dept-roads'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Roads Officer
          </button>
          <button
            onClick={() => handleRoleChange('officer', 'dept-sanitation')}
            className={`px-2 py-0.5 rounded transition ${
              currentUser?.role === 'officer' && currentUser?.department_id === 'dept-sanitation'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Sanitation Officer
          </button>
          <button
            onClick={() => handleRoleChange('field_worker')}
            className={`px-2 py-0.5 rounded transition ${
              currentUser?.role === 'field_worker'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Field Worker
          </button>
          <button
            onClick={() => handleRoleChange('representative')}
            className={`px-2 py-0.5 rounded transition ${
              currentUser?.role === 'representative'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            MLA / Rep
          </button>
          <button
            onClick={() => handleRoleChange('admin')}
            className={`px-2 py-0.5 rounded transition ${
              currentUser?.role === 'admin'
                ? 'bg-purple-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 block leading-none">
                  CivicLens
                </span>
                <span className="text-[10px] tracking-wide text-slate-500 uppercase font-semibold">
                  Constituency Transparency
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-1.5 opacity-70" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-3">
            {/* Primary Action Button: Report Issue */}
            {currentUser?.role === 'citizen' && (
              <Link
                href="/report"
                className="hidden sm:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-md text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlusCircle className="w-4 h-4" />
                {t.reportIssueBtn}
              </Link>
            )}

            {/* Language Switcher */}
            <button
              onClick={handleLanguageToggle}
              title="Toggle English / Tamil"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
            </button>

            {/* In-app Notification Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full relative transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-900">
                      Notifications ({unreadCount} new)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        You&apos;re all caught up! No notifications.
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs transition ${
                            !notif.is_read ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-900">{notif.title}</p>
                            {!notif.is_read && (
                              <button
                                onClick={() => handleMarkNotifRead(notif.id)}
                                title="Mark read"
                                className="text-slate-400 hover:text-blue-600"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {notif.related_issue_id && (
                              <Link
                                href={`/issues/${notif.related_issue_id}`}
                                onClick={() => setShowNotifMenu(false)}
                                className="text-blue-600 hover:underline font-semibold"
                              >
                                View Record &rarr;
                              </Link>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill / Link */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition group"
                title="Account Settings & Profile"
              >
                <div className="w-8 h-8 rounded-full bg-blue-700 border border-blue-800 flex items-center justify-center text-white text-xs font-bold shadow-xs group-hover:ring-2 group-hover:ring-blue-400">
                  {currentUser.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="hidden md:block text-left text-xs leading-tight">
                  <span className="font-semibold text-slate-900 block truncate max-w-[120px] group-hover:text-blue-600">
                    {currentUser.full_name}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            </div>

            {/* Mobile Hamburger Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {currentUser.role === 'citizen' && (
            <Link
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-blue-600 text-white font-medium text-sm mb-2"
            >
              <PlusCircle className="w-4 h-4" />
              {t.reportIssueBtn}
            </Link>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 opacity-70" />
                {link.label}
              </Link>
            );
          })}

          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs px-2">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="font-medium text-slate-700 hover:text-blue-600"
            >
              My Profile
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="font-medium text-blue-600"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="font-medium text-blue-600"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
