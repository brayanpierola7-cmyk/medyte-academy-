/* MEDYTE ACADEMY — Campus interactivo estático para GitHub Pages.
   No envía datos a servidores. El progreso se guarda en el navegador del estudiante. */
(() => {
  'use strict';
  const catalog = Array.isArray(window.MEDYTE_CATALOG) ? window.MEDYTE_CATALOG : [];
  const bank = Array.isArray(window.MEDYTE_QUESTIONS) ? window.MEDYTE_QUESTIONS : [];
  const questionById = new Map(bank.map(q => [q.id,q]));
  const topicById = new Map(catalog.flatMap(s => s.topics.map(t => [t.id,{...t, subject:s.name, subjectId:s.id}])));
  const $ = id => document.getElementById(id);
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;',"'":'&#39;'}[c]));
  const dateKey = () => { const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
  const KEY = 'medyte_demo_estatica_v1'; // Mantener los resultados de la versión anterior.
  const DRAFT_KEY = 'medyte_borrador_v4';
  const blankProfile = () => ({xp:0, history:[], mistakes:[], favorites:[], dailyHistory:{}});
  const readJson = key => {try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  let profile = {...blankProfile(), ...(readJson(KEY)||{})};
  profile.history = Array.isArray(profile.history) ? profile.history : [];
  profile.mistakes = Array.isArray(profile.mistakes) ? profile.mistakes.filter(id=>questionById.has(id)) : [];
  profile.favorites = Array.isArray(profile.favorites) ? profile.favorites.filter(id=>questionById.has(id)) : [];
  profile.dailyHistory = profile.dailyHistory && typeof profile.dailyHistory==='object' ? profile.dailyHistory : {};
  profile.xp = Math.max(0,Number(profile.xp)||0);
  const subjectCount = Object.fromEntries(catalog.map(s=>[s.id,bank.filter(q=>q.topic.startsWith(s.id)).length]));
  const byTopicCount = Object.fromEntries([...topicById.keys()].map(id=>[id,bank.filter(q=>q.topic===id).length]));
  const state = {
    page:'inicio', currentSubject:'bio', quiz:null, lastResult:null, timer:null,
    setup:{scope:'mixed',qty:10,mode:'practice',onlyMistakes:false,onlyFavorites:false},
    library:{search:'',subject:'all',page:1,open:new Set()},
    reviewOpen:new Set()
  };
  function save(){try{localStorage.setItem(KEY,JSON.stringify(profile));window.dispatchEvent(new Event('medyte:progress'));}catch{toast('No se pudo guardar el progreso en este navegador.');}}
  function saveDraft(){try{if(state.quiz)localStorage.setItem(DRAFT_KEY,JSON.stringify({ids:state.quiz.items.map(q=>q.id),answerOrders:state.quiz.answerOrders,answers:state.quiz.answers,revealed:state.quiz.revealed,pos:state.quiz.pos,mode:state.quiz.mode,scope:state.quiz.scope,started:state.quiz.started,deadline:state.quiz.deadline,daily:state.quiz.daily}));else localStorage.removeItem(DRAFT_KEY);}catch{}}
  function recoverDraft(){const raw=readJson(DRAFT_KEY);if(!raw || !Array.isArray(raw.ids) || raw.ids.length>100 || !raw.ids.length)return;
    const items=raw.ids.map(id=>questionById.get(id));if(items.some(v=>!v))return;
    const validOrders=Array.isArray(raw.answerOrders)&&raw.answerOrders.length===items.length&&raw.answerOrders.every(a=>Array.isArray(a)&&a.length===4&&new Set(a).size===4&&a.every(x=>[0,1,2,3].includes(x)));
    if(!validOrders)return;
    state.quiz={items,answerOrders:raw.answerOrders,answers:(Array.isArray(raw.answers)?raw.answers:[]).slice(0,items.length),revealed:(Array.isArray(raw.revealed)?raw.revealed:[]).slice(0,items.length),pos:Math.min(items.length-1,Math.max(0,Number(raw.pos)||0)),mode:['practice','exam','speed'].includes(raw.mode)?raw.mode:'practice',scope:raw.scope||'mixed',started:raw.started||Date.now(),deadline:raw.deadline||null,daily:!!raw.daily};
    while(state.quiz.answers.length<items.length)state.quiz.answers.push(null);
    while(state.quiz.revealed.length<items.length)state.quiz.revealed.push(false);
  }
  recoverDraft();
  const b=(label,action,variant='secondary',extra='')=>`<button type="button" class="btn ${variant} ${extra}" data-action="${e(action)}">${label}</button>`;
  const section=(eyebrow,title,desc)=>`<section class="section-intro"><span class="eyebrow">${e(eyebrow)}</span><h1>${e(title)}</h1><p>${e(desc)}</p></section>`;
  const heading=(eyebrow,title)=>`<div class="section-heading"><div><span class="eyebrow">${e(eyebrow)}</span><h2>${e(title)}</h2></div></div>`;
  const topicName=id=>topicById.has(id)?`${e(topicById.get(id).subject)} · ${e(topicById.get(id).name)}`:'Tema';
  const level=()=>1+Math.floor(profile.xp/200);
  function toast(msg){const el=$('toast');el.textContent=msg;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,4200);}
  function setContent(html,crumb='Inicio'){$('crumb').textContent=crumb;$('view').innerHTML=html;window.scrollTo({top:0,behavior:'instant'});}
  function closeMenu(){$('sidebar').classList.remove('open');$('mobileShade').hidden=true;$('menuToggle').setAttribute('aria-expanded','false');}
  function uiHeader(){$('xpHeader').textContent='✦ '+Math.floor(profile.xp)+' XP';$('levelChip').textContent='Nivel '+level();$('favoritesCount').textContent=profile.favorites.length;}
  function nav(page){state.page=page;closeMenu();uiHeader();document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('current',x.dataset.nav===page||(page==='temas'&&x.dataset.nav==='materias')));
    try{if(page!=='quiz'&&page!=='resultado'&&page!=='temas')history.replaceState(null,'','#'+page);}catch{}
    const views={inicio:home,materias:materias,temas:temas,simulacros:setupView,biblioteca:biblioteca,favoritos:favoritos,progreso:progreso,errores:errores,acerca:acerca,quiz:quizView,resultado:resultado};
    (views[page]||home)();
  }
  function card(subject){const n=subjectCount[subject.id];return `<article class="card subject-card"><div class="card-top"><span class="circle-icon" aria-hidden="true">${subject.icon}</span><span class="pill neutral">${n} preguntas</span></div><h3>${e(subject.name)}</h3><p class="sub">${subject.topics.length} temas del texto guía 2026</p>${b('Ver temario →','subject:'+subject.id,'soft')}</article>`;}
  function home(){const attempted=profile.history.length;
    setContent(`<section class="hero"><div class="hero-copy"><span class="eyebrow">CAMPUS VIRTUAL · ADMISIÓN 2026</span><h1>Entrena tu mente.<br><em>Conquista tus metas.</em></h1><p>Entra al campus de tus retos: cinco materias, simulacros, dos mundos interactivos, premios por constancia y un camino hacia tu objetivo.</p><div class="actions">${b('✦ Empezar a practicar','simulacros','')}${b('Explorar materias →','materias','secondary')}<a class="btn games-home-btn" href="juegos.html">🎮 MEDYTE GAMES →</a></div><div class="hero-proof"><span>✓ Prácticas interactivas</span><span>✓ Para celular</span><span>✓ Progreso personal</span></div></div><div class="hero-logo"><img src="logo.jpg" alt="Logo original de Medyte Academy" loading="eager"></div></section>
    <div class="stats-strip"><div class="stat-card"><div class="stat-symbol">✦</div><div><strong>${bank.length.toLocaleString('es-BO')}</strong><small>Preguntas de práctica</small></div></div><div class="stat-card"><div class="stat-symbol">▦</div><div><strong>${catalog.length}</strong><small>Materias</small></div></div><div class="stat-card"><div class="stat-symbol">◉</div><div><strong>${topicById.size}</strong><small>Temas disponibles</small></div></div><div class="stat-card"><div class="stat-symbol">★</div><div><strong>${attempted}</strong><small>Prácticas realizadas</small></div></div></div>
    ${state.quiz?`<section class="continue-banner"><div><strong>Tu práctica sigue disponible</strong><p>Puedes continuar exactamente donde la dejaste.</p></div>${b('Continuar práctica →','resume','')}</section>`:''}
    <section class="games-highlight"><div class="games-highlight-icon" aria-hidden="true">🗺️</div><div><span class="eyebrow">🌟 EDICIÓN ÉPICA · MEDYTE GAMES</span><h2>MEDYTE GAMES: aprende jugando</h2><p>Seis mundos, corazones, combos, pistas de anatomía, medallas y desafíos contrarreloj. Comparte tu XP con el campus.</p></div><a class="btn" href="juegos.html">Explorar juegos →</a></section>
    <section class="features-row"><div class="feature-spot"><span class="feature-emoji">⏱</span><div><h3>Reto del día</h3><p>10 preguntas elegidas para hoy.</p>${b('Iniciar reto diario','daily','soft smallbtn')}</div></div><div class="feature-spot"><span class="feature-emoji">♡</span><div><h3>Mis favoritas</h3><p>Guarda lo que necesitas repasar.</p>${b('Abrir favoritas','favoritos','soft smallbtn')}</div></div><div class="feature-spot"><span class="feature-emoji">⌕</span><div><h3>Biblioteca</h3><p>Busca preguntas por tema o palabra.</p>${b('Buscar preguntas','biblioteca','soft smallbtn')}</div></div></section>
    ${heading('PLAN DE ESTUDIO','Explora las cinco materias')}<div class="grid">${catalog.map(card).join('')}</div>
    ${heading('TU CAMINO','Practicar y mejorar')}<div class="grid"><div class="card"><span class="circle-icon">01</span><h3>Selecciona tu temario</h3><p>Elige una materia o combina todas.</p></div><div class="card"><span class="circle-icon">02</span><h3>Responde con confianza</h3><p>El modo práctica explica cada respuesta; el simulacro evalúa al final.</p></div><div class="card"><span class="circle-icon">03</span><h3>Analiza tus resultados</h3><p>Revisa los fallos, marca favoritas y sigue tu avance en este dispositivo.</p></div></div>
    <div class="tip">Las preguntas son ejercicios originales de práctica basados en los temarios de las guías de admisión UMSA 2026. MEDYTE ACADEMY es un proyecto independiente; no publica el examen oficial.</div>`,'Inicio');}
  function materias(){setContent(`${section('MATERIAS Y TEMARIOS','Elige una materia','Encuentra los capítulos por asignatura. Biología contiene únicamente los seis temas que seleccionaste.')}
    <div class="grid">${catalog.map(card).join('')}</div>`,'Materias');}
  function temas(){const s=catalog.find(v=>v.id===state.currentSubject)||catalog[0];setContent(`${section('TEXTO GUÍA 2026',s.icon+' '+s.name,'Explora los '+s.topics.length+' capítulos y practica las preguntas de cada uno.')}
    <div class="actions">${b('← Todas las materias','materias','secondary')}${b('Practicar toda la materia','scope:subject:'+s.id,'')}</div>
    ${heading(s.source_file,'Capítulos disponibles')}<div class="topic-grid">${s.topics.map(t=>`<article class="card topic-row"><div class="topic-num">${String(t.number).padStart(2,'0')}</div><div class="topic-info"><h3>${e(t.name)}</h3><p>Capítulo ${t.number} · página ${t.page_start} del texto guía · ${byTopicCount[t.id]} preguntas</p>${b('Practicar tema →','scope:topic:'+t.id,'soft smallbtn')}</div></article>`).join('')}</div>`,'Temario');}
  function setupView(){const st=state.setup;const opts=scopeOptions(st.scope);
    setContent(`${section('SIMULACROS Y RETOS','Personaliza tu práctica','Entrena a tu ritmo, contesta preguntas aleatorias y refuerza tus conocimientos.')}
    ${state.quiz?`<section class="continue-banner"><div><strong>Hay un cuestionario pendiente.</strong><p>Si comienzas otro, se reemplazará el intento anterior.</p></div>${b('Reanudar','resume','soft')}</section>`:''}
    <div class="setup"><div class="card"><span class="eyebrow">CONFIGURACIÓN</span><h2 class="setup-title">Prepara tu desafío</h2>
    <label class="control">Contenido<select id="scopeSelect">${opts}</select></label>
    <label class="control top-gap">Cantidad de preguntas<select id="countSelect">${[10,20,50,100].map(n=>`<option value="${n}" ${st.qty===n?'selected':''}>${n} preguntas</option>`).join('')}</select></label>
    <label class="control top-gap">Modalidad<select id="modeSelect"><option value="practice" ${st.mode==='practice'?'selected':''}>Práctica — explicación inmediata</option><option value="exam" ${st.mode==='exam'?'selected':''}>Simulacro — tiempo y nota final</option><option value="speed" ${st.mode==='speed'?'selected':''}>Reto rápido — 25 segundos por pregunta</option></select></label>
    <label class="check-line"><input type="checkbox" id="mistakesOnly" ${st.onlyMistakes?'checked':''}> Incluir solo mis errores anteriores</label>
    <label class="check-line"><input type="checkbox" id="favoritesOnly" ${st.onlyFavorites?'checked':''}> Incluir solo mis favoritas</label>
    <p class="small muted">Si el tema tiene menos preguntas que las seleccionadas, usarás todas las disponibles.</p>
    ${b('✦ Comenzar ahora','start','block')}</div>
    <div class="card"><span class="eyebrow">MODOS DISPONIBLES</span><h2 class="setup-title">Aprende jugando</h2><div class="feature-list"><div>🧠 <strong>Práctica:</strong> te explica la respuesta después de elegir.</div><div>⏱️ <strong>Simulacro:</strong> evaluación de 90 segundos por pregunta y revisión final.</div><div>⚡ <strong>Reto rápido:</strong> velocidad y concentración con 25 segundos por pregunta.</div><div>🏅 <strong>XP y niveles:</strong> ganas 10 XP por respuesta correcta.</div><div>↺ <strong>Repaso:</strong> refuerza tus errores y tus favoritas.</div></div>${b('Reto del día (10 preguntas)','daily','soft')}</div></div>`,'Simulacros');}
  function scopeOptions(selected){return `<option value="mixed" ${selected==='mixed'?'selected':''}>Todas las materias (${bank.length})</option>`+
    catalog.map(s=>`<option value="subject:${s.id}" ${selected==='subject:'+s.id?'selected':''}>${e(s.name)} (${subjectCount[s.id]})</option>`).join('')+
    catalog.flatMap(s=>s.topics.map(t=>`<option value="topic:${t.id}" ${selected==='topic:'+t.id?'selected':''}>${e(s.name)} · ${e(t.name)} (${byTopicCount[t.id]})</option>`)).join('');}
  function poolFromSetup(){let list=bank;let sc=state.setup.scope;if(sc.startsWith('subject:'))list=list.filter(q=>q.topic.startsWith(sc.slice(8)));else if(sc.startsWith('topic:'))list=list.filter(q=>q.topic===sc.slice(6));if(state.setup.onlyMistakes){const m=new Set(profile.mistakes);list=list.filter(q=>m.has(q.id));}if(state.setup.onlyFavorites){const f=new Set(profile.favorites);list=list.filter(q=>f.has(q.id));}return list;}
  function shuffledCopy(values,rng=Math.random){const arr=[...values];for(let i=arr.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[arr[j],arr[i]]=[arr[i],arr[j]];}return arr;}
  function dailyRng(key){let x=2166136261;for(let i=0;i<key.length;i++)x=Math.imul(x^key.charCodeAt(i),16777619)>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
  function beginQuiz({items,mode='practice',scope='mixed',daily=false}){
    if(state.quiz&&!confirm('Tienes una práctica sin terminar. ¿Quieres reemplazarla por una nueva?'))return;
    if(state.timer)clearInterval(state.timer);
    const count=items.length,deadline=mode==='practice'?null:Date.now()+count*(mode==='speed'?25000:90000);
    state.quiz={items,answerOrders:items.map(()=>shuffledCopy([0,1,2,3])),answers:Array(count).fill(null),revealed:Array(count).fill(false),pos:0,mode,scope,daily,deadline,started:Date.now()};
    state.lastResult=null;saveDraft();nav('quiz');startTimer();
  }
  function startQuiz(){const pool=poolFromSetup();if(!pool.length){toast('No hay preguntas para esta selección. Cambia el filtro o el tema.');return;}
    beginQuiz({items:shuffledCopy(pool).slice(0,Math.min(state.setup.qty,pool.length)),mode:state.setup.mode,scope:state.setup.scope});}
  function dailyChallenge(){const rng=dailyRng(dateKey());const items=shuffledCopy(bank,rng).slice(0,10);beginQuiz({items,mode:'speed',scope:'Reto del día',daily:true});}
  function formatTime(ms){const n=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
  function startTimer(){if(state.timer)clearInterval(state.timer);if(!state.quiz?.deadline)return;
    state.timer=setInterval(()=>{if(!state.quiz){clearInterval(state.timer);state.timer=null;return;}const left=state.quiz.deadline-Date.now();if(left<=0){finishQuiz(true);return;}const t=$('clock');if(t)t.textContent='⏱ '+formatTime(left);},400);
    if(state.quiz.deadline<=Date.now())finishQuiz(true);
  }
  function quizView(){const z=state.quiz;if(!z)return nav('simulacros');if(z.deadline && z.deadline<=Date.now()){finishQuiz(true);return;}
    const q=z.items[z.pos],choice=z.answers[z.pos],order=z.answerOrders[z.pos],revealed=z.mode==='practice'&&z.revealed[z.pos];
    const opts=order.map((orig,pos)=>{const klass=(choice===orig?'selected ':'')+(revealed?(orig===q.c?'good':choice===orig?'bad':''):'');return `<button type="button" class="answer-choice ${klass}" data-answer="${orig}" ${revealed?'disabled':''} aria-pressed="${choice===orig}"><span class="letter">${'ABCD'[pos]}</span><span>${e(q.a[orig])}</span></button>`;}).join('');
    const selected=z.answers.filter(a=>a!==null).length;
    const controls=z.items.length<=20?`<div class="question-map" aria-label="Ir a otra pregunta">${z.items.map((v,i)=>`<button type="button" data-action="go:${i}" class="map-btn ${i===z.pos?'active':''} ${z.answers[i]!==null?'answered':''}" aria-label="Pregunta ${i+1}${z.answers[i]!==null?', respondida':''}" ${z.mode==='practice'&&!z.revealed[z.pos]&&z.answers[z.pos]!==null?'disabled':''}>${i+1}</button>`).join('')}</div>`:'';
    setContent(`<div class="quiz-shell"><div class="quiz-topline"><span class="eyebrow">${z.daily?'RETO DEL DÍA':z.mode==='speed'?'RETO RÁPIDO':z.mode==='exam'?'SIMULACRO':'PRÁCTICA'} · ${topicName(q.topic)}</span>${z.deadline?`<span class="countdown" id="clock">⏱ ${formatTime(z.deadline-Date.now())}</span>`:''}</div>
      <div class="quiz-heading"><span class="pill neutral">Pregunta ${z.pos+1} de ${z.items.length}</span><span class="mini-stat">${selected} respondidas</span></div>
      <div class="progressbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(selected/z.items.length*100)}"><span style="width:${(selected/z.items.length)*100}%"></span></div>
      <section class="card quiz-card"><div class="question-head"><span class="small muted">${e(q.id)} · ${e(topicById.get(q.topic)?.name||'')}</span><button type="button" data-action="fav:${e(q.id)}" class="favorite-btn ${profile.favorites.includes(q.id)?'is-on':''}" aria-label="${profile.favorites.includes(q.id)?'Quitar de favoritas':'Guardar pregunta en favoritas'}">${profile.favorites.includes(q.id)?'♥ Guardada':'♡ Guardar'}</button></div>
      <h1 class="question">${e(q.q)}</h1><div class="quiz-options" aria-label="Opciones de respuesta">${opts}</div>
      ${revealed?`<div class="feedback ${choice===q.c?'':'wrong'}"><strong>${choice===q.c?'✓ ¡Correcto!':'✕ Respuesta correcta: '+e(q.a[q.c])}</strong><p>${e(q.e)}</p></div>`:''}
      <div class="quiz-footer"><div class="quiz-hint">${z.mode==='practice'?'Recibirás una explicación al elegir.':'Puedes revisar tus respuestas antes de finalizar.'}</div><div class="actions quiz-actions">${z.pos>0?b('← Anterior','prev','secondary smallbtn'):''}${z.pos<z.items.length-1?b('Siguiente →','next','secondary smallbtn'):''}${b('Finalizar','finish','smallbtn')}</div></div></section>
      ${controls}<div class="quiet-actions">${b('Guardar y salir','pause','secondary smallbtn')}<span class="small muted">El intento se guarda automáticamente.</span></div></div>`,'Pregunta '+(z.pos+1));
  }
  function chooseAnswer(orig){const z=state.quiz;if(!z||!Number.isInteger(orig)||orig<0||orig>3)return;
    if(z.mode==='practice'&&z.revealed[z.pos])return;
    z.answers[z.pos]=orig;if(z.mode==='practice'){z.revealed[z.pos]=true;window.MedyteEpic?.sound(orig===z.items[z.pos].c?'good':'bad');}
    saveDraft();quizView();}
  function step(direction){const z=state.quiz;if(!z)return;z.pos=Math.max(0,Math.min(z.items.length-1,z.pos+direction));saveDraft();quizView();}
  function goTo(i){const z=state.quiz;if(!z||i<0||i>=z.items.length)return;z.pos=i;saveDraft();quizView();}
  function finishQuiz(byTime=false){const z=state.quiz;if(!z)return;
    if(!byTime&&z.answers.some(a=>a===null)&&!confirm('Todavía hay preguntas sin responder. ¿Quieres finalizar y calificarlas como incorrectas?'))return;
    if(state.timer){clearInterval(state.timer);state.timer=null;}
    const items=z.items.map((q,i)=>({id:q.id,answer:z.answers[i]??null,correct:q.c}));
    const correct=items.filter(row=>row.answer===row.correct).length;
    const entry={date:new Date().toISOString(),correct,total:items.length,mode:z.mode,scope:z.scope,items,daily:z.daily,timedOut:byTime};
    profile.xp+=correct*10;
    profile.history=[entry,...profile.history].slice(0,50);
    const mistakes=new Set(profile.mistakes);items.forEach(row=>row.answer===row.correct?mistakes.delete(row.id):mistakes.add(row.id));profile.mistakes=[...mistakes];
    if(z.daily)profile.dailyHistory[dateKey()]={correct,total:items.length};
    state.lastResult=entry;state.reviewOpen=new Set();state.quiz=null;saveDraft();save();nav('resultado');
    if(correct/items.length>=0.6)window.MedyteEpic?.celebrate('¡Práctica superada!');
    if(byTime)toast('Terminó el tiempo del reto. Se guardó tu resultado.');
  }
  function reviewHtml(r){return r.items.map((row,i)=>{const q=questionById.get(row.id);if(!q)return'';
    const ok=row.answer===row.correct;
    return `<article class="review-item"><div class="review-heading"><span class="small muted">${i+1}. ${topicName(q.topic)}</span><span class="pill ${ok?'green':'red'}">${ok?'Correcta':row.answer===null?'Sin responder':'Por repasar'}</span></div>
    <h4 class="review-question">${e(q.q)}</h4><p>Tu respuesta: <strong>${row.answer===null?'No respondida':e(q.a[row.answer]||'')}</strong></p><p>Respuesta correcta: <strong>${e(q.a[q.c])}</strong></p><div class="review-explanation">${e(q.e)}</div><button type="button" class="favorite-btn small-fav ${profile.favorites.includes(q.id)?'is-on':''}" data-action="fav:${e(q.id)}">${profile.favorites.includes(q.id)?'♥ Guardada':'♡ Marcar favorita'}</button></article>`;
  }).join('');}
  function resultado(){const r=state.lastResult||profile.history[0];if(!r)return nav('progreso');const pct=r.total?Math.round(r.correct/r.total*100):0;
    setContent(`${section('RESULTADOS','¡Completaste el desafío!','Cada intento es una oportunidad para mejorar. Revisa tus respuestas y vuelve a practicar.')}
    <div class="card result-card"><div class="result-ring" style="--pct:${pct}%"><div><b>${pct}%</b><small>Aciertos</small></div></div><div class="text-center"><h2>${r.correct} de ${r.total} respuestas correctas</h2><p class="muted">+${r.correct*10} XP · ${r.mode==='game-adventure'?'Aventura':r.mode==='practice'?'Práctica':r.mode==='speed'?'Reto rápido':'Simulacro'}${r.timedOut?' · Tiempo agotado':''}</p><div class="actions centered">${b('↺ Practicar otra vez','simulacros','')}${b('Mis errores','errores','secondary')}${b('Descargar resultado','export-result','soft')}</div></div>
    <div class="divider"></div><h3 class="mb-title">Revisión de tus respuestas</h3>${reviewHtml(r)}</div>`,'Resultado');}
  function achievements(){const all=profile.history.flatMap(r=>Array.isArray(r.items)?r.items:[]);const correct=all.filter(x=>x.answer===x.correct).length;
    const subjects=new Set(all.map(x=>topicById.get(questionById.get(x.id)?.topic)?.subjectId).filter(Boolean));
    const earned=[['Primer paso',profile.history.length>=1,'Completar tu primera práctica'],['Constancia',profile.history.length>=5,'Terminar cinco prácticas'],['50 aciertos',correct>=50,'Responder bien cincuenta preguntas'],['Explorador',subjects.size>=5,'Practicar las cinco materias'],['Coleccionista',profile.favorites.length>=10,'Guardar diez preguntas favoritas']];
    return earned.map(([title,done,desc])=>`<div class="achievement ${done?'earned':''}"><span class="achievement-icon">${done?'🏅':'◇'}</span><div><strong>${e(title)}</strong><small>${e(desc)}</small></div></div>`).join('');}
  function statsBySubject(){const out=Object.fromEntries(catalog.map(s=>[s.id,{right:0,total:0}]));
    for(const r of profile.history){for(const x of (r.items||[])){const subject=topicById.get(questionById.get(x.id)?.topic)?.subjectId;if(!out[subject])continue;out[subject].total++;if(x.answer===x.correct)out[subject].right++;}}return out;}
  function progreso(){const hist=profile.history, totalAnswered=hist.reduce((n,r)=>n+r.total,0), correct=hist.reduce((n,r)=>n+r.correct,0),accuracy=totalAnswered?Math.round(100*correct/totalAnswered):0;
    const per=statsBySubject();setContent(`${section('TU AVANCE','Mi progreso','Consulta tus resultados y reconocimientos. Tus datos se guardan solo en este navegador.')}
    <div class="profile-stats"><div class="profile-stat"><strong>${Math.floor(profile.xp)} XP</strong><span>Puntos ganados</span></div><div class="profile-stat"><strong>${hist.length}</strong><span>Prácticas guardadas</span></div><div class="profile-stat"><strong>${accuracy}%</strong><span>Promedio de aciertos</span></div></div>
    ${heading('POR ASIGNATURA','Tu rendimiento')}<div class="subject-progress">${catalog.map(s=>{const v=per[s.id],pct=v.total?Math.round(v.right/v.total*100):0;return `<div class="subject-progress-row"><div class="progress-label"><strong>${s.icon} ${e(s.name)}</strong><span>${v.total?pct+'% · '+v.right+'/'+v.total:'Sin intentos'}</span></div><div class="progressbar"><span style="width:${pct}%"></span></div></div>`;}).join('')}</div>
    ${heading('LOGROS','Tus insignias')}<div class="achievements">${achievements()}</div>
    <div class="panel-heading section-heading"><div><span class="eyebrow">INTENTOS RECIENTES</span><h2>Historial</h2></div>${b('Exportar mi progreso','export-progress','soft smallbtn')}</div>
    <div class="card">${hist.length?`<div class="table-wrap"><table class="history-table"><thead><tr><th>Fecha</th><th>Modo</th><th>Resultado</th><th>Revisión</th></tr></thead><tbody>${hist.map((r,i)=>`<tr><td>${e(new Date(r.date).toLocaleDateString('es-BO'))}</td><td>${r.mode==='game-adventure'?'Aventura':r.mode==='practice'?'Práctica':r.mode==='speed'?'Reto rápido':'Simulacro'}</td><td>${r.correct}/${r.total} (${r.total?Math.round(r.correct*100/r.total):0}%)</td><td>${b('Revisar','history:'+i,'soft smallbtn')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Aún no has completado una práctica. ¡Elige una materia para comenzar!</div>'}</div>
    <p class="privacy-footnote">🔒 La versión pública de GitHub Pages no registra cuentas, no guarda contraseñas y no envía resultados al administrador.</p>`,'Mi progreso');}
  function errores(){const list=profile.mistakes.filter(id=>questionById.has(id));setContent(`${section('APRENDIZAJE ACTIVO','Repaso de errores',`Tienes ${list.length} preguntas pendientes de reforzar en este navegador.`)}
    <div class="actions">${b('↺ Practicar mis errores','repeat-mistakes','')}${b('Ir a materias','materias','secondary')}</div>
    ${list.length?`<div class="card list-card">${list.slice(0,30).map(id=>{const q=questionById.get(id);return `<article class="review-item"><span class="small muted">${topicName(q.topic)}</span><h4 class="review-question">${e(q.q)}</h4><div class="review-explanation">${e(q.e)}</div></article>`;}).join('')}${list.length>30?'<p class="small muted">Se muestran las primeras 30. Puedes practicar todas desde el botón superior.</p>':''}</div>`:'<div class="empty empty-spaced">Cuando falles una pregunta, la encontrarás aquí para practicarla otra vez.</div>'}`,'Repaso de errores');}
  function favoritos(){const ids=profile.favorites.filter(id=>questionById.has(id));setContent(`${section('MIS APUNTES','Preguntas favoritas',`Has guardado ${ids.length} preguntas. Úsalas para repasar lo más importante.`)}
    <div class="actions">${b('Practicar favoritas','repeat-favorites','')}${b('Explorar el banco','biblioteca','secondary')}</div>
    ${ids.length?`<div class="card list-card">${ids.map((id,i)=>{const q=questionById.get(id);return `<article class="review-item"><div class="review-heading"><span class="small muted">${i+1}. ${topicName(q.topic)}</span><button class="favorite-btn is-on" type="button" data-action="fav:${e(id)}">♥ Quitar</button></div><h4 class="review-question">${e(q.q)}</h4><div class="review-explanation">${e(q.e)}</div></article>`;}).join('')}</div>`:'<div class="empty empty-spaced">Todavía no guardaste preguntas. Puedes usar el botón ♡ en los simulacros o en la biblioteca.</div>'}`,'Favoritas');}
  function biblioteca(){const filter=state.library;setContent(`${section('BIBLIOTECA EDUCATIVA','Banco de preguntas','Busca entre las 1.000 preguntas de las cinco materias y marca las que te interesen para repasar.')}
    <div class="library-filters"><label class="control">Buscar preguntas<input id="librarySearch" type="search" placeholder="Ej.: homeostasis, ecuaciones, acentuación..." value="${e(filter.search)}" autocomplete="off"></label><label class="control">Materia<select id="librarySubject"><option value="all">Todas las materias</option>${catalog.map(s=>`<option value="${s.id}" ${filter.subject===s.id?'selected':''}>${e(s.name)}</option>`).join('')}</select></label></div>
    <div id="libraryResults" aria-live="polite"></div>`,'Banco de preguntas');renderLibraryResults();}
  function renderLibraryResults(){const list=bank.filter(q=>(state.library.subject==='all'||q.topic.startsWith(state.library.subject))&&(!state.library.search||[q.q,q.e,topicById.get(q.topic)?.name].join(' ').toLocaleLowerCase('es').includes(state.library.search.toLocaleLowerCase('es'))));
    const perPage=12,maxPage=Math.max(1,Math.ceil(list.length/perPage));state.library.page=Math.max(1,Math.min(state.library.page,maxPage));
    const page=list.slice((state.library.page-1)*perPage,state.library.page*perPage);
    const html=`<div class="library-summary"><span>${list.length} preguntas encontradas</span><span>Página ${state.library.page} de ${maxPage}</span></div>${page.length?`<div class="library-list">${page.map(q=>`<article class="card question-library-card"><div class="review-heading"><span class="small muted">${topicName(q.topic)}</span><button type="button" class="favorite-btn ${profile.favorites.includes(q.id)?'is-on':''}" data-action="fav:${e(q.id)}">${profile.favorites.includes(q.id)?'♥ Guardada':'♡ Guardar'}</button></div><h3>${e(q.q)}</h3><div class="library-choices">${q.a.map((x,i)=>`<div><b>${'ABCD'[i]}.</b> ${e(x)}</div>`).join('')}</div>${state.library.open.has(q.id)?`<div class="feedback"><strong>✓ ${e(q.a[q.c])}</strong><p>${e(q.e)}</p></div>`:''}<div class="library-controls">${b(state.library.open.has(q.id)?'Ocultar explicación':'Ver respuesta explicada','reveal:'+q.id,'soft smallbtn')}</div></article>`).join('')}</div>`:'<div class="empty">No hay coincidencias. Prueba otra palabra.</div>'}
      <div class="pagination">${b('← Anterior','lib-prev','secondary smallbtn')}<span>Página ${state.library.page}/${maxPage}</span>${b('Siguiente →','lib-next','secondary smallbtn')}</div>`;
    if($('libraryResults'))$('libraryResults').innerHTML=html;
  }
  function acerca(){setContent(`${section('MEDYTE ACADEMY','Información del proyecto','Versión optimizada para publicar en GitHub Pages y compartir mediante un enlace público.')}
    <div class="grid"><div class="card"><span class="circle-icon">📘</span><h3>Contenido educativo</h3><p>Mil preguntas originales de práctica con explicaciones, organizadas en cinco materias y 52 temas de los textos guía 2026. En Biología se incluyen solo seis temas.</p></div><div class="card"><span class="circle-icon">⏱</span><h3>Prácticas y retos</h3><p>Simulacros, modo práctica, desafío rápido, reto diario, favoritas y repaso de errores.</p></div><div class="card"><span class="circle-icon">🔒</span><h3>Privacidad</h3><p>El progreso se guarda en este navegador mediante almacenamiento local. Esta edición no requiere cuenta ni recopila contraseñas.</p></div></div>
    ${heading('DATOS PERSONALES','Control de tu progreso')}<div class="card"><p>Si borras los datos de este navegador, tu historial puede desaparecer. Puedes descargar una copia de tus resultados.</p><div class="actions">${b('Descargar mis datos','export-progress','soft')}${b('Eliminar progreso local','clear-progress','secondary')}</div></div>
    <div class="tip">MEDYTE ACADEMY es un proyecto educativo independiente. Los ejercicios se elaboraron como material de práctica basado en las guías 2026; las preguntas no son un examen oficial de la Universidad Mayor de San Andrés y requieren revisión docente antes de cualquier uso evaluativo formal.</div>`,'Información');}
  function toggleFav(id){if(!questionById.has(id))return;const s=new Set(profile.favorites);s.has(id)?s.delete(id):s.add(id);profile.favorites=[...s];save();uiHeader();
    if(state.page==='quiz')quizView();else if(state.page==='favoritos')favoritos();else if(state.page==='biblioteca')renderLibraryResults();else if(state.page==='resultado')resultado();toast(s.has(id)?'Pregunta guardada en favoritas.':'Pregunta quitada de favoritas.');}
  function exportFile(name,text,kind){const blob=new Blob([text],{type:kind});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  function exportProgress(){const copy={app:'MEDYTE ACADEMY',exportado:new Date().toISOString(),nota:'Progreso guardado solo en este dispositivo',xp:profile.xp,historial:profile.history,errores:profile.mistakes,favoritas:profile.favorites};exportFile('medyte-mi-progreso.json',JSON.stringify(copy,null,2),'application/json');}
  function csvCell(v){let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  function exportResult(){const r=state.lastResult||profile.history[0];if(!r)return;const rows=[['ID','Materia y tema','Pregunta','Respuesta elegida','Correcta','Resultado','Explicación']];
    for(const row of r.items){const q=questionById.get(row.id);if(!q)continue;rows.push([row.id,(topicById.get(q.topic)?.subject||'')+' / '+(topicById.get(q.topic)?.name||''),q.q,row.answer===null?'Sin responder':q.a[row.answer],q.a[q.c],row.answer===row.correct?'Correcta':'Incorrecta',q.e]);}
    exportFile('medyte-resultado.csv','\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');}
  function clearProgress(){if(!confirm('¿Eliminar tu historial, XP, errores y favoritas de ESTE navegador? No se puede deshacer.'))return;profile=blankProfile();save();uiHeader();nav('progreso');toast('Se borró el progreso local.');}
  function action(cmd){if(!cmd)return;
    const direct=['inicio','materias','simulacros','biblioteca','favoritos','progreso','errores','acerca'];if(direct.includes(cmd)){nav(cmd);return;}
    if(cmd.startsWith('subject:')){state.currentSubject=cmd.slice(8);nav('temas');return;}
    if(cmd.startsWith('scope:')){state.setup.scope=cmd.slice(6);state.setup.onlyMistakes=false;state.setup.onlyFavorites=false;nav('simulacros');return;}
    if(cmd==='start'){startQuiz();return;}
    if(cmd==='daily'){dailyChallenge();return;}
    if(cmd==='resume'){nav('quiz');startTimer();return;}
    if(cmd==='pause'){saveDraft();nav('inicio');toast('Tu práctica quedó guardada en este navegador.');return;}
    if(cmd==='prev'){step(-1);return;}
    if(cmd==='next'){step(1);return;}
    if(cmd.startsWith('go:')){goTo(Number(cmd.slice(3)));return;}
    if(cmd==='finish'){finishQuiz(false);return;}
    if(cmd.startsWith('fav:')){toggleFav(cmd.slice(4));return;}
    if(cmd.startsWith('reveal:')){const id=cmd.slice(7);state.library.open.has(id)?state.library.open.delete(id):state.library.open.add(id);renderLibraryResults();return;}
    if(cmd==='lib-prev'){state.library.page--;renderLibraryResults();return;}
    if(cmd==='lib-next'){state.library.page++;renderLibraryResults();return;}
    if(cmd==='repeat-mistakes'){state.setup={...state.setup,scope:'mixed',mode:'practice',qty:20,onlyMistakes:true,onlyFavorites:false};nav('simulacros');return;}
    if(cmd==='repeat-favorites'){state.setup={...state.setup,scope:'mixed',mode:'practice',qty:20,onlyMistakes:false,onlyFavorites:true};nav('simulacros');return;}
    if(cmd.startsWith('history:')){state.lastResult=profile.history[Number(cmd.slice(8))]||null;nav('resultado');return;}
    if(cmd==='export-progress'){exportProgress();return;}
    if(cmd==='export-result'){exportResult();return;}
    if(cmd==='clear-progress'){clearProgress();return;}
  }
  document.addEventListener('click',evt=>{const n=evt.target.closest('[data-nav]');if(n){evt.preventDefault();nav(n.dataset.nav);return;}
    const ans=evt.target.closest('[data-answer]');if(ans){evt.preventDefault();chooseAnswer(Number(ans.dataset.answer));return;}
    const cmd=evt.target.closest('[data-action]');if(cmd){evt.preventDefault();action(cmd.dataset.action);}
  });
  document.addEventListener('change',evt=>{const v=evt.target.value;
    if(evt.target.id==='scopeSelect')state.setup.scope=v;
    if(evt.target.id==='countSelect')state.setup.qty=Number(v);
    if(evt.target.id==='modeSelect')state.setup.mode=v;
    if(evt.target.id==='mistakesOnly')state.setup.onlyMistakes=evt.target.checked;
    if(evt.target.id==='favoritesOnly')state.setup.onlyFavorites=evt.target.checked;
    if(evt.target.id==='librarySubject'){state.library.subject=v;state.library.page=1;renderLibraryResults();}
  });
  document.addEventListener('input',evt=>{if(evt.target.id==='librarySearch'){state.library.search=evt.target.value.trim();state.library.page=1;renderLibraryResults();}});
  $('menuToggle').addEventListener('click',()=>{const isOpen=$('sidebar').classList.toggle('open');$('mobileShade').hidden=!isOpen;$('menuToggle').setAttribute('aria-expanded',String(isOpen));});
  $('mobileShade').addEventListener('click',closeMenu);
  window.addEventListener('keydown',evt=>{if(evt.key==='Escape'){closeMenu();return;}
    if(state.page!=='quiz'||!state.quiz||!['1','2','3','4'].includes(evt.key)||/input|textarea|select/i.test(evt.target.tagName))return;
    const orig=state.quiz.answerOrders[state.quiz.pos][Number(evt.key)-1];chooseAnswer(orig);
  });
  window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(['inicio','materias','simulacros','biblioteca','favoritos','progreso','errores','acerca'].includes(h)&&state.page!==h)nav(h);});
  window.addEventListener('storage',evt=>{if(evt.key===KEY)toast('Se modificó el progreso en otra pestaña. Actualiza esta página para ver los cambios.');});
  window.addEventListener('medyte:bonus',()=>{const updated=readJson(KEY);if(updated&&typeof updated==='object'){profile={...profile,...updated};uiHeader();if(state.page==='progreso')progreso();}});
  if('serviceWorker' in navigator && location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  if(bank.length===0||catalog.length===0){setContent('<div class="empty">No se cargaron las preguntas. Comprueba que preguntas.js está junto a index.html.</div>','Error');return;}
  const first=location.hash.slice(1),allowed=['inicio','materias','simulacros','biblioteca','favoritos','progreso','errores','acerca'];
  nav(allowed.includes(first)?first:'inicio');
})();
