# Allways — Incidente de infraestructura (2026-05-29) y Runbook

> **Nota:** Los valores sensibles (IPs públicas, puertos SSH, e-mails y credenciales) se omiten en este documento. El equipo de red los tiene en su gestor de secretos / inventario interno. Las IPs públicas del pool del ISP se referencian como `IP-A`, `IP-B` e `IP-C`.

> **Resumen en una línea:** El sitio se cayó porque (1) el certificado SSL de `yaguaretex.sanjosesa.com.py` venció el 29/05/2026 13:28 GMT y (2) la IP pública del ISP rota en un pool de 3 direcciones, una de las cuales no reenvía el tráfico entrante. **La app nunca estuvo caída** — respondía 200 en todos los niveles internos.

---

## 1. Arquitectura de acceso (cadena del request)

### Usuarios externos
```
Navegador → https://www.sanjosesa.com.py/allways/   (KingHost, estático)
   └─ index.html embebe un <iframe src="https://yaguaretex.sanjosesa.com.py/allways/">
        └─ DNS: yaguaretex → CNAME vrsanjose.no-ip.net → IP pública dinámica (pool del ISP)
             └─ ISP/CPE → WAN NethServer (eth1)
                  └─ NethServer: net_dnat DNAT :443 → srvfacturas
                       └─ srvfacturas (Apache, termina TLS) → http://allways-app/allways/
                            └─ allways-app (Nginx) → estáticos o proxy → PM2 :3001 (API)
```

### Servidores

| Servidor | IP (LAN) | Rol | Acceso |
|---|---|---|---|
| allways-app | 192.168.1.225 | Nginx + PM2 (app) | SSH (clave) |
| srvfacturas | 192.168.1.234 | Apache (terminación TLS, proxy reverso) | SSH (password) |
| NethServer (sjfw) | 192.168.1.200 (LAN) | Firewall, DNAT, DNS, ddclient | SSH (clave) |
| KingHost | hosting externo | sirve `www.sanjosesa.com.py/allways/index.html` | FTP/cPanel |

> El NethServer **también** tiene un vhost httpd para `yaguaretex` (proxy → allways-app) con cert autofirmado antiguo, pero es **vestigial**: el tráfico externo :443 se DNAT-ea a srvfacturas antes de llegar al httpd local. El terminador TLS real es **srvfacturas**.

---

## 2. Causas raíz

### 2.1 Certificado SSL vencido (causa del disparo, 29/05 13:28 GMT)
- Cert Let's Encrypt de `yaguaretex.sanjosesa.com.py` en srvfacturas venció el **29/05/2026 13:28 GMT**.
- La auto-renovación de **certbot** (authenticator `apache`, método **http-01 / puerto 80**) venía fallando desde el 27/05:
  - El **puerto 80 entrante** del firewall NethServer está DNAT-eado a **otro servidor interno** (regla "PEDIDOS SIN CARGAR"), **no a srvfacturas** → el desafío ACME `/.well-known/acme-challenge/...` recibía **404** o **timeout** y nunca validaba.
  - Además, el **puerto 80 entrante está bloqueado por el ISP** en las IPs del pool (timeout directo).

### 2.2 Pool de IPs públicas dinámicas + inbound desigual
- El enlace presenta un **pool rotativo de 3 IPs públicas**:

  | IP pública | ¿Reenvía inbound :443 → srvfacturas? |
  |---|---|
  | `IP-A` | ✅ Sí |
  | `IP-B` | ✅ Sí |
  | `IP-C` | ❌ **No** (`ECONNREFUSED`) |

- **`ddclient`** (en NethServer, detección por web) detecta la IP de **salida** —que rota— y publica la que le toca en **no-ip** (`vrsanjose.no-ip.net`, TTL 60s) → el DNS público flapea entre las 3 IPs.
- Cuando el DDNS publica `IP-C`, el sitio (y todos los servicios remotos de la empresa) quedan inaccesibles (~1 de cada 4 veces).
- ⚠️ **`vrsanjose.no-ip.net` es el DDNS de TODA la empresa** (todos los port-forwards de `net_dnat`: RDP, ERP, webservices), no solo Allways.

### 2.3 Hairpin NAT con IP obsoleta (afecta solo LAN interna)
- `/etc/shorewall/started` resuelve la IP pública vía `dig` **solo al iniciar shorewall** y la "congela" en reglas DNAT/SNAT. Al rotar la IP, la regla queda obsoleta y los usuarios **internos** que resuelven `yaguaretex` a la IP vigente no son redirigidos → timeout.

---

## 3. Remediación aplicada (2026-05-29)

### ✅ Certificado renovado vía acme.sh + tls-alpn-01
Como el puerto 80 no es viable (DNAT a otro server + bloqueo ISP) y el `standalone` de certbot no soporta tls-alpn-01, se migró a **acme.sh** usando el desafío **tls-alpn-01 (puerto 443)** — que sí llega a srvfacturas.

Pasos ejecutados en srvfacturas:
```bash
apt-get install -y socat
curl https://get.acme.sh | sh -s email=<email-admin>
~/.acme.sh/acme.sh --set-default-ca --server letsencrypt

~/.acme.sh/acme.sh --issue --alpn -d yaguaretex.sanjosesa.com.py \
  --server letsencrypt \
  --pre-hook  'systemctl stop apache2' \
  --post-hook 'systemctl start apache2'

mkdir -p /etc/ssl/acme/yaguaretex.sanjosesa.com.py
~/.acme.sh/acme.sh --install-cert -d yaguaretex.sanjosesa.com.py \
  --key-file       /etc/ssl/acme/yaguaretex.sanjosesa.com.py/privkey.pem \
  --fullchain-file /etc/ssl/acme/yaguaretex.sanjosesa.com.py/fullchain.pem \
  --reloadcmd 'systemctl reload apache2'
```
Y se repuntó el vhost de Apache:
- Archivo: `/etc/apache2/sites-enabled/000-default-le-ssl.conf` (backup `.bak-acme`)
- `SSLCertificateFile`    → `/etc/ssl/acme/yaguaretex.sanjosesa.com.py/fullchain.pem`
- `SSLCertificateKeyFile` → `/etc/ssl/acme/yaguaretex.sanjosesa.com.py/privkey.pem`

