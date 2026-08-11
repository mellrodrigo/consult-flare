<?php
declare(strict_types=1);

// Roteador único da API do Workflow (PHP 8 + MySQL) para hospedagem compartilhada Hostinger.
// Coloque esta pasta em public_html/api/ e copie config.example.php para config.php.

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$config = require __DIR__ . '/config.php';

function jsonOut(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $message, int $status = 400): never
{
    jsonOut(['error' => $message], $status);
}

function uuid(): string
{
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

function db(array $config): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4",
                $config['db_user'],
                $config['db_pass'],
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
            );
        } catch (Throwable) {
            fail('Falha ao conectar no banco de dados.', 500);
        }
    }
    return $pdo;
}

function body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function bearer(): ?string
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    foreach ($headers as $k => $v) {
        if (strtolower($k) === 'authorization' && stripos($v, 'Bearer ') === 0) {
            return substr($v, 7);
        }
    }
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    return stripos($h, 'Bearer ') === 0 ? substr($h, 7) : null;
}

function currentUser(array $config): ?array
{
    $token = bearer();
    if (!$token) {
        return null;
    }
    $stmt = db($config)->prepare(
        'SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token = ? AND s.expires_at > NOW()'
    );
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function requireUser(array $config): array
{
    $user = currentUser($config);
    if (!$user) {
        fail('Não autenticado.', 401);
    }
    return $user;
}

$method = $_SERVER['REQUEST_METHOD'];
$route = trim((string) ($_GET['route'] ?? ''), '/');
$id = (string) ($_GET['id'] ?? '');

$CASE_FIELDS = ['title', 'cand_name', 'cand_email', 'cand_phone', 'cand_linkedin', 'role', 'manager', 'area', 'notes'];

try {
    switch ("$method $route") {
        // ---------- Autenticação ----------
        case 'POST auth/signup': {
            if (!$config['allow_signup']) {
                fail('Cadastro desativado. Peça acesso ao administrador.', 403);
            }
            $in = body();
            $name = trim((string) ($in['name'] ?? ''));
            $email = strtolower(trim((string) ($in['email'] ?? '')));
            $password = (string) ($in['password'] ?? '');
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                fail('E-mail inválido.');
            }
            if (strlen($password) < 8) {
                fail('A senha precisa ter ao menos 8 caracteres.');
            }
            $domain = trim((string) $config['signup_email_domain']);
            if ($domain !== '' && !str_ends_with($email, '@' . $domain)) {
                fail("O cadastro é restrito a e-mails @$domain.");
            }
            $exists = db($config)->prepare('SELECT 1 FROM users WHERE email = ?');
            $exists->execute([$email]);
            if ($exists->fetch()) {
                fail('Já existe uma conta com este e-mail.');
            }
            $userId = uuid();
            $ins = db($config)->prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?,?,?,?)');
            $ins->execute([$userId, $name ?: $email, $email, password_hash($password, PASSWORD_DEFAULT)]);
            $token = bin2hex(random_bytes(32));
            $s = db($config)->prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?, DATE_ADD(NOW(), INTERVAL 30 DAY))');
            $s->execute([$token, $userId]);
            jsonOut(['token' => $token, 'user' => ['id' => $userId, 'name' => $name ?: $email, 'email' => $email]]);
        }

        case 'POST auth/login': {
            $in = body();
            $email = strtolower(trim((string) ($in['email'] ?? '')));
            $password = (string) ($in['password'] ?? '');
            $stmt = db($config)->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?');
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            if (!$user || !password_verify($password, $user['password_hash'])) {
                fail('E-mail ou senha inválidos.', 401);
            }
            $token = bin2hex(random_bytes(32));
            $s = db($config)->prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?, DATE_ADD(NOW(), INTERVAL 30 DAY))');
            $s->execute([$token, $user['id']]);
            jsonOut(['token' => $token, 'user' => ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email']]]);
        }

        case 'POST auth/logout': {
            $token = bearer();
            if ($token) {
                $s = db($config)->prepare('DELETE FROM sessions WHERE token = ?');
                $s->execute([$token]);
            }
            jsonOut(['ok' => true]);
        }

        case 'GET auth/me': {
            $user = currentUser($config);
            jsonOut(['user' => $user]);
        }

        // ---------- Casos ----------
        case 'GET cases': {
            requireUser($config);
            $type = (string) ($_GET['type'] ?? '');
            $stmt = db($config)->prepare('SELECT * FROM cases WHERE type = ? ORDER BY updated_at DESC');
            $stmt->execute([$type]);
            jsonOut(['data' => $stmt->fetchAll()]);
        }

        case 'GET case': {
            requireUser($config);
            $stmt = db($config)->prepare('SELECT * FROM cases WHERE id = ?');
            $stmt->execute([$id]);
            $case = $stmt->fetch();
            if (!$case) {
                fail('Caso não encontrado.', 404);
            }
            $h = db($config)->prepare('SELECT * FROM stage_history WHERE case_id = ? ORDER BY created_at ASC');
            $h->execute([$id]);
            $i = db($config)->prepare('SELECT * FROM interviews WHERE case_id = ? ORDER BY scheduled_at ASC');
            $i->execute([$id]);
            $a = db($config)->prepare('SELECT * FROM attachments WHERE case_id = ? ORDER BY created_at DESC');
            $a->execute([$id]);
            $case['history'] = $h->fetchAll();
            $case['interviews'] = $i->fetchAll();
            $case['attachments'] = $a->fetchAll();
            jsonOut(['data' => $case]);
        }

        case 'POST cases': {
            $user = requireUser($config);
            $in = body();
            $caseId = uuid();
            $stage = (string) ($in['current_stage'] ?? '');
            $values = [
                'id' => $caseId,
                'type' => (string) ($in['type'] ?? ''),
                'title' => (string) ($in['title'] ?? ($in['cand_name'] ?? 'Novo caso')),
                'current_stage' => $stage,
                'status' => 'active',
                'created_by' => $user['id'],
            ];
            foreach ($CASE_FIELDS as $f) {
                if ($f !== 'title' && array_key_exists($f, $in)) {
                    $values[$f] = $in[$f] !== '' ? $in[$f] : null;
                }
            }
            $cols = implode(',', array_keys($values));
            $marks = implode(',', array_fill(0, count($values), '?'));
            $ins = db($config)->prepare("INSERT INTO cases ($cols) VALUES ($marks)");
            $ins->execute(array_values($values));

            $hist = db($config)->prepare(
                'INSERT INTO stage_history (id, case_id, from_stage, to_stage, outcome, note, author) VALUES (?,?,NULL,?,?,?,?)'
            );
            $hist->execute([uuid(), $caseId, $stage, 'created', 'Caso criado', $user['id']]);

            $stmt = db($config)->prepare('SELECT * FROM cases WHERE id = ?');
            $stmt->execute([$caseId]);
            jsonOut(['data' => $stmt->fetch()]);
        }

        case 'PATCH case': {
            requireUser($config);
            $in = body();
            $set = [];
            $args = [];
            foreach ($CASE_FIELDS as $f) {
                if (array_key_exists($f, $in)) {
                    $set[] = "$f = ?";
                    $args[] = $in[$f] !== '' ? $in[$f] : null;
                }
            }
            if (!$set) {
                jsonOut(['ok' => true]);
            }
            $args[] = $id;
            $stmt = db($config)->prepare('UPDATE cases SET ' . implode(',', $set) . ' WHERE id = ?');
            $stmt->execute($args);
            jsonOut(['ok' => true]);
        }

        case 'DELETE case': {
            requireUser($config);
            $files = db($config)->prepare('SELECT storage_path FROM attachments WHERE case_id = ?');
            $files->execute([$id]);
            foreach ($files->fetchAll() as $f) {
                $path = $config['uploads_dir'] . '/' . $f['storage_path'];
                if (is_file($path)) {
                    @unlink($path);
                }
            }
            $stmt = db($config)->prepare('DELETE FROM cases WHERE id = ?');
            $stmt->execute([$id]);
            jsonOut(['ok' => true]);
        }

        case 'POST case/advance': {
            $user = requireUser($config);
            $in = body();
            $to = (string) ($in['to_stage'] ?? '');
            $status = (string) ($in['status'] ?? 'active');
            $stmt = db($config)->prepare('SELECT current_stage FROM cases WHERE id = ?');
            $stmt->execute([$id]);
            $case = $stmt->fetch();
            if (!$case) {
                fail('Caso não encontrado.', 404);
            }
            $upd = db($config)->prepare('UPDATE cases SET current_stage = ?, status = ? WHERE id = ?');
            $upd->execute([$to, $status, $id]);
            $hist = db($config)->prepare(
                'INSERT INTO stage_history (id, case_id, from_stage, to_stage, outcome, note, author) VALUES (?,?,?,?,?,?,?)'
            );
            $hist->execute([
                uuid(),
                $id,
                $case['current_stage'],
                $to,
                (string) ($in['outcome'] ?? 'set'),
                ($in['note'] ?? '') !== '' ? $in['note'] : null,
                $user['id'],
            ]);
            jsonOut(['ok' => true]);
        }

        // ---------- Entrevistas ----------
        case 'POST interviews': {
            requireUser($config);
            $in = body();
            $stmt = db($config)->prepare(
                'INSERT INTO interviews (id, case_id, kind, scheduled_at, location, interviewer, result, notes) VALUES (?,?,?,?,?,?,?,?)'
            );
            $stmt->execute([
                uuid(),
                $id,
                $in['kind'] ?? null,
                ($in['scheduled_at'] ?? null) ?: null,
                ($in['location'] ?? '') ?: null,
                ($in['interviewer'] ?? '') ?: null,
                $in['result'] ?? 'pending',
                ($in['notes'] ?? '') ?: null,
            ]);
            jsonOut(['ok' => true]);
        }

        case 'PATCH interview': {
            requireUser($config);
            $in = body();
            $allowed = ['kind', 'scheduled_at', 'location', 'interviewer', 'result', 'notes'];
            $set = [];
            $args = [];
            foreach ($allowed as $f) {
                if (array_key_exists($f, $in)) {
                    $set[] = "$f = ?";
                    $args[] = $in[$f] !== '' ? $in[$f] : null;
                }
            }
            if (!$set) {
                jsonOut(['ok' => true]);
            }
            $args[] = $id;
            $stmt = db($config)->prepare('UPDATE interviews SET ' . implode(',', $set) . ' WHERE id = ?');
            $stmt->execute($args);
            jsonOut(['ok' => true]);
        }

        case 'DELETE interview': {
            requireUser($config);
            $stmt = db($config)->prepare('DELETE FROM interviews WHERE id = ?');
            $stmt->execute([$id]);
            jsonOut(['ok' => true]);
        }

        // ---------- Arquivos ----------
        case 'POST attachments': {
            requireUser($config);
            $kind = (string) ($_POST['kind'] ?? 'other');
            if (empty($_FILES['file'])) {
                fail('Nenhum arquivo enviado.');
            }
            $dir = rtrim((string) $config['uploads_dir'], '/') . '/' . $id;
            if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
                fail('Não foi possível criar a pasta de uploads.', 500);
            }
            $original = (string) $_FILES['file']['name'];
            $safe = preg_replace('/[^\w.\-]+/u', '_', $original) ?? 'arquivo';
            $rel = $id . '/' . uuid() . '-' . $safe;
            $dest = rtrim((string) $config['uploads_dir'], '/') . '/' . $rel;
            if (!move_uploaded_file($_FILES['file']['tmp_name'], $dest)) {
                fail('Falha ao gravar o arquivo.', 500);
            }
            $stmt = db($config)->prepare(
                'INSERT INTO attachments (id, case_id, kind, original_name, storage_path, mime, size) VALUES (?,?,?,?,?,?,?)'
            );
            $stmt->execute([
                uuid(),
                $id,
                $kind,
                $original,
                $rel,
                (string) ($_FILES['file']['type'] ?? '') ?: null,
                (int) $_FILES['file']['size'],
            ]);
            jsonOut(['ok' => true]);
        }

        case 'GET attachment': {
            requireUser($config);
            $stmt = db($config)->prepare('SELECT * FROM attachments WHERE id = ?');
            $stmt->execute([$id]);
            $att = $stmt->fetch();
            if (!$att) {
                fail('Arquivo não encontrado.', 404);
            }
            $path = rtrim((string) $config['uploads_dir'], '/') . '/' . $att['storage_path'];
            if (!is_file($path)) {
                fail('Arquivo não encontrado no servidor.', 404);
            }
            header('Content-Type: ' . ($att['mime'] ?: 'application/octet-stream'));
            header('Content-Length: ' . (string) filesize($path));
            header('Content-Disposition: attachment; filename="' . rawurlencode($att['original_name']) . '"');
            readfile($path);
            exit;
        }

        case 'DELETE attachment': {
            requireUser($config);
            $stmt = db($config)->prepare('SELECT * FROM attachments WHERE id = ?');
            $stmt->execute([$id]);
            $att = $stmt->fetch();
            if ($att) {
                $path = rtrim((string) $config['uploads_dir'], '/') . '/' . $att['storage_path'];
                if (is_file($path)) {
                    @unlink($path);
                }
                $del = db($config)->prepare('DELETE FROM attachments WHERE id = ?');
                $del->execute([$id]);
            }
            jsonOut(['ok' => true]);
        }

        default:
            fail('Rota não encontrada.', 404);
    }
} catch (Throwable $e) {
    error_log('[workflow-api] ' . $e->getMessage());
    fail('Erro interno no servidor.', 500);
}
