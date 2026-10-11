<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Notifications\SecurityThreatNotification;
use App\Notifications\SiteDownNotification;
use App\Notifications\SystemAlertNotification;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::all();

        foreach ($users as $user) {
            // 1. Security Alert (Critical - Unread)
            $user->notify(new SecurityThreatNotification([
                'title'      => 'Deteksi Injeksi Konten Mencurigakan',
                'message'    => 'Sistem mendeteksi kemunculan kata kunci berisiko tinggi (pola judol / obat ilegal) pada endpoint publik.',
                'severity'   => 'critical',
                'icon'       => 'bi-shield-slash-fill',
                'site_name'  => 'Portal Resmi Dinas Komunikasi dan Informatika',
                'action_url' => '/incidents',
            ]));

            // 2. Site Down Alert (Critical - Unread)
            $user->notify(new SiteDownNotification([
                'title'      => 'Peringatan Downtime Situs Instansi',
                'message'    => 'Situs tidak memberikan respons HTTP (504 Gateway Timeout) melebihi batas toleransi 60 detik.',
                'severity'   => 'critical',
                'icon'       => 'bi-exclamation-octagon-fill',
                'site_name'  => 'Dinas Kependudukan dan Catatan Sipil',
                'action_url' => '/sites',
            ]));

            // 3. SSL Warning Alert (Warning - Read)
            $notif = new SystemAlertNotification([
                'title'      => 'Sertifikat SSL Segera Kedaluwarsa (H-5)',
                'message'    => 'Sertifikat enkripsi SSL TLS akan berakhir dalam 5 hari ke depan. Disarankan memperbarui sertifikat sebelum batas waktu.',
                'severity'   => 'warning',
                'icon'       => 'bi-shield-exclamation',
                'site_name'  => 'Badan Perencanaan Pembangunan Daerah (Bappeda)',
                'action_url' => '/sites',
            ]);
            $user->notify($notif);

            // Tandai notifikasi ke-3 sebagai sudah dibaca untuk variasi
            $latest = $user->notifications()->latest()->first();
            if ($latest) {
                $latest->markAsRead();
            }

            // 4. System Info Alert (Info - Read)
            $infoNotif = new SystemAlertNotification([
                'title'      => 'Audit Keamanan Berkala Selesai',
                'message'    => 'Pemeriksaan rutin seluruh situs terdaftar telah selesai dieksekusi. 48 situs beroperasi normal.',
                'severity'   => 'info',
                'icon'       => 'bi-check-circle-fill',
                'site_name'  => 'Sistem Otomasi SIGAP',
                'action_url' => '/detection-logs',
            ]);
            $user->notify($infoNotif);
            $latestInfo = $user->notifications()->latest()->first();
            if ($latestInfo) {
                $latestInfo->markAsRead();
            }
        }
    }
}
