---
name: BuffetYa!
description: El estándar de la categoría order-ahead, ejecutado a fondo en el lenguaje digital de la UNLaM — verde sobre blanco cálido.
colors:
  brand: "#347659"
  brand-deep: "#285b45"
  brand-bright: "#0f9977"
  brand-wash: "#eef4f1"
  brand-line: "#c5dbd0"
  brand-ink: "#1f4a37"
  on-brand: "#ffffff"
  on-brand-2: "#cfe3d9"
  ready: "#0b7a5e"
  ready-bright: "#31b069"
  ready-wash: "#e7f6f1"
  ready-line: "#a9dcce"
  on-ready: "#ffffff"
  on-ready-2: "#eaf7f2"
  amber: "#c2410c"
  amber-wash: "#ffedd5"
  amber-line: "#fed7aa"
  amber-ink: "#7c2d12"
  cyan: "#0e6a7d"
  cyan-wash: "#e2f3f7"
  cyan-line: "#a8d7e2"
  alert: "#ae152d"
  alert-deep: "#8f1024"
  alert-wash: "#fdeef1"
  alert-line: "#f0c2cb"
  alert-ink: "#7a1122"
  forest: "#022410"
  on-forest-2: "#9dbfae"
  scrim: "rgba(0, 0, 0, .2)"
  ink: "#1c1917"
  ink-2: "#292524"
  muted: "#57534e"
  faint: "#78716c"
  line: "#e7e5e4"
  line-2: "#d6d3d1"
  surface: "#ffffff"
  surface-2: "#fafaf9"
  ground: "#f5f5f4"
  ground-outer: "#e7e5e4"
  disabled-ink: "#79716b"
  hatch-a: "#eeecea"
  hatch-b: "#e6e3e0"
typography:
  code:
    fontFamily: "Open Sans, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "0.12em"
    fontFeature: "tabular-nums"
  display:
    fontFamily: "Open Sans, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.22
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Open Sans, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "1.9375rem"
    fontWeight: 700
    lineHeight: 1.22
    letterSpacing: "-0.028em"
  title:
    fontFamily: "Open Sans, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.22
    letterSpacing: "-0.02em"
  subtitle:
    fontFamily: "Open Sans, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.22
    letterSpacing: "-0.015em"
  lead:
    fontFamily: "Open Sans, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Open Sans, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
    fontFeature: "tabular-nums"
  small:
    fontFamily: "Open Sans, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  caption:
    fontFamily: "Open Sans, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Open Sans, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.12em"
  nano:
    fontFamily: "Open Sans, Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: "0.5625rem"
    fontWeight: 800
    lineHeight: 1.4
    letterSpacing: "0.1em"
rounded:
  r-sm: "8px"
  r-md: "12px"
  r-lg: "16px"
  r-xl: "24px"
  r-pill: "999px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "20px"
  s6: "24px"
  s7: "32px"
  s8: "40px"
  s9: "48px"
  s10: "64px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.body}"
    rounded: "{rounded.r-md}"
    padding: "0 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.brand-deep}"
    textColor: "{colors.on-brand}"
  button-go:
    backgroundColor: "{colors.ready}"
    textColor: "{colors.on-ready}"
    typography: "{typography.body}"
    rounded: "{rounded.r-md}"
    padding: "0 20px"
    height: "48px"
  button-warn:
    backgroundColor: "{colors.amber}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.r-md}"
    padding: "0 20px"
    height: "48px"
  button-warn-hover:
    backgroundColor: "{colors.amber-ink}"
    textColor: "#ffffff"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.body}"
    rounded: "{rounded.r-md}"
    padding: "0 20px"
    height: "48px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.brand}"
    typography: "{typography.body}"
    rounded: "{rounded.r-md}"
    padding: "0 12px"
    height: "40px"
  button-disabled:
    backgroundColor: "{colors.line}"
    textColor: "{colors.disabled-ink}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.small}"
    rounded: "{rounded.r-pill}"
    padding: "0 16px"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-lg}"
    padding: "12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.r-md}"
    padding: "0 16px"
    height: "48px"
  appbar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.lead}"
    padding: "0 16px"
    height: "56px"
  cartbar:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.small}"
    rounded: "{rounded.r-md}"
    padding: "0 12px 0 16px"
    height: "52px"
  ticket:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-md}"
    padding: "12px 16px"
  operator-bar:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.on-brand}"
    typography: "{typography.subtitle}"
    padding: "16px 24px"
---

# Design System: BuffetYa!

## Overview

**Creative North Star: "El mostrador institucional"**

BuffetYa! toma el estándar de la categoría order-ahead y lo ejecuta a fondo, sin ironía y sin rarezas contrabandeadas. La convención es el compromiso: tarjetas blancas sobre suelo cálido, radios de 8-24px, elevación de desplazamiento más desenfoque, una barra de aplicación blanca y una barra de pestañas de cuatro destinos. Lo que hace propio al mundo no es una desviación formal sino la identidad, y esa identidad se muestreó de los productos digitales de la propia universidad: el lenguaje de la UNLaM es **verde sobre blanco cálido**, no bordó. El verde de acción `#347659` y el suelo `#f5f5f4` vienen de `cine.unlam.edu.ar`, el verde del estado listo `#0b7a5e` de MIEL, y la barra del panel del operador `#022410` de su encabezado.

