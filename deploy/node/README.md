# Deploy Node.js — rgmtech.com.br

Este pacote roda o site inteiro (landing + app **Workflow de Profissionais** + API)
num único processo Node.js, na mesma porta e no mesmo domínio, com banco **MySQL**.

> [!IMPORTANT]
> **Requer um plano com Node.js: VPS da Hostinger** (ou hospedagem em nuvem com
> Node app). A **hospedagem compartilhada da Hostinger só roda PHP** — nela nada
> deste diretório funciona, nem `hostinger-server.mjs`, nem `npm start`.
> Para o compartilhado use `deploy/hostinger/` (versão PHP + HTML estático),
> gerado por `npm run build:hostinger`.

Um 503 do LiteSpeed logo após o deploy é o sintoma clássico de tentar rodar o
caminho Node em plano compartilhado: não há processo Node para o servidor web
encaminhar as requisições.

## Qual caminho é o seu

| Hospedagem | Build | O que sobe | SSR? | API |
| --- | --- | --- | --- | --- |
| Compartilhada (PHP) | `npm run build:hostinger` | conteúdo de `dist-hostinger/` no `public_html` | não, HTML pré-renderizado | PHP (`deploy/hostinger/api/`) |
| VPS / Node app | `npm run build:server` | o repositório + `.output/` | sim | Node (`deploy/node/api.mjs`) |

O resto deste documento cobre **só o segundo caso**.

---

## A. VPS (recomendado quando há Node)

### 1. Banco de dados

```bash
sudo mysql -e "CREATE DATABASE workflow CHARACTER SET utf8mb4;
               CREATE USER 'workflow'@'localhost' IDENTIFIED BY 'TROQUE_ESTA_SENHA';
               GRANT ALL ON workflow.* TO 'workflow'@'localhost'; FLUSH PRIVILEGES;"
```

### 2. Código, build e configuração

```bash
git clone https://github.com/mellrodrigo/consult-flare.git ~/rgmtech && cd ~/rgmtech
npm install
npm run build:server
cp deploy/node/env.example .env      # preencha DB_* e ADMIN_*
```

### 3. Importar o schema e testar

```bash
mysql -u workflow -p workflow < deploy/node/schema.sql
NODE_ENV=production PORT=3000 npm start
```

Em outro terminal, antes de mexer no DNS:

```bash
curl -s localhost:3000/api/health          # {"ok":true,...,"setup_required":false}
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/          # 200
```

`setup_required: false` confirma que o usuário de `ADMIN_USERNAME` foi criado.

### 4. Manter no ar com PM2

```bash
sudo npm install -g pm2
pm2 start hostinger-server.mjs --name rgmtech --update-env
pm2 save && pm2 startup      # execute o comando que ele imprimir
```

### 5. Nginx e HTTPS

O arquivo pronto está em `deploy/node/nginx-rgmtech.conf`:

