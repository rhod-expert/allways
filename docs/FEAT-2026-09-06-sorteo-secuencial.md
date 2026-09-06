# Feat 2026-09-06 — Sorteo secuencial, premio a premio

**Componente:** `backend/src/services/sorteoService.js`, `backend/src/models/queries.js`,
`frontend/src/components/admin/SorteoPresentacion.jsx` (nuevo)
**Branch / PR:** `feat/sorteo-secuencial-premio-a-premio` → PR #8
**Origen:** pedido del administrador de la marca (2026-09-03)

## Pedido

> Actualmente, los 5 premios se sortean en simultaneo, lo cual resta dinamismo y no
> genera la expectativa adecuada en los participantes.
>
> 1. Revelar los ganadores premio por premio, en lugar de mostrarlos todos al mismo tiempo.
> 2. Incorporar una animacion o temporizador previo a mostrar cada ganador.
> 3. Mostrar en pantalla cada premio junto con su respectivo ganador antes de pasar al siguiente.

## Que pasaba antes

El backend sorteaba los 5 premios en memoria y los escribia en **una sola transaccion**,
devolviendo el array completo. El frontend *ya intentaba* revelarlos de a uno con un loop
de `setTimeout(800ms)`, pero se percibia como simultaneo por tres razones:

1. 800 ms es demasiado rapido y no habia ningun efecto de suspenso.
2. Los ganadores se **apilaban en una lista**, no era "un premio por vez".
3. **El bug principal:** `setAnimating(false)` en el `finally` destruia el overlay apenas
   terminaba el loop, y el `fetchData()` siguiente repintaba la grilla con los 5 premios
   en verde de golpe. Eso es literalmente lo que el administrador estaba viendo.

## Decision: sorteo real premio a premio (no solo animacion)

Se plantearon dos caminos:

| | A — Atomico + revelacion teatral | B — Endpoint por premio (elegido) |
|---|---|---|
| Seleccion | 1 transaccion, 5 ganadores | 1 request por premio, 5 transacciones |
| Riesgo de mes a medio sortear | nulo | real, pero recuperable |
| "Sorteado en vivo" ante escribano | no literalmente | si |

Los tres puntos del pedido hablan de **presentacion**, asi que la opcion A los cumplia con
mucho menos riesgo. Se eligio igual la **B** por el argumento de integridad del evento: el
ganador no debe existir en la base hasta el instante en que se lo anuncia.

## La consecuencia que no es obvia

**La regla "1 premio por participante por mes" cambio de lugar.**

Antes la garantizaba un `Set` en memoria dentro de una unica llamada:

```js
// sorteoService.js (version anterior)
const participantesGanadores = new Set();
// ... if (!participantesGanadores.has(candidato.PARTICIPANTE_ID))
```

Con cada premio en su propia request ese `Set` deja de existir entre premios. Y marcar el
cupon ganador con `GANADOR='S'` **no alcanza**: el participante puede conservar otros
cupones sin ganar que competirian por el premio siguiente.

La regla vive ahora en SQL, en la clausula de elegibilidad compartida
(`SORTEO_ELEGIBLES_WHERE`):

```sql
AND NOT EXISTS (
  SELECT 1 FROM ALLWAYS_PREMIOS P2
  JOIN ALLWAYS_CUPONES C2 ON C2.ID = P2.CUPON_GANADOR_ID
  WHERE UPPER(P2.MES) = UPPER(:mes)
    AND C2.PARTICIPANTE_ID = C.PARTICIPANTE_ID
)
```

> **Si alguien toca esa clausula, la regla se rompe en silencio.** No hay error, no hay
> log: simplemente un participante puede ganar dos premios del mismo mes.

Se verifico contra los meses ya sorteados: en MAYO→AGOSTO hubo **2 a 3 ganadores por mes**
que conservaban cupones sin ganar y habrian vuelto al pozo sin este `NOT EXISTS`. Con la
clausula, 0 fugas.

## Estado parcial: ahora es legitimo

Un mes puede quedar en 3 de 5 premios. Eso obligo a reemplazar el booleano:

| Antes | Ahora |
|---|---|
| `sorteado = premios.some(p => p.CUPON_GANADOR_ID)` | `sorteados` / `pendientes` / `completo` / `enProgreso` |
| `SorteosPage`: `done = PREMIOS_SORTEADOS > 0` (marcaba "Sorteado" con 1 de 5) | `done = PREMIOS_SORTEADOS === TOTAL_PREMIOS`, y badge "2/5" para el resto |

La variable `partial` ya se calculaba en `SorteosPage.jsx` y nunca se usaba; ahora alimenta
ese badge.