La densidad está calibrada por escena, no por gusto. La app del estudiante se lee a la distancia del brazo, en un pasillo con luz fluorescente a las 18:30, caminando: por eso el modo claro no es un default de categoría sino una obligación del contexto, los objetivos táctiles no bajan de 44px y el sistema es de una sola mano, con un ancho máximo de 420px. El panel del operador es su opuesto deliberado: pantalla fija leída a un metro, manos ocupadas, tipografía mayor y densidad de información mayor, con una progresión de tres columnas que se sostiene hasta 760px antes de colapsar.

El sistema es callado por construcción y esa contención es estructural, no estética. La app es blanca casi en su totalidad, y eso es exactamente lo que hace legible el único momento en que el suelo se inunda de color: la llegada a READY en `pedido.html`, el único momento animado de todo el build. Todo lo demás transiciona en 140ms o 300ms sobre cambios de estado, y nunca aparece un segundo acento ni un segundo foco.

**Key Characteristics:**

- Verde institucional sobre blanco cálido; el bordó existe pero solo como alerta.
- Tres verdes con tres trabajos distintos: acción, estado listo y elemento gráfico.
- Chrome blanco con filete; jamás una banda de color macizo cruzando el tope.
- Neutros de piedra cálida (rampa stone), no una rampa fría de pizarra.
- Open Sans en todo el sistema, con `font-variant-numeric: tabular-nums` global.
- Radios 8/12/16/24px y píldoras de 999px; elevación de desplazamiento más desenfoque, nunca un halo de offset cero.
- Íconos SVG autorales a un solo grosor de trazo (1.8), nunca emoji ni glifos del sistema.
- Dos superficies con densidades opuestas y deliberadas: móvil-primero y escritorio-primero.
- Ningún raster: cada slot de imagen es un marcador CSS etiquetado como DEMO.

## Colors

Una paleta institucional estrecha y muestreada: verde de acción sobre blanco cálido, un segundo verde con un solo significado, un ámbar de advertencia, un cian que se mantiene fuera de la rampa verde, y un bordó que solo aparece cuando algo se rompe.

### Primary

- **Verde de acción** (`--brand` `#347659`): la voz de marca, muestreada de `cine.unlam.edu.ar`. Botón primario, chip seleccionado, barra de carrito persistente, badge del contador del carrito, pestaña activa, borde y disco del radio seleccionado, borde de campo enfocado, stepper, botón quiet, punto del paso actual del timeline, y los héroes de `login.html`, `instalar.html` y `perfil.html`. Es el color de la acción, no de la decoración.
- **Verde de acción profundo** (`--brand-deep` `#285b45`): el escalón de hover/active de cualquier superficie verde de acción.
- **Verde lavado** (`--brand-wash` `#eef4f1`): fondo del aviso informativo, del hover del stepper y del botón quiet, y del halo de foco de 3px del campo.
- **Verde de acción brillante** (`--brand-bright` `#0f9977`): el acento muestreado de `unlam.edu.ar`. Está definido en la paleta pero hoy no lo usa ninguna superficie; queda como reserva institucional, no como un rol asignado.
- **Primeros planos sobre verde** (`--on-brand` `#ffffff`, `--on-brand-2` `#cfe3d9`): el texto secundario sobre suelo verde se tiñe desde el matiz, nunca se resuelve con gris.

### Secondary

- **Verde de estado listo** (`--ready` `#0b7a5e`): el verde de MIEL. Es el único color que se usa a bandera desplegada: inunda la sección de estado **y** la barra de aplicación en READY, y además pinta `.btn--go`, el punto y el conector de los pasos completados, la regla y el contador de la columna "listo" del panel, y la tinta de `.paytag--paid` y `.state--done`.
- **Verde brillante** (`--ready-bright` `#31b069`): elemento gráfico únicamente — la pista del toggle activado en `perfil.html`. No sostiene texto.
- **Verde de estado lavado y línea** (`--ready-wash` `#e7f6f1`, `--ready-line` `#a9dcce`): suelo y filete de las etiquetas de pago acreditado y de pedido entregado.
- **Primeros planos sobre el verde listo** (`--on-ready` `#ffffff`, `--on-ready-2` `#eaf7f2`).

### Tertiary