```bash
sudo cp deploy/node/nginx-rgmtech.conf /etc/nginx/sites-available/rgmtech
sudo ln -s /etc/nginx/sites-available/rgmtech /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 6. DNS e certificado

Só agora aponte `rgmtech.com.br` (registros A de `@` e `www`) para o IP do VPS.
Depois que propagar:

```bash
sudo certbot --nginx -d rgmtech.com.br -d www.rgmtech.com.br
```

O certbot adiciona o bloco 443 e o redirect. Verifique no fim:

```bash
curl -s https://rgmtech.com.br/api/health
```

### Atualizações depois disso

```bash
cd ~/rgmtech && git pull && npm install && npm run build:server && pm2 restart rgmtech
```

O `X-Forwarded-Proto` importa: é ele que faz o `trust proxy` do Express
reconhecer o HTTPS e aceitar o cookie de sessão com `Secure`.

---

## B. Painel "Node.js app" (planos que oferecem Node)

| Campo | Valor |
| --- | --- |
| Versão do Node | 20 ou superior |
| Application root | a pasta do repositório |
| Startup file | `hostinger-server.mjs` |
| Build command | `npm install && npm run build:server` |
| Start command | `npm start` |

> **Não configure `PORT`.** A plataforma injeta a porta e o servidor lê
> `process.env.PORT`.

Variáveis obrigatórias: `NODE_ENV=production`, `DB_HOST`, `DB_PORT`, `DB_NAME`,
`DB_USER`, `DB_PASSWORD`. Para o primeiro acesso: `ADMIN_USERNAME`,
`ADMIN_PASSWORD`, `ADMIN_NAME`. Opcionais em `env.example`.

---

## C. Pacote pronto para copiar (`dist-node/`)

`npm run build:node` gera uma pasta autocontida com o site pré-renderizado e o
servidor Express, para subir por `scp` sem clonar o repositório no servidor:

```bash
npm run build:node
scp -r dist-node/* usuario@SEU_IP:/home/usuario/rgmtech/
ssh usuario@SEU_IP 'cd ~/rgmtech && cp .env.example .env && npm install --omit=dev && node server.mjs'
```

Diferença para o caminho A: aqui as páginas são pré-renderizadas em HTML e
servidas como arquivos; não há SSR a cada request.

---

## Como o servidor é montado (caminhos A e B)

`hostinger-server.mjs` registra, **nesta ordem**:

1. `/api/*` → `deploy/node/api.mjs` (Express Router + MySQL);
2. `.output/public` → assets do build (`express.static`, com `index: false`);
3. tudo o mais → SSR do TanStack Start, via o handler Node exportado pelo build
   do Nitro (preset `node-middleware`).

A ordem é o ponto crítico: com o estático ou o SSR na frente, `/api/...` cairia
na página 404 do frontend e a API responderia HTML.

`scripts/ensure-build-deps.mjs` roda antes do build: com `NODE_ENV=production` o
`npm install` pula as devDependencies e o vite e seus plugins ficariam de fora.
Ele confere **todas** as devDependencies declaradas — checar só o `vite` não
basta, porque ele entra como dependência transitiva e mascara a ausência do
`@lovable.dev/vite-tanstack-config`, que o `vite.config.ts` importa.

---

## Autenticação

- Sessão em cookie **httpOnly**, `SameSite=Lax`, `Secure` quando
  `NODE_ENV=production`, com `app.set("trust proxy", 1)`.
- `Authorization: Bearer <token>` continua aceito (o front guarda o token no
  `localStorage`).
- **Todas** as rotas exigem sessão, exceto `health` e `auth/login`.
  `auth/signup` é liberada apenas enquanto não existe nenhum usuário.

### Primeiro acesso

1. Defina `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_NAME` e reinicie. O
   usuário é criado **somente** com a tabela `users` vazia; reiniciar depois não
   recria a conta nem troca a senha.
2. Ou abra `/workflow` e use **Criar conta** enquanto `setup_required` for
   `true` em `/api/health`.
3. Com a equipe cadastrada, coloque `ALLOW_SIGNUP=false` e reinicie.

---

## Endpoints da API

Dois formatos, equivalentes:

```
/api/auth/login                    # por caminho
/api/index.php?route=auth/login    # contrato antigo, usado por src/lib/api-client.ts
```

Rotas: `health`, `auth/login`, `auth/signup`, `auth/logout`, `auth/me`,
`cases`, `case`, `case/advance`, `interviews`, `interview`, `attachments`,
`attachment`.

`GET /api/health` responde `{ ok, version, setup_required }` sem exigir sessão —
use para checar se o Node está no ar. Com o banco fora do ar responde
`ok: false` em vez de derrubar a aplicação.

---

## Solução de problemas

**503 do LiteSpeed** — não há processo Node respondendo. Primeiro confirme que o
plano tem Node.js; no compartilhado, não tem (veja o aviso no topo).

**`/api/health` devolve HTML** — o domínio está servindo arquivos estáticos, e
não a aplicação Node. Um `server: hcdn` na resposta confirma que é o CDN.

**`vite: not found` ou `Cannot find package '@lovable.dev/vite-tanstack-config'`**
— `NODE_ENV=production` cortou as devDependencies. É o que o
`scripts/ensure-build-deps.mjs` resolve; se o painel ignorar o script, use
`npm install --include=dev && npm run build:server`.

**`Build não encontrado em .output/server/index.mjs`** — o build não rodou.

**Login 401 com as credenciais certas** — o identificador é normalizado para
minúsculas; confira o valor gravado em `users.email`.
