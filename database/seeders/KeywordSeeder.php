<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Keyword;

class KeywordSeeder extends Seeder
{
    public function run(): void
    {
        $keywords = [
            // Judi Online
            ['keyword' => 'slot gacor', 'category' => 'Judi Online', 'type' => 'plain', 'description' => 'Promosi mesin slot daring ilegal'],
            ['keyword' => 'judi online', 'category' => 'Judi Online', 'type' => 'plain', 'description' => 'Aktivitas perjudian daring'],
            ['keyword' => 'slot maxwin', 'category' => 'Judi Online', 'type' => 'plain', 'description' => 'Pola kata kunci taruhan judi slot'],
            ['keyword' => 'bandar togel', 'category' => 'Judi Online', 'type' => 'plain', 'description' => 'Situs taruhan tebak angka ilegal'],
            ['keyword' => 'poker online', 'category' => 'Judi Online', 'type' => 'plain', 'description' => 'Taruhan kartu daring'],
            ['keyword' => 'sbobet', 'category' => 'Judi Online', 'type' => 'plain', 'description' => 'Portal taruhan olahraga luar negeri'],
            ['keyword' => 'depo pulsa', 'category' => 'Judi Online', 'type' => 'plain', 'description' => 'Metode deposit akun perjudian'],

            // Obat Terlarang & Ilegal
            ['keyword' => 'cytotec', 'category' => 'Obat Terlarang', 'type' => 'plain', 'description' => 'Obat keras ilegal tanpa resep dokter'],
            ['keyword' => 'obat aborsi', 'category' => 'Obat Terlarang', 'type' => 'plain', 'description' => 'Penjualan obat penggugur kandungan ilegal'],
            ['keyword' => 'misoprostol', 'category' => 'Obat Terlarang', 'type' => 'plain', 'description' => 'Zat aktif obat aborsi terlarang'],
            ['keyword' => 'gastrul', 'category' => 'Obat Terlarang', 'type' => 'plain', 'description' => 'Merek obat aborsi keras tanpa izin edar'],
            ['keyword' => 'penggugur kandungan', 'category' => 'Obat Terlarang', 'type' => 'plain', 'description' => 'Klaim tindakan pengguguran ilegal'],
            ['keyword' => 'telat bulan', 'category' => 'Obat Terlarang', 'type' => 'plain', 'description' => 'Eufemisme promosi obat aborsi'],

            // Defacement & Malware
            ['keyword' => 'hacked by', 'category' => 'Defacement', 'type' => 'plain', 'description' => 'Klaim peretasan tampilan situs web'],
            ['keyword' => 'defaced by', 'category' => 'Defacement', 'type' => 'plain', 'description' => 'Injeksi tanda peretas di halaman muka'],
            ['keyword' => 'c99shell', 'category' => 'Malware', 'type' => 'plain', 'description' => 'Webshell script berbahaya'],
            ['keyword' => 'r57shell', 'category' => 'Malware', 'type' => 'plain', 'description' => 'Pintu belakang akses peretas'],
        ];

        foreach ($keywords as $item) {
            Keyword::firstOrCreate(
                ['keyword' => $item['keyword']],
                [
                    'category' => $item['category'],
                    'type' => $item['type'],
                    'description' => $item['description'],
                    'is_active' => true,
                ]
            );
        }
    }
}