- **Ámbar de advertencia** (`--amber` `#c2410c`): el naranja de los chips de `cine.unlam.edu.ar`, oscurecido desde `#ea580c` hasta alcanzar AA. En preparación, notas de cocina, antigüedad de ticket que empieza a preocupar, etiqueta SIN TACC, pago en efectivo pendiente y el botón `.btn--warn`. Nunca significa error.
- **Cian** (`--cyan` `#0e6a7d`): el único rol semántico fuera de las familias verdes. Existe para las etiquetas VEG y VEGANO, y existe precisamente para que una etiqueta dietaria nunca pueda leerse como la señal de "listo".
- **Verde oscuro institucional** (`--forest` `#022410`): el encabezado de MIEL. Es la barra del panel del operador y el `theme-color` de esa superficie. Su subtítulo va en `--on-forest-2` `#9dbfae` (8.4:1).
- **Scrim** (`--scrim` `rgba(0, 0, 0, .2)`): oscurece un suelo de color por debajo de texto pequeño para que el tipo pueda quedarse en blanco puro en vez de teñirse hasta fallar.

### Alert

- **Bordó institucional** (`--alert` `#ae152d`): el bordó es real en la identidad de la UNLaM, pero allí es un acento **raro** — hovers e insignias, nunca un campo. Aquí ocupa exactamente ese papel: tickets atrasados, cancelaciones, campo inválido, cifra de estadística en alerta y el punto de notificación de la barra de aplicación. Su tríada de wash (`--alert-wash`, `--alert-line`, `--alert-ink`) sostiene la etiqueta de pedido cancelado.

### Tríadas de wash

Cada superficie lavada viaja como una tríada de tres partes, nunca como un fondo suelto: el suelo, la línea de 1px que lo cierra y la tinta que se apoya encima. Las tres están tokenizadas, así que un wash nuevo se compone eligiendo su tríada, no inventando un hex.

| Rol | Suelo | Línea | Tinta |
|---|---|---|---|
| Ámbar (atención) | `--amber-wash` | `--amber-line` | `--amber-ink` |
| Verde de acción (info) | `--brand-wash` | `--brand-line` | `--brand-ink` |
| Verde listo (entregado, pagado) | `--ready-wash` | `--ready-line` | `--ready` |
| Cian (vegetariano) | `--cyan-wash` | `--cyan-line` | `--cyan` |
| Bordó (alerta, cancelado) | `--alert-wash` | `--alert-line` | `--alert-ink` |

La tinta de un wash nunca es el color base del matiz cuando ese base no aguanta: `--amber-ink` es más oscuro que `--amber` porque tiene que sostener texto a tamaño de cuerpo sobre su propio suelo.

### Neutral

Neutros de **piedra cálida**, la rampa que usa `cine.unlam.edu.ar`, no una rampa fría de pizarra. El cambio no es cosmético: el verde de la marca se apoya sobre un gris cálido sin virar a azul.

- **Tinta** (`--ink` `#1c1917`): texto principal, contador de columna del panel, barra de demo.
- **Tinta 2** (`--ink-2` `#292524`): texto secundario fuerte, íconos dentro de controles neutros.
- **Gris de apoyo** (`--muted` `#57534e`): texto de apoyo, metadatos de fila, subtítulos. Valor derivado por contraste.
- **Gris tenue** (`--faint` `#78716c`): marcas de tiempo, chevrons, estados vacíos, columnas vacías. También derivado por contraste, no elegido a ojo.
- **Línea** (`--line` `#e7e5e4`) y **Línea 2** (`--line-2` `#d6d3d1`): divisores y bordes de control respectivamente; `--line-2` es el borde de todo control interactivo en reposo.
- **Superficie** (`--surface` `#ffffff`), **Superficie 2** (`--surface-2` `#fafaf9`) y **Suelo** (`--ground` `#f5f5f4`): tarjeta, recesión dentro de la tarjeta y fondo de la aplicación. **Suelo exterior** (`--ground-outer` `#e7e5e4`) enmarca el teléfono en escritorio.
- **Tinta de deshabilitado** (`--disabled-ink` `#79716b`): el único gris reservado a un control inerte, sobre suelo `--line`.
- **Trama del placeholder** (`--hatch-a` `#eeecea` / `--hatch-b` `#e6e3e0`): las dos franjas de la trama diagonal a 135° del slot DEMO.

### Named Rules

**The Sampled Palette Rule.** Ningún color de este sistema se elige a ojo ni se deduce contando apariciones en una hoja de estilos. Todos salen de muestrear píxeles de los productos digitales propios de la UNLaM. Contar cuántas veces aparece un hex en un CSS mide cuántos selectores lo mencionan, no cuánta pantalla ocupa: por ese error el bordó `#ae152d` parecía dominante — 53 apariciones — cuando en realidad son hovers e insignias. Si hace falta un color nuevo, se captura de una pantalla real de la universidad.

**The White Chrome Rule.** La barra superior de la app es blanca con un filete, nunca una banda de color macizo. `.appbar--brand` es blanca: es lo que hacen `unlam.edu.ar`, `cine.unlam.edu.ar` y MIEL, donde el chrome se apoya en blanco y el color vive en la acción. Una barra saturada cruzando el tope es el hábito de las apps de delivery, no el de la universidad. La única excepción es READY, y no es una excepción de chrome sino la inundación del campo entero.

