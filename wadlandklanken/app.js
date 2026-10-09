/* Wadlandklanken · geofence-test
   Losstaande testpagina op basis van het Stadsstemmen-framework (MapLibre-kaart,
   haversine-geofence met hysterese, dwell en nauwkeurigheidsfilter).
   Anders dan Stadsstemmen stopt deze test de GPS NIET als het scherm uitgaat:
   we willen juist meten wat het toestel dan doet. Alles blijft lokaal; het log
   staat in localStorage tot je het exporteert of wist. */
(function(){
'use strict';
const APP_VERSION='v5 · 9 okt 2026';   // ophogen bij elke wijziging; staat in beeld zodat je ziet welke versie draait
const CFG=window.WK_CONFIG, ZONES=CFG.zones;
const $=s=>document.querySelector(s);
const now=()=>Date.now();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pad=n=>String(n).padStart(2,'0');
function haversine(la1,lo1,la2,lo2){ const R=6371e3,t=Math.PI/180; const dLa=(la2-la1)*t,dLo=(lo2-lo1)*t; const a=Math.sin(dLa/2)**2+Math.cos(la1*t)*Math.cos(la2*t)*Math.sin(dLo/2)**2; return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); }
function fmtClock(t){ const d=new Date(t); return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds()); }
function fmtDur(ms){ if(ms==null||!isFinite(ms)) return '–'; const s=Math.round(ms/1000); if(s<60) return s+' s'; const m=Math.floor(s/60); if(m<60) return m+':'+pad(s%60)+' min'; return Math.floor(m/60)+'u '+pad(m%60)+'m'; }
function fmtM(m){ return m==null||!isFinite(m)?'–':(m>=1000?(m/1000).toFixed(1)+' km':Math.round(m)+' m'); }
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function store(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); return true; }catch(_){ return false; } }
function load(k,d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(_){ return d; } }
const SITE=(()=>{ let la=0,lo=0; ZONES.forEach(z=>{la+=z.lat;lo+=z.lon;}); return {lat:la/ZONES.length,lon:lo/ZONES.length}; })();
const MODE_LABEL={LOOP:'Loop + fade',DISTANCE_GAIN:'Afstandsvolume',ONE_SHOT:'One-shot'};
const LEVEL_TITLE={0:'Niet gestart',1:'Statisch',2:'Beperkt interactief',3:'Interactief'};

/* ===== instellingen ===== */
const DEF={ mode:'auto', source:'gps', onHidden:'keep', staticPlayer:'element', wakeLock:true,
  goodAccM:CFG.geo.goodAccuracyM, maxAccM:CFG.geo.maxAccuracyM, staleS:CFG.geo.staleS,
  exitMarginM:CFG.geo.exitMarginM, dwellMs:CFG.geo.dwellMs, master:0.9,
  radius:Object.fromEntries(ZONES.map(z=>[z.id,z.radiusM])) };
/* Zodra config.js andere zones/drempels krijgt, vervallen de lokaal bewaarde GPS-/radiuswaarden; voorkeuren (modus, speler, volume) blijven. */
const CFG_SIG=JSON.stringify([ZONES.map(z=>[z.id,z.lat,z.lon,z.radiusM]),CFG.geo]);
const SAVED=load('wk_settings',{});
if(SAVED.cfgSig!==CFG_SIG){ ['goodAccM','maxAccM','staleS','exitMarginM','dwellMs','radius'].forEach(k=>delete SAVED[k]); }
const S=Object.assign({},DEF,SAVED); delete S.cfgSig;
S.radius=Object.assign({},DEF.radius,S.radius||{});
const saveS=()=>store('wk_settings',Object.assign({cfgSig:CFG_SIG},S));

/* ===== toestand ===== */
let running=false, paused=false, level=0, levelWhy='Tik op Start', levelSince=now(), upSince=null;
const levelTime={1:0,2:0,3:0};
let startedAt=null, watchId=null, lastFix=null, firstFixAt=null, geoDenied=false, fixTimeout=null;
let simPos=null, approxStreak=0, approxWarned=false;
const stats={fixes:0,accSum:0,gaps:0,sleeps:0,sleepMs:0,enters:{}};
const ZS={}; ZONES.forEach(z=>{ ZS[z.id]={inside:false,cand:null,dist:null,enteredAt:null,enters:0,lastShot:0,shots:0,playing:false,dgain:0}; stats.enters[z.id]=0; });
let wakeLock=null, battery=null, sleep=null, sleepTestArmed=false;

/* ===== log ===== */
const LOG_KEY='wk_log_v1', LOG_MAX=12000;
const CAT={gps:'GPS',scr:'Scherm',zone:'Zone',audio:'Audio',lvl:'Niveau',sys:'Systeem',note:'Notitie'};
const logData=load(LOG_KEY,{entries:[]}); if(!Array.isArray(logData.entries)) logData.entries=[];
const sessionId=(d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+fmtClock(d))(new Date());
let logDirty=false;
function log(cat,type,msg,data){
  const e=Object.assign({t:now(),s:sessionId,cat,type,msg:msg||'',vis:document.visibilityState,lvl:level},data||{});
  logData.entries.push(e);
  if(logData.entries.length>LOG_MAX) logData.entries.splice(0,logData.entries.length-LOG_MAX);
  logDirty=true; queueLogRender(e); return e;
}
function flushLog(){ if(!logDirty) return;
  if(!store(LOG_KEY,logData)){ logData.entries.splice(0,Math.floor(logData.entries.length/3)); store(LOG_KEY,logData); }
  logDirty=false; }
setInterval(flushLog,3000);

/* ===== UI-hulpjes ===== */
let toastT=null;
function toast(msg,ms=4200){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms); }
function openModal(html){ $('#modalCard').innerHTML=html; $('#modal').hidden=false; }
function closeModal(){ $('#modal').hidden=true; }
$('#modal').addEventListener('click',e=>{ if(e.target.id==='modal') closeModal(); });
function resItem(state,label,detail){ const ic={ok:'✓',warn:'!',bad:'✕',info:'i',wait:'…',idle:'·'}[state]||'·';
  return `<li><span class="ic ${state}">${ic}</span><span>${esc(label)}${detail?`<small>${esc(detail)}</small>`:''}</span></li>`; }

/* =====================================================================
   AUDIO
   ===================================================================== */
const AC=window.AudioContext||window.webkitAudioContext;
const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;
let ctx=null, masterG=null, staticG=null, staticSrc=null;
const zoneG={}, voices={}, BUF={}, ASSET={};
let staticBuf=null, staticUrl=null, staticEl=null, staticOn=false, priming=false, volOk=true, elWraps=0, lastElT=0, fadeTimer=null;
let audioReady=false;

function renderBuf(sec,build,ch){ const sr=44100; const oc=new OAC(ch||2,Math.round(sec*sr),sr); build(oc,sec);
  return new Promise((res,rej)=>{ oc.oncomplete=e=>res(e.renderedBuffer); const p=oc.startRendering(); if(p&&p.then) p.then(res,rej); }); }
/* Placeholders: zelfde rol als de echte bestanden, hoorbaar verschillend per zone. Loop-lengtes en
   frequenties zijn zo gekozen dat de loop naadloos sluit (hele periodes binnen de looplengte). */
const SYNTH={
  pad:()=>renderBuf(8,(oc,sec)=>{ const out=oc.createGain(); out.gain.value=0.5; const lp=oc.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1500; lp.connect(out); out.connect(oc.destination);
    [110,138.625,165,220].forEach((f,i)=>{ const o=oc.createOscillator(); o.type=i%2?'sine':'triangle'; o.frequency.value=f; const g=oc.createGain();
      const c=new Float32Array(256); for(let k=0;k<256;k++) c[k]=0.10+0.12*(0.5+0.5*Math.sin(2*Math.PI*2*k/255+i*1.3)); g.gain.setValueCurveAtTime(c,0,sec);
      o.connect(g); g.connect(lp); o.start(0); }); }),
  chirps:()=>renderBuf(4,(oc)=>{ const out=oc.createGain(); out.gain.value=0.6; out.connect(oc.destination);
    const hum=oc.createOscillator(); hum.frequency.value=330; const hg=oc.createGain(); hg.gain.value=0.06; hum.connect(hg); hg.connect(out); hum.start(0);
    for(let k=0;k<8;k++){ const t=k*0.5+0.05, o=oc.createOscillator(), g=oc.createGain(); const f0=k%2?2100:1700;
      o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f0*1.45,t+0.12);
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.32,t+0.012); g.gain.exponentialRampToValueAtTime(0.001,t+0.17);
      o.connect(g); g.connect(out); o.start(t); o.stop(t+0.2); } }),
  bell:()=>renderBuf(5,(oc)=>{ const out=oc.createGain(); out.gain.value=0.7; out.connect(oc.destination);
    [[1,.5,3.5],[2,.22,2.2],[2.76,.18,1.6],[4.07,.1,1.1],[5.4,.07,.8]].forEach(([r,a,d])=>{ const o=oc.createOscillator(), g=oc.createGain(); o.frequency.value=523.25*r;
      g.gain.setValueAtTime(0,0); g.gain.linearRampToValueAtTime(a,0.005); g.gain.exponentialRampToValueAtTime(0.0008,d); o.connect(g); g.connect(out); o.start(0); o.stop(d+0.05); }); }),
  static:()=>renderBuf(20,(oc,sec)=>{ const out=oc.createGain(); out.gain.value=0.9; out.connect(oc.destination);
    const lp=oc.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=650; lp.connect(out);
    [55,82.5,110].forEach(f=>{ const o=oc.createOscillator(); o.frequency.value=f; const g=oc.createGain(); g.gain.value=0.11; o.connect(g); g.connect(lp); o.start(0); });
    const n=oc.createBuffer(1,Math.round(sec*oc.sampleRate),oc.sampleRate), d=n.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const ns=oc.createBufferSource(); ns.buffer=n; const bp=oc.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=480; bp.Q.value=0.6;
    const wg=oc.createGain(); const c=new Float32Array(256); for(let k=0;k<256;k++) c[k]=0.22*Math.sin(Math.PI*k/255)**2; wg.gain.setValueCurveAtTime(c,0,sec);
    ns.connect(bp); bp.connect(wg); wg.connect(out); ns.start(0); },1)
};
function wavBlob(buf){ const ch=buf.numberOfChannels, len=buf.length, sr=buf.sampleRate, bytes=len*ch*2, ab=new ArrayBuffer(44+bytes), v=new DataView(ab);
  const w=(o,s)=>{ for(let i=0;i<s.length;i++) v.setUint8(o+i,s.charCodeAt(i)); };
  w(0,'RIFF'); v.setUint32(4,36+bytes,true); w(8,'WAVE'); w(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,ch,true);
  v.setUint32(24,sr,true); v.setUint32(28,sr*ch*2,true); v.setUint16(32,ch*2,true); v.setUint16(34,16,true); w(36,'data'); v.setUint32(40,bytes,true);
  const chans=[]; for(let c=0;c<ch;c++) chans.push(buf.getChannelData(c)); let o=44;
  for(let i=0;i<len;i++) for(let c=0;c<ch;c++){ const s=clamp(chans[c][i],-1,1); v.setInt16(o,s<0?s*0x8000:s*0x7fff,true); o+=2; }
  return new Blob([ab],{type:'audio/wav'}); }
