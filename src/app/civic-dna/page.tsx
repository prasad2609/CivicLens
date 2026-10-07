'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Wrench,
  TrendingDown,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  History,
  Plus,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { InfrastructureAsset, AssetRepairRecord, AssetType } from '@/types';
import { civicStore } from '@/lib/store';

export default function CivicDNAPage() {
  const [assets, setAssets] = useState<InfrastructureAsset[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [activeAsset, setActiveAsset] = useState<InfrastructureAsset | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state for logging a new repair
  const [repairCost, setRepairCost] = useState('350000');
  const [repairDescription, setRepairDescription] = useState('');
  const [repairContractor, setRepairContractor] = useState('Apex Highway Infrastructure Ltd.');
  const [repairTechnique, setRepairTechnique] = useState('High-performance mastic asphalt overlay');

  useEffect(() => {
    fetchAssets();
    const unsub = civicStore.subscribe(fetchAssets);
    return unsub;
  }, [selectedWard, selectedType]);

  const fetchAssets = async () => {
    try {
      const url = new URL('/api/assets/dna', window.location.origin);
      if (selectedWard !== 'all') url.searchParams.set('ward_id', selectedWard);
      if (selectedType !== 'all') url.searchParams.set('asset_type', selectedType);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      } else {
        // Fallback to local store
        const filter: any = {};
        if (selectedWard !== 'all') filter.ward_id = selectedWard;
        if (selectedType !== 'all') filter.asset_type = selectedType;
        setAssets(civicStore.getAssets(filter));
      }
    } catch {
      setAssets(civicStore.getAssets());
    } finally {
      setLoading(false);
    }
  };

  const handleAddRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsset) return;

    const payload: Partial<AssetRepairRecord> = {
      cost: Number(repairCost) || 150000,
      description: repairDescription || 'Preventive surface repair intervention',
      contractor_name: repairContractor,
      technique: repairTechnique,
      durability_status: 'holding',
      date: new Date().toISOString().split('T')[0],
      warranty_end_date: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
    };

    try {
      const res = await fetch(`/api/assets/dna/${activeAsset.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        civicStore.addAssetRepair(activeAsset.id, payload);
        setActiveAsset(data.asset);
      } else {
        const updated = civicStore.addAssetRepair(activeAsset.id, payload);
        if (updated) setActiveAsset(updated);
      }
      setIsModalOpen(false);
      setRepairDescription('');
      fetchAssets();
    } catch {
      civicStore.addAssetRepair(activeAsset.id, payload);
      setIsModalOpen(false);
      fetchAssets();
    }
  };

  const criticalCount = assets.filter((a) => a.condition === 'critical' || a.health_score < 45).length;
  const rebuildRecommendedCount = assets.filter((a) => a.recommendation?.type === 'rebuild_recommended').length;
  const totalRepairsCost = assets.reduce((sum, a) => sum + a.cumulative_repair_cost, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <Activity className="w-3.5 h-3.5" />
                Innovation 1 • Infrastructure Health Memory
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Civic DNA System
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Permanent historical memory for roads, drainage networks, streetlights, and water pipes.
                Tracks cumulative repair costs, fatigue accumulation, failure predictions, and triggers rebuild
                recommendations when patchwork becomes fiscally non-viable.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchAssets}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition backdrop-blur-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Assets
              </button>
            </div>
          </div>
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Monitored Public Assets
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{assets.length}</span>
              <span className="text-xs text-blue-600 font-medium">Permanent IDs</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Critical Fatigue Assets
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-red-600">{criticalCount}</span>
              <span className="text-xs text-slate-500">Wear &gt; 70%</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Rebuild Prescriptions
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600">{rebuildRecommendedCount}</span>
              <span className="text-xs text-amber-600 font-medium">Rebuild &gt; Patch</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Cumulative Patch Spend
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">
                ₹{(totalRepairsCost / 10000000).toFixed(2)} Cr
              </span>
              <span className="text-xs text-slate-500">Historical</span>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Filter Ward:
            </label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="text-sm font-medium border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Wards (Chennai South)</option>
              <option value="ward-175">Ward 175 - Velachery</option>
              <option value="ward-172">Ward 172 - Adyar</option>
              <option value="ward-173">Ward 173 - Mylapore</option>
              <option value="ward-174">Ward 174 - T. Nagar</option>
            </select>

            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-2">
              Asset Type:
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-sm font-medium border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Asset Classes</option>
              <option value="road">Roads & Arterials</option>
              <option value="drain">Stormwater Drains</option>
              <option value="water_pipe">Water Pipelines</option>
              <option value="streetlight">Smart Streetlights</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{assets.length}</strong> public assets
          </div>
        </div>

        {/* Assets List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assets.map((asset) => {
            const isRebuild = asset.recommendation?.type === 'rebuild_recommended';
            const healthColor =
              asset.health_score >= 70
                ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                : asset.health_score >= 45
                ? 'text-amber-600 bg-amber-50 border-amber-200'
                : 'text-rose-600 bg-rose-50 border-rose-200';

            return (
              <div
                key={asset.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-5"
              >
                {/* Asset Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        {asset.asset_code}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize bg-blue-50 text-blue-700 border border-blue-200">
                        {asset.asset_type.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug">
                      {asset.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{asset.location_text} • {asset.ward_name}</p>
                  </div>

                  <div className={`px-3 py-1.5 rounded-xl border text-center font-bold ${healthColor}`}>
                    <div className="text-xl font-extrabold">{asset.health_score}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold">Health Score</div>
                  </div>
                </div>

                {/* Fatigue Index & Cumulative Cost Gauge */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1">
                      <span>Structural Fatigue:</span>
                      <span className="text-slate-900 font-bold">{(asset.fatigue_index * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          asset.fatigue_index > 0.75
                            ? 'bg-rose-500'
                            : asset.fatigue_index > 0.5
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, asset.fatigue_index * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      MTBF: {asset.mean_time_between_failures_days} days
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1">
                      <span>Repair / Rebuild Ratio:</span>
                      <span className="text-slate-900 font-bold">{asset.rebuild_threshold_pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          asset.rebuild_threshold_pct >= 55 ? 'bg-rose-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, asset.rebuild_threshold_pct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Threshold trigger: 55%
                    </span>
                  </div>
                </div>

                {/* Failure Prediction Alert Banner */}
                {asset.days_until_predicted_failure <= 30 && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <strong className="font-semibold">Predictive Maintenance Warning:</strong> Next failure
                      predicted within{' '}
                      <span className="font-bold underline">{asset.days_until_predicted_failure} days</span> based on
                      MTBF frequency and rain/traffic wear cycles.
                    </div>
                  </div>
                )}

                {/* Rebuild vs Patch Recommendation Banner */}
                {isRebuild ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-800">
                      <Zap className="w-4 h-4 text-amber-600" />
                      Civic DNA Recommendation: Capital Rebuild Recommended
                    </div>
                    <p className="text-slate-700 leading-relaxed">{asset.recommendation.reason}</p>
                    <div className="flex flex-wrap items-center gap-4 pt-1 font-semibold text-amber-800 text-[11px]">
                      <span>Cumulative Patches: ₹{(asset.cumulative_repair_cost / 100000).toFixed(1)}L</span>
                      <span>Full Rebuild Cost: ₹{(asset.replacement_cost / 100000).toFixed(1)}L</span>
                      <span className="text-emerald-700 font-bold">
                        Projected 3-Yr Savings: ₹{(asset.recommendation.projected_3yr_savings / 100000).toFixed(1)}L
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Preventive monitoring sufficient. Patchwork remains fiscally viable.</span>
                    </div>
                    <span className="font-bold text-[11px]">Healthy Subgrade</span>
                  </div>
                )}

                {/* Repair History Expander and Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {asset.repair_history.length} documented repair interventions
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveAsset(asset);
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Log Repair
                    </button>
                  </div>
                </div>

                {/* Recent Repair Interventions Feed */}
                {asset.repair_history.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Historical Interventions:
                    </span>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {asset.repair_history.map((rep) => (
                        <div
                          key={rep.id}
                          className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-start justify-between gap-3"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{rep.description}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {rep.date} • {rep.contractor_name} • Technique: {rep.technique}
                            </div>
                          </div>
                          <span className="font-bold text-slate-900 shrink-0">
                            ₹{(rep.cost / 1000).toFixed(0)}k
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal: Log Repair Intervention */}
        {isModalOpen && activeAsset && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Log Repair Intervention</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{activeAsset.asset_code}</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddRepair} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Intervention Description</label>
                  <input
                    type="text"
                    required
                    value={repairDescription}
                    onChange={(e) => setRepairDescription(e.target.value)}
                    placeholder="e.g., Cold-mix bitumen pothole patch and sub-base leveling"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Expenditure (₹)</label>
                    <input
                      type="number"
                      required
                      value={repairCost}
                      onChange={(e) => setRepairCost(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Contractor / Agency</label>
                    <input
                      type="text"
                      required
                      value={repairContractor}
                      onChange={(e) => setRepairContractor(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Engineering Technique</label>
                  <input
                    type="text"
                    required
                    value={repairTechnique}
                    onChange={(e) => setRepairTechnique(e.target.value)}
                    placeholder="e.g., 50mm Bituminous Concrete overlay"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <p className="text-[11px] text-slate-500 italic bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                  Notice: Logging this repair will update the asset's fatigue index, failure count, and cumulative
                  patch-to-replacement threshold in the immutable civic ledger.
                </p>

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
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-sm"
                  >
                    Save & Recalculate DNA
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
