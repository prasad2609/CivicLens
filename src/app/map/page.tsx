'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Filter,
  Layers,
  Search,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  Eye,
} from 'lucide-react';
import { civicStore } from '@/lib/store';
import { CivicIssue } from '@/types';
import { CivicMap } from '@/components/map/CivicMap';
import { StatusBadge, SeverityBadge, CategoryIcon } from '@/components/ui/Badge';

export default function PublicMapPage() {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [search, setSearch] = useState('');

  const categories = civicStore.getCategories();
  const jurisdictions = civicStore.getJurisdictions();

  useEffect(() => {
    const update = () => {
      const allIssues = civicStore.getIssues();
      setIssues(allIssues);
      if (allIssues.length > 0 && !selectedIssue) {
        setSelectedIssue(allIssues[0]);
      }
    };
    update();
    const unsub = civicStore.subscribe(update);
    return unsub;
  }, []);

  const filteredIssues = issues.filter((issue) => {
    if (categoryFilter !== 'all' && issue.category_id !== categoryFilter) return false;
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (wardFilter !== 'all' && issue.jurisdiction_id !== wardFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        issue.complaint_code.toLowerCase().includes(q) ||
        issue.title.toLowerCase().includes(q) ||
        issue.location_text.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-65px-32px)] flex flex-col overflow-hidden bg-slate-100">
      {/* Top Filter Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              Constituency Civic Map
            </h1>
            <span className="text-[10px] text-slate-500">
              Showing {filteredIssues.length} active pins across Chennai South
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1 px-2.5 border border-slate-300 rounded-md bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1 px-2.5 border border-slate-300 rounded-md bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="py-1 px-2.5 border border-slate-300 rounded-md bg-white text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none hidden sm:inline-block"
          >
            <option value="all">All Wards</option>
            {jurisdictions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>

          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Report Here
          </Link>
        </div>
      </div>

      {/* Map & Issue List Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side: Map View */}
        <div className="flex-1 h-full relative">
          <CivicMap
            issues={filteredIssues}
            selectedIssueId={selectedIssue?.id}
            onSelectIssue={(issue) => setSelectedIssue(issue)}
            className="h-full w-full"
          />

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md border border-slate-200 text-[11px] space-y-1.5 hidden sm:block">
            <span className="font-bold text-slate-700 block mb-1">Status Pin Legend:</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Resolved / Closed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span>In Progress / Reopened</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span>Critical / Escalated</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>Submitted / Assigned</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Issue Detail Drawer */}
        <div className="w-full md:w-96 bg-white border-l border-slate-200 flex flex-col h-72 md:h-full z-10 shadow-lg md:shadow-none overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Selected Civic Complaint
            </span>
            <span className="text-[10px] text-slate-500">Click any pin to inspect</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedIssue ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {selectedIssue.complaint_code}
                  </span>
                  <StatusBadge status={selectedIssue.status} />
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {selectedIssue.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedIssue.description}
                </p>

                {selectedIssue.evidence && selectedIssue.evidence.length > 0 && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 h-32">
                    <img
                      src={selectedIssue.evidence[0].file_path}
                      alt="Complaint proof"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ward:</span>
                    <span className="font-medium text-slate-800">{selectedIssue.jurisdiction_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-medium text-slate-800">{selectedIssue.department_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reported:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(selectedIssue.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Severity:</span>
                    <SeverityBadge severity={selectedIssue.severity} />
                  </div>
                </div>

                <Link
                  href={`/issues/${selectedIssue.id}`}
                  className="block w-full text-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition"
                >
                  View Full Timeline & Evidence &rarr;
                </Link>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Select a marker on the map to inspect details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