/* fade-in/-out in het begin en eind van de buffer zelf; elke herhaling van de loop krijgt zo een zachte overgang zonder JavaScript-timers */
function applyLoopFade(buf,ms){ const n=Math.min(Math.round(ms/1000*buf.sampleRate),Math.floor(buf.length/4)), len=buf.length;
  for(let c=0;c<buf.numberOfChannels;c++){ const d=buf.getChannelData(c); for(let i=0;i<n;i++){ const g=Math.sin(Math.PI/2*i/n); d[i]*=g; d[len-1-i]*=g; } } }
function decode(ab){ const oc=new OAC(2,44100,44100); return new Promise((res,rej)=>{ const p=oc.decodeAudioData(ab,res,rej); if(p&&p.then) p.then(res,rej); }); }
async function loadOrSynth(key,asset,synth){
  try{ const r=await fetch(CFG.audioBase+asset,{cache:'no-cache'}); if(!r.ok) throw new Error('HTTP '+r.status);
    const b=await decode(await r.arrayBuffer()); ASSET[key]={real:true,name:asset,dur:b.duration}; return b; }
  catch(e){ const b=await SYNTH[synth](); ASSET[key]={real:false,name:asset,dur:b.duration,why:e.message}; return b; } }

async function preloadAudio(){
  if(!OAC){ pf('assets','bad','Audiobestanden','Deze browser ondersteunt geen Web Audio'); return; }
  pf('assets','wait','Audiobestanden','Laden…');
  for(const z of ZONES) BUF[z.id]=await loadOrSynth(z.id,z.asset,z.synth);
  staticBuf=await loadOrSynth('static',CFG.static.asset,CFG.static.synth);
  if(CFG.static.loopFadeMs) applyLoopFade(staticBuf,CFG.static.loopFadeMs);
  staticUrl=URL.createObjectURL(wavBlob(staticBuf));   // ook bij eigen bestand: zo zit de loop-fade in wat de HTML-speler afspeelt
  createStaticEl();
  const keys=[...ZONES.map(z=>z.id),'static'], real=keys.filter(k=>ASSET[k].real).length;
  pf('assets',real===keys.length?'ok':'info','Audiobestanden', real===keys.length?'Alle eigen bestanden geladen':`${real} van ${keys.length} eigen bestanden · rest is synth-placeholder`);
  log('audio','assets',`Audio geladen: ${keys.map(k=>k+'='+(ASSET[k].real?'eigen':'synth')).join(', ')}`);
  audioReady=true; const b=$('#btnStart'); if(!running){ b.disabled=false; b.textContent='Start'; }
  renderAll();
}

function createStaticEl(){
  staticEl=new Audio(); staticEl.src=staticUrl; staticEl.loop=true; staticEl.preload='auto'; staticEl.setAttribute('playsinline','');
  ['play','pause','waiting','stalled','ended','error'].forEach(ev=>staticEl.addEventListener(ev,()=>{
    if(priming) return; log('audio','el-'+ev,'Statische speler: '+({play:'speelt',pause:'gepauzeerd',waiting:'wacht op data',stalled:'hapert',ended:'einde',error:'fout'}[ev]),ev==='error'||ev==='stalled'?{warn:1}:null); }));
}
function setupGraph(){
  masterG=ctx.createGain(); masterG.gain.value=S.master;
  const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-6; comp.knee.value=6; comp.ratio.value=8; comp.attack.value=0.005; comp.release.value=0.25;
  masterG.connect(comp); comp.connect(ctx.destination);
  ZONES.forEach(z=>{ const g=ctx.createGain(); g.gain.value=z.mode==='DISTANCE_GAIN'?0:z.gain; g.connect(masterG); zoneG[z.id]=g; });
  staticG=ctx.createGain(); staticG.gain.value=0; staticG.connect(masterG);
  ctx.onstatechange=()=>{ log('audio','ctx-state','Web Audio: '+ctx.state,ctx.state!=='running'&&running&&!paused?{warn:1}:null); updateResumeBar(); };
}
function startLoop(z){
  if(!ctx) return; const v=voices[z.id]; if(v&&!v.stopping) return;
  const src=ctx.createBufferSource(); src.buffer=BUF[z.id]; src.loop=true; const g=ctx.createGain(); g.gain.value=0;
  src.connect(g); g.connect(zoneG[z.id]); const t=ctx.currentTime; src.start(t);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(1,t+(z.fadeInMs||0)/1000);
  voices[z.id]={src,g}; log('audio','loop-start',`${z.name}: loop start (fade-in ${(z.fadeInMs||0)/1000} s)`,{zone:z.id});
}
function stopLoop(z,ms){
  const v=voices[z.id]; if(!v||v.stopping||!ctx) return; const t=ctx.currentTime, d=(ms==null?z.fadeOutMs:ms)/1000;
  v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value,t); v.g.gain.linearRampToValueAtTime(0,t+d);
  try{ v.src.stop(t+d+0.05); }catch(_){}
  v.stopping=true; const prev=v.src.onended; v.src.onended=e=>{ if(voices[z.id]===v) delete voices[z.id]; if(prev) prev(e); };
  log('audio','loop-stop',`${z.name}: ${z.mode==='ONE_SHOT'?'one-shot':'loop'} fade-out ${d.toFixed(1)} s`,{zone:z.id});
}
function applyDistanceGain(z,d){
  const st=ZS[z.id], far=S.radius[z.id]+S.exitMarginM, near=z.nearM||0;
  const x=clamp((d-near)/Math.max(1,far-near),0,1); const g=z.minGain+(z.gain-z.minGain)*Math.pow(1-x,z.curve||1);
  st.dgain=g; if(ctx) zoneG[z.id].gain.setTargetAtTime(g,ctx.currentTime,0.6);
}
function oneShot(z){
  const st=ZS[z.id];
  if(z.oncePerSession&&st.shots>0){ log('zone','skip',`${z.name}: one-shot al gespeeld deze sessie`,{zone:z.id}); return; }
  if(st.playing){ log('zone','skip',`${z.name}: one-shot speelt nog, niet opnieuw gestart`,{zone:z.id}); return; }
  if(st.lastShot&&now()-st.lastShot<z.cooldownMs){ log('zone','cooldown',`${z.name}: overgeslagen, cooldown nog ${fmtDur(z.cooldownMs-(now()-st.lastShot))}`,{zone:z.id}); return; }
  if(!ctx) return;
  const src=ctx.createBufferSource(); src.buffer=BUF[z.id]; const g=ctx.createGain(); g.gain.value=1; src.connect(g); g.connect(zoneG[z.id]); src.start();
  st.lastShot=now(); st.shots++; st.playing=true; const v={src,g}; voices[z.id]=v;
  src.onended=()=>{ if(voices[z.id]===v) delete voices[z.id]; st.playing=false; if(!v.stopping) log('audio','oneshot-end',`${z.name}: one-shot afgelopen`,{zone:z.id}); updateStatic(); renderSoon(); };
  log('audio','oneshot',`${z.name}: one-shot speelt (${fmtDur(BUF[z.id].duration*1000)})`,{zone:z.id});
}
function audioEnter(z,d){ if(z.mode==='ONE_SHOT') return oneShot(z); startLoop(z); if(z.mode==='DISTANCE_GAIN') applyDistanceGain(z,d); }
/* verlaten = altijd stoppen (met fade), ook een one-shot die nog speelt */
function audioExit(z,ms){ stopLoop(z,ms!=null?ms:(z.fadeOutMs||2500)); }
/* static speelt buiten de zones; zodra een zone klinkt fadet hij weg en daarna weer terug */
function zoneSounding(){ return ZONES.some(z=>z.mode==='ONE_SHOT'?ZS[z.id].playing:ZS[z.id].inside); }
function updateStatic(){ if(!running||level===0) return; setStatic(level===1||!zoneSounding()); }

