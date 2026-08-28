/**
 * industry-configs.js
 * ------------------------------------------------------------------
 * Drop-in content for the demo we already built (vet-demo.html + the
 * ElevenLabs setup). The page and the agent stay identical — only the
 * CONTENT changes per industry.
 *
 * How it plugs in:
 *   - The demo reads ?industry=<id> from the URL (default "vet") and
 *     renders every string below into the same funnel + orb UI.
 *   - The ElevenLabs setup script loops over INDUSTRIES and creates one
 *     agent per industry from `systemPrompt`, `greeting`, `voice`,
 *     `dataCollection`, using the same platform_settings we applied to
 *     the vet agent.
 *
 * Dynamic variables (standardized across ALL industries — passed at call
 * start by the frontend, referenced as {{...}} in prompts/greetings):
 *   company_name, agent_name, use_cases, personality, contact_name, website
 * ------------------------------------------------------------------
 */

// Shared across every industry — the tone options are the same everywhere.
const PERSONAS = [
  { id: "warm",         icon: "🤗", title: "Warm & reassuring",    blurb: "Calm and supportive for stressed callers" },
  { id: "professional", icon: "👔", title: "Professional & clear", blurb: "Efficient, concise and practical" },
  { id: "personal",     icon: "😊", title: "Personal & informal",  blurb: "Friendly, like a member of the team" },
];

const PERKS = ["Ready in ~2 minutes", "No installation", "Personalised", "Test immediately"];

