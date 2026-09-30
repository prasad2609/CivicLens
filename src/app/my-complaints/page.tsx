'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  PlusCircle,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  MapPin,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { civicStore } from '@/lib/store';
import { CivicIssue, IssueStatus, UserProfile } from '@/types';
import { StatusBadge, SeverityBadge, CategoryIcon } from '@/components/ui/Badge';

export default function MyComplaintsPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(civicStore.getCurrentUser());
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = civicStore.getCategories();

  useEffect(() => {
    const update = () => {
      const user = civicStore.getCurrentUser();
      setCurrentUser(user);
      // For testing/demo convenience: If current user is citizen Dinesh, show citizen complaints;
      // or if user switched role, get complaints for current user id
      const citizenIssues = civicStore.getIssues({ citizenId: user.id });
      setIssues(citizenIssues);
    };

    update();
    const unsub = civicStore.subscribe(update);
    return unsub;
  }, []);

  // Filtered issues
  const filteredIssues = issues.filter((issue) => {
    // Status filter
    if (activeFilter === 'active') {
      if (['resolved', 'closed'].includes(issue.status)) return false;
    } else if (activeFilter === 'resolved') {
      if (issue.status !== 'resolved' && issue.status !== 'closed') return false;
    } else if (activeFilter === 'reopened') {
      if (issue.status !== 'reopened') return false;
    } else if (activeFilter === 'escalated') {
      if (issue.status !== 'escalated') return false;
    } else if (activeFilter === 'verification_pending') {
      if (issue.status !== 'resolved') return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && issue.category_id !== categoryFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        issue.complaint_code.toLowerCase().includes(q) ||
        issue.title.toLowerCase().includes(q) ||
        issue.location_text.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const totalCount = issues.length;
  const activeCount = issues.filter((i) => !['resolved', 'closed'].includes(i.status)).length;
  const resolvedCount = issues.filter((i) => ['resolved', 'closed'].includes(i.status)).length;
  const verificationPendingCount = issues.filter((i) => i.status === 'resolved').length;
  const reopenedCount = issues.filter((i) => i.status === 'reopened').length;
  const escalatedCount = issues.filter((i) => i.status === 'escalated').length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Title & Quick Report CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              My Civic Complaints
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Logged in as <strong className="text-slate-800">{currentUser.full_name}</strong>. Track status, review updates, and verify resolutions.
            </p>
          </div>

          <Link
            href="/report"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" /> Report New Civic Issue
          </Link>
        </div>

        {/* Action Alert Banner for Verification Pending */}
        {verificationPendingCount > 0 && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-950">
                <span className="font-bold">
                  {verificationPendingCount} Complaint(s) Awaiting Your Verification
                </span>
                <p className="text-emerald-800 mt-0.5">
                  The municipal department completed work. Inspect and confirm resolution to officially close.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveFilter('verification_pending')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shrink-0 transition"
            >
              Filter Verification Pending
            </button>
          </div>
        )}

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => setActiveFilter('all')}
            className={`p-3.5 rounded-xl border text-left transition ${
              activeFilter === 'all'
                ? 'bg-blue-50 border-blue-400 shadow-xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-500 block">Total Reported</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{totalCount}</span>
          </button>

          <button
            onClick={() => setActiveFilter('active')}
            className={`p-3.5 rounded-xl border text-left transition ${
              activeFilter === 'active'
                ? 'bg-blue-50 border-blue-400 shadow-xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-amber-600 block">In Progress / Active</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{activeCount}</span>
          </button>

          <button
            onClick={() => setActiveFilter('resolved')}
            className={`p-3.5 rounded-xl border text-left transition ${
              activeFilter === 'resolved'
                ? 'bg-emerald-50 border-emerald-400 shadow-xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-emerald-600 block">Resolved / Closed</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{resolvedCount}</span>
          </button>

          <button
            onClick={() => setActiveFilter('reopened')}
            className={`p-3.5 rounded-xl border text-left transition ${
              activeFilter === 'reopened'
                ? 'bg-rose-50 border-rose-400 shadow-xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-rose-600 block">Reopened</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{reopenedCount}</span>
          </button>

          <button
            onClick={() => setActiveFilter('escalated')}
            className={`p-3.5 rounded-xl border text-left transition ${
              activeFilter === 'escalated'
                ? 'bg-red-50 border-red-400 shadow-xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-semibold text-red-600 block">Escalated</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{escalatedCount}</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID (e.g. CL-2026-000101) or title..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-auto"
            >
              <option value="all">All Issue Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Complaints List / Empty State */}
        {filteredIssues.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <h3 className="font-bold text-base text-slate-900">No Complaints Match Your Filter</h3>
              <p className="text-xs text-slate-500 mt-1">
                You haven&apos;t reported any civic complaints under this category or status.
              </p>
            </div>
            <Link
              href="/report"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
            >
              <PlusCircle className="w-4 h-4" /> Report an Issue
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIssues.map((issue) => {
              const isResolvedAwaiting = issue.status === 'resolved';

              return (
                <div
                  key={issue.id}
                  className={`bg-white rounded-xl border transition p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:border-blue-300 hover:shadow-sm ${
                    isResolvedAwaiting
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-700 shrink-0 mt-0.5">
                      <CategoryIcon code={issue.category_code} className="w-6 h-6" />
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {issue.complaint_code}
                        </span>
                        <StatusBadge status={issue.status} />
                        <SeverityBadge severity={issue.severity} />
                        {issue.is_overdue && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded">
                            Overdue
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {issue.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2">
                        {issue.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {issue.location_text}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Reported: {new Date(issue.created_at).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="text-slate-600 font-medium">
                          Dept: {issue.department_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {isResolvedAwaiting ? (
                      <Link
                        href={`/issues/${issue.id}`}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition inline-flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-4 h-4" /> Verify Resolution
                      </Link>
                    ) : (
                      <Link
                        href={`/issues/${issue.id}`}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
                      >
                        Track Timeline &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
