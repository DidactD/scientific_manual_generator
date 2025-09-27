CREATE DATABASE IF NOT EXISTS manual_generator_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE manual_generator_db;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `manuals` (
  `id` VARCHAR(36) PRIMARY KEY, -- UUID from frontend
  `user_id` INT NOT NULL,
  `topic` VARCHAR(255) NOT NULL,
  `language` VARCHAR(50) NOT NULL,
  `detail_level` ENUM('Concise', 'Standard', 'Detailed') NOT NULL,
  `file_path` VARCHAR(255) NOT NULL, -- Path to the Markdown file
  `saved_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Optional: Inserisci un utente di prova per iniziare
-- La password qui è 'password123', ma verrà salvata in modo sicuro come hash.
INSERT INTO `users` (`name`, `email`, `password`) VALUES
('Test User', 'test@example.com', '$2y$10$g/xR5fJ7vN4bK2O.c.t.j.iU/yB9.2pG0.jD.c/gG2.kL9zJ4oR5e');