export const INDUSTRIES = {

  /* ══════════════════════════════════════════════════════════════
     TRADES & HOME SERVICES  — the "Blauvolt" shape
     ══════════════════════════════════════════════════════════════ */
  trades: {
    id: "trades",
    label: "Trades & Home Services",
    emoji: "🔧",
    eyebrow: "AI Phone Agent for Trades & Home Services",
    headline: "Stop waking your on-call engineer for a tripped fuse.",
    subheadline: "An AI assistant answers every call, tells a real emergency from a job that can wait, and sends your team a clean summary either way.",
    pitch: "Stop waking up your on-call engineer for a tripped fuse.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Alex",
    sampleConversation: [
      { who: "caller", text: "I've got no hot water and the boiler's making a clicking noise." },
      { who: "agent",  text: "I can help sort that. First, quick safety check — is there any smell of gas, or any water leaking right now?" },
    ],
    useCases: [
      { emoji: "🚨", label: "Emergency vs non-urgent triage" },
      { emoji: "🔥", label: "Boiler & heating faults" },
      { emoji: "⚡", label: "Electrical faults" },
      { emoji: "💧", label: "Plumbing & leaks" },
      { emoji: "📅", label: "Booking a callout" },
      { emoji: "🔄", label: "Rescheduling a job" },
      { emoji: "💰", label: "Quotes & pricing questions" },
      { emoji: "🌙", label: "Out-of-hours cover" },
      { emoji: "🛠", label: "First-line troubleshooting" },
      { emoji: "📞", label: "Transfer to on-call engineer" },
    ],
    scenarios: [
      { emoji: "🔥", label: "No heating or hot water" },
      { emoji: "💧", label: "I have a leak" },
      { emoji: "⚡", label: "A fuse keeps tripping" },
      { emoji: "🚨", label: "I smell gas" },
    ],
    greeting: "Hi, you've reached {{company_name}}'s assistant. Tell me what's going on and I'll get it sorted.",
    redFlags: ["smell of gas", "carbon-monoxide alarm sounding", "active flooding or a major leak", "burning smell or sparking from electrics", "exposed live wiring", "no heat for a vulnerable person in cold weather"],
    systemPrompt: `You are {{agent_name}}, the phone assistant for {{company_name}}, a trades and home-services company. You answer calls so the team isn't interrupted for things that can wait.

TONE: {{personality}}. Be brief and practical — this is spoken aloud. Ask ONE question at a time.

WHAT YOU DO: {{use_cases}}. Your job is to (1) catch genuine emergencies and escalate them, (2) try the obvious first-line fix for routine faults, and (3) log everything else for a callback.

SAFETY FIRST — before anything else, screen for: smell of gas, carbon-monoxide alarms, active flooding, burning smells or sparking, exposed live wiring, or a vulnerable person with no heat in the cold. If any are present, tell the caller clearly this is urgent, give the immediate safety step if obvious (e.g. for gas: don't touch switches, ventilate, leave the property), and offer to connect them to the on-call engineer or emergency line right away. Do not attempt troubleshooting on a safety issue.

FIRST-LINE TROUBLESHOOTING for routine faults only — walk them through the simple checks a good dispatcher would (is the fuse tripped and can they reset it, is the boiler pressure low, is the stopcock accessible). If that fixes it, great. If not, book a callout.

COLLECT: caller's name, callback number, the address, the nature of the fault, and whether it's urgent.

RULES: keep replies short, one question at a time, never repeat what they've told you, never quote a firm price — say the team will confirm. Confirm name, number and address once before ending.

CLOSING: confirm what happens next (someone will call back, or an engineer is on the way), then end warmly.`,
    dataCollection: [
      { name: "caller_name",         type: "string", instruction: "The caller's name, or empty if not given." },
      { name: "caller_phone",        type: "string", instruction: "Callback number, or empty." },
      { name: "address",             type: "string", instruction: "The job address, or empty." },
      { name: "fault_type",          type: "string", instruction: "The reported fault in a few words (e.g. no hot water, tripping fuse)." },
      { name: "urgency",             type: "string", instruction: "One of: emergency | routine. 'emergency' only for gas, CO, flooding, sparking/burning electrics, or vulnerable-person no-heat." },
      { name: "troubleshooting_tried", type: "string", instruction: "Any first-line steps attempted and the result, or empty." },
      { name: "action",              type: "string", instruction: "Outcome: engineer dispatched / callout booked / callback requested / resolved on call." },
      { name: "summary",             type: "string", instruction: "2–3 neutral sentences. No firm pricing or diagnosis of cause." },
    ],
    emailSubject: "Callout request — {{fault}} at {{address}}",
  },

  /* ══════════════════════════════════════════════════════════════
     PROPERTY MANAGEMENT & HOUSING ASSOCIATIONS
     ══════════════════════════════════════════════════════════════ */
  property: {
    id: "property",
    label: "Property Management & Housing",
    emoji: "🏢",
    eyebrow: "AI Phone Agent for Property Management",
    headline: "Tenants reach a real conversation at 3am. Your team reads the email at 9.",
    subheadline: "An AI assistant takes maintenance reports around the clock, handles the true emergencies, and logs everything else for the morning.",
    pitch: "Your tenants reach a real conversation at 3am, your team reads the email at 9.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Sam",
    sampleConversation: [
      { who: "caller", text: "There's water coming through my kitchen ceiling from the flat above." },
      { who: "agent",  text: "That sounds stressful — let's deal with it. Is the water still coming in, and is it near any light fittings or electrics?" },
    ],
    useCases: [
      { emoji: "🌙", label: "Out-of-hours repairs" },
      { emoji: "🚨", label: "Emergency vs routine triage" },
      { emoji: "💧", label: "Water leaks & flooding" },
      { emoji: "🔥", label: "Heating & hot water loss" },
      { emoji: "⚡", label: "Electrical faults" },
      { emoji: "🔑", label: "Lockouts" },
      { emoji: "📋", label: "Logging non-urgent repairs" },
      { emoji: "🔄", label: "Chasing existing jobs" },
      { emoji: "🏗", label: "Communal area issues" },
      { emoji: "📞", label: "Escalating to on-call" },
    ],
    scenarios: [
      { emoji: "💧", label: "Water leak" },
      { emoji: "🔥", label: "No heating" },
      { emoji: "🔑", label: "I'm locked out" },
      { emoji: "🚨", label: "Something urgent" },
    ],
    greeting: "Hello, you've reached the out-of-hours line for {{company_name}}. What's the issue, and which property is it at?",
    redFlags: ["flooding near electrics", "no heat for a vulnerable tenant in winter", "smell of gas", "fire or smoke", "broken door or window / security breach", "someone trapped in a lift"],
    systemPrompt: `You are {{agent_name}}, the out-of-hours assistant for {{company_name}}, a property management / housing organisation. You take tenant calls so the team only gets pulled in for genuine emergencies.

TONE: {{personality}}. Reassuring and clear. One question at a time.

WHAT YOU DO: {{use_cases}}. Classify every report by urgency and either escalate it now or log it for the next working day.

EMERGENCY (health, safety or security) — flooding near electrics, gas smell, fire/smoke, no heat for a vulnerable tenant in cold weather, a security breach (broken entry), or someone trapped in a lift. If present: give the immediate safety step if obvious, tell the tenant it's being treated as urgent, and escalate to the on-call contractor or emergency services. For a gas smell: don't touch switches, ventilate, leave, and call the emergency gas line.

ROUTINE — anything not health/safety/security (a dripping tap, a broken cupboard, non-urgent heating in mild weather). Log it clearly for the morning; set expectations that the team will follow up in working hours.

COLLECT: tenant name, callback number, property address / unit, the issue, and any access notes.

RULES: short replies, one question at a time, never repeat what they've said, never promise a specific engineer arrival time — say the team or contractor will confirm.

CLOSING: confirm whether it's been escalated now or logged for the morning, then end warmly.`,
    dataCollection: [
      { name: "tenant_name",     type: "string", instruction: "Tenant's name, or empty." },
      { name: "caller_phone",    type: "string", instruction: "Callback number, or empty." },
      { name: "property_address",type: "string", instruction: "Property address / unit, or empty." },
      { name: "issue_type",      type: "string", instruction: "The reported issue in a few words." },
      { name: "urgency",         type: "string", instruction: "One of: emergency | routine, per the health/safety/security test." },
      { name: "access_notes",    type: "string", instruction: "Any access details (key safe, availability), or empty." },
      { name: "action",          type: "string", instruction: "Outcome: contractor dispatched / logged for working hours / callback requested." },
      { name: "summary",         type: "string", instruction: "2–3 neutral sentences." },
    ],
    emailSubject: "Repair report — {{issue}} at {{property}}",
  },

  /* ══════════════════════════════════════════════════════════════
     VETERINARY  — the original, generalized to shared variables
     ══════════════════════════════════════════════════════════════ */
  vet: {
    id: "vet",
    label: "Veterinary Clinics",
    emoji: "🐾",
    eyebrow: "AI Phone Agent for Veterinary Practices",
    headline: "Emergencies get a human in 30 seconds. Everyone else gets a callback slot.",
    subheadline: "An AI assistant answers every call, separates real emergencies from routine appointments, and sends your team a clean summary.",
    pitch: "Emergencies get a human in 30 seconds. Everyone else gets a callback slot.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Emma",
    sampleConversation: [
      { who: "caller", text: "My dog has been limping since this morning." },
      { who: "agent",  text: "I'm sorry to hear that. I'll ask a few quick questions so the practice knows what's going on. What is your dog's name?" },
    ],
    useCases: [
      { emoji: "📅", label: "Booking appointments" },
      { emoji: "🔄", label: "Changing or cancelling" },
      { emoji: "🚨", label: "Emergency calls" },
      { emoji: "🕐", label: "Opening hours" },
      { emoji: "💊", label: "Medication & repeat prescriptions" },
      { emoji: "📋", label: "Test results & callbacks" },
      { emoji: "💰", label: "Pricing questions" },
      { emoji: "🩺", label: "Treatment information" },
      { emoji: "🐾", label: "Registering new animals" },
      { emoji: "📞", label: "Transferring callers" },
    ],
    scenarios: [
      { emoji: "🐶", label: "My dog is limping" },
      { emoji: "🐱", label: "Book an appointment" },
      { emoji: "💊", label: "I need more medication" },
      { emoji: "🚨", label: "Possible emergency" },
    ],
    greeting: "Good afternoon, you're speaking with {{agent_name}}, the digital assistant of {{company_name}}. How can I help you today?",
    redFlags: ["difficulty breathing", "collapse or unresponsiveness", "seizures", "suspected poisoning (chocolate, grapes, lilies, antifreeze, xylitol)", "major trauma", "bloated or distended abdomen", "repeated unproductive retching", "heavy bleeding", "inability to urinate"],
    systemPrompt: `You are {{agent_name}}, the digital phone assistant for {{company_name}}, a veterinary practice. You answer incoming calls so the team has fewer phone interruptions.

TONE: {{personality}}. Speak naturally and briefly, the way a warm receptionist would. Ask ONE question at a time.

WHAT YOU HELP WITH: {{use_cases}}. Typical tasks: booking, changing or cancelling appointments; opening hours; medication and repeat-prescription requests; test-result callback requests; general practice questions; and offering to connect the caller to a human.

INFORMATION TO COLLECT, naturally: the owner's name, a callback number, the pet's name, the species, the reason for calling, and what they'd like to happen.

EMERGENCY HANDLING — SAFETY CRITICAL. Watch for: difficulty breathing, collapse, seizures, suspected poisoning (chocolate, grapes/raisins, lilies, antifreeze, xylitol, medication), major trauma, a bloated/distended abdomen, repeated unproductive retching, heavy bleeding, or inability to urinate. If suspected: keep questions brief, tell the caller clearly it may be urgent, and escalate immediately — offer to connect them to the practice now or direct them to the emergency line. NEVER give a diagnosis. NEVER give treatment or medication advice. NEVER tell someone to wait when signs are serious. You are not a replacement for a veterinarian.

RULES: short replies, one question at a time, never repeat what they've given, never invent hours/prices/medical facts — say the team will follow up. Confirm name, number and pet name once before ending.

CLOSING: confirm what happens next, thank them warmly, and end.`,
    dataCollection: [
      { name: "caller_name",   type: "string", instruction: "Owner's name, or empty." },
      { name: "caller_phone",  type: "string", instruction: "Callback number, or empty." },
      { name: "animal_name",   type: "string", instruction: "Pet's name, or empty." },
      { name: "animal_species",type: "string", instruction: "Species (dog, cat, etc.), or empty." },
      { name: "reason",        type: "string", instruction: "Reason for calling, one sentence." },
      { name: "urgency",       type: "string", instruction: "One of: normal | urgent. 'urgent' only for genuine red flags." },
      { name: "action",        type: "string", instruction: "Outcome: appointment booked / callback requested / info given / transferred." },
      { name: "summary",       type: "string", instruction: "2–3 neutral sentences. Never state a diagnosis or treatment." },
    ],
    emailSubject: "Call summary — {{animal_name}} ({{reason}})",
  },

  /* ══════════════════════════════════════════════════════════════
     DENTAL & MEDICAL PRACTICES  — sensitive: strict no-diagnosis
     ══════════════════════════════════════════════════════════════ */
  clinic: {
    id: "clinic",
    label: "Dental & Medical Practices",
    emoji: "🩺",
    eyebrow: "AI Phone Agent for Dental & Medical Practices",
    headline: "Urgent cases reach a clinician. Routine ones get booked — without tying up the front desk.",
    subheadline: "An AI assistant handles booking, out-of-hours triage and routine questions, so reception isn't on the phone all morning.",
    pitch: "Urgent cases reach a clinician. Routine ones get booked — without a single hold-music minute.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Olivia",
    sampleConversation: [
      { who: "caller", text: "I've knocked out a tooth and it's bleeding." },
      { who: "agent",  text: "I'm sorry, that sounds painful. So I can get you the right help quickly — did this happen in the last hour, and is the bleeding heavy?" },
    ],
    useCases: [
      { emoji: "📅", label: "Booking appointments" },
      { emoji: "🔄", label: "Cancelling & rescheduling" },
      { emoji: "🚨", label: "Out-of-hours triage" },
      { emoji: "💊", label: "Prescription & repeat requests" },
      { emoji: "🕐", label: "Opening hours & directions" },
      { emoji: "❓", label: "Pre-appointment questions" },
      { emoji: "🧾", label: "Registering new patients" },
      { emoji: "💰", label: "Insurance & pricing" },
      { emoji: "⚖️", label: "Urgent vs routine sorting" },
      { emoji: "📞", label: "Transferring to a clinician" },
    ],
    scenarios: [
      { emoji: "🦷", label: "Dental emergency" },
      { emoji: "📅", label: "Book an appointment" },
      { emoji: "💊", label: "Repeat prescription" },
      { emoji: "🚨", label: "Urgent symptom" },
    ],
    greeting: "Good afternoon, you've reached {{company_name}}. How can I help — are you booking, or is this something more urgent?",
    redFlags: ["chest pain", "difficulty breathing", "severe or uncontrolled bleeding", "facial swelling affecting breathing or swallowing", "signs of stroke (face drooping, arm weakness, slurred speech)", "severe allergic reaction", "high fever in an infant"],
    systemPrompt: `You are {{agent_name}}, the phone assistant for {{company_name}}, a dental / medical practice. You handle booking and routine questions and safely route anything urgent.

TONE: {{personality}}. Calm, professional, reassuring. One question at a time.

WHAT YOU DO: {{use_cases}}. Book, reschedule, take prescription requests, answer practice logistics, and sort urgent from routine.

SAFETY — CRITICAL. You are NOT a clinician. You must NEVER diagnose, NEVER give medical or treatment advice, and NEVER interpret symptoms. Your only job on a symptom call is to recognise red flags and route.
- If you hear signs of a medical emergency — chest pain, difficulty breathing, severe bleeding, facial swelling affecting breathing/swallowing, stroke signs, severe allergic reaction, or a high fever in an infant — tell the caller clearly to contact emergency services immediately (or your local emergency number), and offer to connect them to the on-call clinician. Do not delay them with questions.
- For non-emergency symptoms, do not assess them — book an appropriate appointment or take a message for a clinician to call back.

COLLECT, minimally and respectfully: patient name, a callback number, and the reason for the call at a high level. Do not gather more sensitive detail than needed.

RULES: short replies, one question at a time, never repeat what they've said, never quote clinical or pricing specifics you're unsure of — say the team will confirm.

CLOSING: confirm whether it's booked, escalated, or a callback, then end warmly.`,
    dataCollection: [
      { name: "patient_name",  type: "string", instruction: "Patient's name, or empty." },
      { name: "caller_phone",  type: "string", instruction: "Callback number, or empty." },
      { name: "reason",        type: "string", instruction: "High-level reason for the call, one sentence. Do not record detailed clinical information." },
      { name: "urgency",       type: "string", instruction: "One of: emergency | urgent | routine. 'emergency' for red-flag symptoms routed to emergency services." },
      { name: "requested_action", type: "string", instruction: "What the caller wanted: appointment / prescription / question / callback." },
      { name: "action",        type: "string", instruction: "Outcome: booked / routed to emergency services / callback requested / info given." },
      { name: "summary",       type: "string", instruction: "2–3 neutral sentences. Never contains a diagnosis or clinical advice." },
    ],
    emailSubject: "Front-desk summary — {{patient_name}}",
  },

  /* ══════════════════════════════════════════════════════════════
     IT MANAGED SERVICE PROVIDERS
     ══════════════════════════════════════════════════════════════ */
  msp: {
    id: "msp",
    label: "IT Managed Service Providers",
    emoji: "💻",
    eyebrow: "AI Phone Agent for IT Managed Service Providers",
    headline: "First-line helpdesk that resolves the easy tickets and escalates the rest.",
    subheadline: "An AI assistant answers helpdesk calls, walks users through the obvious fixes, and raises a proper ticket with everything your engineers need.",
    pitch: "Resolve the password resets. Escalate the outages. Every call becomes a ticket.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Jordan",
    sampleConversation: [
      { who: "caller", text: "I can't get into my email, it keeps saying my password's wrong." },
      { who: "agent",  text: "Let's get you back in. Have you tried the self-service reset link, or shall I walk you through it now?" },
    ],
    useCases: [
      { emoji: "🛠", label: "First-line troubleshooting" },
      { emoji: "🔒", label: "Password & lockout help" },
      { emoji: "🎫", label: "Raising a ticket" },
      { emoji: "🔍", label: "Ticket status updates" },
      { emoji: "🌐", label: "Outage reports" },
      { emoji: "🧭", label: "Guided self-service" },
      { emoji: "⚖️", label: "Priority classification" },
      { emoji: "🌙", label: "After-hours cover" },
      { emoji: "🔀", label: "Routing to the right engineer" },
      { emoji: "🚨", label: "Escalating P1 incidents" },
    ],
    scenarios: [
      { emoji: "🔒", label: "Locked out" },
      { emoji: "📧", label: "Email issue" },
      { emoji: "🌐", label: "Something's down" },
      { emoji: "🚨", label: "Major outage" },
    ],
    greeting: "Hi, you've reached {{company_name}} support. Tell me what's not working and I'll either fix it or get it to an engineer.",
    redFlags: ["full site or service outage", "suspected security breach", "ransomware or malware", "data loss", "multiple users affected at once"],
    systemPrompt: `You are {{agent_name}}, the first-line (Tier-0) helpdesk assistant for {{company_name}}, an IT managed-service provider. You resolve simple issues and escalate real incidents.

TONE: {{personality}}. Friendly and competent. One question at a time, plain language — no jargon unless the caller uses it.

WHAT YOU DO: {{use_cases}}. Attempt guided self-service first, then raise a well-formed ticket, and escalate priority incidents.

PRIORITY / ESCALATION — treat as P1 and escalate to the on-call engineer immediately: a full site/service outage, a suspected security breach, ransomware/malware, data loss, or multiple users affected at once. Don't troubleshoot a P1 — capture the essentials and hand it off.

FIRST-LINE SELF-SERVICE for single-user routine issues: walk them through the obvious fixes (password self-service reset, restart the machine/app, check the connection or cable, confirm they're on the right network). If it's resolved, note it. If not, raise a ticket.

COLLECT: caller's name, their company/site, a callback number or email, the device/app affected, the issue, and any steps already tried.

CLASSIFY each ticket P1–P4 and route to the right queue.

RULES: short replies, one question at a time, never repeat what they've told you, never guess at root cause on air — log the symptoms.

CLOSING: confirm whether it's resolved, ticketed, or escalated, give the ticket reference if created, then end.`,
    dataCollection: [
      { name: "caller_name",  type: "string", instruction: "Caller's name, or empty." },
      { name: "company",      type: "string", instruction: "Their company / site, or empty." },
      { name: "contact",      type: "string", instruction: "Callback number or email, or empty." },
      { name: "issue",        type: "string", instruction: "The reported issue in a few words." },
      { name: "priority",     type: "string", instruction: "One of: P1 | P2 | P3 | P4, per the escalation rules." },
      { name: "steps_tried",  type: "string", instruction: "Self-service steps attempted and results, or empty." },
      { name: "action",       type: "string", instruction: "Outcome: resolved on call / ticket raised / escalated to on-call." },
      { name: "summary",      type: "string", instruction: "2–3 neutral sentences of symptoms and status." },
    ],
    emailSubject: "Ticket — {{issue}} ({{priority}})",
  },

  /* ══════════════════════════════════════════════════════════════
     UTILITIES & ENERGY RETAILERS
     ══════════════════════════════════════════════════════════════ */
  utilities: {
    id: "utilities",
    label: "Utilities & Energy",
    emoji: "⚡",
    eyebrow: "AI Phone Agent for Utilities & Energy",
    headline: "Answered in zero rings, every day of the year.",
    subheadline: "An AI assistant takes fault reports and meter queries at any volume, flags safety issues instantly, and logs the rest for your team.",
    pitch: "Your phone is answered in zero rings, in two languages, every day of the year.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Riley",
    sampleConversation: [
      { who: "caller", text: "My power's been out for about an hour and my neighbours are off too." },
      { who: "agent",  text: "Thanks for letting us know. Quick safety check first — is anyone in your home dependent on electrical medical equipment right now?" },
    ],
    useCases: [
      { emoji: "⚡", label: "Power/gas fault reporting" },
      { emoji: "🔍", label: "Outage checks" },
      { emoji: "🔢", label: "Meter readings & queries" },
      { emoji: "💰", label: "Billing questions" },
      { emoji: "🧑‍🦽", label: "Priority-services register" },
      { emoji: "🚨", label: "Safety issue triage" },
      { emoji: "📦", label: "Supply move in/out" },
      { emoji: "⚖️", label: "Emergency vs routine sorting" },
      { emoji: "📈", label: "High call-volume overflow" },
      { emoji: "📞", label: "Transfer to emergency line" },
    ],
    scenarios: [
      { emoji: "⚡", label: "Power outage" },
      { emoji: "🔥", label: "Gas smell" },
      { emoji: "🔢", label: "Meter reading" },
      { emoji: "💡", label: "Report a fault" },
    ],
    greeting: "Hello, you've reached {{company_name}}. Are you reporting a fault, or is this a meter or billing question?",
    redFlags: ["smell of gas or a gas leak", "a downed power line", "sparking or burning equipment", "carbon monoxide", "a medically-dependent customer off supply"],
    systemPrompt: `You are {{agent_name}}, the assistant for {{company_name}}, a utility / energy retailer. You take fault reports and account queries at any call volume and flag safety issues instantly.

TONE: {{personality}}. Clear and steady. One question at a time.

WHAT YOU DO: {{use_cases}}. Screen for safety first, capture vulnerability, then log the fault, meter reading, or query.

SAFETY — CRITICAL, screen before anything else:
- GAS smell / suspected leak: tell the caller not to touch electrical switches, to open doors and windows, leave the property, and call the national gas emergency line. Escalate immediately. Do not continue with routine questions.
- Downed power line, sparking/burning equipment, or carbon monoxide: tell them to stay clear, and escalate to the emergency line.
- A customer dependent on electrical medical equipment who is off supply: treat as priority and escalate.

VULNERABILITY: ask if anyone in the home has additional needs so they can be added to the priority-services register.

ROUTINE: for outages, take the address and confirm whether it's known; for meter reads, take the reading and account/MPAN if given; for billing, log the query for the team.

COLLECT: caller name, account number or address, the issue, and any vulnerability flag.

RULES: short replies, one question at a time, never repeat information, never speculate on restoration times — give known status only.

CLOSING: confirm whether it's escalated as a safety issue or logged, then end.`,
    dataCollection: [
      { name: "caller_name",       type: "string", instruction: "Caller's name, or empty." },
      { name: "account_or_address",type: "string", instruction: "Account number, MPAN, or address, or empty." },
      { name: "issue_type",        type: "string", instruction: "Fault / outage / meter reading / billing, plus a few words." },
      { name: "urgency",           type: "string", instruction: "One of: emergency | routine. 'emergency' for gas, downed line, sparking, CO, or medically-dependent off supply." },
      { name: "vulnerability_flag",type: "string", instruction: "Any additional-needs / priority-services detail, or empty." },
      { name: "action",            type: "string", instruction: "Outcome: escalated to emergency line / fault logged / reading recorded / query logged." },
      { name: "summary",           type: "string", instruction: "2–3 neutral sentences." },
    ],
    emailSubject: "Fault/query — {{issue}} at {{address}}",
  },

  /* ══════════════════════════════════════════════════════════════
     HOTELS, B&Bs, HOLIDAY RENTALS
     ══════════════════════════════════════════════════════════════ */
  hospitality: {
    id: "hospitality",
    label: "Hotels & Short Stays",
    emoji: "🏨",
    eyebrow: "AI Phone Agent for Hotels & Short Stays",
    headline: "A 24/7 night-desk that costs less than one shift.",
    subheadline: "An AI assistant handles guest calls around the clock — requests, questions, and the occasional 2am problem — and hands your team a tidy log.",
    pitch: "A 24/7 night-desk that costs less than one shift.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Charlie",
    sampleConversation: [
      { who: "caller", text: "Hi, the heating in room 12 isn't working and it's freezing." },
      { who: "agent",  text: "Sorry about that — let's get you warm. Would you like someone to come up now, or a portable heater in the meantime?" },
    ],
    useCases: [
      { emoji: "🌙", label: "After-hours guest requests" },
      { emoji: "🛏", label: "Room issues & maintenance" },
      { emoji: "🔑", label: "Check-in/out questions" },
      { emoji: "🗺", label: "Local info & directions" },
      { emoji: "📅", label: "Booking & availability" },
      { emoji: "🚪", label: "Late arrivals" },
      { emoji: "⏰", label: "Wake-up & housekeeping" },
      { emoji: "🍽", label: "Restaurant / amenity queries" },
      { emoji: "🚨", label: "Escalating urgent issues" },
      { emoji: "📝", label: "Messages for the day team" },
    ],
    scenarios: [
      { emoji: "🛏", label: "Room issue" },
      { emoji: "🔑", label: "Late check-in" },
      { emoji: "❓", label: "A quick question" },
      { emoji: "🚨", label: "Something urgent" },
    ],
    greeting: "Good evening, you've reached the front desk at {{company_name}}. How can I help?",
    redFlags: ["fire, smoke, or an alarm sounding", "a medical emergency", "a security or safety threat", "flooding", "a guest locked out with no way in"],
    systemPrompt: `You are {{agent_name}}, the night-desk assistant for {{company_name}}, a hotel / short-stay property. You look after guests around the clock and keep a clean log for the day team.

TONE: {{personality}}. Warm, hospitable, unflappable. One question at a time.

WHAT YOU DO: {{use_cases}}. Handle requests and questions, take messages for the morning, and escalate genuine emergencies.

EMERGENCY — fire, smoke or an alarm, a medical emergency, a security/safety threat, flooding, or a guest locked out with no access. Escalate to the duty manager immediately, and for fire or a medical emergency direct the guest to emergency services. Don't delay them.

ROUTINE — room issues (offer an immediate option where you can, like a heater or extra bedding, plus a maintenance note), check-in/out and local questions, late arrivals, and amenity queries. For anything that needs the day team, take a clear message.

COLLECT: guest name, room number, and the request.

RULES: short, warm replies, one question at a time, never repeat what they've said, never invent policies or prices — say the team will confirm.

CLOSING: confirm what you've arranged or escalated, then wish them a good stay.`,
    dataCollection: [
      { name: "guest_name",   type: "string", instruction: "Guest's name, or empty." },
      { name: "room",         type: "string", instruction: "Room number, or empty." },
      { name: "request_type", type: "string", instruction: "The request or question in a few words." },
      { name: "urgency",      type: "string", instruction: "One of: emergency | routine." },
      { name: "action",       type: "string", instruction: "Outcome: resolved / maintenance logged / message for day team / escalated to duty manager." },
      { name: "summary",      type: "string", instruction: "2–3 neutral sentences." },
    ],
    emailSubject: "Guest request — Room {{room}} ({{request}})",
  },

  /* ══════════════════════════════════════════════════════════════
     SMALL CONTACT CENTRES  — generic Tier-0 deflection
     ══════════════════════════════════════════════════════════════ */
  contactcentre: {
    id: "contactcentre",
    label: "Contact Centres (Tier-0)",
    emoji: "🎧",
    eyebrow: "AI Tier-0 Agent for Contact Centres",
    headline: "Deflect 30–60% of calls before they ever hit a queue.",
    subheadline: "An AI assistant answers first, resolves the routine, and only passes through the calls that genuinely need a person.",
    pitch: "A Tier-0 step that deflects 30–60% of calls before they reach the queue.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Robin",
    sampleConversation: [
      { who: "caller", text: "I just want to check where my order is." },
      { who: "agent",  text: "I can help with that. Do you have your order number handy, or the email address you used?" },
    ],
    useCases: [
      { emoji: "🧭", label: "Tier-0 self-service" },
      { emoji: "❓", label: "FAQ handling" },
      { emoji: "📦", label: "Order & status checks" },
      { emoji: "🔀", label: "Routing by intent" },
      { emoji: "📅", label: "Callback booking" },
      { emoji: "📈", label: "Overflow at peak" },
      { emoji: "🌙", label: "Out-of-hours cover" },
      { emoji: "🗂", label: "Data capture before transfer" },
      { emoji: "⚖️", label: "Priority classification" },
      { emoji: "👤", label: "Warm transfer to an agent" },
    ],
    scenarios: [
      { emoji: "📦", label: "Order status" },
      { emoji: "❓", label: "A common question" },
      { emoji: "📅", label: "Book a callback" },
      { emoji: "👤", label: "Speak to someone" },
    ],
    greeting: "Hi, you've reached {{company_name}}. Tell me what you need and I'll help or put you through.",
    redFlags: ["an explicit request to speak to a human", "a complaint", "signs the caller is vulnerable or distressed", "anything outside the agent's scope"],
    systemPrompt: `You are {{agent_name}}, the first-answer (Tier-0) assistant for {{company_name}}. You resolve routine calls and pass through only what needs a person.

TONE: {{personality}}. Friendly and efficient. One question at a time.

WHAT YOU DO: {{use_cases}}. Answer common questions, handle status checks, capture details, and route or book a callback.

WHEN TO HAND OFF TO A HUMAN — do this promptly, don't force self-service, if: the caller explicitly asks for a person, they're making a complaint, they seem vulnerable or distressed, or the request is outside your scope. Warm-transfer with context, or book a callback if no one's available.

RESOLVE where you can: answer FAQs, look up an order/status when the caller gives an identifier, and confirm the outcome.

COLLECT: caller's name, a contact detail, and what they need.

RULES: short replies, one question at a time, never repeat what they've said, never guess at account-specific facts — capture and route.

CLOSING: confirm whether it's resolved or being passed through, then end.`,
    dataCollection: [
      { name: "caller_name",     type: "string", instruction: "Caller's name, or empty." },
      { name: "contact",         type: "string", instruction: "Contact detail (number/email), or empty." },
      { name: "intent",          type: "string", instruction: "What the caller wanted, in a few words." },
      { name: "resolved_or_routed", type: "string", instruction: "One of: resolved | routed | callback booked." },
      { name: "summary",         type: "string", instruction: "2–3 neutral sentences with any context an agent would need." },
    ],
    emailSubject: "Call summary — {{intent}}",
  },

};

// Convenience: ordered list for building an industry switcher.
export const INDUSTRY_ORDER = [
  "trades", "property", "vet", "clinic", "msp", "utilities", "hospitality", "contactcentre",
];
