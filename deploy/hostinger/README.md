# Deploy na Hostinger (hospedagem compartilhada)

O site RGMtech roda como **HTML estático + JS** (Apache) e a aplicação de Workflow usa uma
**API em PHP + MySQL** — tudo dentro do mesmo `public_html`. Não é necessário Node no servidor.

```
public_html/
├── index.html                         ← landing page
├── solucoes/workflow-profissionais.html
├── workflow.html                      ← aplicação
├── assets/                            ← JS, CSS, imagens
├── .htaccess                          ← HTTPS, rotas amigáveis, cache
└── api/                               ← backend PHP
    ├── index.php
    ├── config.php                     ← você cria a partir do config.example.php
    ├── schema.sql
    └── uploads/                       ← anexos (protegida por .htaccess)
```

## 1. Gerar o pacote

Na sua máquina, na raiz do projeto:

```bash
npm install
node deploy/hostinger/build.mjs
```

Isso cria a pasta **`dist-hostinger/`** com tudo pronto.

## 2. Criar o banco MySQL no hPanel

1. hPanel → **Bancos de Dados → MySQL**.
2. Crie o banco e o usuário (anote nome, usuário e senha).
3. Abra o **phpMyAdmin** desse banco e importe/execute o arquivo
   `deploy/hostinger/api/schema.sql`.

## 3. Configurar a API

Copie `api/config.example.php` para `api/config.php` e preencha:

```php
'db_host' => 'localhost',
'db_name' => 'u123456789_rgm',
'db_user' => 'u123456789_rgm',
'db_pass' => 'sua-senha',
'app_secret' => 'uma-frase-longa-e-aleatoria',
'allow_signup' => true,   // deixe true até criar seu usuário, depois mude para false
```

> Dica para gerar o `app_secret`: qualquer texto longo aleatório (40+ caracteres).

## 4. Subir os arquivos

hPanel → **Gerenciador de Arquivos** → entre em `public_html` e envie **todo o conteúdo**
de `dist-hostinger/` (inclusive `.htaccess`, que é um arquivo oculto — ative
"mostrar arquivos ocultos" no gerenciador).

Permissões: a pasta `api/uploads` precisa ser gravável (755 costuma bastar na Hostinger).

## 5. Primeiro acesso

1. Acesse `https://seudominio.com.br/workflow`.
2. Clique em **Criar conta** e cadastre seu usuário.
3. Depois disso, edite `api/config.php` e coloque `'allow_signup' => false`
   para impedir cadastros de terceiros.

## 6. SSL e domínio

hPanel → **Segurança → SSL** → emitir certificado gratuito. O `.htaccess` já força HTTPS.

## Atualizações futuras

Rode `node deploy/hostinger/build.mjs` de novo e reenvie os arquivos.
**Não sobrescreva** `api/config.php` nem a pasta `api/uploads`.

## Observações

- Rotas amigáveis (`/workflow`, `/solucoes/workflow-profissionais`) funcionam pelo `.htaccess`.
- A API responde em `/api/index.php`; o front usa caminho relativo, então funciona em
  qualquer domínio sem reconfigurar.
- Anexos ficam em `api/uploads`, fora do alcance direto do navegador — só saem pela API,
  autenticados.
