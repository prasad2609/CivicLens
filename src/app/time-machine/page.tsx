'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Camera,
  CheckCircle2,
  AlertCircle,
  Star,
  Calendar,
  Layers,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Eye,
  Plus,
} from 'lucide-react';
import { TimeMachineLocationRecord, TimeMachineSnapshot, TimeMachinePhase } from '@/types';
import { civicStore } from '@/lib/store';

export default function TimeMachinePage() {
  const [records, setRecords] = useState<TimeMachineLocationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<TimeMachineLocationRecord | null>(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Snapshot modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phaseType, setPhaseType] = useState<TimeMachinePhase>('30_day_check');
  const [snapshotTitle, setSnapshotTitle] = useState('30-Day Durability Ground Audit');
  const [snapshotNotes, setSnapshotNotes] = useState('Surface bitumen holding firm; no subsidence detected under monsoonal vehicle loads.');
  const [snapshotScore, setSnapshotScore] = useState('92');
  const [snapshotPhotoUrl, setSnapshotPhotoUrl] = useState('/images/evidence/velachery-pothole-fixed.jpg');

  useEffect(() => {
    fetchRecords();
    const unsub = civicStore.subscribe(fetchRecords);
    return unsub;
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/time-machine');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        if (data.records && data.records.length > 0 && !selectedRecord) {
          setSelectedRecord(data.records[0]);
        }
      } else {
        const local = civicStore.getTimeMachineRecords();
        setRecords(local);
        if (local.length > 0 && !selectedRecord) setSelectedRecord(local[0]);
      }
    } catch {
      const local = civicStore.getTimeMachineRecords();
      setRecords(local);
      if (local.length > 0 && !selectedRecord) setSelectedRecord(local[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    const newSnapshot: TimeMachineSnapshot = {
      phase: phaseType,
      title: snapshotTitle,
      date: new Date().toISOString().split('T')[0],
      photo_url: snapshotPhotoUrl,
      notes: snapshotNotes,
      recorded_by: civicStore.getCurrentUser().full_name,
      status_label: 'Audited & Verified',
      durability_score: Number(snapshotScore) || 90,
    };

    try {
      const res = await fetch(`/api/time-machine/${selectedRecord.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSnapshot),
      });

      if (res.ok) {
        const data = await res.json();
        civicStore.addTimeMachineSnapshot(selectedRecord.id, newSnapshot);
        setSelectedRecord(data.record);
      } else {
        const updated = civicStore.addTimeMachineSnapshot(selectedRecord.id, newSnapshot);
        if (updated) setSelectedRecord(updated);
      }
      setIsModalOpen(false);
      fetchRecords();
    } catch {
      civicStore.addTimeMachineSnapshot(selectedRecord.id, newSnapshot);
      setIsModalOpen(false);
      fetchRecords();
    }
  };

  const activeSnapshot = selectedRecord?.snapshots[activePhaseIndex] || selectedRecord?.snapshots[0];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-cyan-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <Clock className="w-3.5 h-3.5" />
                Innovation 2 • Temporal Durability Auditing
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Civic Time Machine
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Inspect physical locations across time: Before defect, During intervention, After completion,
                and mandatory 30-Day and 180-Day durability audits to prevent cosmetic or phantom repairs.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add Durability Check
              </button>
            </div>
          </div>
        </div>

        {/* Location Selector Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-slate-200">
          {records.map((rec) => {
            const isSelected = selectedRecord?.id === rec.id;
            return (
              <button
                key={rec.id}
                onClick={() => {
                  setSelectedRecord(rec);
                  setActivePhaseIndex(0);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{rec.location_title}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${isSelected ? 'bg-teal-700' : 'bg-slate-100'}`}>
                  {rec.snapshots.length} phases
                </span>
              </button>
            );
          })}
        </div>

        {selectedRecord && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Main Interactive Time Machine Viewer */}
            <div className="lg:col-span-2 space-y-6">
              {/* Temporal Phase Selector Bar */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-2 overflow-x-auto">
                {selectedRecord.snapshots.map((snap, idx) => {
                  const isActive = idx === activePhaseIndex;
                  return (
                    <button
                      key={snap.phase + idx}
                      onClick={() => setActivePhaseIndex(idx)}
                      className={`flex-1 min-w-[120px] p-2.5 rounded-xl text-center transition border ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
                        {snap.phase.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-extrabold block truncate mt-0.5">
                        {snap.title.split(' ')[0]}
                      </span>
                      <span className="text-[10px] opacity-60 block mt-0.5">{snap.date}</span>
                    </button>
                  );
                })}
              </div>

              {/* Photo Display Card */}
              {activeSnapshot && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-4">
                  <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden group">
                    <img
                      src={activeSnapshot.photo_url}
                      alt={activeSnapshot.title}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // fallback visual SVG if local image not present
                        (e.target as any).src =
                          'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1000&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Snapshot Overlay Tag */}
                    <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-white/20 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                      <span className="uppercase tracking-wider">{activeSnapshot.phase.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{activeSnapshot.date}</span>
                    </div>

                    {activeSnapshot.durability_score && (
                      <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md">
                        Durability: {activeSnapshot.durability_score}/100
                      </div>
                    )}
                  </div>

                  {/* Snapshot Details */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{activeSnapshot.title}</h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Recorded by: <strong className="text-slate-700">{activeSnapshot.recorded_by}</strong> on {activeSnapshot.date}
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        {activeSnapshot.status_label}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-1">
                        Inspector & Auditor Observation Notes:
                      </strong>
                      "{activeSnapshot.notes}"
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Durability Verdict & Timeline Checkpoints */}
            <div className="space-y-6">
              {/* Durability Verdict Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Durability Scorecard
                  </span>
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(selectedRecord.durability_rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedRecord.location_title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedRecord.ward_name}</p>
                </div>

                <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-teal-800">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    Civic Durability Verdict
                  </div>
                  <p className="leading-relaxed font-medium">{selectedRecord.durability_verdict}</p>
                </div>

                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    All Recorded Checkpoints ({selectedRecord.snapshots.length})
                  </span>

                  <div className="space-y-2.5">
                    {selectedRecord.snapshots.map((snap, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePhaseIndex(idx)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                          idx === activePhaseIndex
                            ? 'bg-blue-50 border-blue-300 font-semibold'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          <div>
                            <span className="font-bold text-slate-900 block capitalize">
                              {snap.phase.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-slate-500">{snap.date}</span>
                          </div>
                        </div>

                        {snap.durability_score && (
                          <span className="font-extrabold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded">
                            {snap.durability_score}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedRecord.related_issue_id && (
                  <div className="pt-2 border-t border-slate-100">
                    <Link
                      href={`/issues/${selectedRecord.related_issue_id}`}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                    >
                      <span>View Linked Complaint Ticket</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Durability Snapshot */}
        {isModalOpen && selectedRecord && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add Durability Audit Checkpoint</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedRecord.location_title}</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddSnapshot} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Audit Phase</label>
                  <select
                    value={phaseType}
                    onChange={(e) => setPhaseType(e.target.value as TimeMachinePhase)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                  >
                    <option value="30_day_check">30-Day Durability Check</option>
                    <option value="180_day_check">180-Day Durability Check</option>
                    <option value="after">Field Rectification Complete</option>
                    <option value="during">Active Construction Intervention</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Checkpoint Title</label>
                  <input
                    type="text"
                    required
                    value={snapshotTitle}
                    onChange={(e) => setSnapshotTitle(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Durability Score (1 - 100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={snapshotScore}
                    onChange={(e) => setSnapshotScore(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Durability Audit Notes</label>
                  <textarea
                    rows={3}
                    required
                    value={snapshotNotes}
                    onChange={(e) => setSnapshotNotes(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition shadow-sm"
                  >
                    Save Checkpoint
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
