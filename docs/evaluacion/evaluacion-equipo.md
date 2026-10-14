## Hallazgos de la evaluación heurística

| Heurística incumplida | Descripción del problema | Severidad (1-4) | Justificación severidad | Mejora sugerida |
|---|---|:---:|---|---|
| H1 - Visibilidad del estado del sistema | No hay visualización de estados | 1 | Es un problema cosmético: el usuario igual puede completar el flujo, solo que sin saber cuánto le falta. | Una barra que muestre la cantidad de pasos y en cuál se encuentra el usuario. |
| H2 – Correspondencia entre el sistema y el mundo real | El orden de las pantallas no es el que creemos que sea más importante para la aplicación. | 2 | El orden no impide usar la app, pero prioriza mal la información y genera fricción en el uso diario. | Cambiar el orden de las pantallas: primero resumen (4), luego alerta (2), Check In (1) y agregar entrega (3). |
| H3 - Libertad y control del usuario | No se observan botones para modificar, eliminar, deshacer, cancelar, volver atrás. | 2 | El usuario no puede corregir errores, pero es recuperable ya que puede volver a empezar el flujo. | Incorporar botones. |
| H6 - Reconocimiento en vez de recordar | El usuario debe recordar los valores de la pantalla anterior para actuar en la siguiente. | 4 | Sin poder volver atrás, el usuario carga datos a ciegas y puede decidir mal, afectando el núcleo de la app. | Al no poder regresar al paso anterior, no sé en qué situación estoy. |
| H7 - Flexibilidad y eficiencia de uso | No se observan shortcuts | 1 | Afecta solo la velocidad de usuarios frecuentes, sin impedir ninguna tarea. | Permitir atajos entre pantallas. |
| H7 - Flexibilidad y eficiencia de uso | Se obliga a pasar por el check-in y la carga de entrega cada vez que inicia la aplicación. | 3 | Pasar por pasos obligatorios en cada apertura es una molestia recurrente que puede llevar al abandono de la app. | Permitir posponerlo durante el día o configurarlo como opcional. |
| H8 - Diseño estético y minimalista | Se observan botones que hacen dos cosas | 4 | Un CTA ambiguo hace que el usuario no sepa qué acción ejecuta, comprometiendo la navegación principal. | Mejorar el mensaje de los CTA. Ej: el botón "Ahora no / Ver resumen" no le vemos sentido de existir. |
| H9 - Reconocimiento y recuperación de errores | No existe manejo visible si falla el guardado por falta de conexión. | 4 | El usuario puede perder los datos cargados sin enterarse, lo que rompe la confianza en la app. | Mostrar error claro y ofrecer reintentar o guardar localmente. |
| H9 - Reconocimiento y recuperación de errores | No existe una sección de ayuda | 2 | Genera dudas sin resolver, pero no bloquea el uso de las funciones principales. | Permitir apartado para ver dudas frecuentes. |
| H10 - Ayuda y documentación | No se explica cómo se calcula exactamente el estrés. | 4 | El indicador central de la app es opaco y puede ser engañoso, ya que depende de la persona y no solo de la cantidad de entregas. | Calcular estrés por cantidad de materias... Depende de la persona. Pueden ser 3 entregas de Inglés 1. |
| H10 - Ayuda y documentación | No existe ayuda contextual para usuarios que nunca usaron una herramienta de organización académica. | 3 | Los usuarios novatos pueden no entender el flujo y abandonar, aunque quienes ya conocen este tipo de herramientas no se ven afectados. | Agregar guía inicial breve. |

## Resumen por heurística

| ID | Heurística | Estado | # de hallazgos | Puntuación (0-5) | Observaciones |
|---|---|---|:---:|:---:|---|
| H1 | Visibilidad del estado del sistema | Parcial | 1 | 3 | No hay indicadores de progreso ni visualización clara de los estados dentro del flujo. |
| H2 | Correspondencia entre el sistema y el mundo real | Parcial | 1 | 4 | El orden del flujo no coincide con la prioridad que tendría el usuario para consultar la aplicación. |
| H3 | Libertad y control del usuario | Parcial | 1 | 3 | No existen acciones visibles para cancelar, volver atrás, editar o deshacer. |
| H4 | Prevención de errores | N/A | 0 | 5 | No se identificaron problemas específicos relacionados con prevención de errores en el wireframe evaluado. |
| H5 | Coherencia y estándares | Total | 0 | 5 | Se mantiene consistencia visual y terminológica entre pantallas. |
| H6 | Reconocimiento en vez de recordar | Parcial | 1 | 2 | El usuario debe recordar información de pantallas anteriores para continuar el flujo. |
| H7 | Flexibilidad y eficiencia de uso | Parcial | 2 | 3 | No existen shortcuts y algunos pasos obligan a realizar acciones repetitivas. |
| H8 | Diseño estético y minimalista | Parcial | 1 | 2 | Algunos CTA resultan ambiguos y generan confusión sobre su finalidad. |
| H9 | Reconocimiento, diagnóstico y recuperación ante errores | Parcial | 2 | 2 | No hay manejo visible de errores de conexión ni sección de ayuda para resolver problemas. |
| H10 | Ayuda y documentación | Parcial | 2 | 2 | |
