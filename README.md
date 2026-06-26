# App de Rehabilitación Visual

Aplicación de escritorio (web) para un ejercicio de **rehabilitación visual**:
fijas la mirada en una figura central y, cuando percibes un estímulo en la
periferia, lo **marcas digitalmente** (con clic en PC o tocando en pantallas
táctiles). La app coloca un círculo (gomet digital) y **puntúa automáticamente**
acierto/fallo según la distancia entre tu marca y el estímulo. Registra tu
evolución sesión a sesión.

Está construida con HTML, CSS y JavaScript puro (sin dependencias ni paso de
compilación), por lo que funciona en cualquier navegador de PC, tablet o
smartphone. El diseño es **totalmente responsivo**: todo se dimensiona de forma
proporcional a la pantalla, así que se adapta a cualquier resolución
(1920×1080, 1366×768, 4K, ultrawide, móvil, etc.) sin píxeles fijos.

## Cómo usarla

1. Abre `index.html` en el navegador (doble clic, o sírvela con un servidor
   estático). Para el ejercicio, ponlo en **pantalla completa** (F11 en PC).
2. Configura la sesión y pulsa **Comenzar sesión**.
3. Fija la mirada en la figura central. Aparecerá un estímulo cada vez.
4. **Márcalo** donde lo percibas:
   - **PC / ratón:** mueve el cursor (se dibuja como un aro) y haz **clic**.
   - **Táctil:** **toca** la pantalla con el dedo en esa posición.
   Aparecerá tu gomet y pasarás automáticamente al siguiente estímulo.
5. Si **no percibes** el estímulo, espera unos segundos: aparecerán varios
   botones **“No la veo”** repartidos por el **perímetro** de la pantalla.
   Activa el que veas con **doble clic / doble toque** para saltar ese estímulo.
6. Al terminar verás el **dashboard de la sesión** (puntuación automática). Puedes
   **corregir** cualquier juicio tocando su marca, y pulsar **Guardar resultados**.
7. Consulta tu **Historial y evolución**; selecciona cualquier fecha para abrir
   de nuevo el **dashboard completo de esa prueba** y comparar tu progreso.

Atajo durante el ejercicio: `Esc` sale.

## Funcionalidades

- **Configuración por sesión**
  - Número de estímulos (1–60).
  - Forma del estímulo: **equis (✕)** o **círculo de control**, con tamaño regulable.
  - Figura central de fijación: **cruz** o **punto**, con tamaño regulable.
  - **Colores independientes** (espectro completo) para: figura central,
    estímulo, gomet (tu marca) y cursor.
  - **Modo de interacción**: automático (detecta el dispositivo), PC o táctil.
  - **Exigencia de precisión** ajustable: define cuánto margen entre tu marca y
    el estímulo cuenta como acierto.
  - Tiempo tras el cual aparecen los botones **“No la veo”**.
- **Ejercicio**
  - Estímulos uno a uno, en posiciones aleatorias **sin solaparse** entre sí ni
    invadir la zona central.
  - Tanto los **estímulos** como los **gomets** colocados **permanecen fijos**
    hasta el final de la prueba (se van acumulando en pantalla).
  - En PC, el **cursor** se dibuja como un aro semitransparente del tamaño del
    gomet; el gomet colocado es un círculo relleno y opaco.
  - Botones **“No la veo”** simultáneos en el **perímetro** (para que, sea cual
    sea la zona afectada del usuario, al menos uno sea visible), con activación
    por **doble clic / doble toque** para evitar pulsaciones por error.
  - Fondo claro y suave para no fatigar la vista.
  - **Señal acústica** de feedback inmediato (acierto / fallo) vía Web Audio API.
- **Puntuación automática**
  - La app compara tu marca con la posición real del estímulo y decide
    acierto/fallo según la tolerancia configurada.
  - Métricas por sesión: precisión, aciertos, no vistos, **error medio**
    (en radios del estímulo), **tiempo medio** de respuesta y **sesgo
    direccional** del error.
  - Puedes corregir manualmente cualquier juicio en el dashboard.
- **Registro y evolución**
  - Cada sesión se guarda localmente (`localStorage`).
  - Gráfico de evolución de la precisión y estadísticas globales.
  - **Mapa de calor de fallos** acumulados por zonas de la pantalla.
  - **Histórico de dashboards**: cada fecha es seleccionable y reabre el
    dashboard completo de esa prueba concreta.
  - Exportar el historial a JSON / borrarlo.
- **Refuerzo adaptativo** (opcional): las próximas sesiones aumentan la
  frecuencia de estímulos en las zonas donde más se falla.
- **Supervisión por cámara** (opcional): vista previa de webcam durante el
  ejercicio. *El análisis automático por IA queda planteado como mejora futura.*

## Estructura

| Archivo | Descripción |
|---|---|
| `index.html` | Pantallas: configuración, ejercicio, resultado, historial y detalle. |
| `styles.css` | Estilos responsivos; fondo suave; figuras, gomets, cursor y dashboards. |
| `app.js` | Lógica: posiciones, marcado clic/táctil, puntuación, audio, historial y gráficos. |

## Privacidad

Todos los datos (resultados de sesiones) se guardan **solo en tu navegador**
mediante `localStorage`. No se envía nada a ningún servidor. La cámara, si la
activas, se usa únicamente para la vista previa local.

## Hoja de ruta

- Análisis automático por IA (visión por cámara) para validar la postura y la
  fijación de la mirada y sincronizarlo con la aparición de los estímulos.
- Modos de retroalimentación visual adicionales.
- Exportación de informes en PDF.
