'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  User,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Building2,
  MapPin,
  Clock,
  ShieldCheck,
  HelpCircle,
  PhoneCall,
  FileText,
} from 'lucide-react';
import { civicStore } from '@/lib/store';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  actions?: Array<{ label: string; href: string }>;
  source?: 'gemini-llm' | 'live-ledger-engine';
}

const CATEGORIZED_PROMPTS = [
  {
    category: 'Ticket Tracking',
    icon: FileText,
    query: 'What is the status of complaint CL-2026-000101?',
  },
  {
    category: 'Ward Intel',
    icon: MapPin,
    query: 'Tell me about Ward 175 Velachery',
  },
  {
    category: 'Departments',
    icon: Building2,
    query: 'Who is responsible for sewage and water leaks?',
  },
  {
    category: 'SLA & Escalation',
    icon: Clock,
    query: 'What is the SLA for streetlights and road potholes?',
  },
  {
    category: 'AI Detector',
    icon: ShieldCheck,
    query: 'How does the AI image detector reject fake photos?',
  },
  {
    category: 'Emergency',
    icon: PhoneCall,
    query: 'Emergency helpline numbers for Chennai',
  },
  {
    category: 'Municipal Services',
    icon: HelpCircle,
    query: 'How do I pay GCC property tax online?',
  },
  {
    category: 'Tamil Guidance',
    icon: Sparkles,
    query: 'சாலை பள்ளங்களை எப்படி புகார் செய்வது?',
  },
];

// Helper to format text with lightweight markdown formatting
function FormattedMessageText({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-slate-800">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className="text-sm font-bold text-slate-900 mt-2 mb-1 flex items-center gap-1.5"
            >
              {trimmed.replace('### ', '')}
            </h3>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-sm font-extrabold text-slate-950 mt-2.5 mb-1">
              {trimmed.replace('## ', '')}
            </h2>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletContent = trimmed.slice(2);
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="text-blue-600 font-bold select-none">•</span>
              <div>{renderInlineFormatting(bulletContent)}</div>
            </div>
          );
        }

        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          // Table row separator or content
          if (trimmed.includes('---')) {
            return null;
          }
          const cells = trimmed
            .split('|')
            .filter((c, i, arr) => i > 0 && i < arr.length - 1)
            .map((c) => c.trim());

          return (
            <div
              key={idx}
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white/70 p-1.5 rounded border border-slate-200 text-[11px]"
            >
              {cells.map((cell, cIdx) => (
                <span
                  key={cIdx}
                  className={cIdx === 0 ? 'font-bold text-slate-900' : 'text-slate-700'}
                >
                  {renderInlineFormatting(cell)}
                </span>
              ))}
            </div>
          );
        }

        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        return <p key={idx}>{renderInlineFormatting(line)}</p>;
      })}
    </div>
  );
}

function renderInlineFormatting(str: string): React.ReactNode {
  // Simple parser for **bold** and `code`
  const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-[11px] font-mono font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function AssistantPage() {
  const language = civicStore.getLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text:
        language === 'ta'
          ? 'வணக்கம்! நான் சிவிக்லென்ஸ் வழிகாட்டி. சென்னை மாநகராட்சி சார்ந்த அனைத்து பொதுப் பிரச்சினைகள், குறிப்பிட்ட புகார் எண்கள் (எ.கா. CL-2026-000101), வார்டு விவரங்கள் (எ.கா. வார்டு 175 வேளச்சேரி), தீர்வு காலக்கெடு (SLA), அவசர எண்கள், சொத்து வரி மற்றும் குடிமக்கள் சரிபார்ப்பு குறித்து எந்தக் கேள்வியும் கேளுங்கள்.'
          : 'Welcome to CivicLens Intelligent AI Assistant. Connected to the live Greater Chennai Corporation municipal ledger. Ask me about specific complaint tickets (e.g. `CL-2026-000101`), Ward details (e.g. `Ward 175 Velachery`), department SLAs, emergency helplines, AI image verification, property taxes, or public works projects.',
      time: 'Just now',
      source: 'live-ledger-engine',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
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

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
          language: language,
        }),
      });

      const data = await res.json();

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'Unable to generate response. Please try again.',
        time: 'Just now',
        actions: data.actions,
        source: data.source || 'live-ledger-engine',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text:
          'CivicLens Assistant is connecting to the municipal ledger. You can file complaints at /report, track issues at /issues, or browse ward analytics on /dashboard.',
        time: 'Just now',
        actions: [
          { label: 'Report Issue', href: '/report' },
          { label: 'Public Ledger', href: '/issues' },
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `m-${Date.now()}`,
        sender: 'assistant',
        text: 'Chat cleared. How can I help you with CivicLens or municipal services today?',
        time: 'Just now',
        source: 'live-ledger-engine',
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Civic Ledger Connected
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                GCC Chennai Region
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              CivicLens Intelligent AI Assistant
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Specific, actionable answers for live complaint tracking, ward data, departmental SLAs, emergency helplines, and GCC municipal services.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            className="text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            title="Reset conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear Chat
          </button>
        </div>

        {/* Suggested Quick Queries Grid */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Quick Inquiries & Topics:
            </span>
            <span className="text-[10px] text-slate-400">Click any card to ask instantly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {CATEGORIZED_PROMPTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(item.query)}
                  className="p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-slate-500 group-hover:text-blue-700">
                    <Icon className="w-3.5 h-3.5 text-blue-600" />
                    <span>{item.category}</span>
                  </div>
                  <p className="text-[11px] text-slate-800 font-medium line-clamp-2">
                    {item.query}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Window */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[540px] overflow-hidden">
          {/* Messages Container */}
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
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-900 text-white shadow-xs ring-2 ring-blue-100'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-blue-400" />}
                  </div>

                  <div
                    className={`max-w-md sm:max-w-xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 relative group ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-white font-medium">{m.text}</p>
                    ) : (
                      <FormattedMessageText text={m.text} />
                    )}

                    {m.actions && m.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2.5 border-t border-slate-200">
                        {m.actions.map((act) => (
                          <Link
                            key={act.label}
                            href={act.href}
                            className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 border border-blue-200 font-bold rounded-lg shadow-xs transition inline-flex items-center gap-1 text-[11px]"
                          >
                            <span>{act.label}</span>
                            <span>&rarr;</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/50 text-[10px]">
                      {!isUser && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {m.source === 'gemini-llm' ? '✨ Gemini LLM' : '🏛️ CivicLedger Engine'}
                        </span>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(m.id, m.text)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                            title="Copy message"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                        <span className={isUser ? 'text-blue-200' : 'text-slate-400'}>
                          {m.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-600 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                  </div>
                  <span>Searching municipal database & resolving answer...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
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
              placeholder="Ask anything: complaint status (CL-2026-000101), Ward 175 stats, SLAs, property tax, helplines..."
              className="flex-1 text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
