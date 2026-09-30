'use client';

import React, { useState } from 'react';
import { X, HardHat, Send } from 'lucide-react';
import { DEMO_USERS } from '@/data/mockData';

interface AssignModalProps {
  complaintCode: string;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (workerId: string, note: string) => void;
}

export const AssignFieldWorkerModal: React.FC<AssignModalProps> = ({
  complaintCode,
  isOpen,
  onClose,
  onAssign,
}) => {
  const fieldWorkers = DEMO_USERS.filter((u) => u.role === 'field_worker');
  const [selectedWorkerId, setSelectedWorkerId] = useState(fieldWorkers[0]?.id || '');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId) return;
    setSubmitting(true);
    setTimeout(() => {
      onAssign(selectedWorkerId, note);
      setSubmitting(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Assign Field Technician</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-slate-600">
            Dispatching field crew for complaint <strong className="text-slate-900">{complaintCode}</strong>.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Field Technician / Depot Crew *
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {fieldWorkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name} ({w.area})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instructions & Safety Notes
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g., Inspect trench depth, deploy safety cones, repair with asphalt cold-mix..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Dispatching...' : 'Dispatch Field Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
