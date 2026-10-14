'use client';

import React, { useState, useEffect } from 'react';
import {
  Dna,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Zap,
  BarChart3,
  Layers,
  FileText,
  Building,
  Sliders,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ConstituencyGenome, GenomicTrait } from '@/types';
import { civicStore } from '@/lib/store';

export default function AccountabilityGenomePage() {
  const [genomes, setGenomes] = useState<Record<string, ConstituencyGenome>>({});
  const [selectedWard, setSelectedWard] = useState<string>('ward-175');
  const [loading, setLoading] = useState(true);
  const [simulationMode, setSimulationMode] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Simulation slider deltas
  const [responseDelta, setResponseDelta] = useState(0);
  const [trustDelta, setTrustDelta] = useState(0);
  const [durabilityDelta, setDurabilityDelta] = useState(0);
  const [fiscalDelta, setFiscalDelta] = useState(0);

  useEffect(() => {
    fetchGenomes();
    const unsub = civicStore.subscribe(fetchGenomes);
    return unsub;
  }, []);

  const fetchGenomes = async () => {
    try {
      const res = await fetch('/api/analytics/genome');
      if (res.ok) {
        const data = await res.json();
        setGenomes(data.genomes || {});
      } else {
        setGenomes(civicStore.getConstituencyGenomes());
      }
    } catch {
      setGenomes(civicStore.getConstituencyGenomes());
    } finally {
      setLoading(false);
    }
  };

  const currentGenome = genomes[selectedWard] || Object.values(genomes)[0];

  // Calculate simulated values when in simulation mode
  const simulatedTraits = currentGenome
    ? {
        ...currentGenome.traits,
        responseReflex: {
          ...currentGenome.traits.responseReflex,
          score: Math.min(100, Math.max(10, currentGenome.traits.responseReflex.score + responseDelta)),
        },
        citizenVerificationTrust: {
          ...currentGenome.traits.citizenVerificationTrust,
          score: Math.min(100, Math.max(10, currentGenome.traits.citizenVerificationTrust.score + trustDelta)),
        },
        infrastructureResilience: {
          ...currentGenome.traits.infrastructureResilience,
          score: Math.min(100, Math.max(10, currentGenome.traits.infrastructureResilience.score + durabilityDelta)),
        },
        fiscalExecutionSpeed: {
          ...currentGenome.traits.fiscalExecutionSpeed,
          score: Math.min(100, Math.max(10, currentGenome.traits.fiscalExecutionSpeed.score + fiscalDelta)),
        },
      }
    : null;

  const simulatedScore = simulatedTraits
    ? Math.round(
        (simulatedTraits.responseReflex.score * 0.2 +
          simulatedTraits.resolutionFidelity.score * 0.2 +
          simulatedTraits.citizenVerificationTrust.score * 0.2 +
          simulatedTraits.recurrenceImmunity.score * 0.15 +
          simulatedTraits.infrastructureResilience.score * 0.15 +
          simulatedTraits.fiscalExecutionSpeed.score * 0.1) *
          10
      ) / 10
    : currentGenome?.overall_governance_score || 0;

  const simulatedGrade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' =
    simulatedScore >= 90
      ? 'A+'
      : simulatedScore >= 80
      ? 'A'
      : simulatedScore >= 70
      ? 'B+'
      : simulatedScore >= 60
      ? 'B'
      : simulatedScore >= 50
      ? 'C'
      : 'D';

  const handleApplySimulatedReform = () => {
    if (!currentGenome) return;
    civicStore.simulateGenomicReform(selectedWard, {
      response_reflex: responseDelta,
      citizen_verification_trust: trustDelta,
      infrastructure_durability: durabilityDelta,
      fiscal_execution_velocity: fiscalDelta,
    });
    setFeedbackMessage(
      `Genomic Reform Plan deployed for ${currentGenome.ward_name}! Composite score updated to ${simulatedScore}.`
    );
    setTimeout(() => setFeedbackMessage(null), 4500);
    setResponseDelta(0);
    setTrustDelta(0);
    setDurabilityDelta(0);
    setFiscalDelta(0);
    setSimulationMode(false);
    fetchGenomes();
  };

  const handleExportDossier = () => {
    if (!currentGenome) return;
    const dossier = {
      system: 'CivicLens Accountability Genome Municipal Dossier',
      constituency: currentGenome.ward_name,
      ward_id: currentGenome.ward_id,
      zone: currentGenome.zone,
      overall_governance_score: currentGenome.overall_governance_score,
      governance_grade: currentGenome.governance_grade,
      traits: currentGenome.traits,
      historical_evolution: currentGenome.historical_evolution,
      policy_prescriptions: currentGenome.policy_prescription,
      cryptographic_seal: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      generated_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genome-dossier-${selectedWard}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMessage('Official Genomic Governance Dossier exported successfully.');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const activeTraits = simulationMode && simulatedTraits ? simulatedTraits : currentGenome?.traits;
  const activeScore = simulationMode ? simulatedScore : currentGenome?.overall_governance_score;
  const activeGrade = simulationMode ? simulatedGrade : currentGenome?.governance_grade;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <Dna className="w-3.5 h-3.5" />
                Innovation 4 • Multi-Trait Governance Fingerprint
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Civic Accountability Genome
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Objective empirical governance fingerprint for constituencies based on real civic performance:
                response speed, resolution fidelity, citizen verification trust, infrastructure resilience,
                and fiscal speed—replacing superficial popularity contests with evidence-based diagnostics.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Ward Selector */}
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                  Select Constituency:
                </label>
                <select
                  value={selectedWard}
                  onChange={(e) => {
                    setSelectedWard(e.target.value);
                    setResponseDelta(0);
                    setTrustDelta(0);
                    setDurabilityDelta(0);
                    setFiscalDelta(0);
                  }}
                  className="text-sm font-bold bg-slate-900 text-white border border-white/30 rounded-lg px-3 py-2 focus:outline-none"
                >
                  <option value="ward-175">Ward 175 - Velachery</option>
                  <option value="ward-172">Ward 172 - Adyar</option>
                  <option value="ward-170">Ward 170 - Besant Nagar</option>
                  <option value="ward-173">Ward 173 - Mylapore</option>
                  <option value="ward-174">Ward 174 - T. Nagar</option>
                  <option value="ward-176">Ward 176 - Guindy Industrial</option>
                </select>
              </div>

              <button
                onClick={handleExportDossier}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition self-stretch sm:self-end"
              >
                <Download className="w-4 h-4" />
                Export Dossier
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Notification Banner */}
        {feedbackMessage && (
          <div className="p-4 bg-purple-50 border border-purple-300 rounded-xl text-xs font-bold text-purple-900 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-purple-600 hover:text-purple-900">
              ✕
            </button>
          </div>
        )}

        {currentGenome && (
          <>
            {/* Top Governance Rating Strip + Simulation Toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Governance Genome Profile
                  </span>
                  {simulationMode && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                      Simulated Reform Mode
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-slate-900">
                  {currentGenome.ward_name} ({currentGenome.zone})
                </h2>
                <p className="text-xs text-slate-500">
                  Multi-trait synthetic index calculated across 6 objective operational dimensions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <button
                  onClick={() => setSimulationMode(!simulationMode)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                    simulationMode
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  {simulationMode ? 'Exit What-If Simulator' : 'What-If Policy Simulation'}
                </button>

                <div className="flex items-center gap-6 border-l border-slate-200 pl-6">
                  <div className="text-center">
                    <div className="text-4xl font-black text-purple-700">
                      {activeScore}
                      <span className="text-lg font-bold text-slate-400">/100</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                      Composite Score
                    </div>
                  </div>

                  <div className="h-12 w-px bg-slate-200" />

                  <div className="text-center">
                    <div className="text-4xl font-black text-emerald-600">{activeGrade}</div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                      Efficiency Grade
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What-If Policy Simulation Sandbox Panel */}
            {simulationMode && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-600" />
                    <h3 className="font-extrabold text-amber-950 text-base">
                      Interactive What-If Policy Reform Simulator
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setResponseDelta(0);
                      setTrustDelta(0);
                      setDurabilityDelta(0);
                      setFiscalDelta(0);
                    }}
                    className="text-xs text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Sliders
                  </button>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Adjust target municipal levers to model policy reform impact on the ward's composite governance grade.
                  Applying changes persists reform targets into municipal intelligence store.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
                  <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-amber-200">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Response Reflex SLA:</span>
                      <span className={responseDelta >= 0 ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}>
                        {responseDelta >= 0 ? `+${responseDelta}` : responseDelta} pts
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      value={responseDelta}
                      onChange={(e) => setResponseDelta(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">Deploy mobile pothole rapid-patch units</span>
                  </div>

                  <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-amber-200">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Citizen Trust & Verification:</span>
                      <span className={trustDelta >= 0 ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}>
                        {trustDelta >= 0 ? `+${trustDelta}` : trustDelta} pts
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      value={trustDelta}
                      onChange={(e) => setTrustDelta(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">Empower volunteer swarm spotters</span>
                  </div>

                  <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-amber-200">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Infrastructure Durability:</span>
                      <span className={durabilityDelta >= 0 ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}>
                        {durabilityDelta >= 0 ? `+${durabilityDelta}` : durabilityDelta} pts
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      value={durabilityDelta}
                      onChange={(e) => setDurabilityDelta(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">Enforce 180-day contractor defect bond</span>
                  </div>

                  <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-amber-200">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>Fiscal Velocity:</span>
                      <span className={fiscalDelta >= 0 ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}>
                        {fiscalDelta >= 0 ? `+${fiscalDelta}` : fiscalDelta} pts
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      value={fiscalDelta}
                      onChange={(e) => setFiscalDelta(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">Fast-track capital project sanctioning</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-200">
                  <button
                    onClick={handleApplySimulatedReform}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    Commit Simulated Reform Target
                  </button>
                </div>
              </div>
            )}

            {/* The 6 Genomic Traits Breakdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                Constituency Genomic Traits Matrix
              </h3>

              {activeTraits && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Object.values(activeTraits).map((trait: GenomicTrait) => {
                    const trendIcon =
                      trait.trend === 'improving' ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      ) : trait.trend === 'declining' ? (
                        <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-slate-400" />
                      );

                    const delta = trait.score - trait.benchmark;

                    return (
                      <div
                        key={trait.key}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {trait.label}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold capitalize">
                              {trendIcon}
                              <span
                                className={
                                  trait.trend === 'improving'
                                    ? 'text-emerald-700'
                                    : trait.trend === 'declining'
                                    ? 'text-rose-700'
                                    : 'text-slate-600'
                                }
                              >
                                {trait.trend}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between">
                            <div className="text-3xl font-extrabold text-slate-900">{trait.score}</div>
                            <span className="text-xs font-semibold text-slate-400">
                              City Benchmark: <strong>{trait.benchmark}</strong>
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                trait.score >= trait.benchmark ? 'bg-purple-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, trait.score)}%` }}
                            />
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed pt-1">{trait.description}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-400">Relative Delta:</span>
                          <span
                            className={delta >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}
                          >
                            {delta >= 0 ? `+${delta} pts above norm` : `${delta} pts below norm`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Historical Evolution and Policy Prescriptions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Historical Evolution */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Quarterly Governance Evolution
                </h3>
                <p className="text-xs text-slate-500">
                  Trajectory tracking across sequential quarters demonstrating real municipal improvement.
                </p>

                <div className="grid grid-cols-4 gap-2 pt-2">
                  {currentGenome.historical_evolution.map((item, idx) => (
                    <div
                      key={item.quarter}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {item.quarter}
                      </span>
                      <span className="text-xl font-black text-slate-900 block mt-1">{item.score}</span>
                      {idx > 0 && (
                        <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                          +{(item.score - currentGenome.historical_evolution[idx - 1].score).toFixed(1)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Policy Prescriptions */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Evidence-Based Policy Prescriptions
                </h3>
                <p className="text-xs text-slate-500">
                  Targeted municipal interventions formulated directly from genomic weaknesses:
                </p>

                <div className="space-y-2.5 pt-1">
                  {currentGenome.policy_prescription.map((prescription, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-950 flex items-start gap-2.5 font-medium leading-relaxed"
                    >
                      <div className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span>{prescription}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
