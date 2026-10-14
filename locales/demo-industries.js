// Demo page: industry copy in English and German. Dutch is the source in industry-configs.js.
// Each industry overlays the Dutch config BY POSITION (same array lengths and order), so the
// ElevenLabs setup scripts that read industry-configs.js are unaffected.
// Tokens like {{agent_name}} are left as is and filled by demo.html.

export const OVERLAYS = {
 "en": {
  "trades": {
   "label": "Trades & home services",
   "eyebrow": "See how a virtual phone assistant works for your business",
   "headline": "Create your own phone assistant in a few minutes.",
   "subheadline": "Enter your business details, choose the features and test the assistant yourself.",
   "pitch": "Create my demo — no installation needed. You test straight away with your own details.",
   "setupOptions": [
    "Emergencies and breakdowns",
    "Heating and boilers",
    "Electrical faults",
    "Leaks and plumbing",
    "Engineers and appointments",
    "Quotes and enquiries"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "I have no hot water and the boiler is making a ticking noise."
    },
    {
     "who": "agent",
     "text": "I can help you with that. First, a quick safety check — can you smell gas, or is water leaking anywhere right now?"
    }
   ],
   "useCases": [
    "Triage: urgent or not",
    "Boiler & heating faults",
    "Electrical faults",
    "Plumbing & leaks",
    "Booking an engineer",
    "Rescheduling appointments",
    "Quotes & price enquiries",
    "Out-of-hours availability",
    "First-line fault finding",
    "Transfer to the emergency service"
   ],
   "scenarios": [
    "No heating or hot water",
    "I have a leak",
    "A fuse keeps tripping",
    "I smell gas"
   ],
   "greeting": "Hello, you're speaking with the assistant of {{company_name}}. Tell me what's wrong and I'll look into it for you.",
   "redFlags": [
    "smell of gas",
    "carbon monoxide alarm going off",
    "active flooding or major leak",
    "burning smell or sparks from electrics",
    "exposed live wiring",
    "no heating for a vulnerable person in cold weather"
   ],
   "dataCollection": [
    {
     "name": "caller_name",
     "label": "Caller name"
    },
    {
     "name": "caller_phone",
     "label": "Phone number"
    },
    {
     "name": "address",
     "label": "Address"
    },
    {
     "name": "fault_type",
     "label": "Fault type"
    },
    {
     "name": "urgency",
     "label": "Urgency"
    },
    {
     "name": "troubleshooting_tried",
     "label": "Steps already tried"
    },
    {
     "name": "action",
     "label": "Action"
    },
    {
     "name": "summary",
     "label": "Summary"
    }
   ],
   "emailSubject": "Engineer callout request — {{fault}} at {{address}}"
  },
  "property": {
   "label": "Property management & housing associations",
   "eyebrow": "See how a virtual phone assistant works for your business",
   "headline": "Create your own phone assistant in a few minutes.",
   "subheadline": "Enter your business details, choose the features and test the assistant yourself.",
   "pitch": "Create my demo — no installation needed. You test straight away with your own details.",
   "setupOptions": [
    "Emergencies and breakdowns",
    "Water leaks",
    "Heating and hot water",
    "Electrical faults",
    "Repairs and reports",
    "Status and call transfer"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "Water is coming through my kitchen ceiling, from the flat above."
    },
    {
     "who": "agent",
     "text": "That sounds awful — let's deal with it right away. Is the water still coming in, and is it near any light fittings or electrics?"
    }
   ],
   "useCases": [
    "Out-of-hours repairs",
    "Triage: urgent or routine",
    "Water leaks & flooding",
    "Heating & hot water outages",
    "Electrical faults",
    "Lockouts",
    "Logging non-urgent repairs",
    "Status of open reports",
    "Issues in communal areas",
    "Forwarding to the on-call team"
   ],
   "scenarios": [
    "Water leak",
    "No heating",
    "I'm locked out",
    "Something urgent"
   ],
   "greeting": "Hello, you've reached the out-of-hours line of {{company_name}}. What is the problem, and which property is it about?",
   "redFlags": [
    "flooding near electrics",
    "no heating for a vulnerable tenant in winter",
    "smell of gas",
    "fire or smoke",
    "broken door or window / break-in",
    "someone trapped in a lift"
   ],
   "dataCollection": [
    {
     "name": "tenant_name",
     "label": "Tenant name"
    },
    {
     "name": "caller_phone",
     "label": "Phone number"
    },
    {
     "name": "property_address",
     "label": "Property address"
    },
    {
     "name": "issue_type",
     "label": "Issue type"
    },
    {
     "name": "urgency",
     "label": "Urgency"
    },
    {
     "name": "access_notes",
     "label": "Access notes"
    },
    {
     "name": "action",
     "label": "Action"
    },
    {
     "name": "summary",
     "label": "Summary"
    }
   ],
   "emailSubject": "Repair report — {{issue}} at {{property}}"
  },
  "vet": {
   "label": "Veterinary clinics",
   "eyebrow": "See how a virtual phone assistant works for your business",
   "headline": "Create your own phone assistant in a few minutes.",
   "subheadline": "Enter your practice details, choose the features and test the assistant yourself.",
   "pitch": "Create my demo — no installation needed. You test straight away with your own details.",
   "setupOptions": [
    "Booking and changing appointments",
    "Emergencies",
    "Opening hours and directions",
    "Medication and prescriptions",
    "Results and callback requests",
    "Treatments and general information"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "My dog has been limping since this morning."
    },
    {
     "who": "agent",
     "text": "I'm sorry to hear that. I'll ask you a few quick questions so the clinic knows what's going on. What's your dog's name?"
    }
   ],
   "useCases": [
    "Booking appointments",
    "Changing or cancelling",
    "Emergencies",
    "Opening hours",
    "Medication & repeat prescriptions",
    "Test results & callback requests",
    "Price enquiries",
    "Information about treatments",
    "Registering new pets",
    "Call transfer"
   ],
   "scenarios": [
    "My dog is limping",
    "Book an appointment",
    "I need more medication",
    "Possible emergency"
   ],
   "greeting": "Good afternoon, you're speaking with {{agent_name}}, the digital assistant of {{company_name}}. How can I help you today?",
   "redFlags": [
    "breathing difficulties",
    "collapse or unresponsiveness",
    "seizures",
    "suspected poisoning (chocolate, grapes, lilies, antifreeze, xylitol)",
    "severe trauma",
    "bloated or swollen abdomen",
    "repeated retching without producing anything",
    "heavy bleeding",
    "unable to urinate"
   ],
   "dataCollection": [
    {
     "name": "caller_name",
     "label": "Owner name"
    },
    {
     "name": "caller_phone",
     "label": "Phone number"
    },
    {
     "name": "animal_name",
     "label": "Pet name"
    },
    {
     "name": "animal_species",
     "label": "Species"
    },
    {
     "name": "reason",
     "label": "Reason"
    },
    {
     "name": "urgency",
     "label": "Urgency"
    },
    {
     "name": "action",
     "label": "Action"
    },
    {
     "name": "summary",
     "label": "Summary"
    }
   ],
   "emailSubject": "Call summary — {{animal_name}} ({{reason}})"
  },
  "clinic": {
   "label": "Dental & GP practices",
   "eyebrow": "See how a virtual phone assistant works for your business",
   "headline": "Create your own phone assistant in a few minutes.",
   "subheadline": "Enter your practice details, choose the features and test the assistant yourself.",
   "pitch": "Create my demo — no installation needed. You test straight away with your own details.",
   "setupOptions": [
    "Booking and changing appointments",
    "Emergencies and triage",
    "Prescriptions and repeat prescriptions",
    "Opening hours and directions",
    "Patient questions and registration",
    "Insurance and fees"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "I've had a tooth knocked out and it's bleeding."
    },
    {
     "who": "agent",
     "text": "I'm sorry, that sounds painful. To get you the right help quickly — did this happen within the last hour, and is it bleeding heavily?"
    }
   ],
   "useCases": [
    "Booking appointments",
    "Cancelling & rescheduling",
    "Out-of-hours triage",
    "Prescriptions & repeat requests",
    "Opening hours & directions",
    "Pre-appointment questions",
    "Registering new patients",
    "Insurance & fees",
    "Distinguishing urgent from routine",
    "Transfer to a clinician"
   ],
   "scenarios": [
    "Dental emergency",
    "Book an appointment",
    "Repeat prescription",
    "Urgent complaint"
   ],
   "greeting": "Good afternoon, you're speaking with {{company_name}}. How can I help — would you like to book an appointment, or is this something urgent?",
   "redFlags": [
    "chest pain",
    "breathing difficulties",
    "severe or uncontrollable bleeding",
    "swollen face affecting breathing or swallowing",
    "signs of a stroke (drooping face, arm weakness, slurred speech)",
    "severe allergic reaction",
    "high fever in a baby"
   ],
   "dataCollection": [
    {
     "name": "patient_name",
     "label": "Patient name"
    },
    {
     "name": "caller_phone",
     "label": "Phone number"
    },
    {
     "name": "reason",
     "label": "Reason"
    },
    {
     "name": "urgency",
     "label": "Urgency"
    },
    {
     "name": "requested_action",
     "label": "Requested action"
    },
    {
     "name": "action",
     "label": "Action"
    },
    {
     "name": "summary",
     "label": "Summary"
    }
   ],
   "emailSubject": "Front desk summary — {{patient_name}}"
  },
  "msp": {
   "label": "Hospitality & catering",
   "eyebrow": "See how a virtual phone assistant works for your organisation",
   "headline": "Create your own phone assistant in a few minutes.",
   "subheadline": "Enter your business details, choose the features and test the assistant yourself.",
   "pitch": "Create my demo — no installation needed. You test straight away with your own details.",
   "setupOptions": [
    "Troubleshooting issues",
    "Passwords and access",
    "Creating and following up tickets",
    "Outage reports",
    "Self-service and priority",
    "Transferring to an engineer"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "I can't get into my email, it keeps saying my password is incorrect."
    },
    {
     "who": "agent",
     "text": "Let's get you back in. Have you already tried the self-service reset link, or shall I walk you through it now?"
    }
   ],
   "useCases": [
    "First-line troubleshooting",
    "Help with passwords & lockouts",
    "Creating a ticket",
    "Checking ticket status",
    "Outage reports",
    "Guided self-service",
    "Setting priority",
    "Out-of-hours availability",
    "Routing to the right engineer",
    "Escalating P1 incidents"
   ],
   "scenarios": [
    "Locked out",
    "Email problem",
    "Something is down",
    "Major outage"
   ],
   "greeting": "Hello, you've reached support at {{company_name}}. Tell me what isn't working, and I'll either solve it or make sure it reaches an engineer.",
   "redFlags": [
    "complete outage of a site or service",
    "suspected security incident",
    "ransomware or malware",
    "data loss",
    "multiple users affected at once"
   ],
   "dataCollection": [
    {
     "name": "caller_name",
     "label": "Caller name"
    },
    {
     "name": "company",
     "label": "Company"
    },
    {
     "name": "contact",
     "label": "Contact details"
    },
    {
     "name": "issue",
     "label": "Issue"
    },
    {
     "name": "priority",
     "label": "Priority"
    },
    {
     "name": "steps_tried",
     "label": "Steps tried"
    },
    {
     "name": "action",
     "label": "Action"
    },
    {
     "name": "summary",
     "label": "Summary"
    }
   ],
   "emailSubject": "Ticket — {{issue}} ({{priority}})"
  },
  "utilities": {
   "label": "Utilities & energy",
   "eyebrow": "See how a virtual phone assistant works for your organisation",
   "headline": "Create your own phone assistant in a few minutes.",
   "subheadline": "Enter your business details, choose the features and test the assistant yourself.",
   "pitch": "Create my demo — no installation needed. You test straight away with your own details.",
   "setupOptions": [
    "Reporting and checking outages",
    "Meter readings and questions",
    "Billing",
    "Connecting and disconnecting supply",
    "Safety and emergencies",
    "Transferring to the fault line"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "My power has been out for about an hour, and so has my neighbours'."
    },
    {
     "who": "agent",
     "text": "Thank you for reporting this. First, a quick safety check — is anyone at your home currently relying on electrical medical equipment?"
    }
   ],
   "useCases": [
    "Reporting electricity/gas outages",
    "Checking outages",
    "Meter readings & questions",
    "Billing questions",
    "Register for vulnerable customers",
    "Triage of safety reports",
    "Connecting or disconnecting supply",
    "Distinguishing urgent from routine",
    "Handling busy periods",
    "Transferring to the fault line"
   ],
   "scenarios": [
    "Power outage",
    "Gas smell",
    "Submit a meter reading",
    "Report a fault"
   ],
   "greeting": "Hello, you've reached {{company_name}}. Are you calling to report a fault, or is it about a meter reading or an invoice?",
   "redFlags": [
    "smell of gas or a gas leak",
    "a downed power line",
    "sparking or burning equipment",
    "carbon monoxide",
    "a medically dependent customer without supply"
   ],
   "dataCollection": [
    {
     "name": "caller_name",
     "label": "Caller name"
    },
    {
     "name": "account_or_address",
     "label": "Customer number or address"
    },
    {
     "name": "issue_type",
     "label": "Type of report"
    },
    {
     "name": "urgency",
     "label": "Urgency"
    },
    {
     "name": "vulnerability_flag",
     "label": "Vulnerability indicator"
    },
    {
     "name": "action",
     "label": "Action"
    },
    {
     "name": "summary",
     "label": "Summary"
    }
   ],
   "emailSubject": "Fault/enquiry — {{issue}} at {{address}}"
  },
  "hospitality": {
   "label": "Hotels & accommodation",
   "eyebrow": "See how a virtual phone assistant works for your organisation",
   "headline": "Create your own phone assistant in a few minutes.",
   "subheadline": "Enter your business details, choose the features and test the assistant yourself.",
   "pitch": "Create my demo — no installation needed. You test straight away with your own details.",
   "setupOptions": [
    "Bookings and availability",
    "Room issues and maintenance",
    "Check-in and check-out",
    "Local information and directions",
    "Hotel facilities and requests",
    "Urgent matters and transfers"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "Hello, the heating in room 12 isn't working and it's freezing."
    },
    {
     "who": "agent",
     "text": "I'm sorry to hear that — let's get you warm. Would you like someone to come up right now, or shall I arrange an extra heater in the meantime?"
    }
   ],
   "useCases": [
    "Guest requests outside office hours",
    "Room issues & maintenance",
    "Check-in/check-out questions",
    "Local info & directions",
    "Bookings & availability",
    "Late arrival",
    "Wake-up calls & housekeeping",
    "Questions about the restaurant & facilities",
    "Escalating urgent matters",
    "Messages for the day team"
   ],
   "scenarios": [
    "Room problem",
    "Late check-in",
    "A quick question",
    "Something urgent"
   ],
   "greeting": "Good evening, you've reached the front desk at {{company_name}}. How can I help you?",
   "redFlags": [
    "fire, smoke or a sounding alarm",
    "a medical emergency",
    "a safety or security threat",
    "flooding or water damage",
    "a guest who is locked out with no access"
   ],
   "dataCollection": [
    {
     "name": "guest_name",
     "label": "Guest name"
    },
    {
     "name": "room",
     "label": "Room"
    },
    {
     "name": "request_type",
     "label": "Request type"
    },
    {
     "name": "urgency",
     "label": "Urgency"
    },
    {
     "name": "action",
     "label": "Action"
    },
    {
     "name": "summary",
     "label": "Summary"
    }
   ],
   "emailSubject": "Guest request — Room {{room}} ({{request}})"
  },
  "contactcentre": {
   "label": "Hair & beauty",
   "eyebrow": "See how a virtual phone assistant works for your organisation",
   "headline": "Create your own phone assistant in a few minutes.",
   "subheadline": "Enter your business details, choose the features and test the assistant yourself.",
   "pitch": "Create my demo — no installation needed. You test straight away with your own details.",
   "setupOptions": [
    "Frequently asked questions",
    "Orders and status",
    "Self-service",
    "Callback requests",
    "Peak times and priority",
    "Transferring to a team member"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "I'd like to know where my order is."
    },
    {
     "who": "agent",
     "text": "I can help you with that. Do you have your order number to hand, or the email address you used?"
    }
   ],
   "useCases": [
    "Tier-0 self-service",
    "Handling frequently asked questions",
    "Order & status checks",
    "Routing based on the enquiry",
    "Scheduling a callback",
    "Handling peak call volumes",
    "Out-of-hours availability",
    "Capturing details before transferring",
    "Setting priority",
    "Warm transfer to a team member"
   ],
   "scenarios": [
    "Order status",
    "A frequently asked question",
    "Schedule a callback",
    "Speak to someone"
   ],
   "greeting": "Hello, you've reached {{company_name}}. Tell me what I can help with, or I'll put you through.",
   "redFlags": [
    "an explicit request to speak to a person",
    "a complaint",
    "signs that the caller is vulnerable or upset",
    "anything outside the assistant's scope"
   ],
   "dataCollection": [
    {
     "name": "caller_name",
     "label": "Caller name"
    },
    {
     "name": "contact",
     "label": "Contact details"
    },
    {
     "name": "intent",
     "label": "Enquiry/purpose"
    },
    {
     "name": "resolved_or_routed",
     "label": "Resolved or transferred"
    },
    {
     "name": "summary",
     "label": "Summary"
    }
   ],
   "emailSubject": "Call summary — {{intent}}"
  },
  "__shared": {
   "perks": [
    "Ready in ~2 minutes",
    "No installation",
    "Personalised",
    "Test instantly"
   ],
   "personas": {
    "warm": {
     "title": "Warm & reassuring",
     "blurb": "Calm and supportive for stressed callers"
    },
    "professional": {
     "title": "Professional & clear",
     "blurb": "Efficient, concise and practical"
    },
    "personal": {
     "title": "Personal & informal",
     "blurb": "Friendly, like a colleague on the line"
    }
   }
  }
 },
 "de": {
  "trades": {
   "label": "Handwerk & Haushaltsservice",
   "eyebrow": "Erleben Sie, wie ein virtueller Telefonassistent für Ihr Unternehmen arbeitet",
   "headline": "Erstellen Sie in wenigen Minuten Ihren eigenen Telefonassistenten.",
   "subheadline": "Geben Sie Ihre Firmendaten ein, wählen Sie die Funktionen und testen Sie den Assistenten selbst.",
   "pitch": "Meine Demo erstellen — keine Installation nötig. Sie testen sofort mit Ihren eigenen Daten.",
   "setupOptions": [
    "Notfälle und Störungen",
    "Heizung und Heizkessel",
    "Elektrische Störungen",
    "Leckagen und Sanitär",
    "Monteure und Termine",
    "Angebote und Anfragen"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "Ich habe kein warmes Wasser und der Heizkessel macht ein tickendes Geräusch."
    },
    {
     "who": "agent",
     "text": "Dabei kann ich Ihnen helfen. Zuerst eine kurze Sicherheitsprüfung — riechen Sie Gas, oder tritt gerade irgendwo Wasser aus?"
    }
   ],
   "useCases": [
    "Triage: dringend oder nicht",
    "Störungen an Heizkessel & Heizung",
    "Elektrische Störungen",
    "Sanitär & Leckagen",
    "Einen Monteur einplanen",
    "Termin verschieben",
    "Angebote & Preisanfragen",
    "Erreichbarkeit außerhalb der Geschäftszeiten",
    "Erste Fehlersuche",
    "Weiterleitung an den Notdienst"
   ],
   "scenarios": [
    "Keine Heizung oder kein Warmwasser",
    "Ich habe ein Leck",
    "Eine Sicherung fliegt immer wieder raus",
    "Ich rieche Gas"
   ],
   "greeting": "Guten Tag, Sie sprechen mit dem Assistenten von {{company_name}}. Schildern Sie mir, was passiert ist, dann kümmere ich mich für Sie darum.",
   "redFlags": [
    "Gasgeruch",
    "ausgelöster Kohlenmonoxidmelder",
    "akute Überschwemmung oder großes Leck",
    "Brandgeruch oder Funken aus der Elektrik",
    "freiliegende, spannungsführende Leitungen",
    "keine Heizung bei einer schutzbedürftigen Person bei Kälte"
   ],
   "dataCollection": [
    {
     "name": "caller_name",
     "label": "Name des Anrufers"
    },
    {
     "name": "caller_phone",
     "label": "Telefonnummer"
    },
    {
     "name": "address",
     "label": "Adresse"
    },
    {
     "name": "fault_type",
     "label": "Art der Störung"
    },
    {
     "name": "urgency",
     "label": "Dringlichkeit"
    },
    {
     "name": "troubleshooting_tried",
     "label": "Bereits versuchte Schritte"
    },
    {
     "name": "action",
     "label": "Maßnahme"
    },
    {
     "name": "summary",
     "label": "Zusammenfassung"
    }
   ],
   "emailSubject": "Anfrage Störungsmonteur — {{fault}} in {{address}}"
  },
  "property": {
   "label": "Hausverwaltung & Wohnungsbaugesellschaften",
   "eyebrow": "Erleben Sie, wie ein virtueller Telefonassistent für Ihr Unternehmen arbeitet",
   "headline": "Erstellen Sie in wenigen Minuten Ihren eigenen Telefonassistenten.",
   "subheadline": "Geben Sie Ihre Firmendaten ein, wählen Sie die Funktionen und testen Sie den Assistenten selbst.",
   "pitch": "Meine Demo erstellen — keine Installation nötig. Sie testen sofort mit Ihren eigenen Daten.",
   "setupOptions": [
    "Notfälle und Störungen",
    "Wasserschäden",
    "Heizung und Warmwasser",
    "Elektrische Störungen",
    "Reparaturen und Meldungen",
    "Status und Weiterleitung"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "Durch meine Küchendecke kommt Wasser, aus der Wohnung darüber."
    },
    {
     "who": "agent",
     "text": "Das klingt unangenehm — kümmern wir uns sofort darum. Läuft das Wasser noch immer nach, und befindet es sich in der Nähe von Lampen oder Elektrik?"
    }
   ],
   "useCases": [
    "Reparaturen außerhalb der Geschäftszeiten",
    "Triage: dringend oder routinemäßig",
    "Wasserschäden & Überschwemmung",
    "Ausfall von Heizung & Warmwasser",
    "Elektrische Störungen",
    "Ausgesperrt",
    "Nicht dringende Reparaturen erfassen",
    "Status laufender Meldungen",
    "Probleme in Gemeinschaftsbereichen",
    "Weiterleitung an den Bereitschaftsdienst"
   ],
   "scenarios": [
    "Wasserschaden",
    "Keine Heizung",
    "Ich bin ausgesperrt",
    "Etwas Dringendes"
   ],
   "greeting": "Guten Tag, Sie sind mit der Bereitschaftslinie von {{company_name}} außerhalb der Geschäftszeiten verbunden. Was ist das Problem, und um welches Objekt geht es?",
   "redFlags": [
    "Überschwemmung in der Nähe von Elektrik",
    "keine Heizung bei einem schutzbedürftigen Mieter im Winter",
    "Gasgeruch",
    "Feuer oder Rauch",
    "defekte Tür oder defektes Fenster / Einbruch",
    "jemand sitzt im Aufzug fest"
   ],
   "dataCollection": [
    {
     "name": "tenant_name",
     "label": "Name des Mieters"
    },
    {
     "name": "caller_phone",
     "label": "Telefonnummer"
    },
    {
     "name": "property_address",
     "label": "Adresse des Objekts"
    },
    {
     "name": "issue_type",
     "label": "Art des Problems"
    },
    {
     "name": "urgency",
     "label": "Dringlichkeit"
    },
    {
     "name": "access_notes",
     "label": "Hinweise zum Zugang"
    },
    {
     "name": "action",
     "label": "Maßnahme"
    },
    {
     "name": "summary",
     "label": "Zusammenfassung"
    }
   ],
   "emailSubject": "Reparaturmeldung — {{issue}} in {{property}}"
  },
  "vet": {
   "label": "Tierkliniken",
   "eyebrow": "Erleben Sie, wie ein virtueller Telefonassistent für Ihr Unternehmen arbeitet",
   "headline": "Erstellen Sie in wenigen Minuten Ihren eigenen Telefonassistenten.",
   "subheadline": "Geben Sie Ihre Praxisdaten ein, wählen Sie die Funktionen und testen Sie den Assistenten selbst.",
   "pitch": "Meine Demo erstellen — keine Installation nötig. Sie testen sofort mit Ihren eigenen Daten.",
   "setupOptions": [
    "Termine vereinbaren und ändern",
    "Notfälle",
    "Öffnungszeiten und Anfahrt",
    "Medikamente und Rezepte",
    "Befunde und Rückrufwünsche",
    "Behandlungen und allgemeine Informationen"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "Mein Hund lahmt seit heute Morgen."
    },
    {
     "who": "agent",
     "text": "Das tut mir leid zu hören. Ich stelle Ihnen ein paar kurze Fragen, damit die Praxis weiß, worum es geht. Wie heißt Ihr Hund?"
    }
   ],
   "useCases": [
    "Termine einplanen",
    "Ändern oder stornieren",
    "Notfälle",
    "Öffnungszeiten",
    "Medikamente & Folgerezepte",
    "Laborergebnisse & Rückrufwünsche",
    "Preisanfragen",
    "Informationen zu Behandlungen",
    "Neue Tiere anmelden",
    "Weiterleiten"
   ],
   "scenarios": [
    "Mein Hund lahmt",
    "Einen Termin vereinbaren",
    "Ich brauche mehr Medikamente",
    "Möglicher Notfall"
   ],
   "greeting": "Guten Tag, Sie sprechen mit {{agent_name}}, dem digitalen Assistenten von {{company_name}}. Wie kann ich Ihnen heute helfen?",
   "redFlags": [
    "Atemprobleme",
    "Kollaps oder keine Reaktion",
    "Krampfanfälle",
    "Verdacht auf Vergiftung (Schokolade, Weintrauben, Lilien, Frostschutzmittel, Xylit)",
    "schweres Trauma",
    "aufgeblähter oder geschwollener Bauch",
    "wiederholtes erfolgloses Würgen",
    "starke Blutung",
    "Harn kann nicht abgesetzt werden"
   ],
   "dataCollection": [
    {
     "name": "caller_name",
     "label": "Name des Tierhalters"
    },
    {
     "name": "caller_phone",
     "label": "Telefonnummer"
    },
    {
     "name": "animal_name",
     "label": "Name des Tieres"
    },
    {
     "name": "animal_species",
     "label": "Tierart"
    },
    {
     "name": "reason",
     "label": "Grund"
    },
    {
     "name": "urgency",
     "label": "Dringlichkeit"
    },
    {
     "name": "action",
     "label": "Maßnahme"
    },
    {
     "name": "summary",
     "label": "Zusammenfassung"
    }
   ],
   "emailSubject": "Gesprächsübersicht — {{animal_name}} ({{reason}})"
  },
  "clinic": {
   "label": "Zahnarzt- & Hausarztpraxen",
   "eyebrow": "Erleben Sie, wie ein virtueller Telefonassistent für Ihr Unternehmen arbeitet",
   "headline": "Erstellen Sie in wenigen Minuten Ihren eigenen Telefonassistenten.",
   "subheadline": "Geben Sie Ihre Praxisdaten ein, wählen Sie die Funktionen und testen Sie den Assistenten selbst.",
   "pitch": "Meine Demo erstellen — keine Installation nötig. Sie testen sofort mit Ihren eigenen Daten.",
   "setupOptions": [
    "Termine vereinbaren und ändern",
    "Notfälle und Triage",
    "Rezepte und Folgerezepte",
    "Öffnungszeiten und Anfahrt",
    "Patientenfragen und Anmeldung",
    "Versicherung und Kosten"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "Mir wurde ein Zahn ausgeschlagen und er blutet."
    },
    {
     "who": "agent",
     "text": "Das tut mir leid, das klingt schmerzhaft. Damit Sie schnell die richtige Hilfe bekommen — ist das innerhalb der letzten Stunde passiert, und blutet es stark?"
    }
   ],
   "useCases": [
    "Termine einplanen",
    "Absagen & verschieben",
    "Triage außerhalb der Sprechzeiten",
    "Rezepte & Folgerezepte",
    "Öffnungszeiten & Wegbeschreibung",
    "Fragen vor einem Termin",
    "Neue Patienten anmelden",
    "Versicherung & Kosten",
    "Dringendes von Routine unterscheiden",
    "Weiterleitung an eine Fachkraft"
   ],
   "scenarios": [
    "Zahnärztlicher Notfall",
    "Einen Termin vereinbaren",
    "Folgerezept",
    "Dringende Beschwerde"
   ],
   "greeting": "Guten Tag, Sie sprechen mit {{company_name}}. Wie kann ich Ihnen helfen — möchten Sie einen Termin vereinbaren, oder ist es etwas Dringendes?",
   "redFlags": [
    "Brustschmerzen",
    "Atemprobleme",
    "schwere oder nicht stillbare Blutung",
    "geschwollenes Gesicht mit Auswirkung auf Atmen oder Schlucken",
    "Anzeichen eines Schlaganfalls (hängender Mundwinkel, Schwäche im Arm, undeutliche Sprache)",
    "schwere allergische Reaktion",
    "hohes Fieber bei einem Baby"
   ],
   "dataCollection": [
    {
     "name": "patient_name",
     "label": "Name des Patienten"
    },
    {
     "name": "caller_phone",
     "label": "Telefonnummer"
    },
    {
     "name": "reason",
     "label": "Grund"
    },
    {
     "name": "urgency",
     "label": "Dringlichkeit"
    },
    {
     "name": "requested_action",
     "label": "Gewünschte Maßnahme"
    },
    {
     "name": "action",
     "label": "Maßnahme"
    },
    {
     "name": "summary",
     "label": "Zusammenfassung"
    }
   ],
   "emailSubject": "Anmeldungszusammenfassung — {{patient_name}}"
  },
  "msp": {
   "label": "Gastronomie",
   "eyebrow": "Erfahren Sie, wie ein virtueller Telefonassistent für Ihr Unternehmen funktioniert",
   "headline": "Erstellen Sie Ihren Telefonassistenten in wenigen Minuten.",
   "subheadline": "Geben Sie Ihre Betriebsdaten ein, wählen Sie die Funktionen und testen Sie den Assistenten selbst.",
   "pitch": "Meine Demo erstellen — keine Installation nötig. Sie testen sofort mit Ihren eigenen Daten.",
   "setupOptions": [
    "Störungen beheben",
    "Passwörter und Zugriff",
    "Tickets erstellen und nachverfolgen",
    "Störungsmeldungen",
    "Self-Service und Priorität",
    "Weiterleiten an einen Techniker"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "Ich komme nicht in mein E-Mail-Postfach, es heißt immer, mein Passwort sei falsch."
    },
    {
     "who": "agent",
     "text": "Lassen Sie uns dafür sorgen, dass Sie wieder reinkommen. Haben Sie den Self-Service-Link zum Zurücksetzen schon probiert, oder gehe ich das jetzt mit Ihnen durch?"
    }
   ],
   "useCases": [
    "Fehlersuche im First-Level-Support",
    "Hilfe bei Passwörtern & Sperrungen",
    "Ein Ticket erstellen",
    "Ticketstatus abfragen",
    "Störungsmeldungen",
    "Geführter Self-Service",
    "Priorität festlegen",
    "Erreichbarkeit außerhalb der Geschäftszeiten",
    "Weiterleiten an den richtigen Techniker",
    "P1-Vorfälle eskalieren"
   ],
   "scenarios": [
    "Ausgesperrt",
    "E-Mail-Problem",
    "Etwas ist ausgefallen",
    "Großstörung"
   ],
   "greeting": "Hallo, Sie sprechen mit dem Support von {{company_name}}. Sagen Sie mir, was nicht funktioniert, dann löse ich es oder sorge dafür, dass es bei einem Techniker landet.",
   "redFlags": [
    "kompletter Ausfall einer Website oder eines Dienstes",
    "Verdacht auf einen Sicherheitsvorfall",
    "Ransomware oder Malware",
    "Datenverlust",
    "mehrere Nutzer gleichzeitig betroffen"
   ],
   "dataCollection": [
    {
     "name": "caller_name",
     "label": "Name des Anrufers"
    },
    {
     "name": "company",
     "label": "Unternehmen"
    },
    {
     "name": "contact",
     "label": "Kontaktdaten"
    },
    {
     "name": "issue",
     "label": "Problem"
    },
    {
     "name": "priority",
     "label": "Priorität"
    },
    {
     "name": "steps_tried",
     "label": "Bereits versuchte Schritte"
    },
    {
     "name": "action",
     "label": "Maßnahme"
    },
    {
     "name": "summary",
     "label": "Zusammenfassung"
    }
   ],
   "emailSubject": "Ticket — {{issue}} ({{priority}})"
  },
  "utilities": {
   "label": "Versorger & Energie",
   "eyebrow": "Erfahren Sie, wie ein virtueller Telefonassistent für Ihr Unternehmen funktioniert",
   "headline": "Erstellen Sie Ihren Telefonassistenten in wenigen Minuten.",
   "subheadline": "Geben Sie Ihre Betriebsdaten ein, wählen Sie die Funktionen und testen Sie den Assistenten selbst.",
   "pitch": "Meine Demo erstellen — keine Installation nötig. Sie testen sofort mit Ihren eigenen Daten.",
   "setupOptions": [
    "Störungen melden und prüfen",
    "Zählerstände und Fragen",
    "Abrechnung",
    "Anschluss an- und abmelden",
    "Sicherheit und Notfälle",
    "Weiterleiten an die Störungsstelle"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "Mein Strom ist seit etwa einer Stunde ausgefallen, bei den Nachbarn auch."
    },
    {
     "who": "agent",
     "text": "Danke für Ihre Meldung. Zuerst eine kurze Sicherheitsabfrage — ist bei Ihnen zu Hause gerade jemand auf elektrische medizinische Geräte angewiesen?"
    }
   ],
   "useCases": [
    "Strom-/Gasstörungen melden",
    "Störungen prüfen",
    "Zählerstände & Fragen",
    "Fragen zur Abrechnung",
    "Verzeichnis schutzbedürftiger Kunden",
    "Ersteinschätzung von Sicherheitsmeldungen",
    "Anschluss an- oder abmelden",
    "Dringendes von Routine unterscheiden",
    "Auffangen bei hohem Anrufaufkommen",
    "Weiterleiten an die Störungsstelle"
   ],
   "scenarios": [
    "Stromausfall",
    "Gasgeruch",
    "Zählerstand melden",
    "Eine Störung melden"
   ],
   "greeting": "Hallo, Sie sprechen mit {{company_name}}. Rufen Sie an, um eine Störung zu melden, oder geht es um einen Zählerstand oder eine Rechnung?",
   "redFlags": [
    "Gasgeruch oder Gasleck",
    "eine heruntergefallene Stromleitung",
    "funkende oder brennende Geräte",
    "Kohlenmonoxid",
    "ein medizinisch abhängiger Kunde ohne Versorgung"
   ],
   "dataCollection": [
    {
     "name": "caller_name",
     "label": "Name des Anrufers"
    },
    {
     "name": "account_or_address",
     "label": "Kundennummer oder Adresse"
    },
    {
     "name": "issue_type",
     "label": "Art der Meldung"
    },
    {
     "name": "urgency",
     "label": "Dringlichkeit"
    },
    {
     "name": "vulnerability_flag",
     "label": "Hinweis auf Schutzbedürftigkeit"
    },
    {
     "name": "action",
     "label": "Maßnahme"
    },
    {
     "name": "summary",
     "label": "Zusammenfassung"
    }
   ],
   "emailSubject": "Störung/Anfrage — {{issue}} an {{address}}"
  },
  "hospitality": {
   "label": "Hotels & Unterkünfte",
   "eyebrow": "Erfahren Sie, wie ein virtueller Telefonassistent für Ihr Unternehmen funktioniert",
   "headline": "Erstellen Sie Ihren Telefonassistenten in wenigen Minuten.",
   "subheadline": "Geben Sie Ihre Betriebsdaten ein, wählen Sie die Funktionen und testen Sie den Assistenten selbst.",
   "pitch": "Meine Demo erstellen — keine Installation nötig. Sie testen sofort mit Ihren eigenen Daten.",
   "setupOptions": [
    "Buchungen und Verfügbarkeit",
    "Zimmerprobleme und Wartung",
    "Ein- und Auschecken",
    "Lokale Informationen und Anfahrt",
    "Hotelleistungen und Wünsche",
    "Dringende Anliegen und Weiterleiten"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "Hallo, die Heizung in Zimmer 12 funktioniert nicht und es ist eiskalt."
    },
    {
     "who": "agent",
     "text": "Das tut mir leid — sorgen wir dafür, dass es bei Ihnen warm wird. Soll sofort jemand vorbeikommen, oder bringen wir vorab ein zusätzliches Heizgerät?"
    }
   ],
   "useCases": [
    "Gästewünsche außerhalb der Geschäftszeiten",
    "Zimmerprobleme & Wartung",
    "Fragen zum Ein-/Auschecken",
    "Lokale Infos & Wegbeschreibung",
    "Buchungen & Verfügbarkeit",
    "Späte Anreise",
    "Weckdienst & Housekeeping",
    "Fragen zu Restaurant & Einrichtungen",
    "Dringende Anliegen eskalieren",
    "Nachrichten für das Tagesteam"
   ],
   "scenarios": [
    "Problem mit dem Zimmer",
    "Später Check-in",
    "Eine kurze Frage",
    "Etwas Dringendes"
   ],
   "greeting": "Guten Abend, Sie sprechen mit der Rezeption von {{company_name}}. Wie kann ich Ihnen helfen?",
   "redFlags": [
    "Feuer, Rauch oder ein ausgelöster Alarm",
    "ein medizinischer Notfall",
    "eine Bedrohung der Sicherheit",
    "Wasserschaden",
    "ein ausgesperrter Gast ohne Zugang"
   ],
   "dataCollection": [
    {
     "name": "guest_name",
     "label": "Name des Gastes"
    },
    {
     "name": "room",
     "label": "Zimmer"
    },
    {
     "name": "request_type",
     "label": "Art des Anliegens"
    },
    {
     "name": "urgency",
     "label": "Dringlichkeit"
    },
    {
     "name": "action",
     "label": "Maßnahme"
    },
    {
     "name": "summary",
     "label": "Zusammenfassung"
    }
   ],
   "emailSubject": "Gästeanliegen — Zimmer {{room}} ({{request}})"
  },
  "contactcentre": {
   "label": "Friseur & Kosmetik",
   "eyebrow": "Erfahren Sie, wie ein virtueller Telefonassistent für Ihr Unternehmen funktioniert",
   "headline": "Erstellen Sie Ihren Telefonassistenten in wenigen Minuten.",
   "subheadline": "Geben Sie Ihre Betriebsdaten ein, wählen Sie die Funktionen und testen Sie den Assistenten selbst.",
   "pitch": "Meine Demo erstellen — keine Installation nötig. Sie testen sofort mit Ihren eigenen Daten.",
   "setupOptions": [
    "Häufige Fragen",
    "Bestellungen und Status",
    "Self-Service",
    "Rückrufwünsche",
    "Stoßzeiten und Priorität",
    "Weiterleiten an einen Mitarbeiter"
   ],
   "sampleConversation": [
    {
     "who": "caller",
     "text": "Ich möchte gern wissen, wo meine Bestellung bleibt."
    },
    {
     "who": "agent",
     "text": "Dabei helfe ich Ihnen gern. Haben Sie Ihre Bestellnummer zur Hand, oder die E-Mail-Adresse, die Sie verwendet haben?"
    }
   ],
   "useCases": [
    "Tier-0-Self-Service",
    "Häufige Fragen beantworten",
    "Bestell- & Statusabfrage",
    "Weiterleiten je nach Anliegen",
    "Rückruf vereinbaren",
    "Auffangen bei Stoßzeiten",
    "Erreichbarkeit außerhalb der Geschäftszeiten",
    "Daten erfassen vor dem Weiterleiten",
    "Priorität festlegen",
    "Warm weiterleiten an einen Mitarbeiter"
   ],
   "scenarios": [
    "Bestellstatus",
    "Eine häufige Frage",
    "Rückruf vereinbaren",
    "Mit jemandem sprechen"
   ],
   "greeting": "Hallo, Sie sprechen mit {{company_name}}. Sagen Sie mir, wobei ich helfen kann, oder ich verbinde Sie weiter.",
   "redFlags": [
    "ausdrücklicher Wunsch, mit einem Menschen zu sprechen",
    "eine Beschwerde",
    "Anzeichen, dass der Anrufer schutzbedürftig oder aufgebracht ist",
    "etwas außerhalb des Aufgabenbereichs des Assistenten"
   ],
   "dataCollection": [
    {
     "name": "caller_name",
     "label": "Name des Anrufers"
    },
    {
     "name": "contact",
     "label": "Kontaktdaten"
    },
    {
     "name": "intent",
     "label": "Anliegen/Ziel"
    },
    {
     "name": "resolved_or_routed",
     "label": "Erledigt oder weitergeleitet"
    },
    {
     "name": "summary",
     "label": "Zusammenfassung"
    }
   ],
   "emailSubject": "Gesprächsübersicht — {{intent}}"
  },
  "__shared": {
   "perks": [
    "In ca. 2 Minuten fertig",
    "Keine Installation",
    "Personalisiert",
    "Sofort testen"
   ],
   "personas": {
    "warm": {
     "title": "Warm & beruhigend",
     "blurb": "Ruhig und unterstützend für gestresste Anrufer"
    },
    "professional": {
     "title": "Professionell & klar",
     "blurb": "Effizient, prägnant und praktisch"
    },
    "personal": {
     "title": "Persönlich & locker",
     "blurb": "Freundlich, wie ein Kollege am Apparat"
    }
   }
  }
 }
};

