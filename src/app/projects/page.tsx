'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Search, Filter } from 'lucide-react';
import { civicStore } from '@/lib/store';
import { PublicProject, ProjectStatus } from '@/types';

export default function PublicProjectsPage() {
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const update = () => {
      setProjects(civicStore.getProjects());
    };
    update();
    const unsub = civicStore.subscribe(update);
    return unsub;
  }, []);

  const filtered = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.agency.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Completed</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">In Progress</span>;
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">Approved</span>;
      case 'delayed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Delayed</span>;
      case 'on_hold':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">On Hold</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">Proposed</span>;
    }
  };

  const totalSanctioned = projects.reduce((acc, p) => acc + p.approved_amount, 0);
  const totalExpenditure = projects.reduce((acc, p) => acc + p.expenditure, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner with Academic / Demo Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                Sample / Demonstration Data
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Constituency Public Projects Transparency
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Public disclosure of municipal infrastructure works, approved expenditure, funding schemes, and ground status.
            </p>
          </div>
        </div>

        {/* Aggregated Budget Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold block">Total Monitored Projects</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{projects.length} Works</span>
            <span className="text-[11px] text-slate-400">Under municipal jurisdiction</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-blue-600 font-semibold block">Sanctioned Outlay</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              ₹{(totalSanctioned / 10000000).toFixed(2)} Cr
            </span>
            <span className="text-[11px] text-slate-400">Total approved funding</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-emerald-600 font-semibold block">Recorded Utilization</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              ₹{(totalExpenditure / 10000000).toFixed(2)} Cr ({Math.round((totalExpenditure / totalSanctioned) * 100)}%)
            </span>
            <span className="text-[11px] text-slate-400">Verified progress disbursements</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project name, agency, or ward..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-auto"
            >
              <option value="all">All Project Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
              <option value="delayed">Delayed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </div>

        {/* Projects Cards List */}
        <div className="space-y-4">
          {filtered.map((proj) => {
            const percent = Math.min(100, Math.round((proj.expenditure / proj.approved_amount) * 100));

            return (
              <div
                key={proj.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 hover:shadow-sm transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {proj.category}
                      </span>
                      {getStatusBadge(proj.status)}
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Demo Data
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {proj.name}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {proj.location}
                      </span>
                      <span>•</span>
                      <span>Agency: <strong className="text-slate-700">{proj.agency}</strong></span>
                      <span>•</span>
                      <span>Fund: <strong className="text-slate-700">{proj.funding_source}</strong></span>
                    </div>
                  </div>

                  <Link
                    href={`/projects/${proj.id}`}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition shrink-0 self-start"
                  >
                    View Details &rarr;
                  </Link>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {proj.description}
                </p>

                {/* Financial Progress Bar */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">
                      Disbursed: <strong className="text-slate-900">₹{(proj.expenditure / 100000).toFixed(2)} Lakh</strong>
                    </span>
                    <span className="text-slate-500">
                      Sanctioned: <strong className="text-slate-900">₹{(proj.approved_amount / 100000).toFixed(2)} Lakh</strong>
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percent >= 100
                          ? 'bg-emerald-500'
                          : percent > 60
                          ? 'bg-blue-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>Target Finish: {new Date(proj.expected_completion).toLocaleDateString()}</span>
                    <span>{percent}% Budget Disbursed</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
