'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  User,
  HelpCircle,
  ShieldCheck,
  PlusCircle,
  FileText,
  Search,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { civicStore } from '@/lib/store';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  actions?: Array<{ label: string; href: string }>;
}

const FAQ_PROMPTS = [
  'How do I report a pothole on my street?',
  'What happens when a department marks an issue resolved?',
  'Why was my complaint reopened?',
  'How does smart authority routing work?',
  'What should I do if a complaint exceeds its SLA target?',
  'Can I see public development projects in my ward?',
];

export default function AssistantPage() {
  const language = civicStore.getLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text:
        language === 'ta'
          ? 'வணக்கம்! நான் சிவிக்லென்ஸ் வழிகாட்டி. பொதுப் பிரச்சினைகளைப் புகாரளிப்பது, துறைகளின் செயல்பாடுகளைக் கண்காணிப்பது மற்றும் தீர்வை உறுதிசெய்வது குறித்து ஏதேனும் கேள்விகள் இருந்தால் கேளுங்கள்.'
          : 'Welcome to CivicLens AI Assistant. I can help guide you through reporting civic issues, understanding the resolution verification workflow, explaining complaint statuses, and navigating municipal transparency data. How can I assist you today?',
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Deterministic Rule-Based Intelligence Engine (Guaranteed fallback, 0 paid APIs)
  const generateResponse = (query: string): { text: string; actions?: Array<{ label: string; href: string }> } => {
    const q = query.toLowerCase();

    if (q.includes('pothole') || q.includes('road') || q.includes('crater')) {
      return {
        text:
          'To report a pothole or road damage: Click "Report a Civic Issue", select the "Roads & Potholes" category, describe the landmark, snap a quick photo, confirm your location on OpenStreetMap, and submit. CivicLens will automatically route your complaint directly to the Roads & Bridges Department with a 5-day standard resolution SLA.',
        actions: [{ label: 'Open Report Issue Wizard', href: '/report' }],
      };
    }

    if (q.includes('garbage') || q.includes('trash') || q.includes('waste') || q.includes('bin')) {
      return {
        text:
          'For garbage accumulation or overflowing bins: Select "Garbage & Waste" in the reporting wizard. This routes to Solid Waste & Sanitation Management with a 48-hour response target.',
        actions: [{ label: 'Report Waste Issue', href: '/report' }],
      };
    }

    if (q.includes('resolved') || q.includes('verification') || q.includes('close')) {
      return {
        text:
          'In CivicLens, when an authority marks an issue as "Resolved", it is NOT silently closed. You (the citizen) will receive an alert to inspect the site. You can verify "Completely Resolved" to close the ticket, or choose "Partially/Not Resolved" and attach a photo to reopen the complaint for corrective work.',
        actions: [{ label: 'View My Complaints', href: '/my-complaints' }],
      };
    }

    if (q.includes('reopened') || q.includes('reopen')) {
      return {
        text:
          'A complaint enters "Reopened" status when a citizen rejects the department\'s initial resolution—typically because ground repairs were incomplete, sloppy, or didn\'t fix the underlying hazard. Reopened tickets are flagged with high priority for supervisory review.',
        actions: [{ label: 'Browse Reopened Issues', href: '/issues' }],
      };
    }

    if (q.includes('sla') || q.includes('overdue') || q.includes('escalat')) {
      return {
        text:
          'Each category has a target SLA (e.g. 48 hours for streetlights, 5 days for roads). If a department exceeds this target without progress, the complaint is marked "SLA Overdue" and you can click the "Escalate Issue" button on the complaint page to send it to the Zonal Commissioner and Representative.',
        actions: [{ label: 'Constituency Dashboard', href: '/dashboard' }],
      };
    }

    if (q.includes('routing') || q.includes('router') || q.includes('which department')) {
      return {
        text:
          'CivicLens uses a Smart Authority Routing Engine that pairs the issue category and municipal ward jurisdiction (e.g. Ward 175 Velachery) to deterministically assign the ticket to the responsible engineering division (Roads, Drainage, Metrowater, Sanitation, Electrical).',
        actions: [{ label: 'Explore Civic Map', href: '/map' }],
      };
    }

    if (q.includes('project') || q.includes('budget') || q.includes('expenditure') || q.includes('fund')) {
      return {
        text:
          'CivicLens provides a Public Project Transparency directory where you can monitor sanctioned government infrastructure projects, recorded disbursements, executing agencies, and completion milestones.',
        actions: [{ label: 'Explore Public Projects', href: '/projects' }],
      };
    }

    return {
      text:
        'CivicLens is designed to ensure transparent municipal accountability. You can report civic problems, track ground actions by field workers, verify resolutions before tickets close, and view constituency analytics on the public dashboard. Try asking: "How do I report a pothole?" or "What happens when an issue is marked resolved?"',
      actions: [
        { label: 'Report Issue', href: '/report' },
        { label: 'View Dashboard', href: '/dashboard' },
      ],
    };
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const resp = generateResponse(query);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: resp.text,
        time: 'Just now',
        actions: resp.actions,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" /> Free Rule-Based AI Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              CivicLens AI Assistant & Guide
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant guidance on reporting procedures, department SLA targets, resolution verification, and civic transparency data.
            </p>
          </div>
        </div>

        {/* Suggested Quick Questions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Suggested Queries:
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            {FAQ_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 text-white shadow-xs'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-blue-400" />}
                  </div>

                  <div
                    className={`max-w-md sm:max-w-xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-xs'
                        : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    <p>{m.text}</p>

                    {m.actions && m.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                        {m.actions.map((act) => (
                          <Link
                            key={act.label}
                            href={act.href}
                            className="px-3 py-1 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-md shadow-xs transition inline-block text-[11px]"
                          >
                            {act.label} &rarr;
                          </Link>
                        ))}
                      </div>
                    )}

                    <span
                      className={`text-[10px] block text-right mt-1 ${
                        isUser ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <Bot className="w-4 h-4 text-blue-500 animate-pulse" />
                <span>Assistant is formulating response...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask how to report an issue, check SLA deadlines, or verify resolution..."
              className="flex-1 text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
