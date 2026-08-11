# Deploy Node.js — rgmtech.com.br (Hostinger)

Este pacote roda o site inteiro (landing + app **Workflow de Profissionais**) num único
processo Node.js, com banco **MySQL**.

> Requer um plano com Node.js: **VPS** da Hostinger (ou hospedagem em nuvem com Node app).
> A hospedagem compartilhada só roda PHP — nesse caso use `deploy/hostinger/` (versão PHP).

## 1. Gerar o pacote

```bash
npm run build:node
```

Isso cria a pasta `dist-node/`:

```
dist-node/
  server.mjs          # servidor Express (site + API)
  api.mjs             # API do Workflow (MySQL)
  public/             # HTML, CSS, JS e imagens do site
  schema.sql          # estrutura do banco
  .env.example        # variáveis de ambiente
  ecosystem.config.cjs# configuração do PM2
  uploads/            # anexos enviados pelo app
  package.json
```

## 2. Banco de dados

No hPanel → **Bancos de dados MySQL**: crie o banco e o usuário.
Depois importe `schema.sql` (phpMyAdmin → Importar, ou via terminal):

```bash
mysql -u USUARIO -p BANCO < schema.sql
```

## 3. Subir para o servidor

```bash
scp -r dist-node/* usuario@SEU_IP:/home/usuario/rgmtech/
ssh usuario@SEU_IP
cd ~/rgmtech
cp .env.example .env    # preencha DB_NAME, DB_USER, DB_PASSWORD
npm install --omit=dev
node server.mjs         # teste rápido: http://SEU_IP:3000
```

## 4. Manter no ar com PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup            # execute o comando que ele imprimir
```

## 5. Domínio e HTTPS (Nginx)

No VPS, aponte o `rgmtech.com.br` para o IP (registros A `@` e `www`) e configure o proxy:

```nginx
server {
  server_name rgmtech.com.br www.rgmtech.com.br;
  client_max_body_size 25M;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Depois gere o certificado: `certbot --nginx -d rgmtech.com.br -d www.rgmtech.com.br`.

> Se usar o painel "Node.js app" da Hostinger em vez do Nginx manual, aponte a pasta da
> aplicação para `~/rgmtech`, o arquivo de inicialização para `server.mjs` e as variáveis
> de ambiente do `.env` no próprio painel.

## 6. Primeiro acesso

1. Abra `https://rgmtech.com.br/workflow`.
2. Clique em **Criar conta** e cadastre os usuários da equipe.
3. Depois, no `.env`, coloque `ALLOW_SIGNUP=false` e reinicie (`pm2 restart rgmtech`).

## Atualizações futuras

```bash
npm run build:node
scp -r dist-node/public dist-node/server.mjs dist-node/api.mjs usuario@SEU_IP:/home/usuario/rgmtech/
ssh usuario@SEU_IP 'pm2 restart rgmtech'
```

O `.env` e a pasta `uploads/` não são sobrescritos.

## Endpoints da API

Tudo em `/api?route=...` (mesmo contrato do front em `src/lib/api-client.ts`):
`auth/signup`, `auth/login`, `auth/logout`, `auth/me`, `cases`, `case`,
`case/advance`, `interviews`, `interview`, `attachments`, `attachment`.
Todas as rotas, exceto login/cadastro, exigem o token `Authorization: Bearer`.
