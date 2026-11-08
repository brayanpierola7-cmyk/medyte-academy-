/* MEDYTE ACADEMY — Campus interactivo estático para GitHub Pages.
   No envía datos a servidores. El progreso se guarda en el navegador del estudiante. */
(() => {
  'use strict';
  const catalog = Array.isArray(window.MEDYTE_CATALOG) ? window.MEDYTE_CATALOG : [];
  const bank = Array.isArray(window.MEDYTE_QUESTIONS) ? window.MEDYTE_QUESTIONS : [];
  const questionById = new Map(bank.map(q => [q.id,q]));
  const difficultyById = window.MEDYTE_DIFFICULTY_BY_ID || {};
  const difficultyOf = q => difficultyById[q.id] || 'normal';
  const dName = d => ({facil:'Fácil',normal:'Normal',dificil:'Difícil',all:'Todos'}[d] || 'Normal');
  const dIcon = d => ({facil:'🌱',normal:'⚡',dificil:'🔥',all:'🌈'}[d] || '⚡');
  const topicById = new Map(catalog.flatMap(s => s.topics.map(t => [t.id,{...t, subject:s.name, subjectId:s.id}])));
  const $ = id => document.getElementById(id);
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;',"'":'&#39;'}[c]));
  const dateKey = () => { const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
  const KEY = 'medyte_demo_estatica_v1'; // Mantener los resultados de la versión anterior.
  const DRAFT_KEY = 'medyte_borrador_v4';
  const blankProfile = () => ({xp:0, history:[], mistakes:[], favorites:[], dailyHistory:{}, avatar:'estudiante', studentName:'Estudiante Medyte', career:'Medicina UMSA', notes:{}, flashcardsKnown:[], accounts:[], srs:{}, studyDates:[], examDate:'2027-01-25'});
  const readJson = key => {try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}};
  let profile = {...blankProfile(), ...(readJson(KEY)||{})};
  profile.history = Array.isArray(profile.history) ? profile.history : [];
  profile.mistakes = Array.isArray(profile.mistakes) ? profile.mistakes.filter(id=>questionById.has(id)) : [];
  profile.favorites = Array.isArray(profile.favorites) ? profile.favorites.filter(id=>questionById.has(id)) : [];
  profile.dailyHistory = profile.dailyHistory && typeof profile.dailyHistory==='object' ? profile.dailyHistory : {};
  profile.xp = Math.max(0,Number(profile.xp)||0);
  profile.studentName = String(profile.studentName || 'Estudiante Medyte');
  profile.career = String(profile.career || 'Medicina UMSA');
  profile.notes = profile.notes && typeof profile.notes==='object' ? profile.notes : {};
  profile.flashcardsKnown = Array.isArray(profile.flashcardsKnown) ? profile.flashcardsKnown : [];
  profile.accounts = Array.isArray(profile.accounts) ? profile.accounts : [];
  profile.srs = profile.srs && typeof profile.srs === 'object' ? profile.srs : {};
  profile.studyDates = Array.isArray(profile.studyDates) ? profile.studyDates : [];
  profile.examDate = String(profile.examDate || '2027-01-25');
  const AVATARS = [{id:'estudiante',icon:'🎓',name:'Estudiante',xp:0},{id:'explorador',icon:'🧭',name:'Explorador',xp:100},{id:'ciencia',icon:'🧪',name:'Científico',xp:250},{id:'doctora',icon:'🩺',name:'Personal médico',xp:500},{id:'genio',icon:'🧠',name:'50 aciertos',xp:850},{id:'estrella',icon:'👑',name:'Experto MEDYTE',xp:1500}];
  const selectedAvatar = () => AVATARS.find(a=>a.id===profile.avatar&&profile.xp>=a.xp) || AVATARS[0];
  const subjectCount = Object.fromEntries(catalog.map(s=>[s.id,bank.filter(q=>q.topic.startsWith(s.id)).length]));
  const byTopicCount = Object.fromEntries([...topicById.keys()].map(id=>[id,bank.filter(q=>q.topic===id).length]));
  const state = {
    page:'inicio', currentSubject:'bio', quiz:null, lastResult:null, timer:null,
    setup:{scope:'mixed',qty:10,mode:'practice',difficulty:'all',secondsPerQuestion:90,goal:70,onlyMistakes:false,onlyFavorites:false,bubbleSheet:false},
    library:{search:'',subject:'all',difficulty:'all',page:1,open:new Set()},
    flash:{subject:'all',difficulty:'all',onlyFavs:false,onlyMistakes:false,idx:0,flipped:false,deck:[]},
    formTab:'tabla', selectedElement:null,
    reviewOpen:new Set()
  };
  function save(){try{localStorage.setItem(KEY,JSON.stringify(profile));window.dispatchEvent(new Event('medyte:progress'));}catch{toast('No se pudo guardar el progreso en este navegador.');}}
  function saveDraft(){try{if(state.quiz)localStorage.setItem(DRAFT_KEY,JSON.stringify({ids:state.quiz.items.map(q=>q.id),answerOrders:state.quiz.answerOrders,answers:state.quiz.answers,revealed:state.quiz.revealed,pos:state.quiz.pos,mode:state.quiz.mode,scope:state.quiz.scope,started:state.quiz.started,deadline:state.quiz.deadline,daily:state.quiz.daily,difficulty:state.quiz.difficulty,goal:state.quiz.goal,secondsPerQuestion:state.quiz.secondsPerQuestion,marked:[...state.quiz.marked],bubbleSheet:!!state.quiz.bubbleSheet}));else localStorage.removeItem(DRAFT_KEY);}catch{}}
  function recoverDraft(){const raw=readJson(DRAFT_KEY);if(!raw || !Array.isArray(raw.ids) || raw.ids.length>100 || !raw.ids.length)return;
    const items=raw.ids.map(id=>questionById.get(id));if(items.some(v=>!v))return;
    const validOrders=Array.isArray(raw.answerOrders)&&raw.answerOrders.length===items.length&&raw.answerOrders.every(a=>Array.isArray(a)&&a.length===4&&new Set(a).size===4&&a.every(x=>[0,1,2,3].includes(x)));
    if(!validOrders)return;
    state.quiz={items,answerOrders:raw.answerOrders,answers:(Array.isArray(raw.answers)?raw.answers:[]).slice(0,items.length),revealed:(Array.isArray(raw.revealed)?raw.revealed:[]).slice(0,items.length),pos:Math.min(items.length-1,Math.max(0,Number(raw.pos)||0)),mode:['practice','exam','speed','pro'].includes(raw.mode)?raw.mode:'practice',scope:raw.scope||'mixed',started:raw.started||Date.now(),deadline:raw.deadline||null,daily:!!raw.daily,difficulty:raw.difficulty||'all',goal:Number(raw.goal)||70,secondsPerQuestion:Number(raw.secondsPerQuestion)||90,marked:new Set(Array.isArray(raw.marked)?raw.marked.filter(i=>Number.isInteger(i)&&i>=0&&i<items.length):[]),bubbleSheet:!!raw.bubbleSheet};
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
  function uiHeader(){$('xpHeader').textContent='✦ '+Math.floor(profile.xp)+' XP';$('levelChip').textContent='Nivel '+level();$('favoritesCount').textContent=profile.favorites.length;if($('avatarHeader'))$('avatarHeader').textContent=selectedAvatar().icon;if($('studentNameBtn'))$('studentNameBtn').textContent='👤 '+(profile.studentName.split(' ')[0]||'Estudiante');}
  function nav(page){state.page=page;closeMenu();uiHeader();document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('current',x.dataset.nav===page||(page==='temas'&&x.dataset.nav==='materias')));
    try{if(page!=='quiz'&&page!=='resultado'&&page!=='temas')history.replaceState(null,'','#'+page);}catch{}
    const views={inicio:home,materias:materias,temas:temas,simulacros:setupView,flashcards:flashcardsView,formulario:formularioView,biblioteca:biblioteca,favoritos:favoritos,progreso:progreso,trofeos:trofeos,errores:errores,acerca:acerca,quiz:quizView,resultado:resultado};
    (views[page]||home)();
  }

  /* === RACHAS DE DÍAS, CUENTA REGRESIVA, RETO ENTRE AMIGOS Y REPETICIÓN ESPACIADA (SRS) === */
  function recordTodayStudy(){
    const today = dateKey();
    if(!profile.studyDates.includes(today)) profile.studyDates.push(today);
    profile.studyDates = [...new Set(profile.studyDates)].sort().slice(-120);
  }
  function getActiveStudyDaysSet(){
    const set = new Set(profile.studyDates || []);
    for(const h of (profile.history||[])){
      if(h.date){
        const d = new Date(h.date);
        if(!Number.isNaN(d.getTime())){
          set.add([d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'));
        }
      }
    }
    return set;
  }
  function getCurrentStreak(){
    const set = getActiveStudyDaysSet();
    let count = 0;
    const d = new Date();
    for(let i=0;i<365;i++){
      const k = [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
      if(set.has(k)){ count++; d.setDate(d.getDate()-1); }
      else if(i===0){ d.setDate(d.getDate()-1); }
      else break;
    }
    return count;
  }
  function getLast7DaysStatus(){
    const set = getActiveStudyDaysSet();
    const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const out = [];
    for(let i=6;i>=0;i--){
      const d = new Date();
      d.setDate(d.getDate()-i);
      const k = [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
      out.push({label:days[d.getDay()], dayNum:d.getDate(), done:set.has(k), isToday:i===0});
    }
    return out;
  }
  function getDaysUntilExam(){
    const target = new Date((profile.examDate||'2027-01-25')+'T08:00:00');
    if(Number.isNaN(target.getTime())) return 0;
    const diff = target.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }
  function renderStreakAndCountdownBanner(){
    const streak = getCurrentStreak();
    const week = getLast7DaysStatus();
    const daysLeft = getDaysUntilExam();
    return `<section class="streak-countdown-grid">
      <div class="card streak-card">
        <div class="streak-head">
          <div><span class="eyebrow">CONSTANCIA SEMANAL</span><h3>🔥 Racha: ${streak} ${streak===1?'día seguido':'días seguidos'}</h3></div>
          <span class="pill neutral">${getActiveStudyDaysSet().size} días activos</span>
        </div>
        <div class="week-calendar" aria-label="Últimos 7 días de estudio">
          ${week.map(w=>`<div class="day-pill ${w.done?'done':''} ${w.isToday?'today':''}"><span>${w.label}</span><strong>${w.done?'✓':w.dayNum}</strong></div>`).join('')}
        </div>
      </div>
      <div class="card countdown-card">
        <div class="streak-head">
          <div><span class="eyebrow">META DE INGRESO</span><h3>⏳ Faltan ${daysLeft} días para tu examen</h3></div>
          ${b('📅 Cambiar fecha','edit-exam-date','soft smallbtn')}
        </div>
        <p class="small muted" style="margin:6px 0 0">Fecha objetivo configurada: <strong>${e(profile.examDate)}</strong> · Carrera: <strong>${e(profile.career)}</strong></p>
      </div>
    </section>`;
  }

  /* Codificador de Retos entre Amigos (sin servidor) */
  function encodeDuelCode(quizOrResult){
    const ids = (quizOrResult.items||[]).map(x => typeof x==='string'?x:x.id);
    if(!ids.length) return '';
    const mode = quizOrResult.mode || 'pro';
    const sec = quizOrResult.secondsPerQuestion || 90;
    const payload = {v:1, m:mode, s:sec, q:ids};
    return 'MDY-' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  }
  function startFromDuelCode(rawCode){
    let clean = String(rawCode||'').trim();
    if(!clean) return false;
    if(clean.includes('duel=')) clean = clean.split('duel=')[1].split('&')[0].split('#')[0];
    if(clean.startsWith('MDY-')) clean = clean.slice(4);
    try{
      const data = JSON.parse(decodeURIComponent(escape(atob(clean))));
      if(!data || !Array.isArray(data.q)) throw new Error();
      const items = data.q.map(id => questionById.get(id)).filter(Boolean);
      if(!items.length) throw new Error();
      beginQuiz({
        items,
        mode: ['practice','exam','speed','pro'].includes(data.m) ? data.m : 'pro',
        scope: '⚔️ Duelo compartido ('+items.length+' preg.)',
        difficulty: 'all',
        goal: 75,
        secondsPerQuestion: Number(data.s) || 75,
        bubbleSheet: state.setup.bubbleSheet
      });
      toast('⚔️ ¡Duelo cargado! Estás resolviendo las mismas ' + items.length + ' preguntas que tu compañero.');
      return true;
    }catch{
      toast('El código de reto no es válido. Verifica que esté completo.');
      return false;
    }
  }

  function card(subject){const n=subjectCount[subject.id];return `<article class="card subject-card"><div class="card-top"><span class="circle-icon" aria-hidden="true">${subject.icon}</span><span class="pill neutral">${n} preguntas</span></div><h3>${e(subject.name)}</h3><p class="sub">${subject.topics.length} temas del texto guía 2026</p>${b('Ver temario →','subject:'+subject.id,'soft')}</article>`;}
  function home(){const attempted=profile.history.length;
    setContent(`<section class="hero"><div class="hero-copy"><span class="eyebrow">CAMPUS VIRTUAL · ADMISIÓN 2026</span><h1>Practica para tu ingreso.<br><em>Prepárate a tu ritmo.</em></h1><p>Repasa las cinco materias, resuelve simulacros y juega para practicar los temas que más necesitas.</p><div class="actions">${b('✦ Empezar a practicar','simulacros','')}${b('Explorar materias →','materias','secondary')}<a class="btn games-home-btn" href="juegos.html">🎮 MEDYTE GAMES →</a></div><div class="hero-proof"><span>✓ Prácticas interactivas</span><span>✓ Para celular</span><span>✓ Progreso personal</span></div></div><div class="hero-logo"><img src="logo.jpg" alt="Logo de Medyte Academy" loading="eager"></div></section>
    <div class="stats-strip"><div class="stat-card"><div class="stat-symbol">✦</div><div><strong>${bank.length.toLocaleString('es-BO')}</strong><small>Preguntas de práctica</small></div></div><div class="stat-card"><div class="stat-symbol">▦</div><div><strong>${catalog.length}</strong><small>Materias</small></div></div><div class="stat-card"><div class="stat-symbol">◉</div><div><strong>${topicById.size}</strong><small>Temas disponibles</small></div></div><div class="stat-card"><div class="stat-symbol">★</div><div><strong>${attempted}</strong><small>Prácticas realizadas</small></div></div></div>
    ${renderStreakAndCountdownBanner()}
    ${state.quiz?`<section class="continue-banner"><div><strong>Tu práctica sigue disponible</strong><p>Puedes continuar exactamente donde la dejaste.</p></div>${b('Continuar práctica →','resume','')}</section>`:''}
    <section class="games-highlight" aria-labelledby="homeGamesTitle">
      <div class="games-highlight-heading">
        <div><span class="eyebrow">MEDYTE GAMES</span><h2 id="homeGamesTitle">Elige cómo repasar hoy</h2><p>Cinco minijuegos. Cada partida puede sumar XP a tu perfil.</p></div>
        <a class="btn" href="juegos.html">Ver sala de juegos →</a>
      </div>
      <ul class="games-shortcuts">
        <li><a href="juegos.html#aventura"><span aria-hidden="true">🗺️</span><strong>Ruta por Materias</strong><small>Avanza por seis etapas.</small></a></li>
        <li><a href="juegos.html#guardia"><span aria-hidden="true">🩺</span><strong>Guardia Médica</strong><small>Resuelve casos de práctica.</small></a></li>
        <li><a href="juegos.html#anatomia"><span aria-hidden="true">🫀</span><strong>Atlas de Anatomía</strong><small>Ubica órganos y huesos.</small></a></li>
        <li><a href="juegos.html#supervivencia"><span aria-hidden="true">⚡</span><strong>Racha al Límite</strong><small>Responde contra el reloj.</small></a></li>
        <li><a href="juegos.html#memoria"><span aria-hidden="true">🧩</span><strong>Pares de Estudio</strong><small>Une cada concepto con su función.</small></a></li>
      </ul>
    </section>
    <section class="pro-showcase"><div><span class="eyebrow">SIMULACROS Y PROGRESO</span><h2>📝 Simulacros y 🏆 trofeos</h2><p>Escoge la dificultad, marca las preguntas que quieras revisar y compara tus resultados con tu meta. También puedes cambiar tu avatar.</p><div class="actions">${b('🎯 Simulacro 100 preg.','exam-umsa-100','')}${b('📐 Formulario y Tabla Periódica','formulario','soft')}${b('🗂️ Tarjetas Flash','flashcards','soft')}</div></div><div class="pro-showcase-art" aria-hidden="true">🏅</div></section>
    <section class="features-row"><div class="feature-spot"><span class="feature-emoji">⏱</span><div><h3>Reto del día</h3><p>10 preguntas elegidas para hoy.</p>${b('Iniciar reto diario','daily','soft smallbtn')}</div></div><div class="feature-spot"><span class="feature-emoji">♡</span><div><h3>Mis favoritas</h3><p>Guarda lo que necesitas repasar.</p>${b('Abrir favoritas','favoritos','soft smallbtn')}</div></div><div class="feature-spot"><span class="feature-emoji">⌕</span><div><h3>Biblioteca</h3><p>Busca preguntas por tema o palabra.</p>${b('Buscar preguntas','biblioteca','soft smallbtn')}</div></div></section>
    ${heading('PLAN DE ESTUDIO','Explora las cinco materias')}<div class="grid">${catalog.map(card).join('')}</div>
    ${heading('TU CAMINO','Practicar y mejorar')}<div class="grid"><div class="card"><span class="circle-icon">01</span><h3>Selecciona tu temario</h3><p>Elige una materia o combina todas.</p></div><div class="card"><span class="circle-icon">02</span><h3>Responde con confianza</h3><p>El modo práctica explica cada respuesta; el simulacro evalúa al final.</p></div><div class="card"><span class="circle-icon">03</span><h3>Analiza tus resultados</h3><p>Revisa los fallos, marca favoritas y sigue tu avance en este dispositivo.</p></div></div>
    <div class="tip">Este material es para practicar. MEDYTE ACADEMY no está afiliada a la UMSA ni ofrece exámenes oficiales.</div>`,'Inicio');}
  function materias(){setContent(`${section('MATERIAS Y TEMARIOS','Elige una materia','Encuentra los capítulos por asignatura. Elige los temas que quieras estudiar.')}
    <div class="grid">${catalog.map(card).join('')}</div>`,'Materias');}
  function temas(){const s=catalog.find(v=>v.id===state.currentSubject)||catalog[0];setContent(`${section('TEXTO GUÍA 2026',s.icon+' '+s.name,'Explora los '+s.topics.length+' capítulos y practica las preguntas de cada uno.')}
    <div class="actions">${b('← Todas las materias','materias','secondary')}${b('Practicar toda la materia','scope:subject:'+s.id,'')}</div>
    ${heading(s.source_file,'Capítulos disponibles')}<div class="topic-grid">${s.topics.map(t=>`<article class="card topic-row"><div class="topic-num">${String(t.number).padStart(2,'0')}</div><div class="topic-info"><h3>${e(t.name)}</h3><p>Capítulo ${t.number} · página ${t.page_start} del texto guía · ${byTopicCount[t.id]} preguntas</p>${b('Practicar tema →','scope:topic:'+t.id,'soft smallbtn')}</div></article>`).join('')}</div>`,'Temario');}
  function setupView(){const st=state.setup;const opts=scopeOptions(st.scope);
    setContent(`${section('SIMULACROS Y RETOS','Personaliza tu práctica','Entrena a tu ritmo, contesta preguntas aleatorias y refuerza tus conocimientos.')}
    ${state.quiz?`<section class="continue-banner"><div><strong>Hay un cuestionario pendiente.</strong><p>Si comienzas otro, se reemplazará el intento anterior.</p></div>${b('Reanudar','resume','soft')}</section>`:''}
    <div class="setup"><div class="card"><span class="eyebrow">CONFIGURACIÓN</span><h2 class="setup-title">Configura tu práctica</h2>
    <label class="control">Contenido<select id="scopeSelect">${opts}</select></label>
    <label class="control top-gap">Cantidad de preguntas<select id="countSelect">${[10,20,50,100].map(n=>`<option value="${n}" ${st.qty===n?'selected':''}>${n} preguntas</option>`).join('')}</select></label>
    <label class="control top-gap">Dificultad de las preguntas<select id="difficultySelect"><option value="all" ${st.difficulty==='all'?'selected':''}>🌈 Todas las dificultades</option><option value="facil" ${st.difficulty==='facil'?'selected':''}>🌱 Fácil</option><option value="normal" ${st.difficulty==='normal'?'selected':''}>⚡ Normal</option><option value="dificil" ${st.difficulty==='dificil'?'selected':''}>🔥 Difícil</option></select></label>
    <label class="control top-gap">Modalidad<select id="modeSelect"><option value="practice" ${st.mode==='practice'?'selected':''}>Práctica — explicación inmediata</option><option value="exam" ${st.mode==='exam'?'selected':''}>Simulacro — tiempo y nota final</option><option value="pro" ${st.mode==='pro'?'selected':''}>📝 Simulacro personalizado</option><option value="speed" ${st.mode==='speed'?'selected':''}>Reto rápido — 25 segundos por pregunta</option></select></label>
    <div class="pro-settings"><span class="eyebrow">OPCIONES DEL SIMULACRO</span><div class="pro-config-row"><label class="control">Segundos por pregunta<select id="secondsSelect">${[45,60,90,120].map(n=>`<option value="${n}" ${st.secondsPerQuestion===n?'selected':''}>${n} segundos</option>`).join('')}</select></label><label class="control">Meta personal de aciertos<select id="goalSelect">${[60,70,80,90].map(n=>`<option value="${n}" ${st.goal===n?'selected':''}>${n}%</option>`).join('')}</select></label></div><p class="small muted">Estas opciones se aplican al simulacro personalizado. La meta es solo una referencia de estudio.</p></div>
    <label class="check-line"><input type="checkbox" id="mistakesOnly" ${st.onlyMistakes?'checked':''}> Incluir solo mis errores anteriores</label>
    <label class="check-line"><input type="checkbox" id="favoritesOnly" ${st.onlyFavorites?'checked':''}> Incluir solo mis favoritas</label>
    <label class="check-line"><input type="checkbox" id="bubbleSheetCheck" ${st.bubbleSheet?'checked':''}> 🫧 Mostrar Hoja Óptica de Burbujas (entrenar llenado de alvéolos A, B, C, D)</label>
    <p class="small muted" id="questionAvailability">La dificultad es orientativa (clasificación automática pendiente de revisión docente). Si hay menos preguntas disponibles, se utilizarán solo las encontradas.</p>
    ${b('✦ Comenzar ahora','start','block')}<div style="margin-top:10px">${b('🎯 Simulacro de práctica (100 preguntas · 5 materias)','exam-umsa-100','soft block')}</div></div>
    <div class="card"><span class="eyebrow">MODOS DISPONIBLES</span><h2 class="setup-title">Opciones de práctica</h2><div class="feature-list"><div>🧠 <strong>Práctica:</strong> te explica la respuesta después de elegir.</div><div>⏱️ <strong>Simulacro personalizado:</strong> tiempo personalizable, marcadores para revisar, resumen y meta de aciertos.</div><div>⚡ <strong>Reto rápido:</strong> velocidad y concentración con 25 segundos por pregunta.</div><div>🏅 <strong>XP y niveles:</strong> ganas 10 XP por respuesta correcta.</div><div>↺ <strong>Repaso:</strong> refuerza tus errores y tus favoritas.</div></div>${b('Reto del día (10 preguntas)','daily','soft')}${b('🏆 Ver trofeos y avatares','trofeos','soft')}
    <div class="divider"></div>
    <span class="eyebrow">COMPITE CON TUS COMPAÑEROS</span>
    <h3 style="margin:6px 0 8px">⚔️ Duelo entre amigos (sin servidor)</h3>
    <p class="small muted" style="margin:0 0 10px">Si un compañero te pasó un código de reto por WhatsApp, pégalo aquí para resolver exactamente las mismas preguntas:</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <input id="duelCodeInput" placeholder="Pega aquí el código MDY-..." style="flex:1;min-width:180px">
      ${b('⚔️ Aceptar duelo','join-duel','')}
    </div>
    </div></div>`,'Simulacros');}
  function scopeOptions(selected){return `<option value="mixed" ${selected==='mixed'?'selected':''}>Todas las materias (${bank.length})</option>`+
    catalog.map(s=>`<option value="subject:${s.id}" ${selected==='subject:'+s.id?'selected':''}>${e(s.name)} (${subjectCount[s.id]})</option>`).join('')+
    catalog.flatMap(s=>s.topics.map(t=>`<option value="topic:${t.id}" ${selected==='topic:'+t.id?'selected':''}>${e(s.name)} · ${e(t.name)} (${byTopicCount[t.id]})</option>`)).join('');}
  function poolFromSetup(){let list=bank;let sc=state.setup.scope;if(sc.startsWith('subject:'))list=list.filter(q=>q.topic.startsWith(sc.slice(8)));else if(sc.startsWith('topic:'))list=list.filter(q=>q.topic===sc.slice(6));if(state.setup.onlyMistakes){const m=new Set(profile.mistakes);list=list.filter(q=>m.has(q.id));}if(state.setup.onlyFavorites){const f=new Set(profile.favorites);list=list.filter(q=>f.has(q.id));}if(state.setup.difficulty!=='all')list=list.filter(q=>difficultyOf(q)===state.setup.difficulty);return list;}
  function shuffledCopy(values,rng=Math.random){const arr=[...values];for(let i=arr.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[arr[j],arr[i]]=[arr[i],arr[j]];}return arr;}
  function dailyRng(key){let x=2166136261;for(let i=0;i<key.length;i++)x=Math.imul(x^key.charCodeAt(i),16777619)>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
  function beginQuiz({items,mode='practice',scope='mixed',daily=false,difficulty='all',goal=70,secondsPerQuestion=90,bubbleSheet=false}){
    if(state.quiz&&!confirm('Tienes una práctica sin terminar. ¿Quieres reemplazarla por una nueva?'))return;
    if(state.timer)clearInterval(state.timer);
    const count=items.length,deadline=mode==='practice'?null:Date.now()+count*(mode==='speed'?25000:mode==='pro'?secondsPerQuestion*1000:90000);
    state.quiz={items,answerOrders:items.map(()=>shuffledCopy([0,1,2,3])),answers:Array(count).fill(null),revealed:Array(count).fill(false),pos:0,mode,scope,daily,deadline,started:Date.now(),difficulty,goal,secondsPerQuestion,marked:new Set(),bubbleSheet:!!bubbleSheet};
    state.lastResult=null;saveDraft();nav('quiz');startTimer();
  }
  function startQuiz(){const pool=poolFromSetup();if(!pool.length){toast('No hay preguntas para esta selección. Cambia el filtro o el tema.');return;}
    beginQuiz({items:shuffledCopy(pool).slice(0,Math.min(state.setup.qty,pool.length)),mode:state.setup.mode,scope:state.setup.scope,difficulty:state.setup.difficulty,goal:state.setup.goal,secondsPerQuestion:state.setup.secondsPerQuestion,bubbleSheet:state.setup.bubbleSheet});}
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
    const controls=z.items.length<=20||z.mode==='pro'?`<div class="pro-nav-legend">🟩 Respondida · 🟨 Marcada para revisar · ⬜ Pendiente · <button type="button" class="link-inline-btn" data-action="toggle-bubble-sheet">${z.bubbleSheet?'🫧 Ocultar hoja de burbujas':'🫧 Abrir hoja óptica de burbujas'}</button></div><div class="question-map pro-question-map" aria-label="Ir a otra pregunta">${z.items.map((v,i)=>`<button type="button" data-action="go:${i}" class="map-btn ${i===z.pos?'active':''} ${z.answers[i]!==null?'answered':''} ${z.marked?.has(i)?'marked':''}" aria-label="Pregunta ${i+1}${z.answers[i]!==null?', respondida':''}${z.marked?.has(i)?', marcada para revisar':''}">${i+1}</button>`).join('')}</div>`:`<div class="pro-nav-legend"><button type="button" class="link-inline-btn" data-action="toggle-bubble-sheet">${z.bubbleSheet?'🫧 Ocultar hoja de burbujas':'🫧 Abrir hoja óptica de burbujas'}</button></div>`;
    const bubbleSheetHtml = z.bubbleSheet ? `<section class="card bubble-sheet-card" aria-label="Hoja óptica de respuestas">
      <div class="streak-head"><div><span class="eyebrow">SIMULADOR DE ALVÉOLOS</span><h3>🫧 Hoja Óptica de Respuestas (${selected}/${z.items.length})</h3></div><span class="small muted">Rellena con cuidado para no saltar de fila</span></div>
      <div class="bubble-grid">
        ${z.items.map((itemQ, qIdx) => {
          const ord = z.answerOrders[qIdx];
          const chosenOrig = z.answers[qIdx];
          const isRev = z.mode==='practice' && z.revealed[qIdx];
          return `<div class="bubble-row ${qIdx===z.pos?'current-row':''} ${z.marked?.has(qIdx)?'marked-row':''}">
            <button type="button" class="bubble-num" data-action="go:${qIdx}">${String(qIdx+1).padStart(2,'0')}.</button>
            <div class="bubble-circles">
              ${ord.map((origOpt, letterIdx) => {
                const filled = chosenOrig === origOpt;
                return `<button type="button" class="bubble-circle ${filled?'filled':''}" data-action="bubble:${qIdx}:${origOpt}" ${isRev?'disabled':''} aria-label="Pregunta ${qIdx+1} opción ${'ABCD'[letterIdx]}">${'ABCD'[letterIdx]}</button>`;
              }).join('')}
            </div>
          </div>`;
        }).join('')}
      </div>
    </section>` : '';
    setContent(`<div class="quiz-shell"><div class="quiz-topline"><span class="eyebrow">${z.daily?'RETO DEL DÍA':z.mode==='speed'?'RETO RÁPIDO':z.mode==='pro'?'SIMULACRO PERSONALIZADO':z.mode==='exam'?'SIMULACRO':'PRÁCTICA'} · ${topicName(q.topic)}</span>${z.deadline?`<span class="countdown" id="clock">⏱ ${formatTime(z.deadline-Date.now())}</span>`:''}</div>
      <div class="quiz-heading"><span class="pill neutral">Pregunta ${z.pos+1} de ${z.items.length}</span><span class="mini-stat">${dIcon(difficultyOf(q))} ${dName(difficultyOf(q))} · ${selected} respondidas</span></div>
      <div class="progressbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(selected/z.items.length*100)}"><span style="width:${(selected/z.items.length)*100}%"></span></div>
      <section class="card quiz-card"><div class="question-head"><span class="small muted">${e(q.id)} · ${e(topicById.get(q.topic)?.name||'')}</span><button type="button" data-action="fav:${e(q.id)}" class="favorite-btn ${profile.favorites.includes(q.id)?'is-on':''}" aria-label="${profile.favorites.includes(q.id)?'Quitar de favoritas':'Guardar pregunta en favoritas'}">${profile.favorites.includes(q.id)?'♥ Guardada':'♡ Guardar'}</button></div>
      <h1 class="question">${e(q.q)}</h1><div class="quiz-options" aria-label="Opciones de respuesta">${opts}</div>
      ${revealed?`<div class="feedback ${choice===q.c?'':'wrong'}"><strong>${choice===q.c?'✓ ¡Correcto!':'✕ Respuesta correcta: '+e(q.a[q.c])}</strong><p>${e(q.e)}</p></div>`:''}
      ${z.mode==='pro'?`<div class="pro-review-strip"><button type="button" class="review-toggle ${z.marked.has(z.pos)?'marked':''}" data-action="mark" aria-pressed="${z.marked.has(z.pos)}">${z.marked.has(z.pos)?'🚩 Marcada para revisar':'🚩 Marcar para revisar'}</button><span>${z.marked.size} marcadas · Meta: ${z.goal}%</span></div>`:''}<div class="quiz-footer"><div class="quiz-hint">${z.mode==='practice'?'Recibirás una explicación al elegir.':'Puedes revisar tus respuestas antes de finalizar.'}</div><div class="actions quiz-actions">${z.pos>0?b('← Anterior','prev','secondary smallbtn'):''}${z.pos<z.items.length-1?b('Siguiente →','next','secondary smallbtn'):''}${b('Finalizar','finish','smallbtn')}</div></div></section>
      ${controls}${bubbleSheetHtml}${z.mode==='pro'?`<div class="pro-exam-summary">📝 ${selected}/${z.items.length} respondidas · ${z.items.length-selected} pendientes · ${z.marked.size} marcadas · Meta personal: ${z.goal}%</div>`:''}<div class="quiet-actions">${b('Guardar y salir','pause','secondary smallbtn')}<span class="small muted">El intento se guarda automáticamente.</span></div></div>`,'Pregunta '+(z.pos+1));
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
    const entry={date:new Date().toISOString(),correct,total:items.length,mode:z.mode,scope:z.scope,items,daily:z.daily,timedOut:byTime,difficulty:z.difficulty||'all',goal:z.goal||70,secondsPerQuestion:z.secondsPerQuestion||90,markedCount:z.marked?.size||0,elapsedSeconds:Math.round((Date.now()-z.started)/1000)};
    profile.xp+=correct*10;
    profile.history=[entry,...profile.history].slice(0,50);
    recordTodayStudy();
    const mistakes=new Set(profile.mistakes);
    items.forEach(row=>{
      const srsItem = profile.srs[row.id] || {fails:0, streak:0};
      if(row.answer===row.correct){
        srsItem.streak = (srsItem.streak||0) + 1;
        if(srsItem.streak >= 3 || srsItem.fails <= 1){ mistakes.delete(row.id); }
      }else{
        srsItem.fails = (srsItem.fails||0) + 1;
        srsItem.streak = 0;
        mistakes.add(row.id);
      }
      profile.srs[row.id] = srsItem;
    });
    profile.mistakes=[...mistakes];
    if(z.daily)profile.dailyHistory[dateKey()]={correct,total:items.length};
    state.lastResult=entry;state.reviewOpen=new Set();state.quiz=null;saveDraft();save();nav('resultado');
    if(correct/items.length>=0.6)window.MedyteEpic?.celebrate('Práctica terminada');
    if(byTime)toast('Terminó el tiempo del reto. Se guardó tu resultado.');
  }
  function reviewHtml(r){return r.items.map((row,i)=>{const q=questionById.get(row.id);if(!q)return'';
    const ok=row.answer===row.correct;
    return `<article class="review-item"><div class="review-heading"><span class="small muted">${i+1}. ${topicName(q.topic)}</span><span class="pill ${ok?'green':'red'}">${ok?'Correcta':row.answer===null?'Sin responder':'Por repasar'}</span></div>
    <h4 class="review-question">${e(q.q)}</h4><p>Tu respuesta: <strong>${row.answer===null?'No respondida':e(q.a[row.answer]||'')}</strong></p><p>Respuesta correcta: <strong>${e(q.a[q.c])}</strong></p><div class="review-explanation">${e(q.e)}</div><button type="button" class="favorite-btn small-fav ${profile.favorites.includes(q.id)?'is-on':''}" data-action="fav:${e(q.id)}">${profile.favorites.includes(q.id)?'♥ Guardada':'♡ Marcar favorita'}</button></article>`;
  }).join('');}
  function resultado(){const r=state.lastResult||profile.history[0];if(!r)return nav('progreso');const pct=r.total?Math.round(r.correct/r.total*100):0;
    setContent(`${section('RESULTADOS','Terminaste la práctica','Revisa qué respondiste bien y qué temas conviene repasar.')}
    <div class="card result-card"><div class="result-ring" style="--pct:${pct}%"><div><b>${pct}%</b><small>Aciertos</small></div></div><div class="text-center"><h2>${r.correct} de ${r.total} respuestas correctas</h2><p class="muted">+${r.correct*10} XP · ${r.mode==='game-adventure'?'Aventura':r.mode==='practice'?'Práctica':r.mode==='speed'?'Reto rápido':r.mode==='pro'?'Simulacro personalizado':'Simulacro'}${r.timedOut?' · Tiempo agotado':''}${r.mode==='pro'?' · '+dName(r.difficulty||'all'):''}</p><div class="actions centered">${b('↺ Practicar otra vez','simulacros','')}${b('⚔️ Retar a un amigo','share-duel','soft')}${b('Mis errores','errores','secondary')}${b('Descargar CSV','export-result','soft')}${b('🖨️ Imprimir / Guardar PDF','print-result','soft')}</div></div>
    ${r.mode==='pro'?`<div class="pro-result-box"><strong>${pct>=(r.goal||70)?'🏆 Alcanzaste tu meta':'Aún no alcanzaste tu meta'}</strong><span>Tu resultado: ${pct}% · Meta elegida: ${r.goal||70}% · Tiempo empleado: ${formatTime((r.elapsedSeconds||0)*1000)} · ${r.markedCount||0} marcadas para revisar</span><p>Esta comparación es orientativa, no una calificación oficial de admisión.</p></div><div class="pro-subject-breakdown"><h3>Aciertos por materia</h3>${catalog.map(s=>{const arr=r.items.filter(x=>questionById.get(x.id)?.topic.startsWith(s.id));if(!arr.length)return '';const ok=arr.filter(x=>x.answer===x.correct).length;return `<div><span>${s.icon} ${e(s.name)}</span><strong>${ok}/${arr.length} (${Math.round(ok*100/arr.length)}%)</strong></div>`;}).join('')}</div>`:''}
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
    ${heading('LOGROS','Tus insignias')}<div class="achievements">${achievements()}</div><div class="actions">${b('🏆 Abrir sala de trofeos y avatares','trofeos','soft')}</div>
    <div class="panel-heading section-heading"><div><span class="eyebrow">INTENTOS RECIENTES · ${e(profile.studentName)} (${e(profile.career)})</span><h2>Historial</h2></div><div class="actions" style="margin:0">${b('👤 Editar perfil / Cuentas','perfil-modal','soft smallbtn')}${b('📥 Exportar progreso','export-progress','soft smallbtn')}${b('📤 Importar progreso','import-progress','secondary smallbtn')}</div></div>
    <div class="card">${hist.length?`<div class="table-wrap"><table class="history-table"><thead><tr><th>Fecha</th><th>Modo</th><th>Resultado</th><th>Revisión</th></tr></thead><tbody>${hist.map((r,i)=>`<tr><td>${e(new Date(r.date).toLocaleDateString('es-BO'))}</td><td>${r.mode==='game-adventure'?'Aventura':r.mode==='practice'?'Práctica':r.mode==='speed'?'Reto rápido':r.mode==='pro'?'Simulacro personalizado':'Simulacro'} · ${dName(r.difficulty||'all')}</td><td>${r.correct}/${r.total} (${r.total?Math.round(r.correct*100/r.total):0}%)</td><td>${b('Revisar','history:'+i,'soft smallbtn')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Aún no has completado una práctica. ¡Elige una materia para comenzar!</div>'}</div>
    <p class="privacy-footnote">🔒 La versión pública de GitHub Pages no registra cuentas, no guarda contraseñas y no envía resultados al administrador.</p>`,'Mi progreso');}

function trofeos(){
  const games=readJson('medyte_games_v1')||{};
  const completedWorlds=Object.values(games.adventure||{}).filter(x=>x&&Number(x.best)>=60).length;
  const anatomyLevels=Object.keys(games.anatomy||{}).length;
  const bestExam=profile.history.filter(r=>r.mode==='pro').reduce((m,r)=>Math.max(m,r.total?Math.round(100*r.correct/r.total):0),0);
  const proWins=profile.history.filter(r=>r.mode==='pro'&&r.total&&r.correct/r.total*100>=(r.goal||70)).length;
  const all=profile.history.flatMap(r=>r.items||[]),correct=all.filter(x=>x.answer===x.correct).length;
  const trophies=[
    {icon:'🌟',name:'Primer examen',desc:'Completar una práctica',ok:profile.history.length>=1},
    {icon:'📚',name:'Constancia',desc:'Finalizar 5 prácticas',ok:profile.history.length>=5},
    {icon:'🧠',name:'50 aciertos',desc:'Lograr 50 aciertos',ok:correct>=50},
    {icon:'📝',name:'Simulacro personalizado',desc:'Terminar el primer simulacro personalizado',ok:profile.history.some(r=>r.mode==='pro')},
    {icon:'🎯',name:'Objetivo conseguido',desc:'Alcanzar la meta de un simulacro',ok:proWins>0},
    {icon:'🔥',name:'90% de aciertos',desc:'Lograr 90% o más en un simulacro',ok:bestExam>=90},
    {icon:'💎',name:'100 puntos',desc:'Acumular 100 XP',ok:profile.xp>=100},
    {icon:'🏅',name:'Leyenda del campus',desc:'Acumular 1.500 XP',ok:profile.xp>=1500},
    {icon:'♡',name:'Coleccionista',desc:'Guardar 10 favoritas',ok:profile.favorites.length>=10},
    {icon:'🗺️',name:'Explorador de mundos',desc:'Superar un mundo de Aventura',ok:completedWorlds>=1},
    {icon:'🫀',name:'Anatomía Challenge',desc:'Completar un nivel de Anatomía',ok:anatomyLevels>=1},
    {icon:'🦴',name:'Maestro Anatómico',desc:'Completar los 5 niveles de Anatomía',ok:anatomyLevels>=5},
    {icon:'⚡',name:'Superviviente Médico',desc:'Lograr racha de 5+ en Duelo de Supervivencia',ok:Number(games.survival?.bestStreak||0)>=5},
    {icon:'🧩',name:'Memoria Prodigiosa',desc:'Superar un mazo de Memoria Médica',ok:Object.keys(games.memory||{}).length>=1},
    {icon:'🏆',name:'Aventura completa',desc:'Superar los seis mundos de Aventura',ok:completedWorlds>=6}
  ];
  const earned=trophies.filter(t=>t.ok).length,a=selectedAvatar();
  setContent(`${section('MEDYTE REWARDS','Trofeos y avatares','Personaliza tu personaje y descubre las recompensas que obtienes al estudiar y jugar.')}
    <section class="trophy-profile card"><div class="trophy-avatar-large">${a.icon}</div><div><span class="eyebrow">TU PERSONAJE</span><h2>${e(a.name)}</h2><p>✦ ${Math.floor(profile.xp)} XP · Nivel ${level()} · ${earned}/${trophies.length} trofeos desbloqueados</p><div class="progressbar" role="progressbar" aria-valuenow="${earned}" aria-valuemin="0" aria-valuemax="${trophies.length}"><span style="width:${100*earned/trophies.length}%"></span></div></div></section>
    ${heading('PERSONALIZA TU PERFIL','Colección de avatares')}
    <p class="small muted">Los avatares se desbloquean con los XP ganados. Solo cambian la apariencia de tu perfil.</p>
    <div class="avatar-grid">${AVATARS.map(av=>{const unlocked=profile.xp>=av.xp;return `<button type="button" class="avatar-item ${a.id===av.id?'active':''} ${unlocked?'':'locked'}" data-action="avatar:${av.id}" ${unlocked?'':'disabled'} aria-pressed="${a.id===av.id}"><span class="avatar-emoji">${unlocked?av.icon:'🔒'}</span><strong>${e(av.name)}</strong><small>${unlocked?a.id===av.id?'✓ Seleccionado':'Elegir avatar':av.xp+' XP para habilitar'}</small></button>`}).join('')}</div>
    ${heading('VITRINA DE MEDALLAS',`Tus trofeos · ${earned}/${trophies.length}`)}
    <div class="trophy-grid">${trophies.map(t=>`<article class="trophy-card ${t.ok?'unlocked':'pending'}"><span class="trophy-icon">${t.ok?t.icon:'🔒'}</span><strong>${e(t.name)}</strong><p>${e(t.desc)}</p><small>${t.ok?'✓ Conseguido':'Pendiente'}</small></article>`).join('')}</div>
    <div class="tip">Los trofeos se calculan a partir del progreso almacenado en este navegador. No existe una clasificación pública ni sincronización de cuentas.</div>
    <div class="actions">${b('📝 Ir al Simulacro personalizado','open-pro','')}${b('Ver mi progreso','progreso','secondary')}<a class="btn secondary" href="juegos.html">🎮 Ir a MEDYTE GAMES</a></div>`,'Trofeos y avatares');
}

  function errores(){
    const list=profile.mistakes.filter(id=>questionById.has(id)).sort((a,b)=>(profile.srs[b]?.fails||1)-(profile.srs[a]?.fails||1));
    const criticalCount=list.filter(id=>(profile.srs[id]?.fails||1)>=2).length;
    setContent(`${section('REPETICIÓN ESPACIADA INTELIGENTE','Repaso de errores',`Tienes ${list.length} preguntas por reforzar (${criticalCount} críticas con 2 o más fallos). Si respondes bien 3 veces seguidas una pregunta crítica, queda dominada.`)}
    <div class="actions">${b('↺ Practicar mis errores','repeat-mistakes','')}${criticalCount?b('🔥 Misión de refuerzo (errores críticos)','repeat-critical-mistakes','soft'):''}${b('Ir a materias','materias','secondary')}</div>
    ${list.length?`<div class="card list-card">${list.slice(0,35).map(id=>{
      const q=questionById.get(id);
      const info=profile.srs[id]||{fails:1,streak:0};
      const dom=Math.min(3, info.streak||0);
      return `<article class="review-item">
        <div class="review-heading">
          <span class="small muted">${topicName(q.topic)}</span>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="pill ${info.fails>=2?'red':'neutral'}">Fallada ${info.fails} ${info.fails===1?'vez':'veces'}</span>
            <span class="pill green" title="Responde bien 3 veces seguidas para dominarla">Dominio: ${dom}/3</span>
          </div>
        </div>
        <h4 class="review-question">${e(q.q)}</h4>
        <div class="review-explanation"><strong>Respuesta: ${e(q.a[q.c])}</strong> · ${e(q.e)}</div>
      </article>`;}).join('')}${list.length>35?'<p class="small muted">Se muestran las primeras 35 preguntas ordenadas por prioridad.</p>':''}</div>`:'<div class="empty empty-spaced">¡No tienes preguntas pendientes de repaso! Cuando falles una pregunta en un simulacro, aparecerá aquí.</div>'}`,'Repaso de errores');}
  function favoritos(){const ids=profile.favorites.filter(id=>questionById.has(id));setContent(`${section('MIS APUNTES','Preguntas favoritas',`Has guardado ${ids.length} preguntas. Úsalas para repasar lo más importante.`)}
    <div class="actions">${b('Practicar favoritas','repeat-favorites','')}${b('Explorar el banco','biblioteca','secondary')}</div>
    ${ids.length?`<div class="card list-card">${ids.map((id,i)=>{const q=questionById.get(id);return `<article class="review-item"><div class="review-heading"><span class="small muted">${i+1}. ${topicName(q.topic)}</span><button class="favorite-btn is-on" type="button" data-action="fav:${e(id)}">♥ Quitar</button></div><h4 class="review-question">${e(q.q)}</h4><div class="review-explanation">${e(q.e)}</div></article>`;}).join('')}</div>`:'<div class="empty empty-spaced">Todavía no guardaste preguntas. Puedes usar el botón ♡ en los simulacros o en la biblioteca.</div>'}`,'Favoritas');}
  function biblioteca(){const filter=state.library;setContent(`${section('BIBLIOTECA EDUCATIVA','Banco de preguntas','Busca entre las 1.000 preguntas de las cinco materias y marca las que te interesen para repasar.')}
    <div class="library-filters"><label class="control">Buscar preguntas<input id="librarySearch" type="search" placeholder="Ej.: homeostasis, ecuaciones, acentuación..." value="${e(filter.search)}" autocomplete="off"></label><label class="control">Materia<select id="librarySubject"><option value="all">Todas las materias</option>${catalog.map(s=>`<option value="${s.id}" ${filter.subject===s.id?'selected':''}>${e(s.name)}</option>`).join('')}</select></label><label class="control">Dificultad<select id="libraryDifficulty">${[['all','Todas'],['facil','🌱 Fácil'],['normal','⚡ Normal'],['dificil','🔥 Difícil']].map(([d,title])=>`<option value="${d}" ${filter.difficulty===d?'selected':''}>${title}</option>`).join('')}</select></label></div>
    <div id="libraryResults" aria-live="polite"></div>`,'Banco de preguntas');renderLibraryResults();}
  function renderLibraryResults(){const list=bank.filter(q=>(state.library.subject==='all'||q.topic.startsWith(state.library.subject))&&(state.library.difficulty==='all'||difficultyOf(q)===state.library.difficulty)&&(!state.library.search||[q.q,q.e,topicById.get(q.topic)?.name].join(' ').toLocaleLowerCase('es').includes(state.library.search.toLocaleLowerCase('es'))));
    const perPage=12,maxPage=Math.max(1,Math.ceil(list.length/perPage));state.library.page=Math.max(1,Math.min(state.library.page,maxPage));
    const page=list.slice((state.library.page-1)*perPage,state.library.page*perPage);
    const html=`<div class="library-summary"><span>${list.length} preguntas encontradas</span><span>Página ${state.library.page} de ${maxPage}</span></div>${page.length?`<div class="library-list">${page.map(q=>`<article class="card question-library-card"><div class="review-heading"><span class="small muted">${topicName(q.topic)} · ${dIcon(difficultyOf(q))} ${dName(difficultyOf(q))}</span><button type="button" class="favorite-btn ${profile.favorites.includes(q.id)?'is-on':''}" data-action="fav:${e(q.id)}">${profile.favorites.includes(q.id)?'♥ Guardada':'♡ Guardar'}</button></div><h3>${e(q.q)}</h3><div class="library-choices">${q.a.map((x,i)=>`<div><b>${'ABCD'[i]}.</b> ${e(x)}</div>`).join('')}</div>${state.library.open.has(q.id)?`<div class="feedback"><strong>✓ ${e(q.a[q.c])}</strong><p>${e(q.e)}</p></div>`:''}${profile.notes[q.id]?`<div class="personal-note">📝 <strong>Mi apunte:</strong> ${e(profile.notes[q.id])}</div>`:''}<div class="library-controls">${b(state.library.open.has(q.id)?'Ocultar explicación':'Ver respuesta explicada','reveal:'+q.id,'soft smallbtn')}${b(profile.notes[q.id]?'✏️ Editar apunte':'📝 Agregar apunte','note:'+q.id,'secondary smallbtn')}</div></article>`).join('')}</div>`:'<div class="empty">No hay coincidencias. Prueba otra palabra.</div>'}
      <div class="pagination">${b('← Anterior','lib-prev','secondary smallbtn')}<span>Página ${state.library.page}/${maxPage}</span>${b('Siguiente →','lib-next','secondary smallbtn')}</div>`;
    if($('libraryResults'))$('libraryResults').innerHTML=html;
  }
  function acerca(){setContent(`${section('MEDYTE ACADEMY','Información del proyecto','Página de práctica disponible en GitHub Pages.')}
    <div class="grid"><div class="card"><span class="circle-icon">📘</span><h3>Contenido educativo</h3><p>Banco de 1.000 preguntas con explicaciones, organizado en cinco materias y 52 temas. Biología incluye seis temas.</p></div><div class="card"><span class="circle-icon">⏱</span><h3>Prácticas y retos</h3><p>Simulacros, modo práctica, desafío rápido, reto diario, favoritas y repaso de errores.</p></div><div class="card"><span class="circle-icon">🔒</span><h3>Privacidad</h3><p>El progreso se guarda en este navegador mediante almacenamiento local. Esta edición no requiere cuenta ni recopila contraseñas.</p></div></div>
    ${heading('DATOS PERSONALES','Control de tu progreso')}<div class="card"><p>Si borras los datos de este navegador, tu historial puede desaparecer. Puedes descargar una copia de tus resultados.</p><div class="actions">${b('📥 Descargar mis datos (.JSON)','export-progress','soft')}${b('📤 Restaurar / Importar datos (.JSON)','import-progress','soft')}${b('👤 Gestionar perfiles','perfil-modal','secondary')}${b('Eliminar progreso local','clear-progress','secondary')}</div></div>
    <div class="tip">MEDYTE ACADEMY es un proyecto educativo independiente. Las preguntas se ofrecen únicamente como material de estudio. No constituyen un examen oficial de la Universidad Mayor de San Andrés y sus dificultades deben revisarse antes de una evaluación formal.</div>`,'Información');}
  function toggleFav(id){if(!questionById.has(id))return;const s=new Set(profile.favorites);s.has(id)?s.delete(id):s.add(id);profile.favorites=[...s];save();uiHeader();
    if(state.page==='quiz')quizView();else if(state.page==='favoritos')favoritos();else if(state.page==='biblioteca')renderLibraryResults();else if(state.page==='resultado')resultado();toast(s.has(id)?'Pregunta guardada en favoritas.':'Pregunta quitada de favoritas.');}


  const PERIODIC_ELEMENTS = [
    {z:1,s:'H',name:'Hidrógeno',mass:'1,008',cat:'no-metal',val:'±1',use:'Elemento más abundante; presente en el agua, ácidos y moléculas orgánicas.'},
    {z:2,s:'He',name:'Helio',mass:'4,0026',cat:'gas-noble',val:'0',use:'Gas noble inerte con configuración electrónica 1s².'},
    {z:3,s:'Li',name:'Litio',mass:'6,94',cat:'alcalino',val:'+1',use:'Metal alcalino del grupo IA; el más ligero de los metales.'},
    {z:6,s:'C',name:'Carbono',mass:'12,011',cat:'no-metal',val:'±2, ±4',use:'Base de la química orgánica y las biomoléculas; tetravalente (4 enlaces).' },
    {z:7,s:'N',name:'Nitrógeno',mass:'14,007',cat:'no-metal',val:'-3, +1..+5',use:'Forma el 78% del aire y es componente clave de aminoácidos y ácidos nucleicos.'},
    {z:8,s:'O',name:'Oxígeno',mass:'15,999',cat:'no-metal',val:'-2 (-1 en peróxidos)',use:'Aceptador final de electrones en la respiración celular aeróbica.'},
    {z:9,s:'F',name:'Flúor',mass:'18,998',cat:'halogeno',val:'-1',use:'Halógeno más electronegativo de toda la tabla periódica (4,0 en escala Pauling).'},
    {z:11,s:'Na',name:'Sodio',mass:'22,990',cat:'alcalino',val:'+1',use:'Principal catión del líquido extracelular; clave en el potencial de acción.'},
    {z:12,s:'Mg',name:'Magnesio',mass:'24,305',cat:'alcalinoterreo',val:'+2',use:'Átomo central de la molécula de clorofila y cofactor de muchas enzimas.'},
    {z:13,s:'Al',name:'Aluminio',mass:'26,982',cat:'metal',val:'+3',use:'Metal trivalente anfótero muy frecuente en ejercicios de estequiometría.'},
    {z:15,s:'P',name:'Fósforo',mass:'30,974',cat:'no-metal',val:'±3, +5',use:'Forma parte del ATP, ADN, ARN, fosfolípidos de membrana y huesos.'},
    {z:16,s:'S',name:'Azufre',mass:'32,06',cat:'no-metal',val:'-2, +2, +4, +6',use:'Forma puentes disulfuro en proteínas (cisteína) y el ácido sulfúrico (H₂SO₄).'},
    {z:17,s:'Cl',name:'Cloro',mass:'35,45',cat:'halogeno',val:'-1, +1, +3, +5, +7',use:'Principal anión extracelular; forma el HCl gástrico.'},
    {z:19,s:'K',name:'Potasio',mass:'39,098',cat:'alcalino',val:'+1',use:'Principal catión intracelular; mantiene el potencial de reposo de la membrana.'},
    {z:20,s:'Ca',name:'Calcio',mass:'40,078',cat:'alcalinoterreo',val:'+2',use:'Indispensable en la mineralización ósea, contracción muscular y coagulación.'},
    {z:26,s:'Fe',name:'Hierro',mass:'55,845',cat:'transicion',val:'+2, +3',use:'En estado ferroso (Fe²⁺) une el oxígeno en la hemoglobina y mioglobina.'},
    {z:29,s:'Cu',name:'Cobre',mass:'63,546',cat:'transicion',val:'+1, +2',use:'Participa en citocromos de la cadena respiratoria mitocondrial.'},
    {z:30,s:'Zn',name:'Zinc',mass:'65,38',cat:'transicion',val:'+2',use:'Oligoelemento cofactor de la anhidrasa carbónica y ADN polimerasas.'},
    {z:35,s:'Br',name:'Bromo',mass:'79,904',cat:'halogeno',val:'-1, +1, +3, +5, +7',use:'Único no metal líquido a temperatura ambiente.'},
    {z:47,s:'Ag',name:'Plata',mass:'107,87',cat:'transicion',val:'+1',use:'Excelente conductor eléctrico y térmico; valencia fija +1.'},
    {z:53,s:'I',name:'Yodo',mass:'126,90',cat:'halogeno',val:'-1, +1, +3, +5, +7',use:'Necesario para sintetizar las hormonas tiroideas T3 y T4.'},
    {z:79,s:'Au',name:'Oro',mass:'196,97',cat:'transicion',val:'+1, +3',use:'Metal noble de transición; estados de oxidación auroso (+1) y áurico (+3).'},
    {z:80,s:'Hg',name:'Mercurio',mass:'200,59',cat:'transicion',val:'+1, +2',use:'Único metal líquido a temperatura ambiente.'},
    {z:82,s:'Pb',name:'Plomo',mass:'207,2',cat:'metal',val:'+2, +4',use:'Metal pesado con valencias +2 (plumboso) y +4 (plúmbico).'}
  ];

  function formularioView(){
    const tab = state.formTab || 'tabla';
    const sel = state.selectedElement || PERIODIC_ELEMENTS[0];
    setContent(`${section('MATERIAL DE CONSULTA RÁPIDA','📐 Formulario y Tabla Periódica','Consulta al instante las valencias de los elementos más preguntados y las fórmulas esenciales de Física, Química, Matemáticas y Biología.')}
      <div class="tabstrip" style="margin-bottom:18px">
        ${[['tabla','🧪 Tabla Periódica y Valencias'],['fisica','⚡ Fórmulas de Física'],['quimica','⚗️ Química y Disoluciones'],['mate','🔢 Matemáticas'],['biologia','🌿 Resumen Biología y Lenguaje']].map(([id,label])=>`<button type="button" class="${tab===id?'selected':''}" data-action="form-tab:${id}">${label}</button>`).join('')}
      </div>

      ${tab==='tabla' ? `
        <div class="card">
          <span class="eyebrow">ELEMENTOS CLAVE DEL EXAMEN · TOCA UN ELEMENTO PARA VER DETALLES</span>
          <div class="periodic-selected-banner">
            <div class="periodic-big-symbol cat-${sel.cat}"><span>Z = ${sel.z}</span><strong>${sel.s}</strong><small>${sel.mass}</small></div>
            <div>
              <h2 style="margin:0 0 6px">${e(sel.name)} (${sel.s})</h2>
              <p style="margin:0 0 6px"><strong>Números de oxidación / Valencias:</strong> <span class="pill green">${e(sel.val)}</span> · <strong>Masa atómica:</strong> ${sel.mass} u</p>
              <p class="muted" style="margin:0">${e(sel.use)}</p>
            </div>
          </div>
          <div class="periodic-grid" aria-label="Elementos químicos esenciales">
            ${PERIODIC_ELEMENTS.map(el=>`<button type="button" class="periodic-cell cat-${el.cat} ${sel.z===el.z?'active':''}" data-action="el-select:${el.z}">
              <span class="el-z">${el.z}</span>
              <strong class="el-sym">${el.s}</strong>
              <small class="el-name">${e(el.name)}</small>
              <span class="el-val">${e(el.val)}</span>
            </button>`).join('')}
          </div>
        </div>
      ` : ''}

      ${tab==='fisica' ? `
        <div class="grid">
          <div class="card"><h3>🚀 Cinemática (MRU y MRUV)</h3>
            <ul class="formula-list">
              <li><strong>MRU (velocidad constante):</strong> <code>d = v · t</code></li>
              <li><strong>Velocidad final (MRUV):</strong> <code>v_f = v_0 ± a · t</code></li>
              <li><strong>Ecuación sin tiempo:</strong> <code>v_f² = v_0² ± 2 · a · d</code></li>
              <li><strong>Distancia en MRUV:</strong> <code>d = v_0·t ± ½·a·t²</code></li>
              <li><strong>Caída libre:</strong> usa <code>g ≈ 9,8 m/s²</code> (o <code>10 m/s²</code> según el enunciado).</li>
            </ul>
          </div>
          <div class="card"><h3>⚙️ Dinámica, Trabajo y Energía</h3>
            <ul class="formula-list">
              <li><strong>Segunda Ley de Newton:</strong> <code>F_neta = m · a</code> (en Newtons, N = kg·m/s²)</li>
              <li><strong>Peso:</strong> <code>W = m · g</code> · <strong>Fricción:</strong> <code>f_r = μ · N</code></li>
              <li><strong>Trabajo mecánico:</strong> <code>W = F · d · cos(θ)</code> (en Joules, J)</li>
              <li><strong>Energía cinética:</strong> <code>E_c = ½ · m · v²</code></li>
              <li><strong>Energía potencial gravitatoria:</strong> <code>E_p = m · g · h</code></li>
              <li><strong>Potencia mecánica:</strong> <code>P = W / t = F · v</code> (en Watts, W = J/s)</li>
            </ul>
          </div>
          <div class="card"><h3>🔌 Electricidad y Conversión</h3>
            <ul class="formula-list">
              <li><strong>Ley de Coulomb:</strong> <code>F = k · |q₁ · q₂| / r²</code> (<code>k = 9×10⁹ N·m²/C²</code>)</li>
              <li><strong>Ley de Ohm:</strong> <code>V = I · R</code> (Voltios = Amperios × Ohmios)</li>
              <li><strong>Potencia eléctrica:</strong> <code>P = V · I = I² · R = V² / R</code></li>
              <li><strong>Resistencias en serie:</strong> <code>R_eq = R₁ + R₂ + ...</code></li>
              <li><strong>Conversión rápida km/h a m/s:</strong> divide entre <code>3,6</code> (ej. 72 km/h = 20 m/s).</li>
            </ul>
          </div>
        </div>
      ` : ''}

      ${tab==='quimica' ? `
        <div class="grid">
          <div class="card"><h3>⚗️ Átomo, Moles y Gases Ideales</h3>
            <ul class="formula-list">
              <li><strong>Número másico (A):</strong> <code>A = Z (protones) + n (neutrones)</code></li>
              <li><strong>Número de moles (n):</strong> <code>n = masa (g) / Masa Molar (g/mol)</code></li>
              <li><strong>Número de Avogadro:</strong> <code>1 mol = 6,022 × 10²³ partículas</code></li>
              <li><strong>Volumen molar en CN (0 °C y 1 atm):</strong> <code>1 mol de gas = 22,4 litros</code></li>
              <li><strong>Ecuación de Estado (Gases Ideales):</strong> <code>P · V = n · R · T</code> (T en Kelvin: <code>K = °C + 273</code>)</li>
            </ul>
          </div>
          <div class="card"><h3>🧪 Disoluciones y pH</h3>
            <ul class="formula-list">
              <li><strong>Molaridad (M):</strong> <code>M = moles de soluto / litros de solución</code></li>
              <li><strong>Dilución:</strong> <code>C₁ · V₁ = C₂ · V₂</code></li>
              <li><strong>Porcentaje en masa (% m/m):</strong> <code>(masa soluto / masa solución) × 100</code></li>
              <li><strong>Cálculo de pH y pOH:</strong> <code>pH = -log[H⁺]</code> · <code>pH + pOH = 14</code> (a 25 °C)</li>
              <li><strong>Escala:</strong> pH &lt; 7 ácido · pH = 7 neutro · pH &gt; 7 básico o alcalino.</li>
            </ul>
          </div>
          <div class="card"><h3>🏷️ Funciones Inorgánicas y Orgánicas</h3>
            <ul class="formula-list">
              <li><strong>Óxido básico:</strong> Metal + O₂ · <strong>Anhídrido (óxido ácido):</strong> No metal + O₂</li>
              <li><strong>Hidróxido:</strong> Óxido básico + H₂O → lleva grupo <code>(OH)⁻</code></li>
              <li><strong>Oxácido:</strong> Anhídrido + H₂O → estructura <code>H_a X_b O_c</code></li>
              <li><strong>Hidrocarburos saturados (Alcanos):</strong> enlace simple, fórmula <code>C_n H_{2n+2}</code></li>
              <li><strong>Alquenos (doble enlace):</strong> <code>C_n H_{2n}</code> · <strong>Alquinos (triple):</strong> <code>C_n H_{2n-2}</code></li>
            </ul>
          </div>
        </div>
      ` : ''}

      ${tab==='mate' ? `
        <div class="grid">
          <div class="card"><h3>📐 Productos Notables y Ecuación Cuadrática</h3>
            <ul class="formula-list">
              <li><strong>Binomio al cuadrado:</strong> <code>(a ± b)² = a² ± 2ab + b²</code></li>
              <li><strong>Diferencia de cuadrados:</strong> <code>a² - b² = (a + b)(a - b)</code></li>
              <li><strong>Suma y diferencia de cubos:</strong> <code>a³ ± b³ = (a ± b)(a² ∓ ab + b²)</code></li>
              <li><strong>Fórmula general cuadrática:</strong> <code>x = [-b ± √(b² - 4ac)] / (2a)</code></li>
              <li><strong>Suma de raíces:</strong> <code>x₁ + x₂ = -b/a</code> · <strong>Producto:</strong> <code>x₁ · x₂ = c/a</code></li>
            </ul>
          </div>
          <div class="card"><h3>📊 Logaritmos yExponentes</h3>
            <ul class="formula-list">
              <li><strong>Definición:</strong> <code>log_b(N) = x  ⇔  bˣ = N</code> (con b &gt; 0 y b ≠ 1)</li>
              <li><strong>Logaritmo de un producto:</strong> <code>log_b(A · B) = log_b(A) + log_b(B)</code></li>
              <li><strong>Logaritmo de un cociente:</strong> <code>log_b(A / B) = log_b(A) - log_b(B)</code></li>
              <li><strong>Logaritmo de una potencia:</strong> <code>log_b(Aⁿ) = n · log_b(A)</code></li>
              <li><strong>Cambio de base:</strong> <code>log_b(A) = log_c(A) / log_c(b)</code></li>
            </ul>
          </div>
          <div class="card"><h3>📐 Trigonometría Esencial</h3>
            <ul class="formula-list">
              <li><strong>Identidad pitagórica:</strong> <code>sen²(x) + cos²(x) = 1</code></li>
              <li><strong>Secante y tangente:</strong> <code>1 + tan²(x) = sec²(x)</code></li>
              <li><strong>Seno del ángulo doble:</strong> <code>sen(2x) = 2 · sen(x) · cos(x)</code></li>
              <li><strong>Coseno del ángulo doble:</strong> <code>cos(2x) = cos²(x) - sen²(x)</code></li>
              <li><strong>Ángulos notables (30°, 45°, 60°):</strong> sen(30°) = 1/2 · sen(45°) = √2/2 · sen(60°) = √3/2.</li>
            </ul>
          </div>
        </div>
      ` : ''}

      ${tab==='biologia' ? `
        <div class="grid">
          <div class="card"><h3>🌿 Los 6 Temas de Biología UMSA</h3>
            <ul class="formula-list">
              <li><strong>1. Biología general:</strong> método científico, bioelementos primarios (C, H, O, N, P, S) y biomoléculas.</li>
              <li><strong>2. Citología I:</strong> procariotas vs. eucariotas, membrana plasmática (mosaico fluido) y transporte activo/pasivo.</li>
              <li><strong>3. Citología II:</strong> mitocondrias (ATP), ribosomas (proteínas), REL/RER, Golgi, lisosomas y ciclo celular (mitosis/meiosis).</li>
              <li><strong>4. Histología:</strong> los 4 tejidos básicos: epitelial, conectivo/conjuntivo, muscular y nervioso.</li>
              <li><strong>5. Introducción a la anatomía:</strong> posición anatómica y planos (sagital, frontal/coronal y transversal/horizontal).</li>
              <li><strong>6. Aparato locomotor:</strong> 206 huesos (esqueleto axial: 80; apendicular: 126), articulaciones (sinartrosis, anfiartrosis, diartrosis) y músculos.</li>
            </ul>
          </div>
          <div class="card"><h3>📚 Reglas Clave de Lenguaje</h3>
            <ul class="formula-list">
              <li><strong>Agudas (oxítonas):</strong> tilde si terminan en N, S o vocal (ej. corazón, compás, café).</li>
              <li><strong>Graves o llanas (paroxítonas):</strong> tilde si NO terminan en N, S ni vocal (ej. árbol, tórax, fémur).</li>
              <li><strong>Esdrújulas y sobreesdrújulas:</strong> se tildan siempre (ej. célula, músculo, oxígeno).</li>
              <li><strong>Tilde diacrítica:</strong> él (pronombre) vs. el (artículo); tú vs. tu; mí vs. mi; sí vs. si; sé (saber/ser) vs. se; más (cantidad) vs. mas (pero).</li>
            </ul>
          </div>
        </div>
      ` : ''}
    `,'Formulario y Tabla');
  }

  function buildFlashDeck(){
    let list=bank;
    if(state.flash.subject!=='all')list=list.filter(q=>q.topic.startsWith(state.flash.subject));
    if(state.flash.difficulty!=='all')list=list.filter(q=>difficultyOf(q)===state.flash.difficulty);
    if(state.flash.onlyFavs){const f=new Set(profile.favorites);list=list.filter(q=>f.has(q.id));}
    if(state.flash.onlyMistakes){const m=new Set(profile.mistakes);list=list.filter(q=>m.has(q.id));}
    state.flash.deck=list;
    if(state.flash.idx>=list.length)state.flash.idx=0;
    state.flash.flipped=false;
  }
  function flashcardsView(){
    if(!state.flash.deck.length)buildFlashDeck();
    const deck=state.flash.deck;
    const q=deck[state.flash.idx]||null;
    const knownSet=new Set(profile.flashcardsKnown||[]);
    const knownCount=deck.filter(x=>knownSet.has(x.id)).length;
    setContent(`${section('MEMORIZACIÓN ACTIVA','🗂️ Tarjetas Flash (Flashcards)','Estudia rápidamente volteando cada tarjeta para ver la respuesta correcta y su explicación académica.')}
      <div class="library-filters">
        <label class="control">Materia<select id="flashSubject"><option value="all">Todas las materias (${bank.length})</option>${catalog.map(s=>`<option value="${s.id}" ${state.flash.subject===s.id?'selected':''}>${e(s.name)}</option>`).join('')}</select></label>
        <label class="control">Dificultad<select id="flashDifficulty">${[['all','Todas'],['facil','🌱 Fácil'],['normal','⚡ Normal'],['dificil','🔥 Difícil']].map(([d,title])=>`<option value="${d}" ${state.flash.difficulty===d?'selected':''}>${title}</option>`).join('')}</select></label>
        <div class="control" style="display:flex;flex-direction:column;justify-content:flex-end;gap:6px">
          <label class="check-line" style="margin:0"><input type="checkbox" id="flashFavs" ${state.flash.onlyFavs?'checked':''}> Solo favoritas</label>
          <label class="check-line" style="margin:0"><input type="checkbox" id="flashMistakes" ${state.flash.onlyMistakes?'checked':''}> Solo mis errores</label>
        </div>
      </div>
      ${q?`<div class="card flashcard-box ${state.flash.flipped?'is-flipped':''}">
        <div class="review-heading">
          <span class="pill neutral">Tarjeta ${state.flash.idx+1} de ${deck.length} · ${topicName(q.topic)}</span>
          <span class="mini-stat">${dIcon(difficultyOf(q))} ${dName(difficultyOf(q))} · ${knownCount}/${deck.length} dominadas</span>
        </div>
        <div class="flashcard-body" data-action="flash-flip" tabindex="0" role="button" aria-label="Voltear tarjeta">
          <span class="eyebrow">${state.flash.flipped?'✓ RESPUESTA Y EXPLICACIÓN':'❓ PREGUNTA DE ESTUDIO (CLIC PARA VOLTEAR)'}</span>
          <h2 class="flashcard-question">${e(q.q)}</h2>
          ${!state.flash.flipped?`<div class="library-choices" style="margin-top:14px">${q.a.map((opt,i)=>`<div><b>${'ABCD'[i]}.</b> ${e(opt)}</div>`).join('')}</div><p class="small muted" style="margin-top:14px">👆 Toca la tarjeta o pulsa "Voltear tarjeta" para revelar la solución.</p>`:
          `<div class="feedback" style="margin-top:16px"><strong>✓ Respuesta correcta (${'ABCD'[q.c]}): ${e(q.a[q.c])}</strong><p style="margin-top:8px">${e(q.e)}</p></div>`}
        </div>
        ${profile.notes[q.id]?`<div class="personal-note">📝 <strong>Mi apunte:</strong> ${e(profile.notes[q.id])}</div>`:''}
        <div class="actions" style="justify-content:space-between;margin-top:18px">
          <div>${b('← Anterior','flash-prev','secondary smallbtn')}${b('🔄 Voltear tarjeta','flash-flip',' smallbtn')}${b('Siguiente →','flash-next','secondary smallbtn')}${b('🔀 Mezclar','flash-shuffle','soft smallbtn')}</div>
          <div>${b(knownSet.has(q.id)?'✅ Dominada (+5 XP)':'🎯 Marcar dominada','flash-know:'+q.id,'soft smallbtn')}${b(profile.favorites.includes(q.id)?'♥ Favorita':'♡ Favorita','fav:'+q.id,'secondary smallbtn')}${b('📝 Apunte','note:'+q.id,'secondary smallbtn')}</div>
        </div>
      </div>`:`<div class="empty">No hay tarjetas con esos filtros. Desmarca "Solo favoritas" o "Solo mis errores".</div>`}`,'Tarjetas Flash');
  }

  function startUmsaBalanced100(){
    const distribution=[['bio',25],['qui',20],['mat',20],['fis',20],['len',15]];
    let selected=[];
    for(const [subj,qty] of distribution){
      const pool=shuffledCopy(bank.filter(q=>q.topic.startsWith(subj)));
      selected.push(...pool.slice(0,qty));
    }
    selected=shuffledCopy(selected);
    beginQuiz({items:selected,mode:'pro',scope:'Simulacro Oficial UMSA (5 Materias)',difficulty:'all',goal:70,secondsPerQuestion:72});
    toast('🎯 Simulacro Oficial UMSA iniciado: 100 preguntas balanceadas.');
  }

  function saveCurrentAccountSlot(){
    const idx=profile.accounts.findIndex(a=>a.studentName.toLowerCase()===profile.studentName.toLowerCase());
    const snap={studentName:profile.studentName,career:profile.career,xp:profile.xp,avatar:profile.avatar,history:profile.history,mistakes:profile.mistakes,favorites:profile.favorites,notes:profile.notes,flashcardsKnown:profile.flashcardsKnown,updatedAt:new Date().toISOString()};
    if(idx>=0)profile.accounts[idx]=snap;else profile.accounts.push(snap);
  }

  function openProfileModal(){
    saveCurrentAccountSlot();
    save();
    const m=$('studentModal');if(!m)return;
    m.hidden=false;
    m.innerHTML=`<div class="epic-panel" role="dialog" aria-modal="true" aria-label="Perfil de Estudiante y Cuentas">
      <div class="epic-head"><div><span class="epic-overline">GESTIÓN DE ESTUDIANTE Y RESPALDOS</span><h2>👤 Perfil de ${e(profile.studentName)}</h2></div><button type="button" class="epic-close" data-action="close-perfil-modal">✕</button></div>
      <div style="display:grid;gap:14px;margin-top:12px">
        <div class="card" style="padding:16px">
          <h3 style="margin:0 0 10px">Datos del postulante</h3>
          <div class="pro-config-row">
            <label class="control">Tu nombre o apodo<input id="profNameInput" value="${e(profile.studentName)}" maxlength="60"></label>
            <label class="control">Carrera objetivo UMSA<select id="profCareerInput">${['Medicina UMSA','Enfermería UMSA','Nutrición y Dietética','Tecnología Médica','Bioquímica y Farmacia','Odontología UMSA'].map(c=>`<option value="${c}" ${profile.career===c?'selected':''}>${c}</option>`).join('')}</select></label>
          </div>
          <div class="actions" style="margin-top:12px">${b('💾 Guardar datos de perfil','save-perfil','')}${b('📥 Exportar respaldo (.JSON)','export-progress','soft smallbtn')}${b('📤 Importar respaldo (.JSON)','import-progress','secondary smallbtn')}</div>
        </div>
        <div class="card" style="padding:16px">
          <div class="panel-heading"><h3 style="margin:0">Cuentas registradas en este dispositivo (${profile.accounts.length})</h3>${b('+ Nuevo estudiante','new-account-slot','soft smallbtn')}</div>
          <p class="small muted">Puedes registrar varios estudiantes en la misma computadora o celular y cambiar de perfil sin perder el progreso de ninguno.</p>
          <div class="table-wrap"><table class="history-table"><thead><tr><th>Estudiante</th><th>Carrera</th><th>XP</th><th>Prácticas</th><th>Acción</th></tr></thead><tbody>
            ${profile.accounts.map((acc,i)=>`<tr><td><strong>${e(acc.studentName)}</strong></td><td>${e(acc.career||'Medicina')}</td><td>${Math.floor(acc.xp||0)} XP</td><td>${(acc.history||[]).length}</td><td>${acc.studentName===profile.studentName?'<span class="pill green">Activo</span>':b('Cambiar a este perfil','switch-account:'+i,'soft smallbtn')}</td></tr>`).join('')}
          </tbody></table></div>
        </div>
      </div>
    </div>`;
  }

  function exportFile(name,text,kind){const blob=new Blob([text],{type:kind});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  function exportProgress(){saveCurrentAccountSlot();const copy={app:'MEDYTE ACADEMY 7.0 PRO',exportado:new Date().toISOString(),studentName:profile.studentName,career:profile.career,avatar:profile.avatar||'estudiante',xp:profile.xp,historial:profile.history,errores:profile.mistakes,favoritas:profile.favorites,notes:profile.notes,flashcardsKnown:profile.flashcardsKnown,accounts:profile.accounts};exportFile('medyte-progreso-'+profile.studentName.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.json',JSON.stringify(copy,null,2),'application/json');}
  function csvCell(v){let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
  function exportResult(){const r=state.lastResult||profile.history[0];if(!r)return;const rows=[['ID','Materia y tema','Pregunta','Respuesta elegida','Correcta','Resultado','Explicación']];
    for(const row of r.items){const q=questionById.get(row.id);if(!q)continue;rows.push([row.id,(topicById.get(q.topic)?.subject||'')+' / '+(topicById.get(q.topic)?.name||''),q.q,row.answer===null?'Sin responder':q.a[row.answer],q.a[q.c],row.answer===row.correct?'Correcta':'Incorrecta',q.e]);}
    exportFile('medyte-resultado.csv','\ufeff'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');}
  function clearProgress(){if(!confirm('¿Eliminar tu historial, XP, errores y favoritas de ESTE navegador? No se puede deshacer.'))return;profile=blankProfile();save();uiHeader();nav('progreso');toast('Se borró el progreso local.');}
  function action(cmd){if(!cmd)return;
    const direct=['inicio','materias','simulacros','flashcards','formulario','biblioteca','favoritos','progreso','trofeos','errores','acerca'];if(direct.includes(cmd)){nav(cmd);return;}
    if(cmd.startsWith('form-tab:')){state.formTab=cmd.slice(9);formularioView();return;}
    if(cmd.startsWith('el-select:')){const z=Number(cmd.slice(10));state.selectedElement=PERIODIC_ELEMENTS.find(x=>x.z===z)||PERIODIC_ELEMENTS[0];formularioView();return;}
    if(cmd==='edit-exam-date'){const val=prompt('Escribe la fecha de tu examen (formato AAAA-MM-DD):',profile.examDate||'2027-01-25');if(val&&/^\d{4}-\d{2}-\d{2}$/.test(val.trim())){profile.examDate=val.trim();save();home();toast('Fecha objetivo actualizada.');}return;}
    if(cmd==='toggle-bubble-sheet'){if(state.quiz){state.quiz.bubbleSheet=!state.quiz.bubbleSheet;saveDraft();quizView();}return;}
    if(cmd.startsWith('bubble:')){const parts=cmd.split(':');const qIdx=Number(parts[1]),origOpt=Number(parts[2]);if(state.quiz&&qIdx>=0&&qIdx<state.quiz.items.length){state.quiz.pos=qIdx;chooseAnswer(origOpt);}return;}
    if(cmd==='join-duel'){const v=$('duelCodeInput')?.value||prompt('Pega el código de duelo (MDY-...):');if(v)startFromDuelCode(v);return;}
    if(cmd==='share-duel'){
      const r=state.lastResult||profile.history[0];if(!r)return;
      const code=encodeDuelCode(r);
      const url=location.origin && location.protocol.startsWith('http') ? `${location.origin}${location.pathname}?duel=${encodeURIComponent(code)}` : code;
      if(navigator.clipboard?.writeText){
        navigator.clipboard.writeText(url).then(()=>toast('⚔️ ¡Código/enlace de duelo copiado! Pásalo por WhatsApp a tus amigos.')).catch(()=>prompt('Copia este código de duelo y pásalo a tu amigo:',code));
      }else{
        prompt('Copia este código de duelo y pásalo a tu amigo:',code);
      }
      return;
    }
    if(cmd==='repeat-critical-mistakes'){
      const crit=profile.mistakes.filter(id=>questionById.has(id)&&(profile.srs[id]?.fails||1)>=2).map(id=>questionById.get(id));
      if(!crit.length){toast('No tienes errores críticos acumulados.');return;}
      beginQuiz({items:shuffledCopy(crit).slice(0,25),mode:'practice',scope:'Misión de refuerzo (errores críticos)',difficulty:'all',goal:80,secondsPerQuestion:90,bubbleSheet:false});
      return;
    }
    if(cmd==='exam-umsa-100'){startUmsaBalanced100();return;}
    if(cmd==='print-result'){window.print();return;}
    if(cmd==='perfil-modal'){openProfileModal();return;}
    if(cmd==='close-perfil-modal'){if($('studentModal'))$('studentModal').hidden=true;return;}
    if(cmd==='save-perfil'){const n=$('profNameInput')?.value.trim();const c=$('profCareerInput')?.value;if(n)profile.studentName=n;if(c)profile.career=c;saveCurrentAccountSlot();save();uiHeader();if($('studentModal'))$('studentModal').hidden=true;if(state.page==='progreso')progreso();toast('Perfil actualizado: '+profile.studentName);return;}
    if(cmd==='new-account-slot'){const name=prompt('Nombre del nuevo estudiante:');if(!name||!name.trim())return;saveCurrentAccountSlot();profile.studentName=name.trim();profile.xp=0;profile.history=[];profile.mistakes=[];profile.favorites=[];profile.notes={};profile.flashcardsKnown=[];saveCurrentAccountSlot();save();uiHeader();openProfileModal();toast('Cuenta creada: '+profile.studentName);return;}
    if(cmd.startsWith('switch-account:')){const idx=Number(cmd.slice(15));const acc=profile.accounts[idx];if(!acc)return;saveCurrentAccountSlot();profile.studentName=acc.studentName;profile.career=acc.career||'Medicina UMSA';profile.xp=acc.xp||0;profile.avatar=acc.avatar||'estudiante';profile.history=acc.history||[];profile.mistakes=acc.mistakes||[];profile.favorites=acc.favorites||[];profile.notes=acc.notes||{};profile.flashcardsKnown=acc.flashcardsKnown||[];save();uiHeader();openProfileModal();if(state.page==='progreso')progreso();toast('Cambiaste al perfil de '+profile.studentName);return;}
    if(cmd==='import-progress'){$('importFileInput')?.click();return;}
    if(cmd==='flash-flip'){state.flash.flipped=!state.flash.flipped;flashcardsView();return;}
    if(cmd==='flash-prev'){if(state.flash.deck.length){state.flash.idx=(state.flash.idx-1+state.flash.deck.length)%state.flash.deck.length;state.flash.flipped=false;flashcardsView();}return;}
    if(cmd==='flash-next'){if(state.flash.deck.length){state.flash.idx=(state.flash.idx+1)%state.flash.deck.length;state.flash.flipped=false;flashcardsView();}return;}
    if(cmd==='flash-shuffle'){state.flash.deck=shuffledCopy(state.flash.deck);state.flash.idx=0;state.flash.flipped=false;flashcardsView();toast('Tarjetas mezcladas.');return;}
    if(cmd.startsWith('flash-know:')){const qid=cmd.slice(11);const s=new Set(profile.flashcardsKnown);if(s.has(qid)){s.delete(qid);toast('Tarjeta desmarcada.');}else{s.add(qid);profile.xp+=5;toast('Tarjeta repasada: +5 XP');}profile.flashcardsKnown=[...s];save();uiHeader();flashcardsView();return;}
    if(cmd.startsWith('note:')){const qid=cmd.slice(5);const current=profile.notes[qid]||'';const text=prompt('Escribe tu apunte personal para esta pregunta (deja vacío para borrar):',current);if(text===null)return;if(text.trim())profile.notes[qid]=text.trim();else delete profile.notes[qid];save();if(state.page==='biblioteca')renderLibraryResults();else if(state.page==='flashcards')flashcardsView();toast('Apunte guardado.');return;}
    if(cmd.startsWith('subject:')){state.currentSubject=cmd.slice(8);nav('temas');return;}
    if(cmd.startsWith('scope:')){state.setup.scope=cmd.slice(6);state.setup.onlyMistakes=false;state.setup.onlyFavorites=false;nav('simulacros');return;}
    if(cmd==='start'){startQuiz();return;}
    if(cmd==='open-pro'){state.setup.mode='pro';nav('simulacros');return;}
    if(cmd==='mark'){if(!state.quiz)return;const m=state.quiz.marked;m.has(state.quiz.pos)?m.delete(state.quiz.pos):m.add(state.quiz.pos);saveDraft();quizView();return;}
    if(cmd.startsWith('avatar:')){const id=cmd.slice(7),a=AVATARS.find(x=>x.id===id);if(!a)return;if(profile.xp<a.xp){toast('Este avatar se desbloquea a los '+a.xp+' XP.');return;}profile.avatar=a.id;save();uiHeader();nav('trofeos');toast('Avatar seleccionado: '+a.name);return;}
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
    if(evt.target.id==='difficultySelect')state.setup.difficulty=v;
    if(evt.target.id==='secondsSelect')state.setup.secondsPerQuestion=Number(v);
    if(evt.target.id==='goalSelect')state.setup.goal=Number(v);
    if(evt.target.id==='mistakesOnly')state.setup.onlyMistakes=evt.target.checked;
    if(evt.target.id==='favoritesOnly')state.setup.onlyFavorites=evt.target.checked;
    if(evt.target.id==='bubbleSheetCheck')state.setup.bubbleSheet=evt.target.checked;
    if(evt.target.id==='librarySubject'){state.library.subject=v;state.library.page=1;renderLibraryResults();}
    if(evt.target.id==='libraryDifficulty'){state.library.difficulty=v;state.library.page=1;renderLibraryResults();}
    if(evt.target.id==='flashSubject'){state.flash.subject=v;state.flash.idx=0;buildFlashDeck();flashcardsView();}
    if(evt.target.id==='flashDifficulty'){state.flash.difficulty=v;state.flash.idx=0;buildFlashDeck();flashcardsView();}
    if(evt.target.id==='flashFavs'){state.flash.onlyFavs=evt.target.checked;state.flash.idx=0;buildFlashDeck();flashcardsView();}
    if(evt.target.id==='flashMistakes'){state.flash.onlyMistakes=evt.target.checked;state.flash.idx=0;buildFlashDeck();flashcardsView();}
    if(evt.target.id==='importFileInput'&&evt.target.files?.[0]){
      const reader=new FileReader();
      reader.onload=e=>{
        try{
          const data=JSON.parse(e.target.result);
          if(typeof data.xp==='number')profile.xp=data.xp;
          if(Array.isArray(data.historial))profile.history=data.historial;
          if(Array.isArray(data.errores))profile.mistakes=data.errores;
          if(Array.isArray(data.favoritas))profile.favorites=data.favoritas;
          if(data.studentName)profile.studentName=data.studentName;
          if(data.career)profile.career=data.career;
          if(data.avatar)profile.avatar=data.avatar;
          if(data.notes)profile.notes=data.notes;
          if(Array.isArray(data.flashcardsKnown))profile.flashcardsKnown=data.flashcardsKnown;
          if(Array.isArray(data.accounts))profile.accounts=data.accounts;
          saveCurrentAccountSlot();save();uiHeader();
          if($('studentModal'))$('studentModal').hidden=true;
          nav('progreso');
          toast('Se importaron los datos del perfil.');
        }catch{toast('El archivo seleccionado no es un respaldo JSON válido.');}
      };
      reader.readAsText(evt.target.files[0]);
      evt.target.value='';
    }
  });
  document.addEventListener('input',evt=>{if(evt.target.id==='librarySearch'){state.library.search=evt.target.value.trim();state.library.page=1;renderLibraryResults();}});
  $('menuToggle').addEventListener('click',()=>{const isOpen=$('sidebar').classList.toggle('open');$('mobileShade').hidden=!isOpen;$('menuToggle').setAttribute('aria-expanded',String(isOpen));});
  $('mobileShade').addEventListener('click',closeMenu);
  window.addEventListener('keydown',evt=>{if(evt.key==='Escape'){closeMenu();return;}
    if(state.page!=='quiz'||!state.quiz||!['1','2','3','4'].includes(evt.key)||/input|textarea|select/i.test(evt.target.tagName))return;
    const orig=state.quiz.answerOrders[state.quiz.pos][Number(evt.key)-1];chooseAnswer(orig);
  });
  window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(['inicio','materias','simulacros','flashcards','formulario','biblioteca','favoritos','progreso','trofeos','errores','acerca'].includes(h)&&state.page!==h)nav(h);});
  window.addEventListener('storage',evt=>{if(evt.key===KEY)toast('Se modificó el progreso en otra pestaña. Actualiza esta página para ver los cambios.');});
  window.addEventListener('medyte:bonus',()=>{const updated=readJson(KEY);if(updated&&typeof updated==='object'){profile={...profile,...updated};uiHeader();if(state.page==='progreso')progreso();}});
  if('serviceWorker' in navigator && location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  if(bank.length===0||catalog.length===0){setContent('<div class="empty">No se cargaron las preguntas. Comprueba que preguntas.js está junto a index.html.</div>','Error');return;}
  const params=new URLSearchParams(location.search);
  if(params.get('duel')){
    try{history.replaceState(null,'',location.pathname+location.hash);}catch{}
    if(startFromDuelCode(params.get('duel')))return;
  }
  const first=location.hash.slice(1),allowed=['inicio','materias','simulacros','flashcards','formulario','biblioteca','favoritos','progreso','trofeos','errores','acerca'];
  nav(allowed.includes(first)?first:'inicio');
})();
