# Product

## Platform

web (mobile-first)

## Stack

- **Frontend:** Angular como PWA instalable (`@angular/pwa`, service worker).
- **Backend:** NestJS.
- **Base de datos:** Firebase.
- **Autenticación:** Firebase Auth, email + contraseña. Queda previsto restringir
  el registro a dominio institucional UNLaM más adelante; hoy acepta cualquier email.
- **Notificaciones:** Firebase Cloud Messaging (web push).
- **Pagos:** Mercado Pago (checkout) y efectivo al retirar.
- **Deploy:** VM en Azure con créditos estudiantiles. Requiere HTTPS con dominio y
  certificado: sin HTTPS no hay service worker, y sin service worker no hay PWA ni push.
- **Monorepo:** pnpm workspaces en `src/` — `frontend/`, `backend/`, `shared/`.

## Users

**Usuario primario:** estudiantes de la UNLaM de los departamentos de Derecho y
Ciencia Política, Humanidades y Ciencias Sociales, y Ciencias de la Salud, que
compran habitualmente en el buffet universitario.

- Mayoritariamente alumnos avanzados: 57% cursa 5.º año.
- Distribución por departamento: Derecho y Ciencia Política 57%, Humanidades y
  Ciencias Sociales 29%, Ciencias de la Salud 14%.
- Habituados al pago digital: 71% elige Mercado Pago, 29% débito. Ningún encuestado
  prefiere efectivo.
- Con tiempo acotado dentro de la facultad. El 86% considera "muy molesto" hacer fila.

**Usuarios secundarios:**

- **Personal del buffet** — opera la cola de pedidos y dispara los cambios de estado
  que generan las notificaciones. Sin este rol, la funcionalidad core de notificaciones
  no existe.
- Docentes de la UNLaM.
- Personal administrativo de la UNLaM.

## Product Purpose

**BuffetYa!** elimina el tiempo que un estudiante pierde entre el trayecto, la fila y
el pago cada vez que compra en el buffet universitario.

El estudiante consulta el menú y los precios desde el celular, arma el pedido, lo paga,
y recibe una notificación cuando está listo para retirar. No espera en el mostrador y
no llega sin saber qué va a encontrar.

Éxito: los usuarios adoptan la aplicación para comprar en el buffet y reducen el tiempo
que hoy destinan a la fila y al pago.

## Positioning

Un producto genérico de delivery no resuelve esto: no hay reparto, no hay dirección de
entrega y no hay tiempos de viaje. El eje es distinto — el estudiante ya está en el
edificio y el problema es la **fila**, no la distancia.

Lo que ningún competidor puede copiar: el producto vive dentro de la operación de un
buffet universitario concreto, con un único punto de retiro, un menú acotado, y picos
de demanda atados a los horarios de cursada.

## Operating Context

- **Cuándo:** durante la cursada, en el recreo o en huecos entre materias.
- **Dónde:** dentro del campus de la UNLaM.
- **Dispositivo:** celular personal. El uso desde escritorio existe pero es secundario.
- **Estado del usuario:** apurado. Busca resolver la compra en el menor tiempo posible
  para volver o ir a clase.
- **Conectividad:** disponible — WiFi del centro de estudiantes o datos móviles propios.
- **Personal del buffet:** trabaja detrás del mostrador, con las manos ocupadas y a
  distancia de la pantalla. Su contexto es opuesto al del estudiante: pantalla fija
  (tablet o monitor), lectura a distancia, interacción mínima por pedido.

## Capabilities and Constraints

**Funcionalidades core (del brief del equipo):**

1. Consulta del menú.
2. Filtrado del menú por restricciones alimenticias.
3. Realización de pedidos.
4. Notificaciones en tiempo real cuando el pedido está listo.
5. Historial de pedidos.

**Confirmado:**

- Retiro **inmediato**: el pedido se prepara al confirmarse. No hay agendado por franja
  horaria.
- Ciclo de estados del pedido: recibido → en preparación → listo para retirar → entregado.
- El pedido lleva un **código de retiro** que el estudiante muestra en el mostrador.
- Medios de pago: Mercado Pago y efectivo al retirar.
- Filtros dietarios relevados: celíaco, vegetariano, vegano.
- Dos superficies con prioridades opuestas: la app del estudiante es mobile-first;
  el panel del buffet es desktop/tablet-first.

**Restricciones:**

- La UNLaM no expone una API de autenticación pública, por lo que no hay integración
  con credenciales de MIEL.
- El push web en iOS solo funciona si la PWA está instalada en la pantalla de inicio.
  Esto obliga a diseñar una pantalla de onboarding de instalación.
- En Android la instalación puede dispararse con un botón propio; en iOS es manual.

**Sin decidir:**

- Dominio y certificado del deploy.
- Si el registro se restringe a email institucional UNLaM.
- Punto único o múltiples puntos de retiro dentro del campus.

