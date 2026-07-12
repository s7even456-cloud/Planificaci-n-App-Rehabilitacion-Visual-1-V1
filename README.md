# Plataforma de Ejercicios de Rehabilitación Visual (v4.2)

Plataforma **modular y multiusuario** de ejercicios de exploración y atención
visual, pensada para rehabilitación del campo visual (p. ej. hemianopsia) bajo
indicación de un profesional. **No constituye una herramienta diagnóstica** ni
sustituye una evaluación profesional.

Se entrega como **un único archivo `index.html` autocontenido** (HTML + CSS +
JavaScript, sin dependencias): basta con descargarlo y abrirlo en Chrome en PC,
tablet o smartphone. Todos los datos permanecen **localmente en el dispositivo**.

## Flujo de uso

1. Al abrir, aparece el **selector de perfiles**: crea un perfil (nombre y
   apellidos) o selecciona uno existente. Sin perfil activo no se puede entrar
   a ningún ejercicio.
2. Tras seleccionar perfil se accede al **menú de bloques**, con una vista
   general (sesiones por bloque, última actividad, tiempo total de uso).
3. Elige **Bloque 1** o **Bloque 2**, configura y realiza la sesión.
4. Consulta el **dashboard y el historial de cada bloque** (siempre separados
   por bloque y por perfil), exporta o importa copias de seguridad.

## Bloque 1 — Estímulos y gomets

El ejercicio original completo, sin cambios de comportamiento: fijación
central (cruz/punto), estímulos periféricos uno a uno sin solaparse, marcado
digital por clic/toque, cuenta atrás, aparición aleatoria anti-anticipación,
franja perimetral «No la veo», puntuación automática con tolerancia ajustable
y corrección manual, hemicampos, mapas de fallos (sesión/acumulado), gráfico
de evolución, CSV, pantalla completa, Wake Lock, sonido y vibración.

## Bloque 2 — Letras

Punto de fijación **circular** central (alto contraste, tamaño configurable,
con zona de exclusión) y letras del alfabeto español (Ñ opcional) distribuidas
sin solaparse, con **tamaño progresivo según la distancia al centro**
(`tamaño = mín + factorRadial^intensidad × (máx − mín)`, todo configurable).

- **Modalidad A — Localizar letra**: la app pronuncia una letra (voz española
  de `speechSynthesis`, con velocidad/volumen ajustables y alternativa escrita
  si no hay voz); el usuario la localiza y selecciona. Se registran aciertos,
  errores previos, omisiones, tiempos, posiciones normalizadas y repeticiones
  de audio. Botón «Repetir» y «No la encuentro».
- **Modalidad B — Formar palabra**: pronuncia una palabra corta (banco en
  español, longitud configurable, Ñ conservada, tildes normalizadas) y el
  usuario selecciona sus letras en orden; las letras repetidas se pulsan
  varias veces. Reiniciar palabra, repetir audio, saltar (queda registrada
  como incompleta), pausa y reanudación.
- Controles de sesión: repetir, pausar/reanudar, saltar, finalizar (con
  confirmación; la sesión queda «completada» o «interrumpida» conservando los
  intentos). Pantalla completa, Wake Lock, sonido/vibración, cuenta atrás.
- **Dashboard del Bloque 2** (misma estructura visual que el Bloque 1):
  precisión, aciertos, errores, omisiones/incompletas, tiempos (por objetivo,
  por palabra, por letra, hasta la primera selección), hemicampos izq/der y
  sup/inf, duración, repeticiones de audio; **estadísticas por letra** con
  confusiones más frecuentes; **mapa de errores por sesión y acumulado**
  (coordenadas normalizadas) y **gráfico de evolución del tiempo medio**
  filtrado por modalidad — solo con sesiones del Bloque 2.

## Perfiles y datos

- Perfiles locales con id único, fecha de creación, última sesión y contador
  de sesiones; editar y eliminar (con doble confirmación e indicación de que
  se borran sus sesiones).
- **Separación estricta**: cada sesión lleva `profileId` y `blockId`
  (`block1`/`block2`; modalidades `letter-search`/`word-sequence`). Ningún
  gráfico, mapa o promedio mezcla bloques ni usuarios.
- **Persistencia**: localStorage con esquema versionado
  (`rvp_profiles_v1`, `rvp_sessions_v1`, `rvp_configs_v1`); guardado
  automático, control de errores de almacenamiento y configuraciones
  recordadas **por perfil y por bloque**.
- **Migración automática**: las sesiones de versiones anteriores se conservan
  y se ofrecen para asignarlas a un perfil al seleccionarlo; la clave antigua
  se mantiene como copia de seguridad.
- **Exportar**: perfil completo (JSON versionado), CSV por bloque, sesión
  individual (JSON) desde su detalle. **Importar**: JSON de perfil (con
  resumen previo, combinación sin duplicados o perfil nuevo) y formato antiguo.

## Estructura interna (un solo archivo)

StorageManager (localStorage versionado) · ProfileManager · Navigation/showScreen
con guardia de perfil · Block1Controller (código original intacto; su acceso a
datos es una vista filtrada por perfil+bloque) · Block2Controller (layout radial,
modalidades, registro) · SpeechManager · componentes compartidos: tarjetas,
`fillHeatmap`, `wireHeatToggle`, `drawTimeChart`, `fitCanvas`, tonos, vibración,
Wake Lock, pantalla completa, cuenta atrás · Export/ImportManager.

## Privacidad

Los datos se almacenan localmente en este dispositivo; no se envía nada a
servidores. Realiza copias de seguridad periódicas mediante la función Exportar.

## Limitaciones conocidas

- Persistencia en localStorage (no IndexedDB): decisión deliberada por
  robustez en un solo archivo y volumen de datos pequeño; el esquema está
  versionado y las copias JSON cubren el respaldo.
- Exportación XLSX y PDF no incluidas (JSON + CSV disponibles).
- La voz depende de las voces instaladas en el dispositivo; sin ellas, la
  instrucción se muestra por escrito.
- Sectores de análisis: hemicampos y cuadrantes (no anillos radiales).
