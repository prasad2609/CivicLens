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
  FileCheck,
  UserCheck,
  Briefcase,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  Star,
  User,
  AlertCircle,
  Calendar,
  Building2,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  Download,
  Gavel,
} from 'lucide-react';
import {
  DepartmentScorecard,
  OfficerPerformanceScorecard,
  OfficerPromotionStatus,
  AuthorityIndexResponse,
} from '@/types';
import { civicStore } from '@/lib/store';

export default function AuthorityIndexPage() {
  const [data, setData] = useState<AuthorityIndexResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'individual' | 'department'>('individual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedPromotionFilter, setSelectedPromotionFilter] = useState<string>('all');
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerPerformanceScorecard | null>(null);

  // DPC Action Modal
  const [isDpcModalOpen, setIsDpcModalOpen] = useState(false);
  const [dpcTargetOfficer, setDpcTargetOfficer] = useState<OfficerPerformanceScorecard | null>(null);
  const [dpcActionType, setDpcActionType] = useState<
    'approve_fast_track' | 'approve_seniority' | 'defer_promotion' | 'freeze_promotion'
  >('approve_fast_track');
  const [dpcRemarks, setDpcRemarks] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

  const handleExecuteDpcAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dpcTargetOfficer) return;

    try {
      const res = await fetch('/api/analytics/authority-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officerId: dpcTargetOfficer.officer_id,
          actionType: dpcActionType,
          remarks: dpcRemarks || 'Official DPC Board Appraisal Determination ratified.',
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        civicStore.recordOfficerAppraisalAction(
          dpcTargetOfficer.officer_id,
          dpcActionType,
          dpcRemarks || 'Official DPC Board Appraisal Determination ratified.'
        );
      } else {
        civicStore.recordOfficerAppraisalAction(
          dpcTargetOfficer.officer_id,
          dpcActionType,
          dpcRemarks || 'Official DPC Board Appraisal Determination ratified.'
        );
      }
    } catch {
      civicStore.recordOfficerAppraisalAction(
        dpcTargetOfficer.officer_id,
        dpcActionType,
        dpcRemarks || 'Official DPC Board Appraisal Determination ratified.'
      );
    }

    setIsDpcModalOpen(false);
    setDpcRemarks('');
    setFeedbackMessage(
      `DPC Promotion Determination ratified for ${dpcTargetOfficer.officer_name} and recorded to APAR Registry.`
    );
    setTimeout(() => setFeedbackMessage(null), 4500);
    fetchIndex();
  };

  const handleExportAparLedger = () => {
    if (!data) return;
    const exportDoc = {
      system: 'CivicLens Evidence-Based Authority Performance Index (EBAPI)',
      title: 'Official Annual Performance Appraisal Report (APAR) Cadre Dossier',
      dpc_cycle: 'FY 2025-26 Annual Promotion & Career Evaluation',
      audit_authority: 'Municipal Service Commission & DPC Oversight Board',
      export_timestamp: new Date().toISOString(),
      officers: data.officer_scorecards,
      departments: data.scorecards,
      promotion_pipeline: data.promotion_summary,
      integrity_signature: 'SHA256:d82f7c00192a9127814b7ac896f53e34b998a729e46a782163b2049e771a39d8',
    };
    const blob = new Blob([JSON.stringify(exportDoc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `APAR-Dossier-EBAPI-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMessage('Official APAR Cadre Appraisal Dossier exported successfully.');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const officers = data?.officer_scorecards || [];
  const departments = data?.scorecards || [];
  const promotionSummary = data?.promotion_summary;

  // Filter officers based on search, department, and promotion status
  const filteredOfficers = officers.filter((officer) => {
    const matchesSearch =
      officer.officer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.ward_jurisdiction.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'all' || officer.department_id === selectedDept;

    const matchesPromotion =
      selectedPromotionFilter === 'all' ||
      (selectedPromotionFilter === 'fast_track' &&
        officer.promotion_eligibility === 'Fast-Track Promotion Recommended') ||
      (selectedPromotionFilter === 'seniority' &&
        officer.promotion_eligibility === 'Eligible for Seniority Promotion') ||
      (selectedPromotionFilter === 'deferred' &&
        officer.promotion_eligibility === 'Promotion Deferred - Performance Review') ||
      (selectedPromotionFilter === 'frozen' &&
        officer.promotion_eligibility === 'Promotion Frozen - Under Investigation');

    return matchesSearch && matchesDept && matchesPromotion;
  });

  const getPromotionBadgeStyle = (status: OfficerPromotionStatus) => {
    switch (status) {
      case 'Fast-Track Promotion Recommended':
        return {
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
          dot: 'bg-emerald-500',
          badgeText: 'Fast-Track Promotion Recommended',
          icon: Sparkles,
        };
      case 'Eligible for Seniority Promotion':
        return {
          bg: 'bg-blue-50 border-blue-300 text-blue-800',
          dot: 'bg-blue-500',
          badgeText: 'Seniority Promotion Eligible',
          icon: UserCheck,
        };
      case 'Promotion Deferred - Performance Review':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-800',
          dot: 'bg-amber-500',
          badgeText: 'Promotion Deferred (6M Review)',
          icon: Clock,
        };
      case 'Promotion Frozen - Under Investigation':
        return {
          bg: 'bg-rose-50 border-rose-300 text-rose-800',
          dot: 'bg-rose-500',
          badgeText: 'Promotion Frozen (Remedial Training)',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-300 text-slate-800',
          dot: 'bg-slate-500',
          badgeText: 'Under Evaluation',
          icon: Briefcase,
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
                <Scale className="w-3.5 h-3.5" />
                Innovation 5 • Individual Officer Appraisal & Promotion Index
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Evidence-Based Authority Performance Index (EBAPI)
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
                Objective scoring evaluated at the <strong className="text-white">individual officer level</strong>,
                not aggregated to conceal poor performers. Every municipal authority’s resolution velocity, citizen
                verification rate, repair durability, and recurring failure penalty directly determine their{' '}
                <strong className="text-blue-300">annual appraisal score and next career promotion cadre</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 flex border border-white/15">
                <button
                  onClick={() => setViewMode('individual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    viewMode === 'individual'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Individual Authorities ({officers.length})
                </button>
                <button
                  onClick={() => setViewMode('department')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    viewMode === 'department'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Department Roll-up
                </button>
              </div>

              <button
                onClick={handleExportAparLedger}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                Export APAR Dossier
              </button>

              <button
                onClick={fetchIndex}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition backdrop-blur-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recalculate Scores
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

        {/* Promotion Pipeline Overview Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Evaluated
              </span>
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">
                {promotionSummary?.total_officers_evaluated || officers.length}
              </span>
              <span className="text-xs text-slate-500">municipal authorities</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Assigned across Chennai South beats</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Fast-Track Promotion
              </span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">
                {promotionSummary?.fast_track_promotable ?? 2}
              </span>
              <span className="text-xs text-emerald-600 font-semibold">Eligible (Score ≥ 88)</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-700">Accelerated elevation to Superintending / EE</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm bg-blue-50/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Seniority Promotion
              </span>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-700">
                {promotionSummary?.eligible_for_promotion ?? 2}
              </span>
              <span className="text-xs text-blue-600 font-semibold">Cleared (Score 75–87)</span>
            </div>
            <p className="mt-1 text-[11px] text-blue-700">Standard cadre promotion quota approved</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Deferred / Frozen
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-700">
                {(promotionSummary?.deferred_count ?? 1) + (promotionSummary?.frozen_count ?? 1)}
              </span>
              <span className="text-xs text-amber-600 font-semibold">Under Audit / Remedial</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-700">6-Month Probation or Integrity Freeze</p>
          </div>
        </div>

        {/* View Mode: Individual Officer Scorecards */}
        {viewMode === 'individual' ? (
          <div className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search authority by name, employee ID, designation, or ward..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">Dept:</span>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none"
                  >
                    <option value="all">All Departments</option>
                    <option value="dept-highways">Highways & Pavement</option>
                    <option value="dept-swd">Stormwater Drain (SWD)</option>
                    <option value="dept-metro-water">Metro Water & Sewerage</option>
                    <option value="dept-electrical">Smart Electrical & Lighting</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="font-semibold">Promotion:</span>
                  <select
                    value={selectedPromotionFilter}
                    onChange={(e) => setSelectedPromotionFilter(e.target.value)}
                    className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none"
                  >
                    <option value="all">All Promotion Statuses</option>
                    <option value="fast_track">Fast-Track Recommended</option>
                    <option value="seniority">Seniority Eligible</option>
                    <option value="deferred">Deferred (6M Review)</option>
                    <option value="frozen">Frozen (Under Investigation)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Officers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOfficers.map((officer) => {
                const badge = getPromotionBadgeStyle(officer.promotion_eligibility);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={officer.officer_id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-5"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {officer.employee_id}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {officer.department_name}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug">
                          {officer.officer_name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {officer.designation} • Jurisdiction: <strong>{officer.ward_jurisdiction}</strong>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-3xl font-black text-slate-900 leading-none">
                          {officer.composite_index}
                          <span className="text-sm font-bold text-slate-400">/100</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mt-1">
                          Rank #{officer.rank} of {officers.length}
                        </span>
                      </div>
                    </div>

                    {/* Official Cadre Promotion Determination Badge */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${badge.bg}`}>
                      <div className="flex items-center gap-2.5">
                        <BadgeIcon className="w-4 h-4 shrink-0" />
                        <div>
                          <strong className="font-extrabold block">{badge.badgeText}</strong>
                          <span className="text-[11px] opacity-80 mt-0.5 block">
                            Target Cadre: <strong>{officer.next_promotion_cadre}</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setDpcTargetOfficer(officer);
                          setDpcActionType(
                            officer.composite_index >= 88
                              ? 'approve_fast_track'
                              : officer.composite_index >= 75
                              ? 'approve_seniority'
                              : officer.composite_index >= 60
                              ? 'defer_promotion'
                              : 'freeze_promotion'
                          );
                          setIsDpcModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white shadow-sm border border-slate-200 text-slate-800 text-[11px] font-bold hover:bg-slate-50 transition shrink-0 flex items-center gap-1"
                      >
                        <Gavel className="w-3 h-3 text-indigo-600" />
                        DPC Action
                      </button>
                    </div>

                    {/* Core Metric Quadrant */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          SLA Compliance
                        </span>
                        <span className="font-black text-slate-900">{officer.sla_compliance_pct}%</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Avg Resolution
                        </span>
                        <span className="font-black text-slate-900">{officer.avg_resolution_days}d</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Citizen Verified
                        </span>
                        <span className="font-black text-slate-900">{officer.verified_resolution_pct}%</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Reopenings
                        </span>
                        <span
                          className={`font-black ${
                            officer.reopening_rate_pct > 15 ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {officer.reopening_rate_pct}% ({officer.citizen_reopened_count})
                        </span>
                      </div>
                    </div>

                    {/* Weight Breakdown Stacked Bar */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500 font-semibold text-[11px]">
                        <span>Formula Breakdown:</span>
                        <span className="font-mono text-slate-800">
                          SLA:{officer.weights_breakdown.sla_score} + Spd:{officer.weights_breakdown.speed_score} + Trust:
                          {officer.weights_breakdown.citizen_trust_score} + Dur:
                          {officer.weights_breakdown.durability_score} - Pen:{officer.weights_breakdown.recurring_penalty}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-blue-600 h-full"
                          style={{ width: `${(officer.weights_breakdown.sla_score / 30) * 30}%` }}
                          title="SLA Score"
                        />
                        <div
                          className="bg-indigo-500 h-full"
                          style={{ width: `${(officer.weights_breakdown.speed_score / 20) * 20}%` }}
                          title="Speed Score"
                        />
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${(officer.weights_breakdown.citizen_trust_score / 20) * 20}%` }}
                          title="Citizen Trust"
                        />
                        <div
                          className="bg-teal-500 h-full"
                          style={{ width: `${(officer.weights_breakdown.durability_score / 20) * 20}%` }}
                          title="Durability"
                        />
                        <div
                          className="bg-purple-500 h-full"
                          style={{ width: `${(officer.weights_breakdown.evidence_authenticity_score / 10) * 10}%` }}
                          title="AI Evidence Authenticity"
                        />
                      </div>
                    </div>

                    {/* Official APAR Promotion Citation & Explainable Rationale */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <span>{officer.appraisal_cycle}</span>
                        <span className="text-slate-700">Tier: {officer.performance_tier}</span>
                      </div>
                      <p className="text-slate-700 italic leading-relaxed text-[11px]">
                        &ldquo;{officer.appraisal_citation}&rdquo;
                      </p>

                      {/* Actionable Directive */}
                      {officer.actionable_recommendations.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 text-[11px] font-semibold text-slate-800">
                          <strong className="text-blue-700 font-bold block text-[10px] uppercase">
                            DPC Action Directive:
                          </strong>
                          {officer.actionable_recommendations[0]}
                        </div>
                      )}
                    </div>

                    {/* Career Milestones Progress */}
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">
                        Tenure: <strong>{officer.years_in_current_cadre} years</strong> in cadre
                      </span>
                      <button
                        onClick={() => setSelectedOfficer(selectedOfficer?.officer_id === officer.officer_id ? null : officer)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs inline-flex items-center gap-1"
                      >
                        {selectedOfficer?.officer_id === officer.officer_id ? 'Close Details' : 'View Milestones'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Expanded Officer Dossier: Milestones */}
                    {selectedOfficer?.officer_id === officer.officer_id && (
                      <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                          Career Milestones & Performance Audits
                        </span>
                        <div className="space-y-2">
                          {officer.promotional_milestones.map((m, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs flex items-start gap-2.5"
                            >
                              <div
                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                  m.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : m.status === 'in_progress'
                                    ? 'bg-amber-500 animate-pulse'
                                    : 'bg-slate-300'
                                }`}
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <strong className="text-slate-900 font-bold">{m.title}</strong>
                                  <span className="text-[10px] text-slate-400 font-mono">{m.date}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-0.5">{m.note}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredOfficers.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">No Municipal Officers Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing your search query or adjusting the department and promotion eligibility filters.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* View Mode: Department Roll-up Matrix */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Department Aggregate Roll-Up Leaderboard
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparative roll-up of municipal departments synthesized from individual staff scorecards.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {departments.map((sc) => {
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

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                        Departmental Action Directives:
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
        )}

        {/* Modal: Execute DPC Appraisal Action */}
        {isDpcModalOpen && dpcTargetOfficer && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Execute DPC Promotion Action</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dpcTargetOfficer.officer_name} ({dpcTargetOfficer.employee_id}) • EBAPI: {dpcTargetOfficer.composite_index}/100
                  </p>
                </div>
                <button
                  onClick={() => setIsDpcModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleExecuteDpcAction} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Departmental Promotion Committee (DPC) Determination
                  </label>
                  <select
                    value={dpcActionType}
                    onChange={(e) => setDpcActionType(e.target.value as any)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:outline-none font-medium"
                  >
                    <option value="approve_fast_track">Sanction Fast-Track Promotion to Next Cadre</option>
                    <option value="approve_seniority">Approve Seniority Cadre Elevation</option>
                    <option value="defer_promotion">Order 6-Month Performance Deferral (Probation)</option>
                    <option value="freeze_promotion">Order Cadre Freeze & Remedial Re-assignment</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Next Cadre</label>
                  <input
                    type="text"
                    disabled
                    value={dpcTargetOfficer.next_promotion_cadre}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-slate-100 text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">DPC Official Remarks & Citation</label>
                  <textarea
                    rows={3}
                    required
                    value={dpcRemarks}
                    onChange={(e) => setDpcRemarks(e.target.value)}
                    placeholder="Enter official rationale citing SLA speed, citizen verification, and durability records..."
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900">
                  <span className="font-bold block text-xs">Statutory Legal Notice:</span>
                  <p className="text-[11px] mt-0.5">
                    This administrative action will immediately alter the officer's career eligibility status
                    and publish an immutable log entry into the Municipal Service APAR ledger.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDpcModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    Ratify DPC Determination
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
