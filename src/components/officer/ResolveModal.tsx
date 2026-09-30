'use client';

import React, { useState } from 'react';
import { ShieldCheck, X, Upload } from 'lucide-react';

interface ResolveModalProps {
  complaintCode: string;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (officialNote: string, proofPhotoUrl?: string) => void;
}

export const ResolveModal: React.FC<ResolveModalProps> = ({
  complaintCode,
  isOpen,
  onClose,
  onResolve,
}) => {
  const [note, setNote] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoDataUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      onResolve(note, photoDataUrl || undefined);
      setSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-emerald-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-emerald-800 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-base">Mark Work as Resolved</h3>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
            <p className="font-semibold mb-0.5">Complaint {complaintCode}</p>
            <p>
              Submitting resolution will notify the citizen to inspect and verify the outcome. The complaint will only be closed once verified by the citizen.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Resolution Report & Work Details *
            </label>
            <textarea
              required
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Detail the repairs completed, materials used, inspection results, and date of clearance..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Resolution Evidence Photo
            </label>
            {photoDataUrl ? (
              <div className="relative inline-block">
                <img
                  src={photoDataUrl}
                  alt="Resolution proof"
                  className="w-36 h-24 object-cover rounded-md border border-emerald-200"
                />
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl(null)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-0.5 shadow"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-md text-xs text-slate-600 cursor-pointer hover:bg-slate-50 transition">
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Attach completed repair work photograph</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
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
              disabled={submitting || !note.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition flex items-center gap-1.5 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Mark Resolved & Notify Citizen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