**The Ready Field Rule.** El estado listo no es una insignia: es el suelo. `--ready` inunda el primer viewport completo — sección de estado más barra de aplicación — y el hecho de que todo el resto de la app sea blanco es lo que hace que esa inundación se lea desde el otro lado de un pasillo. Cualquier color de campo adicional en cualquier otra pantalla le quita exactamente eso.

**The Destination Colour Rule.** En el panel del buffet, el color de un botón predice la columna a la que manda el ticket: `.btn--warn` en ámbar lo mueve a "en preparación", `.btn--go` en verde a "listo". Dos verdes contiguos en una fila de acciones es un error esperando a alguien que trabaja rápido.

**The Two Greens Rule.** El verde de estado tiene dos escalones y la división es de contraste, no de gusto. `--ready` `#0b7a5e` mide 5.24:1 contra blanco y es el único que puede cargar texto blanco a tamaño de cuerpo; `--ready-bright` `#31b069` es **solo gráfico** — falla 3:1 como suelo de texto y por eso vive en la pista de un toggle, no debajo de una etiqueta. `--brand` `#347659` es un tercer verde con otro trabajo: acción, no estado. Nadie "corrige" uno devolviéndolo al otro; los tres son institucionales y ninguno es intercambiable.

**The Wash Triad Rule.** Un fondo lavado nunca viaja solo. Suelo, línea y tinta son un juego de tres tokens, y los tres se eligen juntos. Escribir un hex literal para el borde de un wash es cómo se rompe una paleta: no se ve mal el día que se escribe, y para cuando hay cinco variantes ya nadie sabe cuál era la correcta.

**The Contrast-Derived Neutral Rule.** `--muted` y `--faint` son valores medidos sobre el suelo donde se apoyan, no grises elegidos a ojo. Un gris que falla sobre su propio suelo es un defecto, no una decisión de estilo. Lo mismo vale para el ámbar: `--amber` `#c2410c` es el `#ea580c` de cine oscurecido hasta pasar AA, y ese oscurecimiento no es negociable.

**The One Meaning Rule.** `--ready` significa listo para retirar. No se usa para "éxito" genérico, ni para confirmaciones, ni como acento decorativo. Su escasez es lo que lo hace legible de un vistazo. Simétricamente, `--alert` significa que algo se rompió o venció: nunca es marca, nunca es un campo.

**The Never Color Alone Rule.** Ningún estado se comunica solo con color. Cada estado embarca un ícono autoral más texto. Es un requisito de accesibilidad, no una preferencia: las etiquetas dietarias las lee gente con celiaquía, y sobreviven a la escala de grises por construcción. VEG y VEGANO comparten el cian y se separan por **estructura** — VEG es delineada sobre wash, VEGANO es sólida con texto blanco — precisamente porque el matiz solo no alcanza.

## Typography

**Body Font:** Open Sans (con `Segoe UI`, `system-ui`, `-apple-system`, `sans-serif`)

No hay una segunda familia. Open Sans cubre todos los roles, del código de retiro de 44px al rótulo nano de 9px; la jerarquía la construyen peso, tamaño y tracking, no un contraste de familias.

**Character:** Neutral, institucional y de alta legibilidad a distancia de brazo. Los títulos van en 700-800 con tracking negativo (-.015em a -.035em) para que se lean densos y estables; el cuerpo queda en 400 con interlineado 1.5. Los micro-labels invierten la lógica y abren el tracking (.06em a .14em) en mayúsculas.

### Hierarchy

- **Código de retiro** (800, 2.75rem/44px, line-height 1.1, tracking .12em): el elemento más grande de todo el sistema, en la tarjeta `.code`. Es lo que el estudiante muestra en el mostrador.
- **Display** (700, 2.5rem/40px, `--t-xl`): héroes de portada; el hero de `index.html` usa `clamp(2rem, 6vw, 3rem)`.
- **Headline** (700, 1.9375rem/31px, tracking -.028em): el título del estado del pedido.
- **Title** (800, 1.5rem/24px, tracking -.02em): total del resumen, reloj del operador, número de ticket, cifras de estadística.
- **Subtitle** (700, 1.1875rem/19px): títulos de sección, título de estado vacío, total del dock, título de la barra del operador.
- **Lead** (700, 1.0625rem/17px, tracking -.02em): título de la barra de aplicación y bajadas de texto.
- **Body** (400, 0.9375rem/15px, line-height 1.5): texto por defecto de `body`. Nombre de fila en 600, precio en 800 con tracking -.01em, título de columna del operador en 800 mayúsculas.
- **Small** (600, 0.8125rem/13px): chips, enlaces de sección, metadatos de fila, texto de aviso, botones `--sm`.
- **Caption** (400, 0.75rem/12px): subtítulos de la barra de aplicación, sugerencias de campo, marcas de tiempo, notas de cocina, mensajes de error.
- **Label** (700-800, 0.6875rem/11px, tracking .06em-.14em, mayúsculas): etiquetas de la barra de pestañas, etiquetas dietarias, `paytag`, encabezado del código de retiro, barra de demo.
- **Nano** (800, 0.5625rem/9px, tracking .1em): un solo uso en todo el sistema — el rótulo DEMO dentro del thumbnail de 68px, donde el escalón de 11px ya no entra. No es un escalón de jerarquía disponible; es la excepción del thumbnail.

