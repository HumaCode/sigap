<?php

namespace App\Services\Interfaces;

interface SettingServiceInterface
{
    /**
     * Get all structured settings for the settings page with defaults.
     */
    public function getSettingsData(): array;

    /**
     * Update settings for a specific group/tab.
     */
    public function saveSettings(string $group, array $data): void;

    /**
     * Test connection to 9router API endpoint and retrieve available models.
     */
    public function testNineRouter(string $endpoint, string $apiKey): array;
}
