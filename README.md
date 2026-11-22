# BuffetYa! — Aura IT

App para comprar en el buffet de la UNLaM sin hacer fila: el estudiante consulta el menú y los precios desde el celular, arma el pedido, lo paga y lo retira con un código cuando la app le avisa que está listo.

- **Producto:** https://buffetya.onrender.com
  (plan Free de Render: la primera carga puede tardar cerca de un minuto y los pedidos se borran cada vez que el servidor se reinicia).
- **Materia:** Gestión Aplicada al Desarrollo de Software II (3665) — Ingeniería Informática, UNLaM — 2.º cuatrimestre 2026.
- **Equipo:** Mathieu Andrés Santamaría Loiacono, Martín Alejandro Didolich, Alejo Rodrigo Lopez Rodofile, Agustín Ignacio Garcia Riveros y Juan Ignacio Bernardez.

## Qué es

**Problema.** Entre el trayecto, la fila y el pago, comprar en el buffet consume buena parte de un recreo corto. El 86% de los estudiantes encuestados calificó la espera como muy molesta.

**Usuario primario.** Estudiantes de los departamentos de Derecho y Ciencia Política, Humanidades y Ciencias Sociales y Ciencias de la Salud que usan habitualmente el buffet. Docentes y personal administrativo de la UNLaM son grupos secundarios.

**Flujo principal.** Menú → carrito (con tiempo estimado antes de pagar) → pago → estado del pedido → aviso de "listo" → retiro con código.

| Estado | Qué incluye |
|---|---|
| Construido | PWA instalable en Angular; menú con precios y filtros opcionales; carrito con tiempo estimado; compra sin registro; pago aprobado y rechazado; estado del pedido en vivo; código de retiro; backend propio en NestJS |
| Simulado | Cobro con Mercado Pago (checkout que imita al real) y operación del buffet (estados del pedido y stock desde el *backstage* del equipo) |
| Diferido | Cuentas, perfil e historial; panel del personal del buffet; Mercado Pago real; notificaciones push con la app cerrada; base de datos en la nube |

El detalle completo del producto, su evolución y sus decisiones está en [`docs/brief.md`](docs/brief.md) (versión 5).

## Cómo se ejecuta

Requisitos: Node.js 22 o superior y pnpm.

```bash
cd src
pnpm install
pnpm dev
```

- App: http://localhost:4200
- API: http://localhost:3000/api
- Backstage (simula al personal del buffet y a Mercado Pago): http://localhost:4200/backstage — clave `buffetya-dev`

La guía completa —build de producción, variables de entorno, deploy en Render (`render.yaml`) y cómo operar el backstage en una sesión de prueba— está en [`src/README.md`](src/README.md).

## Cómo se continúa

El backend está organizado en capas con puertos y adaptadores (`src/backend/src/`: `domain`, `application`, `adapters`). Reemplazar una pieza simulada por la real significa escribir un adaptador nuevo sin tocar las reglas del negocio. Las variables de Firebase y Mercado Pago ya están previstas en `src/.env.example`.

Orden recomendado para salir a producción:

1. **Aviso de "pedido listo" por push** (Firebase Cloud Messaging). Hoy el aviso solo llega con la app abierta; es el componente más riesgoso del producto.
2. **Panel del personal del buffet**, que reemplace al backstage: cola de pedidos, estados, stock y carga del menú.
3. **Mercado Pago real**, con confirmación del pago por webhook.
4. **Base de datos persistente** (Cloud Firestore) en lugar del archivo JSON.

Antes de transferir el proyecto, el hosting, Firebase y Mercado Pago tienen que quedar a nombre de la institución o del buffet, no de un integrante del equipo. La cuenta de Mercado Pago debe ser la del buffet, que es quien cobra.

La arquitectura actual y la de la gran visión están diagramadas en [`docs/arquitectura/`](docs/arquitectura/).

## Mapa del repositorio

| Ruta | Contenido |
|---|---|
| `docs/brief.md` | Brief de producto, versiones 1 a 5 |
| `docs/prompts.md` | Registro del trabajo con IA |
| `docs/evidencia/tp2/` | Respuestas de la encuesta del relevamiento (anonimizadas) |
| `docs/evidencia/tp5/` | Registro de la prueba del MVP con usuarios (U1, U2, U3) |
| `docs/diseno/wireframe/` | Alternativas de diseño A, B y C, y alternativa D (B con las correcciones del TP4), que es la construida |
| `docs/evaluacion/` | Evaluación heurística cruzada del TP4 (equipo e IA) |
| `docs/arquitectura/` | Diagramas de la arquitectura real del MVP y de la gran visión |
| `src/` | Código fuente: `frontend/` (Angular), `backend/` (NestJS), `shared/` |

## Líneas base

| Tag | Corresponde a |
|---|---|
| `tp1` | Definición del producto y del segmento |
| `tp2` | Análisis de usuarios e hipótesis de valor |
| `tp3` | Scope del MVP y diseño de la interacción |
| `tp4-entrega` | Material entregado al equipo evaluador en el TP4 |
| `tp4` | Evaluación de usabilidad |
| `tp5` | Construcción del MVP, prueba y aprendizaje |
| `tp6` | Arquitectura del sistema |
| `tpi` | Trabajo Práctico Integrador |
