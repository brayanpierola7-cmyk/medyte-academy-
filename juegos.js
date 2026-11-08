/* MEDYTE GAMES · Cinco juegos de repaso conectados con el progreso del campus.
   1. Ruta por Materias (6 etapas con ayudas: Descartar 2, Escudo y Vida extra)
   2. Atlas de Anatomía (5 tableros: Órganos vitales, Digestivo, Nervioso y renal, Esqueleto y Cardiorrespiratorio)
   3. Guardia de Emergencia (Casos clínicos rápidos con monitor de signos vitales)
   4. Racha al Límite (Modo supervivencia con reloj de 18 s)
   5. Pares de Estudio (Tablero de memoria con animaciones de giro) */
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
  const saveStore = (key, value) => {try { localStorage.setItem(key,JSON.stringify(value));return true; }catch { announce('No se pudo guardar el avance en este navegador.');return false; }};
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
  const newProgress = () => ({adventure:{},anatomy:{},survival:{bestStreak:0,bestScore:0,plays:0},memory:{},cases:{best:0,wins:0}});
  const existing = readStore(GAMES_KEY);
  const progress = {...newProgress(), ...(existing && typeof existing==='object' && !Array.isArray(existing) ? existing : {})};
  if(!progress.adventure || typeof progress.adventure !== 'object') progress.adventure={};
  if(!progress.anatomy || typeof progress.anatomy !== 'object') progress.anatomy={};
  if(!progress.survival || typeof progress.survival !== 'object') progress.survival={bestStreak:0,bestScore:0,plays:0};
  if(!progress.memory || typeof progress.memory !== 'object') progress.memory={};
  if(!progress.cases || typeof progress.cases !== 'object') progress.cases={best:0,wins:0};
  const saveProgress = () => { const saved=saveStore(GAMES_KEY, progress); window.dispatchEvent(new Event('medyte:progress')); return saved; };
  const getStars = score => score >= 100 ? 3 : score >= 80 ? 2 : score >= 60 ? 1 : 0;
  const starsText = n => '★'.repeat(n) + '☆'.repeat(3-n);
  const btn = (name,action,cls='btn-outline') => `<button type="button" class="btn ${cls}" data-action="${escapeHtml(action)}">${name}</button>`;
  const eyebrow = s => `<span class="eyebrow">${escapeHtml(s)}</span>`;
  const intro = (short,title,detail) => `<section class="page-head"><div>${eyebrow(short)}<h1>${escapeHtml(title)}</h1><p>${escapeHtml(detail)}</p></div><span class="pill">✦ Suma XP a tu perfil</span></section>`;

  const SUBJECTS = [
    {id:'bio',name:'Biología y Célula',subject:'Biología',icon:'🌿',theme:'theme-bio',desc:'Citología, tejidos, anatomía general y aparato locomotor.'},
    {id:'qui',name:'Química General',subject:'Química',icon:'⚗️',theme:'theme-qui',desc:'Átomos, enlaces, estequiometría, soluciones y química orgánica.'},
    {id:'fis',name:'Física Aplicada',subject:'Física',icon:'⚡',theme:'theme-fis',desc:'Vectores, cinemática, dinámica, trabajo, energía y electricidad.'},
    {id:'mat',name:'Matemáticas',subject:'Matemáticas',icon:'🔢',theme:'theme-mat',desc:'Álgebra, ecuaciones, funciones, trigonometría y logaritmos.'},
    {id:'len',name:'Lenguaje y Lectura',subject:'Lenguaje',icon:'📚',theme:'theme-len',desc:'Gramática, acentuación, sintaxis y comprensión lectora.'},
    {id:'final',name:'Examen Integrador',subject:'Las 5 materias',icon:'🏆',theme:'theme-final',desc:'Diez preguntas mezcladas de las cinco asignaturas.'}
  ];

  const ANATOMY_LEVELS = [
    {id:'vitales',name:'Órganos principales',icon:'🫀',desc:'Ubica seis órganos clave del cuerpo humano.',targets:[
      {id:'cerebro',name:'Cerebro',x:50,y:12,icon:'🧠',fact:'Coordina los movimientos, los sentidos, la memoria y el lenguaje.'},
      {id:'pulmones',name:'Pulmones',x:40,y:37,icon:'🫁',fact:'En los alvéolos pulmonares se realiza la hematosis (intercambio de O₂ y CO₂).'},
      {id:'corazon',name:'Corazón',x:56,y:43,icon:'❤️',fact:'Bombea sangre a todo el cuerpo mediante los ciclos de sístole y diástole.'},
      {id:'higado',name:'Hígado',x:43,y:53,icon:'🟤',fact:'Secreta bilis, almacena glucógeno y metaboliza fármacos y nutrientes.'},
      {id:'estomago',name:'Estómago',x:58,y:60,icon:'🟠',fact:'Produce ácido clorhídrico y pepsina para transformar el bolo en quimo.'},
      {id:'intestino',name:'Intestino delgado',x:50,y:72,icon:'〰️',fact:'Formado por duodeno, yeyuno e íleon; absorbe la mayoría de los nutrientes.'}
    ]},
    {id:'digestivo',name:'Tubo digestivo',icon:'🥗',desc:'Sigue el recorrido de los alimentos desde la boca hasta el intestino.',targets:[
      {id:'boca',name:'Boca',x:50,y:19,icon:'👄',fact:'Aquí empieza la digestión del almidón gracias a la amilasa salival (ptialina).'},
      {id:'esofago',name:'Esófago',x:50,y:30,icon:'↕️',fact:'Conducto muscular que lleva el bolo alimenticio al estómago por peristaltismo.'},
      {id:'higado',name:'Hígado',x:43,y:53,icon:'🟤',fact:'La bilis que produce se almacena en la vesícula biliar y emulsiona las grasas.'},
      {id:'estomago',name:'Estómago',x:58,y:60,icon:'🟠',fact:'Se conecta arriba con el esófago por el cardias y abajo con el duodeno por el píloro.'},
      {id:'intestino',name:'Intestino delgado',x:50,y:72,icon:'〰️',fact:'Sus vellosidades intestinales aumentan la superficie para absorber nutrientes.'}
    ]},
    {id:'control',name:'Sistema nervioso y renal',icon:'🧠',desc:'Reconoce centros nerviosos y órganos que filtran la sangre.',targets:[
      {id:'cerebro',name:'Cerebro',x:50,y:12,icon:'🧠',fact:'Está protegido por el cráneo, las tres meninges y el líquido cefalorraquídeo.'},
      {id:'medula',name:'Médula espinal',x:50,y:44,icon:'⚡',fact:'Viaja dentro de la columna vertebral y participa en los actos reflejos.'},
      {id:'rinones',name:'Riñones',x:40,y:61,icon:'🫘',fact:'Filtran el plasma sanguíneo en las nefronas para formar la orina.'},
      {id:'vejiga',name:'Vejiga urinaria',x:50,y:79,icon:'💧',fact:'Recibe la orina por los uréteres y la almacena hasta la micción.'}
    ]},
    {id:'esqueletico',name:'Esqueleto y articulaciones',icon:'🦴',desc:'Localiza huesos y regiones principales del aparato locomotor.',targets:[
      {id:'craneo',name:'Cráneo',x:50,y:10,icon:'💀',fact:'Se divide en neurocráneo (8 huesos) y huesos de la cara o viscerocráneo (14 huesos).'},
      {id:'clavicula',name:'Clavícula y hombro',x:36,y:25,icon:'🦴',fact:'La clavícula y el omóplato (escápula) forman la cintura escapular.'},
      {id:'esternon',name:'Esternón y costillas',x:50,y:34,icon:'🛡️',fact:'El esternón tiene tres partes: mango (manubrio), cuerpo y apéndice xifoides.'},
      {id:'humero',name:'Húmero (brazo)',x:27,y:42,icon:'💪',fact:'Hueso largo del brazo; se articula en el codo con el radio y el cúbito.'},
      {id:'pelvis',name:'Hueso coxal (pelvis)',x:45,y:67,icon:'🦋',fact:'Formado por la unión de tres piezas óseas: ilion, isquion y pubis.'},
      {id:'femur',name:'Fémur (muslo)',x:42,y:85,icon:'🦵',fact:'Es el hueso más largo, fuerte y voluminoso de todo el cuerpo humano.'}
    ]},
    {id:'cardiorrespiratorio',name:'Vías respiratorias y tórax',icon:'🫁',desc:'Identifica el recorrido del aire y los órganos del tórax.',targets:[
      {id:'fosas',name:'Fosas nasales y faringe',x:50,y:16,icon:'👃',fact:'Calientan, humedecen y filtran el aire antes de que baje a la laringe.'},
      {id:'traquea',name:'Laringe y tráquea',x:50,y:27,icon:'🌬️',fact:'La tráquea está formada por anillos incompletos de cartílago hialino.'},
      {id:'pulmones',name:'Pulmones y bronquios',x:40,y:37,icon:'🫁',fact:'El pulmón derecho tiene 3 lóbulos y el izquierdo tiene 2 lóbulos.'},
      {id:'corazon',name:'Corazón y grandes vasos',x:56,y:43,icon:'❤️',fact:'Del ventrículo izquierdo sale la arteria aorta con sangre oxigenada.'},
      {id:'diafragma',name:'Músculo diafragma',x:50,y:49,icon:'⛺',fact:'Principal músculo de la respiración; separa el tórax del abdomen.'}
    ]}
  ];

  const CLINICAL_CASES = [
    {
      patient:'Paciente de 19 años en laboratorio',
      vitals:'FC: 88 lpm · SatO₂: 98% · Muestra sanguínea en microscopio',
      story:'Observas al microscopio una muestra de sangre. Los glóbulos rojos se hinchan hasta romperse (hemólisis) tras colocarlos en una solución acuosa.',
      question:'¿En qué tipo de solución se colocaron los eritrocitos?',
      options:['Solución hipotónica','Solución hipertónica','Solución isotónica (0,9% NaCl)','Solución saturada de glucosa'],
      correct:0,
      explain:'En un medio hipotónico (menor concentración de solutos afuera), el agua entra a la célula por ósmosis hasta hincharla y lisarla.'
    },
    {
      patient:'Deportista tras carrera de velocidad',
      vitals:'FC: 152 lpm · FR: 28 rpm · Fatiga muscular intensa',
      story:'Durante un esfuerzo muscular muy intenso donde el aporte de oxígeno no alcanza, las fibras musculares obtienen ATP rápido sin usar oxígeno.',
      question:'¿Qué vía metabólica predomina en ese momento y qué compuesto se acumula?',
      options:['Fermentación láctica (acumula lactato)','Ciclo de Krebs en el citosol','Fotosíntesis oxigénica','Beta-oxidación en los ribosomas'],
      correct:0,
      explain:'En condiciones anaeróbicas el piruvato de la glucólisis se reduce a ácido láctico (lactato) en el sarcoplasma para regenerar NAD⁺.'
    },
    {
      patient:'Consulta de traumatología',
      vitals:'PA: 120/80 mmHg · Radiografía de miembro superior',
      story:'Un estudiante cae apoyando la mano extendida. La radiografía muestra una fractura en el hueso lateral del antebrazo (el que queda del lado del pulgar en posición anatómica).',
      question:'¿Cuál es el hueso afectado?',
      options:['Radio','Cúbito (ulna)','Húmero','Peroné (fíbula)'],
      correct:0,
      explain:'En posición anatómica, el radio se ubica en la parte externa (lateral, lado del pulgar) y el cúbito en la parte interna (medial).'
    },
    {
      patient:'Análisis de muestra gástrica',
      vitals:'pH medido: 1,8 · Temperatura: 37 °C',
      story:'En el laboratorio de bioquímica se mide la acidez del jugo gástrico y da un pH de 1,8. Se necesita activar el pepsinógeno para digerir proteínas.',
      question:'¿Qué células de la mucosa del estómago secretan el ácido clorhídrico (HCl) responsable de ese pH?',
      options:['Células parietales u oxínticas','Células caliciformes','Hepatocitos','Células alfa de Langerhans'],
      correct:0,
      explain:'Las células parietales secretan HCl y factor intrínseco, mientras que las células principales secretan pepsinógeno.'
    },
    {
      patient:'Control de signos vitales en guardia',
      vitals:'FC: 75 lpm · PA: 120/80 mmHg · ECG normal',
      story:'Al escuchar el corazón con el estetoscopio se percibe el impulso eléctrico que nace en el marcapasos natural del corazón.',
      question:'¿En qué cavidad cardíaca se localiza el nodo sinusal (sinoauricular)?',
      options:['Aurícula derecha','Ventrículo izquierdo','Aurícula izquierda','Tabique interventricular'],
      correct:0,
      explain:'El nodo sinusal se encuentra en la pared superior de la aurícula derecha, cerca de la desembocadura de la vena cava superior.'
    },
    {
      patient:'Urgencia por quemadura química',
      vitals:'Solución derramada: Hidróxido de sodio (NaOH) 1 M',
      story:'En la mesada de química se derrama una solución acuosa de NaOH. Al medirla con papel indicador da un valor de pH cercano a 14.',
      question:'Según su composición y pH, ¿qué tipo de sustancia es el NaOH?',
      options:['Un hidróxido o base fuerte','Un ácido hidrácido','Un óxido ácido (anhídrido)','Una sal neutra'],
      correct:0,
      explain:'El NaOH es una base fuerte que se disocia completamente liberando iones OH⁻, elevando el pH por encima de 7.'
    },
    {
      patient:'Física en camilla de traslado',
      vitals:'Masa total: 80 kg · Fuerza horizontal aplicada: 160 N',
      story:'Un camillero empuja una camilla de 80 kg sobre un piso liso aplicando una fuerza neta horizontal constante de 160 N.',
      question:'Según la segunda ley de Newton (F = m·a), ¿qué aceleración adquiere la camilla?',
      options:['2 m/s²','0,5 m/s²','20 m/s²','80 m/s²'],
      correct:0,
      explain:'Despejando a = F / m = 160 N / 80 kg = 2 m/s².'
    },
    {
      patient:'Biología celular · Biopsia hepática',
      vitals:'Observación con microscopio electrónico',
      story:'Los hepatocitos de un paciente muestran gran desarrollo de un organelo membranoso sin ribosomas adheridos, encargado de detoxificar medicamentos y sintetizar lípidos.',
      question:'¿De qué organelo se trata?',
      options:['Retículo endoplasmático liso (REL)','Retículo endoplasmático rugoso (RER)','Centrosoma','Peroxisoma vegetal'],
      correct:0,
      explain:'El REL sintetiza lípidos, almacena calcio y detoxifica sustancias químicas (especialmente abundante en el hígado).'
    }
  ];

  const MEMORY_DECKS = [
    {id:'citologia',name:'Célula y Tejidos',icon:'🔬',desc:'Relaciona cada parte de la célula o tejido con su función.',pairs:[
      ['Mitocondria','Produce ATP mediante la respiración celular'],
      ['Ribosoma','Une aminoácidos para fabricar proteínas'],
      ['Lisosoma','Realiza la digestión dentro de la célula'],
      ['Aparato de Golgi','Empaqueta y modifica proteínas para secretarlas'],
      ['Cloroplasto','Capta luz solar para hacer fotosíntesis'],
      ['Tejido epitelial','Recubre superficies y forma glándulas (no tiene vasos)'],
      ['Membrana celular','Bicapa de fosfolípidos que regula lo que entra y sale'],
      ['Núcleo','Guarda el ADN y dirige la actividad de la célula']
    ]},
    {id:'quimica_fisica',name:'Química y Física',icon:'⚗️',desc:'Conecta fórmulas, leyes físicas y compuestos químicos.',pairs:[
      ['H₂SO₄','Ácido sulfúrico'],
      ['Enlace iónico','Unión por transferencia de electrones (metal + no metal)'],
      ['pH menor a 7','Medio ácido'],
      ['Segunda ley de Newton','Fuerza = masa × aceleración (F = m·a)'],
      ['Joule (J)','Unidad de trabajo y energía (Newton × metro)'],
      ['MRU','Movimiento con velocidad constante y aceleración cero'],
      ['Número atómico (Z)','Cantidad de protones en el núcleo'],
      ['Ley de Ohm','Voltaje = Intensidad × Resistencia (V = I·R)']
    ]},
    {id:'mate_lenguaje',name:'Matemáticas y Lenguaje',icon:'📐',desc:'Une productos notables, identidades y reglas de ortografía.',pairs:[
      ['Diferencia de cuadrados','a² - b² = (a + b)(a - b)'],
      ['Identidad pitagórica','sen²(x) + cos²(x) = 1'],
      ['Logaritmo de la base','log_b(b) = 1'],
      ['Fórmula general','x = [-b ± √(b² - 4ac)] / (2a)'],
      ['Palabras agudas','Llevan tilde si terminan en N, S o vocal'],
      ['Palabras esdrújulas','Siempre llevan tilde en la antepenúltima sílaba'],
      ['Hiato acentual','Vocal abierta + cerrada tónica con tilde (ej. país, María)'],
      ['Sujeto tácito','No está escrito pero se deduce por la terminación del verbo']
    ]}
  ];

  let adventureMode = 'normal';
  let adventureDifficulty = 'all';
  const difficultyById = window.MEDYTE_DIFFICULTY_BY_ID || {};
  const levelText = {all:'Todas',facil:'Fácil',normal:'Normal',dificil:'Difícil'};
  let adventureTimer = null;
  let survivalTimer = null;
  let view = 'home';
  let adventure = null;
  let anatomy = null;
  let survival = null;
  let memory = null;
  let clinical = null;
  let toastTimeout = null;

  function announce(msg){const el=document.getElementById('toast');el.textContent=msg;el.hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.hidden=true,3200);}
  function refreshXp(){document.getElementById('totalXp').textContent=`✦ ${Math.floor(getProfile().xp)} XP`;}
  function show(html,section){
    clearInterval(adventureTimer);adventureTimer=null;
    clearInterval(survivalTimer);survivalTimer=null;
    root.innerHTML=html;view=section;refreshXp();window.scrollTo({top:0,behavior:'instant'});
  }
  function storeXP(amount,addHistory){const p=getProfile();p.xp+=amount;
    if(addHistory){p.history=[addHistory,...p.history].slice(0,50);
      const mistakes=new Set(p.mistakes);
      for(const answer of addHistory.items){if(answer.answer===answer.correct) mistakes.delete(answer.id);else if(answer.answer!==null) mistakes.add(answer.id);}
      p.mistakes=[...mistakes];
    }
    saveStore(PROFILE_KEY,p);refreshXp();window.dispatchEvent(new Event('medyte:progress'));
  }

  function home(){
    const advCleared = SUBJECTS.filter(s=>getStars(progress.adventure[s.id]?.best || 0)>0).length;
    const anaCleared = ANATOMY_LEVELS.filter(l=>(progress.anatomy[l.id]?.wins||0)>0).length;
    const memCleared = MEMORY_DECKS.filter(d=>(progress.memory[d.id]?.wins||0)>0).length;
    const survBest = progress.survival?.bestStreak || 0;
    const casesWins = progress.cases?.wins || 0;

    show(`<div class="hero epic-games-hero">
      <div>
        ${eyebrow('MEDYTE GAMES · SALA DE JUEGOS')}
        <h1>Repasa jugando,<br><em>aprende sin aburrirte.</em></h1>
        <p>Cinco juegos pensados para fijar conceptos del examen de admisión: casos de guardia médica, anatomía visual, rutas por materia, rachas con reloj y pares de memoria.</p>
        <div class="btn-row">
          ${btn('🗺️ Ruta por Materias','av-map','btn-gold btn-lg')}
          ${btn('🩺 Guardia Médica','case-start','btn-outline btn-lg')}
          ${btn('🫀 Atlas de Anatomía','an-levels','btn-outline btn-lg')}
          ${btn('⚡ Racha al Límite','surv-intro','btn-outline btn-lg')}
          ${btn('🧩 Pares de Estudio','mem-levels','btn-outline btn-lg')}
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">🩺</div>
    </div>

    <div class="overview-stats" style="margin-top:18px">
      <div class="stat"><strong>${advCleared}/6</strong><small>Etapas superadas</small></div>
      <div class="stat"><strong>${anaCleared}/5</strong><small>Mapas de anatomía</small></div>
      <div class="stat"><strong>🩺 ${casesWins}</strong><small>Guardias resueltas</small></div>
      <div class="stat"><strong>🔥 ${survBest}</strong><small>Mejor racha</small></div>
    </div>

    <div class="section-heading"><h2>Elige con qué practicar hoy</h2><span class="muted small">Todo lo que juegues suma puntos XP a tu perfil</span></div>

    <section class="game-grid game-grid-custom" aria-label="Juegos disponibles">
      <article class="game-card card-accent-gold">
        <div>
          <div class="game-card-header"><div class="game-icon">🗺️</div><span class="badge-tag">6 ETAPAS</span></div>
          <h3>Ruta por Materias</h3>
          <p>Avanza por Biología, Química, Física, Matemáticas y Lenguaje. Tienes tres vidas por etapa y ayudas como el descarte 50/50 o el escudo.</p>
        </div>
        <div class="card-bottom">
          <span class="card-number">⭐ Estrellas · 🧪 3 ayudas por partida</span>
          ${btn('Abrir mapa →','av-map','btn-gold')}
        </div>
      </article>

      <article class="game-card card-accent-cyan">
        <div>
          <div class="game-card-header"><div class="game-icon">🩺</div><span class="badge-tag badge-new">NUEVO</span></div>
          <h3>Guardia de Emergencia</h3>
          <p>Resuelve casos prácticos en el hospital y en el laboratorio. Analiza los datos del paciente, revisa el monitor y elige la respuesta correcta.</p>
        </div>
        <div class="card-bottom">
          <span class="card-number">📈 Monitor en vivo · 🧠 Razonamiento</span>
          ${btn('Entrar a guardia →','case-start','btn-gold')}
        </div>
      </article>

      <article class="game-card card-accent-rose">
        <div>
          <div class="game-card-header"><div class="game-icon">🫀</div><span class="badge-tag">5 TABLEROS</span></div>
          <h3>Atlas de Anatomía</h3>
          <p>Ubica órganos vitales, el tubo digestivo, sistema nervioso, huesos del esqueleto y vías respiratorias directamente sobre la figura.</p>
        </div>
        <div class="card-bottom">
          <span class="card-number">🦴 Huesos y órganos · 🔎 Pistas</span>
          ${btn('Elegir tablero →','an-levels','btn-gold')}
        </div>
      </article>

      <article class="game-card card-accent-orange">
        <div>
          <div class="game-card-header"><div class="game-icon">⚡</div><span class="badge-tag">CONTRARRELOJ</span></div>
          <h3>Racha al Límite</h3>
          <p>Tienes 3 vidas y 18 segundos por pregunta. Pon a prueba cuántas respuestas seguidas logras acertar antes de quedarte sin corazones.</p>
        </div>
        <div class="card-bottom">
          <span class="card-number">🔥 Tu récord actual: ${survBest} seguidas</span>
          ${btn('Probar mi racha →','surv-intro','btn-gold')}
        </div>
      </article>

      <article class="game-card card-accent-emerald">
        <div>
          <div class="game-card-header"><div class="game-icon">🧩</div><span class="badge-tag">${memCleared}/3 MAZOS</span></div>
          <h3>Pares de Estudio</h3>
          <p>Voltea las fichas y une cada organelo celular, fórmula física o regla del lenguaje con su definición en la menor cantidad de intentos.</p>
        </div>
        <div class="card-bottom">
          <span class="card-number">🔬 Citología · ⚗️ Fórmulas · 📐 Reglas</span>
          ${btn('Jugar a los pares →','mem-levels','btn-gold')}
        </div>
      </article>
    </section>`, 'home');
  }

  /* ==================== JUEGO 1: RUTA POR MATERIAS ==================== */
  const unlocked = i => i===0 || getStars(progress.adventure[SUBJECTS[i-1].id]?.best || 0)>0;
  function adventureMap(){adventure=null;
    const done=SUBJECTS.filter(s=>getStars(progress.adventure[s.id]?.best || 0)>0).length;
    const stars=SUBJECTS.reduce((n,s)=>n+getStars(progress.adventure[s.id]?.best || 0),0);
    show(`<div class="backline">${btn('← Volver a los juegos','home','btn-quiet')}</div>
     ${intro('JUEGO 01 · RECORRIDO POR ASIGNATURAS','Ruta por Materias','Supera una materia con 60% o más para abrir la siguiente. Si una pregunta se complica, usa las ayudas de arriba.')}
     <div class="overview-stats"><div class="stat"><strong>${done}/6</strong><small>Etapas superadas</small></div><div class="stat"><strong>${stars}/18</strong><small>Estrellas ganadas</small></div><div class="stat"><strong>🧪 3</strong><small>Ayudas por etapa</small></div></div>
     <div class="epic-mode-selector"><strong>⏱️ RITMO:</strong><button type="button" data-action="mode:normal" aria-pressed="${adventureMode==='normal'}">🧭 Sin reloj (tranquilo)</button><button type="button" data-action="mode:timer" aria-pressed="${adventureMode==='timer'}">⏱️ Con tiempo (20 s)</button></div>
     <div class="epic-mode-selector"><strong>📚 NIVEL:</strong>${[['all','🌈 Todas'],['facil','🌱 Fácil'],['normal','⚡ Normal'],['dificil','🔥 Difícil']].map(([k,title])=>`<button type="button" data-action="diff:${k}" aria-pressed="${adventureDifficulty===k}">${title}</button>`).join('')}</div>
     <div class="map-path" aria-label="Mapa de etapas">${SUBJECTS.map((s,i)=>{const available=unlocked(i),r=progress.adventure[s.id]||{},best=r.best||0;return `<button class="island ${s.theme||''} ${!available?'locked':''} ${s.id==='final'?'final':''}" type="button" data-stage="${s.id}" ${!available?'disabled aria-label="Etapa '+(i+1)+' bloqueada"':''}>
       <span class="level-no">ETAPA ${i+1}</span>${!available?'<span class="lock">🔒</span>':''}<span class="island-icon" aria-hidden="true">${available?s.icon:'🔒'}</span><strong>${escapeHtml(s.name)}</strong><small>${available?(best?`Mejor nota: ${best}%`:'Lista para jugar'):'Completa la anterior'}</small><span class="stars" aria-label="${getStars(best)} de 3 estrellas">${starsText(getStars(best))}</span></button>`;}).join('')}</div>`, 'av-map');}

  function startAdventure(id){const index=SUBJECTS.findIndex(s=>s.id===id);if(index<0||!unlocked(index))return;
    const s=SUBJECTS[index],pool=bank.filter(q=>(id==='final' ? true : q.topic.startsWith(id))&&(adventureDifficulty==='all'||difficultyById[q.id]===adventureDifficulty));
    if(pool.length<(id==='final'?10:5)){announce('No hay suficientes preguntas con ese filtro.');return;}
    const qty=id==='final'?10:5;
    let questions;
    if(id==='final'){
      questions=SUBJECTS.filter(x=>x.id!=='final').flatMap(x=>shuffle(pool.filter(q=>q.topic.startsWith(x.id))).slice(0,2));
      questions=shuffle(questions);
    }else questions=shuffle(pool).slice(0,qty);
    adventure={
      id,subject:s,questions,pos:0,answers:Array(qty).fill(null),
      answerOrders:questions.map(()=>shuffle([0,1,2,3])),
      hearts:3,combo:0,maxCombo:0,bonus:0,mode:adventureMode,deadline:null,
      hiddenOptions:new Set(),shieldActive:false,
      powerups:{fifty:1,shield:1,heal:1}
    };
    renderAdventureQuestion();
  }

  function renderAdventureQuestion(){if(!adventure)return;
    const g=adventure,q=g.questions[g.pos],chosen=g.answers[g.pos],order=g.answerOrders[g.pos],hasAnswer=chosen!==null;
    const good=hasAnswer&&chosen===q.c,dead=g.hearts<=0,seconds=g.mode==='timer'?`<span class="epic-timer" id="adventureClock">⏱️ ${hasAnswer?'—':'20 s'}</span>`:'';
    show(`<div class="backline">${btn('← Volver al mapa','av-map','btn-quiet')}</div><div class="page-head"><div>${eyebrow('ETAPA · '+g.subject.subject.toUpperCase())}<h1>${g.subject.icon} ${escapeHtml(g.subject.name)}</h1><p>${escapeHtml(g.subject.desc)}</p></div><span class="pill">Pregunta ${g.pos+1} de ${g.questions.length}</span></div>
      <div class="epic-hud"><span class="epic-heart" id="adventureHearts">${'❤️'.repeat(g.hearts)}${'🖤'.repeat(3-g.hearts)} · ${g.hearts} vidas</span><span class="epic-combo" id="adventureCombo">🔥 Racha ×${g.combo}</span>${g.shieldActive?'<span class="pill">🛡️ Escudo listo</span>':''}${seconds}<span>✦ Extra +${g.bonus} XP</span></div>
      <div class="powerup-bar" aria-label="Ayudas de partida">
        <span class="powerup-label">🧪 AYUDAS:</span>
        <button type="button" class="powerup-btn" data-action="pw-fifty" ${hasAnswer||g.powerups.fifty<=0?'disabled':''}>✂️ Quitar 2 opciones (${g.powerups.fifty})</button>
        <button type="button" class="powerup-btn" data-action="pw-shield" ${hasAnswer||g.powerups.shield<=0||g.shieldActive?'disabled':''}>🛡️ Proteger vida (${g.powerups.shield})</button>
        <button type="button" class="powerup-btn" data-action="pw-heal" ${g.powerups.heal<=0||g.hearts>=3?'disabled':''}>💊 Recuperar +1 ❤️ (${g.powerups.heal})</button>
      </div>
      <div class="challenge-layout"><section><div class="track"><span style="width:${Math.round((g.pos+1)/g.questions.length*100)}%"></span></div>
        <div class="question-box" style="margin-top:14px">${eyebrow('PREGUNTA '+(g.pos+1))}<h2>${escapeHtml(q.q)}</h2><div class="answer-list">${order.map((orig,i)=>{
          const isEliminated = g.hiddenOptions.has(orig);
          return `<button type="button" class="answer-option ${isEliminated?'eliminated':''} ${hasAnswer ? (orig===q.c?'correct':orig===chosen?'incorrect':''):''}" data-answer="${orig}" ${hasAnswer||isEliminated?'disabled':''}><span class="letter">${'ABCD'[i]}</span><span>${isEliminated?'<s>Opción descartada</s>':escapeHtml(q.a[orig])}</span></button>`;
        }).join('')}</div>
        ${hasAnswer?`<div class="feedback ${good?'good':'bad'}"><strong>${good?'✅ ¡Bien hecho! Respuesta correcta':chosen===-1?'⌛ Se terminó el tiempo':'💡 Para tener en cuenta'}</strong><p>${escapeHtml(q.e||'La respuesta correcta aparece marcada en verde.')}</p></div><div class="btn-row" style="margin-top:15px">${btn(dead?'Ver resumen →':g.pos===g.questions.length-1?'Ver calificación →':'Siguiente pregunta →','av-next','btn-gold btn-lg')}</div>`:''}</div></section>
        <aside class="panel quiz-side"><h3>📊 Tu partida</h3><div class="info-row"><span>Materia</span><strong>${escapeHtml(g.subject.subject)}</strong></div><div class="info-row"><span>Aciertos</span><strong>${g.answers.filter((ans,i)=>ans!==null&&ans===g.questions[i].c).length} / ${g.questions.length}</strong></div><div class="info-row"><span>Ritmo</span><strong>${g.mode==='timer'?'20 s por pregunta':'Sin límite'}</strong></div><div class="info-row"><span>Dificultad</span><strong>${levelText[adventureDifficulty]}</strong></div><div class="learning-card"><strong>💡 Consejo</strong><p>Cada 3 respuestas correctas seguidas ganas +5 XP adicionales. Si dudas entre dos opciones, usa el botón de quitar 2 opciones.</p></div></aside>
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

  function useAdventurePowerup(kind){
    const g=adventure;if(!g||g.answers[g.pos]!==null)return;
    const q=g.questions[g.pos];
    if(kind==='fifty'&&g.powerups.fifty>0){
      const wrongs=[0,1,2,3].filter(i=>i!==q.c&&!g.hiddenOptions.has(i));
      shuffle(wrongs).slice(0,2).forEach(i=>g.hiddenOptions.add(i));
      g.powerups.fifty--;
      window.MedyteEpic?.sound('tap');
      announce('✂️ Se descartaron 2 opciones incorrectas.');
      renderAdventureQuestion();
    }else if(kind==='shield'&&g.powerups.shield>0&&!g.shieldActive){
      g.powerups.shield--;
      g.shieldActive=true;
      window.MedyteEpic?.sound('tap');
      announce('🛡️ Escudo activado para esta pregunta.');
      renderAdventureQuestion();
    }else if(kind==='heal'&&g.powerups.heal>0&&g.hearts<3){
      g.powerups.heal--;
      g.hearts=Math.min(3,g.hearts+1);
      window.MedyteEpic?.sound('good');
      announce('💊 Recuperaste 1 vida.');
      renderAdventureQuestion();
    }
  }

  function answerAdventure(index){const g=adventure;if(!g||g.answers[g.pos]!==null)return;
    const q=g.questions[g.pos];if(index!==-1&&(!Number.isInteger(index)||index<0||index>=q.a.length))return;
    clearInterval(adventureTimer);adventureTimer=null;
    g.answers[g.pos]=index;
    if(index===q.c){
      g.combo++;g.maxCombo=Math.max(g.maxCombo,g.combo);
      if(g.combo>0&&g.combo%3===0){g.bonus+=5;announce('🔥 ¡3 seguidas! +5 XP extra');}
      g.shieldActive=false;
      window.MedyteEpic?.sound('good');
    }else{
      if(g.shieldActive){
        g.shieldActive=false;
        announce('🛡️ El escudo te salvó de perder una vida.');
      }else{
        g.hearts=Math.max(0,g.hearts-1);
      }
      g.combo=0;window.MedyteEpic?.sound('bad');
    }
    renderAdventureQuestion();
  }

  function nextAdventure(){if(!adventure||adventure.answers[adventure.pos]===null)return;
    adventure.hiddenOptions=new Set();
    adventure.shieldActive=false;
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
    if(stars>0)window.MedyteEpic?.celebrate('¡Etapa superada!');
    show(`<div class="results panel"><span class="result-emoji">${stars>0?'🏆':endedEarly?'💔':'🧭'}</span>${eyebrow('RESUMEN DE LA ETAPA')}<h1>${stars>0?'¡Etapa superada!':endedEarly?'Te quedaste sin vidas':'Buen intento, sigue practicando'}</h1><p>${escapeHtml(g.subject.name)}</p><div class="score-big">${right}/${g.questions.length} (${score}%)</div><div class="result-stars">${starsText(stars)}</div><p>${stars>0?'Ya tienes desbloqueada la siguiente materia del mapa.':'Consigue al menos 60% sin perder todas las vidas para avanzar.'}</p>
      <div class="overview-stats"><div class="stat"><strong>+${xp} XP</strong><small>Puntos sumados</small></div><div class="stat"><strong>🔥 ×${g.maxCombo}</strong><small>Mejor racha</small></div><div class="stat"><strong>${g.hearts} ❤️</strong><small>Vidas al terminar</small></div></div>
      ${firstClear?'<div class="epic-boss-banner">🎁 ¡Bono de +20 XP por superar esta etapa por primera vez!</div>':''}
      <div class="btn-row">${btn('🗺️ Ir al mapa','av-map','btn-gold')}${btn('Volver a jugar','av-retry:'+g.id,'btn-outline')}${btn('Ver mi progreso','campus-progress','btn-quiet')}</div></div>`, 'av-result');
  }

  /* ==================== JUEGO 2: GUARDIA DE EMERGENCIA (CASOS CLÍNICOS) ==================== */
  function startClinicalCases(){
    const list = shuffle(CLINICAL_CASES).slice(0, 5).map(c => {
      const order = shuffle([0,1,2,3]);
      return {...c, order};
    });
    clinical = {list, pos:0, correct:0, answered:null, xp:0};
    renderClinicalCase();
  }

  function renderClinicalCase(){
    if(!clinical)return;
    const c = clinical, item = c.list[c.pos], hasAns = c.answered !== null;
    const isOk = hasAns && c.answered === item.correct;
    show(`<div class="backline">${btn('← Salir de la guardia','home','btn-quiet')}</div>
      ${intro('JUEGO 02 · GUARDIA DE EMERGENCIA','🩺 Casos Prácticos de Guardia','Lee la situación del paciente o del laboratorio, revisa los datos en el monitor y responde la pregunta.')}
      <div class="ecg-monitor">
        <div class="ecg-top">
          <span class="ecg-badge">● MONITOR ACTIVO · CASO ${c.pos+1} DE ${c.list.length}</span>
          <span class="ecg-vitals">${escapeHtml(item.vitals)}</span>
        </div>
        <svg class="ecg-line" viewBox="0 0 500 50" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,25 L80,25 L95,15 L105,35 L115,5 L125,45 L135,20 L150,25 L260,25 L275,15 L285,35 L295,5 L305,45 L315,20 L330,25 L500,25" fill="none" stroke="#4ade80" stroke-width="2.5"/>
        </svg>
        <div class="patient-story">
          <strong>📋 ${escapeHtml(item.patient)}:</strong>
          <p>${escapeHtml(item.story)}</p>
        </div>
      </div>

      <div class="question-box" style="margin-top:16px">
        ${eyebrow('PREGUNTA DEL CASO')}
        <h2>${escapeHtml(item.question)}</h2>
        <div class="answer-list">
          ${item.order.map((orig, idx) => `<button type="button" class="answer-option ${hasAns?(orig===item.correct?'correct':orig===c.answered?'incorrect':''):''}" data-case-ans="${orig}" ${hasAns?'disabled':''}><span class="letter">${'ABCD'[idx]}</span><span>${escapeHtml(item.options[orig])}</span></button>`).join('')}
        </div>
        ${hasAns ? `<div class="feedback ${isOk?'good':'bad'}"><strong>${isOk?'✅ Diagnóstico y respuesta correcta (+15 XP)':'💡 Explicación del caso'}</strong><p>${escapeHtml(item.explain)}</p></div>
        <div class="btn-row" style="margin-top:15px">${btn(c.pos===c.list.length-1?'Ver resultado de la guardia →':'Siguiente paciente →','case-next','btn-gold btn-lg')}</div>` : ''}
      </div>`, 'case-playing');
  }

  function answerClinicalCase(orig){
    if(!clinical || clinical.answered!==null)return;
    const item = clinical.list[clinical.pos];
    clinical.answered = orig;
    if(orig === item.correct){
      clinical.correct++;
      clinical.xp += 15;
      window.MedyteEpic?.sound('good');
    }else{
      window.MedyteEpic?.sound('bad');
    }
    renderClinicalCase();
  }

  function nextClinicalCase(){
    if(!clinical)return;
    if(clinical.pos < clinical.list.length - 1){
      clinical.pos++;
      clinical.answered = null;
      renderClinicalCase();
    }else{
      const right = clinical.correct, total = clinical.list.length, xp = clinical.xp;
      progress.cases = {
        wins: (progress.cases?.wins || 0) + 1,
        best: Math.max(progress.cases?.best || 0, Math.round(right*100/total))
      };
      saveProgress();
      storeXP(xp, null);
      clinical = null;
      if(right >= 3) window.MedyteEpic?.celebrate('¡Turno de guardia completado!');
      show(`<section class="results panel">
        <span class="result-emoji">🩺</span>${eyebrow('TURNO DE GUARDIA FINALIZADO')}
        <h1>Resolviste ${right} de ${total} casos</h1>
        <div class="score-big">+${xp} XP</div>
        <p>Excelente práctica para conectar la teoría de Biología, Química y Física con situaciones reales.</p>
        <div class="btn-row">${btn('🩺 Otra guardia (nuevos casos)','case-start','btn-gold')}${btn('← Volver a los juegos','home','btn-quiet')}</div>
      </section>`, 'case-result');
    }
  }

  /* ==================== JUEGO 3: ATLAS DE ANATOMÍA (5 NIVELES) ==================== */
  function anatomyLevels(){anatomy=null;
    const wins=ANATOMY_LEVELS.filter(l=>(progress.anatomy[l.id]?.wins||0)>0).length;
    show(`<div class="backline">${btn('← Volver a los juegos','home','btn-quiet')}</div>
      ${intro('JUEGO 03 · ATLAS CORPORAL','Atlas de Anatomía','Elige uno de los cinco tableros y señala dónde se ubica cada órgano o hueso. Puedes tocar el número directamente o arrastrar la ficha.')}
      <div class="overview-stats"><div class="stat"><strong>${wins}/${ANATOMY_LEVELS.length}</strong><small>Tableros completados</small></div><div class="stat"><strong>+12 XP</strong><small>Al acertar a la primera</small></div><div class="stat"><strong>+6 XP</strong><small>En más intentos</small></div></div>
      <section class="anatomy-levels">${ANATOMY_LEVELS.map((l,i)=>{const r=progress.anatomy[l.id]||{};return `<article class="panel anatomy-level"><div><div class="level-icon">${l.icon}</div>${eyebrow('TABLERO 0'+(i+1))}<h3>${escapeHtml(l.name)}</h3><p>${escapeHtml(l.desc)}</p></div><div style="width:100%"><p class="small-progress">${r.wins?`Superado ${r.wins} ${r.wins===1?'vez':'veces'} · Mejor: ${r.bestFirst||0}/${l.targets.length} a la primera`:'Pendiente de jugar'}</p>${btn('Jugar este tablero →','an-start:'+l.id,'btn-gold btn-block')}</div></article>`}).join('')}</section>`, 'an-levels');}

  function anatomySvg(){return `<svg viewBox="0 0 360 510" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="silhouette" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#295973"/><stop offset="1" stop-color="#142f44"/></linearGradient>
        <radialGradient id="glowSpot" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/><stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/></radialGradient>
      </defs>
      <rect x="1" y="1" width="358" height="508" rx="23" fill="#0b1f31" stroke="#335773"/>
      <circle cx="180" cy="240" r="150" fill="url(#glowSpot)"/>
      <circle cx="180" cy="62" r="38" fill="url(#silhouette)" stroke="#7aa2b8" stroke-width="2"/>
      <path d="M165 96 L159 120 Q133 115 114 133 Q89 145 86 180 L70 287 Q68 300 80 306 Q93 311 98 298 L120 206 L125 304 Q131 345 142 371 L150 463 Q150 486 166 486 Q181 484 182 468 L188 380 L196 466 Q198 484 213 484 Q227 484 229 465 L239 372 Q251 345 253 304 L250 206 L272 296 Q278 309 291 305 Q302 300 299 286 L280 180 Q275 145 253 133 Q231 116 202 120 L196 96 Z" fill="url(#silhouette)" stroke="#7aa2b8" stroke-width="2.5"/>
      <path d="M181 124 L181 365 M150 185 Q180 203 214 185 M136 267 Q181 291 243 266" class="body-detail"/>
      <path d="M151 170 Q130 169 132 205 Q136 235 165 242 L174 214 L169 173 Z" class="body-lung"/>
      <path d="M191 173 Q221 165 226 206 Q223 235 192 244 L184 214 Z" class="body-lung"/>
      <path d="M179 222 Q189 209 202 221 Q213 237 190 250 Q175 243 179 222" fill="#e15b6488" stroke="#f4a2a877"/>
      <path d="M145 264 Q163 246 188 257 L186 288 L146 295 Z" class="body-organ"/>
      <path d="M192 270 Q223 268 219 303 Q209 320 195 302Z" class="body-organ"/>
      <path d="M160 317 L211 317 L213 364 L161 365 Z" fill="#c49a6640" stroke="#d3b28170" stroke-dasharray="5 5"/>
      </svg>`;}

  function startAnatomy(id){const level=ANATOMY_LEVELS.find(l=>l.id===id);if(!level)return;
    anatomy={level,order:shuffle(level.targets),index:0,matched:new Set(),firstTry:{},earned:0,lastFact:null,wrong:false,hintsLeft:2,usedHint:{},combo:0,maxCombo:0};renderAnatomyPlay();}

  function renderAnatomyPlay(){if(!anatomy)return;const a=anatomy,level=a.level,current=a.order[a.index];
    show(`<div class="backline">${btn('← Cambiar de tablero','an-levels','btn-quiet')}</div>
      <div class="page-head"><div>${eyebrow('ATLAS DE ANATOMÍA · '+level.name.toUpperCase())}<h1>${level.icon} ¿Dónde está: ${escapeHtml(current.name)}?</h1><p>Toca el número en la figura o arrastra la tarjeta hasta su ubicación.</p></div><span class="pill">${a.index+1} de ${a.order.length}</span></div>
      <div class="epic-hud"><span class="epic-combo">🔥 Aciertos seguidos: ${a.combo}</span><span>💡 Pistas: ${a.hintsLeft}/2</span><span>⭐ +${a.earned} XP</span></div>
      <div class="anatomy-layout"><section class="panel"><div class="diagram-wrap">${anatomySvg()}
        ${level.targets.map((target,i)=>`<button type="button" class="hotspot ${a.matched.has(target.id)?'matched':''}" style="--x:${target.x}%;--y:${target.y}%" data-spot="${escapeHtml(target.id)}" aria-label="Punto ${i+1}" ${a.matched.has(target.id)?'disabled':''}>${a.matched.has(target.id)?'✓':i+1}</button>`).join('')}</div><p class="diagram-caption">Esquema orientativo · Toca el número que corresponda</p></section>
      <aside><div class="anatomy-task">${eyebrow('BUSCANDO AHORA')}<div class="task-icon">${current.icon}</div><h2>${escapeHtml(current.name)}</h2><div class="epic-organ-token" data-organ-drag="${escapeHtml(current.id)}" role="img" aria-label="Arrastrar ${escapeHtml(current.name)}">${current.icon} <strong>${escapeHtml(current.name)}</strong><span>↗ Arrastrar o tocar número</span></div>
        <div class="mini-progress-label"><span>Avance del tablero</span><strong>${a.index}/${a.order.length}</strong></div><div class="track"><span style="width:${Math.round(a.index/a.order.length*100)}%"></span></div>
        <div class="anatomy-tip" id="anatomyFeedback" role="status">🔎 Elige uno de los círculos numerados en la figura.</div><button type="button" class="epic-an-hint" data-action="an-hint" ${a.hintsLeft<=0||a.usedHint[current.id]?'disabled':''}>✨ Mostrar pista (${a.hintsLeft} disponibles)</button></div>
        ${a.lastFact?`<div class="learning-card"><strong>📘 Dato clave para el examen</strong><p>${escapeHtml(a.lastFact)}</p></div>`:''}
      </aside></div>`, 'an-playing');}

  function anatomyHint(){const a=anatomy;if(!a||a.hintsLeft<=0)return;
    const correct=a.order[a.index];if(!correct||a.usedHint[correct.id])return;
    a.hintsLeft--;a.usedHint[correct.id]=true;a.firstTry[correct.id]=false;
    const spot=[...root.querySelectorAll('[data-spot]')].find(el=>el.dataset.spot===correct.id);
    if(spot){spot.classList.add('target-hint');setTimeout(()=>spot.classList.remove('target-hint'),2700);}
    const feedback=document.getElementById('anatomyFeedback');if(feedback)feedback.textContent='✨ Mira el círculo que está brillando en la figura.';
    const hint=root.querySelector('[data-action="an-hint"]');if(hint){hint.disabled=true;hint.textContent=`✨ Pistas disponibles: ${a.hintsLeft}`;}
    window.MedyteEpic?.sound('tap');
  }

  function selectAnatomySpot(id){const a=anatomy;if(!a||!a.order[a.index])return;
    const correct=a.order[a.index];if(a.matched.has(id))return;
    const spot=[...root.querySelectorAll('[data-spot]')].find(el=>el.dataset.spot===id);
    if(id!==correct.id){a.firstTry[correct.id]=false;a.wrong=true;a.combo=0;window.MedyteEpic?.sound('bad');
      if(spot){spot.classList.remove('wrong');void spot.offsetWidth;spot.classList.add('wrong');}
      const feedback=document.getElementById('anatomyFeedback');if(feedback)feedback.textContent='❌ Ahí no está. Fíjate bien en la posición y prueba con otro número.';return;}
    const wasFirstTry=a.firstTry[correct.id]!==false;
    const gain=a.usedHint[correct.id]?3:wasFirstTry?12:6;
    a.earned+=gain;a.combo++;a.maxCombo=Math.max(a.maxCombo,a.combo);
    a.matched.add(correct.id);a.lastFact=correct.fact;a.index++;
    window.MedyteEpic?.sound('good');
    announce(`✓ ${correct.name} (+${gain} XP)`);
    if(a.index===a.order.length)finishAnatomy();else renderAnatomyPlay();
  }

  function finishAnatomy(){const a=anatomy;if(!a)return;
    const first=a.order.filter(q=>a.firstTry[q.id]!==false).length,correct=a.order.length;
    const old=progress.anatomy[a.level.id] || {wins:0,bestFirst:0};
    const firstClear=!old.wins;
    const xp=a.earned+(firstClear?25:0);
    progress.anatomy[a.level.id]={wins:(old.wins||0)+1,bestFirst:Math.max(old.bestFirst||0,first),lastFirst:first,lastDate:dateLocal(),bestCombo:Math.max(old.bestCombo||0,a.maxCombo)};
    saveProgress();storeXP(xp,null);anatomy=null;
    window.MedyteEpic?.celebrate('¡Tablero completado!');
    show(`<section class="results panel"><span class="result-emoji">${a.level.icon}</span>${eyebrow('TABLERO COMPLETADO')}<h1>¡Muy buen trabajo!</h1><p>${escapeHtml(a.level.name)} · Ubicaste las ${correct} estructuras.</p>
      <div class="score-big">${correct}/${correct}</div><div class="overview-stats"><div class="stat"><strong>+${xp} XP</strong><small>Puntos ganados</small></div><div class="stat"><strong>${first}/${correct}</strong><small>Acertados a la primera</small></div><div class="stat"><strong>🔥 ×${a.maxCombo}</strong><small>Mejor racha</small></div></div>
      ${firstClear?'<div class="epic-boss-banner">🎁 ¡Bono de +25 XP por completar este tablero por primera vez!</div>':''}
      <div class="btn-row">${btn('Ver otros tableros →','an-levels','btn-gold')}${btn('Repetir este tablero','an-retry:'+a.level.id,'btn-outline')}${btn('Volver a los juegos','home','btn-quiet')}</div></section>`, 'an-result');
  }

  /* ==================== JUEGO 4: RACHA AL LÍMITE (SUPERVIVENCIA) ==================== */
  let survivalSubject = 'all';
  function survivalIntro(){
    survival=null;
    const st = progress.survival || {bestStreak:0,bestScore:0,plays:0};
    show(`<div class="backline">${btn('← Volver a los juegos','home','btn-quiet')}</div>
      ${intro('JUEGO 04 · CONTRARRELOJ','⚡ Racha al Límite','Tienes 3 vidas y 18 segundos por pregunta. Responde bien todas las que puedas seguidas usando tus ayudas cuando te quedes con dudas.')}
      <div class="overview-stats">
        <div class="stat"><strong>🔥 ${st.bestStreak||0}</strong><small>Mejor racha de aciertos</small></div>
        <div class="stat"><strong>⭐ ${st.bestScore||0} XP</strong><small>Mejor puntaje en una partida</small></div>
        <div class="stat"><strong>🎮 ${st.plays||0}</strong><small>Partidas jugadas</small></div>
      </div>
      <div class="panel" style="margin-top:18px">
        <h3>Elige de qué materia quieres las preguntas</h3>
        <div class="epic-mode-selector" style="margin:12px 0">
          ${[['all','🌈 Todas mezcladas'],['bio','🌿 Biología'],['qui','⚗️ Química'],['fis','⚡ Física'],['mat','🔢 Matemáticas'],['len','📚 Lenguaje']].map(([id,label])=>`<button type="button" data-action="surv-sub:${id}" aria-pressed="${survivalSubject===id}">${label}</button>`).join('')}
        </div>
        <p class="muted">Ganas <b>+10 XP</b> por cada respuesta correcta y un bono adicional cada 3 aciertos seguidos.</p>
        <div class="btn-row" style="margin-top:16px">${btn('⚡ Empezar partida ahora','surv-start','btn-gold btn-lg')}</div>
      </div>`, 'surv-intro');
  }

  function startSurvival(){
    const pool = shuffle(bank.filter(q => survivalSubject==='all' || q.topic.startsWith(survivalSubject)));
    if(!pool.length){announce('No se encontraron preguntas.');return;}
    survival = {
      pool, idx:0, hearts:3, streak:0, maxStreak:0, correctCount:0, xpEarned:0,
      currentOrder: shuffle([0,1,2,3]), answered:null, hiddenOptions:new Set(),
      powerups:{fifty:2,time:2,heal:1}, deadline:0, historyItems:[]
    };
    renderSurvival();
  }

  function renderSurvival(){
    if(!survival)return;
    const s = survival;
    const q = s.pool[s.idx % s.pool.length];
    const hasAns = s.answered !== null;
    const good = hasAns && s.answered === q.c;
    show(`<div class="backline">${btn('← Terminar y guardar mis puntos','surv-finish','btn-quiet')}</div>
      <div class="page-head"><div>${eyebrow('RACHA AL LÍMITE · PREGUNTA '+(s.idx+1))}<h1>⚡ Mantén tu racha</h1></div><span class="pill">🔥 Récord: ${Math.max(progress.survival?.bestStreak||0, s.maxStreak)}</span></div>
      <div class="epic-hud">
        <span class="epic-heart">${'❤️'.repeat(s.hearts)}${'🖤'.repeat(3-s.hearts)} · ${s.hearts} vidas</span>
        <span class="epic-combo">🔥 Racha actual: ×${s.streak}</span>
        <span class="epic-timer" id="survClock">⏱️ ${hasAns?'—':'18 s'}</span>
        <span>✦ +${s.xpEarned} XP</span>
      </div>
      <div class="powerup-bar">
        <span class="powerup-label">⚡ AYUDAS RÁPIDAS:</span>
        <button type="button" class="powerup-btn" data-action="spw-fifty" ${hasAns||s.powerups.fifty<=0?'disabled':''}>✂️ Quitar 2 (${s.powerups.fifty})</button>
        <button type="button" class="powerup-btn" data-action="spw-time" ${hasAns||s.powerups.time<=0?'disabled':''}>⏳ +15 segundos (${s.powerups.time})</button>
        <button type="button" class="powerup-btn" data-action="spw-heal" ${s.powerups.heal<=0||s.hearts>=3?'disabled':''}>💊 +1 vida (${s.powerups.heal})</button>
      </div>
      <div class="question-box" style="margin-top:14px">
        ${eyebrow('PREGUNTA #'+(s.idx+1))}
        <h2>${escapeHtml(q.q)}</h2>
        <div class="answer-list">${s.currentOrder.map((orig,i)=>{
          const elim = s.hiddenOptions.has(orig);
          return `<button type="button" class="answer-option ${elim?'eliminated':''} ${hasAns?(orig===q.c?'correct':orig===s.answered?'incorrect':''):''}" data-surv-answer="${orig}" ${hasAns||elim?'disabled':''}><span class="letter">${'ABCD'[i]}</span><span>${elim?'<s>Opción descartada</s>':escapeHtml(q.a[orig])}</span></button>`;
        }).join('')}</div>
        ${hasAns?`<div class="feedback ${good?'good':'bad'}"><strong>${good?'✅ ¡Correcto! Suma a tu racha':s.answered===-1?'⌛ Se acabó el tiempo (-1 ❤️)':'❌ Incorrecto (-1 ❤️)'}</strong><p>${escapeHtml(q.e)}</p></div>
        <div class="btn-row" style="margin-top:15px">${btn(s.hearts<=0?'Ver puntaje final →':'Siguiente pregunta →','surv-next','btn-gold btn-lg')}</div>`:''}
      </div>`, 'surv-playing');

    if(!hasAns){
      s.deadline = Date.now() + 18000;
      survivalTimer = setInterval(()=>{
        if(!survival || survival.answered!==null){clearInterval(survivalTimer);survivalTimer=null;return;}
        const left = Math.max(0, s.deadline - Date.now());
        const el = document.getElementById('survClock');
        if(el) el.textContent = `⏱️ ${Math.ceil(left/1000)} s`;
        if(left<=0){clearInterval(survivalTimer);survivalTimer=null;answerSurvival(-1);}
      }, 200);
    }
  }

  function useSurvivalPowerup(kind){
    if(!survival || survival.answered!==null)return;
    const s = survival, q = s.pool[s.idx % s.pool.length];
    if(kind==='fifty' && s.powerups.fifty>0){
      const wrongs=[0,1,2,3].filter(i=>i!==q.c && !s.hiddenOptions.has(i));
      shuffle(wrongs).slice(0,2).forEach(i=>s.hiddenOptions.add(i));
      s.powerups.fifty--;
      window.MedyteEpic?.sound('tap');
      announce('✂️ Se quitaron 2 opciones.');
      renderSurvival();
    }else if(kind==='time' && s.powerups.time>0){
      s.powerups.time--;
      s.deadline += 15000;
      window.MedyteEpic?.sound('tap');
      announce('⏳ Tienes 15 segundos más.');
    }else if(kind==='heal' && s.powerups.heal>0 && s.hearts<3){
      s.powerups.heal--;
      s.hearts = Math.min(3, s.hearts+1);
      window.MedyteEpic?.sound('good');
      announce('💊 Recuperaste 1 vida.');
      renderSurvival();
    }
  }

  function answerSurvival(choice){
    if(!survival || survival.answered!==null)return;
    clearInterval(survivalTimer);survivalTimer=null;
    const s = survival, q = s.pool[s.idx % s.pool.length];
    s.answered = choice;
    s.historyItems.push({id:q.id, answer:choice===-1?null:choice, correct:q.c});
    if(choice === q.c){
      s.correctCount++;
      s.streak++;
      s.maxStreak = Math.max(s.maxStreak, s.streak);
      const gain = 10 + (s.streak%3===0 ? 5 : 0);
      s.xpEarned += gain;
      if(s.streak%3===0) announce(`🔥 ¡${s.streak} seguidas! +5 XP extra`);
      window.MedyteEpic?.sound('good');
    }else{
      s.hearts = Math.max(0, s.hearts-1);
      s.streak = 0;
      window.MedyteEpic?.sound('bad');
    }
    renderSurvival();
  }

  function nextSurvival(){
    if(!survival)return;
    if(survival.hearts<=0){finishSurvival();return;}
    survival.idx++;
    survival.answered = null;
    survival.hiddenOptions = new Set();
    survival.currentOrder = shuffle([0,1,2,3]);
    renderSurvival();
  }

  function finishSurvival(){
    if(!survival)return;
    clearInterval(survivalTimer);survivalTimer=null;
    const s = survival;
    const prev = progress.survival || {bestStreak:0,bestScore:0,plays:0};
    const isNewRecord = s.maxStreak > (prev.bestStreak||0);
    progress.survival = {
      bestStreak: Math.max(prev.bestStreak||0, s.maxStreak),
      bestScore: Math.max(prev.bestScore||0, s.xpEarned),
      plays: (prev.plays||0) + 1,
      lastDate: dateLocal()
    };
    saveProgress();
    if(s.historyItems.length){
      storeXP(s.xpEarned, {date:new Date().toISOString(),correct:s.correctCount,total:s.historyItems.length,mode:'game-adventure',scope:'supervivencia',items:s.historyItems,daily:false,timedOut:false});
    }
    survival = null;
    if(s.correctCount>=5) window.MedyteEpic?.celebrate('¡Gran racha lograda!');
    show(`<section class="results panel">
      <span class="result-emoji">⚡</span>${eyebrow('FIN DE LA PARTIDA')}
      <h1>${isNewRecord?'🏆 ¡Superaste tu récord de racha!':'Partida terminada'}</h1>
      <div class="score-big">${s.correctCount} aciertos</div>
      <div class="overview-stats">
        <div class="stat"><strong>+${s.xpEarned} XP</strong><small>Puntos sumados</small></div>
        <div class="stat"><strong>🔥 ×${s.maxStreak}</strong><small>Mejor racha hoy</small></div>
        <div class="stat"><strong>🏅 ${progress.survival.bestStreak}</strong><small>Tu récord general</small></div>
      </div>
      <div class="btn-row">${btn('⚡ Jugar de nuevo','surv-start','btn-gold')}${btn('Cambiar materia','surv-intro','btn-outline')}${btn('← Volver a los juegos','home','btn-quiet')}</div>
    </section>`, 'surv-result');
  }

  /* ==================== JUEGO 5: PARES DE ESTUDIO (MEMORIA) ==================== */
  function memoryLevels(){
    memory = null;
    const wins = MEMORY_DECKS.filter(d=>(progress.memory[d.id]?.wins||0)>0).length;
    show(`<div class="backline">${btn('← Volver a los juegos','home','btn-quiet')}</div>
      ${intro('JUEGO 05 · MEMORIA VISUAL','🧩 Pares de Estudio','Da vuelta dos fichas por turno hasta encontrar qué concepto va con cada función o fórmula.')}
      <div class="overview-stats">
        <div class="stat"><strong>${wins}/${MEMORY_DECKS.length}</strong><small>Mazos superados</small></div>
        <div class="stat"><strong>+40 XP</strong><small>Por cada mazo completo</small></div>
        <div class="stat"><strong>🧠 6 pares</strong><small>12 tarjetas por tablero</small></div>
      </div>
      <section class="anatomy-levels">${MEMORY_DECKS.map((d,i)=>{
        const r = progress.memory[d.id] || {};
        return `<article class="panel anatomy-level"><div><div class="level-icon">${d.icon}</div>${eyebrow('MAZO 0'+(i+1))}<h3>${escapeHtml(d.name)}</h3><p>${escapeHtml(d.desc)}</p></div><div style="width:100%"><p class="small-progress">${r.wins?`Completado ${r.wins} ${r.wins===1?'vez':'veces'} · Menos intentos: ${r.bestMoves}`:'Aún sin jugar'}</p>${btn('Abrir tablero →','mem-start:'+d.id,'btn-gold btn-block')}</div></article>`;
      }).join('')}</section>`, 'mem-levels');
  }

  function startMemory(deckId){
    const deck = MEMORY_DECKS.find(d=>d.id===deckId);
    if(!deck)return;
    const chosenPairs = shuffle(deck.pairs).slice(0, 6);
    const cards = shuffle(chosenPairs.flatMap(([term, def], idx) => [
      {uid: 't_'+idx, pairId: idx, kind: 'Concepto', text: term},
      {uid: 'd_'+idx, pairId: idx, kind: 'Definición', text: def}
    ]));
    memory = {deck, cards, flipped:[], matched:new Set(), moves:0, locked:false, startTime:Date.now()};
    renderMemory();
  }

  function renderMemory(){
    if(!memory)return;
    const m = memory;
    show(`<div class="backline">${btn('← Cambiar de mazo','mem-levels','btn-quiet')}</div>
      <div class="page-head"><div>${eyebrow('PARES DE ESTUDIO · '+m.deck.name.toUpperCase())}<h1>${m.deck.icon} Une los 6 pares</h1><p>Toca dos tarjetas para ver si corresponden al mismo tema.</p></div><span class="pill">${m.matched.size} de 6 pares</span></div>
      <div class="epic-hud"><span>🎯 Intentos realizados: <strong>${m.moves}</strong></span><span>✅ Encontrados: <strong>${m.matched.size}/6</strong></span><span>🔄 ${btn('Mezclar de nuevo','mem-start:'+m.deck.id,'btn-quiet')}</span></div>
      <div class="memory-grid" aria-label="Tablero de pares">
        ${m.cards.map((c, idx) => {
          const isMat = m.matched.has(c.pairId);
          const isFlip = isMat || m.flipped.includes(idx);
          return `<button type="button" class="memory-card-item ${isFlip?'is-flipped':''} ${isMat?'is-matched':''}" data-mem-idx="${idx}" ${isFlip||m.locked?'disabled':''} aria-label="Ficha ${idx+1}">
            ${isFlip ? `<span class="mem-tag ${c.kind==='Concepto'?'tag-term':'tag-def'}">${c.kind}</span><strong>${escapeHtml(c.text)}</strong>` : `<span class="mem-back-icon">✦</span><small>Voltear</small>`}
          </button>`;
        }).join('')}
      </div>`, 'mem-playing');
  }

  function flipMemoryCard(idx){
    if(!memory || memory.locked)return;
    const m = memory;
    if(idx<0 || idx>=m.cards.length || m.flipped.includes(idx) || m.matched.has(m.cards[idx].pairId))return;
    m.flipped.push(idx);
    window.MedyteEpic?.sound('tap');
    renderMemory();
    if(m.flipped.length === 2){
      m.moves++;
      const [i1, i2] = m.flipped;
      const c1 = m.cards[i1], c2 = m.cards[i2];
      if(c1.pairId === c2.pairId){
        m.matched.add(c1.pairId);
        m.flipped = [];
        window.MedyteEpic?.sound('good');
        announce('✓ ¡Par correcto!');
        if(m.matched.size === 6){
          setTimeout(finishMemory, 350);
        }else{
          renderMemory();
        }
      }else{
        m.locked = true;
        window.MedyteEpic?.sound('bad');
        setTimeout(()=>{
          if(!memory)return;
          memory.flipped = [];
          memory.locked = false;
          renderMemory();
        }, 900);
      }
    }
  }

  function finishMemory(){
    if(!memory)return;
    const m = memory;
    const old = progress.memory[m.deck.id] || {wins:0, bestMoves:999};
    const efficiencyBonus = m.moves <= 9 ? 20 : m.moves <= 13 ? 10 : 0;
    const xp = 40 + efficiencyBonus;
    progress.memory[m.deck.id] = {
      wins: (old.wins||0) + 1,
      bestMoves: Math.min(old.bestMoves||999, m.moves),
      lastDate: dateLocal()
    };
    saveProgress();
    storeXP(xp, null);
    const deckId = m.deck.id, deckName = m.deck.name, moves = m.moves;
    memory = null;
    window.MedyteEpic?.celebrate('¡Tablero completado!');
    show(`<section class="results panel">
      <span class="result-emoji">🧩</span>${eyebrow('TABLERO COMPLETADO')}
      <h1>¡Encontraste todos los pares!</h1>
      <p>${escapeHtml(deckName)}</p>
      <div class="score-big">${moves} intentos</div>
      <div class="overview-stats">
        <div class="stat"><strong>+${xp} XP</strong><small>Puntos ganados</small></div>
        <div class="stat"><strong>6/6</strong><small>Pares resueltos</small></div>
        <div class="stat"><strong>🏆 ${progress.memory[deckId].bestMoves}</strong><small>Tu récord de intentos</small></div>
      </div>
      <div class="btn-row">${btn('Elegir otro mazo →','mem-levels','btn-gold')}${btn('Jugar otra vez','mem-start:'+deckId,'btn-outline')}${btn('← Volver a los juegos','home','btn-quiet')}</div>
    </section>`, 'mem-result');
  }

  function route(action){
    if(action==='home'){home();return;}
    if(action==='av-map'){adventureMap();return;}
    if(action==='an-levels'){anatomyLevels();return;}
    if(action==='case-start'){startClinicalCases();return;}
    if(action==='case-next'){nextClinicalCase();return;}
    if(action==='surv-intro'){survivalIntro();return;}
    if(action==='surv-start'){startSurvival();return;}
    if(action==='surv-next'){nextSurvival();return;}
    if(action==='surv-finish'){finishSurvival();return;}
    if(action.startsWith('surv-sub:')){survivalSubject=action.slice(9);survivalIntro();return;}
    if(action==='mem-levels'){memoryLevels();return;}
    if(action.startsWith('mem-start:')){startMemory(action.slice(10));return;}
    if(action==='pw-fifty'){useAdventurePowerup('fifty');return;}
    if(action==='pw-shield'){useAdventurePowerup('shield');return;}
    if(action==='pw-heal'){useAdventurePowerup('heal');return;}
    if(action==='spw-fifty'){useSurvivalPowerup('fifty');return;}
    if(action==='spw-time'){useSurvivalPowerup('time');return;}
    if(action==='spw-heal'){useSurvivalPowerup('heal');return;}
    if(action==='an-hint'){anatomyHint();return;}
    if(action==='mode:normal'||action==='mode:timer'){adventureMode=action.slice(5);adventureMap();return;}
    if(action.startsWith('diff:')){adventureDifficulty=action.slice(5);adventureMap();return;}
    if(action==='av-next'){nextAdventure();return;}
    if(action==='campus-progress'){window.location.href='index.html#progreso';return;}
    if(action.startsWith('av-retry:')){startAdventure(action.slice(9));return;}
    if(action.startsWith('an-start:')){startAnatomy(action.slice(9));return;}
    if(action.startsWith('an-retry:')){startAnatomy(action.slice(9));return;}
  }

  let organDrag=null;
  document.addEventListener('pointerdown',event=>{
    const token=event.target.closest('[data-organ-drag]');
    if(!token||!anatomy||event.button>0)return;
    const id=token.dataset.organDrag;
    if(anatomy.order[anatomy.index]?.id!==id)return;
    event.preventDefault();
    const ghost=document.createElement('div');ghost.className='epic-drag-ghost';
    ghost.textContent=token.textContent.replace('↗ Arrastrar o tocar número','').trim();
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
    const cans=event.target.closest('[data-case-ans]');if(cans){answerClinicalCase(Number(cans.dataset.caseAns));return;}
    const sans=event.target.closest('[data-surv-answer]');if(sans){answerSurvival(Number(sans.dataset.survAnswer));return;}
    const mcard=event.target.closest('[data-mem-idx]');if(mcard){flipMemoryCard(Number(mcard.dataset.memIdx));return;}
    const spot=event.target.closest('[data-spot]');if(spot){selectAnatomySpot(spot.dataset.spot);return;}
    const stage=event.target.closest('[data-stage]');if(stage){startAdventure(stage.dataset.stage);return;}
    const action=event.target.closest('[data-action]');if(action){route(action.dataset.action);return;}
  });

  window.addEventListener('keydown',event=>{
    if(view==='av-playing'&&/^[1-4]$/.test(event.key)&&!/input|textarea|select/i.test(event.target.tagName)){
      const i=Number(event.key)-1;if(adventure&&adventure.answers[adventure.pos]===null)answerAdventure(adventure.answerOrders[adventure.pos][i]);
    }
    if(view==='surv-playing'&&/^[1-4]$/.test(event.key)&&!/input|textarea|select/i.test(event.target.tagName)){
      const i=Number(event.key)-1;if(survival&&survival.answered===null)answerSurvival(survival.currentOrder[i]);
    }
    if(view==='case-playing'&&/^[1-4]$/.test(event.key)&&!/input|textarea|select/i.test(event.target.tagName)){
      const i=Number(event.key)-1;if(clinical&&clinical.answered===null)answerClinicalCase(clinical.list[clinical.pos].order[i]);
    }
  });

  window.addEventListener('storage',event=>{if(event.key===PROFILE_KEY)refreshXp();});
  if('serviceWorker' in navigator && location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  if(bank.length<100 || catalog.length===0){show('<div class="panel"><h1>No se encontró el archivo de preguntas.</h1><p>Asegúrate de que preguntas.js esté en la misma carpeta que juegos.html.</p><a class="btn btn-gold" href="index.html">Volver al inicio</a></div>','error');return;}
  const page=location.hash.slice(1);
  if(page==='aventura')adventureMap();
  else if(page==='anatomia')anatomyLevels();
  else if(page==='guardia')startClinicalCases();
  else if(page==='supervivencia')survivalIntro();
  else if(page==='memoria')memoryLevels();
  else home();
})();