### Named Rules

**The Tabular Figures Rule.** `font-variant-numeric: tabular-nums` está en `body` y se hereda explícitamente en `button, input, select, textarea`. Precios, cantidades, códigos y horarios se alinean en columna; las figuras proporcionales las rompen. Nunca se apaga.

**The Balanced Heading Rule.** Todos los encabezados llevan `text-wrap: balance`, `line-height: 1.22` y tracking negativo. Un título de dos líneas nunca deja una palabra huérfana en la segunda.

## Layout

El ritmo espacial es una escala de base 4px expuesta como `--s1` a `--s10` (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). El padding lateral canónico de una pantalla móvil es `--s4` (16px); las bandas de la portada respiran a `--s9` (48px).

**Superficie del estudiante — móvil primero.** El contenedor `.phone` tiene `max-width: 420px` (`--phone`) y se centra. Por encima de 480px, `body.is-phone` lo enmarca sobre `--ground-outer` con `--lift-3` y radio `--r-xl` solo en las esquinas superiores: el marco se ancla al borde inferior de la ventana en lugar de flotar sobre él. Un marco flotante solo se lee como dispositivo mientras la página entra en una pantalla; apenas hay scroll, el marco sigue de largo hacia abajo y cualquier separación bajo una barra fija deja ver el contenido que pasa por detrás. Anclado abajo, las barras fijas quedan al ras del piso en cualquier posición de scroll. La barra de pestañas mide 60px (`--tabbar`) y `.screen` reserva `--tabbar + --s6` de padding inferior. La barra de aplicación es sticky en `top: 0` con 56px de alto mínimo, y la fila de chips sticky se ancla exactamente en `top: 56px`, debajo de ella. La barra de carrito persistente flota a `--tabbar + --s3` del borde inferior. La grilla de productos es de dos columnas fijas con `gap: --s3`; los objetivos táctiles no bajan de 44px (botones 48px, filas 64px, chips 36px con área de fila).

**Superficie del operador — escritorio/tablet primero.** `buffet.html` usa una grilla de tres columnas separadas por una línea de 1px de `--line`. Por debajo de 1100px el ticket se aprieta (padding a `--s3`, código de ticket a `--t-h3`) pero la progresión de tres columnas se mantiene, porque el tablet en vertical (768-834px) es una superficie objetivo nombrada. Solo por debajo de 760px colapsa a una columna. Los encabezados de columna son sticky dentro de su columna.

**Portada.** `index.html` usa `.wrap` con `max-width: 1060px` y grillas `auto-fill` con mínimos de 220px (pantallas) y 150px (muestras de color).

### Named Rules

**The Two Densities Rule.** Las dos superficies tienen densidades opuestas a propósito. El estudiante es móvil primero, de una sola mano, 420px, objetivos de 44px o más. El operador es escritorio/tablet primero, tipografía mayor e información más densa, y su progresión de tres columnas es la lectura del panel: se aprieta antes de colapsar.

**The Container Yields Rule.** El contenedor de un control cede; nada dentro del control cede. Los SVG dentro de `.btn`, `.chip`, `.tag` y `.paytag` llevan `flex: 0 0 auto`, las etiquetas de botón y de `paytag` llevan `white-space: nowrap`, y `.ticket__foot` lleva `flex-wrap: wrap` para que dos controles se apilen en vez de aplastarse.

**The Fade, Don't Slice Rule.** Una fila desplazable horizontalmente se desvanece en su borde con una `mask-image` de 28px en vez de cortarse en seco. Un chip rebanado plano en el borde del viewport se lee como un bug de layout; el degradado dice "hay más hacia allá", que es lo que efectivamente pasa.

## Elevation & Depth

El sistema es elevado, no plano, y su sombra siempre tiene dirección: desplazamiento vertical más desenfoque suave, en dos capas, tintadas con `rgba(22, 24, 28, ...)` y no con negro puro. Nunca un halo de desplazamiento cero. La profundidad se combina con el escalonado tonal de `--ground` → `--surface` → `--surface-2`, de modo que una tarjeta se despega tanto por sombra como por valor.

### Shadow Vocabulary

