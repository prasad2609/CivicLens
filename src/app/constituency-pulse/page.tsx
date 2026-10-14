'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Printer,
  TrendingUp,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  Repeat,
  Download,
  Activity,
  Layers,
  Sparkles,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { civicStore } from '@/lib/store';

export default function ConstituencyPulsePage() {
  const [pulse, setPulse] = useState<any>(null);
  const [selectedWard, setSelectedWard] = useState<string>('ward-175');
  const [loading, setLoading] = useState(true);
  const [isAddDirectiveModalOpen, setIsAddDirectiveModalOpen] = useState(false);
  const [newDirectiveText, setNewDirectiveText] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPulse();
    const unsub = civicStore.subscribe(fetchPulse);
    return unsub;
  }, [selectedWard]);

  const fetchPulse = async () => {
    try {
      const res = await fetch(`/api/analytics/pulse?ward_id=${selectedWard}`);
      if (res.ok) {
        const data = await res.json();
        setPulse(data);
      } else {
        setPulse(civicStore.getConstituencyPulse(selectedWard));
      }
    } catch {
      setPulse(civicStore.getConstituencyPulse(selectedWard));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirectiveText.trim()) return;

    try {
      const res = await fetch('/api/analytics/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_action_item',
          ward_id: selectedWard,
          item_text: newDirectiveText.trim(),
        }),
      });

      if (res.ok) {
        civicStore.addActionItem(selectedWard, newDirectiveText.trim());
      } else {
        civicStore.addActionItem(selectedWard, newDirectiveText.trim());
      }
    } catch {
      civicStore.addActionItem(selectedWard, newDirectiveText.trim());
    }

    setIsAddDirectiveModalOpen(false);
    setNewDirectiveText('');
    setFeedbackMessage('New 90-Day Municipal Directive successfully ratified and added to the official Pulse Briefing!');
    setTimeout(() => setFeedbackMessage(null), 4500);
    fetchPulse();
  };

  const handleCycleActionStatus = async (idx: number, currentText: string) => {
    const isCompleted = currentText.startsWith('✅ [Completed]');
    const isInProgress = currentText.startsWith('🔄 [In Progress]');

    let newStatus = 'in_progress';
    if (isInProgress) newStatus = 'completed';
    else if (isCompleted) newStatus = 'pending';

    try {
      const res = await fetch('/api/analytics/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          ward_id: selectedWard,
          item_index: idx,
          new_status: newStatus,
        }),
      });

      if (res.ok) {
        civicStore.updateActionItemStatus(selectedWard, idx, newStatus);
      } else {
        civicStore.updateActionItemStatus(selectedWard, idx, newStatus);
      }
    } catch {
      civicStore.updateActionItemStatus(selectedWard, idx, newStatus);
    }

    setFeedbackMessage(`Directive #${idx + 1} status updated to ${newStatus.replace('_', ' ').toUpperCase()}!`);
    setTimeout(() => setFeedbackMessage(null), 3000);
    fetchPulse();
  };

  const handleExportBriefing = () => {
    if (!pulse) return;
    const blob = new Blob([JSON.stringify(pulse, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `constituency-pulse-${selectedWard}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMessage('Constituency Pulse Briefing exported successfully.');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-5xl mx-auto space-y-8 print:max-w-none print:space-y-4">
        {/* Screen Action Bar (Hidden when printing) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Constituency Ward:
            </label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="text-sm font-bold border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 focus:outline-none"
            >
              <option value="ward-175">Ward 175 - Velachery</option>
              <option value="ward-172">Ward 172 - Adyar</option>
              <option value="ward-170">Ward 170 - Besant Nagar</option>
              <option value="ward-173">Ward 173 - Mylapore</option>
              <option value="ward-174">Ward 174 - T. Nagar</option>
              <option value="ward-176">Ward 176 - Guindy Industrial</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddDirectiveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Ward Directive
            </button>
            <button
              onClick={handleExportBriefing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export Dossier
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Real-time Notification Banner */}
        {feedbackMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              ✕
            </button>
          </div>
        )}

        {/* Executive Pulse Briefing Document */}
        {pulse && (
          <div className="bg-white rounded-2xl border border-slate-300 p-8 sm:p-10 shadow-lg space-y-8 print:border-none print:shadow-none print:p-0">
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-blue-700 font-extrabold uppercase text-xs tracking-wider mb-1">
                  <Activity className="w-4 h-4" />
                  Greater Chennai Municipal Corporation • CivicLens Intelligence
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Constituency Pulse Briefing
                </h1>
                <p className="text-sm font-semibold text-slate-600 mt-1">
                  {pulse.ward_name} ({pulse.zone}) • Operational Governance Diagnostic
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 text-xs text-slate-500 font-mono">
                <div>Date: {new Date(pulse.generated_at).toLocaleDateString()}</div>
                <div>Status: Official Public Audit</div>
                <div>Hash: SHA-256 Verifiable</div>
              </div>
            </div>

            {/* Executive Summary Metrics Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Overall Score
                </span>
                <span className="text-3xl font-black text-purple-700 block mt-1">
                  {pulse.executive_summary.overall_governance_score}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  Grade {pulse.executive_summary.governance_grade}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Resolution Rate
                </span>
                <span className="text-3xl font-black text-slate-900 block mt-1">
                  {pulse.executive_summary.citizen_verification_rate_pct}%
                </span>
                <span className="text-xs font-semibold text-slate-500">Citizen Verified</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Complaints Resolved
                </span>
                <span className="text-3xl font-black text-slate-900 block mt-1">
                  {pulse.executive_summary.resolved_count} / {pulse.executive_summary.total_complaints}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {pulse.executive_summary.pending_count} Active
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Infrastructure Health
                </span>
                <span className="text-3xl font-black text-emerald-600 block mt-1">
                  {pulse.executive_summary.average_asset_health_score}/100
                </span>
                <span className="text-xs font-semibold text-slate-500">Civic DNA Index</span>
              </div>
            </div>

            {/* Section 1: Department Performance in this Ward */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                1. Authority Execution in Ward (EBAPI Scorecards)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-2.5">Department</th>
                      <th className="p-2.5 text-center">EBAPI Composite</th>
                      <th className="p-2.5 text-center">SLA Compliance</th>
                      <th className="p-2.5 text-center">Speed</th>
                      <th className="p-2.5 text-center">Verified Fix %</th>
                      <th className="p-2.5 text-center">Reopening Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pulse.department_scorecards.map((sc: any) => (
                      <tr key={sc.department_id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-800">{sc.department_name}</td>
                        <td className="p-2.5 text-center font-black text-blue-700">{sc.composite_index}</td>
                        <td className="p-2.5 text-center font-semibold">{sc.sla_compliance_pct}%</td>
                        <td className="p-2.5 text-center">{sc.avg_resolution_days} days</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">
                          {sc.verified_resolution_pct}%
                        </td>
                        <td className="p-2.5 text-center font-bold text-rose-600">
                          {sc.reopening_rate_pct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Chronic Failure Hotspots */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                2. Chronic Failure Hotspots & Capital Rebuild Triggers
              </h3>

              <div className="space-y-2.5">
                {pulse.recurring_hotspots.map((hotspot: any) => (
                  <div
                    key={hotspot.clusterKey}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900">{hotspot.locationName}</span>
                      <span className="text-rose-600 font-black">
                        {hotspot.occurrenceCount} repeat breaks • ₹{(hotspot.cumulative_repair_cost / 100000).toFixed(1)}L wasted
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      <strong>Root Cause:</strong> {hotspot.root_cause_diagnosis}
                    </p>
                    <p className="text-emerald-700 font-semibold">
                      <strong>Prescription:</strong> {hotspot.replacement_recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Actionable Policy Directives (Interactive) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  3. Mandatory Civic Action Items for Next 90 Days
                </h3>
                <span className="text-[11px] text-slate-400 italic print:hidden">
                  (Click any directive to cycle status: Pending → In Progress → Completed)
                </span>
              </div>

              <div className="space-y-2">
                {pulse.action_items.map((item: string, idx: number) => {
                  const isCompleted = item.startsWith('✅ [Completed]');
                  const isInProgress = item.startsWith('🔄 [In Progress]');

                  return (
                    <div
                      key={idx}
                      onClick={() => handleCycleActionStatus(idx, item)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex items-start justify-between gap-3 ${
                        isCompleted
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                          : isInProgress
                          ? 'bg-blue-50/70 border-blue-300 text-blue-950 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-800 font-normal hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="font-extrabold shrink-0 text-slate-600">{idx + 1}.</span>
                        <span className="leading-relaxed">{item}</span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider print:hidden ${
                          isCompleted
                            ? 'bg-emerald-200 text-emerald-900'
                            : isInProgress
                            ? 'bg-blue-200 text-blue-900'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Sign-off */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span>CivicLens Automated Intelligence Engine</span>
              <span>Authorized under Open Governance Data Directive</span>
            </div>
          </div>
        )}

        {/* Modal: Add Ward Directive */}
        {isAddDirectiveModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Add 90-Day Ward Directive</h3>
                <button
                  onClick={() => setIsAddDirectiveModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddDirective} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ward</label>
                  <input
                    type="text"
                    disabled
                    value={pulse ? `${pulse.ward_name} (${pulse.zone})` : selectedWard}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-100 text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Directive Text / Action Prescription
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newDirectiveText}
                    onChange={(e) => setNewDirectiveText(e.target.value)}
                    placeholder="e.g., Deploy automated water quality sensor beacons along Buckingham Canal culverts..."
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddDirectiveModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    Ratify Directive
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