/* statische soundscape */
function fadeEl(target,ms,done){
  clearInterval(fadeTimer); if(!staticEl) return;
  if(!volOk){ if(done) done(); return; }              // iOS: volume vast -> harde wissel
  const from=staticEl.volume, steps=Math.max(1,Math.round(ms/50)); let i=0;
  fadeTimer=setInterval(()=>{ i++; staticEl.volume=clamp(from+(target-from)*i/steps,0,1); if(i>=steps){ clearInterval(fadeTimer); if(done) done(); } },50);
}
function playEl(){
  if(!staticEl) return; const p=staticEl.play();
  if(p&&p.catch) p.catch(e=>{ log('audio','el-blocked','Statische speler geblokkeerd: '+e.message,{warn:1}); updateResumeBar(true); });
}
function setStatic(on){
  if(staticOn===on) return; staticOn=on; const fade=CFG.crossfadeMs;
  log('audio',on?'static-on':'static-off',on?'Statische soundscape aan':'Statische soundscape uit');
  if(S.staticPlayer==='webaudio'){
    if(!ctx) return; const t=ctx.currentTime;
    if(on&&!staticSrc){ staticSrc=ctx.createBufferSource(); staticSrc.buffer=staticBuf; staticSrc.loop=true; staticSrc.connect(staticG); staticSrc.start(t); }
    staticG.gain.cancelScheduledValues(t); staticG.gain.setValueAtTime(staticG.gain.value,t); staticG.gain.linearRampToValueAtTime(on?CFG.static.gain:0,t+fade/1000);
  } else {
    if(on){ if(volOk&&staticEl.paused) staticEl.volume=0; if(!paused) playEl(); fadeEl(clamp(CFG.static.gain*S.master,0,1),fade); }
    else fadeEl(0,fade,()=>{ if(!staticOn) staticEl.pause(); });
  }
  updateMediaSession();
}
function hardStopStatic(){
  clearInterval(fadeTimer);
  if(staticEl){ staticEl.pause(); }
  if(staticSrc){ try{ staticSrc.stop(); }catch(_){} staticSrc=null; }
  if(staticG&&ctx){ staticG.gain.cancelScheduledValues(ctx.currentTime); staticG.gain.value=0; }
  staticOn=false;
}
function updateResumeBar(force){
  const need=running&&!paused&&((ctx&&ctx.state!=='running'&&!document.hidden)||force===true);
  $('#resumeBar').hidden=!need;
}
$('#resumeBar').addEventListener('click',()=>{ if(ctx) ctx.resume().catch(()=>{}); if(staticOn&&S.staticPlayer==='element') playEl(); $('#resumeBar').hidden=true; log('audio','user-resume','Geluid hervat via tik'); });

/* =====================================================================
   NIVEAUS (3 interactief · 2 beperkt · 1 statisch)
   ===================================================================== */
function currentPos(){ return S.source==='sim'?simPos:lastFix; }
function computeLevel(){
  if(S.mode==='static') return [1,'Handmatig op statisch gezet'];
  if(S.mode==='interactive') return [3,'Handmatig op interactief gezet'];
  if(geoDenied&&S.source==='gps') return [1,'Geen locatietoestemming'];
  if(document.hidden&&S.onHidden==='static') return [1,'Scherm uit · instelling "naar statisch"'];
  const p=currentPos();
  if(!p) return [1,S.source==='sim'?'Plaats de simulatiestip op de kaart':'Wachten op eerste locatie'];
  const age=now()-p.at;
  if(age>S.staleS*1000) return [1,`Geen verse locatie (${fmtDur(age)})`];
  const ds=haversine(p.lat,p.lon,SITE.lat,SITE.lon);
  if(ds>CFG.siteRadiusM) return [1,`Niet ter plaatse (${fmtM(ds)} van testgebied)`];
  if(p.acc>S.maxAccM) return [1,`Locatie te onnauwkeurig (±${Math.round(p.acc)} m)`];
  if(p.acc>S.goodAccM) return [2,`Matige nauwkeurigheid (±${Math.round(p.acc)} m)`];
  return [3,`Goede locatie (±${Math.round(p.acc)} m)`];
}
function updateLevel(){
  if(!running) return;
  const [l,why]=computeLevel();
  if(l<level||level===0){ upSince=null; if(l!==level) applyLevel(l,why); else levelWhy=why; return; }
  if(l>level){ if(!upSince) upSince=now(); if(now()-upSince>=CFG.geo.upgradeDelayMs){ upSince=null; applyLevel(l,why); } }
  else { upSince=null; levelWhy=why; }
}
function applyLevel(l,why){
  const old=level; if(old) levelTime[old]+=now()-levelSince; levelSince=now(); level=l; levelWhy=why;
  log('lvl','level',`Niveau ${old||'–'} → ${l}: ${why}`,{from:old,to:l,warn:l<old?1:0});
  if(l===1&&old!==1){ ZONES.forEach(z=>audioExit(z,CFG.crossfadeMs)); }
  if(l>=2&&old<=1){ ZONES.forEach(z=>{ const st=ZS[z.id]; if(st.inside&&z.mode!=='ONE_SHOT'){ startLoop(z); if(z.mode==='DISTANCE_GAIN') applyDistanceGain(z,st.dist); } }); }
  updateStatic();
  renderAll();
}

/* =====================================================================
   ZONE-ENGINE (hysterese + dwell + nauwkeurigheidsfilter, zoals Stadsstemmen)
   ===================================================================== */
function evaluateZones(p){
  if(!p) return;
  const usable=(now()-p.at)<=S.staleS*1000&&p.acc<=S.maxAccM;
  ZONES.forEach(z=>{
    const st=ZS[z.id], d=haversine(p.lat,p.lon,z.lat,z.lon); st.dist=d;
    if(!usable){ st.cand=null; return; }
    const r=S.radius[z.id], rx=r+S.exitMarginM;
    if(!st.inside){
      if(d<=r){ if(st.cand==null) st.cand=now(); if(now()-st.cand>=S.dwellMs) zoneEnter(z,d,p); }
      else st.cand=null;
    } else if(d>rx) zoneExit(z,d,p);
    else if(z.mode==='DISTANCE_GAIN'&&level>=2) applyDistanceGain(z,d);
  });
}
function zoneEnter(z,d,p){
  const st=ZS[z.id]; st.inside=true; st.cand=null; st.enteredAt=now(); st.enters++; stats.enters[z.id]++;
  if(sleep&&document.hidden) sleep.zoneEv++;
  log('zone','enter',`${z.name} binnen · ${Math.round(d)} m van midden · ±${Math.round(p.acc)} m`,{zone:z.id,dist:+d.toFixed(1),acc:+p.acc.toFixed(1),lat:+p.lat.toFixed(6),lon:+p.lon.toFixed(6)});
  if(level>=2){ audioEnter(z,d); updateStatic(); }
  else log('zone','muted',`${z.name}: geen audio-trigger (niveau ${level})`,{zone:z.id});
  updateMapZones(); renderSoon();
}
function zoneExit(z,d,p){
  const st=ZS[z.id]; st.inside=false; st.cand=null;
  if(sleep&&document.hidden) sleep.zoneEv++;
  log('zone','exit',`${z.name} verlaten na ${fmtDur(now()-st.enteredAt)} · ${Math.round(d)} m · ±${Math.round(p.acc)} m`,{zone:z.id,dist:+d.toFixed(1),acc:+p.acc.toFixed(1)});
  audioExit(z); updateStatic(); updateMapZones(); renderSoon();
}
function process(p){ evaluateZones(p); updateLevel(); renderSoon(); }

/* =====================================================================
   GPS
   ===================================================================== */
