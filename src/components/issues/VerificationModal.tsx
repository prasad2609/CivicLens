'use client';

import React, { useState } from 'react';
import { VerificationResult } from '@/types';
import { CheckCircle2, RotateCcw, AlertTriangle, Upload, X, ShieldAlert } from 'lucide-react';

interface VerificationModalProps {
  complaintCode: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: VerificationResult, comment: string, photoDataUrl?: string) => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  complaintCode,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [result, setResult] = useState<VerificationResult>('completely_resolved');
  const [comment, setComment] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(result, comment, photoDataUrl || undefined);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Citizen Resolution Verification</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-semibold mb-0.5">Complaint {complaintCode}</p>
            <p>
              The municipal authority has marked this issue as resolved. CivicLens ensures accountability by requiring your verification before closing this ticket.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Has this issue actually been resolved?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setResult('completely_resolved')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition ${
                  result === 'completely_resolved'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <CheckCircle2
                    className={`w-5 h-5 ${
                      result === 'completely_resolved' ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Close</span>
                </div>
                <div className="font-semibold text-xs">Completely Resolved</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Work verified satisfactory</div>
              </button>

              <button
                type="button"
                onClick={() => setResult('partially_resolved')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition ${
                  result === 'partially_resolved'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <RotateCcw
                    className={`w-5 h-5 ${
                      result === 'partially_resolved' ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-[10px] font-bold uppercase text-amber-700">Reopen</span>
                </div>
                <div className="font-semibold text-xs">Partially Resolved</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Pending finishing work</div>
              </button>

              <button
                type="button"
                onClick={() => setResult('not_resolved')}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition ${
                  result === 'not_resolved'
                    ? 'border-rose-600 bg-rose-50/70 text-rose-900 ring-2 ring-rose-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <AlertTriangle
                    className={`w-5 h-5 ${
                      result === 'not_resolved' ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-[10px] font-bold uppercase text-rose-700">Reject</span>
                </div>
                <div className="font-semibold text-xs">Not Resolved</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Hazard remains unchanged</div>
              </button>
            </div>
          </div>

          {/* Comment input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {result === 'completely_resolved'
                ? 'Feedback / Notes (Optional)'
                : 'Reason / What remains unresolved? *'}
            </label>
            <textarea
              required={result !== 'completely_resolved'}
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                result === 'completely_resolved'
                  ? 'E.g., Well done, potholes patched and road surface cleared.'
                  : 'E.g., Debris was removed but deep trench was left unfilled. Poses trip hazard.'
              }
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Photo rebuttal upload for Reopening */}
          {result !== 'completely_resolved' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Proof Photo (Recommended)
              </label>
              {photoDataUrl ? (
                <div className="relative inline-block">
                  <img
                    src={photoDataUrl}
                    alt="Rebuttal proof"
                    className="w-32 h-24 object-cover rounded-md border border-slate-200"
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
                  <span>Attach photo showing ground reality</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

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
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-md transition flex items-center gap-1.5 shadow-sm ${
                result === 'completely_resolved'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? (
                'Processing...'
              ) : result === 'completely_resolved' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Close Ticket
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" /> Reopen Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
