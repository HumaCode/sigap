# 📋 Roadmap & Daftar Tugas Pengembangan SIGAP (TODO.md)
*Sistem Informasi Gawat & Antisipasi Pengamanan Website*

Dokumen ini memuat rencana kerja, prioritas pengembangan fitur, dan daftar periksa (*checklist*) teknis untuk meningkatkan kapabilitas SIGAP menuju platform SOC (*Security Operations Center*) dan monitoring ketersediaan website pemerintah yang tangguh, otomatis, dan berstandar enterprise.

---

## 📌 Status Pengembangan Saat Ini (Completed / In Progress)
- [x] **Manajemen & Monitoring Situs**: CRUD situs, favicon instansi, interval cek, traffic RPM real-time, status chip (Online, Lambat, Down, Nonaktif).
- [x] **Laporan Uptime 30 Hari**: Visualisasi heatmap 30 hari interaktif dengan micro-tooltip per hari, grafik streaming ketersediaan, dan sinkronisasi modal rincian status harian.
- [x] **Pusat Insiden Terintegrasi**: Manajemen insiden keamanan, rekomendasi mitigasi AI (9Router), dan integrasi link langsung dari tabel laporan uptime.
- [x] **Investigasi Server Mendalam via SSH**: Pemindaian webshell & malware, karantina/rollback file, analisis access log forensik, dan pemantauan status kesehatan server.
- [x] **Sistem Backup Terjadwal**: Pembuatan backup database & files via SSH, restore, dan download arsip.
- [x] **Dokumen Resmi Cetak Pemerintah**: Pratinjau cetak resmi PDF untuk pelaporan kinerja ketersediaan ke pimpinan.

---

## 🚀 Fase 1: Notifikasi & Peringatan Darurat Multi-Channel
> **Prioritas**: 🔴 *Tinggi (Critical)*  
> **Tujuan**: Memastikan tim teknis dan PIC OPD menerima peringatan secepat mungkin saat terjadi insiden atau downtime, sebelum adanya keluhan publik.

- [ ] **1.1 Integrasi WhatsApp Gateway Otomatis**
  - [ ] Buat `WhatsAppNotificationService` pendukung gateway (Fonnte / Baileys / Waha).
  - [ ] Tambahkan konfigurasi WhatsApp API (Endpoint, Token/Key) pada tab *Pengaturan*.
  - [ ] Implementasikan auto-dispatch pesan WA darurat ke nomor `pic_contact` situs ketika status berubah menjadi `down` atau terdeteksi `critical incident`.
  - [ ] Fitur uji kirim notifikasi pesan WhatsApp dari dashboard admin.

- [ ] **1.2 Push Webhook Tim Teknis (Discord / Slack / MS Teams)**
  - [ ] Buat model & migrasi `webhooks` (URL, platform type, secret, is_active).
  - [ ] Kirim formatted embed message (rich cards dengan warna hijau/kuning/merah) ke channel Discord / Slack saat ada alert.
  - [ ] Tambahkan tombol *Acknowledge* langsung via interaksi webhook bila memungkinkan.

- [ ] **1.3 Kebijakan Eskalasi Insiden (*Escalation Policy*)**
  - [ ] Tambahkan timer eskalasi (misal: jika insiden kritis tidak direspons dalam 15-30 menit).
  - [ ] Notifikasi otomatis dikirimkan ke level berikutnya (Kepala Seksi / Kepala Bidang / Koordinator CSIRT).

---

## ⚙️ Fase 2: Otomasi Scheduler & Pelacak Kesehatan Domain/SSL
> **Prioritas**: 🔴 *Tinggi (High)*  
> **Tujuan**: Sistem bekerja mandiri secara kontinu tanpa bergantung pada tindakan manual.

