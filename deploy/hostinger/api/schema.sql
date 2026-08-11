-- Banco de dados do Workflow de Profissionais (MySQL / MariaDB - Hostinger)
-- Importe este arquivo no phpMyAdmin do hPanel, dentro do banco criado.

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  token CHAR(64) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cases (
  id CHAR(36) PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  current_stage VARCHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  cand_name VARCHAR(180) NULL,
  cand_email VARCHAR(190) NULL,
  cand_phone VARCHAR(60) NULL,
  cand_linkedin VARCHAR(255) NULL,
  role VARCHAR(180) NULL,
  manager VARCHAR(180) NULL,
  area VARCHAR(180) NULL,
  notes TEXT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cases_type (type),
  INDEX idx_cases_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS stage_history (
  id CHAR(36) PRIMARY KEY,
  case_id CHAR(36) NOT NULL,
  from_stage VARCHAR(64) NULL,
  to_stage VARCHAR(64) NOT NULL,
  outcome VARCHAR(32) NULL,
  note TEXT NULL,
  author CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_history_case (case_id),
  CONSTRAINT fk_history_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS interviews (
  id CHAR(36) PRIMARY KEY,
  case_id CHAR(36) NOT NULL,
  kind VARCHAR(64) NULL,
  scheduled_at DATETIME NULL,
  location VARCHAR(255) NULL,
  interviewer VARCHAR(180) NULL,
  result VARCHAR(32) NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_interviews_case (case_id),
  CONSTRAINT fk_interviews_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attachments (
  id CHAR(36) PRIMARY KEY,
  case_id CHAR(36) NOT NULL,
  kind VARCHAR(64) NOT NULL DEFAULT 'other',
  original_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(255) NOT NULL,
  mime VARCHAR(190) NULL,
  size BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attachments_case (case_id),
  CONSTRAINT fk_attachments_case FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
