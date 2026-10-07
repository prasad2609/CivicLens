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
} from 'lucide-react';
import { ConstituencyGenome, GenomicTrait } from '@/types';
import { civicStore } from '@/lib/store';

export default function AccountabilityGenomePage() {
  const [genomes, setGenomes] = useState<Record<string, ConstituencyGenome>>({});
  const [selectedWard, setSelectedWard] = useState<string>('ward-175');
  const [loading, setLoading] = useState(true);

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

            {/* Ward Selector */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Select Constituency:
              </label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="text-sm font-bold bg-slate-900 text-white border border-white/30 rounded-lg px-3 py-2 focus:outline-none"
              >
                <option value="ward-175">Ward 175 - Velachery (Zone 13)</option>
                <option value="ward-172">Ward 172 - Adyar (Zone 13)</option>
              </select>
            </div>
          </div>
        </div>

        {currentGenome && (
          <>
            {/* Top Governance Rating Strip */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Governance Genome Profile
                </span>
                <h2 className="text-2xl font-black text-slate-900">
                  {currentGenome.ward_name} ({currentGenome.zone})
                </h2>
                <p className="text-xs text-slate-500">
                  Multi-trait synthetic index calculated across 6 objective operational dimensions.
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-black text-purple-700">
                    {currentGenome.overall_governance_score}
                    <span className="text-lg font-bold text-slate-400">/100</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                    Composite Score
                  </div>
                </div>

                <div className="h-12 w-px bg-slate-200" />

                <div className="text-center">
                  <div className="text-4xl font-black text-emerald-600">
                    {currentGenome.governance_grade}
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                    Efficiency Grade
                  </div>
                </div>
              </div>
            </div>

            {/* The 6 Genomic Traits Breakdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-600" />
                Constituency Genomic Traits Matrix
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.values(currentGenome.traits).map((trait: GenomicTrait) => {
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
                            style={{ width: `${trait.score}%` }}
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
