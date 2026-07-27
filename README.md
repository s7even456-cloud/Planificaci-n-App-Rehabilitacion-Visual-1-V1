# Plataforma de Ejercicios de Rehabilitación Visual (v5.3)

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

Desde la v5.3 se puede acotar además el **área radial de aparición**: dos
controles fijan el anillo de trabajo desde el centro (0 %) hasta la periferia
(100 %), para entrenar de forma selectiva una franja del campo visual. Se
conserva siempre una anchura mínima del 15 % del radio, de modo que quepan
todos los estímulos configurados.

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
- **Modalidad C — Decir la letra en voz alta (micrófono)**: aparece una única
  letra cada vez, en una posición aleatoria y con **tamaño y tiempos
  configurables** (tiempo visible de la letra y tiempo máximo de respuesta,
  0 = sin límite), manteniendo una **cruz de fijación** en el centro. La app
  pide permiso de micrófono y escucha la respuesta mediante reconocimiento de
  voz: marca la letra en **verde** si es correcta y en **rojo** si no, con
  señal acústica y vibración, y avanza a la siguiente **siempre que haya
  respuesta**, se acierte o no. Si no se agota el tiempo, se registra como
  «sin respuesta». Los homófonos del español (b/v) se resuelven a favor del
  usuario. Si el navegador no reconoce voz o se deniega el micrófono, se
  puede responder pulsando la letra en el teclado. Su dashboard e historial
  recogen precisión, aciertos, errores (con la letra dicha en la columna de
  confusiones), sin respuesta, tiempo medio, hemicampos y mapa de errores.
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

## Idiomas (v5.2)

- Selector de idioma con banderas, búsqueda y memoria en todas las pantallas
  (excepto durante los ejercicios). 41 idiomas disponibles.
- **11 idiomas con traducción completa** (interfaz, formularios de
  configuración, panel de distancia recomendada, estadísticas): Español
  (por defecto), Català, Valencià, Galego, Euskera, English, Português,
  Italiano, Français, Deutsch, Русский.
- **30 idiomas adicionales** con el núcleo de la interfaz traducido (menús,
  botones principales, pausa/reanudar/finalizar…); el resto de textos cae a
  inglés. Marcados como «parcial» en el selector.
- **Contenido del ejercicio del Bloque 2 adaptado a cada escritura**, no solo
  traducido: hanzi de trazos simples (chino), kana (japonés), sílabas hangul
  (coreano), alfabetos árabe/hebreo/persa/urdu (con dirección RTL en la
  interfaz), devanagari (hindi), bengalí, tailandés (palabras sin marcas
  vocálicas), griego, cirílico (ruso/ucraniano/búlgaro/serbio) y bancos de
  palabras nativas sin tildes para los idiomas de alfabeto latino. La voz
  (`speechSynthesis`) usa el código de idioma correspondiente si el
  dispositivo dispone de esa voz.

## Corrección de resultados (v5.3)

Se detectaron y corrigieron varios errores que falseaban los datos de la
modalidad **Formar palabra**:

- La **precisión** se calculaba comparando solo las pulsaciones correctas
  entre sí, así que una sesión sin ninguna palabra terminada podía mostrar
  **100 %**. Ahora es *letras localizadas / letras pedidas*, penalizando
  además cada selección errónea, y se añade la tarjeta «Letras localizadas».
- La **tabla por letra** no contaba los aciertos ni los tiempos (mostraba 0
  aciertos aunque se acertara todo).
- El **mapa de errores** quedaba vacío: no se guardaba la posición de la
  letra que no se llegó a localizar, ni los toques que no alcanzaban ninguna
  letra. Ambos se registran ya y alimentan también los hemicampos.
- La **zona pulsable** de las letras periféricas (con su relleno) invadía unos
  píxeles la banda perimetral, que se comprobaba antes: la pulsación se perdía
  y el segundo intento se interpretaba como doble toque, saltando la palabra
  entera. La letra tiene ahora prioridad sobre la banda.
- Un objetivo a medias al pulsar «Finalizar» se descartaba; ahora se guarda
  como incompleto.
- Un motor de voz presente pero **sin voces instaladas** dejaba al usuario sin
  instrucción; ahora se detecta y se muestra la palabra o letra por escrito.

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