- **Reposo** (`--lift-1`, `0 1px 2px rgba(22,24,28,.05), 0 1px 3px rgba(22,24,28,.06)`): tarjeta, tarjeta de producto, ticket, botón primario, botón `--go`, botón `--warn`, botón de agregar.
- **Levantado** (`--lift-2`, `0 2px 4px rgba(22,24,28,.05), 0 6px 16px rgba(22,24,28,.08)`): hover de tarjeta de producto (junto con `translateY(-2px)`), ticket atrasado, tarjeta del código en estado READY.
- **Flotante** (`--lift-3`, `0 4px 8px rgba(22,24,28,.06), 0 16px 40px rgba(22,24,28,.12)`): la barra de carrito persistente y el marco del teléfono en escritorio. Reservado a lo que verdaderamente flota sobre el contenido.
- **Invertido** (`--lift-up`, `0 -2px 4px rgba(22,24,28,.04), 0 -8px 24px rgba(22,24,28,.07)`): barras ancladas al borde inferior — barra de pestañas y dock. La luz sigue viniendo de arriba, así que la sombra de una barra inferior apunta hacia arriba.

### Named Rules

**The Directional Light Rule.** Toda sombra declara una dirección. Un `box-shadow` con desplazamiento 0 en ambos ejes es un halo, y un halo no es elevación: la única excepción del sistema es el anillo de 2px del badge y el halo de foco de campo, que son anillos de estado, no profundidad.

**The Border-or-Shadow Rule.** Una superficie se separa con sombra **o** con borde, no con ambos. `.card` usa `--lift-1`; `.card--flat` cambia a `border: 1px solid var(--line)` y renuncia a la sombra.

## Shapes

El lenguaje de forma es de esquinas redondeadas y suaves, escalonadas por tamaño de objeto: 8px (`--r-sm`) para chips de datos, etiquetas, contadores de columna y botones pequeños; 12px (`--r-md`) para botones, campos, tickets, thumbnails y la barra de carrito; 16px (`--r-lg`) para tarjetas de contenido y la tarjeta del código; 24px (`--r-xl`) solo para las esquinas superiores del marco del teléfono en escritorio; y 999px (`--r-pill`) para todo lo circular o de forma de píldora — chips de filtro, botones de ícono, avatares, puntos del timeline, steppers, toggles, badges y el pulgar del scrollbar.

Los bordes son de 1px en `--line` para divisores y en `--line-2` para el contorno de un control en reposo, subiendo a 2px solo cuando el borde es la señal misma (punto de radio, punto del timeline, regla del encabezado de columna del operador). Los slots de imagen mantienen relaciones declaradas y estables: 4:3 por defecto, más `--sq` 1:1, `--wide` 16:9 y `--thumb` 68px cuadrado.

**The Pill Means Round Rule.** `--r-pill` no es "muy redondeado": marca los objetos que el sistema entiende como circulares o como cápsulas. Un rectángulo de contenido nunca lleva píldora.

## Components

### Buttons

- **Shape:** esquina suave (12px, `--r-md`); variante `--sm` a 8px.
- **Primary:** suelo `--brand` con texto blanco, 48px de alto mínimo, padding lateral 20px, peso 700, `--lift-1`. Hover a `--brand-deep`.
- **Go:** suelo `--ready` con texto blanco, mismo dimensionado. Toma el verde de estado y no el de acción porque el botón manda el ticket exactamente a ese estado.
- **Warn:** suelo `--amber` con texto blanco; hover a `--amber-ink`. Manda el ticket a "en preparación".
- **Ghost:** superficie blanca, texto `--ink-2`, borde `--line-2`. Hover a `--surface-2` con borde `--faint`.
- **Quiet:** transparente con texto `--brand`, 40px de alto. Hover a `--brand-wash`.
- **Hover / Focus / Active:** todas las transiciones a `--fast` 140ms con `--ease`. `:active` aplica `scale(.985)`. El foco es un anillo de 2px en `--brand` con offset 2px.
- **Disabled:** suelo `--line` con texto `--disabled-ink`, sin sombra, `pointer-events: none`.
- **Loading:** `data-loading="true"` vacía el color del texto y dibuja un anillo giratorio de 18px; el botón conserva su ancho, así que la fila no salta.

### Chips

- **Style:** píldora de 36px, superficie blanca, borde `--line-2`, texto `--ink-2` en 13px/600, `flex: 0 0 auto`.
- **State:** `aria-pressed="true"` invierte a suelo y borde `--brand` con texto blanco; hover del seleccionado va a `--brand-deep`. La fila sticky se ancla bajo la barra de aplicación y se desvanece en el borde derecho.

### Tags (etiquetas dietarias)

- **Style:** cápsula de 20px con radio 8px, ícono de 12px más texto en 11px/700 con tracking .04em, borde de 1px del mismo matiz que el texto.
- **SIN TACC** (`--tacc`): ámbar sobre `--amber-wash` con borde `--amber-line`.
- **VEG** (`--veg`): cian delineado sobre `--cyan-wash`.
- **VEGANO** (`--vgn`): cian sólido con texto blanco.
- Se mantienen fuera de las dos rampas verdes por diseño, y VEG/VEGANO se distinguen por estructura además de por matiz. Sobreviven a la escala de grises porque el texto lleva el significado.

