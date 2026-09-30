'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { civicStore } from '@/lib/store';
import { PublicProject, CivicIssue } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<PublicProject | undefined>(undefined);
  const [relatedIssues, setRelatedIssues] = useState<CivicIssue[]>([]);

  useEffect(() => {
    const projects = civicStore.getProjects();
    const found = projects.find((p) => p.id === id);
    setProject(found);

    if (found) {
      // Find related issues in the same ward or matching category
      const issues = civicStore.getIssues();
      const matched = issues.filter(
        (i) => i.location_text.toLowerCase().includes(found.location.toLowerCase().split(' ')[0])
      );
      setRelatedIssues(matched);
    }
  }, [id]);

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-md">
          <h2 className="text-lg font-bold text-slate-900">Project Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Could not find public project record matching reference &quot;{id}&quot;.
          </p>
          <Link
            href="/projects"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((project.expenditure / project.approved_amount) * 100));
  const remaining = Math.max(0, project.approved_amount - project.expenditure);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/projects"
            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-medium mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Public Projects Directory
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
              Demo Project Record
            </span>
            <span className="text-xs text-slate-500 capitalize">{project.status.replace('_', ' ')}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {project.name}
          </h1>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold block">Sanctioned Outlay</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              ₹{(project.approved_amount / 100000).toFixed(2)} Lakh
            </span>
            <span className="text-[11px] text-slate-400">Total government allocation</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-blue-600 font-semibold block">Recorded Disbursements</span>
            <span className="text-2xl font-bold text-blue-700 mt-1 block">
              ₹{(project.expenditure / 100000).toFixed(2)} Lakh ({percent}%)
            </span>
            <span className="text-[11px] text-slate-400">Audited contractor payments</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold block">Remaining Allocation</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              ₹{(remaining / 100000).toFixed(2)} Lakh
            </span>
            <span className="text-[11px] text-slate-400">Retained for final commissioning</span>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Scope of Work & Specification
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Timeline Progress Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Milestones & Timeline Schedule
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Sanctioned Date</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Ground Start</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {new Date(project.start_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Completion</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {new Date(project.expected_completion).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Civic Complaints in Project Area */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Citizen Complaints in Vicinity ({relatedIssues.length})
              </h2>
              {relatedIssues.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No active citizen complaints currently linked to this project sector.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {relatedIssues.map((issue) => (
                    <div key={issue.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <Link href={`/issues/${issue.id}`} className="font-mono font-bold text-blue-700 hover:underline">
                          {issue.complaint_code}
                        </Link>
                        <span className="text-slate-800 ml-2 font-medium">{issue.title}</span>
                      </div>
                      <StatusBadge status={issue.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Specifications */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Contractual Specifications
              </h3>
              <div className="space-y-2.5 divide-y divide-slate-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Executing Agency:</span>
                  <span className="font-semibold text-slate-900 text-right">{project.agency}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Sector / Category:</span>
                  <span className="font-semibold text-slate-900 text-right">{project.category}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Funding Scheme:</span>
                  <span className="font-semibold text-slate-900 text-right">{project.funding_source}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Tender Reference:</span>
                  <span className="font-mono text-slate-700 text-right">{project.source_reference || 'N/A'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-semibold text-slate-900 text-right">{project.location}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-5 text-xs space-y-2">
              <span className="font-bold text-amber-400 block">Civic Transparency Compliance</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Under CivicLens Open Governance guidelines, all public tenders and infrastructure disbursements are verified against ground progress reports.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
