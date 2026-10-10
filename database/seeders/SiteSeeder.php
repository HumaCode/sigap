<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Site;

class SiteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $opdNames = [
            'Dinas Komunikasi dan Informatika',
            'Dinas Kesehatan',
            'Dinas Pendidikan',
            'Badan Perencanaan Pembangunan Daerah (Bappeda)',
            'Badan Kepegawaian dan Pengembangan SDM (BKPSDM)',
            'Badan Pengelolaan Keuangan dan Aset Daerah (BPKAD)',
            'Dinas Penanaman Modal dan PTSP (DPMPTSP)',
            'Dinas Lingkungan Hidup',
            'Dinas Perhubungan',
            'Dinas Kearsipan dan Perpustakaan',
            'Dinas Sosial, Pengendalian Penduduk dan KB',
            'Dinas Pertanian dan Pangan',
            'Dinas Perdagangan, Koperasi dan UKM',
            'Dinas Pariwisata, Kebudayaan, Kepemudaan dan Olahraga',
            'Dinas Pekerjaan Umum dan Penataan Ruang (DPUPR)',
            'Dinas Perumahan Rakyat dan Kawasan Permukiman',
            'Dinas Kependudukan dan Pencatatan Sipil (Disdukcapil)',
            'Satuan Polisi Pamong Praja dan Pemadam Kebakaran',
            'Badan Kesatuan Bangsa dan Politik',
            'Badan Penanggulangan Bencana Daerah (BPBD)',
            'Sekretariat Daerah',
            'Sekretariat DPRD',
            'Inspektorat Daerah',
            'RSUD Bendan',
            'RSUD Kraton',
            'Perumda Air Minum Tirta Kajen',
            'Puskesmas Bendan',
            'Puskesmas Kusuma Bangsa',
            'Puskesmas Tirto',
            'Puskesmas Krapyak',
            'Puskesmas Noyontaan',
            'Puskesmas Sokorejo',
            'Puskesmas Medono',
            'Puskesmas Dukuh',
            'Puskesmas Buaran',
            'Kecamatan Pekalongan Barat',
            'Kecamatan Pekalongan Timur',
            'Kecamatan Pekalongan Selatan',
            'Kecamatan Pekalongan Utara',
            'Kelurahan Bendan Kergon',
            'Kelurahan Pasirkramatkraton',
            'Kelurahan Medono',
            'Kelurahan Podosugih',
            'Kelurahan Tirto',
            'Kelurahan Kauman',
            'Kelurahan Kepatihan',
            'Kelurahan Poncol',
            'Kelurahan Klego',
            'Kelurahan Gamer',
            'Kelurahan Setono',
            'Kelurahan Kalibaros',
            'Kelurahan Sokoduwet',
            'Kelurahan Kuripan Yosorejo',
            'Kelurahan Kuripan Kertoharjo',
            'Kelurahan Buaran Kradenan',
            'Kelurahan Banyurip',
            'Kelurahan Jenggot',
            'Kelurahan Bandengan',
            'Kelurahan Degayu',
            'Kelurahan Krapyak',
            'Kelurahan Panjang Baru',
            'Kelurahan Panjang Wetan',
            'Kelurahan Kandang Panjang',
            'Kelurahan Padukuhan Kraton',
            'Portal Layanan Terpadu Satu Pintu',
            'Sistem Informasi Pengadaan Barang dan Jasa (LPSE)',
            'Sistem Informasi Geografis Tata Ruang (GIS)',
            'Sistem Pengelolaan Pengaduan Pelayanan Publik (SP4N LAPOR)',
            'Sistem Monitoring Pajak Daerah (SIMPATDA)',
            'Sistem Informasi Manajemen Rumah Sakit (SIMRS)',
            'Sistem Informasi Puskesmas Terpadu (SIMPUS)',
            'Sistem Administrasi Kependudukan Online (SAKPOLE)',
            'Portal Bantuan Sosial & Kesejahteraan Rakyat',
            'Sistem Informasi Pasar Tradisional & Harga Komoditas',
            'Sistem E-Monev Pembangunan Daerah',
            'Portal Satu Data Kota Pekalongan',
            'Sistem Informasi Presensi Pegawai (SIPEG)',
            'Sistem Kinerja Aparatur Sipil Negara (E-Kinerja)',
            'Sistem Informasi Arsip Dinamis Terintegrasi (SRIKANDI)',
            'Sistem Pembayaran Pajak Bumi dan Bangunan (E-PBB)',
            'Portal Informasi Pariwisata & Batik Pekalongan',
            'Sistem Informasi Manajemen Perizinan Bangunan Gedung (PBG)',
            'Sistem Pengelolaan Retribusi Sampah Terpadu',
            'Sistem Informasi Kelayakan Air Bersih PDAM',
            'Sistem Pemantauan Titik Banjir & Rob (Early Warning System)',
            'Portal Informasi Beasiswa Pendidikan Pelajar & Mahasiswa',
            'Sistem Penerimaan Peserta Didik Baru (PPDB Online)',
            'Portal Informasi Lowongan Kerja & Pelatihan BLK',
            'Sistem Monitoring CCTV Kota & Arus Lalu Lintas (ATCS)',
            'Portal Bank Sampah & Daur Ulang Lingkungan',
            'Sistem Informasi Posyandu & Tumbuh Kembang Balita',
            'Portal Rumah Pangan Sehat & Distribusi Beras',
            'Sistem Informasi Koperasi & UMKM Naik Kelas',
            'Portal Layanan Konsultasi Hukum Masyarakat',
            'Sistem Informasi Manajemen Agenda Pimpinan Daerah',
            'Portal Informasi Kebijakan & Produk Hukum Daerah (JDIH)',
            'Sistem Pengawasan Internal Pemerintah Daerah (SIMWAS)',
            'Sistem Inventarisasi Aset Tanah & Bangunan Pemkot',
            'Portal Pusat Layanan Informasi Publik (PPID Terintegrasi)',
            'Portal Resmi Portal Utama Kota Pekalongan',
        ];

        $categories = ['Portal Utama', 'SPBE', 'PPID', 'Lainnya'];
        $firstNames = ['Ahmad', 'Budi', 'Siti', 'Rian', 'Dewi', 'Hendra', 'Eko', 'Nurul', 'Agus', 'Tri', 'Wahyu', 'Rina', 'Fajar', 'Dian', 'Tono'];
        $lastNames = ['Kurniawan', 'Santoso', 'Rahmawati', 'Pratama', 'Lestari', 'Hidayat', 'Saputra', 'Wahyuni', 'Setiawan', 'Wijaya', 'Pangestu', 'Suharto'];

        $subdomainsUsed = [];

        foreach ($opdNames as $index => $opdName) {
            // Generate clean subdomain
            $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', substr($opdName, 0, 14)));
            $subdomain = $cleanName ?: 'site' . ($index + 1);
            if (in_array($subdomain, $subdomainsUsed)) {
                $subdomain .= ($index + 1);
            }
            $subdomainsUsed[] = $subdomain;

            // Categories distribution
            $category = 'Lainnya';
            if ($index === 0 || str_contains($opdName, 'Portal')) {
                $category = 'Portal Utama';
            } elseif (str_contains($opdName, 'PPID')) {
                $category = 'PPID';
            } elseif (str_contains($opdName, 'SPBE') || str_contains($opdName, 'Sistem') || str_contains($opdName, 'Dinas') || str_contains($opdName, 'Badan')) {
                $category = $index % 2 === 0 ? 'SPBE' : 'Lainnya';
            }

            // Realistic Status & RPM Distribution
            // Up (~80%), Warn (~8%), Down (~7%), Paused (~5%)
            $rand = ($index * 17) % 100;
            if ($rand < 80) {
                $status = 'up';
                $rpm = rand(35, 450);
            } elseif ($rand < 88) {
                $status = 'warn';
                $rpm = rand(1250, 2400);
            } elseif ($rand < 95) {
                $status = 'down';
                $rpm = 0;
            } else {
                $status = 'paused';
                $rpm = rand(10, 80);
            }

            // Random PIC
            $pic = $firstNames[array_rand($firstNames)] . ' ' . $lastNames[array_rand($lastNames)];
            $phone = '08' . rand(11, 99) . rand(1000, 9999) . rand(100, 999);

            // Intervals: 1, 5, 10, 15, 30
            $intervals = [1, 5, 5, 5, 10, 15, 30];
            $checkInterval = $status === 'paused' ? 0 : $intervals[array_rand($intervals)];

            // SSH credentials for some sites
            $hasSsh = $index % 4 === 0;
            $sshHost = $hasSsh ? "192.168.10." . (10 + ($index % 50)) : null;
            $sshUser = $hasSsh ? "admin_" . $subdomain : null;
            $sshAppPath = $hasSsh ? "/var/www/html/" . $subdomain : null;

            Site::create([
                'name' => $opdName,
                'url' => "{$subdomain}.pekalongankota.go.id",
                'category' => $category,
                'pic_name' => $pic,
                'pic_contact' => $phone,
                'check_interval' => $checkInterval,
                'requests_per_minute' => $rpm,
                'sitemap_url' => $index % 3 === 0 ? "/sitemap.xml" : null,
                'status' => $status,
                'is_active' => $status !== 'paused',
                'ssh_host' => $sshHost,
                'ssh_port' => 22,
                'ssh_username' => $sshUser,
                'ssh_auth_type' => 'password',
                'ssh_password' => $hasSsh ? 'SecretPekalongan2026!' : null,
                'ssh_app_path' => $sshAppPath,
            ]);
        }
    }
}
