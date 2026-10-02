/**
 * CivicLens Comprehensive Civic Intelligence Engine (CCIE v3.0)
 * 
 * Provides ultra-specific, fact-driven, legally grounded, and actionable
 * municipal intelligence across all domains of civic governance.
 * Integrates directly with the live CivicLens ledger database.
 */

import { serverDb } from './db';
import { CivicIssue, Department, Jurisdiction, PublicProject } from '@/types';

export interface CivicAssistantResult {
  text: string;
  actions?: Array<{ label: string; href: string }>;
  source: 'gemini-llm' | 'groq-llm' | 'openai-llm' | 'live-ledger-engine';
}

// ---------------------------------------------------------------------------
// HELPER: Detect if input is Tamil
// ---------------------------------------------------------------------------
export function isTamilText(text: string, languagePref?: string): boolean {
  return languagePref === 'ta' || /[\u0B80-\u0BFF]/.test(text);
}

// ---------------------------------------------------------------------------
// CORE DISPATCHER
// ---------------------------------------------------------------------------
export function generateCivicResponse(
  rawQuery: string,
  history: Array<{ sender: 'user' | 'assistant'; text: string }> = [],
  languagePref: 'en' | 'ta' = 'en'
): CivicAssistantResult {
  const q = rawQuery.trim().toLowerCase();
  const isTamil = isTamilText(rawQuery, languagePref);

  const allIssues = serverDb.getIssues();
  const allDepts = serverDb.getDepartments();
  const allWards = serverDb.getJurisdictions();
  const allProjects = serverDb.getProjects();
  const allCategories = serverDb.getCategories();

  // =========================================================================
  // 1. SPECIFIC TICKET LOOKUP BY CODE OR ID
  // e.g. CL-2026-000101, #101, 101, issue-1790842617103
  // =========================================================================
  const ticketCodeMatch =
    rawQuery.match(/CL[-_ ]?2026[-_ ]?(\d{1,6})/i) ||
    rawQuery.match(/(?:ticket|complaint|track|issue)\s*#?\s*(\d{1,6})/i) ||
    rawQuery.match(/#(\d{3,6})/) ||
    rawQuery.match(/issue-(\d{10,})/i);

  const isNumericOnly = /^\d{3,6}$/.test(rawQuery.trim());

  if (ticketCodeMatch || isNumericOnly || q.includes('cl-2026') || (q.includes('ticket') && /\d+/.test(q))) {
    let searchCode = '';
    if (ticketCodeMatch) {
      searchCode = ticketCodeMatch[0].toUpperCase();
      if (ticketCodeMatch[1] && !searchCode.includes('ISSUE-')) {
        searchCode = `CL-2026-${ticketCodeMatch[1].padStart(6, '0')}`;
      }
    } else if (isNumericOnly) {
      searchCode = `CL-2026-${rawQuery.trim().padStart(6, '0')}`;
    }

    const matchedIssue = allIssues.find((i) => {
      const cCode = i.complaint_code.toUpperCase();
      const rawId = i.id.toUpperCase();
      return (
        cCode === searchCode ||
        cCode.includes(rawQuery.toUpperCase().trim()) ||
        rawId === rawQuery.toUpperCase().trim() ||
        (searchCode && cCode.includes(searchCode))
      );
    });

    if (matchedIssue) {
      const slaTarget = matchedIssue.sla_target_date ? new Date(matchedIssue.sla_target_date) : null;
      const now = new Date();
      const isOverdue =
        matchedIssue.is_overdue ||
        (slaTarget &&
          slaTarget.getTime() < now.getTime() &&
          matchedIssue.status !== 'resolved' &&
          matchedIssue.status !== 'closed');
      const daysLeft = slaTarget
        ? Math.ceil((slaTarget.getTime() - now.getTime()) / (1000 * 3600 * 24))
        : null;

      let statusDescription = '';
      switch (matchedIssue.status) {
        case 'submitted':
          statusDescription = 'Registered in public ledger. Auto-routing to department underway.';
          break;
        case 'assigned':
          statusDescription = `Assigned to ${matchedIssue.department_name}. Field tech dispatched.`;
          break;
        case 'in_progress':
          statusDescription = 'Active field repair underway by municipal crew.';
          break;
        case 'resolved':
          statusDescription = 'Marked resolved by department. Awaiting mandatory citizen verification.';
          break;
        case 'reopened':
          statusDescription = 'Rejected by citizen due to incomplete work. Re-opened with high priority.';
          break;
        case 'escalated':
          statusDescription = 'SLA breached. Escalated to Zonal Commissioner & Ward Councillor.';
          break;
        case 'closed':
          statusDescription = 'Citizen inspected and confirmed satisfactory resolution. Permanently closed.';
          break;
      }

      if (isTamil) {
        return {
          text: [
            `### 📋 புகார் நிகழ்நிலை கண்காணிப்பு: **${matchedIssue.complaint_code}**`,
            '',
            `- **தலைப்பு**: ${matchedIssue.title}`,
            `- **பொறுப்புத் துறை**: **${matchedIssue.department_name}**`,
            `- **தற்போதைய நிலை**: **${matchedIssue.status.toUpperCase()}** (${statusDescription})`,
            `- **இடம்**: ${matchedIssue.location_text} (${matchedIssue.jurisdiction_name})`,
            `- **தீவிர நிலை**: ${matchedIssue.severity.toUpperCase()}`,
            `- **SLA காலக்கெடு**: ${slaTarget ? slaTarget.toLocaleDateString() : 'N/A'} ${
              isOverdue
                ? '⚠️ **(காலக்கெடு மீறப்பட்டது - SLA OVERDUE)**'
                : `(${daysLeft} நாட்கள் மீதமுள்ளன)`
            }`,
            `- **ஒதுக்கப்பட்ட களப்பணியாளர்**: ${matchedIssue.assigned_field_worker_name || 'துறை ஒதுக்கீடு நிலுவையில் உள்ளது'}`,
            `- **குடிமக்கள் சரிபார்ப்பு**: ${
              matchedIssue.verification
                ? `குடிமகன் சரிபார்த்தார் (${matchedIssue.verification.result === 'completely_resolved' ? 'முழுமையாக முடிந்தது' : 'நிறைவடையவில்லை'})`
                : 'குடிமகன் நேரடி ஆய்வுக்கு காத்திருக்கிறது'
            }`,
            '',
            `**புகார் விவரம்**: ${matchedIssue.description}`,
            '',
            `💡 *குறிப்பு*: சிவிக்லென்ஸில் துறை அதிகாரிகள் தாங்களாகவே புகாரை மூட முடியாது. நீங்கள் சரிபார்த்த பின்னரே புகார் நிறைவடையும்.`,
          ].join('\n'),
          actions: [
            { label: `புகாரைத் திறக்க (${matchedIssue.complaint_code})`, href: `/issues/${matchedIssue.id}` },
            matchedIssue.status === 'resolved'
              ? { label: 'சரிபார்த்து ஒப்புதல் அளிக்க', href: `/issues/${matchedIssue.id}` }
              : { label: 'வார்டு வரைபடத்தில் பார்க்க', href: '/map' },
          ],
          source: 'live-ledger-engine',
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
          `- **Severity Level**: ${matchedIssue.severity.toUpperCase()}`,
          `- **Target SLA Date**: ${slaTarget ? slaTarget.toLocaleDateString() : 'N/A'} ${
            isOverdue
              ? '⚠️ **(SLA BREACHED / OVERDUE)**'
              : `(${daysLeft} days remaining)`
          }`,
          `- **Assigned Field Tech**: ${matchedIssue.assigned_field_worker_name || 'Under Department Dispatch'}`,
          `- **Citizen Verification Status**: ${
            matchedIssue.verification
              ? `Verified by reporting citizen (${matchedIssue.verification.result.replace('_', ' ')})`
              : 'Awaiting Citizen On-Site Inspection'
          }`,
          `- **Reported On**: ${new Date(matchedIssue.created_at).toLocaleDateString()}`,
          '',
          `**Details**: ${matchedIssue.description}`,
          '',
          `🔒 *Anti-Corruption Rule*: Even if the contractor or officer marks this issue resolved, the ticket remains locked until the citizen conducts an on-site inspection.`,
        ].join('\n'),
        actions: [
          { label: `Open Ticket ${matchedIssue.complaint_code}`, href: `/issues/${matchedIssue.id}` },
          matchedIssue.status === 'resolved'
            ? { label: 'Verify Resolution Quality', href: `/issues/${matchedIssue.id}` }
            : { label: 'Locate on GIS Map', href: '/map' },
        ],
        source: 'live-ledger-engine',
      };
    } else if (searchCode) {
      return {
        text: isTamil
          ? `### 🔍 புகார் எண் காணப்படவில்லை\n\nபுகார் எண் **${searchCode}** சிவிக்லென்ஸ் பதிவேட்டில் இல்லை. தயவுசெய்து 6 இலக்க புகார் எண்ணை சரிபார்க்கவும்.`
          : `### 🔍 Complaint Code Not Found\n\nTicket **${searchCode}** was not found in the live municipal ledger. Please confirm the 6-digit number (e.g., \`CL-2026-000101\`). You can browse all active complaints in the Public Ledger.`,
        actions: [{ label: 'Browse Public Ledger', href: '/issues' }],
        source: 'live-ledger-engine',
      };
    }
  }

  // =========================================================================
  // 2. QUERY FOR LIST OF COMPLAINTS (OPEN, RESOLVED, OVERDUE, LATEST, ALL)
  // =========================================================================
  if (
    q.includes('open complaint') ||
    q.includes('active complaint') ||
    q.includes('how many complaint') ||
    q.includes('overdue complaint') ||
    q.includes('overdue issue') ||
    q.includes('resolved complaint') ||
    q.includes('show complaints') ||
    q.includes('latest complaint') ||
    q.includes('status of complaints') ||
    q.includes('நிலுவை') ||
    q.includes('புகார்கள் எத்தனை')
  ) {
    const totalCount = allIssues.length;
    const openCount = allIssues.filter((i) => i.status !== 'closed').length;
    const resolvedCount = allIssues.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
    const overdueList = allIssues.filter((i) => i.is_overdue || i.status === 'escalated');
    const recentIssues = [...allIssues]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);

    if (isTamil) {
      return {
        text: [
          '### 📊 நிகழ்நிலை மாநகராட்சி புகார்கள் புள்ளிவிவரம்',
          '',
          `- **மொத்தப் புகார்கள்**: **${totalCount}**`,
          `- **செயலில் உள்ளவை (Open / In Progress)**: **${openCount}**`,
          `- **சரிசெய்யப்பட்டவை (Resolved / Closed)**: **${resolvedCount}**`,
          `- **காலக்கெடு மீறியவை (SLA Overdue)**: **${overdueList.length}**`,
          '',
          '**சமீபத்திய புகார்கள்:**',
          ...recentIssues.map(
            (i) =>
              `- **${i.complaint_code}**: ${i.title} [**${i.status.toUpperCase()}**] - ${i.jurisdiction_name}`
          ),
        ].join('\n'),
        actions: [
          { label: 'அனைத்து புகார்கள்', href: '/issues' },
          { label: 'வரைபடம் பார்க்க', href: '/map' },
        ],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### 📊 Live Municipal Grievance Statistics',
        '',
        `- **Total Registered Issues**: **${totalCount}** across Greater Chennai Corporation`,
        `- **Active Unresolved Workload**: **${openCount}** tickets assigned to field crews`,
        `- **Verified Resolved / Closed**: **${resolvedCount}** issues completed`,
        `- **SLA Overdue Escalations**: **${overdueList.length}** tickets requiring immediate executive intervention`,
        '',
        '**Latest Logged Complaints:**',
        ...recentIssues.map(
          (i) =>
            `- **${i.complaint_code}**: *${i.title}*\n  - Department: ${i.department_name} | Ward: ${i.jurisdiction_name} | Status: **${i.status.toUpperCase()}**`
        ),
      ].join('\n'),
      actions: [
        { label: 'View Public Ledger', href: '/issues' },
        { label: 'View Operations Dashboard', href: '/dashboard' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 3. WARD & CONSTITUENCY SPECIFICS (Velachery, Adyar, Mylapore, T. Nagar, etc.)
  // =========================================================================
  const matchedWard = allWards.find((w) => {
    const rawNum = w.ward_number.replace(/\D/g, ''); // "175"
    const lowerName = w.name.toLowerCase();
    const parts = lowerName.split(/[-–—]/).map((s) => s.trim());
    return (
      q.includes(w.id.toLowerCase()) ||
      (rawNum &&
        (q.includes(`ward ${rawNum}`) ||
          q.includes(`ward-${rawNum}`) ||
          q.includes(`w-${rawNum}`) ||
          q.includes(`ward no ${rawNum}`) ||
          q.includes(`ward number ${rawNum}`) ||
          q.includes(rawNum))) ||
      parts.some((p) => p && p.length > 3 && q.includes(p)) ||
      lowerName.includes(q.trim())
    );
  });

  if (matchedWard || q.includes('councillor') || q.includes('zone 13') || q.includes('ward office')) {
    const targetWard = matchedWard || allWards[0];
    const wardIssues = allIssues.filter((i) => i.jurisdiction_id === targetWard.id);
    const openCount = wardIssues.filter((i) => i.status !== 'closed').length;
    const resolvedCount = wardIssues.filter((i) => i.status === 'resolved' || i.status === 'closed').length;
    const overdueCount = wardIssues.filter((i) => i.is_overdue || i.status === 'escalated').length;
    const wardProjects = allProjects.filter(
      (p) =>
        p.location.toLowerCase().includes(targetWard.name.toLowerCase()) ||
        targetWard.name.toLowerCase().includes(p.location.toLowerCase())
    );

    if (isTamil) {
      return {
        text: [
          `### 🏛️ வார்டு விவரம்: **${targetWard.name} (${targetWard.zone})**`,
          '',
          `- **வார்டு எண்**: ${targetWard.ward_number}`,
          `- **மண்டலம்**: ${targetWard.zone}`,
          `- **பகுதி எல்லைகள்**: ${targetWard.area_description}`,
          `- **புவியியல் ஜிபிஎஸ்**: ${targetWard.center_lat.toFixed(4)}° N, ${targetWard.center_lng.toFixed(4)}° E`,
          `- **வார்டு மாமன்ற உறுப்பினர் (Councillor)**: தேர்ந்தெடுக்கப்பட்ட மக்கள் பிரதிநிதி (வார்டு குழு தலைவர்)`,
          '',
          `**நிகழ்நிலை புகார்கள் நிலவரம்:**`,
          `- மொத்த புகார்கள்: **${wardIssues.length}**`,
          `- நிலுவையில் உள்ளவை: **${openCount}**`,
          `- சரிசெய்யப்பட்டவை: **${resolvedCount}**`,
          `- காலக்கெடு மீறியவை (Overdue): **${overdueCount}**`,
          '',
          `**நடப்பு உள்கட்டமைப்பு திட்டங்கள்:** ${wardProjects.length} திட்டங்கள்`,
          ...wardProjects.map(
            (p) =>
              `- **${p.name}** (மதிப்பீடு: ₹${(p.approved_amount / 10000000).toFixed(2)} கோடி | நிலை: ${p.status})`
          ),
        ].join('\n'),
        actions: [
          { label: `${targetWard.name} வரைபடத்தில் பார்க்க`, href: '/map' },
          { label: 'இந்த வார்டில் புகார் செய்ய', href: '/report' },
        ],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        `### 🏛️ Ward Jurisdiction Profile: **${targetWard.name} (${targetWard.zone})**`,
        '',
        `- **Ward Number**: ${targetWard.ward_number}`,
        `- **Administrative Zone**: ${targetWard.zone} (Greater Chennai Corporation)`,
        `- **Area Boundaries**: ${targetWard.area_description}`,
        `- **Geographical Coordinates**: ${targetWard.center_lat.toFixed(4)}° N, ${targetWard.center_lng.toFixed(4)}° E`,
        `- **Elected Ward Councillor**: Represents Ward ${targetWard.ward_number} in the GCC Council (Ripon Building)`,
        `- **Zonal Office**: Oversees local sanitation, road paving, health inspection, and streetlights`,
        '',
        `**Live Grievance Ledger for ${targetWard.name}:**`,
        `- **Total Logged Complaints**: **${wardIssues.length}**`,
        `- **Active Field Operations**: **${openCount}** tickets currently in progress`,
        `- **Successfully Resolved**: **${resolvedCount}** tickets closed with citizen consent`,
        `- **Overdue SLA Escalations**: **${overdueCount}**`,
        '',
        `**Capital Infrastructure Projects in this Ward (${wardProjects.length}):**`,
        ...(wardProjects.length > 0
          ? wardProjects.map(
              (p) =>
                `- **${p.name}**\n  - Budget: ₹${(p.approved_amount / 10000000).toFixed(2)} Cr | Agency: ${p.agency} | Status: **${p.status.toUpperCase()}**`
            )
          : ['- Routine ward maintenance and road patch resurfacing programs active.']),
      ].join('\n'),
      actions: [
        { label: `View ${targetWard.name} on GIS Map`, href: '/map' },
        { label: 'File Complaint in this Ward', href: '/report' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 4. POTHOLES & VEHICLE DAMAGE COMPENSATION (LEGAL REMEDY)
  // =========================================================================
  if (
    q.includes('compensation') ||
    q.includes('vehicle damage') ||
    q.includes('car damage') ||
    q.includes('bike damage') ||
    q.includes('fall in pothole') ||
    q.includes('sue corporation') ||
    q.includes('claim damage') ||
    q.includes('இழப்பீடு')
  ) {
    if (isTamil) {
      return {
        text: [
          '### ⚖️ சாலைப் பள்ள விபத்துக்களுக்கு மாநகராட்சியிடம் இழப்பீடு பெறுவது எப்படி?',
          '',
          'சென்னை உயர்நீதிமன்ற தீர்ப்புகள் மற்றும் இந்திய அரசமைப்பு சட்டப்பிரிவு 21-ன் படி, பொதுச் சாலைகளைப் பாதுகாப்பாகப் பராமரிக்க வேண்டியது மாநகராட்சியின் சட்டப்பூர்வக் கடமையாகும்:',
          '',
          '1. **ஆதாரங்களைச் சேகரிக்கவும்**:',
          '   - விபத்து நடந்த இடத்தின் பள்ளம், சேதமடைந்த வாகனம் மற்றும் காயம் அடைந்ததற்கான புகைப்படங்கள்.',
          '   - அருகிலுள்ள காவல் நிலையத்தில் பொது நாட்குறிப்பு (General Diary - GD) பதிவு.',
          '   - மருத்துவமனை சிகிச்சை ஆவணங்கள் மற்றும் வாகன பழுதுபார்ப்பு மதிப்பீடு பில் (Mechanic Invoice).',
          '2. **சட்ட அறிவிப்பு (Legal Notice) அனுப்பவும்**:',
          '   - சென்னை மாநகராட்சி சட்டம் 1919 பிரிவு 385-ன் கீழ், மாநகராட்சி ஆணையருக்கு இழப்பீடு கோரி வழக்கறிஞர் மூலம் நோட்டீஸ் அனுப்பவும்.',
          '3. **நுகர்வோர் நீதிமன்றம் அல்லது உயர் நீதிமன்ற அணுகல்**:',
          '   - மாநகராட்சி பதிலளிக்கத் தவறினால், மாவட்ட நுகர்வோர் நீதிமன்றம் அல்லது சென்னை உயர்நீதிமன்றத்தில் ரிட் மனு தாக்கல் செய்து இழப்பீடு பெறலாம்.',
        ].join('\n'),
        actions: [{ label: 'பள்ளத்தைப் புகார் செய்க', href: '/report' }],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### ⚖️ Legal Recourse: Claiming Compensation for Pothole Vehicle Damage & Injuries',
        '',
        'Under Section 203 of the **Chennai City Municipal Corporation Act 1919** and landmark rulings of the **Madras High Court**, the Municipal Corporation has a mandatory statutory duty to maintain public streets in motorable, safe condition. Failure to do so constitutes **actionable tortious negligence** and a violation of the fundamental Right to Life (Article 21).',
        '',
        '### Step-by-Step Claim Procedure:',
        '1. **Document Ground Evidence Immediately**:',
        '   - Photograph the pothole with surrounding landmarks and the damaged vehicle parts (rim, suspension, tire burst).',
        '   - File a **General Diary (GD) entry** at the jurisdictional Traffic Police Station.',
        '   - Obtain an authorized mechanic inspection bill / repair estimate and medical discharge summaries (if injured).',
        '2. **Issue Statutory Notice under Section 385**:',
        '   - Send a formal legal notice addressed to *The Commissioner, Greater Chennai Corporation, Ripon Building, Chennai 600003*.',
        '   - Specify the exact location, time, ward number, repair expenses, and compensation sought for mental agony/medical treatment.',
        '3. **Judicial Redressal Forums**:',
        '   - **District Consumer Disputes Redressal Commission**: For deficiency of municipal service.',
        '   - **Madras High Court (Article 226)**: If the civic body fails to respond within 60 days, citizens can file a Writ Petition for interim compensation.',
      ].join('\n'),
      actions: [
        { label: 'Report Pothole Hazard', href: '/report' },
        { label: 'View Road Pothole Queue', href: '/issues' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 5. SEWAGE & CONTAMINATED DRINKING WATER
  // =========================================================================
  if (
    q.includes('sewage') ||
    q.includes('sewer') ||
    q.includes('drinking water') ||
    q.includes('water contamination') ||
    q.includes('smelly water') ||
    q.includes('pipe burst') ||
    q.includes('metrowater') ||
    q.includes('சாக்கடை') ||
    q.includes('கழிவுநீர்') ||
    q.includes('குடிநீர்')
  ) {
    const waterDept = allDepts.find((d) => d.code === 'WATER' || d.code === 'DEPT-METROWATER');

    if (isTamil) {
      return {
        text: [
          '### 🚰 குடிநீர் மற்றும் கழிவுநீர் பிரச்சினைகள்: தீர்வு வழிமுறைகள்',
          '',
          '- **பொறுப்பு அமைப்பு**: சென்னை பெருநகர குடிநீர் வழங்கல் மற்றும் கழிவுநீரகற்று வாரியம் (CMWSSB / Metrowater).',
          '- **24 மணிநேர அவசர உதவி**: **044-45674567** அல்லது **1916**.',
          '- **தீர்வு காலக்கெடு (SLA)**:',
          '  - குடிநீரில் கழிவுநீர் கலத்தல்: **24 மணிநேரம்** (அவசர நடவடிக்கை).',
          '  - பிரதான குடிநீர் குழாய் உடைப்பு: **48 மணிநேரம்**.',
          '  - மேன்ஹோல் கழிவுநீர் வழிதல்: **24 மணிநேரம்**.',
          '',
          '**உடனடி பாதுகாப்பு வழிமுறைகள்:**',
          '1. குழாய் நீரில் கழிவுநீர் வாசனை அல்லது நிறமாற்றம் இருந்தால், அந்நீரைக் குடிக்கவோ சமைக்கவோ பயன்படுத்தாதீர்கள்.',
          '2. வார்டு சுகாதார ஆய்வாளரிடம் இலவச குளோரின் மாத்திரைகளைப் பெற்று மேல்நிலைத் தொட்டியில் இடவும்.',
          '3. சிவிக்லென்ஸில் உடனடியாக புகைப்படத்துடன் புகார் பதிவு செய்யவும்.',
        ].join('\n'),
        actions: [
          { label: 'குடிநீர் புகார் பதிவு செய்க', href: '/report' },
          { label: 'குடிநீர் துறை நிலை', href: '/issues' },
        ],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### 🚰 Sewage Backflow & Contaminated Drinking Water Emergency Protocol',
        '',
        'Cross-contamination of drinking water with municipal sewer lines is an acute public health hazard governed by the **Chennai Metropolitan Water Supply and Sewerage Board (CMWSSB) Act 1978**.',
        '',
        '- **Direct 24x7 Emergency Grievance Cell**: **044-45674567** / **1916**',
        `- **Department Contact**: ${waterDept?.contact_phone || '044-28459000'} (${waterDept?.contact_email || 'grievance@chennaimetrowater.tn.gov.in'})`,
        '- **Turnaround SLA**: **24 Hours** for cross-contamination and manhole overflows; **48 Hours** for distribution line ruptures.',
        '',
        '### Immediate Protocol for Citizens:',
        '1. **Do NOT Consume Tap Water**: Suspend drinking/cooking until super-chlorination and lab purity verification.',
        '2. **Super-Chlorination**: Request free chlorine test kits/tablets from your local GCC Urban Primary Health Centre (UPHC).',
        '3. **Super Sucker Jetting Machines**: Metrowater deploys desilting suction trucks to clear underground trunk sewer blocks.',
      ].join('\n'),
      actions: [
        { label: 'Report Water / Sewage Issue', href: '/report' },
        { label: 'Browse Water Queue', href: '/issues' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 6. SOLID WASTE MANAGEMENT RULES 2016 & FINES FOR ILLEGAL DUMPING
  // =========================================================================
  if (
    q.includes('garbage') ||
    q.includes('waste') ||
    q.includes('dumping') ||
    q.includes('segregat') ||
    q.includes('burning') ||
    q.includes('plastic ban') ||
    q.includes('littering') ||
    q.includes('குப்பை')
  ) {
    if (isTamil) {
      return {
        text: [
          '### 🗑️ திடக்கழிவு மேலாண்மை விதிகள் 2016 மற்றும் அபராத விபரம்',
          '',
          'சென்னை மாநகராட்சி எல்லைக்குள் குப்பைகளை வகைப்படுத்தாமல் கொட்டுவது மற்றும் திறந்தவெளியில் எரிப்பது தண்டனைக்குரிய குற்றமாகும்:',
          '',
          '| குற்றம் | தனிநபர் / வீடு | வணிக நிறுவனங்கள் |',
          '| :--- | :--- | :--- |',
          '| **பொது இடங்களில் குப்பை கொட்டுதல்** | ₹500 | ₹5,000 |',
          '| **குப்பைகளைப் பிரிக்காமல் கொடுத்தல்** | ₹100 | ₹1,000 முதல் ₹5,000 வரை |',
          '| **திறந்தவெளியில் குப்பை/பிளாஸ்டிக் எரித்தல்** | ₹5,000 | ₹25,000 (NGT விதி) |',
          '| **கட்டுமான கழிவுகள் (C&D) கொட்டுதல்** | ₹2,000 | ₹10,000 + வாகனம் பறிமுதல் |',
          '',
          '- **குப்பை சேகரிப்பு நேரம்**: பேட்டரி வாகனங்கள் மூலம் தினமும் காலை 6:00 மணி முதல் 11:00 மணி வரை.',
          '- **தீர்வு காலக்கெடு (SLA)**: குப்பைக் குவியல் அகற்றப்படாவிட்டால் **24 முதல் 48 மணிநேரத்திற்குள்** அகற்றப்பட வேண்டும்.',
        ].join('\n'),
        actions: [{ label: 'குப்பை பிரச்சினை புகார்', href: '/report' }],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### 🗑️ Solid Waste Management (SWM) Rules 2016 & GCC Penalty Structure',
        '',
        'Under the **Solid Waste Management Rules 2016** and Greater Chennai Corporation Bylaws, source segregation is mandatory for all citizens and commercial bulk waste generators.',
        '',
        '### Statutory Penalty Schedule:',
        '| Violation | Residential Fine | Commercial / Bulk Generator |',
        '| :--- | :--- | :--- |',
        '| **Littering or Throwing Garbage on Streets** | ₹500 | ₹5,000 |',
        '| **Non-Segregation (Wet / Dry / Hazardous)** | ₹100 | ₹1,000 to ₹5,000 |',
        '| **Open Burning of Garbage / Plastic / Leaves** | ₹5,000 | ₹25,000 (NGT Order) |',
        '| **Dumping Construction & Demolition (C&D) Debris** | ₹2,000 | ₹10,000 + Vehicle Seizure |',
        '',
        '- **Mandatory 3-Bin Segregation**: Green Bin (Wet/Biodegradable), Blue Bin (Dry/Recyclable), Red Bin (Domestic Hazardous/Medical).',
        '- **Resolution SLA**: Overflowing street bins and uncollected street sweeping must be rectified within **24 to 48 Hours**.',
      ].join('\n'),
      actions: [
        { label: 'Report Garbage Dump', href: '/report' },
        { label: 'View Sanitation Ledger', href: '/issues' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 7. ELECTRICAL HAZARDS, DANGLING WIRES & TANGEDCO SAFETY
  // =========================================================================
  if (
    q.includes('electric') ||
    q.includes('wire') ||
    q.includes('shock') ||
    q.includes('transformer') ||
    q.includes('pole') ||
    q.includes('streetlight') ||
    q.includes('lamp') ||
    q.includes('tneb') ||
    q.includes('tangedco') ||
    q.includes('மின்சாரம்') ||
    q.includes('விளக்கு')
  ) {
    if (isTamil) {
      return {
        text: [
          '### ⚡ மின்சார ஆபத்துகள் மற்றும் தெருவிளக்கு பராமரிப்பு வழிகாட்டி',
          '',
          '- **அவசர மின்வாரிய உதவி எண் (TANGEDCO)**: **1912** / வாட்ஸ்அப்: **9445850811** (24x7).',
          '- **மின் ஆபத்து அவசர தீர்வு காலக்கெடு**: அறுந்து விழுந்த உயிருள்ள மின்கம்பிகள் மீது **2 மணிநேரத்திற்குள்** நடவடிக்கை எடுக்கப்பட வேண்டும்.',
          '- **தெருவிளக்கு பழுது (Streetlights)**: **48 மணிநேரத்திற்குள்** சீரமைக்கப்பட வேண்டும்.',
          '',
          '**முக்கிய பாதுகாப்பு அறிவுரை:**',
          'அறுந்து விழுந்த மின்கம்பிகள் அருகே 15 மீட்டர் தூரத்திற்கு யாரையும் நெருங்க விடாதீர்கள். தண்ணீர் தேங்கிய பகுதிகளில் மின்கம்பங்களை தொடாதீர்கள்.',
        ].join('\n'),
        actions: [{ label: 'மின்விளக்கு புகார் செய்ய', href: '/report' }],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### ⚡ Electrical Hazards, Dangling Live Wires & Streetlight Protocols',
        '',
        'Overhead power transmission and public lighting are governed by **The Electricity Act 2003** and the **Central Electricity Authority (Measures relating to Safety and Electric Supply) Regulations**.',
        '',
        '- **TANGEDCO Central Emergency Helpline**: **1912** (24x7 Toll-Free)',
        '- **WhatsApp Grievance Cell**: **9445850811** (for photo sharing of damaged poles/transformers)',
        '- **Turnaround SLAs**:',
        '  - **Dangling live wire / sparking transformer**: **2 Hours (Immediate Life-Safety Protocol)**',
        '  - **Dead or malfunctioning LED streetlights**: **48 Hours**',
        '  - **Damaged or leaning streetlight pole**: **72 Hours**',
        '',
        '⚠️ **Critical Safety Notice**: Maintain a minimum 15-meter safety perimeter around snapped overhead wires, particularly on waterlogged ground or during rains.',
      ].join('\n'),
      actions: [
        { label: 'Report Streetlight / Wire Hazard', href: '/report' },
        { label: 'Electrical Queue', href: '/issues' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 8. STRAY DOGS, ANIMAL BIRTH CONTROL (ABC) & DOG BITES
  // =========================================================================
  if (
    q.includes('stray dog') ||
    q.includes('dog bite') ||
    q.includes('rabies') ||
    q.includes('street dog') ||
    q.includes('animal birth control') ||
    q.includes('abc') ||
    q.includes('நாய்')
  ) {
    if (isTamil) {
      return {
        text: [
          '### 🐕 தெருநாய்கள் கட்டுப்பாடு மற்றும் ரேபிஸ் தடுப்பு வழிகாட்டி',
          '',
          'இந்திய விலங்குகள் வதைத் தடுப்புச் சட்டம் மற்றும் விலங்கு பிறப்புக் கட்டுப்பாட்டு விதிகள் 2023-ன் படி, தெருநாய்களைக் கொல்வதோ அல்லது வேறிடத்திற்கு மாற்றுவதோ சட்டவிரோதமாகும்:',
          '',
          '1. **மாநகராட்சி நடவடிக்கை (ABC Protocol)**:',
          '   - தெருநாய்களைப் பிடித்து கருத்தடை அறுவை சிகிச்சை செய்து, ரேபிஸ் தடுப்பூசி செலுத்தி, காதில் அடையாளக் குறியிட்டு மீண்டும் அதே பகுதியில் விடப்படும்.',
          '   - சென்னை மாநகராட்சி புளியந்தோப்பு, கண்ணம்மாபேட்டை, லாயிட்ஸ் காலனி ஆகிய இடங்களில் கருத்தடை மையங்களை இயக்குகிறது.',
          '2. **நாய் கடித்தால் உடனடி முதலுதவி**:',
          '   - கடித்த காயத்தை உடனே ஓடும் தண்ணீரில் சோப்பு போட்டு 15 நிமிடங்கள் நன்றாகக் கழுவ வேண்டும்.',
          '   - அரசு பொது மருத்துவமனை அல்லது மாநகராட்சி சுகாதார மையத்தில் **இலவசமாக ஆன்டி-ரேபிஸ் தடுப்பூசி (ARV)** செலுத்திக் கொள்ளவும்.',
        ].join('\n'),
        actions: [{ label: 'விலங்கு நல புகார் செய்ய', href: '/report' }],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### 🐕 Stray Dog Management, Animal Birth Control (ABC) & Rabies Care',
        '',
        'Under the **Animal Birth Control (Dogs) Rules 2023** framed under the **Prevention of Cruelty to Animals Act 1960**, culling, poisoning, or relocating stray dogs is strictly prohibited by Supreme Court directives.',
        '',
        '### GCC Municipal Protocol:',
        '1. **Humane Sterilisation & Vaccination**: GCC Veterinary Officers catch stray dogs, perform surgical sterilisation (spay/neuter), administer Anti-Rabies Vaccinations (ARV), notch the ear for identification, and release them back to their exact home territory within 5 days.',
        '2. **GCC Veterinary Clinics**: Specialized centres located at Kannammapet, Pulianthope, Lloyds Colony, and Sholinganallur.',
        '',
        '### 🚨 Dog Bite Emergency Protocol:',
        '- **Wash with Running Tap Water & Soap**: Cleanse the wound thoroughly for at least 15 minutes immediately to flush viral saliva.',
        '- **Free ARV Treatment**: Anti-Rabies Vaccine and Rabies Immunoglobulin (RIG) are provided **100% free of charge 24x7** across all GCC Urban Community Health Centres and Government Hospitals (e.g., Rajiv Gandhi Government General Hospital).',
      ].join('\n'),
      actions: [{ label: 'Report Stray Animal Issue', href: '/report' }],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 9. DUAL-STREAM FORENSIC CNN & AI IMAGE AUTHENTICITY DETECTOR
  // =========================================================================
  if (
    q.includes('ai image') ||
    q.includes('fake photo') ||
    q.includes('fake image') ||
    q.includes('detector') ||
    q.includes('cnn') ||
    q.includes('bayar') ||
    q.includes('resnet') ||
    q.includes('reject') ||
    q.includes('authenticity') ||
    q.includes('போலி புகைப்படம்')
  ) {
    if (isTamil) {
      return {
        text: [
          '### 🤖 சிவிக்லென்ஸ் Dual-Stream Forensic CNN உண்மைத்தன்மை சரிபார்ப்பு',
          '',
          'போலியான மற்றும் AI மூலம் உருவாக்கப்பட்ட (Midjourney, DALL-E, Stable Diffusion) புகைப்படங்களைக் கண்டறிந்து நிராகரிக்க CivicLens பிரத்யேக **Dual-Stream Forensic CNN** தொழில்நுட்பத்தைப் பயன்படுத்துகிறது:',
          '',
          '1. **ஸ்ட்ரீம் 1: பயர்-ஸ்டாம் உயர்-அதிர்வெண் கன்வல்யூஷன் (Bayar-Stamm CNN)**:',
          '   - படத்தின் காட்சிகளைத் தவிர்த்து, கேமரா சென்சாரின் மைக்ரோ-சத்தங்களை (Optical Shot Noise) மட்டுமே ஆய்வு செய்கிறது.',
          '2. **ஸ்ட்ரீம் 2: டீப் ரெஸ்நெட்-18 ட்ரங்க் (ResNet-18 Feature Trunk)**:',
          '   - லேட்டண்ட் ஸ்பேஸ் டீகோடிங் மற்றும் பிக்சல் முரண்பாடுகளை அடையாளம் காண்கிறது.',
          '3. **ஸ்ட்ரீம் 3: SRM 5-கெர்னல் வடிப்பான்கள் மற்றும் Bayer CFA நிறமாலை பகுப்பாய்வு**.',
          '',
          '🚫 **நிராகரிப்பு விதி**: செயற்கை அல்லது AI-உருவாக்கிய படம் கண்டறியப்பட்டால், புகார் நிராகரிக்கப்பட்டு **HTTP 422** பிழை காட்டப்படும். கேமராவில் நேரடியாக எடுக்கப்பட்ட உண்மையான படங்கள் மட்டுமே ஏற்கப்படும்.',
        ].join('\n'),
        actions: [
          { label: 'புகார் பக்கம் செல்ல', href: '/report' },
          { label: 'AI சர்வர் நிலை (Port 5001)', href: 'http://localhost:5001/health' },
        ],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### 🤖 Dual-Stream Forensic CNN: AI Image Authenticity Engine',
        '',
        'To prevent fake complaints, synthetic digital vandalism, or AI-generated hazards (from Midjourney, DALL-E 3, Stable Diffusion, Flux, or Firefly), CivicLens runs an in-house **Dual-Stream Forensic Convolutional Neural Network (CNN)**:',
        '',
        '### Deep Forensic Architecture:',
        '1. **Stream 1: Bayar-Stamm Constrained High-Pass Residual CNN**:',
        '   - Utilizes 16 constrained convolutional filters where non-central weights sum to -w(0,0). This mathematically suppresses semantic image content (roads, cars, trees) to isolate micro-optical sensor noise residuals.',
        '2. **Stream 2: ResNet-18 Deep Feature Trunk**:',
        '   - Pre-trained deep residual convolutional backbone extracting spatial artifact signatures and latent-space upsampling discrepancies.',
        '3. **Stream 3: Spatial Rich Model (SRM) 5-Kernel Convolutions**:',
        '   - Computes 2nd-order Laplacian, diagonal high-pass, edge residuals, and 4th-order spatial derivatives.',
        '4. **Cross-Channel Bayer CFA Covariance & 2D FFT Frequency Roll-off**:',
        '   - Verifies genuine hardware Color Filter Array (CFA) chromatic correlations (r > 0.985) against generative dispersion.',
        '',
        '🚫 **Strict Rejection Policy**: Any synthetic evidence is flagged with red UI warnings and rejected with **HTTP 422 Unprocessable Entity**. Only authentic on-site camera frames are accepted.',
      ].join('\n'),
      actions: [
        { label: 'Test Camera Capture', href: '/report' },
        { label: 'Inspect AI Health Check', href: 'http://localhost:5001/health' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 10. CAMERA-ONLY CAPTURE & WHY GALLERY UPLOAD WAS DISABLED
  // =========================================================================
  if (
    q.includes('camera') ||
    q.includes('gallery') ||
    q.includes('upload from photo') ||
    q.includes('why camera only') ||
    q.includes('capture') ||
    q.includes('shutter') ||
    q.includes('கேமரா')
  ) {
    if (isTamil) {
      return {
        text: [
          '### 📸 நேரடி கேமரா மட்டுமே: புகைப்படத் தொகுப்பு (Gallery) நீக்கப்பட்டதன் காரணம்',
          '',
          'சிவிக்லென்ஸில் பொதுமக்கள் மற்றும் அரசு ஊழியர்கள் சேமிக்கப்பட்ட பழைய புகைப்படங்கள் அல்லது இணையத்தில் பதிவிறக்கம் செய்த போலிகளைப் பதிவேற்றுவதைத் தடுக்க **Gallery Upload** முழுமையாக நீக்கப்பட்டுள்ளது:',
          '',
          '- **கள யதார்த்தம் மட்டுமே**: குடிமக்கள் சம்பவ இடத்திற்கு நேரில் சென்று நேரடி கேமரா மூலம் புகைப்படம் எடுக்க வேண்டும்.',
          '- **ஆப்டிகல் வியூஃபைண்டர்**: பிரவுசரிலேயே நேரடி கேமரா வியூஃபைண்டர், போகஸ் குறிப்பான் மற்றும் ஷட்டர் அமைப்பு இயங்குகிறது.',
          '- **டிஜிட்டல் முத்திரை**: புகைப்படத்தில் நேரம், தேதி மற்றும் நகராட்சி வாட்டர்மார்க் தானாகப் பதிக்கப்படுகிறது.',
        ].join('\n'),
        actions: [{ label: 'நேரடி கேமரா மூலம் புகார் செய்ய', href: '/report' }],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### 📸 Hardware Live Camera Capture Policy',
        '',
        'Allowing users to upload photos from their gallery or file system creates a significant loophole for submitting internet stock photos, old images from years ago, or synthetic AI-generated pictures. To guarantee evidence authenticity, CivicLens enforces **Direct Live Camera Capture Only**:',
        '',
        '### How It Works:',
        '1. **Optical Viewfinder (`getUserMedia`)**: Directly accesses your device optical sensor with a live on-screen viewfinder, corner framing brackets, and center crosshair reticle.',
        '2. **Hardware Shutter**: Captures raw camera sensor photons directly on the canvas without passing through untrusted photo galleries.',
        '3. **Municipal Watermarking**: Burn-in watermark records exact date, time, and camera verification token on the frame.',
        '4. **Instant Forensic Verification**: The captured frame is immediately scanned by the Dual-Stream Forensic CNN to verify physical sensor noise.',
      ].join('\n'),
      actions: [{ label: 'Open Live Camera at /report', href: '/report' }],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 11. GPS AUTO-DETECTION & GEOCODING
  // =========================================================================
  if (
    q.includes('gps') ||
    q.includes('location') ||
    q.includes('geocod') ||
    q.includes('auto enter') ||
    q.includes('detect location') ||
    q.includes('இருப்பிடம்')
  ) {
    if (isTamil) {
      return {
        text: [
          '### 📍 ஜிபிஎஸ் இருப்பிடத்தை தானாகக் கண்டறியும் முறை',
          '',
          'சிவிக்லென்ஸில் "Use Current GPS" பொத்தானை அழுத்தும்போது உங்கள் துல்லியமான இருப்பிடம் தானாக உள்ளிடப்படுகிறது:',
          '',
          '1. **ஹார்டுவேர் ஜிபிஎஸ்**: உங்கள் மொபைல்/கணினியின் வன்பொருள் மூலம் அட்சரேகை மற்றும் தீர்க்கரேகையைப் பெறுகிறது.',
          '2. **ஹேவர்சைன் முறை (Haversine Algorithm)**: சென்னை மாநகராட்சியின் அனைத்து வார்டுகளின் மையப்புள்ளிகளோடு கணக்கிட்டு மிக அருகிலுள்ள வார்டை தானாகத் தேர்ந்தெடுக்கிறது.',
          '3. **OpenStreetMap ரிவர்ஸ் ஜியோகோடிங்**: தெருப் பெயர், கதவு எண் மற்றும் பின்கோடு தானாக முகவரி கட்டத்தில் உள்ளிடப்படுகிறது.',
        ].join('\n'),
        actions: [{ label: 'இருப்பிடத்துடன் புகார் செய்ய', href: '/report' }],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### 📍 Real-Time GPS Auto-Detection & GIS Geocoding Architecture',
        '',
        'When you click **"Use Current GPS"** on the complaint form, CivicLens executes a high-speed 3-tier location pipeline:',
        '',
        '1. **Device Sensor Geolocation**: Queries HTML5 High-Accuracy Geolocation API for sub-10-meter precision latitude and longitude coordinates.',
        '2. **Spatial Haversine Ward Matching**: Calculates exact spherical surface distances to all 200 Greater Chennai Corporation ward centroids, automatically setting the administrative Ward and Zone in the dropdown.',
        '3. **OpenStreetMap Reverse Geocoding**: Queries the Nominatim spatial engine to instantly auto-enter the human-readable street name, locality, landmark, and postal PIN code.',
      ].join('\n'),
      actions: [
        { label: 'File Complaint with GPS', href: '/report' },
        { label: 'Explore Interactive GIS Map', href: '/map' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 12. TWO-FACTOR CITIZEN RESOLUTION VERIFICATION & REOPENING
  // =========================================================================
  if (
    q.includes('verif') ||
    q.includes('reopen') ||
    q.includes('fake resolution') ||
    (q.includes('clos') && (q.includes('complaint') || q.includes('ticket') || q.includes('issue'))) ||
    (q.includes('without') && (q.includes('fix') || q.includes('repair') || q.includes('work'))) ||
    q.includes('not fixed') ||
    q.includes('citizen approval') ||
    q.includes('shoddy') ||
    q.includes('சரிபார்ப்பு')
  ) {
    if (isTamil) {
      return {
        text: [
          '### 🛡️ குடிமக்கள் சரிபார்ப்பு (Citizen Verification Lock)',
          '',
          'அரசுத் துறைகள் அல்லது ஒப்பந்ததாரர்கள் பணியைச் செய்யாமல் "முடிந்தது" என பொய் கணக்கு காட்டுவதைத் தடுக்க சிவிக்லென்ஸ் **2-காரணி குடிமக்கள் சரிபார்ப்பு** விதியை அமல்படுத்துகிறது:',
          '',
          '1. **அதிகாரிகளுக்கு அனுமதி இல்லை**: அதிகாரிகள் அல்லது களப்பணியாளர்கள் புகாரை நேரடியாக "மூட" (Close) முடியாது.',
          '2. **72 மணிநேர ஆய்வு சாளரம்**: பணி முடிந்ததாக அதிகாரி புகைப்படத்தைப் பதிவேற்றியதும், புகார் அளித்த குடிமகனுக்கு அறிவிப்பு வரும்.',
          '3. **குடிமகன் ஆய்வு தேர்வுகள்**:',
          '   - **முழுமையாக முடிந்தது (Completely Resolved)**: பணி திருப்திகரமாக இருந்தால் குடிமகன் ஒப்புதல் அளித்ததும் புகார் நிரந்தரமாக மூடப்படும்.',
          '   - **நிறைவடையவில்லை (Not Resolved / Reopen)**: பணி அரைகுறையாக இருந்தால், தற்போதைய புகைப்படத்தை எடுத்து புகாரை மீண்டும் திறக்கலாம் (**Reopen**). இது உடனடியாக மண்டல ஆணையரின் நேரடி கண்காணிப்புக்கு செல்லும்.',
        ].join('\n'),
        actions: [{ label: 'என் புகார்களைச் சரிபார்க்க', href: '/my-complaints' }],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### 🛡️ Two-Factor Citizen Resolution Verification Lockout',
        '',
        'In traditional municipal portals, contractors frequently upload fake photos or mark complaints "Closed" without performing actual work. CivicLens completely eliminates this via the **Mandatory Citizen Verification Lock**:',
        '',
        '### The Verification Lifecycle:',
        '1. **Officer Submission**: The department officer reviews field technician work, uploads the resolution evidence, and moves the status to **Resolved**.',
        '2. **Citizen Lockout**: The ticket is **NOT** closed. It enters an exclusive 72-hour citizen verification window.',
        '3. **On-Site Inspection Actions**:',
        '   - **Option A: Completely Resolved** → Citizen inspects the site and clicks confirm. The ticket permanently transitions to **Closed** in the public ledger.',
        '   - **Option B: Not Resolved / Partially Resolved** → Citizen takes a live camera photo showing the shoddy/incomplete work and adds feedback. The ticket instantly converts to **REOPENED** with escalated priority and alerts to the Zonal Commissioner.',
      ].join('\n'),
      actions: [
        { label: 'Inspect My Complaints', href: '/my-complaints' },
        { label: 'Public Ledger', href: '/issues' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 13. SLA COMMITMENTS & ESCALATION MATRIX
  // =========================================================================
  if (
    q.includes('sla') ||
    q.includes('deadline') ||
    q.includes('how many days') ||
    q.includes('escalat') ||
    q.includes('breach') ||
    q.includes('ignored') ||
    q.includes('delayed') ||
    q.includes('delay') ||
    q.includes('no action') ||
    q.includes('not fixed') ||
    q.includes('not resolved') ||
    q.includes('overdue') ||
    q.includes('pending for') ||
    q.includes('காலக்கெடு') ||
    q.includes('நடவடிக்கை இல்லை')
  ) {
    if (isTamil) {
      return {
        text: [
          '### ⏱️ சிவிக்லென்ஸ் தீர்வு காலக்கெடு (SLA) மற்றும் மேல்முறையீடு',
          '',
          'ஒவ்வொரு புகாருக்கும் அரசு விதிகளின்படி தீர்வு காலக்கெடு உள்ளது:',
          '',
          '| வகை | தீர்வு காலக்கெடு (SLA) | அவசர விதிமுறை |',
          '| :--- | :--- | :--- |',
          '| **குடிநீர் & கழிவுநீர் கசிவு** | **24 மணிநேரம்** | 4 மணிநேரத்தில் நடவடிக்கை |',
          '| **மின்விளக்கு பழுது (Streetlights)** | **48 மணிநேரம்** | அறுந்த கம்பி: 2 மணிநேரம் |',
          '| **குப்பை அகற்றுதல் (Garbage)** | **48 மணிநேரம்** | குப்பைக் குவியல்: 24 மணிநேரம் |',
          '| **சாலைப் பள்ளங்கள் (Potholes)** | **5 வேலை நாட்கள்** | பேருந்து தடம் முன்னுரிமை |',
          '| **மழைநீர் வடிகால் அடைப்பு** | **48 மணிநேரம்** | பருவமழை எச்சரிக்கை: 6 மணிநேரம் |',
          '| **பூங்கா மற்றும் மரங்கள்** | **7 நாட்கள்** | சாய்ந்த மரம்: 12 மணிநேரம் |',
          '',
          '**மேல்முறையீடு செய்வது எப்படி?**',
          'காலக்கெடு முடிந்தும் பணி தொடங்கப்படாவிட்டால், புகார் தானாக **SLA OVERDUE** ஆகும். குடிமக்கள் **"Escalate Issue"** பொத்தானை அழுத்தி மண்டல ஆணையர் மற்றும் மாமன்ற உறுப்பினருக்கு நேரடி எச்சரிக்கை அனுப்பலாம்.',
        ].join('\n'),
        actions: [
          { label: 'காலக்கெடு மீறியவை காண்க', href: '/issues' },
          { label: 'டாஷ்போர்டு பார்க்க', href: '/dashboard' },
        ],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### ⏱️ Municipal Service Level Agreements (SLA) & Escalation Hierarchy',
        '',
        'All civic complaints on CivicLens are governed by strict municipal turnaround deadlines backed by public ledger audit trails:',
        '',
        '| Civic Grievance Category | Target SLA | Emergency Fast-Track Protocol |',
        '| :--- | :--- | :--- |',
        '| **Water Supply & Sewage Leaks** | **24 Hours** | Cross-contamination: Immediate (4 hrs) |',
        '| **Streetlights & Electrical Hazards** | **48 Hours** | Dangling live wires: 2 Hours |',
        '| **Garbage & Solid Waste** | **48 Hours** | Bulk public overflow: 24 Hours |',
        '| **Roads, Potholes & Craters** | **5 Business Days** | Arterial MTC bus routes prioritized |',
        '| **Stormwater Drainage & Floods** | **48 Hours** | Monsoon inundation: 6 Hours |',
        '| **Parks & Fallen Trees** | **7 Days** | Uprooted tree blocking street: 12 Hours |',
        '',
        '### 🚨 3-Stage Escalation Matrix:',
        '1. **Stage 1 (Automated Breach Detection)**: If a ticket surpasses its SLA target date without department resolution, the system tags it as **SLA OVERDUE** in red across the public ledger.',
        '2. **Stage 2 (Citizen Triggered Escalation)**: The complainant clicks **"Escalate Issue"** to generate an official ESC tracking code (e.g., `ESC-2026-9041`).',
        '3. **Stage 3 (High-Level Dispatch)**: Direct priority dispatch notifications are transmitted to the **Zonal Joint Commissioner** and the **Constituency Ward Councillor**.',
      ].join('\n'),
      actions: [
        { label: 'View Overdue Issues', href: '/issues' },
        { label: 'Executive Dashboard', href: '/dashboard' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 14. EMERGENCY CIVIC & CRISIS HELPLINES (CHENNAI DIRECTORY)
  // =========================================================================
  if (
    /\b(helpline|emergency|police|ambulance|fire|disaster|tollfree|1913|100|101|108|1912|call)\b/i.test(rawQuery) ||
    q.includes('emergency contact') ||
    q.includes('urgent helpline') ||
    q.includes('அவசர')
  ) {
    if (isTamil) {
      return {
        text: [
          '### 📞 சென்னை அவசர உதவி மற்றும் மாநகராட்சி தொலைபேசி எண்கள்',
          '',
          '- **மாநகராட்சி 24x7 புகார் மையம்**: **1913** (மத்திய உதவி மையம்)',
          '- **குடிநீர் & கழிவுநீர் வாரியம் (Metrowater)**: **044-45674567** அல்லது **1916**',
          '- **மின்வாரிய புகார்கள் (TANGEDCO)**: **1912** / வாட்ஸ்அப்: 9445850811',
          '- **பேரிடர் மேலாண்மை & வெள்ளக் கட்டுப்பாடு**: **1070** (மாநிலம்) / **1077** (மாவட்டம்)',
          '- **காவல்துறை அவசர உதவி**: **100** / **112**',
          '- **தீயணைப்பு & மீட்புப்பணி**: **101**',
          '- **ஆம்புலன்ஸ் மருத்துவ அவசரம்**: **108**',
          '- **போக்குவரத்து நெரிசல் / சாலை அடைப்பு**: **103**',
          '- **பெண்கள் உதவி மையம்**: **1091**',
          '- **குழந்தைகள் உதவி மையம் (Childline)**: **1098**',
        ].join('\n'),
        actions: [{ label: 'சிவிக்லென்ஸில் புகார் செய்க', href: '/report' }],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### 📞 Comprehensive Civic & Emergency Helplines Directory (Chennai)',
        '',
        '- **Greater Chennai Corporation 24x7 Helpline**: **1913** (Central Grievance Redressal)',
        '- **Chennai Metro Water & Sewage Emergency**: **044-45674567** / **1916**',
        '- **TANGEDCO Electricity Grievance**: **1912** / WhatsApp: **9445850811**',
        '- **Disaster Management & Flood Control**: **1070** (State) / **1077** (Chennai District)',
        '- **Police Emergency Response**: **100** / **112**',
        '- **Fire & Rescue Services**: **101**',
        '- **Emergency Medical Ambulance**: **108**',
        '- **Traffic Police Road Obstruction**: **103**',
        '- **Women Helpline**: **1091**',
        '- **Childline Services**: **1098**',
      ].join('\n'),
      actions: [
        { label: 'File Complaint in CivicLens', href: '/report' },
        { label: 'Browse Public Ledger', href: '/issues' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 15. PUBLIC WORKS & CAPITAL INFRASTRUCTURE PROJECTS
  // =========================================================================
  if (
    q.includes('project') ||
    q.includes('budget') ||
    q.includes('contractor') ||
    q.includes('fund') ||
    q.includes('smart city') ||
    q.includes('expenditure') ||
    q.includes('திட்டம்') ||
    q.includes('நிதி')
  ) {
    const totalBudget = allProjects.reduce((sum, p) => sum + (p.approved_amount || 0), 0);
    const totalSpent = allProjects.reduce((sum, p) => sum + (p.expenditure || 0), 0);

    if (isTamil) {
      return {
        text: [
          '### 🏗️ சென்னை உள்கட்டமைப்பு மற்றும் பொதுப்பணித் திட்டங்கள்',
          '',
          `- **கண்காணிக்கப்படும் திட்டங்கள்**: **${allProjects.length} உள்கட்டமைப்பு பணிகள்**`,
          `- **மொத்த ஒதுக்கீடு நிதி**: **₹${(totalBudget / 10000000).toFixed(2)} கோடி**`,
          `- **இதுவரை செலவிடப்பட்ட தொகை**: **₹${(totalSpent / 10000000).toFixed(2)} கோடி**`,
          '',
          '**முக்கிய திட்டங்கள் விவரம்:**',
          ...allProjects.map(
            (p) =>
              `- **${p.name}** (${p.location})\n  - முகமை: *${p.agency}* | நிதி: ₹${(p.approved_amount / 10000000).toFixed(2)} கோடி | நிலை: **${p.status.toUpperCase()}**`
          ),
        ].join('\n'),
        actions: [
          { label: 'திட்டங்கள் பட்டியல்', href: '/projects' },
          { label: 'வரைபடத்தில் பார்க்க', href: '/map' },
        ],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### 🏗️ Public Works, Capital Projects & Smart City Infrastructure Ledger',
        '',
        'CivicLens provides complete financial tracking, contractor accountability, and milestone verification for all sanctioned municipal projects:',
        '',
        `- **Active Capital Projects**: **${allProjects.length} Public Works** currently tracked`,
        `- **Total Sanctioned Budget**: **₹${(totalBudget / 10000000).toFixed(2)} Crores**`,
        `- **Cumulative Expenditure to Date**: **₹${(totalSpent / 10000000).toFixed(2)} Crores**`,
        '',
        '**Detailed Project Registry:**',
        ...allProjects.map(
          (p) =>
            `- **${p.name}**\n  - Location: ${p.location} | Executing Agency: *${p.agency}*\n  - Sanctioned: ₹${(p.approved_amount / 10000000).toFixed(2)} Cr | Spent: ₹${(p.expenditure / 10000000).toFixed(2)} Cr\n  - Status: **${p.status.toUpperCase()}** (Expected Completion: ${p.expected_completion})`
        ),
      ].join('\n'),
      actions: [
        { label: 'Browse Public Projects', href: '/projects' },
        { label: 'View Geographic GIS Map', href: '/map' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 16. MUNICIPAL SERVICES (PROPERTY TAX, BIRTH/DEATH CERTIFICATES, RTI)
  // =========================================================================
  if (
    q.includes('property tax') ||
    q.includes('tax') ||
    q.includes('birth certificate') ||
    q.includes('death certificate') ||
    q.includes('trade license') ||
    q.includes('rti') ||
    q.includes('சொத்து வரி') ||
    q.includes('பிறப்பு சான்றிதழ்')
  ) {
    if (q.includes('property tax') || q.includes('tax') || q.includes('சொத்து வரி')) {
      if (isTamil) {
        return {
          text: [
            '### 💳 சென்னை மாநகராட்சி சொத்து வரி செலுத்தும் முறை',
            '',
            '- **ஆன்லைன் தளம்**: chennaicorporation.gov.in என்ற அதிகாரப்பூர்வ தளம்.',
            '- **செலுத்தும் காலம்**: ஆண்டுக்கு இரண்டு முறை (ஏப்ரல்-செப்டம்பர் & அக்டோபர்-மார்ச்).',
            '- **5% தள்ளுபடி சலுகை**: ஒவ்வொரு பருவத்தின் முதல் 15 நாட்களுக்குள் (ஏப்ரல் 1-15 & அக்டோபர் 1-15) சொத்து வரி செலுத்துபவர்களுக்கு **5% தள்ளுபடி (அதிகபட்சம் ₹5,000 வரை)** வழங்கப்படுகிறது.',
            '- **செலுத்தும் முறைகள்**: UPI, டெபிட்/கிரெடிட் கார்டு, நெட்பேங்கிங் அல்லது மாநகராட்சி இ-சேவை மையங்கள்.',
          ].join('\n'),
          actions: [{ label: 'மாநகராட்சி தளம் செல்ல', href: 'https://chennaicorporation.gov.in' }],
          source: 'live-ledger-engine',
        };
      }

      return {
        text: [
          '### 💳 Greater Chennai Corporation (GCC) Property Tax Guide',
          '',
          '- **Official Payment Portal**: Available on `chennaicorporation.gov.in`.',
          '- **Billing Cycle**: Half-yearly (Cycle 1: April 1 to Sept 30; Cycle 2: Oct 1 to March 31).',
          '- **5% Early Payment Incentive Rebate**: GCC provides a statutory **5% rebate incentive** (up to ₹5,000) for citizens paying their property tax within the first 15 days of each half-year window (April 1–15 and October 1–15).',
          '- **Modes of Payment**: Online NetBanking/UPI/Credit Card, or offline at any GCC Zonal Office E-Seva Counter.',
          '- **Revision Petitions**: If your building plinth area or usage classification is incorrect, submit an online revision petition with your latest registered deed.',
        ].join('\n'),
        actions: [{ label: 'GCC Portal', href: 'https://chennaicorporation.gov.in' }],
        source: 'live-ledger-engine',
      };
    }

    if (q.includes('birth') || q.includes('death') || q.includes('பிறப்பு')) {
      return {
        text: [
          '### 📄 Birth & Death Certificate Procedures in Tamil Nadu',
          '',
          '- **Official Download Portal**: `crstn.org` (Civil Registration System Tamil Nadu).',
          '- **Hospital Registration**: Institutional births and deaths are reported directly to the GCC Sanitary Inspector within 21 days.',
          '- **Free Digital Certificate with QR Code**: Citizens can search by hospital, child name, or date of birth and download the verified digital certificate free of charge.',
          '- **Delayed Registration**: Events not registered within 30 days require a late fee and non-availability certificate from the Revenue Divisional Officer (RDO) / Judicial Magistrate.',
        ].join('\n'),
        actions: [{ label: 'CRS Tamil Nadu Portal', href: 'https://crstn.org' }],
        source: 'live-ledger-engine',
      };
    }

    if (q.includes('rti') || q.includes('right to information')) {
      return {
        text: [
          '### ⚖️ How to File an RTI (Right to Information) with GCC',
          '',
          '- **Statutory Right**: Under Section 6(1) of the **RTI Act 2005**, any citizen can inspect road quality measurements, contractor agreements, and municipal fund disbursements.',
          '- **Addressed To**: *The Public Information Officer (PIO), Greater Chennai Corporation, Ripon Building, Chennai 600003*.',
          '- **Statutory Fee**: ₹10 via Court Fee Stamp, Demand Draft, or Indian Postal Order payable to *The Commissioner, Greater Chennai Corporation*.',
          '- **Statutory Response Limit**: The PIO is legally mandated to provide the information within **30 days** (or within 48 hours if related to personal life and liberty).',
          '- **First Appellate Authority**: If rejected or unanswered, appeal to the Zonal Joint Commissioner within 30 days.',
        ].join('\n'),
        source: 'live-ledger-engine',
      };
    }
  }

  // =========================================================================
  // 17. HOW CIVICLENS WORKS / HOW TO REPORT AN ISSUE
  // =========================================================================
  if (
    q.includes('how to report') ||
    q.includes('how do i report') ||
    q.includes('how can i report') ||
    q.includes('how does civiclens work') ||
    q.includes('file a complaint') ||
    q.includes('submit issue') ||
    q.includes('how to complain') ||
    q.includes('புகார் செய்வது எப்படி') ||
    (q.includes('எப்படி') && q.includes('புகார்')) ||
    q.includes('புகார் செய்ய') ||
    q.includes('புகாரளிப்பது எப்படி')
  ) {
    if (isTamil) {
      return {
        text: [
          '### 📝 சிவிக்லென்ஸில் புகார் பதிவு செய்யும் எளிய 5 படிகள்',
          '',
          '1. **படி 1: வகையைத் தேர்ந்தெடுங்கள்** — சாலைகள், தெருவிளக்குகள், குப்பைக் கழிவுகள், குடிநீர், மழைநீர் வடிகால் அல்லது பூங்காக்கள்.',
          '2. **படி 2: விவரங்களை உள்ளிடுங்கள்** — தலைப்பு மற்றும் பிரச்சினையின் தீவிரத்தன்மையை விவரியுங்கள்.',
          '3. **படி 3: நேரடி கேமரா புகைப்படம்** — "Open Live Camera" அழுத்தி சம்பவ இடத்தில் நேரடி கேமரா மூலம் படம் எடுங்கள். (AI கண்டறிதல் மூலம் சரிபார்க்கப்படும்).',
          '4. **படி 4: ஜிபிஎஸ் இருப்பிடம்** — "Use Current GPS" அழுத்தி உங்கள் துல்லியமான வார்டு மற்றும் முகவரியை தானாக உள்ளிடுங்கள்.',
          '5. **படி 5: உறுதிசெய்து சமர்ப்பியுங்கள்** — தானாக ஒதுக்கப்பட்ட துறை மற்றும் SLA காலக்கெடுவை உறுதிசெய்து 6 இலக்க புகார் எண்ணைப் பெறுங்கள்.',
        ].join('\n'),
        actions: [{ label: 'புதிய புகார் செய்க', href: '/report' }],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### 📝 Step-by-Step: How to Report an Issue on CivicLens',
        '',
        'CivicLens provides a tamper-proof 5-step reporting workflow with anti-fraud verification:',
        '',
        '1. **Step 1: Select Civic Category** — Choose Roads, Streetlights, Garbage, Water Supply, Drainage, or Public Parks.',
        '2. **Step 2: Describe the Hazard** — Enter issue title, dimensions, duration, and select impact severity (Low, Medium, High, Critical).',
        '3. **Step 3: Capture Live Optical Evidence** — Click **"Open Live Camera"** to take an authentic photo with the hardware viewfinder. The Dual-Stream Forensic CNN immediately verifies physical sensor noise.',
        '4. **Step 4: Pinpoint GPS Location** — Click **"Use Current GPS"** to auto-detect your exact coordinates, street address, and municipal ward.',
        '5. **Step 5: Review & Submit** — Confirm the auto-routed department and statutory SLA target date, then submit to receive your permanent tracking ID (e.g., `CL-2026-000101`).',
      ].join('\n'),
      actions: [{ label: 'Start Reporting Now', href: '/report' }],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 18. CIVICLENS PLATFORM, USER ROLES & GOVERNANCE MODEL
  // =========================================================================
  if (
    q.includes('what is civiclens') ||
    q.includes('roles') ||
    q.includes('who built') ||
    q.includes('purpose') ||
    q.includes('architecture') ||
    q.includes('பயனர் பாத்திரங்கள்')
  ) {
    return {
      text: [
        '### 🏛️ CivicLens Governance Platform & User Roles',
        '',
        'CivicLens is a next-generation municipal transparency and accountability operating system designed to eradicate fake grievance closures and bureaucratic delays:',
        '',
        '### Core Platform Pillars:',
        '1. **Immutable Public Ledger**: Every complaint, officer dispatch, field photo, and citizen verification is permanently audited.',
        '2. **Dual-Stream Forensic CNN**: Eliminates synthetic AI, deepfakes, and downloaded internet images.',
        '3. **Two-Factor Citizen Verification Lock**: Departments cannot mark tickets closed until the reporting citizen inspects the work on-site.',
        '4. **Algorithmic SLA Escalation**: Overdue complaints are automatically flagged and dispatched to the Zonal Commissioner and Ward Councillor.',
        '',
        '### User Roles & Permissions:',
        '- **Citizen**: Reports geo-tagged issues, tracks progress, conducts resolution inspections, reopens poor repairs, escalates overdue tickets.',
        '- **Field Technician (e.g., Kumaravel P.)**: Receives dispatched route assignments, navigates via GPS, uploads post-repair completion proofs.',
        '- **Department Officer (e.g., Roads Officer)**: Triages incoming complaints, assigns field crews, monitors departmental SLA compliance.',
        '- **Zonal Commissioner & Ward Councillor**: Oversees ward-level analytics, intervenes on SLA breaches, audits capital public works.',
      ].join('\n'),
      actions: [
        { label: 'Explore Public Ledger', href: '/issues' },
        { label: 'Operations Dashboard', href: '/dashboard' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 19. CONVERSATIONAL GREETINGS & INTRODUCTIONS
  // =========================================================================
  if (
    /^(hi|hello|hey|good morning|good afternoon|good evening|who are you|help|vanakkam|வணக்கம்)/i.test(q)
  ) {
    if (isTamil) {
      return {
        text: [
          '### 🤝 வணக்கம்! நான் சிவிக்லென்ஸ் நகராட்சி வழிகாட்டி AI',
          '',
          'சென்னை மாநகராட்சி எல்லைக்குட்பட்ட அனைத்து குடிமைப் பிரச்சினைகள், புகார்கள் மற்றும் விதிமுறைகளுக்கு நான் துல்லியமான பதில்களை வழங்குகிறேன்:',
          '',
          '- **புகார் கண்காணிப்பு**: உங்கள் 6 இலக்க புகார் எண்ணை உள்ளிடுங்கள் (எ.கா. `CL-2026-000101`).',
          '- **வார்டு விவரங்கள்**: வார்டு எண் அல்லது பகுதியைத் தெரிவியுங்கள் (எ.கா. `வார்டு 175 வேளச்சேரி`).',
          '- **துறை பொறுப்புகள்**: சாலைகள், கழிவுநீர், தெருவிளக்கு, குப்பை மேலாண்மை SLA காலக்கெடு.',
          '- **சட்ட உரிமைகள்**: பள்ளங்களால் ஏற்படும் வாகன சேத இழப்பீடு, நாய் கடித்தால் முதலுதவி, சொத்து வரி தள்ளுபடி.',
          '',
          'உங்களுக்கு என்ன உதவி வேண்டும் என்பதைக் கீழே உள்ளிடுங்கள்!',
        ].join('\n'),
        actions: [
          { label: 'புதிய புகார் பதிவு', href: '/report' },
          { label: 'புகார்கள் பட்டியல்', href: '/issues' },
        ],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        '### 🤝 Hello! I am CivicLens Intelligent Municipal Assistant',
        '',
        'I am directly connected to the live Greater Chennai Corporation municipal ledger. Ask me any specific question:',
        '',
        '- **Track Complaints**: Enter any ticket code (e.g., `CL-2026-000101` or `#130`) for live status, assigned worker, and SLA timer.',
        '- **Ward Intel**: Ask about any ward or zone (e.g., `Ward 175 Velachery`, `Mylapore`, `Adyar`) for active grievances and councillor details.',
        '- **Department SLAs & Contacts**: Response times and helplines for Roads, Metrowater, TANGEDCO, Sanitation, and Drainage.',
        '- **Citizen Rights & Laws**: Vehicle damage compensation for potholes, Solid Waste fines, RTI procedures, and 5% property tax rebate.',
        '- **Integrity & Security**: How our Dual-Stream Forensic CNN rejects fake AI photos and why camera-only capture is mandatory.',
        '',
        'What would you like to check today?',
      ].join('\n'),
      actions: [
        { label: 'Report a Civic Issue', href: '/report' },
        { label: 'Browse Public Ledger', href: '/issues' },
        { label: 'Ward GIS Map', href: '/map' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 19B. SPECIFIC MUNICIPAL DEPARTMENT INQUIRY & CONTACT DIRECTORY
  // =========================================================================
  const isDeptQuery = q.includes('department') || q.includes('phone') || q.includes('contact') || q.includes('number') || q.includes('email') || q.includes('helpline') || q.includes('office') || q.includes('துறை') || q.includes('தொலைபேசி');

  const matchedDepartment = allDepts.find((d) => {
    const dName = d.name.toLowerCase();
    return (
      q.includes(dName) ||
      (d.code === 'ROADS' && (q.includes('road') || q.includes('pothole') || q.includes('bridge') || q.includes('சாலை'))) ||
      (d.code === 'DRAIN' && (q.includes('drain') || q.includes('stormwater') || q.includes('flood') || q.includes('வடிகால்'))) ||
      (d.code === 'SAN' && (q.includes('sanitat') || q.includes('garbage') || q.includes('waste') || q.includes('trash') || q.includes('குப்பை'))) ||
      (d.code === 'ELEC' && (q.includes('electric') || q.includes('streetlight') || q.includes('lamp') || q.includes('tneb') || q.includes('tangedco') || q.includes('மின்'))) ||
      (d.code === 'WATER' && (q.includes('metrowater') || q.includes('sewage') || q.includes('pipe') || q.includes('water supply') || q.includes('குடிநீர்'))) ||
      (d.code === 'PARKS' && (q.includes('park') || q.includes('garden') || q.includes('tree') || q.includes('பூங்கா')))
    );
  });

  if (matchedDepartment && (isDeptQuery || q.includes('who') || q.includes('help'))) {
    const deptIssues = allIssues.filter((i) => i.department_id === matchedDepartment.id);
    const activeCount = deptIssues.filter((i) => i.status !== 'closed').length;
    const resolvedCount = deptIssues.filter((i) => i.status === 'resolved' || i.status === 'closed').length;

    let standardSla = '48 Hours';
    let emergencySla = '12 Hours';
    if (matchedDepartment.code === 'ROADS') {
      standardSla = '5 Business Days (120 Hours)';
      emergencySla = '24 Hours for arterial MTC bus routes';
    } else if (matchedDepartment.code === 'WATER') {
      standardSla = '24 Hours for sewage leaks, 48 Hours for main ruptures';
      emergencySla = '4 Hours for cross-contamination of drinking water';
    } else if (matchedDepartment.code === 'ELEC') {
      standardSla = '48 Hours for streetlights';
      emergencySla = '2 Hours for snapped live wires / sparking transformers';
    } else if (matchedDepartment.code === 'DRAIN') {
      standardSla = '48 Hours for desilting and clogged inlets';
      emergencySla = '6 Hours for waterlogging during monsoon alerts';
    } else if (matchedDepartment.code === 'SAN') {
      standardSla = '24 to 48 Hours for street sweeping and bin clearance';
      emergencySla = '12 Hours for commercial waste pileups';
    }

    if (isTamil) {
      return {
        text: [
          `### 🏢 மாநகராட்சி துறை விபரம்: **${matchedDepartment.name}**`,
          '',
          `- **துறை குறியீடு**: [${matchedDepartment.code}]`,
          `- **நேரடி உதவி தொலைபேசி**: **${matchedDepartment.contact_phone}**`,
          `- **அதிகாரப்பூர்வ மின்னஞ்சல்**: **${matchedDepartment.contact_email}**`,
          `- **பொறுப்பு விபரம்**: ${matchedDepartment.description}`,
          `- **தீர்வு காலக்கெடு (SLA)**: **${standardSla}**`,
          `- **அவசர காலக்கெடு**: ${emergencySla}`,
          `- **தற்போதைய களப்பணி நிலை**: ${activeCount} புகார்கள் பணியில் உள்ளன (${resolvedCount} புகார்கள் முடிக்கப்பட்டன).`,
          '',
          `இந்தத் துறையிடம் புதிய புகாரைப் பதிவு செய்ய கீழேயுள்ள இணைப்பைப் பயன்படுத்தவும்.`,
        ].join('\n'),
        actions: [
          { label: `${matchedDepartment.name} புகார் செய்ய`, href: '/report' },
          { label: 'துறை புகார்கள் பட்டியல்', href: '/issues' },
        ],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        `### 🏢 Municipal Department Directory: **${matchedDepartment.name}**`,
        '',
        `- **Department Code**: \`[${matchedDepartment.code}]\``,
        `- **Direct Helpline Number**: **${matchedDepartment.contact_phone}**`,
        `- **Official Department Email**: **${matchedDepartment.contact_email}**`,
        `- **Scope & Mandate**: ${matchedDepartment.description}`,
        `- **Standard Resolution SLA**: **${standardSla}**`,
        `- **Emergency Fast-Track Protocol**: **${emergencySla}**`,
        `- **Active Field Workload**: **${activeCount} active complaints** currently assigned across wards (${resolvedCount} completed).`,
        '',
        `You can log a direct, geo-tagged complaint routed immediately to this department:`,
      ].join('\n'),
      actions: [
        { label: `File Complaint with ${matchedDepartment.name}`, href: '/report' },
        { label: 'View Department Public Queue', href: '/issues' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // If asking for list of all departments
  if (q.includes('all departments') || q.includes('list of departments') || q.includes('departments list') || q.includes('துறைகள்')) {
    return {
      text: [
        '### 🏢 Greater Chennai Corporation Municipal Departments Directory',
        '',
        '| Department | Code | Helpline | Turnaround SLA |',
        '| :--- | :--- | :--- | :--- |',
        ...allDepts.map(
          (d) => `| **${d.name}** | \`${d.code}\` | **${d.contact_phone}** | ${d.code === 'ROADS' ? '5 Days' : d.code === 'WATER' ? '24-48 Hours' : '48 Hours'} |`
        ),
        '',
        'All complaints submitted on CivicLens are automatically classified and routed to the corresponding department above based on AI category analysis.',
      ].join('\n'),
      actions: [
        { label: 'Report Civic Issue', href: '/report' },
        { label: 'Public Ledger', href: '/issues' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 20. DEEP SEMANTIC SEARCH ACROSS LIVE DATABASE RECORDS
  // Searches issues, projects, wards, and departments for any matching keywords
  // =========================================================================
  const queryTokens = q.split(/\s+/).filter((t) => t.length > 2);
  const matchingIssues = allIssues.filter((i) => {
    const text = `${i.title} ${i.description} ${i.location_text} ${i.jurisdiction_name} ${i.department_name}`.toLowerCase();
    return queryTokens.some((t) => text.includes(t));
  });

  const matchingProjects = allProjects.filter((p) => {
    const text = `${p.name} ${p.description} ${p.location} ${p.agency}`.toLowerCase();
    return queryTokens.some((t) => text.includes(t));
  });

  if (matchingIssues.length > 0 || matchingProjects.length > 0) {
    if (isTamil) {
      return {
        text: [
          `### 🔍 உங்கள் தேடலுக்கான நேரடிப் பதிவேட்டுத் தகவல்கள்: *"${rawQuery}"*`,
          '',
          matchingIssues.length > 0
            ? `**தொடர்புடைய புகார்கள் (${matchingIssues.length}):**\n` +
              matchingIssues
                .slice(0, 3)
                .map(
                  (i) =>
                    `- **${i.complaint_code}**: ${i.title}\n  - துறை: ${i.department_name} | நிலை: **${i.status.toUpperCase()}** | இடம்: ${i.jurisdiction_name}`
                )
                .join('\n')
            : '',
          matchingProjects.length > 0
            ? `\n**தொடர்புடைய உள்கட்டமைப்பு பணிகள்:**\n` +
              matchingProjects
                .slice(0, 2)
                .map(
                  (p) =>
                    `- **${p.name}** (நிதி: ₹${(p.approved_amount / 10000000).toFixed(2)} கோடி | நிலை: ${p.status})`
                )
                .join('\n')
            : '',
        ].filter(Boolean).join('\n'),
        actions: [
          { label: 'அனைத்து புகார்கள்', href: '/issues' },
          { label: 'வரைபடம் பார்க்க', href: '/map' },
        ],
        source: 'live-ledger-engine',
      };
    }

    return {
      text: [
        `### 🔍 Live Ledger Search Results for: *"${rawQuery}"*`,
        '',
        matchingIssues.length > 0
          ? `**Matching Civic Complaints (${matchingIssues.length} found):**\n` +
            matchingIssues
              .slice(0, 3)
              .map(
                (i) =>
                  `- **${i.complaint_code}**: *${i.title}*\n  - Department: ${i.department_name} | Status: **${i.status.toUpperCase()}** | Ward: ${i.jurisdiction_name} (${i.location_text})`
              )
              .join('\n')
          : '',
        matchingProjects.length > 0
          ? `\n**Matching Public Works & Capital Projects:**\n` +
            matchingProjects
              .slice(0, 2)
              .map(
                (p) =>
                  `- **${p.name}**\n  - Sanctioned: ₹${(p.approved_amount / 10000000).toFixed(2)} Cr | Agency: ${p.agency} | Status: **${p.status.toUpperCase()}**`
              )
              .join('\n')
          : '',
        '',
        'Click below to inspect the full public ledger or locate these records on the municipal map:',
      ].filter(Boolean).join('\n'),
      actions: [
        { label: 'Explore Search in Ledger', href: '/issues' },
        { label: 'View on Ward GIS Map', href: '/map' },
      ],
      source: 'live-ledger-engine',
    };
  }

  // =========================================================================
  // 21. DETAILED COMPREHENSIVE INTELLIGENT DEFAULT
  // Provides direct actionable answers rather than generic text
  // =========================================================================
  const sampleWards = allWards.slice(0, 4).map((w) => w.name).join(', ');
  const totalCrores = allProjects.reduce((s, p) => s + (p.approved_amount || 0), 0) / 10000000;

  if (isTamil) {
    return {
      text: [
        `### 🏛️ சிவிக்லென்ஸ் நகராட்சி வழிகாட்டி`,
        '',
        `நீங்கள் கேட்ட கேள்வி: *"${rawQuery}"*`,
        '',
        'இதற்கான துல்லியமான தகவல்கள் மற்றும் சேவைகள்:',
        `- **குறிப்பிட்ட புகார் அறிய**: உங்கள் புகார் எண்ணைத் தட்டச்சு செய்யவும் (எ.கா. \`CL-2026-000101\`).`,
        `- **வார்டு நிலவரம்**: ${sampleWards} உள்ளிட்ட அனைத்து 200 வார்டுகளின் நிலவரங்களை அறியலாம்.`,
        `- **அவசர எண்கள்**: மாநகராட்சி உதவி எண் **1913**, குடிநீர் வாரியம் **1916**, மின்வாரியம் **1912**, அவசர சிகிச்சை **108**.`,
        `- **சட்ட உதவிகள்**: பள்ள விபத்து இழப்பீடு, கழிவு மேலாண்மை அபராதங்கள், 5% சொத்து வரி தள்ளுபடி சலுகை.`,
        `- **உண்மையான புகைப்படங்கள்**: போலிகளைத் தடுக்க நேரடி கேமரா மற்றும் Dual-Stream CNN உண்மைத்தன்மை பரிசோதனை கட்டாயமாக்கப்பட்டுள்ளது.`,
        '',
        'உங்களுக்குத் தேவையான பிரிவைத் தேர்ந்தெடுக்கவும்:',
      ].join('\n'),
      actions: [
        { label: 'புதிய புகார் பதிவு', href: '/report' },
        { label: 'பொதுப் பதிவேடு', href: '/issues' },
        { label: 'வரைபடம் பார்க்க', href: '/map' },
      ],
      source: 'live-ledger-engine',
    };
  }

  return {
    text: [
      `### 🏛️ CivicLens Municipal Intelligence Response`,
      '',
      `Regarding: *"${rawQuery}"*`,
      '',
      'Here are specific, actionable facts and municipal procedures relevant to your inquiry:',
      '',
      `- **Track Any Complaint**: Submit any 6-digit ticket code (e.g., \`CL-2026-000101\` or \`#101\`) to inspect real-time field technician logs, photos, and SLA deadlines.`,
      `- **Direct Helplines**: GCC Central Grievance (**1913**), Metrowater Emergency (**1916**), TANGEDCO Electricity (**1912**), Flood/Disaster Control (**1070** / **1077**).`,
      `- **Department SLAs**: 24h for drinking water & sewage bursts, 48h for streetlight outages and garbage, 5 business days for road potholes.`,
      `- **Legal Redressal**: Claims for vehicle damages from unmaintained roads under Section 203 & 385 of Chennai City Municipal Corporation Act 1919.`,
      `- **Capital Transparency**: Live ledger tracking of ₹${totalCrores.toFixed(2)} Crores in sanctioned infrastructure projects across Chennai.`,
      `- **Integrity Guarantee**: All photos must be captured live via camera and verified by our Dual-Stream Forensic CNN before routing.`,
      '',
      'Select a direct destination below or ask about any specific ticket, ward, or regulation:',
    ].join('\n'),
    actions: [
      { label: 'Report Civic Issue', href: '/report' },
      { label: 'Browse Public Ledger', href: '/issues' },
      { label: 'Interactive Ward Map', href: '/map' },
      { label: 'Operations Dashboard', href: '/dashboard' },
    ],
    source: 'live-ledger-engine',
  };
}
