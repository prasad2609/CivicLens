'use client';

import React, { useState } from 'react';
import { Wrench, X, Camera, CheckCircle2 } from 'lucide-react';

interface FieldWorkModalProps {
  complaintCode: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string, photoDataUrl?: string, isCompleted?: boolean) => void;
}

export const FieldWorkModal: React.FC<FieldWorkModalProps> = ({
  complaintCode,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [notes, setNotes] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
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
    if (!notes.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      onSubmit(notes, photoDataUrl || undefined, isCompleted);
      setSubmitting(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-amber-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-white" />
            <h3 className="font-bold text-base">Field Work Report</h3>
          </div>
          <button onClick={onClose} className="text-amber-100 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs text-slate-600">
            Updating on-site progress for complaint <strong className="text-slate-900">{complaintCode}</strong>.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Observations & Actions Taken *
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Site visited with 3 crew members. Debris cleared, bituminous cold patch compacted..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Upload Site Work Photograph
            </label>
            {photoDataUrl ? (
              <div className="relative inline-block">
                <img
                  src={photoDataUrl}
                  alt="Site work proof"
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
                <Camera className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-slate-700">Capture site work photo with camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Mark Field Task Completed
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Signals department officer that physical repairs are finished
                </span>
              </div>
            </label>
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
              disabled={submitting || !notes.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-md transition flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Submitting...' : isCompleted ? 'Complete Field Task' : 'Save Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
