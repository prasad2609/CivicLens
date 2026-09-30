'use client';

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface EscalationModalProps {
  complaintCode: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}

const ESCALATION_REASONS = [
  'Statutory SLA resolution target exceeded without progress',
  'Issue marked resolved by department but defect remains unaddressed',
  'Severe public health / immediate life-safety hazard',
  'Bounced between departments without accountability',
  'Chronic recurring issue with temporary ineffective patches',
];

export const EscalationModal: React.FC<EscalationModalProps> = ({
  complaintCode,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState(ESCALATION_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(selectedReason, details);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-red-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-red-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-200" />
            <h3 className="font-bold text-base">Escalate Complaint to High Authority</h3>
          </div>
          <button onClick={onClose} className="text-red-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-900">
            <p className="font-semibold mb-0.5">Escalating: {complaintCode}</p>
            <p>
              Escalating routes this complaint directly to the Zonal Municipal Commissioner and Constituency Representative Office for priority intervention and administrative audit.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-2">
              Select Primary Escalation Reason *
            </label>
            <div className="space-y-2">
              {ESCALATION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    selectedReason === reason
                      ? 'border-red-600 bg-red-50/60 text-red-950 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="escalation_reason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="mt-0.5 text-red-600 focus:ring-red-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Specific Grounds & Circumstances *
            </label>
            <textarea
              required
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain how this issue has impacted citizens and why standard departmental workflow was inadequate..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !details.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-md transition flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? 'Filing Escalation...' : 'Submit Official Escalation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
