# App de Rehabilitación Visual (v3.0)

Aplicación de escritorio (web) para un ejercicio de **rehabilitación visual**:
fijas la mirada en una figura central y, cuando percibes un estímulo en la
periferia, lo **marcas digitalmente** (con clic en PC o tocando en pantallas
táctiles). La app coloca un círculo (gomet digital) y **puntúa automáticamente**
acierto/fallo según la distancia entre tu marca y el estímulo. Registra tu
evolución sesión a sesión.

Está construida con HTML, CSS y JavaScript puro (sin dependencias ni paso de
compilación) y se entrega como **un único archivo `index.html` autocontenido**
(el CSS y el JavaScript van incrustados), por lo que basta con descargar ese
archivo y abrirlo: funciona en cualquier navegador de PC, tablet o smartphone.
El diseño es **totalmente responsivo**: todo se dimensiona de forma proporcional
a la pantalla, así que se adapta a cualquier resolución (1920×1080, 1366×768,
4K, ultrawide, móvil, etc.) sin píxeles fijos.

## Cómo usarla

1. Abre `index.html` en el navegador (doble clic, o sírvela con un servidor
   estático). Para el ejercicio, ponlo en **pantalla completa** (F11 en PC).
2. Configura la sesión y pulsa **Comenzar sesión**.
3. Fija la mirada en la figura central. Aparecerá un estímulo cada vez.
4. **Márcalo** donde lo percibas:
   - **PC / ratón:** mueve el cursor (se dibuja como un aro) y haz **clic**.
   - **Táctil:** **toca** la pantalla con el dedo en esa posición.
   Aparecerá tu gomet y pasarás automáticamente al siguiente estímulo.
   Tras tu marca, la X y tu gomet permanecen visibles un **tiempo configurable**
   (para ver el resultado y **retirar la mano**) y luego desaparecen para dar
   paso a la siguiente: las marcas **no se acumulan**, así siempre distingues
   la nueva.
5. Si **no percibes** el estímulo, espera unos segundos: aparecerá una **franja
   “No la veo”** alrededor de todo el borde de la pantalla. Actívala con
   **doble clic / doble toque** en cualquier punto de ella para saltar.
6. Al terminar verás el **dashboard de la sesión** (puntuación automática). Puedes
   **corregir** cualquier juicio tocando su marca, y pulsar **Guardar resultados**.
7. Consulta tu **Historial y evolución**; selecciona cualquier fecha para abrir
   de nuevo el **dashboard completo de esa prueba** y comparar tu progreso. Puedes
   **borrar una sesión concreta** (🗑) o todo el historial.

Atajo durante el ejercicio: `Esc` sale.

## Funcionalidades

- **Distancia de uso recomendada**
  - Según el tamaño de pantalla detectado (ajustable), recomienda la distancia
    óptima ojo–pantalla: la mínima prudente que no fatiga la vista y a la vez
    abarca el mayor campo visual posible. Muestra el campo visual estimado (°).
- **Configuración por sesión**
  - Número de estímulos (1–60).
  - Forma del estímulo: **equis (✕)** o **círculo de control**, con tamaño regulable.
  - Figura central de fijación: **cruz** o **punto**, con tamaño regulable.
  - **Colores independientes** (espectro completo) para: figura central,
    estímulo, gomet (tu marca) y cursor.
  - **Modo de interacción**: automático (detecta el dispositivo), PC o táctil.
  - **Exigencia de precisión** ajustable: define cuánto margen entre tu marca y
    el estímulo cuenta como acierto.
  - **Tiempo de visualización** tras marcar (cuánto siguen visibles la X y el
    gomet antes de pasar al siguiente).
  - Tiempo tras el cual aparece la franja **“No la veo”**.
