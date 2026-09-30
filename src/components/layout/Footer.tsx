import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">CivicLens</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Constituency Accountability & Civic Transparency Platform. Connecting citizens, municipal authorities, and public oversight through open tracking.
            </p>
            <div className="text-xs text-slate-400">
              <p className="font-semibold text-slate-300">Tagline:</p>
              <p className="italic text-slate-400">&ldquo;See the Issue. Track the Action. Verify the Resolution.&rdquo;</p>
            </div>
          </div>

          {/* Quick Civic Navigation */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Civic Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/report" className="hover:text-blue-400 transition">
                  Report Civic Issue
                </Link>
              </li>
              <li>
                <Link href="/my-complaints" className="hover:text-blue-400 transition">
                  Citizen Tracking
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-blue-400 transition">
                  Public OpenStreetMap
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-400 transition">
                  Constituency Dashboard
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-blue-400 transition">
                  Public Project Transparency
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:text-blue-400 transition">
                  AI Civic Assistant & FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Accountability & Design */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Accountability Principles
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Smart Authority Routing</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Citizen Resolution Verification</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>SLA & Escalation Protocol</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Recurring Problem Detection</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Zero Paid API Dependencies</span>
              </li>
            </ul>
          </div>

          {/* Academic & Stack Details */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Project Architecture
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Built for Design Thinking & Innovation. Stacked with Next.js, TypeScript, Tailwind CSS, Leaflet/OpenStreetMap, Recharts, and Supabase PostgreSQL.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Free-tier & Open-Source Only</span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CivicLens. Open Civic Technology Platform.</p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Demo Data Clearly Labeled</span>
            <span>•</span>
            <span>Citizen Privacy Protected</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