function startGeo(){
  if(!('geolocation' in navigator)){ log('gps','unsupported','Geen locatie-API in deze browser',{warn:1}); pf('fix','bad','Eerste GPS-positie','Niet ondersteund'); showVerdict(); return; }
  if(watchId!=null) return;
  watchId=navigator.geolocation.watchPosition(onFix,onGeoErr,{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  log('gps','watch-start','Locatievolging gestart (hoge nauwkeurigheid)');
}
function stopGeo(){ if(watchId!=null){ navigator.geolocation.clearWatch(watchId); watchId=null; log('gps','watch-stop','Locatievolging gestopt'); } }
function onFix(pos){
  const c=pos.coords, t=now();
  const f={lat:c.latitude,lon:c.longitude,acc:c.accuracy,spd:c.speed,ts:pos.timestamp||t,at:t,src:'gps'};
  const gap=lastFix?t-lastFix.at:null; lastFix=f; stats.fixes++; stats.accSum+=f.acc; geoDenied=false;
  if(sleep){ if(f.ts>=sleep.at&&(!sleep.end||f.ts<=sleep.end)) sleep.fixTs++;
    if(document.hidden){ sleep.fixHidden++; const g=t-(sleep.lastCb||sleep.lastFixAt||sleep.at); sleep.maxGap=Math.max(sleep.maxGap,g); sleep.lastCb=t; } }
  log('gps','fix',`±${Math.round(f.acc)} m${gap!=null?' · +'+(gap/1000).toFixed(1)+' s':''}${document.hidden?' · scherm uit':''}`,
    {lat:+f.lat.toFixed(6),lon:+f.lon.toFixed(6),acc:+f.acc.toFixed(1),age:t-f.ts,gap,spd:f.spd!=null?+f.spd.toFixed(2):null});
  if(gap!=null&&gap>CFG.geo.gapWarnS*1000){ stats.gaps++; log('gps','gap',`Gat van ${fmtDur(gap)} zonder locatie${document.hidden?' (scherm uit)':''}`,{gap,warn:1}); }
  if(f.acc>CFG.geo.approxWarnM){ if(++approxStreak>=3&&!approxWarned){ approxWarned=true; log('gps','approx',`Steeds ±${Math.round(f.acc)} m: waarschijnlijk staat "nauwkeurige locatie" uit`,{warn:1}); toast('Je locatie is erg grof. Zet "Nauwkeurige locatie" aan voor deze site/browser.',7000); } }
  else approxStreak=0;
  if(!firstFixAt){ firstFixAt=t; onFirstFix(f); }
  drawMe();
  if(S.source==='gps') process(f); else renderSoon();
}
function onGeoErr(e){
  const m={1:'Locatietoestemming geweigerd',2:'Positie niet beschikbaar',3:'Time-out bij ophalen positie'}[e.code]||e.message;
  log('gps','error',m,{code:e.code,warn:1});
  if(e.code===1){ geoDenied=true; pf('perm','bad','Locatietoestemming','Geweigerd · sta locatie toe in de browser-/telefooninstellingen'); pf('fix','bad','Eerste GPS-positie','Geen toestemming'); pf('dist','idle','Afstand tot testgebied','Onbekend zonder locatie'); showVerdict(); }
  updateLevel(); renderSoon();
}
function onFirstFix(f){
  clearTimeout(fixTimeout);
  const ttf=f.at-startedAt, st=f.acc<=S.goodAccM?'ok':f.acc<=S.maxAccM?'warn':'bad';
  pf('fix',st,'Eerste GPS-positie',`±${Math.round(f.acc)} m na ${(ttf/1000).toFixed(1)} s`);
  pf('perm','ok','Locatietoestemming','Toegestaan');
  const ds=haversine(f.lat,f.lon,SITE.lat,SITE.lon);
  pf('dist',ds<=CFG.siteRadiusM?'ok':'warn','Afstand tot testgebied',ds<=CFG.siteRadiusM?`${fmtM(ds)} van het midden`:`${fmtM(ds)} · je bent niet ter plaatse, gebruik Simulatie om thuis te testen`);
  log('gps','first-fix',`Eerste positie na ${(ttf/1000).toFixed(1)} s · ±${Math.round(f.acc)} m · ${fmtM(ds)} van testgebied`,{ttf,acc:f.acc,dist:Math.round(ds)});
  if(map&&S.source==='gps') map.easeTo({center:[f.lon,f.lat],zoom:Math.max(map.getZoom(),17)});
  setTimeout(showVerdict,CFG.geo.upgradeDelayMs+300);
}

/* =====================================================================
   SCHERM / SLUIMER — meet wat er gebeurt als het scherm uitgaat
   ===================================================================== */
function onHidden(){
  if(sleep&&sleep.end) finishSleep(sleep);
  sleep={at:now(),fixHidden:0,fixTs:0,ticks:0,zoneEv:0,maxGap:0,lastFixAt:lastFix?lastFix.at:null,lastCb:null,
    ctxT:ctx?ctx.currentTime:null,ctxState:ctx?ctx.state:null,elT:staticEl?staticEl.currentTime:null,elPlaying:!!(staticEl&&!staticEl.paused),
    wraps0:elWraps,level,test:sleepTestArmed,running};
  store('wk_sleep',{open:true,at:sleep.at,test:sleepTestArmed,running});
  log('scr','hidden','Scherm uit / app naar achtergrond',{});
  flushLog(); updateLevel();
}
function onVisible(){
  const s=sleep;
  log('scr','visible',s?`Scherm weer aan na ${fmtDur(now()-s.at)}`:'Scherm aan');
  store('wk_sleep',{open:false});
  requestWakeLock(); updateLevel();
  if(ctx&&running&&!paused&&ctx.state!=='running') ctx.resume().then(()=>log('audio','ctx-resumed','Web Audio hervat na terugkeer')).catch(()=>{});
  setTimeout(updateResumeBar,800);
  if(!s) return;
  s.end=now(); s.ctxEnd=ctx?ctx.currentTime:null; s.ctxStateEnd=ctx?ctx.state:null; s.elEnd=staticEl?staticEl.currentTime:null; s.elPlayingEnd=!!(staticEl&&!staticEl.paused); s.wraps1=elWraps;
  setTimeout(()=>finishSleep(s),2500);      // vang nagekomen (gebufferde) posities op
}
function finishSleep(s){
  if(s.done) return; s.done=true; if(sleep===s) sleep=null;
  const dur=s.end-s.at;
  const maxGap=Math.max(s.maxGap,s.end-(s.lastCb||s.lastFixAt||s.at));
  const jsPct=clamp(s.ticks/Math.max(1,dur/1000),0,1);
  const ctxRan=s.ctxT!=null&&s.ctxEnd!=null?clamp((s.ctxEnd-s.ctxT)/(dur/1000),0,1):null;
  const elMoved=s.elPlaying?((s.wraps1-s.wraps0)>0||Math.abs((s.elEnd||0)-(s.elT||0))>0.5):null;
  const r={at:s.at,dur,fixHidden:s.fixHidden,fixTs:s.fixTs,maxGap,jsPct,ctxRan,ctxState:s.ctxState,ctxStateEnd:s.ctxStateEnd,
    elWasPlaying:s.elPlaying,elMoved,elPlayingEnd:s.elPlayingEnd,zoneEv:s.zoneEv,level:s.level,test:s.test,running:s.running};
  stats.sleeps++; stats.sleepMs+=dur;
  log('scr','sleep-summary',`Sluimer ${fmtDur(dur)}: ${s.fixHidden} posities tijdens scherm uit, ${s.fixTs} met tijdstempel in die periode, langste gat ${fmtDur(maxGap)}, JS ${Math.round(jsPct*100)}% actief`+
    (ctxRan!=null?`, Web Audio ${Math.round(ctxRan*100)}%`:'')+(elMoved!=null?`, HTML-audio ${elMoved?'liep door':'stond stil'}`:'')+`, ${s.zoneEv} zone-events`,
    {dur,fixHidden:s.fixHidden,fixTs:s.fixTs,maxGap,jsPct:+jsPct.toFixed(2),ctxRan:ctxRan!=null?+ctxRan.toFixed(2):null,elMoved,zoneEv:s.zoneEv});
  store('wk_lastsleep',r); renderLastSleep();
  if(s.test){ sleepTestArmed=false; renderSleepBtn(); showSleepResult(r); }
  else if(dur>8000&&running) toast(`Sluimer ${fmtDur(dur)}: ${s.fixHidden} posities ontvangen tijdens scherm uit`);
}
function sleepRows(r){
  const dur=r.dur;
  return [
    resItem(r.fixHidden>0?'ok':'bad','Locatie tijdens scherm uit',r.fixHidden>0?`${r.fixHidden} posities ontvangen (≈ 1 per ${fmtDur(dur/Math.max(1,r.fixHidden))})`:'Geen posities ontvangen terwijl het scherm uit was'),
    resItem(r.fixTs>r.fixHidden?'info':'idle','Nagekomen posities',r.fixTs>r.fixHidden?`${r.fixTs-r.fixHidden} posities met tijdstempel in de sluimer kwamen pas na ontgrendelen binnen`:'Geen'),
    resItem(r.maxGap>CFG.geo.gapWarnS*1000?'warn':'ok','Langste gat zonder positie',fmtDur(r.maxGap)),
    resItem(r.jsPct>0.8?'ok':r.jsPct>0.1?'warn':'bad','JavaScript bleef draaien',`${Math.round(r.jsPct*100)}% van de tijd`),
    r.ctxRan!=null?resItem(r.ctxRan>0.9?'ok':r.ctxRan>0.1?'warn':'bad','Web Audio (zones) speelde door',`${Math.round(r.ctxRan*100)}% · ${r.ctxState} → ${r.ctxStateEnd}`):resItem('idle','Web Audio','Nog niet gestart'),
    r.elMoved!=null?resItem(r.elMoved&&r.elPlayingEnd?'ok':'bad','Statische speler (HTML-audio)',r.elMoved?(r.elPlayingEnd?'Liep door':'Liep, maar is gepauzeerd door het systeem'):'Stond stil'):resItem('idle','Statische speler','Speelde niet bij vergrendelen'),
    resItem(r.zoneEv>0?'ok':'idle','Zone-triggers tijdens scherm uit',r.zoneEv>0?`${r.zoneEv} enter/exit-events`:'Geen (loop door een zone om dit te testen)')
  ].join('');
}
function showSleepResult(r){
  const ok=r.fixHidden>0;
  openModal(`<h3>Resultaat sluimertest</h3><p>Scherm was ${fmtDur(r.dur)} uit. ${ok?'Je toestel gaf locatie door tijdens sluimer.':'Je toestel gaf <b>geen</b> locatie door tijdens sluimer.'}</p>
    ${S.source==='sim'?'<p><b>Let op:</b> simulatie staat aan. De locatieregels gaan over echte GPS-posities.</p>':''}<ul class="res">${sleepRows(r)}</ul>
    <div class="row"><button class="btn ghost" id="mClose">Sluiten</button><button class="btn" id="mLog">Bekijk log</button></div>`);
  $('#mClose').onclick=closeModal; $('#mLog').onclick=()=>{ closeModal(); setTab('log'); };
}
function renderLastSleep(){
  const r=load('wk_lastsleep',null), el=$('#lastSleep');
  if(!r){ el.innerHTML=''; return; }
  el.innerHTML=`<div class="sleepcard"><h5>Laatste sluimer · ${fmtClock(r.at)} · ${fmtDur(r.dur)}</h5><ul class="res">${sleepRows(r)}</ul></div>`;
}
function renderSleepBtn(){ const b=$('#btnSleepTest'); b.textContent=sleepTestArmed?'Sluimertest staat klaar · vergrendel nu je scherm':'Start sluimertest'; b.classList.toggle('ghost',sleepTestArmed); }
$('#btnSleepTest').addEventListener('click',()=>{
  if(sleepTestArmed){ sleepTestArmed=false; renderSleepBtn(); log('scr','sleeptest-cancel','Sluimertest geannuleerd'); return; }
  openModal(`<h3>Sluimertest</h3><p>We meten of je telefoon locatie en geluid blijft leveren als het scherm uit is.</p>
    <ol class="steps"><li>Laat deze pagina open.</li><li>Vergrendel je scherm met de aan/uit-knop.</li><li>Loop door één of meer zones, of wacht minstens 2 minuten.</li><li>Ontgrendel en kom terug naar deze pagina.</li></ol>
    <p>Daarna zie je direct het resultaat. Alles komt ook in het log.</p>
    <div class="row"><button class="btn ghost" id="mClose">Annuleer</button><button class="btn big" id="mArm">Klaar, ik vergrendel</button></div>`);
  $('#mClose').onclick=closeModal;
  $('#mArm').onclick=()=>{ closeModal(); sleepTestArmed=true; renderSleepBtn(); log('scr','sleeptest-armed','Sluimertest gestart: wacht op scherm uit'); toast('Vergrendel nu je scherm'); };
});

document.addEventListener('visibilitychange',()=>{ if(document.hidden) onHidden(); else onVisible(); });
/* pagehide = gebruiker navigeert/herlaadt zelf; dan is een herstart géén systeem-afsluiting */
window.addEventListener('pagehide',e=>{ log('scr','pagehide',e.persisted?'Pagina naar bfcache':'Pagina verlaten/herladen'); store('wk_sleep',{open:false}); flushLog(); });
window.addEventListener('pageshow',e=>{ if(e.persisted) log('scr','pageshow','Pagina hersteld uit bfcache'); });
document.addEventListener('freeze',()=>{ log('scr','freeze','Pagina bevroren door systeem',{warn:1}); flushLog(); });
document.addEventListener('resume',()=>log('scr','resume','Pagina ontdooid'));
window.addEventListener('focus',()=>log('scr','focus','Venster focus'));
window.addEventListener('blur',()=>log('scr','blur','Venster focus kwijt'));
window.addEventListener('online',()=>log('sys','online','Internet terug'));
window.addEventListener('offline',()=>log('sys','offline','Geen internet',{warn:1}));
try{ navigator.mediaDevices&&navigator.mediaDevices.addEventListener('devicechange',()=>log('audio','devicechange','Audio-uitvoer gewijzigd (koptelefoon/Bluetooth)')); }catch(_){}

/* hartslag: laat zien of JavaScript in sluimer doorloopt */
let lastTick=now();
setInterval(()=>{
  const t=now(), gap=t-lastTick; lastTick=t;
  if(gap>4000) log('sys','js-pause',`JavaScript stond ${fmtDur(gap)} stil${document.hidden?'':' (net terug)'}`,{gap,warn:1});
  if(sleep&&!sleep.end&&document.hidden) sleep.ticks++;
  if(staticEl){ const ct=staticEl.currentTime; if(ct<lastElT-0.5) elWraps++; lastElT=ct; }
  if(!running) return;
  if(S.source==='sim'&&simPos){ simPos.at=t; evaluateZones(simPos); }
  else if(lastFix) evaluateZones(lastFix);           // dwell afronden bij stilstaan
  updateLevel(); renderSoon(); drawMe();
},1000);

/* =====================================================================
   WAKE LOCK, MEDIA SESSION, BATTERIJ
   ===================================================================== */
async function requestWakeLock(){
  if(!S.wakeLock||!running||!('wakeLock' in navigator)||document.hidden||wakeLock) return;
  try{ wakeLock=await navigator.wakeLock.request('screen'); log('sys','wakelock-on','Scherm-aan (Wake Lock) actief');
    wakeLock.addEventListener('release',()=>{ log('sys','wakelock-off','Wake Lock vrijgegeven'); wakeLock=null; renderChips(); }); }
  catch(e){ log('sys','wakelock-fail','Wake Lock mislukt: '+e.message,{warn:1}); }
  renderChips();
}
function releaseWakeLock(){ if(wakeLock){ wakeLock.release().catch(()=>{}); wakeLock=null; } renderChips(); }
function setupMediaSession(){
  if(!('mediaSession' in navigator)) return;
  try{ navigator.mediaSession.metadata=new MediaMetadata({title:'Wadlandklanken · test',artist:CFG.siteName,album:'Geofence-test'});
    navigator.mediaSession.setActionHandler('play',()=>{ if(paused) togglePause(); });
    navigator.mediaSession.setActionHandler('pause',()=>{ if(!paused) togglePause(); }); }catch(_){}
}
function updateMediaSession(){ try{ if('mediaSession' in navigator) navigator.mediaSession.playbackState=running&&!paused?'playing':'paused'; }catch(_){} }
if(navigator.getBattery) navigator.getBattery().then(b=>{ battery=b;
  b.addEventListener('levelchange',()=>log('sys','battery',`Batterij ${Math.round(b.level*100)}%`,{battery:b.level}));
  b.addEventListener('chargingchange',()=>log('sys','charging',b.charging?'Aan de lader':'Van de lader'));
  renderDevInfo(); }).catch(()=>{});

/* =====================================================================
   START / PAUZE / STOP
   ===================================================================== */
function onStartTap(){
  if(!audioReady) return;
  // alles wat audio ontgrendelt moet synchroon in deze tik gebeuren (iOS)
  try{ if(navigator.audioSession){ navigator.audioSession.type='playback'; } }catch(_){}
  if(!ctx){ try{ ctx=new AC({latencyHint:'playback'}); }catch(_){ ctx=new AC(); } setupGraph(); }
  ctx.resume().catch(()=>{});
  if(staticEl){ priming=true; staticEl.muted=true; const p=staticEl.play();
    const done=()=>{ if(!staticOn) staticEl.pause(); staticEl.muted=false; priming=false; };
    if(p&&p.then) p.then(()=>{ done(); log('audio','primed','Statische speler ontgrendeld'); }).catch(e=>{ priming=false; staticEl.muted=false; log('audio','prime-fail','Statische speler niet ontgrendeld: '+e.message,{warn:1}); });
    else done(); }
  running=true; paused=false; startedAt=now(); firstFixAt=null; level=0; levelSince=now();
  log('sys','start',`Sessie gestart · ${navigator.userAgent}`,{ua:navigator.userAgent,audioSession:navigator.audioSession?navigator.audioSession.type:null});
  if(S.source==='gps'){
    startGeo(); pf('fix','wait','Eerste GPS-positie','Zoeken…'); pf('dist','wait','Afstand tot testgebied','Wacht op positie');
    clearTimeout(fixTimeout); fixTimeout=setTimeout(()=>{ if(!firstFixAt&&!geoDenied){ pf('fix','bad','Eerste GPS-positie',`Geen positie binnen ${CFG.geo.firstFixTimeoutS} s`); showVerdict(); } },CFG.geo.firstFixTimeoutS*1000);
  } else { startGeo(); pf('fix','info','Eerste GPS-positie','Simulatie actief (GPS wordt wel gelogd)'); setTimeout(showVerdict,600); }
  requestWakeLock(); setupMediaSession(); updateMediaSession();
  updateLevel();
  const b=$('#btnStart'); b.hidden=true; $('#btnToMap').hidden=false;
  renderAll();
}
function showVerdict(){
  if(!running) return;
  const [l,why]=computeLevel(), v=$('#verdict');
  const txt={3:'Interactief: de zones werken met deze locatie.',2:'Beperkt: locatie is matig nauwkeurig, zones kunnen haperen.',1:'Statisch: je hoort de vaste soundscape. Zones worden niet getriggerd.'}[l];
  v.dataset.l=l; v.innerHTML=`<b>Verwacht niveau ${l}</b>${esc(txt)}<br><small>${esc(why)}</small>`; v.hidden=false;
  $('#btnUseSim').hidden=!(S.source==='gps'&&l===1);
  log('sys','verdict',`Toestelcheck: niveau ${l} · ${why}`);
}
function hideOverlay(){ $('#startOv').hidden=true; if(map) setTimeout(()=>{ map.resize(); fitZones(true); },60); }
$('#btnStart').addEventListener('click',onStartTap);
$('#btnToMap').addEventListener('click',hideOverlay);
$('#btnUseSim').addEventListener('click',()=>{ setSetting('source','sim'); hideOverlay(); });
$('#btnPreflight').addEventListener('click',()=>{ $('#startOv').hidden=false; });

function togglePause(){
  if(!running) return; paused=!paused;
  if(paused){ if(ctx) ctx.suspend(); if(staticEl) staticEl.pause(); log('sys','pause','Gepauzeerd (GPS en log lopen door)'); }
  else { if(ctx) ctx.resume(); if(staticOn&&S.staticPlayer==='element') playEl(); log('sys','resume','Hervat'); }
  updateMediaSession(); renderAll();
}
function stopSession(){
  if(!running) return;
  if(level) levelTime[level]+=now()-levelSince;
  ZONES.forEach(z=>{ stopLoop(z,300); const st=ZS[z.id]; st.inside=false; st.cand=null; });
  hardStopStatic(); stopGeo(); releaseWakeLock(); clearTimeout(fixTimeout);
  log('sys','stop',`Sessie gestopt na ${fmtDur(now()-startedAt)}`);
  running=false; paused=false; level=0; levelWhy='Gestopt'; flushLog(); updateMediaSession();
  const b=$('#btnStart'); b.hidden=false; b.textContent='Opnieuw starten'; $('#btnToMap').hidden=true; $('#verdict').hidden=true;
  $('#startOv').hidden=false; updateMapZones(); renderAll();
}
$('#btnPause').addEventListener('click',togglePause);
$('#btnStop').addEventListener('click',()=>{ if(confirm('Sessie stoppen? Het log blijft bewaard.')) stopSession(); });
$('#volume').addEventListener('input',e=>{ S.master=+e.target.value; if(masterG&&ctx) masterG.gain.setTargetAtTime(S.master,ctx.currentTime,0.05); if(staticEl&&volOk&&staticOn) staticEl.volume=clamp(CFG.static.gain*S.master,0,1); saveS(); });

/* =====================================================================
   KAART (MapLibre + Stadsstemmen-kaartstijl)
   ===================================================================== */
let map=null, mapReady=false, meMarker=null, simMarker=null; const zonePins={};
function circle(lat,lon,r,n){ n=n||72; const pts=[]; for(let i=0;i<=n;i++){ const a=2*Math.PI*i/n;
  pts.push([lon+r*Math.sin(a)/(111320*Math.cos(lat*Math.PI/180)),lat+r*Math.cos(a)/110540]); } return pts; }
function zonesGeo(){ const fs=[];
  ZONES.forEach(z=>{ const st=ZS[z.id], r=S.radius[z.id];
    fs.push({type:'Feature',properties:{kind:'enter',color:z.color,inside:st.inside,cand:st.cand!=null},geometry:{type:'Polygon',coordinates:[circle(z.lat,z.lon,r)]}});
    fs.push({type:'Feature',properties:{kind:'exit',color:z.color},geometry:{type:'LineString',coordinates:circle(z.lat,z.lon,r+S.exitMarginM)}}); });
  return {type:'FeatureCollection',features:fs}; }
function accGeo(){ const p=currentPos(); if(!p) return {type:'FeatureCollection',features:[]};
  return {type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[circle(p.lat,p.lon,Math.max(1,p.acc))]}}]}; }
