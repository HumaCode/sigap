<?php

namespace App\Models\Shield;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * @property string $id
 * @property string $name
 * @property string $slug
 * @property string $type_role
 * @property string|null $description
 * @property string $guard_name
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'slug', 'type_role', 'description', 'guard_name', 'is_active'])]
class Role extends SpatieRole
{
    use HasUlids;
}
