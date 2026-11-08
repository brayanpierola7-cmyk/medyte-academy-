# MEDYTE ACADEMY — versión web

Página de estudio para practicar preguntas de distintas materias, hacer
simulacros y jugar. Funciona como sitio estático en GitHub Pages y no requiere
XAMPP.

## Qué puedes hacer

- Elegir una materia, un tema y la cantidad de preguntas.
- Practicar con los niveles **fácil, normal y difícil**. Las etiquetas de
  dificultad se generaron automáticamente y son orientativas; no han sido
  verificadas por un docente.
- Resolver simulacros con cronómetro, marcar preguntas para revisar y
  consultar los resultados por materia. También hay un simulacro de práctica
  de 100 preguntas repartidas entre cinco materias; **no es oficial de la UMSA**.
- Revisar respuestas incorrectas, guardar preguntas favoritas y escribir apuntes.
- Estudiar con tarjetas de repaso.
- Jugar Aventura del Conocimiento, Anatomía Challenge, Duelo de Supervivencia
  y Memoria Médica.
- Acumular XP, ver trofeos y elegir avatares.

## Dónde se guardan los datos

El progreso, los perfiles locales y los resultados quedan en el navegador
donde se utiliza la página. No hay registro de usuarios en un servidor ni
sincronización automática entre dispositivos. Para pasar los datos de un
celular a otro, usa la opción de exportar/importar progreso en JSON.

## Publicar en GitHub Pages

1. Extrae el contenido del ZIP.
2. Abre el repositorio de GitHub que aloja MEDYTE ACADEMY.
3. En **Agregar archivo → Cargar archivos**, selecciona los archivos
   descomprimidos. No subas el ZIP en lugar de los archivos.
4. Comprueba que `index.html` esté en la raíz del repositorio.
5. Confirma los cambios y revisa el despliegue en **Actions**.

Si ves una versión anterior, recarga la página con `Ctrl+Shift+R`. El archivo
`sw.js` tiene una nueva versión de caché para esta actualización.

## Archivos principales

| Archivo | Para qué sirve |
|---|---|
| `index.html`, `estilos.css`, `app.js` | Página principal y cuestionarios |
| `preguntas.js` | Banco de preguntas (sin modificaciones de contenido) |
| `dificultad.js` | Niveles orientativos por pregunta |
| `juegos.html`, `juegos.css`, `juegos.js` | Cinco minijuegos |
| `epico.js`, `epico.css` | Efectos, sonidos opcionales, XP y misiones |
| `manifest.webmanifest`, `sw.js`, iconos | Instalación como web app y caché |

**Nota:** MEDYTE ACADEMY es una plataforma de práctica independiente.
No está afiliada a la UMSA y sus simulacros no son exámenes oficiales.
