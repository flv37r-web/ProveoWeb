ALTER TABLE usuarios
  ADD COLUMN google_id VARCHAR(255) NULL AFTER email,
  ADD UNIQUE KEY usuarios_google_id_unique_idx (google_id),
  MODIFY COLUMN password_hash VARCHAR(255) NULL;