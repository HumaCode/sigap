<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Spatie\Activitylog\Models\Activity as SpatieActivity;

class Activity extends SpatieActivity
{
    use HasUlids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'attribute_changes' => 'array',
        ]);
    }

    /**
     * Get attribute changes either from dedicated column or from properties.
     */
    public function getAttributeChangesAttribute($value)
    {
        if (!empty($value)) {
            return is_string($value) ? json_decode($value, true) : $value;
        }

        $props = $this->properties;
        if ($props && (isset($props['attributes']) || isset($props['old']))) {
            return [
                'attributes' => $props['attributes'] ?? [],
                'old' => $props['old'] ?? [],
            ];
        }

        return null;
    }
}
