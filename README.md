# MEDYTE ACADEMY — EDICIÓN ÉPICA

Web educativa estática, lista para GitHub Pages, con **1.000 preguntas**, **cinco materias**, **52 temas** y dos minijuegos. Conserva el logo original y el sistema local de progreso de las versiones anteriores.

## Qué trae esta edición

**Campus:** simulacros, prácticas, reto rápido, reto diario, consulta de preguntas, favoritas, repaso de errores, análisis de resultados y guardado de un intento incompleto.

**Aventura del Conocimiento:** mapa de seis mundos (Biología, Química, Física, Matemáticas, Lenguaje y reto final), desbloqueos por puntuación, estrellas, tres corazones por etapa, modo contrarreloj (20 segundos por pregunta), combos de respuestas y cofres de primera victoria.

**Anatomía Challenge:** tres niveles anatómicos, silueta interactiva esquemática, identificación tocando marcadores o arrastrando la tarjeta del órgano, dos pistas por nivel, combo de precisión y bono de primera finalización.

**Gamificación general:** intro animada (se muestra una vez), rangos, seis insignias, tres misiones diarias con recompensas XP, celebraciones visuales y efectos de sonido **desactivados por defecto**. El botón de sonido permite encenderlos o apagarlos.

**PWA:** manifiesto, iconos y caché sin conexión después de que el navegador haya instalado el trabajador de servicio y descargado los archivos.

## Para probarla en tu computadora

1. Descomprime el ZIP.
2. Abre `index.html` en Chrome o Edge.
3. Selecciona **MEDYTE GAMES** para entrar a los minijuegos.

No es necesario instalar XAMPP para esta edición. Algunas funciones avanzadas de instalación y almacenamiento sin conexión requieren servir el sitio por HTTPS (por ejemplo, GitHub Pages).

## Para subirla a GitHub Pages

1. Abre tu repositorio `medyte-academy` en GitHub.
2. En **Code**, entra en **Add file → Upload files**.
3. Selecciona **los archivos que están dentro de esta carpeta**, sin subir la carpeta principal como subcarpeta. `index.html` debe estar en la raíz del repositorio.
4. Reemplaza los archivos con el mismo nombre, añade los nuevos (`epico.js`, `epico.css`) y pulsa **Commit changes**.
5. En **Settings → Pages**, elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`, **Save**.
6. Abre el enlace público cuando GitHub Pages indique que la página está publicada. Si sigues viendo la versión anterior, haz una recarga forzada (Ctrl+F5).

**Importante:** si publicaste una versión anterior, los archivos nuevos deben sustituirla. No elimines `preguntas.js`, `logo.jpg`, `app.js` ni `juegos.js`.

## Dónde se guardan los datos

Esta edición **no incluye PHP, MySQL ni cuentas reales**. El XP, las respuestas, las partidas y las recompensas se guardan exclusivamente en el almacenamiento local del navegador (`localStorage`). No existe una tabla de posiciones global, acceso de administrador en línea ni sincronización automática entre celulares.

Las claves de almacenamiento de las versiones previas se mantienen (`medyte_demo_estatica_v1` y `medyte_games_v1`) para conservar el progreso **en el mismo navegador y dominio**. Es recomendable usar la función **Exportar mi progreso** antes de hacer cambios importantes o borrar datos del navegador.

## Archivos principales

- `index.html`: campus principal.
- `estilos.css`, `app.js`: estilos y lógica del campus.
- `juegos.html`, `juegos.css`, `juegos.js`: dos minijuegos.
- `epico.css`, `epico.js`: animaciones, rangos, insignias, misiones y sonido.
- `preguntas.js`: el banco de 1.000 preguntas.
- `logo.jpg`, `icon-192.png`, `icon-512.png`: identidad visual.
- `manifest.webmanifest`, `sw.js`: instalación y caché para PWA.
- `.nojekyll`: compatibilidad con GitHub Pages.

## Consideraciones

La silueta de Anatomía Challenge es una representación didáctica simplificada, **no un atlas anatómico a escala**. Las preguntas son actividades de práctica originales y no equivalen a un examen oficial de admisión. MEDYTE ACADEMY es un proyecto educativo independiente, sin afiliación oficial a la UMSA.

© 2026 MEDYTE ACADEMY
