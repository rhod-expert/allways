# Allways Show de Premios — Project Overview

## Purpose
Sweepstakes campaign website for **San Jose Import Export S.A. + Allways Health** (Paraguay).
Participants buy Allways products, upload invoices, receive coupons for monthly prize draws (April-September 2026)
with a final Renault Kwid 0km draw in October 2026. **30 total prizes**.

## Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20.x |
| Backend | Express.js | 4.21.2 |
| Frontend | React + Vite | 18.3 / 6.x |
| CSS | TailwindCSS | 3.4.17 (NOT v4!) |
| Database | Oracle 19C | Client 19.25 (thick mode) |
| ORM/Driver | node-oracledb | 6.7.1 |
| Web server | Nginx | Reverse proxy + SSL |
| Process manager | PM2 | Daemon |
| OS | Debian 13 (trixie) | x86_64 |

## Architecture
```
Browser → Nginx:80/443 → /allways/* (SPA from dist/) 
                        → /allways/api/* (proxy to Express:3001)
                        → Express → Oracle 19C (192.168.1.240:1521/wint)
```

## Key URLs
- Production: http://192.168.1.225/allways/ (and https://yaguaretex.sanjosesa.com.py/allways/)
- API: port 3001 (proxied through nginx)
- Oracle DB: 192.168.1.240:1521/wint (user: allways)

## Language
- UI content: Spanish (Paraguay)
- Code comments: Mix of Spanish/English
- Variable names: English (camelCase)
- SQL columns: UPPERCASE Spanish (Oracle convention)

## Project Path
`/var/www/html/allways/`
