'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Scale,
  Layers,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { DepartmentScorecard, AuthorityIndexResponse } from '@/types';
import { civicStore } from '@/lib/store';

export default function AuthorityIndexPage() {
  const [data, setData] = useState<AuthorityIndexResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIndex();
    const unsub = civicStore.subscribe(fetchIndex);
    return unsub;
  }, []);

  const fetchIndex = async () => {
    try {
      const res = await fetch('/api/analytics/authority-index');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(civicStore.getAuthorityPerformanceIndex());
      }
    } catch {
      setData(civicStore.getAuthorityPerformanceIndex());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <Scale className="w-3.5 h-3.5" />
                Innovation 7 • Objective Department Index
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Evidence-Based Authority Performance Index (EBAPI)
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Objective, transparent evaluation of municipal departments based strictly on verifiable civic data:
                SLA compliance, average turnaround, citizen verification rate, repair durability, and reopening penalties.
              </p>
            </div>

            <button
              onClick={fetchIndex}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition backdrop-blur-sm self-start md:self-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Recalculate Index
            </button>
          </div>
        </div>

        {/* Formula Transparency Explainer Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              Transparent Scoring Formula & Weight Distribution
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Zero Subjective Voting
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white text-xs font-mono leading-relaxed">
            <code>
              Composite Index = [SLA Score (30%)] + [Speed Score (20%)] + [Citizen Trust Score (25%)] +
              [Durability Score (25%)] - [Reopening & Repeat Failure Penalties]
            </code>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <strong className="text-slate-900 block font-bold">1. SLA Compliance (30%)</strong>
              Resolutions delivered within sanctioned municipal citizen charter timeframe.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <strong className="text-slate-900 block font-bold">2. Response Speed (20%)</strong>
              Mean duration from initial ticket dispatch to field rectification.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <strong className="text-slate-900 block font-bold">3. Citizen Trust (25%)</strong>
              % of tickets accepted by reporting citizens without dispute.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <strong className="text-slate-900 block font-bold">4. Durability & Penalty</strong>
              30-day wear audit longevity minus penalties for reopened or repeated tickets.
            </div>
          </div>
        </div>

        {/* Department Scorecards Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Authority Performance Leaderboard
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data?.scorecards.map((sc) => {
              const statusColor =
                sc.performance_status === 'Exemplary'
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : sc.performance_status === 'Satisfactory'
                  ? 'text-blue-700 bg-blue-50 border-blue-200'
                  : sc.performance_status === 'Needs Improvement'
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200';

              return (
                <div
                  key={sc.department_id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-5"
                >
                  {/* Department Header & Rank */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                          sc.rank === 1
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                            : sc.rank === 2
                            ? 'bg-slate-500 text-white'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        #{sc.rank}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug">
                          {sc.department_name}
                        </h3>
                        <span className="font-mono text-[11px] text-slate-400 font-semibold">
                          {sc.department_code} • {sc.total_assigned} Total Tickets
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-3xl font-black text-slate-900">{sc.composite_index}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                        {sc.performance_status}
                      </span>
                    </div>
                  </div>

                  {/* Component Breakdown Pills */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">SLA</span>
                      <span className="font-extrabold text-slate-900">{sc.sla_compliance_pct}%</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Days</span>
                      <span className="font-extrabold text-slate-900">{sc.avg_resolution_days}d</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Verified</span>
                      <span className="font-extrabold text-slate-900">{sc.verified_resolution_pct}%</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Reopening</span>
                      <span className="font-extrabold text-rose-600">{sc.reopening_rate_pct}%</span>
                    </div>
                  </div>

                  {/* Weight Contribution Bar */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500 font-semibold text-[11px]">
                      <span>Weight Score Composition:</span>
                      <span className="font-mono text-slate-800">
                        {sc.weights_breakdown.sla_score} + {sc.weights_breakdown.speed_score} +{' '}
                        {sc.weights_breakdown.citizen_trust_score} + {sc.weights_breakdown.durability_score} -{' '}
                        {sc.weights_breakdown.reopening_penalty}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                      <div
                        className="bg-blue-600 h-full"
                        style={{ width: `${(sc.weights_breakdown.sla_score / 30) * 30}%` }}
                        title="SLA Score"
                      />
                      <div
                        className="bg-indigo-500 h-full"
                        style={{ width: `${(sc.weights_breakdown.speed_score / 20) * 20}%` }}
                        title="Speed Score"
                      />
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${(sc.weights_breakdown.citizen_trust_score / 25) * 25}%` }}
                        title="Citizen Trust"
                      />
                      <div
                        className="bg-teal-500 h-full"
                        style={{ width: `${(sc.weights_breakdown.durability_score / 25) * 25}%` }}
                        title="Durability"
                      />
                    </div>
                  </div>

                  {/* Actionable Recommendations */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                      Targeted Actionable Directives:
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-slate-600">
                      {sc.actionable_recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
