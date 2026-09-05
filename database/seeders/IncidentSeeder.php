<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Site;
use App\Models\Incident;

class IncidentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sites = Site::all();
        if ($sites->isEmpty()) return;

        Incident::create([
            'site_id' => $sites->random()->id,
            'title' => 'Indikasi Perubahan Tampilan (Defacement)',
            'description' => 'Terdeteksi perubahan judul dan meta tag utama Halaman Berita oleh skrip eksternal tak dikenal.',
            'type' => 'defacement',
            'severity' => 'critical',
            'status' => 'open',
            'detected_at' => now()->subMinutes(12),
        ]);

        Incident::create([
            'site_id' => $sites->random()->id,
            'title' => 'Sisipan Link Judi Online Terdeteksi pada Halaman Berita',
            'description' => 'Mesin pemindai menemukan link aktif promo judi online pada komentar halaman arsip.',
            'type' => 'keyword_found',
            'severity' => 'high',
            'status' => 'investigating',
            'detected_at' => now()->subMinutes(45),
        ]);

        Incident::create([
            'site_id' => $sites->random()->id,
            'title' => 'Percobaan Akses File Konfigurasi .env Terekspos',
            'description' => 'Aktivitas percobaan pembacaan file sensitif .env secara langsung dari publik.',
            'type' => 'error',
            'severity' => 'high',
            'status' => 'open',
            'detected_at' => now()->subHours(2),
        ]);

        Incident::create([
            'site_id' => $sites->random()->id,
            'title' => 'Modifikasi File Header & Script Eksternal Tak Dikenal',
            'description' => 'Ditemukan injeksi kode JavaScript eksternal di bagian header dokumen.',
            'type' => 'defacement',
            'severity' => 'medium',
            'status' => 'resolved',
            'detected_at' => now()->subHours(5),
        ]);
    }
}
