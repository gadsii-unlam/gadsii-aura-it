# BuffetYa! — código fuente

MVP de pedidos anticipados al buffet de la UNLaM: el estudiante ve el menú, arma el
carrito, paga (Mercado Pago simulado), sigue el estado del pedido y recibe un aviso
con el código de retiro cuando está listo. Implementa el wireframe aprobado
`docs/diseno/wireframe/alternativa-d/`.

## Puesta en marcha rápida

Requisitos: Node.js 22 o superior y pnpm.

```bash
cd src
pnpm install
pnpm dev
```

- App: <http://localhost:4200> (Angular, con proxy de `/api` hacia Nest).
- API: <http://localhost:3000/api>.
- Backstage del equipo: <http://localhost:4200/backstage> — clave `buffetya-dev`.

No hace falta crear un `.env` para desarrollar. Para cambiar valores, copiar
`.env.example` a `src/.env`.

## Producción: un solo proceso

```bash
cd src
pnpm build                     # shared, frontend y backend
NODE_ENV=production BACKSTAGE_KEY=<clave-larga> PORT=3000 pnpm start
```

Un único proceso `node` en un único puerto sirve todo: la API en `/api` y la app
Angular compilada para cualquier otra ruta, con *fallback* a `index.html` para las
rutas del cliente (`/carrito`, `/pedido`, …). En la VM alcanza con ponerlo detrás de
un proxy con HTTPS (nginx + Let's Encrypt) y mantenerlo vivo con un supervisor
(systemd o pm2).

> [!warning] HTTPS es obligatorio para la PWA
> El *service worker* y las notificaciones solo funcionan en HTTPS o en `localhost`.
> Sin HTTPS la app funciona, pero no se instala ni avisa al celular.

## Backstage: cómo simular "lo que pasa por detrás" en una sesión de prueba

El wireframe deja la actualización de estados y Mercado Pago como simulados. Eso se
hace desde `/backstage`, una pantalla para el equipo que **no está enlazada desde la
app**. Pide la clave (`BACKSTAGE_KEY`) y la guarda solo en la pestaña
(`sessionStorage`). Conviene abrirla en otra computadora o pestaña, no en el celular
del participante.

| Para probar… | Qué hacer en el backstage |
|---|---|
| El recorrido normal (04a → 05 → 06) | En "Pedidos en la cocina", tocar **Pasar a preparación** y después **Marcar listo**. El celular del participante muestra el aviso y pasa a 06. |
| El pago rechazado (04b) | Antes de que el participante pague, tocar **Rechazar el próximo**. Solo afecta al próximo pago; el siguiente se aprueba solo. |
| Un producto agotado | En "Stock", destildar el producto. En el menú queda marcado **SIN STOCK** y sin botón de agregar. |
| El cierre del flujo | **Marcar entregado** cuando el participante muestra el código. |

Los pedidos sin pagar no aparecen en la cocina: un pedido entra a la cocina solo con
el pago aprobado.

Lo mismo por API (útil para scripts), siempre con el header `x-backstage-key`:

```bash
KEY=buffetya-dev
curl -X PUT  localhost:3000/api/backstage/payments/next -H "x-backstage-key: $KEY" -H 'Content-Type: application/json' -d '{"nextResult":"reject"}'
curl         localhost:3000/api/backstage/orders        -H "x-backstage-key: $KEY"
curl -X POST localhost:3000/api/backstage/orders/<id>/status -H "x-backstage-key: $KEY" -H 'Content-Type: application/json' -d '{"status":"ready"}'
curl -X PATCH localhost:3000/api/backstage/products/medialunas-x3 -H "x-backstage-key: $KEY" -H 'Content-Type: application/json' -d '{"available":true}'
```

## Variables de entorno

Se leen de `src/.env` (o `src/backend/.env`); las variables reales del entorno tienen
prioridad. Todas son opcionales en desarrollo.

| Variable | Por defecto | Para qué |
|---|---|---|
| `PORT` | `3000` | Puerto del proceso. |
| `NODE_ENV` | — | Con `production`, el backstage queda apagado hasta definir `BACKSTAGE_KEY`. |
| `BACKSTAGE_KEY` | `buffetya-dev` (fuera de producción) | Clave del backstage. En producción, una clave larga y aleatoria. |
| `CORS_ORIGIN` | vacío | Orígenes permitidos, separados por coma. Solo si la app se sirve desde otro origen. |
| `PICKUP_HOLD_MINUTES` | `15` | Minutos que el mostrador guarda un pedido listo ("Te esperamos hasta las…"). |
| `BUFFET_TIMEZONE` | `America/Argentina/Buenos_Aires` | Zona horaria del reinicio diario del código de retiro. |
| `DATA_DIR` | `backend/data` | Carpeta del archivo de datos `db.json` (está en `.gitignore`). |
| `SEED_FILE` | `backend/data/seed/products.json` | Menú (productos, precios y fotos). |
| `WEB_DIR` / `SERVE_WEB` | build de Angular / `true` | Qué app sirve Nest; `SERVE_WEB=false` deja solo la API. |

## Estructura

```
src/
├── shared/      Contrato de la API (tipos) entre frontend y backend. ESM.
├── backend/     NestJS
│   ├── data/seed/products.json   Menú de ejemplo (versionado)
│   ├── src/domain/               Reglas puras: pedido y estados, precios, estimación,
│   │                             código de retiro, nombre. Sin dependencias.
│   ├── src/application/          Casos de uso y puertos (repositorios, pago, eventos)
│   ├── src/adapters/             JSON file store, Mercado Pago simulado, SSE, HTTP
│   └── test/                     Flujo completo por HTTP (supertest)
├── frontend/    Angular PWA (standalone, zoneless, signals)
│   └── src/app/
│       ├── core/                 Carrito, pedidos en curso (SSE), avisos, API
│       ├── ui/                   Tarjeta y foto de producto, tab bar, íconos
│   └── public/products/          Fotos de los productos (créditos en CREDITS.md)
│       └── pages/                Una pantalla por pantalla del wireframe + backstage
└── design/      Prototipo visual navegable (HTML/CSS/JS, sin build)
```

**Persistencia.** Firebase era la base prevista, pero todavía no hay proyecto ni
credenciales. El backend guarda en un archivo JSON detrás de puertos
(`ProductRepository`, `OrderRepository`): un adaptador de Firebase se enchufa en
`app.module.ts` sin tocar dominio ni casos de uso. Lo mismo vale para el
`PaymentGateway` y Mercado Pago real.

## Pantallas y rutas

| Wireframe | Ruta |
|---|---|
| 01 · Menú y precios | `/` |
| 02 · Mi carrito | `/carrito` |
| 03 · Pago | `/pago` |
| Checkout de Mercado Pago (simulado) | `/checkout/:orderId` |
| 04a · Pago aprobado | `/pago/aprobado/:orderId` |
| 04b · Pago rechazado | `/pago/rechazado/:orderId` |
| "Mis pedidos" (pestaña) | `/pedido`: vacío con 0 pedidos, abre el pedido directo con 1, lista con 2 o más |
| 05 · En preparación, de un pedido | `/pedido/:orderId` |
| 06 · Listo para retirar, de un pedido | `/pedido/:orderId/listo` (el viejo `/pedido/listo` redirige al pedido listo) |
| Backstage (equipo) | `/backstage` |

## Avisos al celular

- El permiso de notificaciones se pide al tocar **Ver el estado del pedido** (04a);
  si se descartó, 05 ofrece **Activar avisos al celular**.
- Cuando un pedido pasa a listo, la app muestra una notificación del sistema con su
  código (vía *service worker*), hace vibrar el teléfono y abre el 06 de ese pedido
  (salvo en medio de un pago). Si el navegador bloquea los avisos, 05 lo dice y el
  cambio se ve en pantalla.
- Se pueden tener **varios pedidos en curso**: pagar uno nuevo no pisa los anteriores.
  La app sigue a todos en vivo por una sola conexión (`/api/orders/events?ids=…`) y
  avisa por cada uno. Un pedido entregado sale de la lista; uno cancelado queda hasta
  que el usuario ve su pantalla.
- **Límite del MVP:** no hay servidor de *push*. El aviso llega con la app abierta o
  en segundo plano; con la app cerrada del todo no llega. En iOS, además, las
  notificaciones web requieren instalar la PWA en la pantalla de inicio.
- Después de cada deploy, la app toma la versión nueva sola en la próxima pantalla
  segura (nunca en medio del pago).

## Pruebas

```bash
cd src
pnpm test          # backend (Vitest: dominio, casos de uso, adaptadores y flujo HTTP) + frontend (Vitest)
pnpm lint          # oxlint del backend
pnpm --filter ./backend run test:e2e   # solo el flujo HTTP
```

## Decisiones de diseño que conviene no romper

- **Verde sobre blanco cálido.** La marca es el verde `#347659`; `#0b7a5e` es
  exclusivo del estado "listo"; el bordó `#ae152d` se usa **solo** para alertas,
  errores y cancelaciones, nunca como marca. Fuente de verdad: `src/DESIGN.md` y
  `src/design/assets/tokens.css` (copiado en `frontend/src/styles/tokens.css`).
- **Cero emojis.** Todo ícono es SVG dibujado, con trazo de 1.8 en todo el sistema
  (sprite en `frontend/src/index.html`).
- **Cifras tabulares en todo el sistema.** Precios y cantidades alinean en columna.
- **Los estados nunca se distinguen solo por color.** Cada estado lleva texto e ícono.
- **La app no se presenta como simulada.** Para las pruebas con usuarios, ningún texto
  visible dice "demo", "simulado" o "prueba" (solo el backstage, que es del equipo).
  Menú y precios siguen siendo de ejemplo.
- **Fotos de producto con licencia libre.** Pexels, CC0 y CC BY, con autor y fuente
  de cada una en `frontend/public/products/CREDITS.md`. Cuatro son CC BY 2.0 y piden
  atribución: antes de un deploy público, agregar los créditos en la app o
  reemplazarlas.

## El prototipo de diseño

`design/` no tiene build ni dependencias: se abre `src/design/index.html`. Incluye
pantallas que **no** son parte del MVP (login, producto, historial, perfil,
instalar); el MVP sigue el wireframe D.
