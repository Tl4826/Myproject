CREATE DATABASE IF NOT EXISTS nutrivn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nutrivn;

CREATE TABLE IF NOT EXISTS meals (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  mon        VARCHAR(100) NOT NULL,           -- tên/mã món (vd: phobo)
  calo       INT UNSIGNED NOT NULL,           -- kcal
  an_luc     DATETIME     NOT NULL,           -- ngày giờ ăn (giờ địa phương, không múi giờ)
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_an_luc (an_luc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);