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
                Innovation 7 • Individual Officer Appraisal & Promotion Index
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
                onClick={fetchIndex}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition backdrop-blur-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recalculate Scores
              </button>
            </div>
          </div>
        </div>

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
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-700">
                {(promotionSummary?.deferred_count || 0) + (promotionSummary?.frozen_count || 0)}
              </span>
              <span className="text-xs text-amber-600 font-semibold">Performance Review</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-700">High reopenings or repeat failure penalties</p>
          </div>
        </div>

        {/* Explainable Promotion & Individual Scoring Formula */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              Individual Promotion & Appraisal Scoring Architecture
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 self-start sm:self-auto">
              Tied to Annual Performance Appraisal Report (APAR)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white text-xs font-mono leading-relaxed overflow-x-auto">
            <code>
              Individual Score = [Personal SLA (30%)] + [Resolution Speed (20%)] + [Citizen Verification Trust (20%)] +
              [Work Durability (20%)] + [AI Evidence Authenticity (10%)] - [Personal Reopening & Beat Hotspot Penalty]
            </code>
          </div>

          {/* Promotion Criteria Tiers Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 text-xs">
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-900">Score ≥ 88 / 100</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  Fast-Track
                </span>
              </div>
              <strong className="text-slate-900 block font-semibold text-[11px]">
                Accelerated Promotion to Next Cadre
              </strong>
              <p className="text-slate-600 text-[11px]">
                Zero repeat defects, &gt;90% verified durability. Prioritized for executive and superintending roles.
              </p>
            </div>

            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-900">Score 75 – 87 / 100</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                  Seniority
                </span>
              </div>
              <strong className="text-slate-900 block font-semibold text-[11px]">
                Eligible for Regular Seniority Cadre
              </strong>
              <p className="text-slate-600 text-[11px]">
                Consistent SLA compliance (&gt;75%), satisfactory durability, and verified field evidence.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-amber-900">Score 60 – 74 / 100</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                  Deferred
                </span>
              </div>
              <strong className="text-slate-900 block font-semibold text-[11px]">
                Promotion Deferred (6M Observation)
              </strong>
              <p className="text-slate-600 text-[11px]">
                High reopening rate (&gt;15%) or delayed triage. Promotion deferred pending verified durability improvement.
              </p>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-rose-900">Score &lt; 60 / 100</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                  Frozen
                </span>
              </div>
              <strong className="text-slate-900 block font-semibold text-[11px]">
                Promotion Frozen / Remedial Training
              </strong>
              <p className="text-slate-600 text-[11px]">
                Quality failures, uncompacted patches, repeated vendor collusion. Promotion barred pending inquiry.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode: Individual Authorities */}
        {viewMode === 'individual' ? (
          <div className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search officer name, designation, or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">Department:</span>
                </div>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  <option value="dept-roads">Roads & Bridges</option>
                  <option value="dept-electrical">Electrical & Lighting</option>
                  <option value="dept-drainage">Stormwater Drainage</option>
                  <option value="dept-sanitation">Solid Waste / Sanitation</option>
                  <option value="dept-water">Water & Sewerage (CMWSSB)</option>
                </select>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 ml-2">
                  <span className="font-semibold">Promotion:</span>
                </div>
                <select
                  value={selectedPromotionFilter}
                  onChange={(e) => setSelectedPromotionFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="fast_track">Fast-Track Recommended</option>
                  <option value="seniority">Seniority Eligible</option>
                  <option value="deferred">Deferred (Review)</option>
                  <option value="frozen">Frozen (Inquiry)</option>
                </select>
              </div>
            </div>

            {/* Individual Officers List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOfficers.map((officer) => {
                const badge = getPromotionBadgeStyle(officer.promotion_eligibility);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={officer.officer_id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-5"
                  >
                    {/* Header: Rank, Name, Employee ID & Department */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            officer.rank === 1
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                              : officer.rank === 2
                              ? 'bg-blue-600 text-white'
                              : officer.rank === 3
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          #{officer.rank}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-slate-900 leading-tight">
                              {officer.officer_name}
                            </h3>
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {officer.employee_id}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-600 mt-0.5">
                            {officer.designation}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">{officer.department_name}</span>
                            <span>•</span>
                            <span>{officer.ward_jurisdiction}</span>
                          </div>
                        </div>
                      </div>

                      {/* Individual EBAPI Score */}
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-black text-slate-900">
                          {officer.composite_index}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          EBAPI Score / 100
                        </span>
                      </div>
                    </div>

                    {/* Promotion Status & Next Career Cadre Highlight Card */}
                    <div className={`p-4 rounded-xl border ${badge.bg} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BadgeIcon className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-bold">{badge.badgeText}</span>
                        </div>
                        <span className="text-[11px] font-mono font-bold">
                          {officer.merit_points} Merit Pts
                        </span>
                      </div>

                      <div className="pt-1 border-t border-current/15 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold opacity-80 block">
                            Target Promotion Cadre:
                          </span>
                          <strong className="font-bold flex items-center gap-1 text-[11px]">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {officer.next_promotion_cadre}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold opacity-80 block">
                            Promotion Readiness:
                          </span>
                          <span className="font-mono font-bold">{officer.promotion_readiness_score}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Verifiable Civic Performance Metrics (Individual Work Stats) */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Personal SLA
                        </span>
                        <span className="font-black text-slate-900">{officer.sla_compliance_pct}%</span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Avg Speed
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
      </div>
    </div>
  );
}
