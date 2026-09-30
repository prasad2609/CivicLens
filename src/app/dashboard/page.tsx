'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Building2,
  HardHat,
  Users,
  Settings,
  PlusCircle,
  ExternalLink,
  MapPin,
  RefreshCw,
  Eye,
  Calendar,
  AlertCircle,
  Wrench,
} from 'lucide-react';
import { civicStore } from '@/lib/store';
import {
  CivicIssue,
  UserProfile,
  Department,
  IssueCategory,
  AuditLog,
  VerificationResult,
} from '@/types';
import { StatusBadge, SeverityBadge, CategoryIcon } from '@/components/ui/Badge';
import { AssignFieldWorkerModal } from '@/components/officer/AssignFieldWorkerModal';
import { ResolveModal } from '@/components/officer/ResolveModal';
import { FieldWorkModal } from '@/components/field/FieldWorkModal';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(civicStore.getCurrentUser());
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<IssueCategory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals for Officer/Worker actions
  const [activeIssueForAction, setActiveIssueForAction] = useState<CivicIssue | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);

  // Admin Tab State
  const [adminTab, setAdminTab] = useState<'overview' | 'categories' | 'departments' | 'rules' | 'audit'>('overview');

  useEffect(() => {
    const update = () => {
      setCurrentUser(civicStore.getCurrentUser());
      setIssues(civicStore.getIssues());
      setDepartments(civicStore.getDepartments());
      setCategories(civicStore.getCategories());
      setAuditLogs(civicStore.getAuditLogs());
    };
    update();
    const unsub = civicStore.subscribe(update);
    return unsub;
  }, []);

  const metrics = civicStore.getConstituencyMetrics();
  const recurringClusters = civicStore.getRecurringIssues();

  // Category chart data
  const categoryChartData = Object.entries(metrics.categoryCounts).map(([name, count]) => ({
    name: name.split(' ')[0], // short name
    fullName: name,
    count,
  }));

  // Status chart data
  const statusChartData = [
    { name: 'Submitted / Assigned', value: metrics.submitted, color: '#3b82f6' },
    { name: 'In Progress', value: metrics.inProgress, color: '#f59e0b' },
    { name: 'Resolved / Closed', value: metrics.resolved, color: '#10b981' },
    { name: 'Reopened', value: metrics.reopened, color: '#ec4899' },
    { name: 'Escalated', value: metrics.escalated, color: '#ef4444' },
  ];

  // Officer Queue
  const officerQueue = issues.filter(
    (i) => !currentUser.department_id || i.department_id === currentUser.department_id
  );

  // Field Worker Queue
  const fieldWorkerTasks = issues.filter(
    (i) => i.assigned_field_worker_id === currentUser.id
  );

  // Reset Demo Data
  const handleResetData = async () => {
    if (confirm('Reset all civic data back to initial seed dataset?')) {
      civicStore.resetToDemoSeed();
      try {
        await fetch('/api/admin/seed', { method: 'POST' });
      } catch {}
      alert('CivicLens demo database has been refreshed to seed state.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Dashboard Header with Role Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {(currentUser?.role || 'citizen').replace('_', ' ')} Dashboard
              </span>
              {currentUser?.department_name && (
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {currentUser.department_name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {currentUser?.role === 'representative'
                ? 'Constituency Civic Oversight Dashboard'
                : currentUser?.role === 'officer'
                ? 'Department Operational Management'
                : currentUser?.role === 'field_worker'
                ? 'Field Worker Task Management'
                : currentUser?.role === 'admin'
                ? 'CivicLens System Administration'
                : 'Citizen Civic Dashboard'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome, <strong className="text-slate-800">{currentUser?.full_name || 'Citizen'}</strong>. Real-time data connected directly to municipal accountability workflows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' && (
              <button
                onClick={handleResetData}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Reset Demo Seed
              </button>
            )}

            {currentUser.role === 'citizen' && (
              <Link
                href="/report"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
              >
                <PlusCircle className="w-4 h-4" /> Report New Issue
              </Link>
            )}
          </div>
        </div>

        {/* ====================================================================
            ROLE 1: CITIZEN DASHBOARD VIEW
           ==================================================================== */}
        {currentUser.role === 'citizen' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">My Total Complaints</span>
                <span className="text-2xl font-bold text-slate-900 block mt-1">
                  {issues.filter((i) => i.citizen_id === currentUser.id).length}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-amber-600 font-medium">Active in Progress</span>
                <span className="text-2xl font-bold text-slate-900 block mt-1">
                  {issues.filter((i) => i.citizen_id === currentUser.id && !['resolved', 'closed'].includes(i.status)).length}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-emerald-600 font-medium">Awaiting My Verification</span>
                <span className="text-2xl font-bold text-emerald-700 block mt-1">
                  {issues.filter((i) => i.citizen_id === currentUser.id && i.status === 'resolved').length}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">Closed & Verified</span>
                <span className="text-2xl font-bold text-slate-900 block mt-1">
                  {issues.filter((i) => i.citizen_id === currentUser.id && i.status === 'closed').length}
                </span>
              </div>
            </div>

            {/* Quick Actions & Recent Complaints */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recent Complaints
                </h2>
                <Link href="/my-complaints" className="text-xs text-blue-600 hover:underline font-semibold">
                  View All &rarr;
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {issues
                  .filter((i) => i.citizen_id === currentUser.id)
                  .slice(0, 4)
                  .map((issue) => (
                    <div key={issue.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-blue-700">
                            {issue.complaint_code}
                          </span>
                          <StatusBadge status={issue.status} />
                        </div>
                        <h4 className="font-semibold text-xs text-slate-900">{issue.title}</h4>
                        <span className="text-[11px] text-slate-400">
                          {issue.location_text} • {new Date(issue.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Link
                        href={`/issues/${issue.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition shrink-0"
                      >
                        Track
                      </Link>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            ROLE 2: DEPARTMENT OFFICER DASHBOARD
           ==================================================================== */}
        {currentUser.role === 'officer' && (
          <div className="space-y-6">
            {/* Operational Queue Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Department Queue</span>
                <span className="text-xl font-bold text-slate-900 block mt-0.5">{officerQueue.length}</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-blue-600 block">New / Assigned</span>
                <span className="text-xl font-bold text-slate-900 block mt-0.5">
                  {officerQueue.filter((i) => ['submitted', 'assigned'].includes(i.status)).length}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-amber-600 block">In Progress</span>
                <span className="text-xl font-bold text-slate-900 block mt-0.5">
                  {officerQueue.filter((i) => i.status === 'in_progress').length}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-red-600 block">SLA Overdue</span>
                <span className="text-xl font-bold text-red-600 block mt-0.5">
                  {officerQueue.filter((i) => i.is_overdue).length}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-emerald-600 block">Resolved (Verif.)</span>
                <span className="text-xl font-bold text-emerald-700 block mt-0.5">
                  {officerQueue.filter((i) => i.status === 'resolved').length}
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-rose-600 block">Reopened / Esc.</span>
                <span className="text-xl font-bold text-rose-700 block mt-0.5">
                  {officerQueue.filter((i) => ['reopened', 'escalated'].includes(i.status)).length}
                </span>
              </div>
            </div>

            {/* Department Action Queue Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Department Operational Queue</h3>
                  <p className="text-[11px] text-slate-500">
                    Complaints routed to {currentUser.department_name || 'your division'}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                  {officerQueue.length} Complaints
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-semibold tracking-wider">
                      <th className="py-3 px-4">Complaint</th>
                      <th className="py-3 px-4">Ward & Area</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assigned Field Worker</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {officerQueue.map((issue) => (
                      <tr key={issue.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/issues/${issue.id}`}
                              className="font-mono font-bold text-blue-700 hover:underline block"
                            >
                              {issue.complaint_code}
                            </Link>
                            {issue.ai_verification_status === 'flagged_ai' && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1 py-0.5 rounded" title="Flagged by AI Image Authenticity Detector">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                AI Flagged
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-slate-900 line-clamp-1 max-w-xs block mt-0.5">
                            {issue.title}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {issue.jurisdiction_name}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <SeverityBadge severity={issue.severity} />
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge status={issue.status} />
                        </td>
                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                          {issue.assigned_field_worker_name || (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => {
                              setActiveIssueForAction(issue);
                              setShowAssignModal(true);
                            }}
                            className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold"
                          >
                            Assign Tech
                          </button>
                          {issue.status !== 'resolved' && issue.status !== 'closed' && (
                            <button
                              onClick={() => {
                                setActiveIssueForAction(issue);
                                setShowResolveModal(true);
                              }}
                              className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            ROLE 3: FIELD WORKER MOBILE-FIRST VIEW
           ==================================================================== */}
        {currentUser.role === 'field_worker' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 block">
                  Field Depot: Velachery / Adyar Division
                </span>
                <span className="text-[11px] text-amber-700">
                  {fieldWorkerTasks.length} task(s) currently assigned to you for ground execution
                </span>
              </div>
              <HardHat className="w-8 h-8 text-amber-600" />
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                My Assigned Field Tasks
              </h2>

              {fieldWorkerTasks.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                  No field tasks are currently assigned to you.
                </div>
              ) : (
                fieldWorkerTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {task.complaint_code}
                      </span>
                      <StatusBadge status={task.status} />
                    </div>

                    <h3 className="font-bold text-sm text-slate-900">{task.title}</h3>
                    <p className="text-xs text-slate-600">{task.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {task.location_text}
                      </span>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Directions
                      </a>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <Link
                        href={`/issues/${task.id}`}
                        className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                      >
                        View Full Details &rarr;
                      </Link>

                      <button
                        onClick={() => {
                          setActiveIssueForAction(task);
                          setShowFieldModal(true);
                        }}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5"
                      >
                        <Wrench className="w-4 h-4" /> Update Progress & Photo
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            ROLE 4: REPRESENTATIVE OFFICE (CONSTITUENCY OVERSIGHT)
           ==================================================================== */}
        {currentUser.role === 'representative' && (
          <div className="space-y-6">
            {/* Descriptive Accountability Metrics (Section 29) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block">Total Complaints</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">{metrics.total}</span>
                <span className="text-[10px] text-slate-400">Recorded across constituency</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-emerald-600 block">Resolution Rate</span>
                <span className="text-2xl font-bold text-emerald-600 mt-1 block">{metrics.resolutionRate}%</span>
                <span className="text-[10px] text-slate-400">{metrics.resolved} of {metrics.total} resolved</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-amber-600 block">Average Turnaround</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">{metrics.avgResolutionDays} days</span>
                <span className="text-[10px] text-slate-400">Avg recorded time to resolve</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-rose-600 block">Citizen Reopened</span>
                <span className="text-2xl font-bold text-rose-600 mt-1 block">{metrics.reopened}</span>
                <span className="text-[10px] text-slate-400">Rejected initial closure</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-red-600 block">Escalated Tickets</span>
                <span className="text-2xl font-bold text-red-600 mt-1 block">{metrics.escalated}</span>
                <span className="text-[10px] text-slate-400">Pending commissioner action</span>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution Chart */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Complaints by Issue Category</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData}>
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Breakdown Pie Chart */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Current Status Distribution</h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* RECURRING ISSUE DETECTION ENGINE (Section 27) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-purple-600" />
                    Recurring Issue Hotspots (Automated Spatial Clustering)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Identifies civic problems occurring repeatedly within 400 meters to uncover systemic infrastructure defects.
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
                  {recurringClusters.length} Clusters Detected
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {recurringClusters.map((cluster) => (
                  <div key={cluster.clusterKey} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded">
                          {cluster.occurrenceCount} Occurrences
                        </span>
                        <span className="font-bold text-xs text-slate-900">{cluster.categoryName}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        First reported: {new Date(cluster.firstReported).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium">
                      Location: {cluster.locationName}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {cluster.issues.map((i) => (
                        <Link
                          key={i.id}
                          href={`/issues/${i.id}`}
                          className="font-mono text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2 py-0.5 rounded border border-slate-200"
                        >
                          {i.complaint_code} ({i.status})
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            ROLE 5: ADMIN DASHBOARD VIEW
           ==================================================================== */}
        {currentUser.role === 'admin' && (
          <div className="space-y-6">
            {/* Admin Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto gap-4 text-xs font-semibold">
              <button
                onClick={() => setAdminTab('overview')}
                className={`pb-2 transition ${
                  adminTab === 'overview'
                    ? 'border-b-2 border-purple-600 text-purple-700'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                System Overview
              </button>
              <button
                onClick={() => setAdminTab('categories')}
                className={`pb-2 transition ${
                  adminTab === 'categories'
                    ? 'border-b-2 border-purple-600 text-purple-700'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Categories & SLA Rules
              </button>
              <button
                onClick={() => setAdminTab('departments')}
                className={`pb-2 transition ${
                  adminTab === 'departments'
                    ? 'border-b-2 border-purple-600 text-purple-700'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Departments & Jurisdictions
              </button>
              <button
                onClick={() => setAdminTab('audit')}
                className={`pb-2 transition ${
                  adminTab === 'audit'
                    ? 'border-b-2 border-purple-600 text-purple-700'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Immutable Audit Logs ({auditLogs.length})
              </button>
            </div>

            {/* TAB: Overview */}
            {adminTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-500 font-medium">Departments</span>
                    <span className="text-2xl font-bold text-slate-900 block mt-1">{departments.length}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-500 font-medium">Categories</span>
                    <span className="text-2xl font-bold text-slate-900 block mt-1">{categories.length}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-500 font-medium">Total Complaints</span>
                    <span className="text-2xl font-bold text-slate-900 block mt-1">{issues.length}</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-xs text-slate-500 font-medium">Audit Events</span>
                    <span className="text-2xl font-bold text-purple-700 block mt-1">{auditLogs.length}</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                  <h3 className="font-bold text-sm text-slate-900 mb-3">Live Issue Registry Overview</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold">
                          <th className="py-2.5 px-3">Complaint</th>
                          <th className="py-2.5 px-3">Citizen</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {issues.slice(0, 6).map((i) => (
                          <tr key={i.id}>
                            <td className="py-2 px-3 font-mono font-bold text-blue-700">{i.complaint_code}</td>
                            <td className="py-2 px-3">{i.citizen_name}</td>
                            <td className="py-2 px-3">{i.category_name}</td>
                            <td className="py-2 px-3"><StatusBadge status={i.status} /></td>
                            <td className="py-2 px-3">
                              <Link href={`/issues/${i.id}`} className="text-blue-600 hover:underline">
                                Inspect &rarr;
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Audit Logs */}
            {adminTab === 'audit' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-900">System Audit Trail</h3>
                <p className="text-xs text-slate-500">
                  Every status transition, assignment, verification, and escalation is audited permanently.
                </p>
                <div className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-3 text-xs flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{log.action}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded capitalize">
                            {log.actor_role} • {log.actor_email}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1">
                          Entity: {log.entity_type} ({log.entity_id})
                        </p>
                      </div>
                      <time className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </time>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Categories & SLA */}
            {adminTab === 'categories' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Configured Issue Categories & SLA</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{c.name}</span>
                        <CategoryIcon code={c.code} className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xs text-slate-500">{c.description}</p>
                      <div className="pt-2 flex justify-between text-xs text-slate-600">
                        <span>Ack Target: {c.default_sla_acknowledgement_hours} hours</span>
                        <span>Resolution SLA: {c.default_sla_resolution_days} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: Departments */}
            {adminTab === 'departments' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Active Municipal Departments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {departments.map((d) => (
                    <div key={d.id} className="p-4 rounded-xl border border-slate-200 space-y-1">
                      <span className="font-bold text-sm text-slate-900">{d.name}</span>
                      <p className="text-xs text-slate-500">{d.description}</p>
                      <div className="text-[11px] text-slate-400 pt-1">
                        Contact: {d.contact_email} • {d.contact_phone}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {activeIssueForAction && (
        <>
          <AssignFieldWorkerModal
            complaintCode={activeIssueForAction.complaint_code}
            isOpen={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            onAssign={(workerId, note) => {
              civicStore.assignFieldWorker(activeIssueForAction.id, workerId, note);
            }}
          />

          <ResolveModal
            complaintCode={activeIssueForAction.complaint_code}
            isOpen={showResolveModal}
            onClose={() => setShowResolveModal(false)}
            onResolve={(note, photo) => {
              civicStore.markOfficerResolved(activeIssueForAction.id, note, photo);
            }}
          />

          <FieldWorkModal
            complaintCode={activeIssueForAction.complaint_code}
            isOpen={showFieldModal}
            onClose={() => setShowFieldModal(false)}
            onSubmit={(notes, photo, isComp) => {
              civicStore.submitFieldWork(activeIssueForAction.id, notes, photo, isComp);
            }}
          />
        </>
      )}
    </div>
  );
}
