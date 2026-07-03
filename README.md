# SIGAP Web 🛡️

**Sistem Informasi Gawat & Antisipasi Pengamanan Website**

SIGAP Web adalah platform pemantauan situs web instansi secara terpusat dan *real-time*. Sistem ini dirancang untuk memastikan ketersediaan (uptime) dan mendeteksi secara dini anomali keamanan, seperti deface atau penyisipan konten mencurigakan, untuk menjamin integritas aset digital pemerintahan.

## 🚀 Fitur Utama

- **Real-Time Monitoring**: Memantau *uptime* seluruh situs instansi setiap menit.
- **Deteksi Anomali**: Sistem peringatan dini untuk mendeteksi perubahan konten situs yang tidak wajar atau berisiko tinggi (deface).
- **Notifikasi Instan**: Peringatan akan langsung dikirimkan ke Penanggung Jawab (PIC) ketika ada insiden, agar penanganan bisa dilakukan sedini mungkin.
- **RBAC (Role-Based Access Control)**: Manajemen akses berjenjang yang aman menggunakan Spatie Permission.
- **Modern UI/UX**: Antarmuka *dashboard* yang dinamis, bersih, dan memanjakan mata, dibangun menggunakan React & Inertia.js.

## 🛠️ Stack Teknologi Terkini

Sistem ini dikembangkan menggunakan *stack* mutakhir demi memastikan performa dan keamanan tertinggi:

- **Backend**: [Laravel 13](https://laravel.com/) (menggunakan PHP 8.3+)
- **Server/Kinerja**: [FrankenPHP](https://frankenphp.dev/) via Laravel Octane (performa I/O asinkron super cepat)
- **Database**: PostgreSQL (menggunakan arsitektur **ULID** sebagai *Primary Key* standar di seluruh tabel)
- **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) dengan arsitektur [Inertia.js](https://inertiajs.com/)
- **Otorisasi**: [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission/v6/introduction) (dikustomisasi dengan model Shield/ULID)

## 📦 Panduan Instalasi (Development)

Berikut adalah langkah-langkah untuk menjalankan aplikasi SIGAP Web di lingkungan lokal Anda.

### 1. Prasyarat Sistem
- PHP >= 8.3
- Composer
- Node.js & npm
- PostgreSQL
- Ekstensi Redis (direkomendasikan untuk caching)

### 2. Kloning Repositori & Setup
```bash
# 1. Kloning repositori
git clone https://github.com/HumaCode/sigap.git
cd sigap

# 2. Instalasi dependensi PHP & Node.js
composer install
npm install

# 3. Setup Environment
cp .env.example .env
php artisan key:generate

# Konfigurasikan koneksi DB PostgreSQL Anda di file .env
```

### 3. Migrasi & Seeding Database
Aplikasi ini sudah dipaketkan dengan Seeder awal untuk membuat hierarki Role dan *Dummy Account*.

```bash
php artisan migrate:fresh --seed
```

Data akun awal yang siap digunakan:
- **Developer** (Username: `dev` / `dev@sijaga.gov.id`, Password: `123`)
- **Administrator** (Username: `admin` / `admin@sijaga.gov.id`, Password: `123`)
- **Viewer / User** (Username: `user` / `user@sijaga.gov.id`, Password: `123`)

### 4. Menjalankan Server
Untuk lingkungan pengembangan, jalankan dua perintah berikut di terminal yang berbeda:

```bash
# Menjalankan Vite (untuk kompilasi aset Frontend HMR)
npm run dev

# Menjalankan server Laravel Backend
php artisan serve
```
*(Atau gunakan perintah FrankenPHP jika Anda menjalankan setup Octane lokal).*

Akses aplikasi di: **[http://localhost:8000](http://localhost:8000)**

---

## 🔒 Konvensi Pengembangan

1. **ULID**: Semua *Primary Key* pada model harus menggunakan tipe data ULID (bukan Auto-Increment). Pastikan menggunakan *trait* `HasUlids`.
2. **Keamanan Ekstra**: Proteksi rute dengan integrasi `HasMenuPermission` dan Spatie Middleware.
3. **Frontend Clean Code**: Pisahkan *logic* React dari CSS yang berat. Manfaatkan direktori `resources/css` untuk gaya spesifik (seperti `auth.css`).

---
*© 2026 Tim Pengembang SIGAP. All Rights Reserved.*