- [x] **2.1 Worker Scheduler Pemantauan Uptime Otomatis**
  - [x] Daftarkan command `monitor:check-uptime` pada Laravel Scheduler (`app/Console/Kernel.php` atau `routes/console.php`) agar berjalan setiap menit (`* * * * *`).
  - [x] Optimalkan pengecekan paralel menggunakan `Http::pool` atau antrean Laravel Queue (*Jobs*) untuk menangani puluhan hingga ratusan situs secara simultan.

- [x] **2.2 Pelacak Kedaluwarsa Sertifikat SSL Otomatis**
  - [x] Buat Artisan Command `security:check-ssl-expiry`.
  - [x] Pengecekan masa berlaku sertifikat SSL setiap hari pada pukul 06:00 WIB.
  - [x] Pemicu notifikasi otomatis saat masa berlaku SSL tersisa **H-30, H-14, H-7, dan H-1** (mencegah insiden *SSL Certificate Expired*).

- [x] **2.3 Domain Expiry & DNS Health Tracker (.go.id / .id)**
  - [x] Integrasi lookup WHOIS / PANDI untuk mencatat tanggal kedaluwarsa sewa domain.
  - [x] Peringatan dini jika domain mendekati masa tenggang perpanjangan tahunan.
  - [x] Deteksi anomali perubahan DNS / Name Server (indikasi pembajakan domain).

---

## 🌐 Fase 3: Public Status Page & Mode Pemeliharaan Terjadwal
> **Prioritas**: 🟡 *Sedang (Medium)*  
> **Tujuan**: Menyediakan transparansi publik yang kredibel dan memisahkan antara gangguan darurat dengan pemeliharaan terjadwal.

- [x] **3.1 Halaman Publik Status Layanan Mandiri (`/status`)**
  - [x] Buat rute dan halaman publik mandiri (`/status`) yang dapat diakses publik tanpa login.
  - [x] Tampilkan status sistem real-time per klaster layanan (Portal Utama, SPBE, PPID, Layanan Publik, Faskes/RSUD).
  - [x] Sediakan fitur berlangganan update insiden bagi warga (*Subscribe Incident Updates via Email/WA*).

- [x] **3.2 Manajemen Jadwal Pemeliharaan Resmi (*Scheduled Maintenance*)**
  - [x] Buat modul CRUD *Jadwal Pemeliharaan* di menu admin.
  - [x] Parameter jadwal: Situs terdampak, waktu mulai, estimasi selesai, dan deskripsi pekerjaan.
  - [x] Status maintenance otomatis ditampilkan di status page publik dengan banner informatif.
  - [x] *SLA Exclusion*: Downtime selama jendela maintenance tidak dihitung sebagai penalti SLA ketersediaan bulanan.

---

## 🛡️ Fase 4: Deteksi Keamanan & Forensik Server Lanjutan
> **Prioritas**: 🟡 *Sedang (Security)*  
> **Tujuan**: Memperkuat deteksi serangan siber mutakhir seperti defacement visual dan eksposur port rahasia.

- [x] **4.1 Visual Snapshot & Screenshot Diffing (Deteksi Defacement Visual)**
  - [x] Implementasikan microservice / library headless browser (Puppeteer / Browsershot) untuk mengambil snapshot berkala tampilan depan situs.
  - [x] Lakukan perbandingan visual (*pixel / perceptual hash diff*).
  - [x] Memicu alarm *Visual Defacement Detected* jika tampilan visual berubah drastis meskipun tidak mengandung kata kunci terlarang.

- [x] **4.2 Pemindai Port & Service Exposure Terbuka**
  - [x] Pemindaian port eksternal otomatis untuk mendeteksi service berbahaya yang tidak sengaja terbuka ke internet publik (misal: port MySQL `3306`, Redis `6379`, MongoDB `27017`, Telnet `23`, Elasticsearch `9200`).
  - [x] Deteksi file konfigurasi sensitif yang terbuka ke publik (seperti `/.env`, `/.git/HEAD`, `/phpinfo.php`, `/wp-config.php.bak`).