## Brand Commitments

- **Nombre del producto:** BuffetYa! (con signo de exclamación).
- **Equipo:** Aura IT.
- **Identidad visual:** debe seguir la estética institucional de la UNLaM.
  Paleta **muestreada de los propios productos digitales de la universidad**, no
  deducida de un conteo de CSS:
  - `cine.unlam.edu.ar` (el análogo más cercano: un producto transaccional de la
    UNLaM) — acción `#347659`, fondo `#f5f5f4`, texto `#44403c`, chips
    `#ffedd5` sobre `#ea580c`.
  - `miel.unlam.edu.ar` — campo verde `#0b9b71`→`#59c561`, header `#022410`.
  - `unlam.edu.ar` — acento `#0f9977`.
  - **El lenguaje digital de la UNLaM es verde sobre blanco cálido.** El chrome
    va blanco o transparente, nunca una banda de color macizo, y el color vive
    en la acción.
  - El bordó `#ae152d` es institucional pero es un **acento raro** (hovers,
    badges). Nunca un campo. En BuffetYa! es exclusivamente la alerta: pedido
    demorado, cancelado, error.
  - Neutros **cálidos** (familia stone), no grises fríos.
  - Tipografía institucional: **Open Sans**.
  - El escudo es un sello circular monocromo, usado sobre color.
- **Idioma de la interfaz:** español rioplatense, registro profesional. Los usuarios
  son estudiantes argentinos.
- **Íconos:** nunca emojis ni glifos Unicode. Todo ícono es SVG dibujado, con un solo
  peso de trazo en todo el sistema. Restricción explícita del equipo (2026-08-31).
- **Dirección visual: el estándar de la categoría, ejecutado al máximo nivel de oficio.**
  Elegida deliberadamente por el equipo sobre alternativas más distintivas. La
  convención es el compromiso: se ejecuta al pie, sin ironía y sin rarezas
  contrabandeadas. Preferencia estable, no una decisión de una sola pantalla.
- **Vara de oficio:** BuffetYa! tiene que poder ponerse al lado de estos productos sin
  desentonar.
  - **Apps de pedido anticipado (Starbucks, McDonald's)** — marcan la vara de la
    pantalla de estado del pedido, el código de retiro y la notificación de listo.
  - **Mercado Pago** — marca la vara del checkout, los comprobantes, los estados de
    transacción y la densidad de información. El pago debe sentirse continuo con MP,
    no un salto brusco a otra cosa.
- **Fotografía de producto:** el estándar de la categoría vive de la foto. Como no
  existen fotos reales del buffet, los espacios se diseñan en su tamaño y proporción
  final con un placeholder rotulado de forma visible como material de demostración.
  Nada finge ser real. Se mantiene una lista de reemplazo.

## Evidence on Hand

- `docs/brief.md` — brief de producto, versión 2.
- `docs/evidencia/` — evidencia del relevamiento del TP2.
- `docs/prompts.md` — registro obligatorio de uso de IA, auditado en el TP7.
- `local-docs/` — consignas de cátedra del TP1 y TP2 (local, no versionado).
- Relevamiento propio por encuesta: **7 respuestas**. Muestra chica; los porcentajes
  son indicativos, no estadísticamente significativos.

**Ausencias que no se deben inventar:** no hay menú real del buffet, ni precios reales,
ni fotos de los productos, ni datos de la operación del buffet. Todo dato de menú que
aparezca en prototipos es de demostración y debe estar rotulado como tal.

## Product Principles

1. **El tiempo es la métrica.** Cada pantalla se juzga por cuántos segundos le saca al
   estudiante. Un paso que no reduce tiempo, sobra.
2. **El estado del pedido es el producto.** Lo que el usuario más mira no es el menú:
   es "¿ya está listo?". Esa pantalla merece el mejor diseño de todo el sistema.
3. **Diseñar para el apuro, no para la calma.** El usuario está entre clases, parado,
   con una mano. Objetivos táctiles grandes, decisiones pocas, texto legible en
   movimiento.
4. **Dos superficies, dos contextos.** El estudiante mira un celular de cerca; el buffet
   mira una pantalla de lejos. No compartir densidad ni escala tipográfica.
5. **Ser UNLaM sin ser un trámite.** La identidad institucional da confianza, pero el
   producto es comida entre clases. Formal en la paleta, cálido en el tono.

## Accessibility & Inclusion

- Contraste mínimo WCAG AA (4.5:1 en texto normal, 3:1 en texto grande y controles).
- Los estados del pedido no pueden distinguirse solo por color: cada estado lleva
  ícono y texto.
- Objetivos táctiles de 44px como mínimo — el usuario opera de pie y apurado.
- Los filtros dietarios son una necesidad de salud, no una preferencia: deben ser
  visibles y sin ambigüedad. Un celíaco no puede equivocarse de plato.
