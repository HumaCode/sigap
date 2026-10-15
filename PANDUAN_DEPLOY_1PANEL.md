# Panduan Deployment SIGAP di 1Panel (Docker Compose)

Panduan ini menjelaskan langkah demi langkah untuk mengunggah dan menjalankan aplikasi **SIGAP** (*Sistem Informasi Gangguan & Analisis Performa*) di server Linux menggunakan **1Panel** dengan arsitektur **Laravel Octane (FrankenPHP) + MySQL 8.0 + Redis**.

---

## 🏗️ 1. Arsitektur Kontainer SIGAP

Konfigurasi `docker-compose.yml` telah dipisahkan menjadi 5 layanan mandiri yang terhubung dalam satu internal network (`sigap-network`):

| Service | Container Name | Peran / Fungsi | Port Default |
| :--- | :--- | :--- | :--- |
| **`app`** | `sigap-app` | Web Application (Laravel Octane FrankenPHP High-Performance) | `8093:8000` |
| **`scheduler`** | `sigap-scheduler` | Worker otomatis untuk Cron Job (Uptime check per menit, Audit SSL harian, WHOIS, Defacement) | Internal |
| **`queue`** | `sigap-queue` | Worker antrean asinkron (Notifikasi, AI analysis, Background jobs) | Internal |
| **`db`** | `sigap-db` | Database MySQL 8.0 (Data persisten di volume `sigap-db-data`) | `3314:3306` |
| **`redis`** | `sigap-redis` | Cache & Queue broker (Data persisten di volume `sigap-redis-data`) | `6389:6379` |

> [!NOTE]
> Container `app` telah dilengkapi dengan script **`docker/entrypoint.sh`** yang secara otomatis:
> 1. Menunggu koneksi MySQL siap (healthcheck).
> 2. Memperbaiki izin direktori `storage` dan `bootstrap/cache` ke pengguna `www-data`.
> 3. Membuat symlink `storage:link`.
> 4. Menjalankan `php artisan migrate --force` secara otomatis pada boot pertama.

---

## 🚀 2. Langkah-Langkah Deploy di 1Panel

### Langkah 1: Upload Source Code ke Server

Ada 2 cara yang dapat dipilih di 1Panel:

#### Cara A: Upload File Zip via File Manager 1Panel (Paling Populer)
1. Kompres seluruh folder proyek SIGAP ke dalam file `.zip` (abaikan folder `node_modules` dan `vendor` untuk menghemat bandwidth, karena Dockerfile akan menginstalnya secara otomatis dan bersih).
2. Di Dashboard 1Panel, buka menu **Files (文件)**.
3. Masuk ke direktori: `/opt/1panel/apps/compose/` (atau buat folder baru bernama `sigap`, sehingga path lengkapnya `/opt/1panel/apps/compose/sigap`).
4. Upload file `.zip` Anda ke direktori tersebut, lalu klik kanan dan pilih **Uncompress (解压)**.

#### Cara B: Clone via Git di 1Panel
1. Buka menu **Containers (容器)** -> **Compose (编排)** -> **Create Compose (创建编排)**.
2. Pilih tab **Git** dan masukkan URL repository Git Anda.

---

### Langkah 2: Buat & Konfigurasi File `.env`

1. Di dalam folder proyek di server (`/opt/1panel/apps/compose/sigap`), temukan file **`.env.docker.example`**.
2. Salin atau ganti namanya menjadi **`.env`**:
   ```bash
   cp .env.docker.example .env
   ```
3. Buka dan edit file `.env` tersebut melalui editor bawaan 1Panel:
   - Sesuaikan `APP_URL` dengan domain Anda (contoh: `https://sigap.domainanda.com`).
   - Ubah password database jika diinginkan (`DB_PASSWORD` & `DB_ROOT_PASSWORD`).
   - Pastikan variabel berikut tetap sesuai:
     ```dotenv
     DB_HOST=db
     REDIS_HOST=redis
     OCTANE_SERVER=frankenphp
     ```

---

### Langkah 3: Jalankan Docker Compose di 1Panel

1. Buka menu **Containers (容器)** -> **Compose (编排)** di dashboard 1Panel.
2. Klik tombol **Create Compose (创建编排)**.
3. Masukkan parameter:
   - **Name**: `sigap`
   - **Path**: Pilih direktori tempat file `docker-compose.yml` berada (`/opt/1panel/apps/compose/sigap`).
4. Klik **Confirm / OK**. 1Panel akan menjalankan perintah `docker compose up -d --build`.
5. Tunggu proses build selesai. Anda dapat memantau log proses build secara langsung di layar 1Panel.

---

### Langkah 4: Hubungkan Domain (Reverse Proxy & SSL) di 1Panel

Aplikasi SIGAP berjalan di port `8093` (atau port yang Anda tentukan di `APP_PORT`). Anda hanya perlu mengarahkan domain menggunakan fitur Reverse Proxy bawaan 1Panel (OpenResty):

1. Masuk ke menu **Websites (网站)** -> klik **Add Website (创建网站)**.
2. Pilih tab **Reverse Proxy (反向代理)**:
   - **Primary Domain**: Masukkan domain Anda (misal: `sigap.domainanda.com`).
   - **Proxy Pass / Target URL**: `http://127.0.0.1:8093`
3. Klik **Confirm**.
4. Setelah website terbuat, masuk ke tab **HTTPS / SSL** pada website tersebut:
   - Pilih penyedia sertifikat gratis (Let's Encrypt / ZeroSSL) atau upload SSL Anda sendiri.
   - Aktifkan fitur **Force HTTPS**.

---

### Langkah 5: Jalankan Seeder Database (Akun Admin Awal)

Setelah seluruh kontainer berstatus *Running (Hijau)*, isi data awal akun pengguna (Admin, Dev, User, Master Role, dan Menu):

#### Melalui Terminal 1Panel:
1. Masuk ke menu **Containers (容器)** -> temukan container **`sigap-app`**.
2. Klik ikon **Terminal (`>_`)** di sebelah kanan kontainer `sigap-app`.
3. Jalankan perintah berikut di dalam terminal kontainer:
   ```bash
   php artisan db:seed --force
   ```

#### Atau Melalui SSH Server Host:
```bash
docker exec -it sigap-app php artisan db:seed --force
```

#### 🔑 Kredensial Login Default:
- **URL Login**: `https://sigap.domainanda.com/login`
- **Username**: `admin`
- **Password**: `123`
*(Sangat disarankan segera mengganti password di menu Manajemen Pengguna setelah login).*

---

## 🛠️ 3. Perintah Perawatan & Operasional Penting

Semua perintah di bawah ini dapat dijalankan langsung melalui terminal SSH host atau Terminal 1Panel:

### 1. Reload Laravel Octane (Tanpa Downtime)
Gunakan perintah ini setiap kali Anda mengubah file PHP kode program:
```bash
docker exec -it sigap-app php artisan octane:reload
```

### 2. Memeriksa Status Scheduler & Queue
Untuk memastikan cron job monitoring berjalan lancar:
```bash
# Cek log scheduler (monitoring uptime, ssl, dll)
docker logs -f sigap-scheduler

# Cek log antrean queue worker
docker logs -f sigap-queue
```

### 3. Clear Cache Laravel
```bash
docker exec -it sigap-app php artisan optimize:clear
```

### 4. Backup Database
Di 1Panel, Anda dapat memanfaatkan menu **Backup (备份)** untuk menjadwalkan pencadangan otomatis volume `sigap-db-data` dan direktori `/opt/1panel/apps/compose/sigap/storage`.