function initMap(){
  if(!window.maplibregl){ log('sys','map-fail','Kaartbibliotheek niet geladen',{warn:1}); return; }
  try{
    map=new maplibregl.Map({container:'map',style:'mapstyle.json',center:[SITE.lon,SITE.lat],zoom:18,minZoom:12,maxZoom:21,
      attributionControl:false,dragRotate:false,pitchWithRotate:false,touchPitch:false});
    try{ map.touchZoomRotate.disableRotation(); }catch(_){}
    let mapErr=false; map.on('error',e=>{ if(mapErr) return; mapErr=true; log('sys','map-error','Kaart(tegels) laden mislukt: '+((e&&e.error&&e.error.message)||'onbekend'),{warn:1}); });
    map.on('load',()=>{
      map.addSource('zones',{type:'geojson',data:zonesGeo()});
      map.addSource('acc',{type:'geojson',data:accGeo()});
      map.addLayer({id:'acc-fill',type:'fill',source:'acc',paint:{'fill-color':'#5db8ff','fill-opacity':0.13}});
      map.addLayer({id:'acc-line',type:'line',source:'acc',paint:{'line-color':'#5db8ff','line-width':1,'line-opacity':0.5}});
      map.addLayer({id:'zone-fill',type:'fill',source:'zones',filter:['==',['get','kind'],'enter'],
        paint:{'fill-color':['get','color'],'fill-opacity':['case',['get','inside'],0.45,['get','cand'],0.3,0.16]}});
      map.addLayer({id:'zone-line',type:'line',source:'zones',filter:['==',['get','kind'],'enter'],paint:{'line-color':'#14150f','line-width':['case',['get','inside'],2.5,1.2],'line-opacity':0.75}});
      map.addLayer({id:'zone-exit',type:'line',source:'zones',filter:['==',['get','kind'],'exit'],paint:{'line-color':['get','color'],'line-width':1.6,'line-dasharray':[2,2],'line-opacity':0.9}});
      mapReady=true; fitZones(false);
    });
    map.on('click',e=>{ if(S.source==='sim') setSim(e.lngLat.lat,e.lngLat.lng); });
    ZONES.forEach((z,i)=>{ const el=document.createElement('div'); el.className='zpin'; el.style.setProperty('--c',z.color); el.textContent=i+1; el.title=z.name;
      el.addEventListener('click',ev=>{ ev.stopPropagation(); focusZone(z); });
      zonePins[z.id]=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([z.lon,z.lat]).addTo(map); });
  }catch(e){ log('sys','map-fail','Kaart starten mislukt: '+e.message,{warn:1}); }
}
function sheetPx(){ const s=$('#sheet'); return s?s.offsetHeight:0; }
function fitZones(animate){
  if(!map) return; const b=new maplibregl.LngLatBounds();
  ZONES.forEach(z=>circle(z.lat,z.lon,S.radius[z.id]+S.exitMarginM+6,24).forEach(p=>b.extend(p)));
  try{ map.fitBounds(b,{padding:{top:96,bottom:sheetPx()+24,left:36,right:68},maxZoom:19.5,animate:!!animate}); }catch(_){}
}
function focusZone(z){ if(map) map.easeTo({center:[z.lon,z.lat],zoom:19,padding:{top:80,bottom:sheetPx(),left:0,right:0}}); }
function updateMapZones(){
  if(mapReady){ const s=map.getSource('zones'); if(s) s.setData(zonesGeo()); }
  ZONES.forEach(z=>{ const m=zonePins[z.id]; if(m) m.getElement().classList.toggle('in',ZS[z.id].inside); });
}
function drawMe(){
  if(!map) return;
  if(lastFix&&S.source==='gps'){
    if(!meMarker){ const el=document.createElement('div'); el.className='me-pin'; el.innerHTML='<span class="ring"></span><span class="dot"></span>';
      meMarker=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([lastFix.lon,lastFix.lat]).addTo(map); }
    else meMarker.setLngLat([lastFix.lon,lastFix.lat]);
    meMarker.getElement().classList.toggle('stale',now()-lastFix.at>S.staleS*1000);
  } else if(meMarker&&S.source!=='gps'){ meMarker.remove(); meMarker=null; }
  if(mapReady){ const s=map.getSource('acc'); if(s) s.setData(accGeo()); }
}
function setSim(lat,lon){
  simPos={lat,lon,acc:CFG.sim.accM,at:now(),src:'sim'};
  if(simMarker) simMarker.setLngLat([lon,lat]);
  process(simPos); drawMe();
}
function applySource(){
  const sim=S.source==='sim'; $('#simBadge').hidden=!sim;
  if(sim){
    if(!simPos){ const p=lastFix&&haversine(lastFix.lat,lastFix.lon,SITE.lat,SITE.lon)<CFG.siteRadiusM?lastFix:{lat:ZONES[0].lat-0.00045,lon:ZONES[0].lon-0.0002}; simPos={lat:p.lat,lon:p.lon,acc:CFG.sim.accM,at:now(),src:'sim'}; }
    if(map&&!simMarker){ const el=document.createElement('div'); el.className='me-pin sim'; el.innerHTML='<span class="ring"></span><span class="dot"></span>';
      simMarker=new maplibregl.Marker({element:el,anchor:'center',draggable:true}).setLngLat([simPos.lon,simPos.lat]).addTo(map);
      simMarker.on('drag',()=>{ const ll=simMarker.getLngLat(); setSim(ll.lat,ll.lng); }); }
    if(running) process(simPos);
  } else {
    if(simMarker){ simMarker.remove(); simMarker=null; }
    if(running&&lastFix) process(lastFix);
  }
  drawMe(); updateLevel(); renderAll();
}
$('#btnFit').addEventListener('click',()=>fitZones(true));
$('#btnMe').addEventListener('click',()=>{ const p=currentPos(); if(p&&map) map.easeTo({center:[p.lon,p.lat],zoom:Math.max(map.getZoom(),18.5)}); else toast('Nog geen positie'); });

