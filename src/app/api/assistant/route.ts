import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server/db';

interface AssistantRequest {
  message: string;
  history?: Array<{ sender: 'user' | 'assistant'; text: string }>;
  language?: 'en' | 'ta';
}

interface AssistantResponse {
  text: string;
  actions?: Array<{ label: string; href: string }>;
  source?: 'gemini-llm' | 'live-ledger-engine';
}

// ---------------------------------------------------------------------------
// External LLM Calling (Gemini REST API) if key is configured
// ---------------------------------------------------------------------------
async function tryCallGemini(
  query: string,
  history: Array<{ sender: 'user' | 'assistant'; text: string }> = [],
  language: 'en' | 'ta' = 'en'
): Promise<AssistantResponse | null> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) return null;

  try {
    const issues = serverDb.getIssues();
    const depts = serverDb.getDepartments();
    const wards = serverDb.getJurisdictions();
    const projects = serverDb.getProjects();

    const sampleIssues = issues.slice(0, 5).map(
      (i) => `${i.complaint_code}: ${i.title} [Status: ${i.status}, Ward: ${i.jurisdiction_name}]`
    ).join('; ');

    const sampleProjects = projects.map(
      (p) => `${p.name} (₹${(p.approved_amount / 10000000).toFixed(2)} Cr, Status: ${p.status}, Loc: ${p.location})`
    ).join('; ');

    const systemPrompt = [
      'You are CivicLens AI, an expert municipal transparency and civic governance intelligence assistant for the Greater Chennai Corporation (GCC) region.',
      'Live Civic Data Context:',
      `- Active Tickets: ${issues.length} registered complaints (e.g. ${sampleIssues})`,
      `- Departments: ${depts.map((d) => `${d.name} (${d.code})`).join(', ')}`,
      `- Wards: ${wards.map((w) => `${w.name} (${w.zone})`).join(', ')}`,
      `- Infrastructure Projects: ${sampleProjects}`,
      '',
      'Instructions:',
      '1. Provide accurate, specific, and actionable answers. Avoid vague or generic responses.',
      '2. If the user asks about a complaint (e.g. CL-2026-000101), provide exact details from the database.',
      '3. If the user asks about a ward or department, give exact facts, SLAs, and responsible teams.',
      '4. Format using markdown with bullet points, bold highlights, and clean paragraphs.',
      `5. If the user language is Tamil (${language === 'ta'}), respond fluently in Tamil.`,
    ].join('\n');

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate) {
        return {
          text: candidate,
          source: 'gemini-llm',
        };
      }
    }
  } catch (err) {
    console.warn('Gemini API call failed, falling back to live ledger engine:', err);
  }

  return null;
}