### Cards / Containers

- **Corner Style:** 16px (`--r-lg`); tickets del operador a 12px.
- **Background:** blanco (`--surface`) sobre el suelo cálido (`--ground`).
- **Shadow Strategy:** `--lift-1` en reposo; la tarjeta de producto sube a `--lift-2` con `translateY(-2px)` en hover a `--mid` 300ms.
- **Border:** ninguno, salvo la variante plana que canjea sombra por borde.
- **Internal Padding:** `--s3` (12px) en tarjeta de producto, `--s4` (16px) en tarjetas de contenido.
- La tarjeta de producto es un enlace de tarjeta completa que no se viste de enlace: hereda color, no lleva subrayado, y el nombre es encabezado mientras el precio es dato.

### Inputs / Fields

- **Style:** 48px de alto mínimo, borde `--line-2` de 1px, radio 12px, fondo blanco, padding lateral 16px.
- **Hover:** el borde pasa a `--faint`.
- **Focus:** se suprime el outline nativo y se sustituye por borde `--brand` más un halo de 3px en `--brand-wash`.
- **Error:** `aria-invalid="true"` pinta borde `--alert` y fondo `--alert-wash`; el mensaje va debajo en 12px/600, siempre con ícono de alerta.
- **Acción interna:** `.inputwrap__act` es un objetivo de 36px anclado a 6px del borde derecho, con el campo reservando 46px de padding derecho.
- **Radio:** punto de 22px con borde de 2px que pasa a `--brand` al seleccionar y rellena un disco interior; toda la fila de 16px es el objetivo.

### Navigation

- **App bar:** sticky, 56px, superficie blanca con divisor inferior de 1px en `--line`. `.appbar--brand` es blanca también: el color no vive en el chrome. El punto de notificación es `--alert`, con un anillo de 2px del color de la superficie.
- **Tab bar:** fija al borde inferior, 60px, cuatro columnas iguales, ícono de 22px sobre etiqueta de 11px/600. Reposo en `--muted`, hover en `--ink-2`, y `aria-current="page"` en `--brand` con el trazo del ícono engrosado a 2.1. El estado activo se comunica por color **y** por grosor, nunca solo por color.
- **Cart bar:** cápsula `--brand` de 52px flotando sobre la barra de pestañas con `--lift-3`, con contador en un recuadro blanco al 20%.
- **Operator bar:** banda `--forest` de padding `--s4 --s6`, título en 19px/700 y subtítulo en `--on-forest-2`. Es la única banda oscura del sistema y pertenece a la superficie del operador.

### Iconografía

El sistema embarca un set SVG autoral inyectado como sprite `<symbol>` en tiempo de carga, todos en `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="1.8"`, `stroke-linecap="round"` y `stroke-linejoin="round"`. Un solo grosor de trazo para todo el set. Los tamaños de uso son 12px (etiqueta), 13px (paytag), 15px (chip, eta), 18-19px (botón, fila), 20-22px (navegación, botón de ícono), 30px (estado vacío) y 36px (ícono de estado). El color viene siempre de `currentColor`.

### Order Status (componente de firma)

La pantalla de estado del pedido es la que más se abre, y por eso es la que más diseño carga. **El suelo expresa el estado, no una insignia.** `.status--wait` y `.status--cook` van sobre superficie blanca, `.status--done` sobre `--surface-2`, y `.status--ready` pinta el suelo entero en `--ready`. En READY la barra de aplicación se suma al mismo verde, de modo que el primer viewport es una señal continua y la costura cae exactamente donde empieza el contenido del pedido.

Dentro, el ícono de estado es un disco de 76px, el código de retiro es la tarjeta más prominente de la app, y el pill de ETA se oscurece con `--scrim` sobre verde en vez de teñir el tipo: un velo blanco daría 3.6:1 para ese texto de 13px en negrita, y oscurecer el pill lo lleva a 7.5:1.

**El único momento animado del build es la llegada a READY.** El suelo (sección de estado y barra de aplicación juntas) transiciona en `--slow` 560ms con `--ease` `cubic-bezier(.16, 1, .3, 1)`; el ícono de estado aterriza desde `scale(.86)`; la tarjeta del código sube 10px con 90ms de retraso. Nada más en el sistema se anima, y esa contención es portante.

### Order Timeline

Lista vertical con conector de 2px a la izquierda. Un paso completado pinta punto, borde y conector en `--ready`; el paso actual lleva borde y símbolo en `--brand` con el nombre en 700; los pasos futuros quedan en `--line-2` y `--faint`. Cada paso lleva ícono más texto más hora. La división es exacta: verde de estado para lo hecho, verde de acción para lo que está pasando.

### Photo Placeholder (componente de firma)