- [x] **4.3 Pemantauan Resource Server Target via SSH (Resource Monitoring)**
  - [x] Tambahkan tab / widget utilisasi resource server pada menu *Investigasi Server*.
  - [x] Menampilkan gauge: Beban CPU (%), Pemakaian RAM (Used vs Free), dan Kapasitas Disk / Storage (`df -h`).
  - [x] Peringatan dini jika storage server target mencapai ambang batas > 90% (mencegah database crash karena disk penuh).

---

## 👥 Fase 5: Alur Kolaborasi & Penanganan Insiden Tim (Incident Workflow)
> **Prioritas**: 🟢 *Operasional (Operational)*  
> **Tujuan**: Meningkatkan efektivitas tim CSIRT dan operator dalam menangani tiket insiden.

- [ ] **5.1 Penugasan Petugas / Teknisi (*Assignee*)**
  - [ ] Tambahkan kolom `assigned_to` pada tabel insiden.
  - [ ] Fitur delegasi insiden ke personil operator/teknisi tertentu.
  - [ ] Notifikasi personal ke teknisi yang ditugaskan saat ada insiden baru.

- [ ] **5.2 Generator Laporan Investigasi & RCA (*Root Cause Analysis*)**
  - [ ] Form kesimpulan penanganan insiden:
    - *Akar Masalah (Root Cause)*
    - *Tindakan Remediasi (Action Taken)*
    - *Langkah Pencegahan (Preventive Measures)*
  - [ ] Ekspor berkas Berita Acara Insiden Siber resmi format dokumen pemerintah (.pdf).

- [ ] **5.3 Pelacak Metrik Kinerja Tim (MTTA & MTTR)**
  - [ ] **MTTA** (*Mean Time to Acknowledge*): Mengukur durasi dari insiden terdeteksi hingga operator merespons.
  - [ ] **MTTR** (*Mean Time to Resolve*): Mengukur durasi pemulihan insiden hingga status `resolved`.
  - [ ] Widget evaluasi kecepatan respons tim pada Dashboard pimpinan.

---

## 📊 Fase 6: Kepatuhan Standar Pemerintah & Pelaporan Eksekutif
> **Prioritas**: 🟢 *Manajemen (Reporting)*  
> **Tujuan**: Mempermudah pelaporan formal ke pimpinan daerah dan kepatuhan audit BSSN/Kemenkominfo.

- [x] **6.1 Ekspor Data Rekapitulasi Format Excel (.xlsx / .csv)**
  - [x] Tambahkan fitur export spreadsheet pada menu:
    - Rekap Uptime & Ketersediaan Situs Bulanan.
    - Rekap Insiden & Log Penanganan Siber.
    - Rekap Daftar Inventaris Aset Situs Web & PIC.
  - [x] Mendukung filter berdasarkan rentang tanggal dan kategori instansi.

- [x] **6.2 Indeks Kematangan & Rapor Kesehatan Website (Scorecard)**
  - [x] Sistem penilaian otomatis mutu website OPD (Nilai: *A+, A, B, C, D*):
    - Bobot Uptime 30 Hari (40%)
    - Bobot Kepatuhan SSL & Security Headers (30%)
    - Bobot Riwayat Bebas Insiden Siber (30%)
  - [x] Peringkat (*Leaderboard*) kepatuhan situs OPD untuk mendorong peningkatan kualitas layanan digital daerah.

- [x] **6.3 Pengamanan Akses Publik & Modul Statistik & Telemetri Internal**
  - [x] Mencegah *Information Disclosure (CWE-200)* dengan mengalihkan rute publik `/` dan `/status` langsung ke login/dashboard.
  - [x] Memindahkan seluruh visualisasi telemetri SOC, kesiagaan DEFCON, dan agregasi ketersediaan SLA ke halaman internal terproteksi: `/statistics`.
  - [x] Registrasi menu *Statistik & Telemetri* di database (`MenuSeeder` & permission mapping).

---

*Terakhir diperbarui: 15 Oktober 2026 — Antigravity Engineering Assistant*