/* =====================================================================
   RENDER
   ===================================================================== */
let renderQ=false;
function renderSoon(){ if(renderQ) return; renderQ=true; requestAnimationFrame(()=>{ renderQ=false; renderAll(); }); }
function renderAll(){ renderLevel(); renderChips(); renderZones(); renderStatic(); renderStats(); updateMapZones(); $('#btnPause').textContent=paused?'Hervat':'Pauze'; $('#btnPause').disabled=!running; $('#btnStop').disabled=!running; }
function renderLevel(){ const c=$('#lvlChip'); c.dataset.l=level; $('#lvlNum').textContent=level||'–'; $('#lvlTitle').textContent=(paused?'Gepauzeerd · ':'')+LEVEL_TITLE[level]; $('#lvlWhy').textContent=levelWhy; }
function renderChips(){
  const g=$('#gpsChip'), p=currentPos();
  if(S.source==='sim'){ g.textContent='SIM ±'+CFG.sim.accM+' m'; g.className='chip warn'; }
  else if(!lastFix){ g.textContent=geoDenied?'GPS geweigerd':'GPS –'; g.className='chip'+(geoDenied?' bad':''); }
  else { const age=now()-lastFix.at; g.textContent=`±${Math.round(lastFix.acc)} m · ${age<1500?'nu':Math.round(age/1000)+' s'}`;
    g.className='chip '+(age>S.staleS*1000||lastFix.acc>S.maxAccM?'bad':lastFix.acc>S.goodAccM?'warn':'good'); }
  const s=$('#scrChip');
  if(!('wakeLock' in navigator)){ s.textContent='Wake Lock n.v.t.'; s.className='chip warn'; }
  else if(wakeLock){ s.textContent='Scherm blijft aan'; s.className='chip good'; }
  else { s.textContent=S.wakeLock&&running?'Scherm: auto-slot':'Scherm: normaal'; s.className='chip'; }
}
function zoneState(z){
  const st=ZS[z.id];
  if(st.inside){ let s='binnen sinds '+fmtDur(now()-st.enteredAt);
    if(z.mode==='ONE_SHOT') s+=st.playing?' · speelt':(st.lastShot?' · cooldown '+(now()-st.lastShot<z.cooldownMs?fmtDur(z.cooldownMs-(now()-st.lastShot)):'klaar'):'');
    return s; }
  if(st.cand!=null) return 'binnenkomen… (dwell)';
  return 'buiten'+(st.enters?` · ${st.enters}× bezocht`:'');
}
function zoneLevel(z){
  const st=ZS[z.id]; if(paused||level<2) return 0;
  if(z.mode==='ONE_SHOT') return st.playing?z.gain:0;
  if(!st.inside) return 0; return z.mode==='DISTANCE_GAIN'?st.dgain:z.gain;
}
function renderZones(){
  const el=$('#zoneList');
  if(!el.children.length){ el.innerHTML=ZONES.map((z,i)=>`<div class="zcard" data-id="${z.id}" style="--c:${z.color}"><div class="znum">${i+1}</div>
    <div class="zmain"><div class="ztitle">${esc(z.name)} <span class="mode">${MODE_LABEL[z.mode]}</span> <span class="asset"></span></div><div class="zsub"></div><div class="zbar"><i></i></div></div>
    <div class="zdist"><b>–</b><small>afstand</small></div></div>`).join('');
    el.querySelectorAll('.zcard').forEach(c=>c.addEventListener('click',()=>focusZone(ZONES.find(z=>z.id===c.dataset.id)))); }
  ZONES.forEach(z=>{ const c=el.querySelector(`[data-id="${z.id}"]`), st=ZS[z.id];
    c.classList.toggle('in',st.inside); c.classList.toggle('cand',st.cand!=null&&!st.inside);
    const a=ASSET[z.id], ab=c.querySelector('.asset'); ab.className='asset '+(a?(a.real?'real':'synth'):''); ab.textContent=a?(a.real?'eigen audio':'placeholder'):'';
    c.querySelector('.zsub').textContent=st.inside?`${zoneState(z)} · verlaat bij ${S.radius[z.id]+S.exitMarginM} m`:`r ${S.radius[z.id]} m · ${zoneState(z)}`;
    c.querySelector('.zbar i').style.width=Math.round(zoneLevel(z)*100)+'%';
    c.querySelector('.zdist b').textContent=st.dist!=null?fmtM(st.dist):'–'; });
}
function renderStatic(){
  const a=ASSET.static, on=staticOn&&running;
  $('#staticCard').innerHTML=`<div class="scard ${on?'on':''}"><div class="znum">S</div><div class="zmain"><div class="ztitle">Statische soundscape <span class="mode">${S.staticPlayer==='element'?'HTML-audio':'Web Audio'}</span>${a?` <span class="asset ${a.real?'real':'synth'}">${a.real?'eigen audio':'placeholder'}</span>`:''}</div>
    <div class="zsub">${on?(paused?'gepauzeerd':(level===1?'speelt · niveau 1 (geen bruikbare locatie)':'speelt · buiten de zones')):'stil · er klinkt een zone'}${!volOk&&S.staticPlayer==='element'?' · volume vast (iOS): harde wissel':''}</div></div></div>`;
}
function renderStats(){
  if(!$('#pane-log').classList.contains('on')) return;
  const lt=Object.assign({},levelTime); if(running&&level) lt[level]+=now()-levelSince;
  const tot=lt[1]+lt[2]+lt[3]||1, pct=l=>Math.round(lt[l]/tot*100)+'%';
  const items=[
    [running?fmtDur(now()-startedAt):'–','sessie'],
    [stats.fixes,'posities'],
    [stats.fixes?'±'+Math.round(stats.accSum/stats.fixes)+' m':'–','gem. nauwk.'],
    [stats.gaps,'gaten >'+CFG.geo.gapWarnS+' s'],
    [stats.sleeps+(stats.sleeps?' · '+fmtDur(stats.sleepMs):''),'sluimers'],
    [ZONES.map(z=>stats.enters[z.id]).join(' / '),'enters z1/z2/z3'],
    [pct(3),'tijd niv. 3'],[pct(2),'tijd niv. 2'],[pct(1),'tijd niv. 1']];
  $('#stats').innerHTML=items.map(([b,s])=>`<div class="stat"><b>${esc(b)}</b><small>${esc(s)}</small></div>`).join('');
}

