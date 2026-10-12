# Product Requirement Document (PRD)
## Desain Halaman Beranda (Landing Page) SIGAP Web

---

### 1. Informasi Produk & Ringkasan Eksekutif
- **Nama Produk:** **SIGAP** (*Sistem Informasi Pengawasan & Tanggap Keamanan Siber Situs Instansi*)
- **Target Entitas:** Pemerintah Daerah, Dinas Komunikasi dan Informatika (Diskominfo), Tim Tanggap Insiden Siber (CSIRT / SOC), serta Administrator OPD.
- **Tujuan Halaman:** 
  1. Memberikan representasi visual modern dan berwibawa bagi sistem pengawasan keamanan siber instansi pemerintah.
  2. Menyajikan portal status transparansi publik (*Public Availability Status*) tanpa mengekspos celah keamanan sensitif.
  3. Menjadi gerbang masuk utama (*Single Sign-On / Login Gateway*) bagi operator dan pimpinan dinas.

---

### 2. Identitas Visual & Design System (Theme Guidelines)
- **Tema Desain:** *Modern Gov-Tech & Cyber Defense (Futuristic Glassmorphism)*.
- **Warna Utama (Color Palette):**
  - **Primary:** Teal Cyan (`#0ea5a3` / `#14b8a6`) — Melambangkan keandalan, proteksi siber, dan ketenangan.
  - **Secondary / Accent:** Electric Blue (`#0284c7`) & Purple Cyber (`#7c3aed`).
  - **Alert Colors:** Danger Red (`#ef4444`) untuk insiden, Warning Amber (`#f59e0b`) untuk latensi/SSL.
  - **Background:** Deep Slate Navy (`#090d16` hingga `#0f172a`) dengan aksen grid texture cyber halus, ambient glow spheres, dan glassmorphism card (`background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1)`).
- **Tipografi:** Modern Clean Sans-Serif (**Poppins** / **Inter** / **Plus Jakarta Sans**).
- **Nuansa (Vibe):** Berwibawa, berteknologi tinggi, aman, tanggap, dan tepercaya.

---

### 3. Struktur Halaman & Tata Letak Komponen (Wireframe Breakdown)

#### A. Navigation Bar (Top Sticky / Floating Glass)
- **Brand Identity:** Logo perisai proteksi siber (*Shield Lock badge*) dengan teks **SIGAP** dan subteks kecil *"Monitoring Situs Instansi"*.
- **Menu Navigasi:**
  - *Beranda*
  - *Pilar Pengawasan* (Fitur)
  - *Status Layanan Publik*
  - *Mitigasi Insiden AI*
  - *Kontak CSIRT*
- **Action CTA:** Tombol gradien elegan: **"Masuk ke Portal"** (*Login Admin*).

#### B. Hero Section (Above the Fold)
- **Status Indicator Pill:** Badge mengambang dengan titik hijau berkedip (*Live Pulse Dot*): *"● Sistem Monitoring Realtime Aktif — 24/7 Pengawasan Siber"*.
- **Headline Utama:** 
  > **"Pengawasan Ketersediaan & Ketahanan Siber Situs Instansi Pemerintah"**
- **Sub-Headline:**
  > *"Solusi terpadu pemantauan uptime, pencegahan defacement, pendeteksi injeksi konten ilegal (judi online & obat terlarang), serta respon insiden cerdas berbasis AI."*
- **Call-to-Action (CTA Group):**
  - *Primary Button:* **"Akses Portal SIGAP"** (Tombol Teal Gradient dengan ikon panah/login).
  - *Secondary Button:* **"Pantau Status Terkini"** (Ghost Button dengan ikon radar/sinyal).
- **Hero Visual Asset (Hero Showcase):**
  - Mockup 3D/Isometric Dashboard Interaktif:
    - Widget radar pemindaian aktif dengan efek rotasi lingkaran.
    - Card metrik terapung (*Floating Widget*):
      - Card 1: *Status Jaringan: 99.85% SLA Normal*.
      - Card 2: *SSL TLS Health: 100% Terenkripsi Valid*.
      - Card 3: *AI Remediation Engine: Ready*.

#### C. Live Metrics & Trust Bar
4 kartu statistik ringkas dengan angka besar dan deskripsi formal:
1. **48+ Situs Terpantau** — Seluruh domain OPD & kecamatan aktif dalam pengawasan.
2. **99.85% SLA Ketersediaan** — Rasio uptime rata-rata layanan portal dinas.
3. **< 3 Detik Deteksi Cepat** — Interval respons alarm ketika terjadi anomali.
4. **24/7 AI-Assisted Guard** — Pemindaian otomatis tanpa henti.

#### D. 4 Pilar Keunggulan SIGAP (Feature Cards Grid)
Layout 4 kartu interaktif dengan efek hover elevation:
1. **Pemantauan Ketersediaan (Uptime & SSL)**
   - *Icon:* `bi-activity` / `bi-broadcast`
   - *Deskripsi:* Deteksi dini downtime situs, pengukuran latensi respon HTTP, dan peringatan dini kedaluwarsa sertifikat SSL/TLS.
2. **Scanner Konten Ilegal & Defacement**
   - *Icon:* `bi-shield-slash-fill` / `bi-search`
   - *Deskripsi:* Mesin pemindai otomatis terhadap sisipan link judi online, obat terlarang (cytotec/aborsi), script deface, dan webshell.
3. **Asisten Remediasi Insiden Berbasis AI**
   - *Icon:* `bi-robot` / `bi-cpu`
   - *Deskripsi:* Analisis root cause otomatis dan rekomendasi langkah mitigasi teknis instan untuk tim teknis dan CSIRT.
4. **Pusat Notifikasi & Alarm Terpadu**
   - *Icon:* `bi-bell-fill`
   - *Deskripsi:* Distribusi peringatan multi-kanal ke dashboard, bot Telegram, dan email instansi saat insiden kritis terdeteksi.

#### E. Transparansi Status Publik (Public Status Showcase)
- Tampilan kartu ringkasan kondisi sistem pemerintah saat ini:
  - Indikator: *"Seluruh Sistem Beroperasi Normal"* (Ikon centang hijau besar).
  - Ringkasan uptime 7 hari terakhir (Visual sparkline mini).
  - Edukasi singkat standar kepatuhan keamanan informasi pemerintah.

#### F. Call to Action (CTA Section)
- Banner melengkung dengan latar belakang dark mesh gradient:
  - *Title:* **"Wujudkan Ekosistem Digital Pemerintah Daerah yang Tangguh dan Tepercaya"**
  - *Subtitle:* Hubungi tim pengelola Diskominfo untuk pendaftaran domain situs OPD atau laporkan kendala operasional.
  - *Button:* **"Masuk ke Dashboard Sistem"**.

#### G. Footer Resmi Instansi
- Logo instansi & deskripsi singkat SIGAP.
- Tautan cepat (*Quick Links*): Panduan Pengguna, Dokumentasi SOP Insiden, Kontak Hotline CSIRT / Tim Siber.
- Hak Cipta: *"© 2026 SIGAP — Dinas Komunikasi dan Informatika. Hak Cipta Dilindungi Undang-Undang."*

---

### 4. Prompt Siap Pakai untuk Stitch (Stitch Generation Prompt)
Berikut adalah teks prompt teroptimasi dalam bahasa Inggris & Indonesia yang dapat langsung disalin ke input Stitch.
