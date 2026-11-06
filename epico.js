/* MEDYTE ACADEMY · Edición Épica
   Misiones locales, insignias, sonidos opcionales y celebraciones.
   No envía información a ningún servidor. */
(() => {
  'use strict';
  const PROFILE = 'medyte_demo_estatica_v1';
  const GAMES = 'medyte_games_v1';
  const EXTRA = 'medyte_epico_v1';
  const $ = s => document.querySelector(s);
  const clean = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = key => {try {return JSON.parse(localStorage.getItem(key) || 'null');} catch {return null;}};
  const persist = (key, val) => {try {localStorage.setItem(key,JSON.stringify(val));return true;}catch {return false;}};
  let extra = read(EXTRA);
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) extra = {};
  extra.sound = extra.sound === true;
  extra.claimed = extra.claimed && typeof extra.claimed === 'object' ? extra.claimed : {};
  extra.introSeen = !!extra.introSeen;
  const nowDay = () => {const d=new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const dayOf = value => { const d=new Date(value); return Number.isNaN(d.getTime())?'':[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const rank = xp => (xp>=2400?['Leyenda MEDYTE','👑']:xp>=1400?['Maestro del Saber','🏆']:xp>=800?['Futuro Médico','🩺']:xp>=400?['Investigador','🔬']:xp>=150?['Explorador','🧭']:['Aprendiz','🌱']);
  const getProfile = () => {const p = read(PROFILE) || {};return {xp:Math.max(0,Number(p.xp)||0),history:Array.isArray(p.history)?p.history:[]};};
  const getGames = () => {const p=read(GAMES)||{};return {adventure:p.adventure||{},anatomy:p.anatomy||{}};};
  const achievements = (profile,games) => [
    {id:'primera',name:'Primer gran paso',icon:'🎯',text:'Termina una práctica.',ok:profile.history.some(h=>h.mode!=='game-adventure')},
    {id:'aventura',name:'Explorador del mapa',icon:'🧭',text:'Supera una etapa de Aventura.',ok:Object.values(games.adventure).some(x=>x.best>=60)},
    {id:'estrellas',name:'Tres estrellas',icon:'🌟',text:'Consigue el 100% en una etapa.',ok:Object.values(games.adventure).some(x=>x.best>=100)},
    {id:'anatomia',name:'Detective del cuerpo',icon:'🫀',text:'Completa un nivel de Anatomía.',ok:Object.values(games.anatomy).some(x=>x.wins>=1)},
    {id:'xp500',name:'Constancia de oro',icon:'⚡',text:'Acumula 500 XP.',ok:profile.xp>=500},
    {id:'xp1500',name:'Estrella MEDYTE',icon:'🏅',text:'Acumula 1.500 XP.',ok:profile.xp>=1500}
  ];
  const missions = (profile,games) => {
    const day=nowDay();
    const history=profile.history.filter(h=>typeof h.date==='string'&&dayOf(h.date)===day);
    const practice=history.some(h=>h.mode!=='game-adventure');
    const answered=history.reduce((n,h)=>n+(Number(h.correct)||0),0);
    const visited=Object.values(games.adventure).some(g=>g.lastDate===day)||Object.values(games.anatomy).some(g=>g.lastDate===day);
    return [
      {id:'practica',name:'Entrena tu mente',icon:'📚',goal:'Completa una práctica o simulacro.',ok:practice,score:25},
      {id:'aciertos',name:'Cinco aciertos',icon:'🎯',goal:`${Math.min(5,answered)}/5 respuestas correctas hoy.`,ok:answered>=5,score:35},
      {id:'juego',name:'Explorador activo',icon:'🎮',goal:'Finaliza un nivel de cualquiera de los juegos.',ok:visited,score:40}
    ];
  };
  const state = {modal:false,previousFocus:null};
  let ctx=null;
  const sound = which => {
    if (!extra.sound) return;
    try {
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtx) return;
      ctx=ctx||new AudioCtx();
      if(ctx.state==='suspended')ctx.resume().catch(()=>{});
      const pattern=which==='good'?[[660,0,.09],[880,.09,.13]]:which==='bad'?[[270,0,.13],[210,.14,.16]]:which==='win'?[[523,0,.09],[659,.11,.09],[784,.22,.12],[1047,.35,.25]]:[[440,0,.06]];
      for(const [frequency,offset,duration] of pattern){
        const at=ctx.currentTime+offset;
        const osc=ctx.createOscillator(),amp=ctx.createGain();
        osc.type=which==='bad'?'triangle':'sine';
        osc.frequency.setValueAtTime(frequency,at);
        amp.gain.setValueAtTime(.0001,at);
        amp.gain.exponentialRampToValueAtTime(.07,at+.012);
        amp.gain.exponentialRampToValueAtTime(.0001,at+duration);
        osc.connect(amp).connect(ctx.destination);osc.start(at);osc.stop(at+duration+.02);
      }
    }catch{}
  };
  const celebrate = (message='¡Reto superado!') => {
    sound('win');
    const notice=document.createElement('div'); notice.className='epic-celebrate-message';notice.setAttribute('role','status');notice.textContent='✨ '+message;
    document.body.append(notice);setTimeout(()=>notice.remove(),2700);
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const wrap=document.createElement('div');wrap.className='epic-confetti';wrap.setAttribute('aria-hidden','true');
    for(let i=0;i<42;i++){
      const part=document.createElement('span');part.style.setProperty('--x',((Math.random()*94)+3)+'%');
      part.style.setProperty('--delay',(Math.random()*.35)+'s');part.style.setProperty('--rotate',(Math.random()*700-350)+'deg');
      part.style.setProperty('--hue',String([39,48,164,186,263][Math.floor(Math.random()*5)]));
      wrap.append(part);
    }
    document.body.append(wrap);setTimeout(()=>wrap.remove(),3200);
  };
  function refresh(){
    const p=getProfile(),g=getGames(),r=rank(p.xp);
    const tag=$('#epicRank');if(tag)tag.textContent=`${r[1]} ${r[0]}`;
    const amount=$('#epicXp');if(amount)amount.textContent=`${Math.floor(p.xp)} XP`;
    const notif=$('#epicNotification');if(notif){const m=missions(p,g);notif.hidden=!m.some(x=>x.ok&&!extra.claimed[`${nowDay()}:${x.id}`]);}
    if(state.modal) renderModal();
  }
  function claim(id){
    const p=getProfile(),g=getGames();const m=missions(p,g).find(m=>m.id===id);
    const key=`${nowDay()}:${id}`;
    if(!m||!m.ok||extra.claimed[key])return;
    const copy=read(PROFILE)||{};copy.xp=Math.max(0,Number(copy.xp)||0)+m.score;
    if(!persist(PROFILE,copy))return;
    extra.claimed[key]=true;persist(EXTRA,extra);
    sound('win');refresh();
    window.dispatchEvent(new Event('medyte:bonus'));
  }
  function renderModal(){
    const el=$('#epicPanel');if(!el)return;
    const p=getProfile(),g=getGames(),[name,icon]=rank(p.xp),m=missions(p,g),a=achievements(p,g);
    const wins=a.filter(v=>v.ok).length;
    el.innerHTML=`<div class="epic-modal-top"><div><span class="epic-overline">CENTRO DE RECOMPENSAS</span><h2>🏅 Misiones e insignias</h2><p>${icon} Rango actual: <b>${clean(name)}</b> · ${Math.floor(p.xp)} XP</p></div><button class="epic-close" type="button" data-epic="close" aria-label="Cerrar misiones">✕</button></div>
      <h3 class="epic-modal-section">⚡ Misiones del día <span>se renuevan cada día</span></h3>
      <div class="epic-missions">${m.map(x=>{const done=!!extra.claimed[`${nowDay()}:${x.id}`];return `<article class="epic-mission"><span class="epic-icon">${x.icon}</span><div class="epic-mission-info"><strong>${clean(x.name)}</strong><small>${clean(x.goal)}</small></div><button class="epic-claim" type="button" data-epic="claim:${x.id}" ${!x.ok||done?'disabled':''}>${done?'✓ Cobrado':x.ok?`+${x.score} XP`:'Pendiente'}</button></article>`;}).join('')}</div>
      <h3 class="epic-modal-section">🏆 Insignias <span>${wins}/${a.length} desbloqueadas</span></h3>
      <div class="epic-badges">${a.map(x=>`<div class="epic-badge ${x.ok?'unlocked':'dimmed'}"><span>${x.icon}</span><b>${clean(x.name)}</b><small>${clean(x.text)}</small></div>`).join('')}</div>
      <div class="epic-modal-footer">Los puntos, las misiones y las insignias se guardan únicamente en este navegador.</div>`;
  }
  function openModal(){
    if(state.modal)return;
    state.modal=true;state.previousFocus=document.activeElement;
    const screen=$('#epicOverlay');screen.hidden=false;
    renderModal();document.body.classList.add('epic-modal-open');
    screen.querySelector('.epic-close')?.focus();
  }
  function closeModal(){state.modal=false;const s=$('#epicOverlay');if(s)s.hidden=true;document.body.classList.remove('epic-modal-open');state.previousFocus?.focus?.();}
  function dismissIntro(){const el=$('#epicIntro');if(el)el.hidden=true;extra.introSeen=true;persist(EXTRA,extra);}
  function setup(){
    const dock=document.createElement('div');dock.className='epic-dock';dock.innerHTML=`<button class="epic-sound" type="button" data-epic="sound" aria-label="Activar o desactivar sonidos">🔇 Sonido</button><button class="epic-missions-btn" type="button" data-epic="open"><span id="epicNotification" class="epic-notice" hidden></span>🏅 Misiones</button>`;
    document.body.append(dock);
    const overlay=document.createElement('div');overlay.className='epic-overlay';overlay.id='epicOverlay';overlay.hidden=true;
    overlay.innerHTML='<div class="epic-panel" id="epicPanel" role="dialog" aria-modal="true" aria-label="Misiones e insignias"></div>';document.body.append(overlay);
    const rankNode=document.createElement('span');rankNode.className='epic-rank';rankNode.id='epicRank';rankNode.textContent='🌱 Aprendiz';
    if($('#gameRoot')){$('.top-actions')?.prepend(rankNode);}else{$('.top-right')?.append(rankNode);}
    const snd=$('.epic-sound');snd.textContent=extra.sound?'🔊 Sonido':'🔇 Sonido';snd.setAttribute('aria-pressed',String(extra.sound));
    document.addEventListener('click',e=>{
      const t=e.target.closest('[data-epic]');if(t){const cmd=t.dataset.epic;
        if(cmd==='open')openModal();if(cmd==='close')closeModal();if(cmd==='intro')dismissIntro();
        if(cmd==='sound'){extra.sound=!extra.sound;persist(EXTRA,extra);snd.textContent=extra.sound?'🔊 Sonido':'🔇 Sonido';snd.setAttribute('aria-pressed',String(extra.sound));if(extra.sound)sound('tap');}
        if(cmd.startsWith('claim:'))claim(cmd.slice(6));return;
      }
      if(e.target===$('#epicOverlay'))closeModal();
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.modal)closeModal();});
    window.addEventListener('storage',e=>{if([PROFILE,GAMES,EXTRA].includes(e.key))refresh();});
    window.addEventListener('medyte:progress',refresh);window.addEventListener('medyte:bonus',refresh);
    refresh();
    // Presentación opcional, solo una vez en el dispositivo.
    if(!extra.introSeen){
      const intro=document.createElement('div');intro.id='epicIntro';intro.className='epic-intro';intro.innerHTML=`<div class="epic-intro-stars" aria-hidden="true"></div><div class="epic-intro-card"><img src="logo.jpg" alt="Emblema MEDYTE ACADEMY"><span class="epic-overline">EDICIÓN ÉPICA · 2026</span><h1>Tu aventura<br><em>comienza aquí.</em></h1><p>Mil preguntas, dos mundos de juegos, misiones diarias e insignias por tus logros.</p><button type="button" class="epic-enter" data-epic="intro">✨ ¡Entrar a MEDYTE!</button><small>El sonido está apagado por defecto. Puedes activarlo cuando quieras.</small></div>`;
      document.body.append(intro);
    }
  }
  window.MedyteEpic={sound,celebrate,refresh,rank};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
