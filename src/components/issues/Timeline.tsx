'use client';

import React from 'react';
import { TimelineEvent } from '@/types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Wrench,
  RotateCcw,
  FileText,
} from 'lucide-react';

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  // Sort oldest to newest for chronological flow
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const getEventBadge = (event: TimelineEvent) => {
    const type = event.event_type.toUpperCase();

    if (type.includes('SUBMITTED')) {
      return {
        icon: <Clock className="w-4 h-4 text-blue-600" />,
        bg: 'bg-blue-100',
        title: 'Complaint Submitted',
      };
    }
    if (type.includes('ROUTED')) {
      return {
        icon: <ArrowRight className="w-4 h-4 text-indigo-600" />,
        bg: 'bg-indigo-100',
        title: 'Smart Authority Routed',
      };
    }
    if (type.includes('ACKNOWLEDGED')) {
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-sky-600" />,
        bg: 'bg-sky-100',
        title: 'Officer Acknowledged',
      };
    }
    if (type.includes('FIELD') || type.includes('WORK')) {
      return {
        icon: <Wrench className="w-4 h-4 text-amber-600" />,
        bg: 'bg-amber-100',
        title: 'Field Worker Action',
      };
    }
    if (type.includes('RESOLVED')) {
      return {
        icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
        bg: 'bg-emerald-100',
        title: 'Marked Resolved by Authority',
      };
    }
    if (type.includes('CLOSED')) {
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-slate-700" />,
        bg: 'bg-slate-200',
        title: 'Citizen Verified & Closed',
      };
    }
    if (type.includes('REOPENED')) {
      return {
        icon: <RotateCcw className="w-4 h-4 text-rose-600" />,
        bg: 'bg-rose-100',
        title: 'Citizen Rejected Resolution (Reopened)',
      };
    }
    if (type.includes('ESCALAT')) {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
        bg: 'bg-red-100',
        title: 'Complaint Escalated',
      };
    }

    return {
      icon: <FileText className="w-4 h-4 text-slate-600" />,
      bg: 'bg-slate-100',
      title: event.event_type.replace(/_/g, ' '),
    };
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sorted.map((event, idx) => {
          const isLast = idx === sorted.length - 1;
          const meta = getEventBadge(event);

          return (
            <li key={event.id || idx}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3 items-start">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${meta.bg}`}
                    >
                      {meta.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{meta.title}</span>
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded capitalize">
                          {event.actor_role} • {event.actor_name}
                        </span>
                      </div>
                      <time className="text-slate-400">
                        {new Date(event.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>

                    {event.note && (
                      <p className="mt-1 text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-md leading-relaxed">
                        {event.note}
                      </p>
                    )}

                    {event.evidence_url && (
                      <div className="mt-2">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1">
                          Attached Proof Photo:
                        </span>
                        <img
                          src={event.evidence_url}
                          alt="Timeline update evidence"
                          className="w-36 h-24 object-cover rounded-md border border-slate-200 shadow-xs hover:scale-105 transition cursor-pointer"
                          onClick={() => window.open(event.evidence_url, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