/* ----- log-weergave ----- */
const FILTERS=[['key','Belangrijk'],['all','Alles'],['gps','GPS'],['scr','Scherm'],['zone','Zones'],['audio','Audio'],['lvl','Niveau'],['note','Notities']];
let logFilter='key', pendingRows=[], logRQ=false;
$('#filters').innerHTML=FILTERS.map(([k,l])=>`<button data-f="${k}" class="${k===logFilter?'on':''}">${l}</button>`).join('');
$('#filters').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; logFilter=b.dataset.f;
  $('#filters').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); renderLogAll(); });
function matches(e){ if(logFilter==='all') return true; if(logFilter==='key') return e.type!=='fix'; return e.cat===logFilter; }
function rowHtml(e){ return `<li class="c-${e.cat}${e.warn?' warn':''}${e.type==='session'?' sess':''}"><time>${fmtClock(e.t)}</time><span class="tag">${CAT[e.cat]||e.cat}</span><span class="m">${esc(e.msg)}</span>${e.vis==='hidden'?'<span class="hid" title="scherm was uit">☾</span>':'<span></span>'}</li>`; }
function renderLogAll(){
  const list=$('#logList'), rows=[]; const es=logData.entries;
  for(let i=es.length-1;i>=0&&rows.length<400;i--) if(matches(es[i])) rows.push(rowHtml(es[i]));
  list.innerHTML=rows.length?rows.join(''):'<li><span class="empty">Nog niets gelogd</span></li>';
  $('#logBadge').textContent=es.length;
}
function queueLogRender(e){ pendingRows.push(e); if(logRQ) return; logRQ=true;
  requestAnimationFrame(()=>{ logRQ=false; const list=$('#logList'); const add=pendingRows.filter(matches); pendingRows=[];
    if(add.length){ if(list.querySelector('.empty')) list.innerHTML=''; list.insertAdjacentHTML('afterbegin',add.reverse().map(rowHtml).join(''));
      while(list.children.length>400) list.lastElementChild.remove(); }
    $('#logBadge').textContent=logData.entries.length; }); }

/* ----- export ----- */
const COLS=['tijd','t_ms','sessie','categorie','type','zichtbaar','niveau','bericht','lat','lon','acc_m','leeftijd_ms','gat_ms','snelheid','zone','afstand_m','extra'];
const KNOWN=new Set(['t','s','cat','type','vis','lvl','msg','lat','lon','acc','age','gap','spd','zone','dist']);
function csvCell(v){ if(v==null) return ''; const s=String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
function buildCsv(){
  const lines=[COLS.join(',')];
  logData.entries.forEach(e=>{ const extra={}; Object.keys(e).forEach(k=>{ if(!KNOWN.has(k)) extra[k]=e[k]; });
    lines.push([new Date(e.t).toISOString(),e.t,e.s,e.cat,e.type,e.vis,e.lvl,e.msg,e.lat,e.lon,e.acc,e.age,e.gap,e.spd,e.zone,e.dist,Object.keys(extra).length?JSON.stringify(extra):''].map(csvCell).join(',')); });
  return lines.join('\n'); }
function fname(ext){ const d=new Date(); return `wadlandklanken-log-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.${ext}`; }
function download(text,name,type){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1000); }
function summaryText(){
  const r=load('wk_lastsleep',null), lt=Object.assign({},levelTime); if(running&&level) lt[level]+=now()-levelSince;
  return [`Wadlandklanken geofence-test · ${new Date().toLocaleString('nl-NL')}`,
    `Toestel: ${navigator.userAgent}`,
    `Sessie: ${running?fmtDur(now()-startedAt):'gestopt'} · niveau nu ${level} (${levelWhy})`,
    `Posities: ${stats.fixes} · gem. ±${stats.fixes?Math.round(stats.accSum/stats.fixes):'–'} m · gaten >${CFG.geo.gapWarnS}s: ${stats.gaps}`,
    `Zone-enters: ${ZONES.map(z=>z.name+' '+stats.enters[z.id]).join(', ')}`,
    `Tijd per niveau: 3=${fmtDur(lt[3])}, 2=${fmtDur(lt[2])}, 1=${fmtDur(lt[1])}`,
    `Sluimers: ${stats.sleeps} (${fmtDur(stats.sleepMs)})`,
    r?`Laatste sluimer ${fmtDur(r.dur)}: ${r.fixHidden} posities tijdens scherm uit, langste gat ${fmtDur(r.maxGap)}, JS ${Math.round(r.jsPct*100)}%, Web Audio ${r.ctxRan!=null?Math.round(r.ctxRan*100)+'%':'–'}, HTML-audio ${r.elMoved==null?'–':r.elMoved?'liep door':'stond stil'}`:'Nog geen sluimer gemeten',
    `Instellingen: ${JSON.stringify(S)}`].join('\n'); }
$('#btnCsv').addEventListener('click',()=>{ flushLog(); download(buildCsv(),fname('csv'),'text/csv'); });
$('#btnJson').addEventListener('click',()=>{ flushLog(); download(JSON.stringify({summary:summaryText(),config:CFG,settings:S,entries:logData.entries},null,1),fname('json'),'application/json'); });
$('#btnShare').addEventListener('click',async()=>{
  const file=new File([buildCsv()],fname('csv'),{type:'text/csv'});
  try{ if(navigator.canShare&&navigator.canShare({files:[file]})) await navigator.share({files:[file],title:'Wadlandklanken log',text:summaryText()});
    else if(navigator.share) await navigator.share({title:'Wadlandklanken log',text:summaryText()});
    else { download(buildCsv(),fname('csv'),'text/csv'); } }catch(e){ if(e.name!=='AbortError') toast('Delen mislukt: '+e.message); } });
$('#btnCopy').addEventListener('click',async()=>{ try{ await navigator.clipboard.writeText(summaryText()); toast('Samenvatting gekopieerd'); }catch(_){ toast('Kopiëren niet toegestaan in deze browser'); } });
$('#btnClear').addEventListener('click',()=>{ if(!confirm('Hele log wissen? Exporteer eerst als je hem wilt bewaren.')) return;
  logData.entries=[]; logDirty=true; flushLog(); store('wk_lastsleep',null); renderLastSleep(); renderLogAll(); log('sys','clear','Log gewist'); });

