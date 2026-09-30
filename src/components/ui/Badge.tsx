import React from 'react';
import {
  Construction,
  Trash2,
  Waves,
  Droplets,
  Lightbulb,
  Building,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { IssueStatus, IssueSeverity } from '@/types';

export const CategoryIcon: React.FC<{ code?: string; className?: string }> = ({
  code,
  className = 'w-5 h-5',
}) => {
  switch (code?.toUpperCase()) {
    case 'ROADS':
      return <Construction className={className} />;
    case 'GARBAGE':
      return <Trash2 className={className} />;
    case 'DRAINAGE':
      return <Waves className={className} />;
    case 'WATER':
      return <Droplets className={className} />;
    case 'LIGHTS':
      return <Lightbulb className={className} />;
    case 'FACILITIES':
      return <Building className={className} />;
    default:
      return <AlertTriangle className={className} />;
  }
};

export const StatusBadge: React.FC<{ status: IssueStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const configMap: Record<
    IssueStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    submitted: {
      label: 'Submitted',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: <Clock className="w-3.5 h-3.5 mr-1" />,
    },
    under_verification: {
      label: 'Under Verification',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      icon: <HelpCircle className="w-3.5 h-3.5 mr-1" />,
    },
    assigned: {
      label: 'Assigned',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: <Clock className="w-3.5 h-3.5 mr-1" />,
    },
    acknowledged: {
      label: 'Acknowledged',
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      icon: <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 animate-spin" />,
    },
    awaiting_information: {
      label: 'Awaiting Info',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: <HelpCircle className="w-3.5 h-3.5 mr-1" />,
    },
    resolved: {
      label: 'Resolved (Awaiting Verification)',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300 font-medium',
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />,
    },
    reopened: {
      label: 'Reopened',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-300 font-semibold',
      icon: <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />,
    },
    escalated: {
      label: 'Escalated',
      bg: 'bg-red-100',
      text: 'text-red-900',
      border: 'border-red-400 font-bold',
      icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-700" />,
    },
    closed: {
      label: 'Closed',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-slate-500" />,
    },
  };

  const item = configMap[status] || {
    label: status,
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: null,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${item.bg} ${item.text} ${item.border} ${className}`}
    >
      {item.icon}
      {item.label}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: IssueSeverity; className?: string }> = ({
  severity,
  className = '',
}) => {
  const map: Record<IssueSeverity, { label: string; style: string }> = {
    low: { label: 'Low Severity', style: 'bg-slate-100 text-slate-700 border-slate-200' },
    medium: { label: 'Medium Severity', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    high: { label: 'High Severity', style: 'bg-amber-100 text-amber-800 border-amber-300 font-medium' },
    critical: { label: 'Critical Hazard', style: 'bg-red-100 text-red-800 border-red-300 font-semibold' },
  };

  const item = map[severity] || map.medium;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${item.style} ${className}`}
    >
      {item.label}
    </span>
  );
};
