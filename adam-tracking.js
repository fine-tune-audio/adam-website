// adam-tracking.js — cookieless event tracking + funnel accumulation for ADAM
(function () {
  var CONSENT_KEY = 'adam_consent_analytics';

  // ---- Analytics loader, gated on consent (GoatCounter, cookieless) ----
  function loadAnalytics() {
    if (document.getElementById('adam-gc')) return;
    var s = document.createElement('script');
    s.id = 'adam-gc';
    s.async = true;
    // TODO: replace MYCODE with your GoatCounter code
    s.setAttribute('data-goatcounter', 'https://MYCODE.goatcounter.com/count');
    s.src = '//gc.zgo.at/count.js';
    document.head.appendChild(s);
  }
  if (localStorage.getItem(CONSENT_KEY) === 'granted') loadAnalytics();
  window.adamGrantAnalytics = function () {
    localStorage.setItem(CONSENT_KEY, 'granted'); loadAnalytics();
  };
  window.adamDenyAnalytics = function () {
    localStorage.setItem(CONSENT_KEY, 'denied');
  };

  // ---- Count an event (safe if analytics not loaded / denied) ----
  window.adamTrack = function (name, extra) {
    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: name, title: name, event: true });
      }
    } catch (e) {}
    try {
      var log = JSON.parse(sessionStorage.getItem('adam_funnel_log') || '[]');
      log.push({ event: name, at: new Date().toISOString(), extra: extra || null });
      sessionStorage.setItem('adam_funnel_log', JSON.stringify(log));
    } catch (e) {}
  };

  // ---- Accumulate the visitor's answers across the funnel (functional) ----
  window.adamFunnelGet = function () {
    try { return JSON.parse(sessionStorage.getItem('adam_funnel') || '{}'); }
    catch (e) { return {}; }
  };
  window.adamFunnelSet = function (patch) {
    var d = window.adamFunnelGet();
    Object.assign(d, patch);
    sessionStorage.setItem('adam_funnel', JSON.stringify(d));
    return d;
  };

  // ---- On load: capture ?industry= and basic origin info ----
  try {
    var p = new URLSearchParams(location.search);
    if (p.get('industry')) window.adamFunnelSet({ industry: p.get('industry') });
    window.adamFunnelSet({
      page_url: location.href,
      referrer: document.referrer || null,
      started_at: window.adamFunnelGet().started_at || new Date().toISOString()
    });
  } catch (e) {}
})();

// ---- Final funnel step: submit the lead-capture panel to n8n ----
window.adamSubmitLead = async function () {
  var consent = document.getElementById('adam-consent-lead');
  if (!consent || !consent.checked) {
    alert('Vink het toestemmingsvakje aan om verder te gaan.');
    return;
  }
  var notesEl = document.getElementById('adam-notes');
  var notes = notesEl ? notesEl.value.trim() : '';

  var f = window.adamFunnelGet();
  var email = f.company_email || '';
  var log = [];
  try { log = JSON.parse(sessionStorage.getItem('adam_funnel_log') || '[]'); } catch (e) {}

  var payload = {
    event: 'demo_lead_submitted',
    submitted_at: new Date().toISOString(),
    industry: f.industry || null,
    service_selected: f.service_selected || null,
    company: {
      name: f.company_name || null,
      website: f.company_website || null,
      contact_name: f.contact_name || null,
      email: f.company_email || null
    },
    assistant_config: {
      tasks: f.tasks || [],
      voice: f.voice || null,
      greeting: f.greeting || null
    },
    call_report: f.call_report || null,
    estimate: {
      calls_per_day: f.estimate_calls || null,
      pain_points: f.estimate_pains || []
    },
    contact_request: {
      email: email,
      notes: notes,
      consent: true,
      consent_text: consent.getAttribute('data-consent-text') || '',
      consent_at: new Date().toISOString()
    },
    meta: {
      page_url: f.page_url || location.href,
      referrer: f.referrer || null,
      started_at: f.started_at || null,
      funnel_log: log
    }
  };

  var WEBHOOK_URL = 'https://finetuneaudio.app.n8n.cloud/webhook/adam-demo-lead';
  var btn = document.getElementById('adam-lead-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Versturen...'; }
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'cors',
      keepalive: true
    });
  } catch (e) {
    console.error('Lead submit failed', e);
  }
  window.adamTrack('demo_lead_submitted');
  window.adamShowThankYou && window.adamShowThankYou();
};
