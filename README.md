# App de Rehabilitación Visual

Aplicación de escritorio (web) para un ejercicio de **rehabilitación visual**:
fijas la mirada en una figura central mientras aparecen estímulos en la periferia,
los cubres físicamente con un *gomet* y registras tu evolución sesión a sesión.

Está construida con HTML, CSS y JavaScript puro (sin dependencias ni paso de
compilación), por lo que funciona en cualquier navegador de PC y se puede
visualizar también en el smartphone como referencia. El diseño es **totalmente
responsivo**: todo se dimensiona de forma proporcional a la pantalla, así que se
adapta a cualquier resolución (1920×1080, 1366×768, 4K, ultrawide, etc.) sin
píxeles fijos.

## Cómo usarla

1. Abre `index.html` en el navegador (doble clic, o sírvela con un servidor
   estático). Para el ejercicio, pon el navegador en **pantalla completa** (F11).
2. Configura la sesión y pulsa **Comenzar sesión**.
3. Fija la mirada en la figura central. Aparecerá un estímulo cada vez.
4. Cúbrelo con el gomet y pulsa **Barra espaciadora** para pasar al siguiente.
5. Al terminar, en la pantalla de **Revisión** marca cada estímulo como
   *acierto* o *fallo* (toca el punto para alternar) y pulsa **Guardar resultados**.
6. Consulta tu **Historial y evolución** cuando quieras.

Atajos durante el ejercicio: `Espacio` avanza · `Esc` sale.

## Funcionalidades

- **Configuración por sesión**
  - Número de estímulos (1–60).
  - Tipo de estímulo: equis roja, punto rojo o punto negro.
  - Tamaño del estímulo.
  - Figura central: cruz negra o punto negro, con tamaño regulable.
- **Ejercicio**
  - Estímulos uno a uno, en posiciones aleatorias **sin solaparse** entre sí ni
    invadir la zona central.
  - Avance con barra espaciadora.
  - Fondo claro y suave para no fatigar la vista.
  - **Señal acústica** de feedback (acierto / fallo / avance) vía Web Audio API.
- **Registro y evolución**
  - Cada sesión se guarda localmente (`localStorage`).
  - Gráfico de evolución de la precisión, estadísticas y listado de sesiones.
  - **Mapa de calor de fallos** acumulados por zonas de la pantalla.
  - Exportar el historial a JSON / borrarlo.
- **Refuerzo adaptativo** (opcional): las próximas sesiones aumentan la
  frecuencia de estímulos en las zonas donde más se falla.
- **Supervisión por cámara** (opcional): vista previa de webcam durante el
  ejercicio. *El análisis automático por IA queda planteado como mejora futura.*

## Estructura

| Archivo | Descripción |
|---|---|
| `index.html` | Estructura de las pantallas (config, ejercicio, revisión, historial). |
| `styles.css` | Estilos responsivos; fondo suave; figuras central y estímulos. |
| `app.js` | Lógica: generación de posiciones, ejercicio, audio, registro y gráficos. |

## Privacidad

Todos los datos (resultados de sesiones) se guardan **solo en tu navegador**
mediante `localStorage`. No se envía nada a ningún servidor. La cámara, si la
activas, se usa únicamente para la vista previa local.

## Hoja de ruta

- Análisis automático por IA (visión por cámara) para validar aciertos/errores
  sin revisión manual y sincronizarlos con la aparición de los estímulos.
- Detección de respuesta por toque/clic además del gomet físico.
- Modo de retroalimentación visual adicional.
