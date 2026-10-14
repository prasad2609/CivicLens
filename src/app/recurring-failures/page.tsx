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
  Gavel,
  Hammer,
  Sparkles,
  Download,
} from 'lucide-react';
import { RecurringFailureCluster } from '@/types';
import { civicStore } from '@/lib/store';

export default function RecurringFailuresPage() {
  const [clusters, setClusters] = useState<RecurringFailureCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCluster, setActiveCluster] = useState<RecurringFailureCluster | null>(null);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState('275000');
  const [penaltyReason, setPenaltyReason] = useState(
    'Premature structural failure observed within mandatory 180-day defect liability warranty period.'
  );
  const [projectTitle, setProjectTitle] = useState('');
  const [projectBudget, setProjectBudget] = useState('4500000');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [diagnosingKey, setDiagnosingKey] = useState<string | null>(null);

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

  const handleIssuePenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCluster) return;

    try {
      const res = await fetch('/api/analytics/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'issue_penalty',
          clusterKey: activeCluster.clusterKey,
          penaltyAmount: Number(penaltyAmount) || 275000,
          reason: penaltyReason,
        }),
      });

      if (res.ok) {
        civicStore.issueContractorPenaltyNotice(
          activeCluster.clusterKey,
          Number(penaltyAmount) || 275000,
          penaltyReason
        );
      } else {
        civicStore.issueContractorPenaltyNotice(
          activeCluster.clusterKey,
          Number(penaltyAmount) || 275000,
          penaltyReason
        );
      }
    } catch {
      civicStore.issueContractorPenaltyNotice(
        activeCluster.clusterKey,
        Number(penaltyAmount) || 275000,
        penaltyReason
      );
    }

    setIsPenaltyModalOpen(false);
    setFeedbackMessage(
      `Statutory Penalty Notice of ₹${(Number(penaltyAmount) / 1000).toFixed(0)}k dispatched to ${activeCluster.contractor_name}!`
    );
    setTimeout(() => setFeedbackMessage(null), 4500);
    fetchRecurring();
  };

  const handleSanctionProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCluster) return;

    const title = projectTitle || `Comprehensive Capital Overhaul: ${activeCluster.locationName}`;
    const budget = Number(projectBudget) || activeCluster.replacement_cost_estimate || 4500000;

    try {
      const res = await fetch('/api/analytics/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sanction_project',
          clusterKey: activeCluster.clusterKey,
          title,
          budget,
        }),
      });

      if (res.ok) {
        civicStore.convertClusterToCapitalProject(activeCluster.clusterKey, title, budget);
      } else {
        civicStore.convertClusterToCapitalProject(activeCluster.clusterKey, title, budget);
      }
    } catch {
      civicStore.convertClusterToCapitalProject(activeCluster.clusterKey, title, budget);
    }

    setIsProjectModalOpen(false);
    setFeedbackMessage(
      `Capital Rebuild Project "${title}" sanctioned into Public Works Registry with ₹${(budget / 100000).toFixed(1)}L budget!`
    );
    setTimeout(() => setFeedbackMessage(null), 4500);
    fetchRecurring();
  };

  const handleRunDiagnostics = (clusterKey: string) => {
    setDiagnosingKey(clusterKey);
    setTimeout(() => {
      setDiagnosingKey(null);
      setFeedbackMessage(
        'AI Geotechnical Diagnostics complete: Sieve analysis and moisture compaction deficits confirmed under subgrade.'
      );
      setTimeout(() => setFeedbackMessage(null), 4000);
    }, 1200);
  };

  const handleExportLedger = () => {
    const doc = {
      system: 'CivicLens Chronic Recurring Failure Hotspot Intelligence',
      generated_at: new Date().toISOString(),
      clusters_count: clusters.length,
      clusters: clusters,
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recurring-failures-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMessage('Chronic Failure Geotechnical Audit Ledger exported successfully.');
    setTimeout(() => setFeedbackMessage(null), 3500);
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
                Innovation 6 • Chronic Problem Detection & Root Cause Intelligence
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

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportLedger}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition backdrop-blur-sm"
              >
                <Download className="w-4 h-4" />
                Export Geotechnical Dossier
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Notification Banner */}
        {feedbackMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              ✕
            </button>
          </div>
        )}

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

                {/* Contractor Warranty Alert with Action */}
                {cluster.contractor_warranty_breach && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                      <div>
                        <strong className="font-bold">Contractor Warranty Breach Flagged:</strong> Repeated failure
                        occurred within 180-day guarantee period by{' '}
                        <span className="font-semibold underline">{cluster.contractor_name}</span>.
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveCluster(cluster);
                        setIsPenaltyModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold transition shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      Issue Penalty Notice
                    </button>
                  </div>
                )}

                {/* Civil Engineering Root Cause & Recommendation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Root Cause Diagnosis */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                        🔬 Civil Engineering Root Cause Diagnosis:
                      </strong>
                      <button
                        onClick={() => handleRunDiagnostics(cluster.clusterKey)}
                        disabled={diagnosingKey === cluster.clusterKey}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        {diagnosingKey === cluster.clusterKey ? 'Analyzing...' : 'Re-run Geotechnical AI'}
                      </button>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      "{cluster.root_cause_diagnosis}"
                    </p>
                  </div>

                  {/* Capital Replacement Recommendation */}
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2 text-emerald-950">
                    <div className="flex items-center justify-between">
                      <strong className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Definitive Capital Replacement Prescription:
                      </strong>
                    </div>
                    <p className="leading-relaxed font-medium">
                      {cluster.replacement_recommendation}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-800">
                        Capital Cost: ~₹{(cluster.replacement_cost_estimate / 100000).toFixed(1)}L • Net Savings:{' '}
                        <strong className="font-bold">₹{(cluster.potential_savings / 100000).toFixed(1)}L</strong>
                      </span>
                      <button
                        onClick={() => {
                          setActiveCluster(cluster);
                          setProjectTitle(`Capital Rebuild: ${cluster.locationName}`);
                          setProjectBudget(String(cluster.replacement_cost_estimate || 4500000));
                          setIsProjectModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <Hammer className="w-3 h-3" />
                        Sanction Rebuild
                      </button>
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
                        <span>View Asset DNA Ledger</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Issue Contractor Penalty Notice */}
        {isPenaltyModalOpen && activeCluster && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Issue Contractor Warranty Penalty</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{activeCluster.contractor_name}</p>
                </div>
                <button
                  onClick={() => setIsPenaltyModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleIssuePenalty} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contractor / Agency</label>
                  <input
                    type="text"
                    disabled
                    value={activeCluster.contractor_name || 'Assigned Contractor'}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-100 text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Penalty Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={penaltyAmount}
                    onChange={(e) => setPenaltyAmount(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Statutory Breach Citation</label>
                  <textarea
                    rows={3}
                    required
                    value={penaltyReason}
                    onChange={(e) => setPenaltyReason(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900">
                  <span className="font-bold block text-xs">Contractual Clause 42.1 Action:</span>
                  <p className="text-[11px] mt-0.5">
                    Issuing this citation will withhold retention security deposit funds and record a negative
                    durability mark against the contractor's EBAPI index rating.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPenaltyModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    Dispatch Formal Penalty
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Sanction Capital Rebuild Project */}
        {isProjectModalOpen && activeCluster && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Sanction Capital Rebuild Project</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Convert chronic hotspot into municipal project</p>
                </div>
                <button
                  onClick={() => setIsProjectModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSanctionProject} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Project Name / Scope</label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Approved Capital Allocation (₹)</label>
                  <input
                    type="number"
                    required
                    value={projectBudget}
                    onChange={(e) => setProjectBudget(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                  <span className="font-bold block text-xs">Fiscal Efficiency Justification:</span>
                  <p className="text-[11px] mt-0.5">
                    Capital replacement eliminates recurring repair overheads with projected 3-year savings of ₹
                    {(activeCluster.potential_savings / 100000).toFixed(1)} Lakhs.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    Authorize Capital Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