`.photo` es material de demostración visiblemente etiquetado, no una caja gris. Es un diagonal rayado (`repeating-linear-gradient` a 135°, `--hatch-a` / `--hatch-b` en pasos de 8px) a tamaño y relación finales, con la palabra `DEMO` centrada en 11px/800 con tracking .14em, sobre un recuadro blanco al 90% con borde de 1.5px en `--faint`. Es el mecanismo de honestidad de toda la estrategia fotográfica: la etiqueta es lo último que debe atenuarse. En el thumbnail de 68px baja a `--t-nano` (9px), el único uso de ese escalón.

### Operator Ticket

Tarjeta de 12px con encabezado (código en 24px/800, nombre, antigüedad), cuerpo de ítems con notas en `--amber`, y pie con etiqueta de pago más acción. La antigüedad escala antes de que el pedido esté efectivamente tarde: neutro → `--warn` en `--amber-wash` → `--late` en `--alert` pleno, que además sube el ticket a `--lift-2` y tiñe su divisor. Las tres reglas de columna leen como progresión — tinta, ámbar, verde de estado — y no como una columna sin terminar al lado de dos terminadas.

## Do's and Don'ts

### Do:

- **Do** muestrear cualquier color nuevo de una superficie real de la UNLaM antes de agregarlo; la paleta se captura, no se deduce.
- **Do** usar `--brand` para acción, `--ready` para el estado listo y `--ready-bright` solo como elemento gráfico. Son tres trabajos distintos con tres tokens distintos.
- **Do** dejar el chrome en blanco con filete; el color vive en la acción, no en la barra.
- **Do** dejar que el estado listo inunde el primer viewport entero — sección de estado más barra de aplicación — y mantener blanco todo el resto para que esa inundación signifique algo.
- **Do** reservar `--alert` `#ae152d` para tickets atrasados, cancelaciones, errores y el punto de notificación.
- **Do** componer todo fondo lavado con su tríada completa: suelo, línea y tinta.
- **Do** acompañar todo estado con un ícono autoral más texto; el color nunca es el único portador de significado.
- **Do** separar VEG y VEGANO por estructura (delineada vs. sólida) además de por matiz.
- **Do** dar `flex: 0 0 auto` a cualquier SVG dentro de un control y `white-space: nowrap` a su etiqueta; que ceda el contenedor.
- **Do** mantener `font-variant-numeric: tabular-nums` en toda cifra: precios, cantidades, códigos y horarios se leen en columna.
- **Do** dibujar cada ícono nuevo en `viewBox="0 0 24 24"` con `stroke-width: 1.8` y extremos redondeados, y sumarlo al mapa `ICONS`.
- **Do** etiquetar visiblemente cualquier slot de imagen de demostración a tamaño y relación finales, y publicar su lista de reemplazo.
- **Do** tematizar las superficies del navegador desde la paleta vigente — `::selection`, `caret-color`, `accent-color`, scrollbars, `::placeholder` y `:focus-visible` — apuntando siempre a un token que exista.
- **Do** oscurecer el suelo con `--scrim` cuando haya texto blanco pequeño sobre color, en vez de teñir el tipo.
- **Do** respetar `prefers-reduced-motion: reduce`, que ya neutraliza toda animación y transición del sistema.

### Don't:

- **Don't** contar apariciones de un hex en una hoja de estilos para decidir cuánto pesa un color: eso mide selectores, no pantalla.
- **Don't** usar `--alert` como color de marca, de campo o de chrome. Es raro por definición.
- **Don't** poner texto a tamaño de cuerpo sobre `--ready-bright` `#31b069`: falla 3:1 y ese escalón es solo gráfico.
- **Don't** intercambiar `--brand` y `--ready`: acción y estado no comparten token aunque los dos sean verdes.
- **Don't** pintar la barra de aplicación de color macizo fuera del estado READY.
- **Don't** poner dos verdes contiguos en una fila de acciones del panel: el color del botón predice la columna de destino.
- **Don't** volver a la rampa neutra fría; los grises de este sistema son de piedra cálida y sostienen el verde.
- **Don't** usar emoji, glifos Unicode, fuentes de íconos ni familias display del sistema. Los íconos son SVG autorales.
- **Don't** agregar una segunda animación, un segundo color de acento ni un segundo tratamiento focal: la llegada a READY es el único momento animado y su valor depende de su unicidad.
- **Don't** escribir una sombra con desplazamiento cero en ambos ejes; en este sistema un halo no es elevación.
- **Don't** poner sombra y borde a la misma superficie: se elige uno.
- **Don't** rebanar en seco una fila desplazable horizontalmente; se desvanece con máscara de 28px.
- **Don't** colapsar la progresión de tres columnas del panel del operador por encima de 760px: primero se aprieta el ticket.
- **Don't** bajar los objetivos táctiles de la app del estudiante por debajo de 44px, ni ensanchar `.phone` más allá de 420px.
- **Don't** vestir de enlace una tarjeta que ya es enlace completo: sin subrayado y sin color de enlace en su interior.
- **Don't** usar `--t-nano` (9px) fuera del rótulo DEMO del thumbnail de 68px; no es un escalón de jerarquía.