/* ----- notities (grondwaarheid tijdens het lopen) ----- */
$('#btnNote').addEventListener('click',()=>{
  const btns=[...ZONES.map(z=>`Ik sta nu in ${z.name}`),'Ik sta buiten de zones','Ik vergrendel nu','Hier klopt iets niet'];
  openModal(`<h3>Notitie</h3><p>Leg vast wat er echt gebeurt; dat maakt het log later goed te vergelijken.</p>
    <div class="notegrid">${btns.map(b=>`<button class="btn" data-n="${esc(b)}">${esc(b)}</button>`).join('')}</div>
    <textarea id="noteTxt" placeholder="Eigen notitie…"></textarea>
    <div class="row"><button class="btn ghost" id="mClose">Annuleer</button><button class="btn" id="mSave">Opslaan</button></div>`);
  const save=t=>{ if(!t) return; const p=currentPos(); log('note','note',t,p?{lat:+p.lat.toFixed(6),lon:+p.lon.toFixed(6),acc:+p.acc.toFixed(1)}:null); closeModal(); toast('Notitie opgeslagen'); };
  $('#modalCard').querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>save(b.dataset.n));
  $('#mClose').onclick=closeModal; $('#mSave').onclick=()=>save($('#noteTxt').value.trim());
});

/* ----- tabs + sheet ----- */
function setTab(t){ document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));
  document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='pane-'+t));
  if(t==='log'){ renderLogAll(); renderStats(); }
  const app=$('#app'); if(app.classList.contains('sheet-min')) app.classList.remove('sheet-min'); }
$('#tabs').addEventListener('click',e=>{ const b=e.target.closest('button'); if(b) setTab(b.dataset.tab); });
$('#grip').addEventListener('click',()=>{ const a=$('#app');
  if(a.classList.contains('sheet-min')) a.classList.remove('sheet-min');
  else if(a.classList.contains('sheet-full')){ a.classList.remove('sheet-full'); a.classList.add('sheet-min'); }
  else a.classList.add('sheet-full'); });

/* ----- instellingen ----- */
$('#radiusRows').innerHTML=ZONES.map(z=>`<div class="set-row"><span>${esc(z.name)}<small>${MODE_LABEL[z.mode]}</small></span><label class="num"><input type="number" data-set="radius" data-zone="${z.id}" min="3" max="200"> m</label></div>`).join('');
function paintSettings(){
  document.querySelectorAll('.seg[data-set]').forEach(sg=>sg.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===S[sg.dataset.set])));
  document.querySelectorAll('input[data-set]').forEach(i=>{ const k=i.dataset.set;
    if(i.type==='checkbox') i.checked=!!S[k]; else i.value=k==='radius'?S.radius[i.dataset.zone]:S[k]; });
  $('#volume').value=S.master;
}
function setSetting(k,v,zone){
  if(k==='radius') S.radius[zone]=v; else{ if(S[k]===v) return; S[k]=v; }
  saveS(); log('sys','setting',`Instelling ${k}${zone?'['+zone+']':''} = ${v}`);
  if(k==='source') applySource();
  if(k==='wakeLock') v?requestWakeLock():releaseWakeLock();
  if(k==='radius'||k==='exitMarginM'){ updateMapZones(); const p=currentPos(); if(running&&p) evaluateZones(p); }
  paintSettings(); updateLevel(); renderAll();
}
document.querySelectorAll('.seg[data-set]').forEach(sg=>sg.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return;
  const k=sg.dataset.set, v=b.dataset.v;
  if(k==='staticPlayer'&&v!==S.staticPlayer){ const was=staticOn; if(was) hardStopStatic(); S.staticPlayer=v; if(was&&running) setStatic(true); saveS(); log('sys','setting','Instelling staticPlayer = '+v); paintSettings(); renderAll(); return; }
  setSetting(k,v); }));
document.querySelectorAll('input[data-set]').forEach(i=>i.addEventListener('change',()=>{
  const k=i.dataset.set; if(i.type==='checkbox') return setSetting(k,i.checked);
  const v=+i.value; if(!isFinite(v)||v<0) return paintSettings(); setSetting(k,v,i.dataset.zone); }));
$('#btnDefaults').addEventListener('click',()=>{ const src=S.source; Object.assign(S,JSON.parse(JSON.stringify(DEF))); S.source=src; saveS(); log('sys','setting','Standaardwaarden hersteld'); paintSettings(); updateMapZones(); updateLevel(); renderAll(); toast('Standaardwaarden hersteld'); });

function renderDevInfo(){
  const standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone;
  $('#devInfo').innerHTML=[`<b>Versie:</b> ${APP_VERSION}`,`<b>Browser:</b> ${esc(navigator.userAgent)}`,`<b>Scherm:</b> ${screen.width}×${screen.height} @${devicePixelRatio}x${standalone?' · als app geïnstalleerd':''}`,
    `<b>Audio-sessie (iOS):</b> ${navigator.audioSession?'ja':'nee'} · <b>Wake Lock:</b> ${'wakeLock' in navigator?'ja':'nee'} · <b>Volume regelbaar:</b> ${volOk?'ja':'nee'}`,
    battery?`<b>Batterij:</b> ${Math.round(battery.level*100)}%${battery.charging?' (laden)':''}`:'' ].filter(Boolean).join('<br>');
}

/* =====================================================================
   TOESTELCHECK (vooraf)
   ===================================================================== */
const PF_ORDER=['https','geo','perm','audio','sess','wake','vol','assets','fix','dist'], PF={};
function pf(id,state,label,detail){ PF[id]={state,label,detail}; const l=$('#pfList'); if(l) l.innerHTML='<ul class="res">'+PF_ORDER.filter(k=>PF[k]).map(k=>resItem(PF[k].state,PF[k].label,PF[k].detail)).join('')+'</ul>'; }
async function preflight(){
  pf('https',window.isSecureContext?'ok':'bad','Beveiligde verbinding',window.isSecureContext?'HTTPS':'Locatie werkt alleen via HTTPS');
  pf('geo','geolocation' in navigator?'ok':'bad','Locatie-API','geolocation' in navigator?'Beschikbaar':'Niet beschikbaar in deze browser');
  pf('perm','info','Locatietoestemming','Wordt gevraagd bij Start');
  try{ if(navigator.permissions&&navigator.permissions.query){ const ps=await navigator.permissions.query({name:'geolocation'});
      const show=()=>{ if(ps.state==='granted') pf('perm','ok','Locatietoestemming','Al toegestaan'); else if(ps.state==='denied'){ geoDenied=true; pf('perm','bad','Locatietoestemming','Geweigerd · zet locatie aan in de instellingen'); } else pf('perm','info','Locatietoestemming','Wordt gevraagd bij Start'); };
      show(); ps.onchange=()=>{ show(); log('gps','perm-change','Locatietoestemming: '+ps.state); updateLevel(); }; } }catch(_){}
  pf('audio',AC?'ok':'bad','Web Audio',AC?'Beschikbaar':'Niet beschikbaar');
  pf('sess',navigator.audioSession?'ok':'info','Audio-sessie "playback"',navigator.audioSession?'Beschikbaar (Safari): geluid mag doorspelen':'Niet aanwezig (normaal buiten iOS)');
  pf('wake','wakeLock' in navigator?'ok':'warn','Scherm aan houden','wakeLock' in navigator?'Wake Lock beschikbaar':'Niet ondersteund: zet automatische vergrendeling zelf langer');
  try{ const a=new Audio(); a.volume=0.5; volOk=Math.abs(a.volume-0.5)<0.01; }catch(_){ volOk=false; }
  pf('vol',volOk?'ok':'info','Volume-fades statische speler',volOk?'Regelbaar':'Volume vast (iOS): overgang wordt een harde wissel');
  pf('fix','idle','Eerste GPS-positie','Na Start'); pf('dist','idle','Afstand tot testgebied','Na Start');
  renderDevInfo();
  await preloadAudio();
}

/* =====================================================================
   OPSTARTEN
   ===================================================================== */
(function boot(){
  const nav=performance.getEntriesByType&&performance.getEntriesByType('navigation')[0];
  log('sys','session',`${APP_VERSION} · pagina geladen (${nav?nav.type:'?'})${document.wasDiscarded?' · was door het systeem afgesloten':''}`,{nav:nav&&nav.type,discarded:!!document.wasDiscarded,ua:navigator.userAgent});
  const ps=load('wk_sleep',null);
  if(ps&&ps.open&&ps.running){
    log('scr','reload-after-sleep',`Pagina is opnieuw geladen terwijl het scherm uit was (sinds ${fmtClock(ps.at)}). Het systeem heeft de pagina afgesloten.`,{since:ps.at,warn:1});
    store('wk_sleep',{open:false});
    setTimeout(()=>openModal(`<h3>Pagina werd afgesloten</h3><p>Terwijl je scherm uit was (sinds ${fmtClock(ps.at)}) heeft je telefoon deze pagina afgesloten en opnieuw geladen. Locatie en geluid stopten dus volledig.</p><p>Dit staat in het log. Tik op Start om verder te testen.</p><div class="row"><button class="btn" id="mClose">Begrepen</button></div>`)||($('#mClose').onclick=closeModal),400);
  }
  $('#appVersion').textContent=APP_VERSION;
  paintSettings(); renderLogAll(); renderLastSleep(); renderSleepBtn();
  initMap(); applySource(); renderAll();
  preflight();
})();
/* debug-haakje voor de console (bijv. WK.setSim(53.17761,6.604201) in simulatie) */
window.WK={ setSim, zones:ZS, get level(){ return level; }, get why(){ return levelWhy; }, log:logData };
})();