// ---------------------------------------------------------------------------
// High-Precision Semantic & Live Ledger Engine (Deterministic, Free, Zero-API)
// ---------------------------------------------------------------------------
function handleLiveLedgerQuery(
  rawQuery: string,
  language: 'en' | 'ta' = 'en'
): AssistantResponse {
  const q = rawQuery.trim().toLowerCase();
  const isTamil = language === 'ta' || /[\u0B80-\u0BFF]/.test(rawQuery);

  const allIssues = serverDb.getIssues();
  const allDepts = serverDb.getDepartments();
  const allWards = serverDb.getJurisdictions();
  const allProjects = serverDb.getProjects();

  // 1. SPECIFIC TICKET / COMPLAINT LOOKUP (e.g. CL-2026-000101, #101)
  const isWardQuery = /\bward\b/i.test(rawQuery) || allWards.some((w) => q.includes(w.name.toLowerCase()));
  const ticketCodeMatch = !isWardQuery && (
    rawQuery.match(/CL[-_ ]?2026[-_ ]?(\d{1,6})/i) ||
    rawQuery.match(/(?:ticket|complaint|track|issue)\s*#?\s*(\d{1,6})/i) ||
    rawQuery.match(/#(\d{3,6})/)
  );
  if (ticketCodeMatch || (!isWardQuery && (q.includes('cl-2026') || (q.includes('ticket') && /\d+/.test(q))))) {
    const rawNumber = ticketCodeMatch ? ticketCodeMatch[1] : '';
    const formattedCode = rawNumber ? `CL-2026-${rawNumber.padStart(6, '0')}` : '';

    const matchedIssue = allIssues.find(
      (i) =>
        i.complaint_code.toLowerCase() === formattedCode.toLowerCase() ||
        i.complaint_code.toLowerCase().includes(rawQuery.toLowerCase().trim()) ||
        i.id.toLowerCase() === rawQuery.toLowerCase().trim()
    );

    if (matchedIssue) {
      const slaTarget = matchedIssue.sla_target_date ? new Date(matchedIssue.sla_target_date) : null;
      const now = new Date();
      const isOverdue = matchedIssue.is_overdue || (slaTarget && slaTarget.getTime() < now.getTime() && matchedIssue.status !== 'resolved' && matchedIssue.status !== 'closed');
      const daysLeft = slaTarget ? Math.ceil((slaTarget.getTime() - now.getTime()) / (1000 * 3600 * 24)) : null;

      let statusDescription = '';
      switch (matchedIssue.status) {
        case 'submitted':
          statusDescription = 'Complaint registered and waiting for department intake.';
          break;
        case 'assigned':
          statusDescription = `Auto-routed & dispatched to ${matchedIssue.department_name}.`;
          break;
        case 'in_progress':
          statusDescription = 'Field crew has mobilized and repair work is actively underway.';
          break;
        case 'resolved':
          statusDescription = 'Marked resolved by department. Awaiting your Citizen Verification.';
          break;
        case 'reopened':
          statusDescription = 'Resolution rejected by citizen due to incomplete work. Re-assigned with high priority.';
          break;
        case 'escalated':
          statusDescription = 'Escalated to Zonal Commissioner & Ward Councillor due to SLA breach.';
          break;
        case 'closed':
          statusDescription = 'Citizen inspected the site and verified resolution. Ticket closed.';
          break;
      }

      if (isTamil) {
        return {
          text: [
            `### 📋 புகார் விவரங்கள்: **${matchedIssue.complaint_code}**`,
            '',
            `- **தலைப்பு**: ${matchedIssue.title}`,
            `- **துறை**: ${matchedIssue.department_name}`,
            `- **நிலை**: **${matchedIssue.status.toUpperCase()}** (${statusDescription})`,
            `- **வார்டு & இடம்**: ${matchedIssue.location_text} (${matchedIssue.jurisdiction_name})`,
            `- **தீவிர நிலை**: ${matchedIssue.severity.toUpperCase()}`,
            `- **SLA காலக்கெடு**: ${slaTarget ? slaTarget.toLocaleDateString() : 'N/A'} ${isOverdue ? '⚠️ (காலக்கெடு தாண்டியது)' : `(${daysLeft} நாட்கள் மீதமுள்ளன)`}`,
            `- **விவரங்கள்**: ${matchedIssue.description}`,
            '',
            'பொது ஆய்வறிக்கை பக்கத்தில் இந்த புகாரைக் கண்காணிக்கலாம்.',
          ].join('\n'),
          actions: [
            { label: `புகாரைப் பார்க்கவும் (${matchedIssue.complaint_code})`, href: `/issues/${matchedIssue.id}` },
            { label: 'அனைத்து புகார்கள்', href: '/issues' },
          ],
        };
      }

      return {
        text: [
          `### 📋 Live Complaint Tracking: **${matchedIssue.complaint_code}**`,
          '',
          `- **Title**: ${matchedIssue.title}`,
          `- **Responsible Department**: **${matchedIssue.department_name}**`,
          `- **Current Status**: **${matchedIssue.status.toUpperCase()}** — ${statusDescription}`,
          `- **Location**: ${matchedIssue.location_text} (${matchedIssue.jurisdiction_name})`,
          `- **Severity**: ${matchedIssue.severity.toUpperCase()}`,
          `- **Target SLA Date**: ${slaTarget ? slaTarget.toLocaleDateString() : 'N/A'} ${isOverdue ? '⚠️ **(SLA BREACHED / OVERDUE)**' : `(${daysLeft} days remaining)`}`,
          `- **Reported On**: ${new Date(matchedIssue.created_at).toLocaleDateString()}`,
          `- **Citizen Verification**: ${matchedIssue.verification ? `Verified by citizen (${matchedIssue.verification.result.replace('_', ' ')})` : 'Pending citizen inspection'}`,
          '',
          `*Details*: ${matchedIssue.description}`,
        ].join('\n'),
        actions: [
          { label: `Open Ticket ${matchedIssue.complaint_code}`, href: `/issues/${matchedIssue.id}` },
          matchedIssue.status === 'resolved'
            ? { label: 'Verify Resolution Now', href: `/issues/${matchedIssue.id}` }
            : { label: 'View on Ward Map', href: '/map' },
        ],
      };
    } else if (formattedCode) {
      return {
        text: `Ticket **${formattedCode}** was not found in the live CivicLens ledger. Please verify the 6-digit ticket code. You can browse active complaints on the public ledger.`,
        actions: [{ label: 'Browse Public Ledger', href: '/issues' }],
      };
    }
  }

  // 2. QUERY ABOUT WARD OR CONSTITUENCY (e.g. Ward 175, Velachery, Adyar, Mylapore)
  const matchedWard = allWards.find((w) => {
    const rawNum = w.ward_number.replace(/\D/g, ''); // e.g. "175"
    const parts = w.name.toLowerCase().split(/[-–—]/).map((s) => s.trim()); // ["ward 175", "velachery"]
    return (
      q.includes(w.id.toLowerCase()) ||
      (rawNum && (q.includes(`ward ${rawNum}`) || q.includes(`ward-${rawNum}`) || q.includes(`w-${rawNum}`) || q.includes(rawNum))) ||
      parts.some((p) => p && q.includes(p))
    );
  });

  if (matchedWard || q.includes('ward') || q.includes('constituency') || q.includes('zone')) {
    const targetWard = matchedWard || allWards[0];
    const wardIssues = allIssues.filter((i) => i.jurisdiction_id === targetWard.id);
    const openCount = wardIssues.filter((i) => i.status !== 'closed').length;
    const resolvedCount = wardIssues.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
    const overdueCount = wardIssues.filter((i) => i.is_overdue).length;
    const wardProjects = allProjects.filter((p) =>
      p.location.toLowerCase().includes(targetWard.name.toLowerCase())
    );

    if (isTamil) {
      return {
        text: [
          `### 🏛️ வார்டு அறிக்கை: **${targetWard.name} (${targetWard.zone})**`,
          '',
          `- **வார்டு எண்**: ${targetWard.ward_number}`,
          `- **மண்டலம்**: ${targetWard.zone}`,
          `- **பகுதி விவரம்**: ${targetWard.area_description}`,
          '',
          '**நிகழ்நிலை புகார்கள் விவரம்:**',
          `- நிலுவையில் உள்ள புகார்கள்: **${openCount}**`,
          `- தீர்க்கப்பட்ட புகார்கள்: **${resolvedCount}**`,
          `- காலக்கெடு மீறியவை (Overdue): **${overdueCount}**`,
          `- நடந்துவரும் திட்டங்கள்: **${wardProjects.length}**`,
        ].join('\n'),
        actions: [
          { label: `${targetWard.name} வரைபடம் பார்க்க`, href: `/map` },
          { label: 'இந்த வார்டில் புகார் செய்ய', href: `/report` },
        ],
      };
    }

    return {
      text: [
        `### 🏛️ Ward Jurisdiction Profile: **${targetWard.name} (${targetWard.zone})**`,
        '',
        `- **Ward Number**: ${targetWard.ward_number}`,
        `- **Zone**: ${targetWard.zone}`,
        `- **Area Coverage**: ${targetWard.area_description}`,
        `- **GPS Coordinates**: ${targetWard.center_lat.toFixed(4)}° N, ${targetWard.center_lng.toFixed(4)}° E`,
        '',
        `**Live Municipal Metrics in ${targetWard.name}:**`,
        `- Total Reported Complaints: **${wardIssues.length}**`,
        `- Active Unresolved Complaints: **${openCount}**`,
        `- Successfully Resolved: **${resolvedCount}**`,
        `- SLA Overdue Complaints: **${overdueCount}**`,
        `- Active Infrastructure Projects: **${wardProjects.length}** (${wardProjects.map((p) => p.name).join(', ') || 'Standard maintenance'})`,
      ].join('\n'),
      actions: [
        { label: `View ${targetWard.name} on Map`, href: '/map' },
        { label: 'Report Issue in this Ward', href: '/report' },
      ],
    };
  }

  // 3. SPECIFIC DEPARTMENT INQUIRY (Roads, Sanitation, Water, Streetlights, Electrical)
  const matchedDept = allDepts.find(
    (d) =>
      q.includes(d.name.toLowerCase()) ||
      ((d.code === 'ROADS' || d.code === 'DEPT-ROADS') && (q.includes('road') || q.includes('pothole') || q.includes('tar') || q.includes('asphalt') || q.includes('footpath') || q.includes('பள்ள') || q.includes('சாலை') || q.includes('ரோடு') || q.includes('குழி'))) ||
      ((d.code === 'DRAIN' || d.code === 'DEPT-DRAINAGE') && (q.includes('drain') || q.includes('storm') || q.includes('flood') || q.includes('canal') || q.includes('வடிகால்') || q.includes('வெள்ளம்'))) ||
      ((d.code === 'SAN' || d.code === 'DEPT-SANITATION') && (q.includes('garbage') || q.includes('waste') || q.includes('trash') || q.includes('bin') || q.includes('dump') || q.includes('sanitat') || q.includes('குப்பை') || q.includes('கழிவு'))) ||
      ((d.code === 'ELEC' || d.code === 'DEPT-ELECTRICAL') && (q.includes('light') || q.includes('lamp') || q.includes('electric') || q.includes('pole') || q.includes('wire') || q.includes('dark') || q.includes('விளக்கு') || q.includes('மின்சாரம்') || q.includes('இருட்டு'))) ||
      ((d.code === 'WATER' || d.code === 'DEPT-METROWATER') && (q.includes('water') || q.includes('sewage') || q.includes('sewer') || q.includes('pipe') || q.includes('leak') || q.includes('drinking') || q.includes('குடிநீர்') || q.includes('சாக்கடை') || q.includes('கழிவுநீர்') || q.includes('கசிவு'))) ||
      (d.code === 'PARKS' && (q.includes('park') || q.includes('tree') || q.includes('garden') || q.includes('மரம்') || q.includes('பூங்கா')))
  );

  if (matchedDept) {
    const deptIssues = allIssues.filter((i) => i.department_id === matchedDept.id);
    const activeDeptIssues = deptIssues.filter((i) => i.status !== 'closed');

    let slaNotice = '';
    let commonIssues = '';
    switch (matchedDept.code) {
      case 'ROADS':
      case 'DEPT-ROADS':
        slaNotice = 'Standard Resolution Target: **5 Working Days (120 Hours)**';
        commonIssues = 'Potholes, cratered stretches, missing speed bumps, broken curbs, sunken inspection lids.';
        break;
      case 'DRAIN':
      case 'DEPT-DRAINAGE':
        slaNotice = 'Standard Resolution Target: **24 to 48 Hours** (Emergency during monsoon: 4 Hours)';
        commonIssues = 'Clogged stormwater drains, waterlogging, broken catch-pit grates, silt accumulation.';
        break;
      case 'SAN':
      case 'DEPT-SANITATION':
        slaNotice = 'Standard Resolution Target: **24 to 48 Hours**';
        commonIssues = 'Overflowing green/blue bins, unattended road sweeping, debris dumping, dead animal clearance.';
        break;
      case 'ELEC':
      case 'DEPT-ELECTRICAL':
        slaNotice = 'Standard Resolution Target: **48 Hours** (Dangerous exposed wires: 2 Hours)';
        commonIssues = 'Dead LED streetlights, flickering fixtures, damaged poles, hanging overhead service cables.';
        break;
      case 'WATER':
      case 'DEPT-METROWATER':
        slaNotice = 'Standard Resolution Target: **24 Hours** for sewage backflow, **48 Hours** for pipeline ruptures';
        commonIssues = 'Drinking water pipeline bursts, manhole overflows, contaminated tap water, low pressure.';
        break;
      case 'PARKS':
        slaNotice = 'Standard Resolution Target: **7 Days** (Uprooted fallen tree: 12 Hours)';
        commonIssues = 'Park maintenance, fallen branches, broken playground equipment, open grounds.';
        break;
    }

    if (isTamil) {
      return {
        text: [
          `### 🏢 துறை விவரம்: **${matchedDept.name}**`,
          '',
          `- **துறை குறியீடு**: ${matchedDept.code}`,
          `- **விவரம்**: ${matchedDept.description}`,
          `- **தொடர்பு தொலைபேசி**: ${matchedDept.contact_phone}`,
          `- **மின்னஞ்சல்**: ${matchedDept.contact_email}`,
          `- **தீர்வு காலக்கெடு (SLA)**: ${slaNotice}`,
          `- **கையாளும் பிரச்சினைகள்**: ${commonIssues}`,
          `- **தற்போதைய நிலுவை புகார்கள்**: ${activeDeptIssues.length} புகார்கள்`,
        ].join('\n'),
        actions: [
          { label: 'புகார் பதிவு செய்ய', href: '/report' },
          { label: 'துறை புகார்களைக் காண', href: '/issues' },
        ],
      };
    }

    return {
      text: [
        `### 🏢 Municipal Department: **${matchedDept.name}**`,
        '',
        `- **Department Code**: [${matchedDept.code}]`,
        `- **Description**: ${matchedDept.description}`,
        `- **Direct Helpline**: **${matchedDept.contact_phone}**`,
        `- **Department Email**: ${matchedDept.contact_email}`,
        `- **SLA Commitment**: ${slaNotice}`,
        `- **Primary Responsibilities**: ${commonIssues}`,
        `- **Current Workload**: **${activeDeptIssues.length} active complaints** currently dispatched across Chennai South.`,
      ].join('\n'),
      actions: [
        { label: `Report to ${matchedDept.name}`, href: '/report' },
        { label: 'View Department Queue', href: '/issues' },
      ],
    };
  }

  // 4. SLA AND ESCALATION MECHANISM
  if (q.includes('sla') || q.includes('time') || q.includes('how long') || q.includes('days') || q.includes('target') || q.includes('deadline') || q.includes('escalat')) {
    if (isTamil) {
      return {
        text: [
          '### ⏱️ சிவிக்லென்ஸ் தீர்வு காலக்கெடு (SLA) மற்றும் மேல்முறையீடு (Escalation)',
          '',
          'ஒவ்வொரு புகாருக்கும் மாநகராட்சி விதிகளின்படி குறிப்பிட்ட தீர்வு காலக்கெடு உள்ளது:',
          '',
          '| வகை | தீர்வு காலக்கெடு (SLA) |',
          '| :--- | :--- |',
          '| **குடிநீர் குழாய் உடைப்பு & கழிவுநீர் கசிவு** | **24 மணிநேரம்** |',
          '| **மின்விளக்கு பழுது (Streetlights)** | **48 மணிநேரம்** |',
          '| **குப்பை அகற்றுதல் (Garbage Removal)** | **48 மணிநேரம்** |',
          '| **சாலை பழுது & குழிகள் (Potholes)** | **5 நாட்கள்** |',
          '| **பூங்கா மற்றும் பொது இடங்கள் பராமரிப்பு** | **7 நாட்கள்** |',
          '',
          '**மேல்முறையீடு செய்வது எப்படி?**',
          'குறிப்பிட்ட காலக்கெடுவுக்குள் துறை நடவடிக்கை எடுக்கவில்லை எனில், புகார் தானாக **SLA Overdue** என மாறும். புகார் பக்கத்தில் உள்ள **"Escalate Issue"** பொத்தானை அழுத்துவதன் மூலம் மண்டல ஆணையர் மற்றும் மாமன்ற உறுப்பினருக்கு நேரடி எச்சரிக்கை அனுப்பலாம்.',
        ].join('\n'),
        actions: [
          { label: 'நிலுவை புகார்களைக் காண்க', href: '/issues' },
          { label: 'டாஷ்போர்டு பார்க்க', href: '/dashboard' },
        ],
      };
    }

    return {
      text: [
        '### ⏱️ CivicLens Service Level Agreements (SLA) & Escalation Hierarchy',
        '',
        'Every civic complaint logged on CivicLens is legally governed by municipal turnaround commitments:',
        '',
        '| Civic Category | Target Resolution SLA | Emergency Protocol |',
        '| :--- | :--- | :--- |',
        '| **Water Supply & Sewage Leaks** | **24 Hours** | Immediate dispatch (within 4 hrs) |',
        '| **Streetlights & Electrical Hazards** | **48 Hours** | Exposed live wires: 2 Hours |',
        '| **Garbage & Solid Waste** | **48 Hours** | Bulk overflow: 24 Hours |',
        '| **Roads, Potholes & Craters** | **5 Business Days** | Arterial bus routes prioritized |',
        '| **Stormwater Drainage & Floods** | **48 Hours** | Monsoon alert: 6 Hours |',
        '| **Parks & Public Open Spaces** | **7 Days** | Fallen trees: 12 Hours |',
        '',
        '### 🚨 How Escalation Works:',
        '1. If a ticket exceeds its SLA date without department progress, it automatically flags as **SLA OVERDUE** in public ledgers.',
        '2. Citizens can click the **"Escalate Issue"** button directly on the ticket page.',
        '3. The system generates an official Escalation Tracking Code (e.g., ESC-2026-9041) and dispatches high-priority SMS/email alerts to the **Zonal Commissioner** and the **Constituency MLA / Ward Councillor**.',
      ].join('\n'),
      actions: [
        { label: 'View Overdue Issues', href: '/issues' },
        { label: 'Executive Dashboard', href: '/dashboard' },
      ],
    };
  }

  // 5. EMERGENCY HELPLINES & CRISIS CONTACTS
  if (
    /\b(helpline|emergency|police|ambulance|fire|disaster|tollfree|1913|100|101|108|1912)\b/i.test(rawQuery) ||
    q.includes('emergency contact') ||
    q.includes('urgent contact')
  ) {
    if (isTamil) {
      return {
        text: [
          '### 📞 அவசர உதவி மற்றும் மாநகராட்சி தொலைபேசி எண்கள்',
          '',
          '- **மாநகராட்சி மத்திய உதவி மையம்**: **1913** (24x7 புகார் பிரிவு)',
          '- **குடிநீர் & கழிவுநீர் வாரியம் (Metrowater)**: **044-45674567** / **1916**',
          '- **மின்வாரிய புகார்கள் (TANGEDCO)**: **1912** / வாட்ஸ்அப்: 9445850811',
          '- **பேரிடர் மேலாண்மை & வெள்ளக் கட்டுப்பாடு**: **1070** / **1077**',
          '- **காவல்துறை அவசர உதவி**: **100** / **112**',
          '- **தீயணைப்பு & மீட்புப்பணி**: **101**',
          '- **ஆம்புலன்ஸ் அவசர சிகிச்சை**: **108**',
          '- **போக்குவரத்து நெரிசல் / சாலை அடைப்பு**: **103**',
          '- **மகளிர் உதவி மையம்**: **1091**',
          '- **குழந்தைகள் உதவி மையம்**: **1098**',
        ].join('\n'),
      };
    }

    return {
      text: [
        '### 📞 Essential Civic & Emergency Helplines (Chennai Region)',
        '',
        '- **GCC 24x7 Citizen Helpline**: **1913** (Central Grievance Redressal)',
        '- **Metrowater Sewage & Water Emergency**: **044-45674567** / **1916**',
        '- **TANGEDCO Electricity Complaints**: **1912** / WhatsApp: 9445850811',
        '- **Disaster Management & Flood Control**: **1070** (State) / **1077** (District)',
        '- **Police Emergency**: **100** / **112**',
        '- **Fire & Rescue**: **101**',
        '- **Ambulance Emergency**: **108**',
        '- **Traffic Police Road Blockage**: **103**',
        '- **Women Helpline**: **1091**',
        '- **Childline**: **1098**',
      ].join('\n'),
    };
  }

  // 6. RESOLUTION VERIFICATION AND REOPENING PROCESS
  if (q.includes('verif') || q.includes('reopen') || q.includes('close') || q.includes('resolved') || q.includes('citizen check') || q.includes('fake resolution')) {
    if (isTamil) {
      return {
        text: [
          '### 🛡️ சிவிக்லென்ஸ் குடிமக்கள் சரிபார்ப்பு (Citizen Verification)',
          '',
          'சிவிக்லென்ஸில் ஒரு அரசுத் துறை புகாரை "தீர்க்கப்பட்டது" (Resolved) என குறிப்பிட்டால், அது உடனடியாக மூடப்படாது!',
          '',
          '1. **நேரடி ஆய்வு அறிவிப்பு**: புகார் அளித்த குடிமகனுக்கு அறிவிப்பு வரும்.',
          '2. **இரண்டு தேர்வுகள்**:',
          '   - **முழுமையாக சரிசெய்யப்பட்டது (Completely Resolved)**: புகாரை உறுதிசெய்து நிறைவு செய்யலாம்.',
          '   - **முழுமையாக சரிசெய்யப்படவில்லை (Not Resolved / Partial)**: களப்பணி திருப்திகரமாக இல்லை எனில், தற்போதைய புகைப்படத்தை இணைத்து புகாரை மீண்டும் திறக்கலாம் (**Reopen**).',
          '3. **மறுதிறக்கப்பட்ட புகார்கள்**: உடனடியாக உயர் அதிகாரிகளின் நேரடி மேற்பார்வைக்கு அனுப்பப்படும்.',
        ].join('\n'),
        actions: [{ label: 'என் புகார்களைச் சரிபார்க்க', href: '/my-complaints' }],
      };
    }

    return {
      text: [
        '### 🛡️ Two-Factor Citizen Resolution Verification Policy',
        '',
        'In conventional municipal grievance portals, departments frequently close tickets with fake "Work Finished" notes without fixing the issue. CivicLens prevents this via **Mandatory Citizen Verification**:',
        '',
        '1. **Department Claim**: The field engineer uploads a completion photograph and changes status to **Resolved**.',
        '2. **Citizen Lockout**: The ticket is **NOT** closed. It enters a 72-hour citizen verification window.',
        '3. **Citizen Inspection Options**:',
        '   - **Option A: Completely Resolved** → Citizen confirms quality; complaint is officially entered into the permanent transparency ledger as **Closed**.',
        '   - **Option B: Partially / Not Resolved** → Citizen flags shoddy, incomplete, or cosmetic repairs and attaches an inspection photo. The ticket immediately converts to **REOPENED** with high-priority supervisory escalation.',
        '',
        'This guarantees contractors and departments cannot manipulate resolution numbers.',
      ].join('\n'),
      actions: [
        { label: 'Inspect My Complaints', href: '/my-complaints' },
        { label: 'Browse Public Ledger', href: '/issues' },
      ],
    };
  }

  // 7. AI IMAGE DETECTOR & EVIDENCE INTEGRITY
  if (
    /\b(ai|cvt-?13|deepfake|synthetic|detector|authenticity|spectral|exif|diffusion)\b/i.test(rawQuery) ||
    q.includes('fake photo') ||
    q.includes('fake image') ||
    q.includes('ai image') ||
    q.includes('ai photo') ||
    q.includes('reject image') ||
    q.includes('reject photo') ||
    q.includes('evidence rejected')
  ) {
    if (isTamil) {
      return {
        text: [
          '### 🤖 சிவிக்லென்ஸ் AI புகைப்பட உண்மைத்தன்மை சரிபார்ப்பு',
          '',
          'சிவிக்லென்ஸ் போலி மற்றும் AI-உருவாக்கிய (Midjourney, DALL-E, Stable Diffusion) புகைப்படங்களை உடனுக்குடன் கண்டறிந்து நிராகரிக்கிறது (**Reject**):',
          '',
          '- **Microsoft CvT-13 & நிறமாலை தடயவியல்**: புகைப்படத்தின் EXIF தகவல்கள், அதிர்வெண் அலைவரிசை (2D FFT) மற்றும் கேமரா சென்சார் சத்தங்களை ஆராய்கிறது.',
          '- **நிராகரிப்பு விதி**: செயற்கை அல்லது போலியாக உருவாக்கப்பட்ட புகைப்படங்கள் கண்டறியப்பட்டால், புகார் பதிவு செய்ய முடியாது.',
          '- **உண்மையான புகைப்படங்கள் மட்டுமே**: களத்தில் கேமராவில் எடுக்கப்பட்ட நேரடி புகைப்படங்கள் மட்டுமே ஏற்றுக்கொள்ளப்படும்.',
        ].join('\n'),
        actions: [
          { label: 'புகார் பதிவு செய்ய', href: '/report' },
          { label: 'AI சர்வர் நிலை சரிபார்க்க', href: 'http://localhost:5001/health' },
        ],
      };
    }

    return {
      text: [
        '### 🤖 AI Image Authenticity & Forensic Inspection Architecture',
        '',
        'To prevent fabricated complaints, politically motivated spam, or deepfaked road hazards, CivicLens embeds an **AI Image Authenticity Microservice** powered by Microsoft CvT-13 and multi-spectral forensics:',
        '',
        '1. **EXIF & Parameter Metadata Scanner**: Inspects binary headers for generative prompts and parameters from Stable Diffusion, Midjourney, DALL-E, ComfyUI, and Firefly.',
        '2. **2D Fast Fourier Transform (FFT) Analysis**: Computes frequency spectrum decay ratios to identify non-optical latent space decoding signatures.',
        '3. **Micro-Texture Gradient Variance**: Distinguishes true optical camera sensor shot noise (> 10.0) from synthetic generative smoothness (< 2.5).',
        '4. **RGB Bayer Cross-Correlation**: Analyzes chromatic channel consistency against generative dispersion.',
        '',
        '### 🚫 Strict Evidence Rejection:',
        'If synthetic evidence is detected, the UI instantly renders a red **Evidence Rejected** alert, disables navigation past Step 3, and the backend returns **HTTP 422 Unprocessable Entity**. Only genuine camera captures are permitted.',
      ].join('\n'),
      actions: [
        { label: 'Test Authenticity Scanner', href: '/report' },
        { label: 'View Health Check', href: 'http://localhost:5001/health' },
      ],
    };
  }

  // 7. PUBLIC WORKS & INFRASTRUCTURE PROJECTS
  if (q.includes('project') || q.includes('budget') || q.includes('contractor') || q.includes('expenditure') || q.includes('fund') || q.includes('smart city') || q.includes('work')) {
    const totalBudget = allProjects.reduce((sum, p) => sum + (p.approved_amount || 0), 0);

    return {
      text: [
        '### 🏗️ Public Works & Capital Infrastructure Ledger',
        '',
        'CivicLens monitors sanctioned government public works, contractor accountability, and financial disbursements:',
        '',
        `- **Active Projects Tracked**: **${allProjects.length} Infrastructure Works**`,
        `- **Total Sanctioned Capital**: **₹${(totalBudget / 10000000).toFixed(2)} Crores**`,
        '',
        '**Key Ongoing Projects in Chennai:**',
        ...allProjects.map(
          (p) =>
            `- **${p.name}** (${p.location})\n  - Executing Agency: *${p.agency}*\n  - Sanction: ₹${(p.approved_amount / 10000000).toFixed(2)} Cr | Spent: ₹${(p.expenditure / 10000000).toFixed(2)} Cr\n  - Status: **${p.status.toUpperCase()}** (Target Completion: ${p.expected_completion})`
        ),
      ].join('\n'),
      actions: [
        { label: 'Browse Public Projects', href: '/projects' },
        { label: 'Open Map View', href: '/map' },
      ],
    };
  }

  // 8. GENERAL CIVIC SERVICES: PROPERTY TAX, BIRTH/DEATH CERTIFICATES, TRADE LICENSES, RTI
  if (q.includes('property tax') || q.includes('tax') || q.includes('birth certificate') || q.includes('death certificate') || q.includes('trade license') || q.includes('rti')) {
    if (q.includes('property tax') || q.includes('tax')) {
      return {
        text: [
          '### 💳 Greater Chennai Corporation (GCC) Property Tax Guide',
          '',
          '- **Online Portal**: Available on the official GCC portal (chennaicorporation.gov.in).',
          '- **Payment Frequency**: Half-yearly (April–September and October–March).',
          '- **Early Payment Incentive**: GCC provides a **5% incentive rebate** (up to ₹5,000) for citizens paying within the first 15 days of each half-year cycle.',
          '- **Payment Modes**: Online credit/debit card, UPI, NetBanking, or at GCC E-Seva walk-in counters.',
          '- **Assessment Revision**: If your square footage or property usage changes, submit an online assessment modification request with your latest property deed.',
        ].join('\n'),
        actions: [{ label: 'GCC Official Portal', href: 'https://chennaicorporation.gov.in' }],
      };
    }

    if (q.includes('birth') || q.includes('death')) {
      return {
        text: [
          '### 📄 Birth & Death Certificate Procedures in Tamil Nadu',
          '',
          '- **Institutional Births/Deaths**: Hospitals automatically report occurrences to the GCC Sanitary Inspector within 21 days.',
          '- **Download Free Certificate**: Citizens can search, view, and download digital QR-coded certificates for free via the Civil Registration System (CRS) portal (crstn.org).',
          '- **Late Registration**: Occurrences reported after 21 days but within 30 days require a late fee. Beyond 1 year requires an order from the Judicial Magistrate (Revenue Divisional Officer).',
          '- **Corrections**: Name corrections or spelling errors can be submitted at your local Zonal Office with school transfer certificates or passport verification.',
        ].join('\n'),
      };
    }

    if (q.includes('rti') || q.includes('right to information')) {
      return {
        text: [
          '### ⚖️ How to File an RTI (Right to Information) in Civic Matters',
          '',
          '- **Applicability**: Under Section 6(1) of the RTI Act 2005, any citizen can request expenditure records, contractor agreements, and road work measurements from the Greater Chennai Corporation.',
          '- **Filing Authority**: Address to the Public Information Officer (PIO), Greater Chennai Corporation, Ripon Building, Chennai 600003.',
          '- **Fee**: ₹10 via Court Fee Stamp, Demand Draft, or Indian Postal Order payable to "The Commissioner, Greater Chennai Corporation".',
          '- **Mandatory Turnaround**: The PIO is legally required to respond within **30 days** (or 48 hours if related to life and liberty).',
        ].join('\n'),
      };
    }
  }

  // 9. HOW TO REPORT AN ISSUE / APP WORKFLOW
  if (q.includes('how to report') || q.includes('report') || q.includes('file a complaint') || q.includes('submit')) {
    return {
      text: [
        '### 📝 Step-by-Step: How to Report an Issue on CivicLens',
        '',
        'Follow these 5 simple steps to register an accountable municipal complaint:',
        '',
        '1. **Step 1: Select Category** — Choose Roads, Streetlights, Garbage, Water Supply, Drainage, or Public Parks.',
        '2. **Step 2: Enter Details** — Provide a clear title and describe the exact ground condition and severity.',
        '3. **Step 3: Attach Evidence Photo** — Upload an authentic camera photo. The AI Authenticity Scanner verifies that the image was not generated by AI.',
        '4. **Step 4: Pin Location** — Click **"Use Current GPS"** to auto-detect your exact location and ward, or drag the pin on OpenStreetMap.',
        '5. **Step 5: Review & Submit** — Confirm the auto-calculated SLA and routed department, then submit to receive your permanent tracking ID (e.g. CL-2026-000101).',
      ].join('\n'),
      actions: [{ label: 'Start Reporting Now', href: '/report' }],
    };
  }

  // 10. COMPREHENSIVE INTELLIGENT DEFAULT (No vague text, high-value specific answer)
  const defaultWardName = allWards && allWards.length > 0 ? allWards[0].name : 'Velachery (Ward 175)';
  const totalSanctioned = allProjects.reduce((s, p) => s + (p.approved_amount || 0), 0);

  if (isTamil) {
    return {
      text: [
        '### 🤝 சிவிக்லென்ஸ் வழிகாட்டி',
        '',
        `நீங்கள் கேட்ட கேள்வி: *"${rawQuery}"*`,
        '',
        'சிவிக்லென்ஸ் மூலம் நீங்கள் செய்யக்கூடியவை:',
        '- **புகார் பதிவு செய்ய**: சாலைப் பள்ளங்கள், எரியாத தெருவிளக்குகள், குப்பைக் குவியல்கள், குடிநீர் மற்றும் கழிவுநீர் கசிவுகளைப் புகாரளிக்கலாம்.',
        '- **துறை கண்காணிப்பு**: உங்கள் புகாரை எந்தத் துறை கையாள்கிறது மற்றும் அதன் SLA காலக்கெடுவை அறிந்து கொள்ளலாம்.',
        '- **புகார் நிலை அறிய**: உங்கள் புகார் எண்ணை (எ.கா. CL-2026-000101) உள்ளிட்டு நிகழ்நிலை நிலவரத்தை அறியலாம்.',
        '- **குடிமக்கள் சரிபார்ப்பு**: அதிகாரிகள் பணி முடித்ததாக அறிவித்தாலும், நீங்கள் ஆய்வு செய்து ஒப்புதல் அளித்தால் மட்டுமே புகார் மூடப்படும்.',
        '',
        'மேலும் விவரங்களுக்கு கீழேயுள்ள இணைப்புகளைப் பயன்படுத்தவும்.',
      ].join('\n'),
      actions: [
        { label: 'புதிய புகார் பதிவு செய்ய', href: '/report' },
        { label: 'புகார்கள் பட்டியல்', href: '/issues' },
        { label: 'வரைபடம் பார்க்க', href: '/map' },
      ],
    };
  }

  return {
    text: [
      '### 🏛️ CivicLens Assistant Response',
      '',
      `You asked: *"${rawQuery}"*`,
      '',
      'Here are specific insights and actionable services relevant to your request:',
      '',
      '- **Reporting Infrastructure**: You can file geo-tagged, AI-verified civic complaints for Roads, Sanitation, Metrowater, Drainage, and Streetlights with automated departmental dispatch.',
      '- **Tracking Active Complaints**: Search by 6-digit ticket code (e.g., CL-2026-000101) to inspect real-time field progress, assigned workers, and remaining SLA hours.',
      `- **Ward Operations (${defaultWardName} & Chennai South)**: Real-time oversight across ${allWards.length} municipal wards with ${allIssues.length} active complaints currently monitored.`,
      `- **Public Works Transparency**: Track capital projects totaling ₹${(totalSanctioned / 10000000).toFixed(2)} Cr with verified contractor milestones.`,
      '',
      'Select an action below or ask about any specific ticket, ward, department, or municipal regulation:',
    ].join('\n'),
    actions: [
      { label: 'Report a Civic Issue', href: '/report' },
      { label: 'Explore Public Ledger', href: '/issues' },
      { label: 'Ward GIS Map', href: '/map' },
      { label: 'Operations Dashboard', href: '/dashboard' },
    ],
  };
}

// ---------------------------------------------------------------------------
// API Route Handler
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

    // 1. Try external LLM (Gemini) if configured
    const llmResponse = await tryCallGemini(message, history, language);
    if (llmResponse) {
      return NextResponse.json(llmResponse);
    }

    // 2. High-Precision Live Ledger & Semantic Knowledge Engine
    const ledgerResponse = handleLiveLedgerQuery(message, language);
    return NextResponse.json({
      ...ledgerResponse,
      source: 'live-ledger-engine',
    });
  } catch (err: any) {
    console.error('Assistant API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
