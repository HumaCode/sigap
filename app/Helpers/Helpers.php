<?php

use Illuminate\Support\Facades\Cache;
use App\Models\Menu;

if (!function_exists('tgl_indo')) {
    function tgl_indo($tgl, $tampil_hari = false, $tampil_jam = false)
    {
        if (!$tgl) return null;

        // 🔹 Kalau input adalah Carbon instance, ubah ke string Y-m-d H:i:s
        if ($tgl instanceof \Carbon\Carbon) {
            $tgl = $tgl->format('Y-m-d H:i:s');
        }

        $nama_hari  = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jum\'at', 'Sabtu'];
        $nama_bulan = [
            1 => 'Januari',
            'Februari',
            'Maret',
            'April',
            'Mei',
            'Juni',
            'Juli',
            'Agustus',
            'September',
            'Oktober',
            'November',
            'Desember'
        ];

        $tahun   = substr($tgl, 0, 4);
        $bulan   = $nama_bulan[(int) substr($tgl, 5, 2)];
        $tanggal = substr($tgl, 8, 2);
        $text    = '';

        if ($tampil_hari) {
            $urutan_hari = date('w', strtotime($tgl));
            $hari        = $nama_hari[$urutan_hari];
            $text        = "$hari, $tanggal $bulan $tahun";
        } else {
            $text = "$tanggal $bulan $tahun";
        }

        if ($tampil_jam) {
            $jam = substr($tgl, 11, 5);
            $text .= " - $jam";
        }

        return $text;
    }
}

if (!function_exists('menus')) {
    function menus($grouped = true)
    {
        // 1. Ambil data asli (flat) dari cache dalam bentuk array untuk mencegah __PHP_Incomplete_Class di Octane
        $allMenus = Cache::rememberForever('menus_data', function () {
            return Menu::active()
                ->orderBy('orders')
                ->get()
                ->toArray();
        });

        // 2. Jika minta grouped (untuk Sidebar), lakukan grouping
        if ($grouped) {
            return collect($allMenus)->groupBy('category');
        }

        // 3. Jika tidak, kembalikan data flat (untuk urlMenu)
        return collect($allMenus);
    }
}

if (!function_exists('urlMenu')) {
    function urlMenu()
    {
        // Cache hasil akhir array URL agar tidak perlu pluck() di setiap request
        return Cache::rememberForever('menus_url_list', function () {
            return menus(false)->whereNotNull('url')->pluck('url')->toArray();
        });
    }
}