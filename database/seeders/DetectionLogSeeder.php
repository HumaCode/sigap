<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DetectionLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sites = \App\Models\Site::all();
        if ($sites->isEmpty()) return;

        \App\Models\DetectionLog::create([
            'site_id' => $sites->random()->id,
            'title' => 'Kata kunci judi online terdeteksi',
            'category' => 'judol',
            'context' => '...kumpulan berita resmi tahun 2023. <mark>situs slot gacor maxwin daftar sekarang</mark> juga tersedia untuk...',
            'url_path' => '/berita/arsip-2023',
            'status' => 'new',
            'source' => 'Internal Scanner',
            'created_at' => now()->subMinutes(2),
        ]);

        \App\Models\DetectionLog::create([
            'site_id' => $sites->random()->id,
            'title' => 'Promosi obat terlarang pada teks tersembunyi',
            'category' => 'obat',
            'context' => '<span style="display:none"><mark>jual obat aborsi asli cod</mark> hubungi wa...</span>',
            'url_path' => '/artikel/2021/kesehatan',
            'status' => 'reviewed',
            'source' => 'Internal Scanner',
            'created_at' => now()->subMinutes(18),
        ]);

        \App\Models\DetectionLog::create([
            'site_id' => $sites->random()->id,
            'title' => 'Teks tersembunyi (font-size: 0) ditemukan',
            'category' => 'hidden',
            'context' => '<p style="<mark>font-size:0;color:#fff</mark>">bandar togel terpercaya 2026</p>',
            'url_path' => '/halaman-arsip/lama',
            'status' => 'new',
            'source' => 'Internal Scanner',
            'created_at' => now()->subMinutes(34),
        ]);

        \App\Models\DetectionLog::create([
            'site_id' => $sites->random()->id,
            'title' => 'Halaman baru terindeks tidak ada di sitemap resmi',
            'category' => 'newpage',
            'context' => 'URL ditemukan via Google Search Console: <mark>/wp-content/uploads/promo-page-x92z.html</mark>',
            'url_path' => '/wp-content/uploads/promo-page-x92z.html',
            'status' => 'new',
            'source' => 'Google Search Console',
            'created_at' => now()->subHours(1),
        ]);
    }
}
