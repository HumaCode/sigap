<?php

namespace App\Repositories\Interfaces;

use App\Models\Setting;

interface SettingRepositoryInterface
{
    /**
     * Get all settings grouped by their category.
     */
    public function allGrouped(): array;

    /**
     * Get single setting value by key.
     */
    public function get(string $key, $default = null);

    /**
     * Set a setting value.
     */
    public function set(string $key, $value, string $group = 'general', bool $isEncrypted = false): Setting;

    /**
     * Update multiple settings at once.
     */
    public function updateMany(array $settings, string $group = 'general'): void;
}
