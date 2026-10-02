import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';
import { generateCivicResponse, CivicAssistantResult } from '@/lib/server/assistantEngine';

interface AssistantRequest {
  message: string;
  history?: Array<{ sender: 'user' | 'assistant'; text: string }>;
  language?: 'en' | 'ta';
}

// ---------------------------------------------------------------------------
// System Prompt Builder for External LLMs (Gemini, Groq, OpenAI)
// ---------------------------------------------------------------------------
function buildMunicipalSystemPrompt(language: 'en' | 'ta' = 'en'): string {
  const issues = serverDb.getIssues();
  const depts = serverDb.getDepartments();
  const wards = serverDb.getJurisdictions();
  const projects = serverDb.getProjects();

  const activeIssuesSummary = issues.slice(0, 10).map(
    (i) => `[${i.complaint_code}]: "${i.title}" | Status: ${i.status} | Dept: ${i.department_name} | Ward: ${i.jurisdiction_name} | SLA: ${i.sla_target_date} | Worker: ${i.assigned_field_worker_name || 'None'}`
  ).join('\n');

  const deptsSummary = depts.map(
    (d) => `${d.name} (${d.code}) - Phone: ${d.contact_phone}, Email: ${d.contact_email}`
  ).join('\n');

  const wardsSummary = wards.map(
    (w) => `${w.name} (Ward ${w.ward_number}, Zone: ${w.zone}) - GPS: (${w.center_lat}, ${w.center_lng})`
  ).join('\n');

  const projectsSummary = projects.map(
    (p) => `${p.name} - Budget: ₹${(p.approved_amount / 10000000).toFixed(2)} Cr, Spent: ₹${(p.expenditure / 10000000).toFixed(2)} Cr, Agency: ${p.agency}, Status: ${p.status}`
  ).join('\n');

  return [
    'You are CivicLens AI, the high-precision Municipal Transparency and Civic Governance Intelligence Assistant for the Greater Chennai Corporation (GCC) region.',
    '',
    '### LIVE CIVIC DATABASE CONTEXT:',
    `1. Total Active Complaints (${issues.length}):`,
    activeIssuesSummary,
    '',
    `2. Municipal Departments & Direct Helplines:`,
    deptsSummary,
    '',
    `3. Wards & Electoral Jurisdictions:`,
    wardsSummary,
    '',
    `4. Sanctioned Capital Projects & Budgets:`,
    projectsSummary,
    '',
    '### MANDATORY BEHAVIOR & DOMAIN RULES:',
    '1. HIGH SPECIFICITY: Never give generic, evasive, or vague answers. If asked about a ticket, give exact ticket code, status, SLA date, department, and worker.',
    '2. EXACT HELPLINES: GCC Central (1913), Metrowater (1916 / 044-45674567), TANGEDCO Electricity (1912 / WhatsApp 9445850811), Disaster (1070 / 1077), Police (100 / 112), Ambulance (108), Fire (101).',
    '3. STATUTORY SLAS: Water/Sewage bursts (24h), Streetlights (48h, live wires 2h), Garbage (48h), Road potholes (5 business days), Stormwater drains (48h), Parks (7 days).',
    '4. LEGAL RIGHTS & REMEDIES: For pothole vehicle damage, explain liability under Section 203 & 385 of Chennai City Municipal Corporation Act 1919 and Madras High Court rulings for tortious compensation. For RTI, explain Section 6(1) of RTI Act 2005 (₹10 fee, 30 days turnaround).',
    '5. CIVICLENS INTEGRITY ARCHITECTURE: Explain why photo gallery upload was disabled (mandates live camera capture to prevent fake complaints) and how the Dual-Stream Forensic CNN (Bayar-Stamm high-pass + ResNet-18) rejects synthetic AI photos.',
    '6. CITIZEN VERIFICATION LOCK: Explain that departments cannot close tickets unilaterally; complaints only close when the reporting citizen inspects on-site and marks "Completely Resolved".',
    '7. FORMATTING: Use clean GitHub markdown with bold headers, bullet points, and tables where applicable.',
    `8. LANGUAGE: If the user writes in Tamil or selects Tamil language (${language === 'ta'}), respond in fluent, professional, idiomatic Tamil with accurate civic terminology.`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// 1. Try Gemini LLM
// ---------------------------------------------------------------------------
async function tryCallGemini(
  query: string,
  history: Array<{ sender: 'user' | 'assistant'; text: string }> = [],
  language: 'en' | 'ta' = 'en'
): Promise<CivicAssistantResult | null> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) return null;

  try {
    const systemPrompt = buildMunicipalSystemPrompt(language);
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1200,
              },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate) {
            return {
              text: candidate,
              actions: [
                { label: 'File Complaint', href: '/report' },
                { label: 'Public Ledger', href: '/issues' },
                { label: 'Ward Map', href: '/map' },
              ],
              source: 'gemini-llm',
            };
          }
        }
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.warn('Gemini call error:', err);
  }

  return null;
}

