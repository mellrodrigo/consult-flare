<?php
// Configuração do backend — edite com os dados do seu banco na Hostinger (hPanel > Bancos de dados MySQL).

return [
    'db_host' => 'localhost',
    'db_name' => 'SEU_BANCO',
    'db_user' => 'SEU_USUARIO',
    'db_pass' => 'SUA_SENHA',

    // Pasta onde os arquivos enviados serão gravados.
    // Recomendado: uma pasta FORA de public_html (ex.: /home/uXXXXX/workflow-uploads).
    'uploads_dir' => __DIR__ . '/../../workflow-uploads',

    // Permite criar novas contas pela tela de login. Depois de criar os usuários
    // da equipe, troque para false para fechar o cadastro.
    'allow_signup' => true,

    // Se quiser restringir o cadastro a um domínio de e-mail, preencha (ex.: 'rgmtech.com.br').
    'signup_email_domain' => '',
];
