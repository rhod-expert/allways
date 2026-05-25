# Redirect do /admin para os dominios externos

O painel administrativo roda em `https://yaguaretex.sanjosesa.com.py/allways/admin/login`.
Os dominios `www.allways.com.py` e `www.sanjosesa.com.py/allways/` sao iframes estaticos
no KingHost e nao tem rota `/admin`. Estes arquivos resolvem isso.

## Opcao A — `.htaccess` (recomendada — cobre deep links)

Subir `admin.htaccess` (renomear para `.htaccess`) ou *append* das duas linhas
`RewriteRule` no `.htaccess` ja existente em cada destino:

| Dominio                                | Caminho no KingHost          |
|----------------------------------------|------------------------------|
| `www.allways.com.py/admin*`            | `/public_html/.htaccess`     |
| `www.sanjosesa.com.py/allways/admin*`  | `/public_html/allways/.htaccess` |

Conteudo das regras:

```apache
RewriteEngine On
RewriteRule ^admin/?$           https://yaguaretex.sanjosesa.com.py/allways/admin/login [R=302,L]
RewriteRule ^admin/(.+)$        https://yaguaretex.sanjosesa.com.py/allways/admin/$1 [R=302,L,QSA]
```

## Opcao B — `index.html` simples (sem mexer em htaccess)

Subir `admin-index.html` renomeado para `index.html` em:

| Dominio                                | Caminho no KingHost                  |
|----------------------------------------|--------------------------------------|
| `www.allways.com.py/admin/`            | `/public_html/admin/index.html`      |
| `www.sanjosesa.com.py/allways/admin/`  | `/public_html/allways/admin/index.html` |

Esta opcao redireciona somente `/admin` e `/admin/`. Deep links como
`/admin/clientes/123` ainda dariam 404. Use Opcao A se quiser cobertura total.

## Teste apos upload

```bash
curl -skI https://www.allways.com.py/admin
curl -skI https://www.sanjosesa.com.py/allways/admin
```

Esperado: `HTTP/2 302` com `Location: https://yaguaretex.sanjosesa.com.py/allways/admin/login`.
