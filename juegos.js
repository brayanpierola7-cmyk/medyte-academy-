/* MEDYTE GAMES · Dos minijuegos educativos integrados con el perfil local del campus.
   Sin cuentas nuevas ni comunicaciones de red. Funciona en GitHub Pages. */
(() => {
  'use strict';
  const root = document.getElementById('gameRoot');
  const bank = Array.isArray(window.MEDYTE_QUESTIONS) ? window.MEDYTE_QUESTIONS : [];
  const catalog = Array.isArray(window.MEDYTE_CATALOG) ? window.MEDYTE_CATALOG : [];
  const PROFILE_KEY = 'medyte_demo_estatica_v1';
  const GAMES_KEY = 'medyte_games_v1';
  const dateLocal = () => {const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const readStore = key => {try { return JSON.parse(localStorage.getItem(key) || 'null'); }catch { return null; }};
  const saveStore = (key, value) => {try { localStorage.setItem(key,JSON.stringify(value));return true; }catch { announce('Este navegador no permite guardar el progreso.');return false; }};
  const shuffle = data => {const a = [...data]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const getProfile = () => {
    const p = readStore(PROFILE_KEY);
    const profile = p && typeof p === 'object' && !Array.isArray(p) ? p : {};
    profile.xp = Math.max(0, Number(profile.xp) || 0);
    profile.history = Array.isArray(profile.history) ? profile.history : [];
    profile.mistakes = Array.isArray(profile.mistakes) ? profile.mistakes : [];
    profile.favorites = Array.isArray(profile.favorites) ? profile.favorites : [];
    profile.dailyHistory = profile.dailyHistory && typeof profile.dailyHistory === 'object' ? profile.dailyHistory : {};
    return profile;
  };
  const newProgress = () => ({adventure:{},anatomy:{}});
  const existing = readStore(GAMES_KEY);
  const progress = {...newProgress(), ...(existing && typeof existing==='object' && !Array.isArray(existing) ? existing : {})};
  if(!progress.adventure || typeof progress.adventure !== 'object') progress.adventure={};
  if(!progress.anatomy || typeof progress.anatomy !== 'object') progress.anatomy={};
  const saveProgress = () => { const saved=saveStore(GAMES_KEY, progress); window.dispatchEvent(new Event('medyte:progress')); return saved; };
  const getStars = score => score >= 100 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
  const starsText = n => '★'.repeat(n) + '☆'.repeat(3-n);
  const btn = (name,action,cls='btn-outline') => `<button type="button" class="btn ${cls}" data-action="${escapeHtml(action)}">${name}</button>`;
  const eyebrow = s => `<span class="eyebrow">${escapeHtml(s)}</span>`;
  const intro = (short,title,detail) => `<section class="page-head"><div>${eyebrow(short)}<h1>${escapeHtml(title)}</h1><p>${escapeHtml(detail)}</p></div><span class="pill">✦ Gana XP jugando</span></section>`;
  const SUBJECTS = [
    {id:'bio',name:'Bosque de la Biología',subject:'Biología',icon:'🌿',desc:'Descubre la vida y sus sistemas.'},
    {id:'qui',name:'Laboratorio de Química',subject:'Química',icon:'⚗️',desc:'Resuelve los misterios de la materia.'},
    {id:'fis',name:'Valle de la Física',subject:'Física',icon:'⚡',desc:'Domina las leyes del movimiento.'},
    {id:'mat',name:'Montañas Matemáticas',subject:'Matemáticas',icon:'🔢',desc:'Supera el reto de los números.'},
    {id:'len',name:'Biblioteca de Lenguaje',subject:'Lenguaje',icon:'📚',desc:'Haz del lenguaje tu mejor aliado.'},
    {id:'final',name:'Templo del Saber',subject:'Desafío final',icon:'🏆',desc:'Pon a prueba las cinco materias.'}
  ];
  const ANATOMY_LEVELS = [
    {id:'vitales',name:'Órganos principales',icon:'🫀',desc:'Localiza seis órganos y estructuras importantes del cuerpo.',targets:[
      {id:'cerebro',name:'Cerebro',x:50,y:12,icon:'🧠',fact:'El cerebro coordina funciones corporales y procesa información.'},
      {id:'pulmones',name:'Pulmones',x:40,y:37,icon:'🫁',fact:'Los pulmones realizan el intercambio de oxígeno y dióxido de carbono.'},
      {id:'corazon',name:'Corazón',x:56,y:43,icon:'❤️',fact:'El corazón impulsa la sangre a través del sistema circulatorio.'},
      {id:'higado',name:'Hígado',x:43,y:53,icon:'🟤',fact:'El hígado participa en el metabolismo y produce bilis.'},
      {id:'estomago',name:'Estómago',x:58,y:60,icon:'🟠',fact:'El estómago mezcla los alimentos con los jugos gástricos.'},
      {id:'intestino',name:'Intestino delgado',x:50,y:72,icon:'〰️',fact:'El intestino delgado absorbe gran parte de los nutrientes.'}
    ]},
    {id:'digestivo',name:'Sistema digestivo',icon:'🥗',desc:'Aprende la ubicación aproximada de cinco estructuras digestivas.',targets:[
      {id:'boca',name:'Boca',x:50,y:19,icon:'👄',fact:'La digestión comienza en la boca con la masticación y la saliva.'},
      {id:'esofago',name:'Esófago',x:50,y:30,icon:'↕️',fact:'El esófago transporta el alimento hacia el estómago.'},
      {id:'higado',name:'Hígado',x:43,y:53,icon:'🟤',fact:'El hígado produce bilis, que facilita la digestión de las grasas.'},
      {id:'estomago',name:'Estómago',x:58,y:60,icon:'🟠',fact:'El estómago comienza la digestión química de muchas proteínas.'},
      {id:'intestino',name:'Intestino delgado',x:50,y:72,icon:'〰️',fact:'La mayoría de los nutrientes pasan a la sangre en el intestino delgado.'}
    ]},
    {id:'control',name:'Control y eliminación',icon:'🧠',desc:'Identifica cuatro estructuras nerviosas y urinarias.',targets:[
      {id:'cerebro',name:'Cerebro',x:50,y:12,icon:'🧠',fact:'El cerebro interpreta estímulos y permite realizar movimientos voluntarios.'},
      {id:'medula',name:'Médula espinal',x:50,y:44,icon:'⚡',fact:'La médula espinal comunica el encéfalo con gran parte del cuerpo.'},
      {id:'rinones',name:'Riñones',x:40,y:61,icon:'🫘',fact:'Los riñones filtran la sangre y producen orina.'},
      {id:'vejiga',name:'Vejiga urinaria',x:50,y:79,icon:'💧',fact:'La vejiga almacena temporalmente la orina.'}
    ]}
  ];
  let adventureMode = 'normal';
  let adventureTimer = null;
  let view = 'home';
  let adventure = null;
  let anatomy = null;
  let toastTimeout = null;
  function announce(msg){const el=document.getElementById('toast');el.textContent=msg;el.hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.hidden=true,3200);}
  function refreshXp(){document.getElementById('totalXp').textContent=`✦ ${Math.floor(getProfile().xp)} XP`;}
  function show(html,section){clearInterval(adventureTimer);adventureTimer=null;root.innerHTML=html;view=section;refreshXp();window.scrollTo({top:0,behavior:'instant'});}
  function storeXP(amount,addHistory){const p=getProfile();p.xp+=amount;
    if(addHistory){p.history=[addHistory,...p.history].slice(0,50);
      const mistakes=new Set(p.mistakes);
      for(const answer of addHistory.items){if(answer.answer===answer.correct) mistakes.delete(answer.id);else mistakes.add(answer.id);}
      p.mistakes=[...mistakes];
    }
    saveStore(PROFILE_KEY,p);refreshXp();window.dispatchEvent(new Event('medyte:progress'));
  }
  function home(){show(`<div class="hero epic-games-hero"><div>${eyebrow('MEDYTE ACADEMY · EDICIÓN ÉPICA')}<h1>El conocimiento<br><em>es tu superpoder.</em></h1><p>Dos mundos inmersivos. Supera desafíos, consigue estrellas, mantén tus combos y desbloquea insignias. Lo que aprendes hoy te acompaña al examen.</p><div class="btn-row">${btn('🗺️ Explorar los seis mundos →','av-map','btn-gold btn-lg')}${btn('🫀 Empezar anatomía','an-levels','btn-outline btn-lg')}</div><div class="feature-chips"><span>🎯 Misiones diarias</span><span>🏆 Rangos y medallas</span><span>🔊 Efectos opcionales</span></div></div><div class="hero-art" aria-hidden="true">🌌</div></div>
    <div class="section-heading"><h2>Tu siguiente misión</h2><span class="muted small">Elige tu desafío</span></div>
    <section class="game-grid" aria-label="Minijuegos disponibles"><article class="game-card"><div><div class="game-icon">🗺️</div>${eyebrow('MUNDO 01 · EXPLORACIÓN')}<h3>Aventura del Conocimiento</h3><p>Seis regiones, tres corazones, rachas de aciertos y un jefe final. Entra a contrarreloj para subir la emoción.</p></div><div class="card-bottom"><span class="card-number">6 ETAPAS · ⭐ ESTRELLAS · 🔥 COMBOS</span>${btn('Iniciar aventura →','av-map','btn-gold')}</div></article>
    <article class="game-card anatomy-card"><div><div class="game-icon">🫀</div>${eyebrow('MUNDO 02 · DESCUBRIMIENTO')}<h3>Anatomía Challenge</h3><p>Encuentra órganos en una silueta interactiva. Gana precisión, activa pistas especiales y completa niveles con una racha perfecta.</p></div><div class="card-bottom"><span class="card-number">3 NIVELES · 🔎 PISTAS · 🧠 PRECISIÓN</span>${btn('Entrar al laboratorio →','an-levels','btn-gold')}</div></article></section>
    <section class="epic-hub-note"><span>🎁</span><div><strong>¡Tienes un centro de recompensas!</strong><p>Abre el botón <b>🏅 Misiones</b> de la esquina inferior derecha para ver retos diarios, rangos e insignias.</p></div></section>
    <p class="note">Tu progreso se guarda en el navegador de este dispositivo. La versión estática no crea cuentas ni clasificaciones mundiales.</p>`, 'home');}
  const unlocked = i => i===0 || getStars(progress.adventure[SUBJECTS[i-1].id]?.best || 0)>0;
  function adventureMap(){adventure=null;
    const done=SUBJECTS.filter(s=>getStars(progress.adventure[s.id]?.best || 0)>0).length;
    const stars=SUBJECTS.reduce((n,s)=>n+getStars(progress.adventure[s.id]?.best || 0),0);
    show(`<div class="backline">${btn('← Todos los juegos','home','btn-quiet')}</div>
     ${intro('JUEGO 01 · EXPLORACIÓN','Aventura del Conocimiento','Completa un mundo para desbloquear el siguiente. Consigue al menos 60% de aciertos para avanzar. Puedes repetir los niveles.')}
     <div class="overview-stats"><div class="stat"><strong>${done}/6</strong><small>Mundos superados</small></div><div class="stat"><strong>${stars}/18</strong><small>Estrellas conseguidas</small></div><div class="stat"><strong>+10</strong><small>XP por acierto</small></div></div>
     <div class="epic-mode-selector"><strong>⚡ DIFICULTAD:</strong><button type="button" data-action="mode:normal" aria-pressed="${adventureMode==='normal'}">🧭 Exploración tranquila</button><button type="button" data-action="mode:timer" aria-pressed="${adventureMode==='timer'}">⏱️ Contrarreloj · 20 s</button><span class="muted small">Dispones de tres corazones por etapa.</span></div>
     ${SUBJECTS.filter(s=>s.id==='final').some(s=>unlocked(5))?'<div class="epic-boss-banner">👑 DESAFÍO FINAL DISPONIBLE · ¡Enfrenta al guardián del saber!</div>':''}
     <div class="map-path" aria-label="Mapa de niveles">${SUBJECTS.map((s,i)=>{const available=unlocked(i),r=progress.adventure[s.id]||{},best=r.best||0;return `<button class="island ${!available?'locked':''} ${s.id==='final'?'final':''}" type="button" data-stage="${s.id}" ${!available?'disabled aria-label="Nivel '+(i+1)+' bloqueado. Supera el anterior"':''}>
       <span class="level-no">ETAPA ${i+1}</span>${!available?'<span class="lock">🔒</span>':''}<span class="island-icon" aria-hidden="true">${available?s.icon:'🔒'}</span><strong>${escapeHtml(s.name)}</strong><small>${available?(best?`Récord: ${best}%`:'Disponible para jugar'):'Supera la etapa anterior'}</small><span class="stars" aria-label="${getStars(best)} de 3 estrellas">${starsText(getStars(best))}</span></button>`;}).join('')}</div>
     <p class="note">Cada etapa tiene 5 preguntas (la última tiene 10). Las preguntas se eligen al azar del banco de MEDYTE ACADEMY; respondes con opciones A, B, C y D.</p>`, 'av-map');}
  function startAdventure(id){const index=SUBJECTS.findIndex(s=>s.id===id);if(index<0||!unlocked(index))return;
    const s=SUBJECTS[index],pool=bank.filter(q=>id==='final' ? true : q.topic.startsWith(id));
    if(pool.length<(id==='final'?10:5)){announce('No hay suficientes preguntas para esta etapa.');return;}
    const qty=id==='final'?10:5;
    let questions;
    if(id==='final'){
      questions=SUBJECTS.filter(x=>x.id!=='final').flatMap(x=>shuffle(bank.filter(q=>q.topic.startsWith(x.id))).slice(0,2));
      questions=shuffle(questions);
    }else questions=shuffle(pool).slice(0,qty);
    adventure={id,subject:s,questions,pos:0,answers:Array(qty).fill(null),answerOrders:questions.map(()=>shuffle([0,1,2,3])),hearts:3,combo:0,maxCombo:0,bonus:0,mode:adventureMode,deadline:null};
    renderAdventureQuestion();
  }
  function renderAdventureQuestion(){if(!adventure)return;
    const g=adventure,q=g.questions[g.pos],chosen=g.answers[g.pos],order=g.answerOrders[g.pos],hasAnswer=chosen!==null;
    const good=hasAnswer&&chosen===q.c,dead=g.hearts<=0,seconds=g.mode==='timer'?`<span class="epic-timer" id="adventureClock">⏱️ ${hasAnswer?'—':'20 s'}</span>`:'';
    show(`<div class="backline">${btn('← Salir al mapa','av-map','btn-quiet')}</div><div class="page-head"><div>${eyebrow('AVENTURA · '+g.subject.subject.toUpperCase())}<h1>${g.subject.icon} ${escapeHtml(g.subject.name)}</h1><p>${g.id==='final'?'👑 ¡Enfrentas al guardián del saber! Supera las diez preguntas.':'Completa la etapa para desbloquear el siguiente mundo.'}</p></div><span class="pill">${g.id==='final'?'👑 JEFE FINAL':'⭐ 3 estrellas posibles'}</span></div>
      <div class="epic-hud"><span class="epic-heart" id="adventureHearts">${'❤️'.repeat(g.hearts)}${'🖤'.repeat(3-g.hearts)} · ${g.hearts}/3 vidas</span><span class="epic-combo" id="adventureCombo">🔥 Combo ×${g.combo}</span>${seconds}<span>✦ Bonus +${g.bonus} XP</span></div>
      <div class="challenge-layout"><section><div class="quiz-progress"><strong>Pregunta ${g.pos+1} de ${g.questions.length}</strong><span>${Math.round(g.pos/g.questions.length*100)}% completado</span></div><div class="track"><span style="width:${Math.round(g.pos/g.questions.length*100)}%"></span></div>
        <div class="question-box" style="margin-top:14px">${eyebrow('DESAFÍO '+(g.pos+1))}<h2>${escapeHtml(q.q)}</h2><div class="answer-list">${order.map((orig,i)=>`<button type="button" class="answer-option ${hasAnswer ? (orig===q.c?'correct':orig===chosen?'incorrect':''):''}" data-answer="${orig}" ${hasAnswer?'disabled':''}><span class="letter">${'ABCD'[i]}</span><span>${escapeHtml(q.a[orig])}</span></button>`).join('')}</div>
        ${hasAnswer?`<div class="feedback ${good?'good':'bad'}"><strong>${good?'✅ ¡Respuesta correcta!':chosen===-1?'⌛ ¡Tiempo agotado!':'💡 Un error también enseña'}</strong><p>${escapeHtml(q.e||'La opción correcta está resaltada en verde.')}</p></div><div class="btn-row" style="margin-top:15px">${btn(dead?'💔 Ver resultado →':g.pos===g.questions.length-1?'🏆 Ver mis resultados →':'Siguiente pregunta →','av-next','btn-gold btn-lg')}</div>`:''}</div></section>
        <aside class="panel quiz-side"><h3>🎯 Estado de la misión</h3><p class="muted">${escapeHtml(g.subject.desc)}</p><div class="info-row"><span>Etapa</span><strong>${SUBJECTS.findIndex(x=>x.id===g.id)+1} / 6</strong></div><div class="info-row"><span>Aciertos</span><strong>${g.answers.filter((ans,i)=>ans!==null&&ans===g.questions[i].c).length}</strong></div><div class="info-row"><span>Modo</span><strong>${g.mode==='timer'?'Contrarreloj':'Exploración'}</strong></div><div class="learning-card"><strong>✨ Reglas</strong><p>Un error cuesta un corazón. Cada tercera respuesta correcta seguida te da +5 XP de combo. Sin corazones, la misión termina.</p></div></aside>
      </div>`, 'av-playing');
    if(g.mode==='timer'&&!hasAnswer){
      g.deadline=Date.now()+20000;
      adventureTimer=setInterval(()=>{
        if(!adventure||adventure!==g||g.answers[g.pos]!==null){clearInterval(adventureTimer);adventureTimer=null;return;}
        const left=Math.max(0,g.deadline-Date.now());const clock=document.getElementById('adventureClock');
        if(clock)clock.textContent=`⏱️ ${Math.ceil(left/1000)} s`;
        if(left<=0){clearInterval(adventureTimer);adventureTimer=null;answerAdventure(-1);}
      },200);
    }
  }
  function answerAdventure(index){const g=adventure;if(!g||g.answers[g.pos]!==null)return;
    const q=g.questions[g.pos];if(index!==-1&&(!Number.isInteger(index)||index<0||index>=q.a.length))return;
    clearInterval(adventureTimer);adventureTimer=null;
    g.answers[g.pos]=index;
    if(index===q.c){g.combo++;g.maxCombo=Math.max(g.maxCombo,g.combo);if(g.combo>0&&g.combo%3===0){g.bonus+=5;announce('🔥 ¡Combo de 3! +5 XP extra');}window.MedyteEpic?.sound('good');}
    else{g.hearts=Math.max(0,g.hearts-1);g.combo=0;window.MedyteEpic?.sound('bad');}
    renderAdventureQuestion();
  }
  function nextAdventure(){if(!adventure||adventure.answers[adventure.pos]===null)return;
    if(adventure.hearts<=0){finishAdventure(true);return;}
    if(adventure.pos<adventure.questions.length-1){adventure.pos++;renderAdventureQuestion();}else finishAdventure(false);
  }
  function finishAdventure(endedEarly=false){const g=adventure;if(!g)return;
    if(!endedEarly&&g.answers.some(a=>a===null))return;
    const right=g.answers.filter((answer,i)=>answer===g.questions[i].c).length;
    const score=Math.round(right/g.questions.length*100),stars=endedEarly?0:getStars(score);
    const previous=progress.adventure[g.id]||{best:0,plays:0};
    const firstClear=stars>0&&!(previous.best>=60);
    const xp=right*10+g.bonus+(firstClear?20:0);
    progress.adventure[g.id]={best:Math.max(previous.best||0,endedEarly?0:score),plays:(previous.plays||0)+1,last:score,lastDate:dateLocal(),maxCombo:Math.max(previous.maxCombo||0,g.maxCombo)};
    saveProgress();
    const history={date:new Date().toISOString(),correct:right,total:g.questions.length,mode:'game-adventure',scope:g.id,items:g.questions.map((q,i)=>({id:q.id,answer:g.answers[i],correct:q.c})).filter(v=>v.answer!==null),daily:false,timedOut:endedEarly};
    storeXP(xp,history);adventure=null;
    if(stars>0)window.MedyteEpic?.celebrate(g.id==='final'?'¡Derrotaste al jefe final!':'¡Mundo conquistado!');
    show(`<div class="results panel"><span class="result-emoji">${stars>0?(g.id==='final'?'👑':'🏆'):endedEarly?'💔':'🧭'}</span>${eyebrow('MISIÓN FINALIZADA')}<h1>${stars>0?'¡Mundo conquistado!':endedEarly?'¡Sin corazones!':'¡Sigue explorando!'}</h1><p>${escapeHtml(g.subject.name)}</p><div class="score-big">${right}/${g.questions.length} · ${score}%</div><div class="result-stars">${starsText(stars)}</div><p>${stars>0?'¡Se desbloquea la siguiente etapa!':'Necesitas al menos 60% de aciertos y conservar corazones para desbloquear el siguiente nivel.'}</p>
      <div class="overview-stats"><div class="stat"><strong>+${xp}</strong><small>XP ganado</small></div><div class="stat"><strong>🔥 ×${g.maxCombo}</strong><small>Mejor combo</small></div><div class="stat"><strong>${g.hearts} ❤️</strong><small>Vidas restantes</small></div></div>
      ${firstClear?'<div class="epic-boss-banner">🎁 ¡Cofre de primera victoria! Has recibido +20 XP extra.</div>':''}
      <div class="btn-row">${btn('🗺️ Volver al mapa','av-map','btn-gold')}${btn('Repetir etapa','av-retry:'+g.id,'btn-outline')}${btn('Ver mi progreso','campus-progress','btn-quiet')}</div></div>`, 'av-result');
  }
  function anatomyLevels(){anatomy=null;
    const wins=ANATOMY_LEVELS.filter(l=>(progress.anatomy[l.id]?.wins||0)>0).length;
    show(`<div class="backline">${btn('← Todos los juegos','home','btn-quiet')}</div>
      ${intro('JUEGO 02 · CUERPO HUMANO','Anatomía Challenge','Ubica órganos y estructuras en una silueta esquemática del cuerpo. Puedes tocar los marcadores desde tu celular. No necesitas arrastrar objetos.')}
      <div class="overview-stats"><div class="stat"><strong>${wins}/3</strong><small>Niveles completados</small></div><div class="stat"><strong>+12</strong><small>XP por acierto al primer intento</small></div><div class="stat"><strong>+6</strong><small>XP al acertar tras intentos</small></div></div>
      <section class="anatomy-levels">${ANATOMY_LEVELS.map((l,i)=>{const r=progress.anatomy[l.id]||{};return `<article class="panel anatomy-level"><div><div class="level-icon">${l.icon}</div>${eyebrow('NIVEL 0'+(i+1))}<h3>${escapeHtml(l.name)}</h3><p>${escapeHtml(l.desc)}</p></div><div style="width:100%"><p class="small-progress">${r.wins?`Completado ${r.wins} ${r.wins===1?'vez':'veces'} · mejor: ${r.bestFirst||0}/${l.targets.length} al primer intento`:'Aún sin completar'}</p>${btn('Comenzar nivel →','an-start:'+l.id,'btn-gold btn-block')}</div></article>`}).join('')}</section>
      <div class="learning-card"><strong>📘 Importante</strong><p>El cuerpo mostrado es un esquema didáctico, no una representación anatómica a escala. Las posiciones son aproximadas y sirven para estudiar orientación general.</p></div>`, 'an-levels');}
  function anatomySvg(){return `<svg viewBox="0 0 360 510" aria-hidden="true" focusable="false">
      <defs><linearGradient id="silhouette" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2a5871"/><stop offset="1" stop-color="#17344b"/></linearGradient></defs>
      <rect x="1" y="1" width="358" height="508" rx="23" fill="#0e273b" stroke="#335773"/>
      <circle cx="180" cy="62" r="38" fill="url(#silhouette)" stroke="#688c9f" stroke-width="2"/>
      <path d="M165 96 L159 120 Q133 115 114 133 Q89 145 86 180 L70 287 Q68 300 80 306 Q93 311 98 298 L120 206 L125 304 Q131 345 142 371 L150 463 Q150 486 166 486 Q181 484 182 468 L188 380 L196 466 Q198 484 213 484 Q227 484 229 465 L239 372 Q251 345 253 304 L250 206 L272 296 Q278 309 291 305 Q302 300 299 286 L280 180 Q275 145 253 133 Q231 116 202 120 L196 96 Z" fill="url(#silhouette)" stroke="#64899d" stroke-width="2.5"/>
      <path d="M181 124 L181 365 M150 185 Q180 203 214 185 M136 267 Q181 291 243 266" class="body-detail"/>
      <path d="M151 170 Q130 169 132 205 Q136 235 165 242 L174 214 L169 173 Z" class="body-lung"/>
      <path d="M191 173 Q221 165 226 206 Q223 235 192 244 L184 214 Z" class="body-lung"/>
      <path d="M179 222 Q189 209 202 221 Q213 237 190 250 Q175 243 179 222" fill="#b7656b77" stroke="#e1a5a855"/>
      <path d="M145 264 Q163 246 188 257 L186 288 L146 295 Z" class="body-organ"/>
      <path d="M192 270 Q223 268 219 303 Q209 320 195 302Z" class="body-organ"/>
      <path d="M160 317 L211 317 L213 364 L161 365 Z" fill="#c49a6640" stroke="#d3b28170" stroke-dasharray="5 5"/>
      <path d="M173 330 Q191 325 198 334 T177 349 T198 363" fill="none" stroke="#d3b28180" stroke-width="3"/>
      <path d="M167 49 Q180 38 193 48 M163 66 Q179 58 199 69 M178 45 L182 85" stroke="#bc91c480" stroke-width="3" fill="none"/>
      <path d="M180 107 L180 218" stroke="#bbd5db80" stroke-width="3" stroke-dasharray="6 6"/>
      <path d="M180 348 L180 402" stroke="#bbd5db40" stroke-width="3" stroke-dasharray="6 6"/>
      </svg>`;}
  function anatomyQuestion(name){
    const low=name.toLowerCase();
    if(['Pulmones','Riñones'].includes(name))return `¿Dónde están los ${low}?`;
    return `¿Dónde está ${['Boca','Médula espinal','Vejiga urinaria'].includes(name)?'la':'el'} ${low}?`;
  }
  function startAnatomy(id){const level=ANATOMY_LEVELS.find(l=>l.id===id);if(!level)return;
    anatomy={level,order:shuffle(level.targets),index:0,matched:new Set(),firstTry:{},earned:0,lastFact:null,wrong:false,hintsLeft:2,usedHint:{},combo:0,maxCombo:0};renderAnatomyPlay();}
  function renderAnatomyPlay(){if(!anatomy)return;const a=anatomy,level=a.level,current=a.order[a.index];
    show(`<div class="backline">${btn('← Elegir otro nivel','an-levels','btn-quiet')}</div>
      <div class="page-head"><div>${eyebrow('ANATOMÍA CHALLENGE · '+level.name.toUpperCase())}<h1>🫀 Encuentra el órgano</h1><p>Observa la figura y toca el marcador que corresponde al órgano indicado.</p></div><span class="pill">${a.index+1} / ${a.order.length}</span></div>
      <div class="epic-hud"><span class="epic-combo">🔥 Racha de precisión: ${a.combo}</span><span>💡 Pistas disponibles: ${a.hintsLeft}/2</span><span>⭐ +${a.earned} XP</span></div>
      <div class="anatomy-layout"><section class="panel"><div class="diagram-wrap">${anatomySvg()}
        ${level.targets.map((target,i)=>`<button type="button" class="hotspot ${a.matched.has(target.id)?'matched':''}" style="--x:${target.x}%;--y:${target.y}%" data-spot="${escapeHtml(target.id)}" aria-label="Zona ${i+1}" ${a.matched.has(target.id)?'disabled':''}>${a.matched.has(target.id)?'✓':i+1}</button>`).join('')}</div><p class="diagram-caption">Esquema frontal y simplificado · Ubicaciones aproximadas</p></section>
      <aside><div class="anatomy-task">${eyebrow('MISIÓN ACTUAL')}<div class="task-icon">${current.icon}</div><h2>${escapeHtml(anatomyQuestion(current.name))}</h2><p>Arrastra la tarjeta del órgano al cuerpo, o simplemente toca el marcador correcto.</p><div class="epic-organ-token" data-organ-drag="${escapeHtml(current.id)}" role="img" aria-label="Arrastra ${escapeHtml(current.name)} a su ubicación">${current.icon} <strong>${escapeHtml(current.name)}</strong><span>↗ Arrastrar al cuerpo</span></div>
        <div class="mini-progress-label"><span>Órganos encontrados</span><strong>${a.index}/${a.order.length}</strong></div><div class="track"><span style="width:${Math.round(a.index/a.order.length*100)}%"></span></div>
        <div class="anatomy-tip" id="anatomyFeedback" role="status">🔎 Toca una de las zonas numeradas. Si te equivocas, puedes intentar otra vez.</div><button type="button" class="epic-an-hint" data-action="an-hint" ${a.hintsLeft<=0||a.usedHint[current.id]?'disabled':''}>✨ Activar pista (${a.hintsLeft} restantes)</button><p class="epic-hint-note">Las pistas resaltan la zona durante unos segundos; acertar con pista da +3 XP.</p></div>
        ${a.lastFact?`<div class="learning-card"><strong>📘 Lo que aprendiste</strong><p>${escapeHtml(a.lastFact)}</p></div>`:''}
        <div class="learning-card"><strong>⭐ Recompensa</strong><p>+12 XP al acertar al primer intento; +6 XP si necesitas más intentos.</p><p><b>XP de este nivel: ${a.earned}</b></p></div></aside></div>`, 'an-playing');}
  function anatomyHint(){const a=anatomy;if(!a||a.hintsLeft<=0)return;
    const correct=a.order[a.index];if(!correct||a.usedHint[correct.id])return;
    a.hintsLeft--;a.usedHint[correct.id]=true;a.firstTry[correct.id]=false;
    const spot=[...root.querySelectorAll('[data-spot]')].find(el=>el.dataset.spot===correct.id);
    if(spot){spot.classList.add('target-hint');setTimeout(()=>spot.classList.remove('target-hint'),2700);}
    const feedback=document.getElementById('anatomyFeedback');if(feedback)feedback.textContent='✨ Pista activada: ¡busca el marcador que brilla!';
    const hint=root.querySelector('[data-action="an-hint"]');if(hint){hint.disabled=true;hint.textContent=`✨ Pistas restantes: ${a.hintsLeft}`;}
    window.MedyteEpic?.sound('tap');
  }
  function selectAnatomySpot(id){const a=anatomy;if(!a||!a.order[a.index])return;
    const correct=a.order[a.index];if(a.matched.has(id))return;
    const spot=[...root.querySelectorAll('[data-spot]')].find(el=>el.dataset.spot===id);
    if(id!==correct.id){a.firstTry[correct.id]=false;a.wrong=true;a.combo=0;window.MedyteEpic?.sound('bad');
      if(spot){spot.classList.remove('wrong');void spot.offsetWidth;spot.classList.add('wrong');}
      const feedback=document.getElementById('anatomyFeedback');if(feedback)feedback.textContent='Todavía no. Revisa el cuerpo y prueba otra zona. ¡Puedes conseguirlo!';return;}
    const wasFirstTry=a.firstTry[correct.id]!==false;
    const gain=a.usedHint[correct.id]?3:wasFirstTry?12:6;
    a.earned+=gain;a.combo++;a.maxCombo=Math.max(a.maxCombo,a.combo);
    a.matched.add(correct.id);a.lastFact=correct.fact;a.index++;
    window.MedyteEpic?.sound('good');
    announce(`✓ ${correct.name} · +${gain} XP ${a.combo>=3?'· 🔥 Gran racha':''}`);
    if(a.index===a.order.length)finishAnatomy();else renderAnatomyPlay();
  }
  function finishAnatomy(){const a=anatomy;if(!a)return;
    const first=a.order.filter(q=>a.firstTry[q.id]!==false).length,correct=a.order.length;
    const old=progress.anatomy[a.level.id] || {wins:0,bestFirst:0};
    const firstClear=!old.wins;
    const xp=a.earned+(firstClear?25:0);
    progress.anatomy[a.level.id]={wins:(old.wins||0)+1,bestFirst:Math.max(old.bestFirst||0,first),lastFirst:first,lastDate:dateLocal(),bestCombo:Math.max(old.bestCombo||0,a.maxCombo)};
    saveProgress();storeXP(xp,null);anatomy=null;
    window.MedyteEpic?.celebrate('¡Anatomía completada!');
    show(`<section class="results panel"><span class="result-emoji">🫀</span>${eyebrow('ANATOMÍA CHALLENGE COMPLETADO')}<h1>¡Misión cumplida!</h1><p>${escapeHtml(a.level.name)} · Identificaste todas las estructuras.</p>
      <div class="score-big">${correct}/${correct}</div><div class="overview-stats"><div class="stat"><strong>+${xp}</strong><small>XP añadido al campus</small></div><div class="stat"><strong>${first}/${correct}</strong><small>Al primer intento</small></div><div class="stat"><strong>🔥 ×${a.maxCombo}</strong><small>Mejor racha</small></div></div>
      ${firstClear?'<div class="epic-boss-banner">🎁 ¡Primera misión completada! +25 XP de bonificación.</div>':''}
      <p>Este esquema muestra ubicaciones aproximadas y no representa una anatomía a escala.</p>
      <div class="btn-row">${btn('Otros niveles →','an-levels','btn-gold')}${btn('Repetir nivel','an-retry:'+a.level.id,'btn-outline')}${btn('Volver a los juegos','home','btn-quiet')}</div></section>`, 'an-result');
  }
  function route(action){
    if(action==='home'){home();return;}if(action==='av-map'){adventureMap();return;}
    if(action==='an-levels'){anatomyLevels();return;}
    if(action==='an-hint'){anatomyHint();return;}
    if(action==='mode:normal'||action==='mode:timer'){adventureMode=action.slice(5);adventureMap();return;}
    if(action==='av-next'){nextAdventure();return;}
    if(action==='campus-progress'){window.location.href='index.html#progreso';return;}
    if(action.startsWith('av-retry:')){startAdventure(action.slice(9));return;}
    if(action.startsWith('an-start:')){startAnatomy(action.slice(9));return;}
    if(action.startsWith('an-retry:')){startAnatomy(action.slice(9));return;}
  }
  // Arrastre opcional con mouse o dedo. La selección por botones continúa disponible.
  let organDrag=null;
  document.addEventListener('pointerdown',event=>{
    const token=event.target.closest('[data-organ-drag]');
    if(!token||!anatomy||event.button>0)return;
    const id=token.dataset.organDrag;
    if(anatomy.order[anatomy.index]?.id!==id)return;
    event.preventDefault();
    const ghost=document.createElement('div');ghost.className='epic-drag-ghost';
    ghost.textContent=token.textContent.replace('↗ Arrastrar al cuerpo','').trim();
    document.body.append(ghost);organDrag={id,ghost,pointerId:event.pointerId};
    ghost.style.left=event.clientX+'px';ghost.style.top=event.clientY+'px';
  });
  document.addEventListener('pointermove',event=>{
    if(!organDrag||event.pointerId!==organDrag.pointerId)return;
    organDrag.ghost.style.left=event.clientX+'px';organDrag.ghost.style.top=event.clientY+'px';
  });
  function dropOrgan(event){
    if(!organDrag||event.pointerId!==organDrag.pointerId)return;
    const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-spot]');
    organDrag.ghost.remove();organDrag=null;
    if(target)selectAnatomySpot(target.dataset.spot);
  }
  document.addEventListener('pointerup',dropOrgan);
  document.addEventListener('pointercancel',()=>{if(organDrag){organDrag.ghost.remove();organDrag=null;}});
  document.addEventListener('click',event=>{
    const ans=event.target.closest('[data-answer]');if(ans){answerAdventure(Number(ans.dataset.answer));return;}
    const spot=event.target.closest('[data-spot]');if(spot){selectAnatomySpot(spot.dataset.spot);return;}
    const stage=event.target.closest('[data-stage]');if(stage){startAdventure(stage.dataset.stage);return;}
    const action=event.target.closest('[data-action]');if(action){route(action.dataset.action);return;}
  });
  window.addEventListener('keydown',event=>{
    if(view==='av-playing'&&/^[1-4]$/.test(event.key)&&!/input|textarea|select/i.test(event.target.tagName)){
      const i=Number(event.key)-1;if(adventure&&adventure.answers[adventure.pos]===null)answerAdventure(adventure.answerOrders[adventure.pos][i]);
    }
  });
  window.addEventListener('storage',event=>{if(event.key===PROFILE_KEY)refreshXp();});
  if('serviceWorker' in navigator && location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  if(bank.length<100 || catalog.length===0){show('<div class="panel"><h1>No se pudo cargar el banco de preguntas.</h1><p>Comprueba que preguntas.js esté junto a juegos.html y juegos.js.</p><a class="btn btn-gold" href="index.html">Volver al campus</a></div>','error');return;}
  const page=location.hash.slice(1);
  if(page==='aventura')adventureMap();else if(page==='anatomia')anatomyLevels();else home();
})();
