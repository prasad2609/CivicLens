'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, MapPin } from 'lucide-react';
import { civicStore } from '@/lib/store';
import { CivicIssue, PublicProject } from '@/types';
import { CivicMap } from '@/components/map/CivicMap';

export default function HomePage() {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [projects, setProjects] = useState<PublicProject[]>([]);

  useEffect(() => {
    const update = () => {
      setIssues(civicStore.getIssues());
      setProjects(civicStore.getProjects());
    };
    update();
    const unsub = civicStore.subscribe(update);
    return unsub;
  }, []);

  const metrics = civicStore.getConstituencyMetrics();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span>Constituency Accountability & Transparency Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none text-balance">
            See the Issue. Track the Action.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400">
              Verify the Resolution.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            CivicLens connects citizens, municipal engineering authorities, and public oversight. Report civic problems, track ground repairs by field technicians in real time, and verify work before closure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/report"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition duration-150"
            >
              Report a Civic Issue <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/map"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition"
            >
              <MapPin className="w-4 h-4 text-blue-400" /> Explore Public Map
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition"
            >
              Constituency Analytics
            </Link>
          </div>

          {/* Quick Real-Time Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto pt-10">
            <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-4 text-left">
              <span className="text-xs text-slate-400 block font-medium">Total Registered</span>
              <span className="text-2xl sm:text-3xl font-bold text-white mt-1 block">
                {metrics.total}
              </span>
              <span className="text-[10px] text-slate-400">Complaints logged</span>
            </div>

            <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-4 text-left">
              <span className="text-xs text-emerald-400 block font-medium">Verified Resolution</span>
              <span className="text-2xl sm:text-3xl font-bold text-white mt-1 block">
                {metrics.resolutionRate}%
              </span>
              <span className="text-[10px] text-slate-400">{metrics.resolved} cases completed</span>
            </div>

            <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-4 text-left">
              <span className="text-xs text-amber-400 block font-medium">Avg Response Time</span>
              <span className="text-2xl sm:text-3xl font-bold text-white mt-1 block">
                {metrics.avgResolutionDays}d
              </span>
              <span className="text-[10px] text-slate-400">Recorded SLA turnaround</span>
            </div>

            <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-4 text-left">
              <span className="text-xs text-rose-400 block font-medium">Citizen Reopened</span>
              <span className="text-2xl sm:text-3xl font-bold text-white mt-1 block">
                {metrics.reopened}
              </span>
              <span className="text-[10px] text-slate-400">Accountability rejects</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW CIVICLENS WORKS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Accountability Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How CivicLens Connects the Complete Journey
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Not a disconnected set of forms. CivicLens provides an end-to-end relational audit trail from report to citizen verification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-base text-slate-900">Report & Locate</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Capture photo evidence, select severity, and pin the precise spot on OpenStreetMap with instant duplicate checking.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-base text-slate-900">Smart Authority Route</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Category + Ward rules deterministically route complaints to Roads, Drainage, Sanitation, or Electrical divisions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-base text-slate-900">Field Dispatch & Work</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Officers dispatch field technicians who inspect ground reality, submit progress notes, and upload photo proof.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="font-bold text-base text-slate-900">Citizen Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complaints are never silently closed. Citizens inspect and verify &ldquo;Completely Resolved&rdquo; or reopen with a rebuttal photo.
            </p>
          </div>
        </div>
      </section>

      {/* INTERACTIVE MAP PREVIEW */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-800">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">
                Public OpenStreetMap Layer
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Live Constituency Issue Map
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Explore active complaints color-coded by status across Chennai South. Citizen personal identities remain strictly anonymized.
              </p>
            </div>

            <Link
              href="/map"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition self-start sm:self-auto shrink-0"
            >
              Open Fullscreen Interactive Map &rarr;
            </Link>
          </div>

          <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <CivicMap issues={issues} zoom={13} className="h-full w-full" />
          </div>
        </div>
      </section>

      {/* PUBLIC PROJECT TRANSPARENCY PREVIEW */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
              Public Accountability
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Constituency Infrastructure Projects
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Monitor major development projects, recorded financial expenditures, and ground timelines.
            </p>
          </div>

          <Link
            href="/projects"
            className="text-xs text-blue-600 hover:underline font-bold inline-flex items-center gap-1 self-start sm:self-auto"
          >
            View All Projects &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.slice(0, 3).map((proj) => {
            const percent = Math.min(100, Math.round((proj.expenditure / proj.approved_amount) * 100));

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {proj.category}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Demo Data
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2">
                    {proj.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Disbursed: ₹{(proj.expenditure / 100000).toFixed(1)}L</span>
                    <span className="font-bold text-slate-900">{percent}%</span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <Link
                    href={`/projects/${proj.id}`}
                    className="block text-center text-xs font-semibold text-blue-600 hover:underline pt-1"
                  >
                    View Project Breakdown &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* WHY CIVICLENS CTA SECTION */}
      <section className="bg-blue-50 border-t border-blue-200 py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Empowering Citizen-Driven Civic Governance
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            CivicLens prevents complaints from disappearing into administrative voids. Experience transparent civic accountability today.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/report"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Report a Civic Issue Now
            </Link>
            <Link
              href="/assistant"
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs rounded-xl shadow-xs transition"
            >
              Ask AI Civic Assistant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
