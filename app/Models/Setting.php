<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Setting extends Model
{
    use HasFactory, HasUlids, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('setting')
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->setDescriptionForEvent(fn(string $eventName) => "Pengaturan \"{$this->key}\" telah di-{$eventName}");
    }

    protected $fillable = [
        'key',
        'value',
        'group',
        'is_encrypted',
    ];

    protected $casts = [
        'is_encrypted' => 'boolean',
    ];

    /**
     * Get a setting value by key, decrypting if encrypted, with fallback.
     */
    public static function getValue(string $key, $default = null)
    {
        try {
            $setting = static::where('key', $key)->first();
        } catch (\Throwable $e) {
            return $default;
        }

        if (!$setting || $setting->value === null) {
            return $default;
        }

        if ($setting->is_encrypted) {
            try {
                return Crypt::decryptString($setting->value);
            } catch (\Exception $e) {
                Log::warning("Failed to decrypt setting key [{$key}]: " . $e->getMessage());
                return $default;
            }
        }

        // Try decoding if JSON
        $decoded = json_decode($setting->value, true);
        if (json_last_error() === JSON_ERROR_NONE && (is_array($decoded) || is_object($decoded))) {
            return $decoded;
        }

        return $setting->value;
    }

    /**
     * Save or update a setting value.
     */
    public static function setValue(string $key, $value, string $group = 'general', bool $isEncrypted = false): self
    {
        $storedValue = $value;

        if (is_array($value) || is_object($value)) {
            $storedValue = json_encode($value);
        }

        if ($isEncrypted && !empty($storedValue)) {
            $storedValue = Crypt::encryptString((string) $storedValue);
        }

        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $storedValue,
                'group' => $group,
                'is_encrypted' => $isEncrypted,
            ]
        );
    }
}
