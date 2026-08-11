# Deploy Node.js — rgmtech.com.br (Hostinger)

O site inteiro (landing + app **Workflow de Profissionais** + API) roda num único
processo Node.js, na mesma porta e no mesmo domínio, com banco **MySQL**.

Há dois caminhos. O primeiro é o recomendado.

---

## A. Deploy direto do repositório (painel "Node.js app" da Hostinger)

O painel clona o repositório, roda o build e inicia o arquivo configurado.

### Configuração no hPanel

| Campo | Valor |
| --- | --- |
| Tipo de aplicação | Node.js |
| Versão do Node | 20 ou superior (testado no 22) |
| Application root | a pasta do repositório (onde está o `package.json`) |
| Startup file | `hostinger-server.mjs` |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |

> **Não configure `PORT`.** A plataforma injeta a porta e o servidor lê
> `process.env.PORT`. Fixar o valor faz a aplicação subir na porta errada.

### Variáveis de ambiente

Obrigatórias:

```
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=seu_banco
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
```

Primeiro acesso (só agem enquanto a tabela `users` estiver vazia):

```
ADMIN_USERNAME=admin@rgmtech.com.br
ADMIN_PASSWORD=uma-senha-forte
ADMIN_NAME=Administrador
```

Opcionais: `UPLOADS_DIR` (padrão `./uploads`), `ALLOW_SIGNUP`,
`SIGNUP_EMAIL_DOMAIN`, `SESSION_COOKIE`, `SESSION_DAYS`,
`SESSION_COOKIE_SECURE`. Ver `env.example`.

### Banco de dados

No hPanel → **Bancos de dados MySQL**: crie o banco e o usuário, depois importe
`deploy/node/schema.sql` pelo phpMyAdmin (ou `mysql -u USER -p BANCO < schema.sql`).

### Como validar depois do deploy

```bash
curl -s https://rgmtech.com.br/api/health
# {"ok":true,"version":"1.0.0","setup_required":false}
```

Se vier HTML em vez de JSON, o domínio ainda está servindo o site estático —
o app Node não está no ar (veja "Solução de problemas").

---

## B. Pacote pronto para VPS (`dist-node/`)

Para um VPS onde você mesmo sobe os arquivos:

```bash
npm run build:node     # gera dist-node/
scp -r dist-node/* usuario@SEU_IP:/home/usuario/rgmtech/
ssh usuario@SEU_IP
cd ~/rgmtech
cp .env.example .env   # preencha DB_* e ADMIN_*
npm install --omit=dev
node server.mjs        # teste: http://SEU_IP:3000
```

Manter no ar com PM2:

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

Nginx na frente (`proxy_pass http://127.0.0.1:3000`), depois
`certbot --nginx -d rgmtech.com.br -d www.rgmtech.com.br`.

> Diferença entre A e B: em **A** o SSR do TanStack Start continua ativo
> (páginas renderizadas no servidor a cada request). Em **B** o `build:node`
> pré-renderiza as páginas para HTML estático e o Express serve os arquivos.

---

## Como o servidor é montado

`hostinger-server.mjs` (caminho A) registra, **nesta ordem**:

1. `/api/*` → `deploy/node/api.mjs` (Express Router + MySQL);
2. `.output/public` → assets do build (`express.static`, com `index: false`);
3. tudo o mais → SSR do TanStack Start, via o handler Node exportado pelo build
   do Nitro (preset `node-middleware`).

A ordem é o ponto crítico: com o estático ou o SSR na frente, `/api/...` cairia
na página 404 do frontend e a API responderia HTML — foi exatamente esse o modo
de falha anterior.

`npm run build` usa o preset `node-middleware` por padrão (antes era
`cloudflare`, que gera um bundle de Workers que o Node não executa). Para outro
alvo: `NITRO_PRESET=cloudflare-module npm run build`.

O script `scripts/ensure-build-deps.mjs` roda antes do `vite build`: com
`NODE_ENV=production` o `npm install` pula as devDependencies e o vite ficaria
de fora, então ele reinstala com `--include=dev` quando detecta a ausência.

---

## Autenticação

- Sessão em cookie **httpOnly**, `SameSite=Lax`, `Secure` quando
  `NODE_ENV=production`. `app.set("trust proxy", 1)` está ativo para que o
  HTTPS do proxy da Hostinger seja reconhecido.
- O header `Authorization: Bearer <token>` continua aceito (o front atual
  guarda o token no `localStorage`).
- **Todas** as rotas exigem sessão, exceto `health` e `auth/login`.
  `auth/signup` é liberada apenas enquanto não existe nenhum usuário.

### Primeiro acesso

1. Defina `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_NAME` e reinicie.
   O usuário é criado **somente** se a tabela `users` estiver vazia; reiniciar
   depois não recria a conta nem troca a senha.
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

`GET /api/health` responde `{ ok, version, setup_required }` e não exige sessão —
use para checar se o Node está no ar. Com o banco fora do ar ele responde
`ok: false` e `setup_required: null` (em vez de derrubar a aplicação).

---

## Solução de problemas

**`/api/health` devolve HTML da landing** — o domínio está servindo arquivos
estáticos, não o app Node. No hPanel, confira se a aplicação Node está
"Running" e se o domínio aponta para ela (e não para `public_html`).
Um `server: hcdn` na resposta indica que ainda é o CDN estático.

**`vite: not found` no build** — `NODE_ENV=production` cortou as
devDependencies. O `scripts/ensure-build-deps.mjs` cobre isso; se o painel
ignorar o script, use `npm install --include=dev && npm run build` como build
command.

**`Build não encontrado em .output/server/index.mjs`** — o build não rodou ou
rodou com outro preset. Rode `npm run build` na pasta da aplicação.

**Login responde 401 com as credenciais certas** — confira se o banco importado
tem a tabela `users` e se `ADMIN_USERNAME` foi gravado em minúsculas (o login
normaliza o identificador para minúsculas).
