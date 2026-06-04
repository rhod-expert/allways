# Fix 2026-06-04 — ID de participante incorrecto en el log de notificaciones WhatsApp

**Componente:** `backend/src/services/notificationService.js`
**Branch / PR:** `fix/wa-notif-participante-id` → PR #3
**Severidad:** baja (no afecta el envío; sí la auditoría de notificaciones)

## Síntoma

Al validar un registro desde el panel admin (aceptar o rechazar), el WhatsApp
al participante **se enviaba correctamente**, pero en los logs del backend
aparecía:

```
ORA-02291: integrity constraint (ALLWAYS.FK_WA_NOTIF_PART) violated - parent key not found
[NOTIF] log fallo: ORA-02291: ...
```

La fila de auditoría en `ALLWAYS_WA_LOG_NOTIF` **no se insertaba**.

## Causa raíz

Las funciones `notifyRecibido` / `notifyAceptado` / `notifyRechazado` reciben una
fila de `ALLWAYS_REGISTROS` y la pasan como `participante`:

```js
notifyAceptado({ participante: registro, registro, cupones })
```

Dentro de `sendAndStore` se usaba `participante.ID` como id de participante. Pero
en una fila de registro `ID` es el **id del registro**, no el del participante
(ese es `PARTICIPANTE_ID`). Al escribir ese id de registro en
`ALLWAYS_WA_LOG_NOTIF.PARTICIPANTE_ID`, la FK `FK_WA_NOTIF_PART` (que apunta a
`ALLWAYS_PARTICIPANTES`) fallaba porque ese id no existe como participante.

Era un bug latente que afectaba a **toda** validación hecha desde el panel admin.
Los flujos de contraseña (`notifySetupPassword`, etc.) no se veían afectados
porque ahí `participante` sí es una fila real de `ALLWAYS_PARTICIPANTES`.

## Solución

Derivar `participanteId` una sola vez en `sendAndStore`, prefiriendo
`PARTICIPANTE_ID` (presente solo en filas de registro) y cayendo a `ID` para los
callers que pasan una fila real de participante:

```js
const participanteId = participante.PARTICIPANTE_ID || participante.participante_id
  || participante.ID || participante.id;
```

Se aplica en `findOrCreateChat` y en las dos llamadas a `logNotif`. No se modificó
ningún caller, así que ambos tipos de objeto (registro y participante) funcionan.

## Verificación

- `node --check src/services/notificationService.js` → OK.
- Backend reiniciado en producción (`pm2 restart allways-api`) con el fix activo.
- Backfill manual de la fila de log faltante para el registro #204
  (`PARTICIPANTE_ID = 231`, mensaje #443): insertada respetando la FK, lo que
  confirma que la lógica corregida es correcta.

## Contexto relacionado — registro #204

Este bug se detectó mientras se re-aprobaba el registro **#204** (participante
231, Silvia Sánchez, CI 4935213). El registro había sido rechazado porque el
screenshot original de la factura `035-009-0024038` (Farmacenter) estaba cortado
y no mostraba la línea del producto Allways. El cliente reenvió la factura
completa, donde sí figura `10030592 — ALLWAYS MAGNESIUM MALATE FR. X 60 CAPS.`,
por lo que se aprobó:

- Estado `RECHAZADO` → `ACEPTADO`, imagen de factura actualizada (ambas partes
  combinadas en un solo archivo), motivo de rechazo limpiado.
- Cupón generado: `AW-2026-740091` (sorteo **JUNIO**).
- Notificación WhatsApp "ACEPTADO" enviada (mensaje #443).
