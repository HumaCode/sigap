<?php

namespace App\Policies;

use App\Models\Keyword;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class KeywordPolicy
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
     * Menentukan apakah user dapat melihat daftar kata kunci.
     */
    public function viewAny(User $user): bool
    {
        return (bool) $user->is_active;
    }

    /**
     * Menentukan apakah user dapat melihat detail suatu kata kunci.
     */
    public function view(User $user, ?Keyword $keyword = null): bool
    {
        return (bool) $user->is_active;
    }

    /**
     * Menentukan apakah user dapat menambahkan kata kunci / pola baru.
     */
    public function create(User $user): bool
    {
        return (bool) ($user->is_active && $user->hasAnyRole(['dev', 'admin', 'operator']));
    }

    /**
     * Menentukan apakah user dapat memperbarui kata kunci.
     */
    public function update(User $user, ?Keyword $keyword = null): bool
    {
        return (bool) ($user->is_active && $user->hasAnyRole(['dev', 'admin', 'operator']));
    }

    /**
     * Menentukan apakah user dapat menghapus kata kunci.
     */
    public function delete(User $user, ?Keyword $keyword = null): bool
    {
        return (bool) ($user->is_active && $user->hasAnyRole(['dev', 'admin']));
    }
}
