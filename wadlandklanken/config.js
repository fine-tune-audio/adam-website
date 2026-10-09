/* Wadlandklanken · geofence-test — configuratie
   Alles wat je tijdens het finetunen wilt aanpassen staat hier. Waarden in de
   app-instellingen (tandwiel-tab) overschrijven radius/marges per toestel en
   worden lokaal onthouden; "Standaardwaarden" zet ze terug naar dit bestand. */
window.WK_CONFIG = {
  siteId: 'wadland-test-01',
  siteName: 'Geofence-test',
  siteRadiusM: 600,          // verder dan dit van het midden = "niet ter plaatse" -> statisch (in Auto)

  audioBase: 'audio/',       // bestanden in wadlandklanken/audio/ ; ontbreekt een bestand -> synth-placeholder
  crossfadeMs: 4000,         // overgang tussen interactief <-> statisch

  /* Drie zones, drie verschillende triggers */
  zones: [
    {
      id: 'z1', name: 'Zone 1', color: '#c8f23c',
      lat: 53.178361, lon: 6.604462, radiusM: 20,
      mode: 'LOOP',            // loop zolang je binnen bent, fade in/uit
      asset: 'zone1.mp3', synth: 'pad',
      gain: 0.8, fadeInMs: 3000, fadeOutMs: 5000
    },
    {
      id: 'z2', name: 'Zone 2', color: '#5db8ff',
      lat: 53.177641, lon: 6.604340, radiusM: 20,
      mode: 'DISTANCE_GAIN',   // loop, volume groeit naarmate je dichter bij het midden komt
      asset: 'zone2.mp3', synth: 'chirps',
      gain: 0.9, minGain: 0.08, nearM: 4, curve: 1.6,
      fadeInMs: 2000, fadeOutMs: 4000
    },
    {
      id: 'z3', name: 'Zone 3', color: '#ff9f43',
      lat: 53.177153, lon: 6.604706, radiusM: 20,
      mode: 'ONE_SHOT',        // speelt één keer bij binnenkomst; opnieuw na echte exit + cooldown
      asset: 'zone3.mp3', synth: 'bell',
      gain: 0.85, cooldownMs: 60000, oncePerSession: false
    }
  ],

  /* Statische fallback (niveau 1): speelt als geofencing niet (betrouwbaar) werkt */
  static: { asset: 'static.mp3', synth: 'static', gain: 0.8,
            loopFadeMs: 1500 },  // korte fade-in/-out bij elke herhaling (in de audio gebakken: werkt ook bij vergrendeld scherm/iOS)

  geo: {
    goodAccuracyM: 20,       // <= dit: niveau 3 (interactief)
    maxAccuracyM: 50,        // <= dit: niveau 2 (beperkt); daarboven niveau 1 en geen nieuwe triggers
    staleS: 15,              // ouder dan dit zonder nieuwe positie: niveau 1
    exitMarginM: 10,         // hysterese: verlaten pas bij radius + marge (zones liggen ~60-80 m uit elkaar)
    dwellMs: 1500,           // zo lang binnen de radius voordat 'enter' telt
    upgradeDelayMs: 2500,    // zo lang moet een beter niveau stabiel zijn voordat we omhoog schakelen
    gapWarnS: 10,            // log een waarschuwing bij een gat zonder positie langer dan dit
    approxWarnM: 150,        // fixes slechter dan dit wijzen vaak op 'ongeveer-locatie'
    firstFixTimeoutS: 25
  },

  sim: { accM: 5 }           // nauwkeurigheid van de gesimuleerde positie
};
