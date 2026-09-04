# BuffetYa! — código fuente

Monorepo del producto. Pedidos anticipados al buffet de la UNLaM.

## Estructura

```
src/
├── design/      Prototipo de diseño navegable (HTML/CSS/JS, sin build)
├── frontend/    Angular — PWA instalable
├── backend/     NestJS — API
├── shared/      Tipos y contratos compartidos entre front y back
└── docs/        Entregas de la materia
```

## Stack

| Pieza | Tecnología | Por qué |
|---|---|---|
| Frontend | Angular (PWA) | Se instala desde la URL, sin tiendas ni APK |
| Backend | NestJS | API REST |
| Base de datos | Firebase | Requisito de integración del TP |
| Autenticación | Firebase Auth | Email + contraseña |
| Notificaciones | Firebase Cloud Messaging | Aviso de pedido listo |
| Pagos | Mercado Pago | Requisito de integración del TP |
| Deploy | VM en Azure | Créditos estudiantiles |

## Requisitos

- Node.js 20 o superior
- pnpm

## Puesta en marcha

```bash
cd src
pnpm install

pnpm dev          # frontend y backend en paralelo
pnpm dev:web      # solo Angular
pnpm dev:api      # solo NestJS
pnpm build        # compila shared, frontend y backend
```

## El prototipo de diseño

`design/` no tiene build ni dependencias. Se abre directo:

```
src/design/index.html
```

Ahí está el índice de las once pantallas, el sistema de diseño (paleta,
tipografía, íconos) y la lista de qué material de demostración falta
reemplazar por material real.

Algunas pantallas tienen controles de prototipo, en una barra negra al pie,
para revisar estados que sin backend no se pueden alcanzar:

- `pedido.html` — los cuatro estados del pedido.
  También por URL: `pedido.html?estado=wait|cook|ready|done`
- `historial.html` — vista con pedidos y vista vacía.

## Decisiones de diseño que conviene no romper

- **El bordó `#ae152d` es la marca; el verde `#0f9977` está reservado para
  "listo".** El verde no se usa para nada más.
- **Cero emojis.** Todo ícono es SVG dibujado, con trazo de 1.8 en todo el
  sistema. Están definidos en `design/assets/app.js`.
- **Cifras tabulares en todo el sistema.** Precios y cantidades tienen que
  alinear en columna.
- **Los estados nunca se distinguen solo por color.** Cada estado lleva ícono
  y texto. Un celíaco no puede depender del tono de una etiqueta.
- **Dos superficies, dos densidades.** La app del estudiante es mobile-first
  y se opera con una mano, parado. El panel del buffet es desktop-first y se
  lee a un metro de distancia.

## Deploy: lo no negociable

La PWA necesita **HTTPS con dominio y certificado**. Sin HTTPS no hay service
worker, y sin service worker no hay instalación ni notificaciones push. En la
VM de Azure se resuelve con nginx y Let's Encrypt.

En iOS el push web solo funciona si el usuario instaló la app en la pantalla
de inicio. Por eso `instalar.html` no es una pantalla decorativa: es la que
habilita la funcionalidad principal del producto.

## Variables de entorno

Copiar `.env.example` a `.env` y completar. **Nunca** commitear `.env` ni el
archivo de credenciales de servicio de Firebase.
