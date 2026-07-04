<?php

namespace App\Models\Shield;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Permission as SpatiePermission;

/**
 * @property string $id
 * @property string $name
 * @property string $guard_name
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'guard_name', 'is_active'])]
class Permission extends SpatiePermission
{
    use HasUlids;

    public function menus()
    {
        return $this->belongsToMany(\App\Models\Menu::class);
    }
}
