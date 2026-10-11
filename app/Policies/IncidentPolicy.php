<?php

namespace App\Policies;

use App\Models\Incident;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class IncidentPolicy
{
    use HandlesAuthorization;

    /**
     * Perform pre-authorization checks.
     * Role 'dev' has complete authority.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('dev')) {
            return true;
        }

        return null;
    }

    /**
     * Determine whether user can view incident listings.
     */
    public function viewAny(User $user): bool
    {
        return (bool) $user->is_active;
    }

    /**
     * Determine whether user can view an incident.
     */
    public function view(User $user, Incident $incident): bool
    {
        return (bool) $user->is_active;
    }

    /**
     * Determine whether user can create an incident.
     */
    public function create(User $user): bool
    {
        return $user->is_active && $user->hasAnyRole(['dev', 'admin']);
    }

    /**
     * Determine whether user can update an incident.
     */
    public function update(User $user, Incident $incident): bool
    {
        return $user->is_active && $user->hasAnyRole(['dev', 'admin']);
    }

    /**
     * Determine whether user can delete an incident.
     */
    public function delete(User $user, Incident $incident): bool
    {
        return $user->is_active && $user->hasRole('dev');
    }

    /**
     * Determine whether user can mark all active incidents as resolved.
     */
    public function resolveAll(User $user): bool
    {
        return $user->is_active && $user->hasAnyRole(['dev', 'admin']);
    }
}