**Resultado:** cert válido **2026-05-29 → 2026-08-27**, auto-renovación por cron de acme.sh (con hooks que paran/levantan Apache). Verificado externamente: `https://yaguaretex.sanjosesa.com.py/allways/api/health` → **200 OK, TLS válido**.

> ⚠️ **El certbot viejo queda abandonado para este dominio.** No usar `certbot renew` para `yaguaretex.sanjosesa.com.py` (sigue fallando por el puerto 80). La gestión es por **acme.sh**.

---

## 4. Pendientes

| # | Pendiente | Responsable | Detalle |
|---|---|---|---|
| 1 | **Port-forward de `IP-C`** | ISP | Que reenvíe :443 (y :80) a la WAN del NethServer igual que las otras 2 IPs. Ideal: **IP estática única**. Mientras no se haga, el sitio cae ~25% del tiempo. |
| 2 | **`www.allways.com.py`** | Cloudflare | Dominio en Cloudflare con origin mal apuntado (devuelve 404 de ISPConfig). Nunca se conectó a la app. Apuntar origin/túnel a la app. |
| 3 | **Hairpin shorewall** | NethServer | Cuando la IP quede estable, `shorewall restart` refresca la regla para usuarios LAN. |
| 4 | **iframe → hostname estable** | KingHost / Cloudflare | Apuntar el `src` del iframe a un host vía Cloudflare (estable) en vez de `yaguaretex` (IP intermitente) elimina el problema de raíz. La CSP ya autoriza `www.allways.com.py`. |

---

## 5. Sobre `index.html` del iframe (KingHost)

`https://www.sanjosesa.com.py/allways/index.html` embebe:
```html
<iframe src="https://yaguaretex.sanjosesa.com.py/allways/" allow="camera; clipboard-write" ...>
```
- **CSP del sitio remoto** (servida por Nginx en allways-app) permite el embed:
  `frame-ancestors 'self' https://www.sanjosesa.com.py https://sanjosesa.com.py https://www.allways.com.py https://allways.com.py`
- No usa `X-Frame-Options` (correcto; Chrome lo trataría como DENY).
- El mensaje **"No se pudo cargar la plataforma"** lo dispara un `setTimeout(showError, 10000)` cuando el iframe **no dispara `load`** en 10s. El handler `addEventListener('error', ...)` es código muerto para fallas de red/TLS (los navegadores no lo disparan en iframes). Por eso, cert vencido o IP en `IP-C` → sin `load` → error a los 10s. **Es síntoma de las causas de la sección 2, no un bug del archivo.**

---

## 6. Runbook — diagnóstico rápido (< 2 min)

Ejecutar en orden. Si un nivel responde 200, el problema está **aguas arriba** de ese punto.

```bash
# 1) App local (en allways-app) — debe dar 200
curl -s http://localhost:3001/api/health
curl -sk http://192.168.1.225/allways/api/health

# 2) Vía srvfacturas con Host header — debe dar 200 en ~20ms
curl -sk -H "Host: yaguaretex.sanjosesa.com.py" https://192.168.1.234/allways/api/health

# 3) Cert de srvfacturas vigente? (paso 0 ante "site caído")
echo | openssl s_client -connect 192.168.1.234:443 -servername yaguaretex.sanjosesa.com.py 2>/dev/null \
  | openssl x509 -noout -dates

# 4) Qué IP publica el DNS ahora (puede flapear cada 60s)
dig +short @8.8.8.8 yaguaretex.sanjosesa.com.py

# 5) Pool de IPs de salida del ISP (muestrear varias veces, en NethServer)
for i in $(seq 1 8); do curl -s -m6 https://api.ipify.org; echo; done | sort | uniq -c

# 6) ¿Qué IP del pool reenvía inbound :443? (probar desde INTERNET, no LAN)
#    "certificate ..." / respuesta = llega a srvfacturas ✅ ; "ECONNREFUSED"/timeout = no reenvía ❌
#    (usar un host externo o un checker de puertos contra cada IP del pool)
```

**Interpretación:**
- Niveles 1–2 dan 200 pero el sitio "no carga" → problema de **cert** (paso 3) o de **IP/DNS** (pasos 4–6).
- DNS apunta a `IP-C` → caída esperada hasta arreglar el port-forward del ISP.
- Cert vencido → renovar con acme.sh (sección 3). **No** usar certbot.

---

## 7. Renovar el cert manualmente (si hiciera falta)

```bash
# En srvfacturas. tls-alpn-01 usa el :443; los hooks paran/levantan Apache automáticamente.
~/.acme.sh/acme.sh --renew --alpn -d yaguaretex.sanjosesa.com.py --force
# El --install-cert + reload ya están memorizados en la config de acme.sh.
```
> La emisión requiere que el DNS apunte a una IP que reenvíe inbound (`IP-A` o `IP-B`). Si falla por conexión, reintentar (probable que el DNS estuviera en `IP-C`).

---

*Documentado el 2026-05-29 tras el incidente. Detalles sensibles (IPs públicas, puertos, credenciales) en el inventario interno del equipo de red.*
