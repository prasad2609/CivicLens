'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Building2,
  FileText,
  PlusCircle,
  Eye,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { civicStore } from '@/lib/store';
import { CivicIssue, UserProfile } from '@/types';
import { StatusBadge, SeverityBadge, CategoryIcon } from '@/components/ui/Badge';

export default function IssuesExplorerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile>(civicStore.getCurrentUser());
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const categories = civicStore.getCategories();
  const jurisdictions = civicStore.getJurisdictions();

  useEffect(() => {
    const update = () => {
      setCurrentUser(civicStore.getCurrentUser());
      setIssues(civicStore.getIssues());
    };
    update();
    const unsub = civicStore.subscribe(update);
    return unsub;
  }, []);

  const filtered = issues.filter((issue) => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && issue.category_id !== categoryFilter) return false;
    if (wardFilter !== 'all' && issue.jurisdiction_id !== wardFilter) return false;
    if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        issue.complaint_code.toLowerCase().includes(q) ||
        issue.title.toLowerCase().includes(q) ||
        issue.location_text.toLowerCase().includes(q) ||
        (issue.department_name && issue.department_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Civic Issues Explorer
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Public transparency ledger of civic complaints, authority assignments, and resolution lifecycles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
            >
              <MapPin className="w-4 h-4 text-blue-600" /> View on Map
            </Link>
            <Link
              href="/report"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" /> Report an Issue
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID, keyword, road name, or authority..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-2 px-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="reopened">Reopened</option>
                <option value="escalated">Escalated</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs py-2 px-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="text-xs py-2 px-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Wards</option>
                {jurisdictions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-xs py-2 px-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
            <span>
              Showing <strong>{filtered.length}</strong> of {issues.length} registered civic issues
            </span>
            {(statusFilter !== 'all' ||
              categoryFilter !== 'all' ||
              wardFilter !== 'all' ||
              severityFilter !== 'all' ||
              searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setWardFilter('all');
                  setSeverityFilter('all');
                  setSearchQuery('');
                }}
                className="text-blue-600 hover:underline font-medium"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Complaints Table (Clean Civic-Tech Grid) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Issue Title & Location</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Authority Dept</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No complaints match the specified search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((issue) => (
                    <tr
                      key={issue.id}
                      className="hover:bg-blue-50/30 transition group cursor-pointer"
                      onClick={() => router.push(`/issues/${issue.id}`)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{issue.complaint_code}</span>
                          {issue.ai_verification_status === 'flagged_ai' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.5 rounded" title="AI Flagged Evidence">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                              AI
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-semibold text-slate-900 block truncate">
                          {issue.title}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                          {issue.location_text}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <CategoryIcon code={issue.category_code} className="w-3.5 h-3.5 text-slate-500" />
                          {issue.category_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <SeverityBadge severity={issue.severity} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {issue.department_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(issue.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/issues/${issue.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