// ---------------------------------------------------------------------------
// 2. Try Groq LLM (Llama-3.3-70B)
// ---------------------------------------------------------------------------
async function tryCallGroq(
  query: string,
  history: Array<{ sender: 'user' | 'assistant'; text: string }> = [],
  language: 'en' | 'ta' = 'en'
): Promise<CivicAssistantResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const systemPrompt = buildMunicipalSystemPrompt(language);
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-4).map((h) => ({
            role: h.sender === 'user' ? 'user' : 'assistant',
            content: h.text,
          })),
          { role: 'user', content: query },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const answer = data?.choices?.[0]?.message?.content;
      if (answer) {
        return {
          text: answer,
          actions: [
            { label: 'File Complaint', href: '/report' },
            { label: 'Public Ledger', href: '/issues' },
            { label: 'Ward Map', href: '/map' },
          ],
          source: 'groq-llm',
        };
      }
    }
  } catch (err) {
    console.warn('Groq call error:', err);
  }

  return null;
}

// ---------------------------------------------------------------------------
// 3. Try OpenAI LLM (GPT-4o-mini)
// ---------------------------------------------------------------------------
async function tryCallOpenAI(
  query: string,
  history: Array<{ sender: 'user' | 'assistant'; text: string }> = [],
  language: 'en' | 'ta' = 'en'
): Promise<CivicAssistantResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const systemPrompt = buildMunicipalSystemPrompt(language);
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-4).map((h) => ({
            role: h.sender === 'user' ? 'user' : 'assistant',
            content: h.text,
          })),
          { role: 'user', content: query },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const answer = data?.choices?.[0]?.message?.content;
      if (answer) {
        return {
          text: answer,
          actions: [
            { label: 'File Complaint', href: '/report' },
            { label: 'Public Ledger', href: '/issues' },
            { label: 'Ward Map', href: '/map' },
          ],
          source: 'openai-llm',
        };
      }
    }
  } catch (err) {
    console.warn('OpenAI call error:', err);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main Assistant API Route Handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body: AssistantRequest = await req.json();
    const message = body.message || '';
    const history = body.history || [];
    const language = body.language || 'en';

    if (!message.trim()) {
      return NextResponse.json(
        { error: 'Message cannot be empty.' },
        { status: 400 }
      );
    }

    // 1. Try LLM Providers (Gemini -> Groq -> OpenAI) if keys are provided
    const geminiRes = await tryCallGemini(message, history, language);
    if (geminiRes) return NextResponse.json(geminiRes);

    const groqRes = await tryCallGroq(message, history, language);
    if (groqRes) return NextResponse.json(groqRes);

    const openAiRes = await tryCallOpenAI(message, history, language);
    if (openAiRes) return NextResponse.json(openAiRes);

    // 2. High-Precision Civic Intelligence Engine (CCIE v3.0)
    // Deterministic, fact-driven, covers all 21 municipal domains
    const ledgerResponse = generateCivicResponse(message, history, language);

    return NextResponse.json(ledgerResponse);
  } catch (err: any) {
    console.error('Assistant API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