- **Ejercicio**
  - **Cuenta atrás 3-2-1** antes del primer estímulo, para fijar la mirada.
  - **Aparición aleatoria** del estímulo (retardo configurable): evita
    respuestas rítmicas por anticipación; los toques durante la espera se
    ignoran.
  - **Pantalla siempre encendida** durante la prueba (Wake Lock) y **aviso al
    salir** de la página con un ejercicio en curso.
  - **Vibración de feedback** en móviles compatibles (activable).
  - Se ejecuta a **pantalla completa** y el lienzo se ajusta al área realmente
    visible, de modo que ningún estímulo queda fuera de pantalla.
  - **Orientación**: en móvil/tablet, si configuras en vertical, al empezar te
    pide **girar a horizontal**; los estímulos se generan y puntúan en la
    orientación real de uso, y la orientación se **fija** durante la prueba para
    que un giro no altere los resultados.
  - Estímulos uno a uno, en posiciones aleatorias **sin solaparse** entre sí ni
    invadir la zona central, y siempre dentro del área útil (no bajo la franja).
  - **Sin acumulación**: tras marcar, la X y el gomet se muestran un tiempo
    configurable y luego desaparecen, de modo que la nueva marca siempre se
    distingue y te da tiempo a retirar la mano sin taparla.
  - En PC, el **cursor** se dibuja como un aro semitransparente del tamaño del
    gomet; el gomet colocado es un círculo relleno y opaco.
  - Franja **“No la veo”** alrededor de todo el borde de la pantalla, con el
    mensaje en los cuatro lados (para que, sea cual sea la zona afectada del
    usuario, siempre quede accesible y visible), con activación por **doble
    clic / doble toque** para evitar pulsaciones por error.
  - Fondo claro y suave para no fatigar la vista.
  - **Señal acústica** de feedback inmediato (acierto / fallo) vía Web Audio API.
- **Puntuación automática**
  - La app compara tu marca con la posición real del estímulo y decide
    acierto/fallo según la tolerancia configurada.
  - Métricas por sesión: precisión, aciertos, no vistos, **error medio**
    (en radios del estímulo), **tiempo medio** de respuesta, **sesgo
    direccional** del error, **duración** y **precisión por hemicampos**
    (izquierdo/derecho y superior/inferior, resaltando en rojo el lado más
    débil — clave para ver la zona afectada del campo visual).
  - Puedes corregir manualmente cualquier juicio en el dashboard.
- **Registro y evolución**
  - Cada sesión se guarda localmente (`localStorage`).
  - Gráfico de evolución de la precisión y estadísticas globales.
  - **Mapa de calor de fallos** por zonas, **seleccionable** entre *acumulado*
    (todas las sesiones) y la *sesión* concreta. En el resultado de cada sesión
    puedes ver su propio mapa o el acumulado.
  - **Histórico de dashboards**: cada fecha es seleccionable y reabre el
    dashboard completo de esa prueba concreta, mostrando además un **gráfico de
    evolución del tiempo medio de respuesta** (desde la primera sesión hasta la
    seleccionada) y **dos mapas de fallos**: el de esa sesión y el **acumulado
    hasta esa sesión**.
  - **Borrado selectivo**: elimina una sesión concreta (🗑) o todo el historial.
  - **Exportar** el historial a **JSON** (copia de seguridad) o a **CSV**
    (una fila por estímulo, listo para Excel/Calc en español).
  - **Importar** un JSON exportado: fusiona sin duplicar (para restaurar una
    copia o mover los datos a otro dispositivo).
  - Los gráficos numeran las sesiones en el eje X.
  - **La configuración se recuerda** entre usos (número de estímulos, colores,
    tiempos, etc.).
- **Refuerzo adaptativo** (opcional): las próximas sesiones aumentan la
  frecuencia de estímulos en las zonas donde más se falla.
- **Supervisión por cámara** (opcional): vista previa de webcam durante el
  ejercicio. *El análisis automático por IA queda planteado como mejora futura.*

## Estructura

| Archivo | Descripción |
|---|---|
| `index.html` | **Archivo único autocontenido**: pantallas, estilos y lógica (CSS y JS incrustados). Es lo único que necesitas para usar la app. |

## Privacidad

Todos los datos (resultados de sesiones) se guardan **solo en tu navegador**
mediante `localStorage`. No se envía nada a ningún servidor. La cámara, si la
activas, se usa únicamente para la vista previa local.

## Hoja de ruta

- Análisis automático por IA (visión por cámara) para validar la postura y la
  fijación de la mirada y sincronizarlo con la aparición de los estímulos.
- Modos de retroalimentación visual adicionales.
- Exportación de informes en PDF.
