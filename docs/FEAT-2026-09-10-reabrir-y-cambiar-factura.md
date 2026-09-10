# Feat 2026-09-10 — Reabrir un rechazado y cambiar la foto de la factura

**Componente:** `backend/src/controllers/adminController.js`, `backend/src/middleware/upload.js`,
`frontend/src/pages/ClientDetailPage.jsx`
**Branch:** `feat/registros-reabrir-y-cambiar-factura`
**Origen:** dos correcciones que hasta ahora solo se podian hacer con `UPDATE` directo en la base

## Por que

### RECHAZADO era un estado terminal

Ninguna ruta sacaba un registro de `RECHAZADO`:

| Ruta | Estado que exige |
|---|---|
| `PUT /registros/:id/validar` | `PENDIENTE` |
| `PUT /registros/:id/revertir` | `ACEPTADO` |
| `PUT /registros/:id` (editar) | `PENDIENTE` |

Un registro rechazado por error quedaba irrecuperable desde el panel. Y como
`UK_FACTURA_PART` es `UNIQUE (PARTICIPANTE_ID, NUMERO_FACTURA)`, el participante
**tampoco podia volver a cargar esa misma factura**: el rechazo equivocado le
bloqueaba la nota para siempre.

### La foto equivocada

Cuando el participante cargaba la factura de otra compra, la unica salida era
rechazar el registro — lo que, por lo anterior, le impedia volver a cargar la
factura correcta con ese numero.

## Que se agrego

### `PUT /admin/registros/:id/reabrir`

`RECHAZADO` → `PENDIENTE`. Es el espejo de `revertir` (PR #4), en la direccion
opuesta.

Vuelve a **`PENDIENTE`, no directamente a `ACEPTADO`**, para que pase otra vez
por la validacion normal y la aceptacion quede acreditada a quien realmente la
revalide, no a quien reabrio.

`MOTIVO_RECHAZO` se limpia de la fila: dejarlo haria que el registro volviera a
la cola de pendientes cargando una justificacion que ya no aplica. Para no
perder la trazabilidad, **el motivo anterior se preserva en `ALLWAYS_ADMIN_LOG`**
junto con el motivo de la reapertura, que es obligatorio.

`FECHA_VALIDACION` y `VALIDADO_POR` tambien se limpian: mantenerlos acreditaria
la reapertura a quien habia rechazado.

Guarda defensiva: un registro rechazado no deberia tener cupones (solo se emiten
al aceptar, y `revertir` los borra). Si aun asi tuviera, responde 409 en vez de
reabrir, porque aceptarlo de nuevo acuñaria un segundo lote.

### `PUT /admin/registros/:id/imagen-factura`

Reemplaza la foto de la factura (multipart, campo `imagenFactura`). Reusa el
storage, el filtro y el limite de 5 MB del formulario publico, y corre la misma
validacion con `sharp`, de modo que una foto cambiada por un admin pasa por el
mismo control que una cargada por el cliente.

**Bloqueado (409) sobre registros `ACEPTADO`.** Esa foto respalda los cupones ya
emitidos; cambiarla reescribiria la evidencia en silencio. El camino para uno
aceptado es: revertir (anula los cupones) → reabrir → cambiar la foto → aceptar.

**La imagen anterior no se borra.** Queda en disco y ambos nombres van al log,
para poder producir el original si alguna vez se lo cuestiona. Cuesta espacio,
pero son correcciones raras.

Cualquier salida temprana borra el archivo que multer ya escribio en disco, para
no dejar huerfanos en `uploads/facturas`.

## Ambos endpoints

- Exigen motivo y lo registran en `ALLWAYS_ADMIN_LOG`
- Condicionan el `UPDATE` al estado esperado y verifican `rowsAffected === 1`, de
  modo que dos admins simultaneos no apliquen la misma accion dos veces
- Quedan fuera del alcance de `VISUALIZADOR` sin tocar `roles.js`, por ser verbos
  mutantes (la regla es deny-by-default sobre el verbo HTTP)

## Dos bugs que apareceron al probar en el panel

Ambos son deuda de haber probado el backend con `curl` en vez del camino real.

### 1. El FormData salia como JSON

Cambiar la imagen fallaba **siempre** con `"Debes adjuntar la nueva foto de la
factura"`: el servidor no recibia archivo alguno.

La instancia de axios compartida (`services/api.js`) fija
`'Content-Type': 'application/json'` como default para toda request. Al mandar un
`FormData`, ese default pisa el `multipart/form-data; boundary=...` que el
navegador genera, y multer no encuentra nada que parsear.

```js
// El header hay que limpiarlo por request, para que el navegador
// arme el multipart con su boundary.
await api.put(`/admin/registros/${id}/imagen-factura`, form, {
  headers: { 'Content-Type': undefined },
})
```

`curl` no pasa por esa instancia, por eso las pruebas del endpoint daban 200
mientras la interfaz fallaba al 100%.

### 2. El log de auditoria desbordaba la columna

Reabrir devolvia 500 cuando el motivo del rechazo previo era largo:

```
ORA-12899: value too large for column ALLWAYS_ADMIN_LOG.DETALLE
(actual: 512, maximum: 500)
```

`DETALLE` es `VARCHAR2(500)` y `MOTIVO_RECHAZO` **tambien**: un solo motivo
escrito por un admin puede llenar la columna del log por si mismo. La linea de
reabrir concatena el motivo previo mas el de reapertura, sin acotar ninguno.

Se recorta cada texto libre a 180 caracteres y la linea terminada a 500 como red
de seguridad (`clampText` / `logMotivo` / `logDetalle` en `adminController.js`).

> El mismo defecto estaba **latente en `revertirRegistro`** desde el PR #4: mete
> el motivo de rechazo, texto libre sin limite, en esa misma columna de 500.
> Todavia no habia explotado solo porque nadie escribio un motivo lo bastante
> largo. Se corrigio junto.

La prueba original de reabrir no lo detecto porque el registro elegido tenia un
motivo corto.

## Verificacion

| Prueba | Resultado |
|---|---|
| `reabrir` sin motivo | 400 |
| `reabrir` registro inexistente | 404 |
| `reabrir` un registro que no esta RECHAZADO | 400, indicando el estado actual |
| `reabrir` el registro que fallaba (motivo previo de 351 chars) + motivo de 636 chars | 200, `DETALLE` en 461 |
| `imagen-factura` sin archivo | 400 |
| `imagen-factura` con un archivo que no es imagen real | 400 |
| `imagen-factura` sobre RECHAZADO | 200, imagen anterior conservada en disco |
| `imagen-factura` sobre ACEPTADO | 409, sin huerfanos en disco |
| FormData via la instancia de axios real, con y sin el fix | 400 / 200 |

## Sin migracion

No hay cambios de esquema.
