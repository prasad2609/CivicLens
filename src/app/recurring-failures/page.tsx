'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Repeat,
  DollarSign,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  Wrench,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { RecurringFailureCluster } from '@/types';
import { civicStore } from '@/lib/store';

export default function RecurringFailuresPage() {
  const [clusters, setClusters] = useState<RecurringFailureCluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecurring();
    const unsub = civicStore.subscribe(fetchRecurring);
    return unsub;
  }, []);

  const fetchRecurring = async () => {
    try {
      const res = await fetch('/api/analytics/recurring');
      if (res.ok) {
        const data = await res.json();
        setClusters(data.clusters || []);
      } else {
        setClusters(civicStore.getRecurringIssues());
      }
    } catch {
      setClusters(civicStore.getRecurringIssues());
    } finally {
      setLoading(false);
    }
  };

  const totalPatchSpend = clusters.reduce((sum, c) => sum + c.cumulative_repair_cost, 0);
  const totalPotentialSavings = clusters.reduce((sum, c) => sum + c.potential_savings, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-950 via-red-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <Repeat className="w-3.5 h-3.5" />
                Innovation 9 • Chronic Problem Detection
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Recurring Failure Intelligence
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Automatically identifies infrastructure that repeatedly breaks within 400m radius.
                Computes accumulated patch costs, provides civil engineering root-cause insights, flags contractor
                warranty breaches, and prescribes definitive capital replacements.
              </p>
            </div>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Active Repeat Clusters
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-600">{clusters.length}</span>
              <span className="text-xs text-slate-500">Chronic Hotspots</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Cumulative Patch Expenditure
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                ₹{(totalPatchSpend / 100000).toFixed(1)} Lakhs
              </span>
              <span className="text-xs text-rose-600 font-semibold">Endless Patching</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Projected Capital Rebuild Savings
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-600">
                ₹{(totalPotentialSavings / 100000).toFixed(1)} Lakhs
              </span>
              <span className="text-xs text-emerald-600 font-semibold">vs Piecemeal</span>
            </div>
          </div>
        </div>

        {/* Chronic Hotspots Clusters */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Detected Chronic Failure Hotspots
          </h2>

          <div className="space-y-6">
            {clusters.map((cluster) => (
              <div
                key={cluster.clusterKey}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-5"
              >
                {/* Cluster Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                        {cluster.categoryName}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {cluster.occurrenceCount} Reported Incidents in 400m
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mt-2 leading-snug">
                      {cluster.locationName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      First reported {new Date(cluster.firstReported).toLocaleDateString()} • Most recent{' '}
                      {new Date(cluster.latestReported).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-2xl font-black text-rose-600">
                      ₹{(cluster.cumulative_repair_cost / 100000).toFixed(1)}L
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Wasted in Patchwork
                    </span>
                  </div>
                </div>

                {/* Contractor Warranty Alert */}
                {cluster.contractor_warranty_breach && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                      <div>
                        <strong className="font-bold">Contractor Warranty Breach Flagged:</strong> Repeated failure
                        occurred within 180-day guarantee period by{' '}
                        <span className="font-semibold underline">{cluster.contractor_name}</span>.
                      </div>
                    </div>
                    <span className="font-extrabold text-[11px] bg-red-200/80 text-red-900 px-2 py-0.5 rounded">
                      Penalty Eligible
                    </span>
                  </div>
                )}

                {/* Civil Engineering Root Cause & Recommendation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Root Cause Diagnosis */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                    <strong className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                      🔬 Civil Engineering Root Cause Diagnosis:
                    </strong>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      "{cluster.root_cause_diagnosis}"
                    </p>
                  </div>

                  {/* Capital Replacement Recommendation */}
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5 text-emerald-950">
                    <strong className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Definitive Capital Replacement Prescription:
                    </strong>
                    <p className="leading-relaxed font-medium">
                      {cluster.replacement_recommendation}
                    </p>
                    <div className="pt-1 text-[11px] font-semibold text-emerald-800">
                      Capital Cost: ~₹{(cluster.replacement_cost_estimate / 100000).toFixed(1)}L • Net Savings:{' '}
                      <strong className="font-bold">₹{(cluster.potential_savings / 100000).toFixed(1)}L</strong>
                    </div>
                  </div>
                </div>

                {/* Linked Tickets & Civic DNA */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">
                      Includes tickets: {cluster.issues.map((i) => i.complaint_code).join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {cluster.related_asset_id && (
                      <Link
                        href="/civic-dna"
                        className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                      >
                        <span>View Asset DNA</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
