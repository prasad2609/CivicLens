'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  HardHat,
  Share2,
  ExternalLink,
  MessageSquare,
  Wrench,
  AlertCircle,
  Cpu,
} from 'lucide-react';
import { civicStore } from '@/lib/store';
import { CivicIssue, UserProfile, VerificationResult } from '@/types';
import { StatusBadge, SeverityBadge, CategoryIcon } from '@/components/ui/Badge';
import { Timeline } from '@/components/issues/Timeline';
import { VerificationModal } from '@/components/issues/VerificationModal';
import { EscalationModal } from '@/components/issues/EscalationModal';
import { AssignFieldWorkerModal } from '@/components/officer/AssignFieldWorkerModal';
import { ResolveModal } from '@/components/officer/ResolveModal';
import { FieldWorkModal } from '@/components/field/FieldWorkModal';
import { CivicMap } from '@/components/map/CivicMap';

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idOrCode = params.id as string;

  const [issue, setIssue] = useState<CivicIssue | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<UserProfile>(civicStore.getCurrentUser());
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showFieldWorkModal, setShowFieldWorkModal] = useState(false);

  // Active tab for mobile
  const [activeTab, setActiveTab] = useState<'timeline' | 'evidence' | 'map'>('timeline');

  useEffect(() => {
    const update = () => {
      const found = civicStore.getIssueById(idOrCode);
      setIssue(found ? { ...found } : undefined);
      setCurrentUser(civicStore.getCurrentUser());
      setLoading(false);
    };

    update();
    const unsub = civicStore.subscribe(update);
    return unsub;
  }, [idOrCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading complaint record...</p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Complaint Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            We could not find any civic complaint matching reference &quot;{idOrCode}&quot;.
          </p>
          <Link
            href="/issues"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Browse Public Issues
          </Link>
        </div>
      </div>
    );
  }

  // Handlers for modal actions
  const handleVerifySubmit = (
    result: VerificationResult,
    comment: string,
    photoDataUrl?: string
  ) => {
    civicStore.verifyResolution(issue.id, result, comment, photoDataUrl);
  };

  const handleEscalateSubmit = (reason: string, details: string) => {
    civicStore.escalateComplaint(issue.id, reason, details);
  };

  const handleAssignWorker = (workerId: string, note: string) => {
    civicStore.assignFieldWorker(issue.id, workerId, note);
  };

  const handleResolveSubmit = (officialNote: string, proofPhotoUrl?: string) => {
    civicStore.markOfficerResolved(issue.id, officialNote, proofPhotoUrl);
  };

  const handleFieldWorkSubmit = (
    notes: string,
    photoDataUrl?: string,
    isCompleted?: boolean
  ) => {
    civicStore.submitFieldWork(issue.id, notes, photoDataUrl, isCompleted);
  };

  const isCitizenOwner = currentUser.role === 'citizen' && currentUser.id === issue.citizen_id;
  const isOfficer = currentUser.role === 'officer' || currentUser.role === 'admin';
  const isFieldWorker = currentUser.role === 'field_worker';
  const isRepresentative = currentUser.role === 'representative';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/issues"
            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Issues Explorer
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Complaint Reference:</span>
            <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {issue.complaint_code}
            </span>
          </div>
        </div>

        {/* PROMINENT CITIZEN VERIFICATION BANNER (When marked resolved) */}
        {issue.status === 'resolved' && (
          <div className="bg-emerald-600 text-white p-5 rounded-xl shadow-lg border border-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-7 h-7 text-emerald-100 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-base">Resolution Verification Required</h3>
                <p className="text-xs text-emerald-100 mt-0.5 max-w-xl">
                  The municipal authority has recorded that this issue has been resolved. Please inspect the location and confirm whether the problem was genuinely fixed.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowVerifyModal(true)}
              className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-lg shadow transition shrink-0"
            >
              Verify Resolution Now &rarr;
            </button>
          </div>
        )}

        {/* ESCALATION BANNER (If already escalated) */}
        {issue.status === 'escalated' && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-xl text-red-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block text-sm">Complaint Escalated to Zonal Authority</span>
              <p className="mt-0.5">
                This complaint is under active administrative audit by the Municipal Commissioner and Representative Oversight.
              </p>
            </div>
          </div>
        )}

        {/* AI EVIDENCE ADVISORY BANNER (If flagged by AI Detector) */}
        {issue.ai_verification_status === 'flagged_ai' && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-950 flex items-start gap-3">
            <Cpu className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block text-sm">Automated Evidence Authenticity Advisory</span>
              <p className="mt-0.5 text-amber-800">
                CivicLens AI Image Detector (Microsoft CvT-13 vision network) identified potential synthetic or generative artifact patterns in the submitted photo proof. Officers should verify physical ground reality before dispatching municipal resources.
              </p>
            </div>
          </div>
        )}

        {/* TOP SUMMARY CARD */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  {issue.complaint_code}
                </span>
                <StatusBadge status={issue.status} />
                <SeverityBadge severity={issue.severity} />
                {issue.ai_verification_status === 'flagged_ai' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded" title="CvT-13 AI Detector flagged synthetic evidence">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    AI-Flagged Evidence
                  </span>
                )}
                {issue.ai_verification_status === 'verified_real' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded" title="Authenticity verified as ground real">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Authentic Ground Photo
                  </span>
                )}
                {issue.is_overdue && (
                  <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
                    SLA Overdue
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {issue.title}
              </h1>
            </div>

            {/* Quick Context Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Citizen Escalate Button */}
              {(isCitizenOwner || currentUser.role === 'admin' || currentUser.role === 'citizen') &&
                issue.status !== 'closed' &&
                issue.status !== 'escalated' && (
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Escalate Issue
                  </button>
                )}

              {/* Officer: Assign Worker Button */}
              {isOfficer && issue.status !== 'closed' && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <HardHat className="w-3.5 h-3.5" /> Dispatch Field Worker
                </button>
              )}

              {/* Officer: Mark Resolved Button */}
              {isOfficer && issue.status !== 'resolved' && issue.status !== 'closed' && (
                <button
                  onClick={() => setShowResolveModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Mark Resolved
                </button>
              )}

              {/* Field Worker: Update Progress Button */}
              {isFieldWorker && (
                <button
                  onClick={() => setShowFieldWorkModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Wrench className="w-3.5 h-3.5" /> Update Field Work
                </button>
              )}
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">Location</span>
                <span className="font-medium text-slate-900 truncate block max-w-[180px]">
                  {issue.location_text}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">Authority</span>
                <span className="font-medium text-slate-900 truncate block max-w-[180px]">
                  {issue.department_name || 'Intake Routing'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">Reported On</span>
                <span className="font-medium text-slate-900">
                  {new Date(issue.created_at).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">Assigned Tech</span>
                <span className="font-medium text-slate-900">
                  {issue.assigned_field_worker_name || 'Depot Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN BODY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLS: Details, Evidence & Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Problem Description
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {issue.description}
              </p>
            </div>

            {/* Evidence Gallery */}
            {issue.evidence && issue.evidence.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Photographic Evidence ({issue.evidence.length})</span>
                  <span className="text-[10px] font-normal text-slate-400">Click photo to inspect</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {issue.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 group hover:shadow-md transition"
                    >
                      <div className="h-44 overflow-hidden relative cursor-pointer" onClick={() => window.open(ev.file_path, '_blank')}>
                        <img
                          src={ev.file_path}
                          alt={ev.caption || 'Evidence'}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                        <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded capitalize">
                          {ev.evidence_type.replace('_', ' ')}
                        </span>
                        {ev.authenticity?.is_ai_generated && (
                          <span className="absolute top-2 right-2 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                            <AlertTriangle className="w-3 h-3" /> AI Flagged
                          </span>
                        )}
                        {ev.authenticity && !ev.authenticity.is_ai_generated && (
                          <span className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                            <ShieldCheck className="w-3 h-3" /> Ground Real
                          </span>
                        )}
                      </div>
                      <div className="p-3 text-xs">
                        <p className="text-slate-700 font-medium line-clamp-2">{ev.caption || 'Photo proof'}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          By {ev.uploader_name} ({ev.uploader_role}) •{' '}
                          {new Date(ev.created_at).toLocaleDateString()}
                        </span>

                        {ev.authenticity && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                            {ev.authenticity.is_ai_generated ? (
                              <span className="font-semibold text-amber-700 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Suspected AI ({(ev.authenticity.ai_probability * 100).toFixed(0)}%)
                              </span>
                            ) : (
                              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Verified Real ({(ev.authenticity.confidence * 100).toFixed(0)}%)
                              </span>
                            )}
                            <span className="text-slate-400 font-mono text-[9px]">
                              {(ev.authenticity.engine || ev.authenticity.model || '').toLowerCase().includes('cvt') ? 'CvT-13 Vision' : 'Integrity'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Details (If verified or reopened) */}
            {issue.verification && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Citizen Resolution Verification Record
                </h2>
                <div
                  className={`p-4 rounded-lg border text-xs ${
                    issue.verification.result === 'completely_resolved'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="capitalize">
                      Outcome: {issue.verification.result.replace('_', ' ')}
                    </span>
                    <span>{new Date(issue.verification.created_at).toLocaleString()}</span>
                  </div>
                  <p className="italic">&ldquo;{issue.verification.comment}&rdquo;</p>
                </div>
              </div>
            )}

            {/* Visual Timeline Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Accountability Progression Timeline
              </h2>
              <p className="text-xs text-slate-500">
                Every administrative action, assignment, inspection, and verification is logged permanently in this audit trail.
              </p>
              <div className="pt-2">
                <Timeline events={issue.timeline} />
              </div>
            </div>
          </div>

          {/* RIGHT COL: Map & Accountability Specs */}
          <div className="space-y-6">
            {/* OpenStreetMap Location */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>Geographic Pin</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                </span>
              </h3>
              <div className="h-56 rounded-lg overflow-hidden border border-slate-200">
                <CivicMap
                  issues={[issue]}
                  selectedIssueId={issue.id}
                  center={[issue.latitude, issue.longitude]}
                  zoom={15}
                  className="h-full w-full"
                />
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {issue.location_text} ({issue.jurisdiction_name})
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${issue.latitude},${issue.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Navigate to Location
              </a>
            </div>

            {/* Department SLA & Routing Specifications */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Authority Routing Details
              </h3>
              <div className="space-y-2.5 divide-y divide-slate-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-900 text-right">{issue.department_name}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Ward / Zone:</span>
                  <span className="font-semibold text-slate-900 text-right">{issue.jurisdiction_name}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Officer In-Charge:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {issue.assigned_officer_name || 'Zone Division Lead'}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Field Worker:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {issue.assigned_field_worker_name || 'Pending assignment'}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Resolution SLA:</span>
                  <span className="font-semibold text-slate-900">
                    {issue.sla_target_date
                      ? new Date(issue.sla_target_date).toLocaleDateString()
                      : '7 Days Standard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Public Transparency Note */}
            <div className="bg-blue-50/70 rounded-xl border border-blue-200 p-4 text-xs text-blue-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Privacy & Open Transparency</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                This record is publicly indexed to foster municipal accountability. The citizen&apos;s phone number, email, and exact personal dwelling are kept strictly private under CivicLens RBAC.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <VerificationModal
        complaintCode={issue.complaint_code}
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onSubmit={handleVerifySubmit}
      />

      <EscalationModal
        complaintCode={issue.complaint_code}
        isOpen={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        onSubmit={handleEscalateSubmit}
      />

      <AssignFieldWorkerModal
        complaintCode={issue.complaint_code}
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignWorker}
      />

      <ResolveModal
        complaintCode={issue.complaint_code}
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        onResolve={handleResolveSubmit}
      />

      <FieldWorkModal
        complaintCode={issue.complaint_code}
        isOpen={showFieldWorkModal}
        onClose={() => setShowFieldWorkModal(false)}
        onSubmit={handleFieldWorkSubmit}
      />
    </div>
  );
}
