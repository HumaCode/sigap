<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingsRequest;
use App\Services\Interfaces\SettingServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function __construct(
        protected SettingServiceInterface $settingService
    ) {}

    /**
     * Display settings page with tabbed configuration.
     */
    public function index(Request $request): Response
    {
        if (!$request->user() || !$request->user()->hasAnyRole(['dev', 'admin'])) {
            abort(403, 'Akses ke pengaturan sistem hanya untuk Administrator atau Developer.');
        }

        $settings = $this->settingService->getSettingsData();

        return Inertia::render('Pengaturan/Index', [
            'settings' => $settings,
        ]);
    }

    /**
     * Update settings for specific category/tab.
     */
    public function update(UpdateSettingsRequest $request): RedirectResponse
    {
        $group = $request->validated('group');
        $data = $request->validated('settings');

        $this->settingService->saveSettings($group, $data);

        $groupLabels = [
            'ninerouter' => 'Konfigurasi 9Router AI Engine',
            'seo' => 'Pengaturan Optimasi SEO',
            'activity_log' => 'Pengaturan Log & Audit Aktivitas',
            'general' => 'Preferensi Umum Sistem',
        ];

        $label = $groupLabels[$group] ?? 'Pengaturan';

        return redirect()->back()->with('success', "{$label} berhasil disimpan.");
    }

    /**
     * Test connection to 9router API endpoint and fetch models.
     */
    public function testNineRouter(Request $request): JsonResponse
    {
        if (!$request->user() || !$request->user()->hasAnyRole(['dev', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $request->validate([
            'endpoint' => 'required|string|url|max:255',
            'api_key' => 'required|string|max:500',
        ]);

        $result = $this->settingService->testNineRouter(
            $request->input('endpoint'),
            $request->input('api_key')
        );

        return response()->json($result);
    }
}
