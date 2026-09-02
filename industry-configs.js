/**
 * industry-configs.js
 * ------------------------------------------------------------------
 * Drop-in content for the demo we already built (vet-demo.html + the
 * ElevenLabs setup). The page and the agent stay identical — only the
 * CONTENT changes per industry.
 *
 * Default language is Dutch (matching the rest of the site). All
 * user-facing strings below are Dutch. `systemPrompt` bodies are kept
 * in English (agent-internal instructions only, never rendered) with
 * a short Dutch-language directive appended — LLMs converse reliably
 * in the target language from an English meta-instruction, so the
 * whole ~3,200-word instruction set doesn't need hand-translating.
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

// Appended to every systemPrompt below so the agent always replies in
// Dutch, regardless of the caller's own phrasing or the fact that these
// instructions themselves are written in English.
const DUTCH_LANGUAGE_DIRECTIVE = `

LANGUAGE: Conduct this entire conversation in Dutch (Nederlands). The caller speaks Dutch — always reply in Dutch, regardless of the language these instructions are written in. Keep names, addresses and numbers as the caller states them.`;

// Shared across every industry — the tone options are the same everywhere.
const PERSONAS = [
  { id: "warm",         icon: "🤗", title: "Warm & geruststellend",     blurb: "Kalm en ondersteunend voor gestreste bellers" },
  { id: "professional", icon: "👔", title: "Professioneel & duidelijk", blurb: "Efficiënt, bondig en praktisch" },
  { id: "personal",     icon: "😊", title: "Persoonlijk & informeel",   blurb: "Vriendelijk, als een collega aan de lijn" },
];

const PERKS = ["Klaar in ~2 minuten", "Geen installatie", "Gepersonaliseerd", "Direct testen"];

export const INDUSTRIES = {

  /* ══════════════════════════════════════════════════════════════
     TRADES & HOME SERVICES  — the "Blauvolt" shape
     ══════════════════════════════════════════════════════════════ */
  trades: {
    id: "trades",
    label: "Vakmensen & Huisservice",
    emoji: "🔧",
    eyebrow: "AI-telefoonassistent voor vakmensen & huisservice",
    headline: "Laat uw storingsdienst niet meer wakker bellen voor een doorgeslagen stop.",
    subheadline: "Een AI-assistent beantwoordt elk gesprek, onderscheidt een echte noodsituatie van werk dat kan wachten, en stuurt uw team hoe dan ook een heldere samenvatting.",
    pitch: "Laat uw storingsdienst niet meer wakker bellen voor een doorgeslagen stop.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Alex",
    sampleConversation: [
      { who: "caller", text: "Ik heb geen warm water en de ketel maakt een tikkend geluid." },
      { who: "agent",  text: "Daar kan ik u mee helpen. Eerst een korte veiligheidscheck — ruikt u gas, of lekt er op dit moment ergens water?" },
    ],
    useCases: [
      { emoji: "🚨", label: "Triage: spoed of niet" },
      { emoji: "🔥", label: "Storingen aan cv-ketel & verwarming" },
      { emoji: "⚡", label: "Elektrische storingen" },
      { emoji: "💧", label: "Loodgieterswerk & lekkages" },
      { emoji: "📅", label: "Een monteur inplannen" },
      { emoji: "🔄", label: "Afspraak verzetten" },
      { emoji: "💰", label: "Offertes & prijsvragen" },
      { emoji: "🌙", label: "Bereikbaarheid buiten kantooruren" },
      { emoji: "🛠", label: "Eerstelijns storingzoeken" },
      { emoji: "📞", label: "Doorverbinden met storingsdienst" },
    ],
    scenarios: [
      { emoji: "🔥", label: "Geen verwarming of warm water" },
      { emoji: "💧", label: "Ik heb een lekkage" },
      { emoji: "⚡", label: "Een stop slaat steeds door" },
      { emoji: "🚨", label: "Ik ruik gas" },
    ],
    greeting: "Hallo, u spreekt met de assistent van {{company_name}}. Vertel me wat er aan de hand is, dan zoek ik het voor u uit.",
    redFlags: ["gaslucht", "koolmonoxidemelder die afgaat", "actieve overstroming of grote lekkage", "brandlucht of vonken uit elektra", "blootliggende bedrading onder spanning", "geen verwarming voor een kwetsbaar persoon bij koud weer"],
    systemPrompt: `You are {{agent_name}}, the phone assistant for {{company_name}}, a trades and home-services company. You answer calls so the team isn't interrupted for things that can wait.

TONE: {{personality}}. Be brief and practical — this is spoken aloud. Ask ONE question at a time.

WHAT YOU DO: {{use_cases}}. Your job is to (1) catch genuine emergencies and escalate them, (2) try the obvious first-line fix for routine faults, and (3) log everything else for a callback.

SAFETY FIRST — before anything else, screen for: smell of gas, carbon-monoxide alarms, active flooding, burning smells or sparking, exposed live wiring, or a vulnerable person with no heat in the cold. If any are present, tell the caller clearly this is urgent, give the immediate safety step if obvious (e.g. for gas: don't touch switches, ventilate, leave the property), and offer to connect them to the on-call engineer or emergency line right away. Do not attempt troubleshooting on a safety issue.

FIRST-LINE TROUBLESHOOTING for routine faults only — walk them through the simple checks a good dispatcher would (is the fuse tripped and can they reset it, is the boiler pressure low, is the stopcock accessible). If that fixes it, great. If not, book a callout.

COLLECT: caller's name, callback number, the address, the nature of the fault, and whether it's urgent.

RULES: keep replies short, one question at a time, never repeat what they've told you, never quote a firm price — say the team will confirm. Confirm name, number and address once before ending.

CLOSING: confirm what happens next (someone will call back, or an engineer is on the way), then end warmly.${DUTCH_LANGUAGE_DIRECTIVE}`,
    dataCollection: [
      { name: "caller_name",         label: "Naam beller",              type: "string", instruction: "The caller's name, or empty if not given." },
      { name: "caller_phone",        label: "Telefoonnummer",           type: "string", instruction: "Callback number, or empty." },
      { name: "address",             label: "Adres",                    type: "string", instruction: "The job address, or empty." },
      { name: "fault_type",          label: "Type storing",             type: "string", instruction: "The reported fault in a few words (e.g. no hot water, tripping fuse)." },
      { name: "urgency",             label: "Urgentie",                 type: "string", instruction: "One of: emergency | routine. 'emergency' only for gas, CO, flooding, sparking/burning electrics, or vulnerable-person no-heat." },
      { name: "troubleshooting_tried", label: "Al geprobeerde stappen", type: "string", instruction: "Any first-line steps attempted and the result, or empty." },
      { name: "action",              label: "Actie",                    type: "string", instruction: "Outcome: engineer dispatched / callout booked / callback requested / resolved on call." },
      { name: "summary",             label: "Samenvatting",             type: "string", instruction: "2–3 neutral sentences, written in Dutch. No firm pricing or diagnosis of cause." },
    ],
    emailSubject: "Aanvraag storingsmonteur — {{fault}} op {{address}}",
  },

  /* ══════════════════════════════════════════════════════════════
     PROPERTY MANAGEMENT & HOUSING ASSOCIATIONS
     ══════════════════════════════════════════════════════════════ */
  property: {
    id: "property",
    label: "Vastgoedbeheer & Woningcorporaties",
    emoji: "🏢",
    eyebrow: "AI-telefoonassistent voor vastgoedbeheer",
    headline: "Huurders voeren om 3 uur 's nachts een echt gesprek. Uw team leest de e-mail om 9 uur.",
    subheadline: "Een AI-assistent neemt dag en nacht onderhoudsmeldingen aan, handelt echte noodgevallen af en legt de rest vast voor de volgende ochtend.",
    pitch: "Uw huurders voeren om 3 uur 's nachts een echt gesprek, uw team leest de e-mail om 9 uur.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Sam",
    sampleConversation: [
      { who: "caller", text: "Er komt water door mijn keukenplafond, vanuit de flat erboven." },
      { who: "agent",  text: "Dat klinkt vervelend — laten we dat meteen oppakken. Komt het water nog steeds naar binnen, en zit dit in de buurt van lichtpunten of elektra?" },
    ],
    useCases: [
      { emoji: "🌙", label: "Reparaties buiten kantooruren" },
      { emoji: "🚨", label: "Triage: spoed of routine" },
      { emoji: "💧", label: "Waterlekkages & overstroming" },
      { emoji: "🔥", label: "Uitval van verwarming & warm water" },
      { emoji: "⚡", label: "Elektrische storingen" },
      { emoji: "🔑", label: "Buitengesloten" },
      { emoji: "📋", label: "Niet-urgente reparaties registreren" },
      { emoji: "🔄", label: "Status van lopende meldingen" },
      { emoji: "🏗", label: "Problemen in gemeenschappelijke ruimtes" },
      { emoji: "📞", label: "Doorschakelen naar de wachtdienst" },
    ],
    scenarios: [
      { emoji: "💧", label: "Waterlekkage" },
      { emoji: "🔥", label: "Geen verwarming" },
      { emoji: "🔑", label: "Ik ben buitengesloten" },
      { emoji: "🚨", label: "Iets urgents" },
    ],
    greeting: "Hallo, u spreekt met de bereikbaarheidslijn buiten kantooruren van {{company_name}}. Wat is het probleem, en om welk pand gaat het?",
    redFlags: ["overstroming in de buurt van elektra", "geen verwarming voor een kwetsbare huurder in de winter", "gaslucht", "brand of rook", "kapotte deur of raam / inbraak", "iemand die vastzit in een lift"],
    systemPrompt: `You are {{agent_name}}, the out-of-hours assistant for {{company_name}}, a property management / housing organisation. You take tenant calls so the team only gets pulled in for genuine emergencies.

TONE: {{personality}}. Reassuring and clear. One question at a time.

WHAT YOU DO: {{use_cases}}. Classify every report by urgency and either escalate it now or log it for the next working day.

EMERGENCY (health, safety or security) — flooding near electrics, gas smell, fire/smoke, no heat for a vulnerable tenant in cold weather, a security breach (broken entry), or someone trapped in a lift. If present: give the immediate safety step if obvious, tell the tenant it's being treated as urgent, and escalate to the on-call contractor or emergency services. For a gas smell: don't touch switches, ventilate, leave, and call the emergency gas line.

ROUTINE — anything not health/safety/security (a dripping tap, a broken cupboard, non-urgent heating in mild weather). Log it clearly for the morning; set expectations that the team will follow up in working hours.

COLLECT: tenant name, callback number, property address / unit, the issue, and any access notes.

RULES: short replies, one question at a time, never repeat what they've said, never promise a specific engineer arrival time — say the team or contractor will confirm.

CLOSING: confirm whether it's been escalated now or logged for the morning, then end warmly.${DUTCH_LANGUAGE_DIRECTIVE}`,
    dataCollection: [
      { name: "tenant_name",     label: "Naam huurder",      type: "string", instruction: "Tenant's name, or empty." },
      { name: "caller_phone",    label: "Telefoonnummer",    type: "string", instruction: "Callback number, or empty." },
      { name: "property_address",label: "Adres pand",        type: "string", instruction: "Property address / unit, or empty." },
      { name: "issue_type",      label: "Type probleem",     type: "string", instruction: "The reported issue in a few words." },
      { name: "urgency",         label: "Urgentie",          type: "string", instruction: "One of: emergency | routine, per the health/safety/security test." },
      { name: "access_notes",    label: "Toegangsnotities",  type: "string", instruction: "Any access details (key safe, availability), or empty." },
      { name: "action",          label: "Actie",             type: "string", instruction: "Outcome: contractor dispatched / logged for working hours / callback requested." },
      { name: "summary",         label: "Samenvatting",      type: "string", instruction: "2–3 neutral sentences, written in Dutch." },
    ],
    emailSubject: "Reparatiemelding — {{issue}} op {{property}}",
  },

  /* ══════════════════════════════════════════════════════════════
     VETERINARY  — the original, generalized to shared variables
     ══════════════════════════════════════════════════════════════ */
  vet: {
    id: "vet",
    label: "Dierenklinieken",
    emoji: "🐾",
    eyebrow: "AI-telefoonassistent voor dierenartspraktijken",
    headline: "Noodgevallen krijgen binnen 30 seconden een mens aan de lijn. Alle andere bellers krijgen een terugbelafspraak.",
    subheadline: "Een AI-assistent beantwoordt elk gesprek, onderscheidt echte noodgevallen van reguliere afspraken en stuurt uw team een heldere samenvatting.",
    pitch: "Noodgevallen krijgen binnen 30 seconden een mens aan de lijn. Alle andere bellers krijgen een terugbelafspraak.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Emma",
    sampleConversation: [
      { who: "caller", text: "Mijn hond loopt sinds vanochtend mank." },
      { who: "agent",  text: "Wat vervelend om te horen. Ik stel u een paar korte vragen zodat de praktijk weet wat er aan de hand is. Hoe heet uw hond?" },
    ],
    useCases: [
      { emoji: "📅", label: "Afspraken inplannen" },
      { emoji: "🔄", label: "Wijzigen of annuleren" },
      { emoji: "🚨", label: "Spoedgevallen" },
      { emoji: "🕐", label: "Openingstijden" },
      { emoji: "💊", label: "Medicatie & herhaalrecepten" },
      { emoji: "📋", label: "Testuitslagen & terugbelverzoeken" },
      { emoji: "💰", label: "Prijsvragen" },
      { emoji: "🩺", label: "Informatie over behandelingen" },
      { emoji: "🐾", label: "Nieuwe dieren aanmelden" },
      { emoji: "📞", label: "Doorverbinden" },
    ],
    scenarios: [
      { emoji: "🐶", label: "Mijn hond loopt mank" },
      { emoji: "🐱", label: "Een afspraak maken" },
      { emoji: "💊", label: "Ik heb meer medicatie nodig" },
      { emoji: "🚨", label: "Mogelijk spoedgeval" },
    ],
    greeting: "Goedemiddag, u spreekt met {{agent_name}}, de digitale assistent van {{company_name}}. Waarmee kan ik u vandaag helpen?",
    redFlags: ["ademhalingsproblemen", "instorten of niet reageren", "toevallen", "vermoeden van vergiftiging (chocolade, druiven, lelies, antivries, xylitol)", "ernstig trauma", "opgezette of gezwollen buik", "herhaaldelijk kokhalzen zonder resultaat", "hevige bloeding", "niet kunnen plassen"],
    systemPrompt: `You are {{agent_name}}, the digital phone assistant for {{company_name}}, a veterinary practice. You answer incoming calls so the team has fewer phone interruptions.

TONE: {{personality}}. Speak naturally and briefly, the way a warm receptionist would. Ask ONE question at a time.

WHAT YOU HELP WITH: {{use_cases}}. Typical tasks: booking, changing or cancelling appointments; opening hours; medication and repeat-prescription requests; test-result callback requests; general practice questions; and offering to connect the caller to a human.

INFORMATION TO COLLECT, naturally: the owner's name, a callback number, the pet's name, the species, the reason for calling, and what they'd like to happen.

EMERGENCY HANDLING — SAFETY CRITICAL. Watch for: difficulty breathing, collapse, seizures, suspected poisoning (chocolate, grapes/raisins, lilies, antifreeze, xylitol, medication), major trauma, a bloated/distended abdomen, repeated unproductive retching, heavy bleeding, or inability to urinate. If suspected: keep questions brief, tell the caller clearly it may be urgent, and escalate immediately — offer to connect them to the practice now or direct them to the emergency line. NEVER give a diagnosis. NEVER give treatment or medication advice. NEVER tell someone to wait when signs are serious. You are not a replacement for a veterinarian.

RULES: short replies, one question at a time, never repeat what they've given, never invent hours/prices/medical facts — say the team will follow up. Confirm name, number and pet name once before ending.

CLOSING: confirm what happens next, thank them warmly, and end.${DUTCH_LANGUAGE_DIRECTIVE}`,
    dataCollection: [
      { name: "caller_name",   label: "Naam eigenaar",  type: "string", instruction: "Owner's name, or empty." },
      { name: "caller_phone",  label: "Telefoonnummer", type: "string", instruction: "Callback number, or empty." },
      { name: "animal_name",   label: "Naam dier",      type: "string", instruction: "Pet's name, or empty." },
      { name: "animal_species",label: "Diersoort",      type: "string", instruction: "Species (dog, cat, etc.), or empty." },
      { name: "reason",        label: "Reden",          type: "string", instruction: "Reason for calling, one sentence." },
      { name: "urgency",       label: "Urgentie",       type: "string", instruction: "One of: normal | urgent. 'urgent' only for genuine red flags." },
      { name: "action",        label: "Actie",          type: "string", instruction: "Outcome: appointment booked / callback requested / info given / transferred." },
      { name: "summary",       label: "Samenvatting",   type: "string", instruction: "2–3 neutral sentences, written in Dutch. Never state a diagnosis or treatment." },
    ],
    emailSubject: "Gespreksoverzicht — {{animal_name}} ({{reason}})",
  },

  /* ══════════════════════════════════════════════════════════════
     DENTAL & MEDICAL PRACTICES  — sensitive: strict no-diagnosis
     ══════════════════════════════════════════════════════════════ */
  clinic: {
    id: "clinic",
    label: "Tandarts- & Huisartsenpraktijken",
    emoji: "🩺",
    eyebrow: "AI-telefoonassistent voor tandarts- & huisartsenpraktijken",
    headline: "Spoedgevallen bereiken direct een zorgverlener. Reguliere afspraken worden ingepland — zonder de balie te bezetten.",
    subheadline: "Een AI-assistent regelt afspraken, triage buiten kantooruren en standaardvragen, zodat de balie niet de hele ochtend aan de telefoon zit.",
    pitch: "Spoedgevallen bereiken direct een zorgverlener. Reguliere afspraken worden ingepland — zonder ook maar één minuut wachtmuziek.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Olivia",
    sampleConversation: [
      { who: "caller", text: "Ik heb een tand eruit geslagen en hij bloedt." },
      { who: "agent",  text: "Wat vervelend, dat klinkt pijnlijk. Om u snel de juiste hulp te bieden — is dit in het afgelopen uur gebeurd, en bloedt het hevig?" },
    ],
    useCases: [
      { emoji: "📅", label: "Afspraken inplannen" },
      { emoji: "🔄", label: "Annuleren & verzetten" },
      { emoji: "🚨", label: "Triage buiten kantooruren" },
      { emoji: "💊", label: "Recepten & herhaalaanvragen" },
      { emoji: "🕐", label: "Openingstijden & routebeschrijving" },
      { emoji: "❓", label: "Vragen voorafgaand aan een afspraak" },
      { emoji: "🧾", label: "Nieuwe patiënten inschrijven" },
      { emoji: "💰", label: "Verzekering & tarieven" },
      { emoji: "⚖️", label: "Onderscheid spoed en routine" },
      { emoji: "📞", label: "Doorverbinden met een zorgverlener" },
    ],
    scenarios: [
      { emoji: "🦷", label: "Tandheelkundig spoedgeval" },
      { emoji: "📅", label: "Een afspraak maken" },
      { emoji: "💊", label: "Herhaalrecept" },
      { emoji: "🚨", label: "Urgente klacht" },
    ],
    greeting: "Goedemiddag, u spreekt met {{company_name}}. Waarmee kan ik u helpen — wilt u een afspraak maken, of is dit iets urgents?",
    redFlags: ["pijn op de borst", "ademhalingsproblemen", "ernstige of onbeheersbare bloeding", "gezwollen gezicht met invloed op ademhalen of slikken", "tekenen van een beroerte (scheve mond, zwakte in de arm, onduidelijke spraak)", "ernstige allergische reactie", "hoge koorts bij een baby"],
    systemPrompt: `You are {{agent_name}}, the phone assistant for {{company_name}}, a dental / medical practice. You handle booking and routine questions and safely route anything urgent.

TONE: {{personality}}. Calm, professional, reassuring. One question at a time.

WHAT YOU DO: {{use_cases}}. Book, reschedule, take prescription requests, answer practice logistics, and sort urgent from routine.

SAFETY — CRITICAL. You are NOT a clinician. You must NEVER diagnose, NEVER give medical or treatment advice, and NEVER interpret symptoms. Your only job on a symptom call is to recognise red flags and route.
- If you hear signs of a medical emergency — chest pain, difficulty breathing, severe bleeding, facial swelling affecting breathing/swallowing, stroke signs, severe allergic reaction, or a high fever in an infant — tell the caller clearly to contact emergency services immediately (or your local emergency number), and offer to connect them to the on-call clinician. Do not delay them with questions.
- For non-emergency symptoms, do not assess them — book an appropriate appointment or take a message for a clinician to call back.

COLLECT, minimally and respectfully: patient name, a callback number, and the reason for the call at a high level. Do not gather more sensitive detail than needed.

RULES: short replies, one question at a time, never repeat what they've said, never quote clinical or pricing specifics you're unsure of — say the team will confirm.

CLOSING: confirm whether it's booked, escalated, or a callback, then end warmly.${DUTCH_LANGUAGE_DIRECTIVE}`,
    dataCollection: [
      { name: "patient_name",  label: "Naam patiënt",     type: "string", instruction: "Patient's name, or empty." },
      { name: "caller_phone",  label: "Telefoonnummer",   type: "string", instruction: "Callback number, or empty." },
      { name: "reason",        label: "Reden",            type: "string", instruction: "High-level reason for the call, one sentence. Do not record detailed clinical information." },
      { name: "urgency",       label: "Urgentie",         type: "string", instruction: "One of: emergency | urgent | routine. 'emergency' for red-flag symptoms routed to emergency services." },
      { name: "requested_action", label: "Gevraagde actie", type: "string", instruction: "What the caller wanted: appointment / prescription / question / callback." },
      { name: "action",        label: "Actie",            type: "string", instruction: "Outcome: booked / routed to emergency services / callback requested / info given." },
      { name: "summary",       label: "Samenvatting",     type: "string", instruction: "2–3 neutral sentences, written in Dutch. Never contains a diagnosis or clinical advice." },
    ],
    emailSubject: "Baliesamenvatting — {{patient_name}}",
  },

  /* ══════════════════════════════════════════════════════════════
     IT MANAGED SERVICE PROVIDERS
     ══════════════════════════════════════════════════════════════ */
  msp: {
    id: "msp",
    label: "IT-Dienstverleners",
    emoji: "💻",
    eyebrow: "AI-telefoonassistent voor IT-dienstverleners",
    headline: "Eerstelijns helpdesk die de eenvoudige meldingen oplost en de rest escaleert.",
    subheadline: "Een AI-assistent beantwoordt helpdeskgesprekken, begeleidt gebruikers bij voor de hand liggende oplossingen en maakt een compleet ticket aan met alles wat uw engineers nodig hebben.",
    pitch: "Los de wachtwoordresets zelf op. Escaleer de storingen. Elk gesprek wordt een ticket.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Jordan",
    sampleConversation: [
      { who: "caller", text: "Ik kom niet in mijn e-mail, er staat steeds dat mijn wachtwoord onjuist is." },
      { who: "agent",  text: "Laten we u er weer in krijgen. Heeft u de zelfservice-resetlink al geprobeerd, of loop ik het nu met u door?" },
    ],
    useCases: [
      { emoji: "🛠", label: "Eerstelijns storingzoeken" },
      { emoji: "🔒", label: "Hulp bij wachtwoorden & uitsluiting" },
      { emoji: "🎫", label: "Een ticket aanmaken" },
      { emoji: "🔍", label: "Status van tickets opvragen" },
      { emoji: "🌐", label: "Storingsmeldingen" },
      { emoji: "🧭", label: "Begeleide zelfservice" },
      { emoji: "⚖️", label: "Prioriteit bepalen" },
      { emoji: "🌙", label: "Bereikbaarheid buiten kantooruren" },
      { emoji: "🔀", label: "Doorsturen naar de juiste engineer" },
      { emoji: "🚨", label: "P1-incidenten escaleren" },
    ],
    scenarios: [
      { emoji: "🔒", label: "Buitengesloten" },
      { emoji: "📧", label: "Probleem met e-mail" },
      { emoji: "🌐", label: "Iets ligt eruit" },
      { emoji: "🚨", label: "Grote storing" },
    ],
    greeting: "Hallo, u spreekt met de support van {{company_name}}. Vertel me wat er niet werkt, dan los ik het op of zorg ik dat het bij een engineer terechtkomt.",
    redFlags: ["volledige storing van site of dienst", "vermoeden van een beveiligingsincident", "ransomware of malware", "gegevensverlies", "meerdere gebruikers tegelijk getroffen"],
    systemPrompt: `You are {{agent_name}}, the first-line (Tier-0) helpdesk assistant for {{company_name}}, an IT managed-service provider. You resolve simple issues and escalate real incidents.

TONE: {{personality}}. Friendly and competent. One question at a time, plain language — no jargon unless the caller uses it.

WHAT YOU DO: {{use_cases}}. Attempt guided self-service first, then raise a well-formed ticket, and escalate priority incidents.

PRIORITY / ESCALATION — treat as P1 and escalate to the on-call engineer immediately: a full site/service outage, a suspected security breach, ransomware/malware, data loss, or multiple users affected at once. Don't troubleshoot a P1 — capture the essentials and hand it off.

FIRST-LINE SELF-SERVICE for single-user routine issues: walk them through the obvious fixes (password self-service reset, restart the machine/app, check the connection or cable, confirm they're on the right network). If it's resolved, note it. If not, raise a ticket.

COLLECT: caller's name, their company/site, a callback number or email, the device/app affected, the issue, and any steps already tried.

CLASSIFY each ticket P1–P4 and route to the right queue.

RULES: short replies, one question at a time, never repeat what they've told you, never guess at root cause on air — log the symptoms.

CLOSING: confirm whether it's resolved, ticketed, or escalated, give the ticket reference if created, then end.${DUTCH_LANGUAGE_DIRECTIVE}`,
    dataCollection: [
      { name: "caller_name",  label: "Naam beller",           type: "string", instruction: "Caller's name, or empty." },
      { name: "company",      label: "Bedrijf",                type: "string", instruction: "Their company / site, or empty." },
      { name: "contact",      label: "Contactgegevens",        type: "string", instruction: "Callback number or email, or empty." },
      { name: "issue",        label: "Probleem",               type: "string", instruction: "The reported issue in a few words." },
      { name: "priority",     label: "Prioriteit",             type: "string", instruction: "One of: P1 | P2 | P3 | P4, per the escalation rules." },
      { name: "steps_tried",  label: "Geprobeerde stappen",    type: "string", instruction: "Self-service steps attempted and results, or empty." },
      { name: "action",       label: "Actie",                  type: "string", instruction: "Outcome: resolved on call / ticket raised / escalated to on-call." },
      { name: "summary",      label: "Samenvatting",           type: "string", instruction: "2–3 neutral sentences of symptoms and status, written in Dutch." },
    ],
    emailSubject: "Ticket — {{issue}} ({{priority}})",
  },

  /* ══════════════════════════════════════════════════════════════
     UTILITIES & ENERGY RETAILERS
     ══════════════════════════════════════════════════════════════ */
  utilities: {
    id: "utilities",
    label: "Nutsbedrijven & Energie",
    emoji: "⚡",
    eyebrow: "AI-telefoonassistent voor nutsbedrijven & energie",
    headline: "Direct opgenomen, elke dag van het jaar.",
    subheadline: "Een AI-assistent neemt storingsmeldingen en meterstandvragen aan bij elk volume, signaleert veiligheidsproblemen direct en legt de rest vast voor uw team.",
    pitch: "Uw telefoon wordt direct opgenomen, in meerdere talen, elke dag van het jaar.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Riley",
    sampleConversation: [
      { who: "caller", text: "Mijn stroom is al zo'n uur uitgevallen en bij de buren ook." },
      { who: "agent",  text: "Bedankt dat u dit meldt. Eerst een korte veiligheidscheck — is er bij u thuis op dit moment iemand afhankelijk van elektrische medische apparatuur?" },
    ],
    useCases: [
      { emoji: "⚡", label: "Storingen in stroom/gas melden" },
      { emoji: "🔍", label: "Storingen controleren" },
      { emoji: "🔢", label: "Meterstanden & vragen" },
      { emoji: "💰", label: "Facturatievragen" },
      { emoji: "🧑‍🦽", label: "Register voor kwetsbare klanten" },
      { emoji: "🚨", label: "Triage van veiligheidsmeldingen" },
      { emoji: "📦", label: "Aan- of afmelden aansluiting" },
      { emoji: "⚖️", label: "Onderscheid spoed en routine" },
      { emoji: "📈", label: "Opvang bij drukte" },
      { emoji: "📞", label: "Doorverbinden met de storingslijn" },
    ],
    scenarios: [
      { emoji: "⚡", label: "Stroomstoring" },
      { emoji: "🔥", label: "Gaslucht" },
      { emoji: "🔢", label: "Meterstand doorgeven" },
      { emoji: "💡", label: "Een storing melden" },
    ],
    greeting: "Hallo, u spreekt met {{company_name}}. Belt u om een storing te melden, of gaat het om een meterstand of factuur?",
    redFlags: ["gaslucht of gaslek", "een omlaaggevallen stroomkabel", "vonkende of brandende apparatuur", "koolmonoxide", "een medisch afhankelijke klant zonder aansluiting"],
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

CLOSING: confirm whether it's escalated as a safety issue or logged, then end.${DUTCH_LANGUAGE_DIRECTIVE}`,
    dataCollection: [
      { name: "caller_name",       label: "Naam beller",              type: "string", instruction: "Caller's name, or empty." },
      { name: "account_or_address",label: "Klantnummer of adres",     type: "string", instruction: "Account number, MPAN, or address, or empty." },
      { name: "issue_type",        label: "Type melding",             type: "string", instruction: "Fault / outage / meter reading / billing, plus a few words." },
      { name: "urgency",           label: "Urgentie",                 type: "string", instruction: "One of: emergency | routine. 'emergency' for gas, downed line, sparking, CO, or medically-dependent off supply." },
      { name: "vulnerability_flag",label: "Kwetsbaarheidsindicatie",  type: "string", instruction: "Any additional-needs / priority-services detail, or empty." },
      { name: "action",            label: "Actie",                    type: "string", instruction: "Outcome: escalated to emergency line / fault logged / reading recorded / query logged." },
      { name: "summary",           label: "Samenvatting",             type: "string", instruction: "2–3 neutral sentences, written in Dutch." },
    ],
    emailSubject: "Storing/vraag — {{issue}} op {{address}}",
  },

  /* ══════════════════════════════════════════════════════════════
     HOTELS, B&Bs, HOLIDAY RENTALS
     ══════════════════════════════════════════════════════════════ */
  hospitality: {
    id: "hospitality",
    label: "Hotels & Verblijfsaccommodaties",
    emoji: "🏨",
    eyebrow: "AI-telefoonassistent voor hotels & verblijfsaccommodaties",
    headline: "Een receptie die 24/7 bereikbaar is, voor minder dan de kosten van één dienst.",
    subheadline: "Een AI-assistent behandelt gastgesprekken dag en nacht — verzoeken, vragen en het incidentele probleem om 2 uur 's nachts — en levert uw team een overzichtelijk logboek.",
    pitch: "Een receptie die 24/7 bereikbaar is, voor minder dan de kosten van één dienst.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Charlie",
    sampleConversation: [
      { who: "caller", text: "Hallo, de verwarming op kamer 12 doet het niet en het is ijskoud." },
      { who: "agent",  text: "Wat vervelend — laten we zorgen dat u het warm krijgt. Wilt u dat er nu iemand langskomt, of alvast een extra kacheltje?" },
    ],
    useCases: [
      { emoji: "🌙", label: "Gastverzoeken buiten kantooruren" },
      { emoji: "🛏", label: "Kamerproblemen & onderhoud" },
      { emoji: "🔑", label: "Vragen over in-/uitchecken" },
      { emoji: "🗺", label: "Lokale info & routebeschrijving" },
      { emoji: "📅", label: "Boekingen & beschikbaarheid" },
      { emoji: "🚪", label: "Late aankomst" },
      { emoji: "⏰", label: "Wekdienst & housekeeping" },
      { emoji: "🍽", label: "Vragen over restaurant & voorzieningen" },
      { emoji: "🚨", label: "Urgente zaken escaleren" },
      { emoji: "📝", label: "Berichten voor het dagteam" },
    ],
    scenarios: [
      { emoji: "🛏", label: "Probleem met kamer" },
      { emoji: "🔑", label: "Laat inchecken" },
      { emoji: "❓", label: "Een korte vraag" },
      { emoji: "🚨", label: "Iets urgents" },
    ],
    greeting: "Goedenavond, u spreekt met de receptie van {{company_name}}. Waarmee kan ik u helpen?",
    redFlags: ["brand, rook of een afgaand alarm", "een medisch noodgeval", "een dreiging voor veiligheid of beveiliging", "wateroverlast", "een gast die buitengesloten is zonder toegang"],
    systemPrompt: `You are {{agent_name}}, the night-desk assistant for {{company_name}}, a hotel / short-stay property. You look after guests around the clock and keep a clean log for the day team.

TONE: {{personality}}. Warm, hospitable, unflappable. One question at a time.

WHAT YOU DO: {{use_cases}}. Handle requests and questions, take messages for the morning, and escalate genuine emergencies.

EMERGENCY — fire, smoke or an alarm, a medical emergency, a security/safety threat, flooding, or a guest locked out with no access. Escalate to the duty manager immediately, and for fire or a medical emergency direct the guest to emergency services. Don't delay them.

ROUTINE — room issues (offer an immediate option where you can, like a heater or extra bedding, plus a maintenance note), check-in/out and local questions, late arrivals, and amenity queries. For anything that needs the day team, take a clear message.

COLLECT: guest name, room number, and the request.

RULES: short, warm replies, one question at a time, never repeat what they've said, never invent policies or prices — say the team will confirm.

CLOSING: confirm what you've arranged or escalated, then wish them a good stay.${DUTCH_LANGUAGE_DIRECTIVE}`,
    dataCollection: [
      { name: "guest_name",   label: "Naam gast",       type: "string", instruction: "Guest's name, or empty." },
      { name: "room",         label: "Kamer",           type: "string", instruction: "Room number, or empty." },
      { name: "request_type", label: "Type verzoek",    type: "string", instruction: "The request or question in a few words." },
      { name: "urgency",      label: "Urgentie",        type: "string", instruction: "One of: emergency | routine." },
      { name: "action",       label: "Actie",           type: "string", instruction: "Outcome: resolved / maintenance logged / message for day team / escalated to duty manager." },
      { name: "summary",      label: "Samenvatting",    type: "string", instruction: "2–3 neutral sentences, written in Dutch." },
    ],
    emailSubject: "Gastverzoek — Kamer {{room}} ({{request}})",
  },

  /* ══════════════════════════════════════════════════════════════
     SMALL CONTACT CENTRES  — generic Tier-0 deflection
     ══════════════════════════════════════════════════════════════ */
  contactcentre: {
    id: "contactcentre",
    label: "Klantcontactcentra (Tier-0)",
    emoji: "🎧",
    eyebrow: "AI Tier-0-assistent voor klantcontactcentra",
    headline: "Vang 30–60% van de gesprekken op voordat ze in de wachtrij komen.",
    subheadline: "Een AI-assistent neemt als eerste op, handelt routinevragen af en verbindt alleen door wat écht een mens nodig heeft.",
    pitch: "Een Tier-0-stap die 30–60% van de gesprekken opvangt voordat ze de wachtrij bereiken.",
    perks: PERKS,
    personas: PERSONAS,
    defaultAgentName: "Robin",
    sampleConversation: [
      { who: "caller", text: "Ik wil graag weten waar mijn bestelling blijft." },
      { who: "agent",  text: "Daar kan ik u mee helpen. Heeft u uw bestelnummer bij de hand, of het e-mailadres dat u heeft gebruikt?" },
    ],
    useCases: [
      { emoji: "🧭", label: "Tier-0 zelfservice" },
      { emoji: "❓", label: "Veelgestelde vragen afhandelen" },
      { emoji: "📦", label: "Bestel- & statuscontrole" },
      { emoji: "🔀", label: "Doorverbinden op basis van vraag" },
      { emoji: "📅", label: "Terugbelverzoek inplannen" },
      { emoji: "📈", label: "Opvang bij piekdrukte" },
      { emoji: "🌙", label: "Bereikbaarheid buiten kantooruren" },
      { emoji: "🗂", label: "Gegevens vastleggen vóór doorverbinden" },
      { emoji: "⚖️", label: "Prioriteit bepalen" },
      { emoji: "👤", label: "Warm doorverbinden naar een medewerker" },
    ],
    scenarios: [
      { emoji: "📦", label: "Status bestelling" },
      { emoji: "❓", label: "Een veelgestelde vraag" },
      { emoji: "📅", label: "Terugbelverzoek plannen" },
      { emoji: "👤", label: "Met iemand spreken" },
    ],
    greeting: "Hallo, u spreekt met {{company_name}}. Vertel me waarmee ik kan helpen, of ik verbind u door.",
    redFlags: ["een expliciet verzoek om met een mens te spreken", "een klacht", "signalen dat de beller kwetsbaar of overstuur is", "iets buiten het bereik van de assistent"],
    systemPrompt: `You are {{agent_name}}, the first-answer (Tier-0) assistant for {{company_name}}. You resolve routine calls and pass through only what needs a person.

TONE: {{personality}}. Friendly and efficient. One question at a time.

WHAT YOU DO: {{use_cases}}. Answer common questions, handle status checks, capture details, and route or book a callback.

WHEN TO HAND OFF TO A HUMAN — do this promptly, don't force self-service, if: the caller explicitly asks for a person, they're making a complaint, they seem vulnerable or distressed, or the request is outside your scope. Warm-transfer with context, or book a callback if no one's available.

RESOLVE where you can: answer FAQs, look up an order/status when the caller gives an identifier, and confirm the outcome.

COLLECT: caller's name, a contact detail, and what they need.

RULES: short replies, one question at a time, never repeat what they've said, never guess at account-specific facts — capture and route.

CLOSING: confirm whether it's resolved or being passed through, then end.${DUTCH_LANGUAGE_DIRECTIVE}`,
    dataCollection: [
      { name: "caller_name",     label: "Naam beller",              type: "string", instruction: "Caller's name, or empty." },
      { name: "contact",         label: "Contactgegevens",          type: "string", instruction: "Contact detail (number/email), or empty." },
      { name: "intent",          label: "Vraag/doel",               type: "string", instruction: "What the caller wanted, in a few words." },
      { name: "resolved_or_routed", label: "Afgehandeld of doorverbonden", type: "string", instruction: "One of: resolved | routed | callback booked." },
      { name: "summary",         label: "Samenvatting",             type: "string", instruction: "2–3 neutral sentences with any context an agent would need, written in Dutch." },
    ],
    emailSubject: "Gespreksoverzicht — {{intent}}",
  },

};

// Convenience: ordered list for building an industry switcher.
export const INDUSTRY_ORDER = [
  "trades", "property", "vet", "clinic", "msp", "utilities", "hospitality", "contactcentre",
];