/** Returns a copy of the Dutch industry config with the chosen language laid over it. */
export function localizeIndustry(base, lang) {
  if (!base || lang === 'nl') return base;
  const o = OVERLAYS[lang] && OVERLAYS[lang][base.id];
  const shared = OVERLAYS[lang] && OVERLAYS[lang].__shared;
  if (!o) return base;
  const out = Object.assign({}, base);
  ['label', 'eyebrow', 'headline', 'subheadline', 'pitch', 'greeting', 'emailSubject'].forEach((k) => { if (o[k]) out[k] = o[k]; });
  if (o.setupOptions) out.setupOptions = o.setupOptions.slice();
  if (o.redFlags) out.redFlags = o.redFlags.slice();
  if (o.sampleConversation) out.sampleConversation = base.sampleConversation.map((t, i) => Object.assign({}, t, { text: o.sampleConversation[i].text }));
  if (o.useCases) out.useCases = base.useCases.map((u, i) => Object.assign({}, u, { label: o.useCases[i] }));
  if (o.scenarios) out.scenarios = base.scenarios.map((s, i) => Object.assign({}, s, { label: o.scenarios[i] }));
  if (o.dataCollection) {
    const byName = {};
    o.dataCollection.forEach((d) => { byName[d.name] = d.label; });
    out.dataCollection = base.dataCollection.map((d) => Object.assign({}, d, byName[d.name] ? { label: byName[d.name] } : {}));
  }
  if (shared) {
    out.perks = shared.perks.slice();
    out.personas = (base.personas || []).map((p) => Object.assign({}, p, shared.personas[p.id] || {}));
  }
  return out;
}
