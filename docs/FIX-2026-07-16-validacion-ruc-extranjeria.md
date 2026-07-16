# Fix 2026-07-16 — El formulario de registro rechazaba RUC y C. Extranjeria

**Componente:** `frontend/src/utils/validators.js`, `backend/src/utils/cedula.js` (nuevo)
**Branch / PR:** `fix/validacion-ruc-extranjeria` → PR #7
**Severidad:** alta (bloqueaba registros reales en produccion)

## Sintoma

El campo esta rotulado **"CI/RUC o C. Extranjeria *"**, pero al ingresar un RUC
valido como `4836971-3` el formulario devolvia:

```
La cedula debe tener entre 5 y 8 digitos numericos
```

Los usuarios lo sorteaban borrando el `-3` y enviando solo `4836971`, perdiendo la
identificacion del RUC. Llegaron reclamos por WhatsApp.

## Causa raiz

Dos bugs independientes en el mismo campo:

1. **La validacion solo aceptaba CI.** `validateCedula` usaba `/^\d{5,8}$/`
   (`validators.js:7`), que rechaza tanto el guion del RUC como las letras de una
   cedula de extranjeria.
2. **`inputMode="numeric"` en el input** (`RegisterPage.jsx`) forzaba teclado
   numerico en movil. Aun con la regex corregida, un usuario en celular no habria
   podido tipear el guion.

Vale aclarar dos cosas que **no** eran el problema:

- **No habia validacion de formato en el backend.** `registrationService` solo
  chequeaba que el campo no estuviera vacio. El toast
  `"Error al enviar el registro. Intente nuevamente."` es el fallback generico de
  `RegisterPage.jsx:231`; el submit ni siquiera llegaba a la API porque la
  validacion del front cortaba antes.
- **La columna nunca fue el limite.** `CEDULA` ya era `VARCHAR2(20)`, de sobra
  para un RUC.

## Decision de negocio: RUC → CI

Un RUC paraguayo es la CI del titular mas un digito verificador: **es la misma
persona**. Como `CEDULA` es la clave UNIQUE del participante y los cupones son
acumulativos, tratar `4836971` y `4836971-3` como documentos distintos habria
partido a una persona en dos participantes con los cupones divididos entre ambos
(ej.: entrar al sorteo del Fiat Mobi dos veces con 3 y 2 cupones en vez de una vez
con 5). Tambien rompia la consulta de cupones: quien se registraba con RUC no se
encontraba tipeando su CI.

Se opto por **normalizar a la CI al guardar**. Fiscalmente el RUC se pierde, pero
para un sorteo lo unico que importa es identificar a la persona, y la CI ya lo hace.

## Solucion

Nuevo `backend/src/utils/cedula.js` con `normalizeCedula` / `isValidCedula`,
espejado en `frontend/src/utils/validators.js`:

| Formato | Regex | Normalizado |
|---|---|---|
| CI | `^\d{5,8}$` | tal cual |
| RUC | `^(\d{5,8})-\d$` | se descarta el digito verificador |
| C. Extranjeria | `^(?=.*[A-Z])[A-Z0-9]{5,15}$` | uppercase |

La extranjeria **exige al menos una letra**: sin letra es una CI y debe cumplir el
largo de 5-8, de modo que un numero de 12 digitos no pasa como extranjeria.

La normalizacion se aplica en el backend, no solo en el form, porque la API es
publica: una llamada directa igual grabaria con guion y romperia la identidad. Los
tres puntos que usan la cedula como clave quedaron cubiertos:

- `registrationService.register` (alta de participante)
- `couponService.consultarPorCedula` (consulta publica)
- `clientAuthService.findByCedulaForAuth` (login del area de cliente)

## Migracion / backfill

**Ninguno.** Se consulto produccion: **0 de 205 participantes** tenian caracteres
no numericos en `CEDULA` — la regex vieja bloqueaba todo, asi que los datos
existentes ya estan en forma CI normalizada. La constraint UNIQUE no cambia.

```sql
SELECT ID, CEDULA FROM ALLWAYS_PARTICIPANTES WHERE REGEXP_LIKE(CEDULA, '[^0-9]');
-- 0 filas
```

## Verificacion

Contra la API real en `localhost:3001`:

- **Identidad unificada:** el participante *José benigno Gomez vera* (CI `1070631`,
  3 cupones) ahora se encuentra tipeando `1070631`, `1070631-4` o `1.070.631` —
  los tres devuelven los mismos 3 cupones. Antes el RUC devolvia vacio.
- **`POST /api/registro`** (sin imagen a proposito, cero escrituras en produccion):
  `4836971-3`, `80012345-6` y `AB123456` pasan la validacion de cedula y avanzan
  hasta el chequeo de imagen; `123` y `abc-def` se rechazan con el mensaje nuevo.
- Los casos de test corren identicos en ambos lados (front y back).

## Nota de deploy

El sitio es PWA: el service worker sirve contenido cacheado. Para verificar el
cambio en el navegador hay que desregistrar el SW o hacer hard-refresh, si no se ve
la version vieja.
