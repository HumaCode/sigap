<?php

namespace App\Repositories;

use App\Models\Setting;
use App\Repositories\Interfaces\SettingRepositoryInterface;

class SettingRepository implements SettingRepositoryInterface
{
    public function allGrouped(): array
    {
        $settings = Setting::all();
        $grouped = [];

        foreach ($settings as $setting) {
            $key = $setting->key;
            $val = Setting::getValue($key);
            $grouped[$setting->group][$key] = [
                'key' => $key,
                'value' => $val,
                'is_encrypted' => $setting->is_encrypted,
            ];
        }

        return $grouped;
    }

    public function get(string $key, $default = null)
    {
        return Setting::getValue($key, $default);
    }

    public function set(string $key, $value, string $group = 'general', bool $isEncrypted = false): Setting
    {
        return Setting::setValue($key, $value, $group, $isEncrypted);
    }

    public function updateMany(array $settings, string $group = 'general'): void
    {
        foreach ($settings as $key => $data) {
            $value = is_array($data) && array_key_exists('value', $data) ? $data['value'] : $data;
            $isEncrypted = is_array($data) && !empty($data['is_encrypted']);
            $itemGroup = is_array($data) && !empty($data['group']) ? $data['group'] : $group;

            Setting::setValue($key, $value, $itemGroup, $isEncrypted);
        }
    }
}
