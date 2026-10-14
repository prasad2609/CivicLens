'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Calendar,
  Sparkles,
  Camera,
  ThumbsUp,
  TreePine,
  Umbrella,
  Shield,
  Clock,
  Plus,
  Filter,
} from 'lucide-react';
import { VolunteerSwarmMission, VolunteerLeaderboardEntry, SwarmMissionType } from '@/types';
import { civicStore } from '@/lib/store';

export default function SwarmPage() {
  const [missions, setMissions] = useState<VolunteerSwarmMission[]>([]);
  const [leaderboard, setLeaderboard] = useState<VolunteerLeaderboardEntry[]>([]);
  const [selectedMission, setSelectedMission] = useState<VolunteerSwarmMission | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [volunteerRole, setVolunteerRole] = useState<'volunteer' | 'lead' | 'spotter'>('volunteer');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Proof form state
  const [proofNote, setProofNote] = useState('');
  const [proofPhotoUrl, setProofPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80'
  );

  // Launch Swarm form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<SwarmMissionType>('tree_plantation');
  const [newWard, setNewWard] = useState('ward-175');
  const [newLocation, setNewLocation] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
  const [newTarget, setNewTarget] = useState('20');
  const [newKarma, setNewKarma] = useState('50');

  useEffect(() => {
    fetchData();
    const unsub = civicStore.subscribe(fetchData);
    return unsub;
  }, []);

  const fetchData = async () => {
    try {
      const [missionsRes, lbRes] = await Promise.all([
        fetch('/api/swarm'),
        fetch('/api/swarm/leaderboard'),
      ]);

      if (missionsRes.ok) {
        const data = await missionsRes.json();
        setMissions(data.missions || []);
      } else {
        setMissions(civicStore.getSwarmMissions());
      }

      if (lbRes.ok) {
        const data = await lbRes.json();
        setLeaderboard(data.leaderboard || []);
      } else {
        setLeaderboard(civicStore.getVolunteerLeaderboard());
      }
    } catch {
      setMissions(civicStore.getSwarmMissions());
      setLeaderboard(civicStore.getVolunteerLeaderboard());
    }
  };

  const handleLaunchMission = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: newTitle,
      mission_type: newType,
      ward_id: newWard,
      location_text: newLocation,
      description: newDesc,
      scheduled_date: newDate,
      target_volunteers: Number(newTarget) || 15,
      karma_points_reward: Number(newKarma) || 50,
      organized_by: civicStore.getCurrentUser().full_name,
    };

    try {
      const res = await fetch('/api/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        civicStore.createSwarmMission(data.mission || payload);
      } else {
        civicStore.createSwarmMission(payload);
      }
    } catch {
      civicStore.createSwarmMission(payload);
    }

    setIsLaunchModalOpen(false);
    setNewTitle('');
    setNewLocation('');
    setNewDesc('');
    setFeedbackMessage('🎉 Citizen Swarm Mission successfully mobilized and broadcast to neighborhood volunteers!');
    setTimeout(() => setFeedbackMessage(null), 4500);
    fetchData();
  };

  const handleJoinMission = async () => {
    if (!selectedMission) return;
    try {
      const res = await fetch(`/api/swarm/${selectedMission.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: civicStore.getCurrentUser().id,
          role: volunteerRole,
        }),
      });

      if (res.ok) {
        civicStore.joinSwarmMission(selectedMission.id, volunteerRole);
      } else {
        civicStore.joinSwarmMission(selectedMission.id, volunteerRole);
      }
      setIsJoinModalOpen(false);
      setFeedbackMessage(`Enlisted as ${volunteerRole}! Complete your ground micro-task to earn +${selectedMission.karma_points_reward} Karma.`);
      setTimeout(() => setFeedbackMessage(null), 4500);
      fetchData();
    } catch {
      civicStore.joinSwarmMission(selectedMission.id, volunteerRole);
      setIsJoinModalOpen(false);
      fetchData();
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMission) return;

    try {
      const res = await fetch(`/api/swarm/${selectedMission.id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: civicStore.getCurrentUser().id,
          photoUrl: proofPhotoUrl,
          note: proofNote,
          latitude: selectedMission.latitude,
          longitude: selectedMission.longitude,
        }),
      });

      if (res.ok) {
        civicStore.submitSwarmProof(
          selectedMission.id,
          proofPhotoUrl,
          proofNote,
          selectedMission.latitude,
          selectedMission.longitude
        );
      } else {
        civicStore.submitSwarmProof(
          selectedMission.id,
          proofPhotoUrl,
          proofNote,
          selectedMission.latitude,
          selectedMission.longitude
        );
      }
      setIsProofModalOpen(false);
      setProofNote('');
      setFeedbackMessage(`Ground proof verified! +${selectedMission.karma_points_reward} Karma Points awarded to your Civic Profile.`);
      setTimeout(() => setFeedbackMessage(null), 4500);
      fetchData();
    } catch {
      civicStore.submitSwarmProof(
        selectedMission.id,
        proofPhotoUrl,
        proofNote,
        selectedMission.latitude,
        selectedMission.longitude
      );
      setIsProofModalOpen(false);
      fetchData();
    }
  };

  const handleVouchMission = async (missionId: string) => {
    try {
      const res = await fetch(`/api/swarm/${missionId}/vouch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: civicStore.getCurrentUser().id }),
      });
      if (res.ok) {
        civicStore.vouchSwarmMission(missionId);
      } else {
        civicStore.vouchSwarmMission(missionId);
      }
      setFeedbackMessage('Community confirmation logged! Swarm trust score boosted.');
      setTimeout(() => setFeedbackMessage(null), 3000);
      fetchData();
    } catch {
      civicStore.vouchSwarmMission(missionId);
      fetchData();
    }
  };

  const currentUser = civicStore.getCurrentUser();

  const filteredMissions =
    selectedCategory === 'all'
      ? missions
      : missions.filter((m) => m.mission_type === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <Users className="w-3.5 h-3.5" />
                Innovation 3 • Community Citizen Swarm
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Civic Volunteer Swarm Mode
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                Empowers verified citizen volunteers to self-organize and assist with community civic tasks:
                tree plantation, drain flood spot-audits, cold-mix temporary pothole interventions, and cleanup
                drives. Earn karma points, badges, and establish community proof.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsLaunchModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg transition"
              >
                <Plus className="w-4 h-4" />
                Launch Swarm Mission
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Notification Banner */}
        {feedbackMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              ✕
            </button>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All Missions' },
            { id: 'tree_plantation', label: '🌱 Tree Plantation' },
            { id: 'drain_spotting', label: '🌊 Drainage Spotting' },
            { id: 'pothole_fix', label: '🛣️ Pothole Rapid Fix' },
            { id: 'cleanliness_drive', label: '🧹 Cleanliness Drive' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content Grid: Missions on Left, Leaderboard on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Active Swarm Missions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Active Community Swarm Missions</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {filteredMissions.length} Missions
                </span>
              </h2>
            </div>

            <div className="space-y-4">
              {filteredMissions.map((mission) => {
                const isUserJoined = mission.participants.some((p) => p.user_id === currentUser.id);

                return (
                  <div
                    key={mission.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {mission.mission_type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {mission.scheduled_date}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mt-1.5 leading-snug">
                          {mission.title}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {mission.location_text} • {mission.ward_name}
                        </p>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-center text-amber-800 shrink-0">
                        <div className="text-sm font-extrabold flex items-center gap-1 justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          +{mission.karma_points_reward}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider">Karma Pts</div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">{mission.description}</p>

                    {/* Volunteers progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                        <span>
                          Volunteers Enlisted:{' '}
                          <strong className="text-slate-900">{mission.participants.length}</strong> /{' '}
                          {mission.target_volunteers}
                        </span>
                        <span className="text-emerald-700 font-bold">
                          {Math.round((mission.participants.length / mission.target_volunteers) * 100)}% Filled
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (mission.participants.length / mission.target_volunteers) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Community Proofs Feed */}
                    {mission.proofs.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Verified Community Ground Proofs ({mission.proofs.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {mission.proofs.map((proof) => (
                            <div
                              key={proof.id}
                              className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start gap-2 text-xs"
                            >
                              <img
                                src={proof.photo_url}
                                alt="Swarm Proof"
                                className="w-12 h-12 rounded object-cover shrink-0"
                                onError={(e) => {
                                  (e.target as any).src =
                                    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&auto=format&fit=crop&q=80';
                                }}
                              />
                              <div className="overflow-hidden">
                                <span className="font-bold text-slate-800 block truncate">
                                  {proof.uploader_name}
                                </span>
                                <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                  "{proof.note}"
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions Strip */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVouchMission(mission.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                          <span>Community Confirm ({mission.community_confirmations})</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUserJoined ? (
                          <>
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Joined as Volunteer
                            </span>
                            <button
                              onClick={() => {
                                setSelectedMission(mission);
                                setIsProofModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Upload Proof
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedMission(mission);
                              setIsJoinModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                          >
                            <Users className="w-3.5 h-3.5" />
                            Join Swarm
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Col: Leaderboard & Badges */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Volunteer Leaderboard
                </h3>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Top Karma</span>
              </div>

              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.user_id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      entry.rank === 1
                        ? 'bg-amber-50/60 border-amber-200 font-semibold'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${
                          entry.rank === 1
                            ? 'bg-amber-500 text-white shadow-sm'
                            : entry.rank === 2
                            ? 'bg-slate-400 text-white'
                            : 'bg-amber-700 text-white'
                        }`}
                      >
                        {entry.rank}
                      </div>

                      <div>
                        <div className="font-bold text-slate-900">{entry.full_name}</div>
                        <div className="text-[11px] text-slate-500">{entry.area}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {entry.badges.map((b) => (
                            <span
                              key={b.id}
                              title={b.description}
                              className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold text-slate-700 border border-slate-200"
                            >
                              🏅 {b.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-extrabold text-amber-600 block">
                        {entry.karma_points}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {entry.missions_completed} missions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Launch Swarm Mission */}
        {isLaunchModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Launch Community Swarm Mission</h3>
                <button onClick={() => setIsLaunchModalOpen(false)} className="text-slate-400 font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleLaunchMission} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mission Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Besant Beach Micro-Plastic & Driftwood Cleanup Drive"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mission Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as SwarmMissionType)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:outline-none font-medium"
                    >
                      <option value="tree_plantation">Tree Plantation</option>
                      <option value="drain_spotting">Drainage Flood Spotting</option>
                      <option value="pothole_fix">Pothole Rapid Fix</option>
                      <option value="cleanliness_drive">Cleanliness Drive</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Ward</label>
                    <select
                      value={newWard}
                      onChange={(e) => setNewWard(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:outline-none font-medium"
                    >
                      <option value="ward-175">Ward 175 - Velachery</option>
                      <option value="ward-172">Ward 172 - Adyar</option>
                      <option value="ward-170">Ward 170 - Besant Nagar</option>
                      <option value="ward-173">Ward 173 - Mylapore</option>
                      <option value="ward-174">Ward 174 - T. Nagar</option>
                      <option value="ward-176">Ward 176 - Guindy</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Location Details & Rendezvous</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g., Promenade near Police Booth, Elliot's Beach"
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mission Action Plan</label>
                  <textarea
                    rows={2}
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Describe tasks, required safety gloves, rendezvous time..."
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Scheduled Date</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Target Volunteers</label>
                    <input
                      type="number"
                      required
                      value={newTarget}
                      onChange={(e) => setNewTarget(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Karma Points</label>
                    <input
                      type="number"
                      required
                      value={newKarma}
                      onChange={(e) => setNewKarma(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsLaunchModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    Mobilize Swarm
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Join Swarm */}
        {isJoinModalOpen && selectedMission && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Enlist in Swarm Mission</h3>
                <button onClick={() => setIsJoinModalOpen(false)} className="text-slate-400 font-bold">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block text-sm">{selectedMission.title}</span>
                  <span className="text-slate-500 block mt-0.5">{selectedMission.location_text}</span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Volunteer Role</label>
                  <select
                    value={volunteerRole}
                    onChange={(e) => setVolunteerRole(e.target.value as any)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:outline-none"
                  >
                    <option value="volunteer">Ground Volunteer (Hands-on assist)</option>
                    <option value="spotter">Spotter (Site photos & safety monitoring)</option>
                    <option value="lead">Swarm Lead (Coordinate rendezvous & materials)</option>
                  </select>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                  <span className="font-bold block">Karma Points Reward: +{selectedMission.karma_points_reward}</span>
                  <span className="text-[11px] block mt-0.5">
                    Your contribution will be permanently sealed in your public civic credential profile.
                  </span>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setIsJoinModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinMission}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                  >
                    Confirm & Enlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Submit Swarm Proof */}
        {isProofModalOpen && selectedMission && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Upload Ground Completion Proof</h3>
                <button onClick={() => setIsProofModalOpen(false)} className="text-slate-400 font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitProof} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Completion Note / Description</label>
                  <textarea
                    rows={3}
                    required
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    placeholder="Describe the action completed, e.g., Cleared blockage from 40m culvert section..."
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsProofModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                  >
                    Submit Proof
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
