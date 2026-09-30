'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  Shield,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { civicStore } from '@/lib/store';
import { api } from '@/lib/api';
import { UserProfile } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile>(civicStore.getCurrentUser());
  const jurisdictions = civicStore.getJurisdictions();

  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone || '');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'ta'>(user.preferred_language);
  const [area, setArea] = useState(user.area || 'Ward 175 - Velachery');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const u = civicStore.getCurrentUser();
      setUser(u);
      setFullName(u.full_name);
      setPhone(u.phone || '');
      setPreferredLanguage(u.preferred_language);
      setArea(u.area || 'Ward 175 - Velachery');
    };
    update();
    const unsub = civicStore.subscribe(update);
    return unsub;
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const updatedUser: UserProfile = {
        ...user,
        full_name: fullName,
        phone,
        preferred_language: preferredLanguage,
        area,
      };

      civicStore.setCurrentUser(updatedUser);
      civicStore.setLanguage(preferredLanguage);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    civicStore.switchRole('citizen');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              User Profile & Account Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your identity, civic notifications, and constituency ward jurisdiction.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        {/* User Identity Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {(user?.full_name || 'User')
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'U'}
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">{user?.full_name || 'Citizen User'}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded capitalize">
                  {(user?.role || 'citizen').replace('_', ' ')}
                </span>
                {user?.department_name && (
                  <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {user.department_name}
                  </span>
                )}
                <span className="text-slate-400 font-mono text-[11px]">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Edit Personal & Municipal Information
          </h3>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Your profile preferences have been successfully updated.</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Immutable)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98401 23456"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Interface Language
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as 'en' | 'ta')}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="en">English</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Constituency Ward / Residence Area
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {jurisdictions.map((j) => (
                      <option key={j.id} value={j.name}>
                        {j.name} ({j.zone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Change Password (Leave blank to keep current)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
