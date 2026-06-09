CREATE DATABASE IF NOT EXISTS db_niceon;
USE db_niceon;

-- =========================
-- 1. TABEL USER
-- =========================
CREATE TABLE tbl_user (
    pid BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    is_admin TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT NULL
);

-- =========================
-- 2. TABEL DETAIL USER
-- =========================
CREATE TABLE tbl_detail_user (
    pid BIGINT AUTO_INCREMENT PRIMARY KEY,
    pid_user BIGINT NOT NULL,
    nama VARCHAR(150) NOT NULL,
    ttl VARCHAR(150),
    gender ENUM('L', 'P'),
    nohp VARCHAR(30),
    alamat TEXT,
    refference VARCHAR(150),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,

    CONSTRAINT fk_detail_user
        FOREIGN KEY (pid_user)
        REFERENCES tbl_user(pid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =========================
-- 3. TABEL PAKET
-- =========================
CREATE TABLE tbl_paket (
    pid BIGINT AUTO_INCREMENT PRIMARY KEY,
    kategori VARCHAR(100) NOT NULL,
    formasi VARCHAR(100),
    jadwal VARCHAR(150),
    nama_paket VARCHAR(150) NOT NULL,
    harga DECIMAL(15,2) DEFAULT 0,
    ket TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT NULL
);

-- =========================
-- 4. TABEL FAQ
-- =========================
CREATE TABLE tbl_faq (
    pid BIGINT AUTO_INCREMENT PRIMARY KEY,
    kategori VARCHAR(100) NULL,
    pertanyaan VARCHAR(255) NOT NULL,
    jawaban TEXT NOT NULL,
    ikon VARCHAR(50) NULL,
    urutan INT UNSIGNED DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT NULL
);

-- =========================
-- 5. TABEL TRANSAKSI
-- =========================
CREATE TABLE tbl_transaksi (
    pid BIGINT AUTO_INCREMENT PRIMARY KEY,
    pid_user BIGINT NOT NULL,
    pid_paket BIGINT NOT NULL,
    status_transaksi ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    paid_date DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT NULL,

    CONSTRAINT fk_transaksi_user
        FOREIGN KEY (pid_user)
        REFERENCES tbl_user(pid)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_transaksi_paket
        FOREIGN KEY (pid_paket)
        REFERENCES tbl_paket(pid)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);


-- =========================
-- SEEDER FAQ
-- =========================
INSERT INTO tbl_faq
(kategori, pertanyaan, jawaban, ikon, urutan, is_active, created_by)
VALUES
('Umum', 'Lorem ipsum dolor sit amet consectetur?', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.', '❓', 1, 1, 1),
('Umum', 'Consectetur adipiscing elit sed do eiusmod?', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.', '📘', 2, 1, 1),
('Umum', 'Tempor incididunt ut labore et dolore?', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.', '💬', 3, 1, 1),
('Program', 'Magna aliqua ut enim ad minim veniam?', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.', '🎓', 4, 1, 1),
('Program', 'Quis nostrud exercitation ullamco laboris?', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.', '🧩', 5, 1, 1),
('Program', 'Nisi ut aliquip ex ea commodo consequat?', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer hendrerit, tortor et feugiat mattis.', '🛡️', 6, 1, 1);

-- =========================
-- SEEDER USER
-- password contoh: password123
-- =========================
INSERT INTO tbl_user 
(email, password, status, is_admin, created_by)
VALUES
('admin@example.com', '$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghi', 'active', 1, NULL),
('user1@example.com', '$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghi', 'active', 0, 1),
('user2@example.com', '$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghi', 'active', 0, 1);

-- =========================
-- SEEDER DETAIL USER
-- =========================
INSERT INTO tbl_detail_user
(pid_user, nama, ttl, gender, nohp, alamat, refference, created_by)
VALUES
(1, 'Administrator', 'Jakarta, 01 Januari 1990', 'L', '081111111111', 'Jakarta', 'Internal', 1),
(2, 'Budi Santoso', 'Bandung, 12 Mei 1998', 'L', '082222222222', 'Bandung', 'Instagram', 1),
(3, 'Siti Aminah', 'Surabaya, 20 Agustus 1999', 'P', '083333333333', 'Surabaya', 'Teman', 1);

-- =========================
-- SEEDER PAKET
-- =========================
INSERT INTO tbl_paket
(kategori, formasi, jadwal, nama_paket, harga, ket, created_by)
VALUES
('CPNS', 'TWK + TIU + TKP', 'Senin-Rabu 19:00', 'Paket Intensif CPNS', 750000, 'Kelas intensif CPNS dengan fokus latihan terarah.', 1),
('CPNS', 'SKD Tryout', 'Kamis 19:00', 'CPNS Full Tryout', 650000, 'Simulasi tryout CPNS lengkap dengan pembahasan.', 1),
('CPNS', 'Materi Dasar', 'Sabtu 09:00', 'CPNS Starter Pack', 500000, 'Paket awal untuk membangun fondasi materi CPNS.', 1),
('PPPK', 'Teknis', 'Selasa-Kamis 19:00', 'Paket Intensif PPPK', 650000, 'Kelas intensif PPPK dengan fokus latihan terarah.', 1),
('PPPK', 'Tryout Teknis', 'Jumat 19:00', 'PPPK Full Tryout', 700000, 'Simulasi tryout PPPK lengkap dengan evaluasi.', 1),
('PPPK', 'Materi Dasar', 'Sabtu 09:00', 'PPPK Starter Pack', 550000, 'Paket awal untuk membangun fondasi materi PPPK.', 1);

-- =========================
-- SEEDER TRANSAKSI
-- =========================
INSERT INTO tbl_transaksi
(pid_user, pid_paket, status_transaksi, paid_date, created_by)
VALUES
(2, 1, 'paid', NOW(), 1),
(3, 2, 'pending', NULL, 1);
