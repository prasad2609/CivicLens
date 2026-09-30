'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.resetPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Could not send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              CivicLens
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">Reset Account Password</h2>
          <p className="text-xs text-slate-500">
            Enter your registered email to receive authentication recovery instructions.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          {submitted ? (
            <div className="text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Recovery Instructions Dispatched</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                We have generated a secure password reset token for <strong className="text-slate-900">{email}</strong>.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@civiclens.gov"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
              >
                {loading ? 'Sending Instructions...' : 'Send Password Reset Link'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                <Link href="/login" className="text-blue-600 font-medium hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Cancel and Return to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
