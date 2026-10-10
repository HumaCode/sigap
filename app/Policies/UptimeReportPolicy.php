<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UptimeReportPolicy
{
    use HandlesAuthorization;

    /**
     * Role 'dev' (Super Administrator) memiliki akses penuh ke seluruh aksi.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('dev')) {
            return true;
        }

        return null;
    }

    /**
     * Menentukan apakah user dapat melihat halaman laporan ketersediaan (uptime & SLA).
     */
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    /**
     * Menentukan apakah user dapat melihat rincian riwayat audit kesehatan & diagnosis situs.
     */
    public function viewAuditDetail(User $user): bool
    {
        return $user->is_active;
    }

    /**
     * Menentukan apakah user dapat mencetak / mengekspor dokumen laporan resmi PDF.
     */
    public function export(User $user): bool
    {
        return $user->is_active && $user->hasAnyRole(['dev', 'admin', 'operator', 'pimpinan']);
    }
}