**Recuperacion:** si el navegador o la red se caen a mitad del evento, recargar
`/admin/sorteos/:mes` muestra 3 de 5 y el boton pasa a **"Continuar sorteo (2 restantes)"**.
El modelo de datos ya lo soportaba: cada fila de `ALLWAYS_PREMIOS` tiene su propio
`CUPON_GANADOR_ID` y `FECHA_SORTEO`.

**Concurrencia:** los `UPDATE` quedan condicionados a que la fila siga sin sortear
(`AND CUPON_GANADOR_ID IS NULL`) y se verifica `rowsAffected === 1`. Dos admins sorteando
el mismo premio a la vez: el segundo afecta 0 filas y recibe 409.

## Decisiones de producto tomadas con el usuario

- **La pagina publica `/ganadores/:mes` se llena en vivo.** `SORTEO_GANADORES_PUBLICOS`
  filtra `CUPON_GANADOR_ID IS NOT NULL`, asi que cada ganador aparece en el sitio al hacer
  commit. Se evaluo ocultarla hasta cerrar el mes y se decidio dejarla en vivo: refuerza el
  evento en tiempo real. Contrapartida aceptada: quien mira el sitio puede ver un ganador
  segundos antes que el proyector.
- **No hay reset por premio, a proposito.** Solo reset del mes completo, para que nadie
  pueda repetir un premio aislado hasta que salga el nombre deseado.

## Modo simulacion

`SORTEO_SIMULACION_ENABLED` habilita `POST .../simular`, que corre **la misma seleccion**
que el sorteo real (comparten `seleccionarGanador`) pero no escribe en `ALLWAYS_CUPONES`
ni en `ALLWAYS_PREMIOS`.

Detalles deliberados:

- **El gate es el backend.** Con la flag apagada el endpoint devuelve 404. Esconder el boton
  en React no protegeria nada: cualquiera puede hacer el POST a mano.
- **Si registra en `ADMIN_LOG`**, como `SIMULAR_SORTEO_PREMIO`. Es barato y evita que alguien
  alegue despues que un sorteo real fue disfrazado de simulacion.
- **No valida "ya sorteado"**, porque ensayar sobre un mes ya cerrado es el caso de uso
  principal. En ese caso los ganadores reales estan fuera del pozo, asi que la simulacion
  muestra personas distintas — la UI lo advierte.
- Como no persiste nada, **la simulacion no ejercita la exclusion entre premios**: cada
  premio simulado es independiente y puede repetir persona. Es esperado.

> **Operativo:** debe quedar en `false` durante el sorteo real. Vive en `backend/.env`,
> fuera de git, asi que un merge no lo cambia — hay que verificarlo en el servidor.

## Presentacion

`SorteoPresentacion.jsx` es un escenario a pantalla completa con tres modos:

| Modo | Que hace |
|---|---|
| `real` | Sortea cada premio pendiente al revelarlo. Es el evento. |
| `simulacion` | Misma animacion, nada se guarda. Franja fucsia permanente. |
| `replay` | Relee ganadores ya guardados. **Nunca llama a un endpoint de sorteo.** Sirve si el proyector fallo. |

- La animacion y el request corren juntos (`Promise.all([onDraw(id), delay(3600)])`) y la
  revelacion espera al mas lento, para que Oracle respondiendo en 40 ms no corte el suspenso.
- Avance **manual**: el operador decide cuando pasa al siguiente premio. Teclado soportado
  (Enter, Espacio, flecha derecha, PageDown) para control remoto de presentacion.
- No se puede cerrar mientras hay un sorteo en vuelo.

## Verificacion

Todo contra el Oracle de produccion, **sin ejecutar ningun sorteo real**:

| Prueba | Resultado |
|---|---|
| Guardas: mes ajeno / ya sorteado / inexistente / id invalido | 400 / 409 / 404 / 400 |
| Simulacion con la flag apagada | 404 |
| 5 simulaciones sobre SEPTIEMBRE | ganadores y ciudad correctos, base inalterada |
| Exclusion por mes (MAYO→AGOSTO) | 0 fugas |
| Escritura + carrera, con rollback forzado | 1 fila cada update; segundo admin 0 filas; nada persistido |

El camino de escritura se valido dentro de una transaccion con rollback forzado, asi que
**ningun sorteo se ejecuto de punta a punta**. Conviene correr una simulacion desde el panel
antes del evento para confirmar el ritmo en el proyector real.

## Sin migracion

No hay cambios de esquema. Los cupones que no ganan siguen acumulandose para los meses
siguientes, sin modificaciones respecto de las bases y condiciones.
