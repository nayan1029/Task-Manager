CREATE DATABASE IF NOT EXISTS manager_task_management;
USE manager_task_management;

CREATE TABLE login (
  login_id INT AUTO_INCREMENT PRIMARY KEY,
  manager_id VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('MANAGER') NOT NULL DEFAULT 'MANAGER',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_management (
  task_id INT AUTO_INCREMENT PRIMARY KEY,
  login_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_management_login
    FOREIGN KEY (login_id)
    REFERENCES login(login_id)
    ON DELETE CASCADE
);

INSERT INTO login (manager_id, password_hash, role)
VALUES ('manager', SHA2('manager123', 256), 'MANAGER');

-- Register new managers with:
-- INSERT INTO login (manager_id, password_hash, role)
-- VALUES ('new_manager', SHA2('new_password', 256), 'MANAGER');

INSERT INTO task_management (login_id, title, completed)
VALUES
  (1, 'Prepare daily task list', FALSE),
  (1, 'Review completed work', TRUE);
