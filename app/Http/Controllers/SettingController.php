<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingsRequest;
use App\Services\Interfaces\SettingServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
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

        // 5. Activity Logs query with filters
        $logQuery = \App\Models\Activity::with('causer')->latest('created_at');

        if ($request->filled('log_search')) {
            $search = trim((string) $request->input('log_search'));
            $logQuery->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('log_name', 'like', "%{$search}%")
                  ->orWhere('event', 'like', "%{$search}%");
            });
        }

        if ($request->filled('log_event') && $request->input('log_event') !== 'all') {
            $logQuery->where('event', $request->input('log_event'));
        }

        if ($request->filled('log_module') && $request->input('log_module') !== 'all') {
            $logQuery->where('log_name', $request->input('log_module'));
        }

        $activityLogs = $logQuery->paginate(10)->withQueryString()->through(function ($log) {
            return [
                'id' => $log->id,
                'log_name' => $log->log_name ?? 'default',
                'description' => $log->description,
                'event' => $log->event,
                'subject_type' => $log->subject_type ? class_basename($log->subject_type) : null,
                'subject_id' => $log->subject_id,
                'causer' => $log->causer ? [
                    'name' => $log->causer->name,
                    'username' => $log->causer->username,
                    'email' => $log->causer->email,
                ] : null,
                'attribute_changes' => $log->attribute_changes,
                'properties' => $log->properties,
                'created_at' => $log->created_at ? $log->created_at->format('d M Y, H:i:s') : '-',
                'created_at_human' => $log->created_at ? $log->created_at->diffForHumans() : '-',
            ];
        });

        // Available modules for filter dropdown
        $availableModules = \App\Models\Activity::select('log_name')
            ->distinct()
            ->whereNotNull('log_name')
            ->pluck('log_name');

        // Log Archives
        $logArchives = \App\Models\LogArchive::latest()->take(12)->get()->map(function ($a) {
            return [
                'id' => $a->id,
                'period' => $a->period,
                'title' => $a->title,
                'activity_log_count' => $a->activity_log_count,
                'detection_log_count' => $a->detection_log_count,
                'pdf_url' => route('settings.log-archives.download-pdf', $a->id),
                'pdf_size' => $a->formatted_pdf_size,
                'csv_url' => route('settings.log-archives.download-csv', $a->id),
                'csv_size' => $a->formatted_csv_size,
                'created_at' => $a->created_at->format('d M Y, H:i'),
                'notes' => $a->notes,
            ];
        });

        return Inertia::render('Pengaturan/Index', [
            'settings' => $settings,
            'activityLogs' => $activityLogs,
            'logArchives' => $logArchives,
            'activityFilters' => [
                'log_search' => $request->input('log_search', ''),
                'log_event' => $request->input('log_event', 'all'),
                'log_module' => $request->input('log_module', 'all'),
            ],
            'activityStats' => [
                'total' => \App\Models\Activity::count(),
                'today' => \App\Models\Activity::whereDate('created_at', today())->count(),
                'created' => \App\Models\Activity::where('event', 'created')->count(),
                'updated' => \App\Models\Activity::where('event', 'updated')->count(),
                'deleted' => \App\Models\Activity::where('event', 'deleted')->count(),
            ],
            'availableModules' => $availableModules,
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

        // Otomatis bersihkan seluruh cache aplikasi (seperti php artisan optimize:clear)
        try {
            Artisan::call('optimize:clear');
            Cache::flush();
        } catch (\Throwable $e) {
            Log::warning('Gagal membersihkan cache saat update pengaturan: ' . $e->getMessage());
        }

        $groupLabels = [
            'ninerouter' => 'Konfigurasi 9Router AI Engine',
            'sso' => 'Konfigurasi SSO HumaCode',
            'seo' => 'Pengaturan Optimasi SEO',
            'activity_log' => 'Pengaturan Log & Audit Aktivitas',
            'general' => 'Preferensi Umum Sistem',
        ];

        $label = $groupLabels[$group] ?? 'Pengaturan';

        return redirect()->back()->with('success', "{$label} berhasil disimpan & seluruh cache sistem telah dibersihkan.");
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

    /**
     * Test connection to HumaCode SSO server.
     */
    public function testSso(Request $request): JsonResponse
    {
        if (!$request->user() || !$request->user()->hasAnyRole(['dev', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $request->validate([
            'base_url' => 'required|string|url|max:255',
        ]);

        $result = $this->settingService->testSsoConnection(
            $request->input('base_url')
        );

        return response()->json($result);
    }

    /**
     * Test connection to Telegram Bot and dispatch test message.
     */
    public function testTelegram(Request $request): JsonResponse
    {
        if (!$request->user() || !$request->user()->hasAnyRole(['dev', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $request->validate([
            'telegram_bot_token' => 'nullable|string|max:255',
            'telegram_chat_id'   => 'nullable|string|max:100',
        ]);

        $result = $this->settingService->testTelegramConnection(
            $request->input('telegram_bot_token'),
            $request->input('telegram_chat_id')
        );

        return response()->json($result);
    }

    /**
     * Clear all activity logs.
     */
    public function clearActivityLogs(Request $request): RedirectResponse
    {
        if (!$request->user() || !$request->user()->hasAnyRole(['dev', 'admin'])) {
            abort(403, 'Akses ditolak.');
        }

        $count = \App\Models\Activity::count();
        \App\Models\Activity::truncate();

        activity('activity_log')
            ->causedBy($request->user())
            ->log("Membersihkan seluruh jejak log audit sistem ({$count} data log dihapus)");

        return redirect()->back()->with('success', "Riwayat log aktivitas ({$count} entri) berhasil dibersihkan.");
    }

    /**
     * Bersihkan seluruh cache sistem aplikasi (ekuivalen php artisan optimize:clear).
     */
    public function clearSystemCache(Request $request): RedirectResponse|JsonResponse
    {
        if (!$request->user() || !$request->user()->hasAnyRole(['dev', 'admin'])) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
            }
            abort(403, 'Akses ditolak.');
        }

        try {
            Artisan::call('optimize:clear');
            Cache::flush();

            activity('setting')
                ->causedBy($request->user())
                ->log('Membersihkan seluruh cache sistem (optimize:clear)');

            $msg = 'Seluruh cache sistem (konfigurasi, routing, view, dan cache aplikasi) berhasil dibersihkan.';

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $msg,
                ]);
            }

            return redirect()->back()->with('success', $msg);
        } catch (\Throwable $e) {
            Log::error('Gagal membersihkan cache sistem: ' . $e->getMessage());

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal membersihkan cache: ' . $e->getMessage(),
                ], 500);
            }

            return redirect()->back()->with('error', 'Gagal membersihkan cache: ' . $e->getMessage());
        }
    }

    /**
     * Generate log archive manually (PDF + Raw CSV ZIP) and purge from database.
     */
    public function generateLogArchive(Request $request, \App\Services\LogArchiveService $archiveService): RedirectResponse|JsonResponse
    {
        if (!$request->user() || !$request->user()->hasAnyRole(['dev', 'admin'])) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
            }
            abort(403, 'Akses ditolak.');
        }

        $month = $request->input('month', now()->format('Y-m'));
        $purge = $request->boolean('purge', true);

        try {
            $result = $archiveService->archivePeriod($month, $request->user()->id, $purge);

            $msg = "Arsip log periode {$result['period']} berhasil dibuat (PDF & ZIP tersimpan). " .
                number_format($result['deleted_activities']) . " log aktivitas & " .
                number_format($result['deleted_detections']) . " log deteksi telah dibersihkan.";

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $msg,
                    'data' => $result,
                ]);
            }

            return redirect()->back()->with('success', $msg);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Gagal membuat arsip log: ' . $e->getMessage());

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal membuat arsip log: ' . $e->getMessage(),
                ], 500);
            }

            return redirect()->back()->with('error', 'Gagal membuat arsip log: ' . $e->getMessage());
        }
    }

    /**
     * Download PDF Executive Summary for a log archive.
     */
    public function downloadArchivePdf(\App\Models\LogArchive $archive)
    {
        $fullPath = storage_path('app/' . $archive->pdf_path);
        if (!file_exists($fullPath)) {
            abort(404, 'File PDF laporan arsip tidak ditemukan di server.');
        }

        return response()->download($fullPath, basename($fullPath), [
            'Content-Type' => 'application/pdf',
        ]);
    }

    /**
     * Download Raw CSV ZIP for a log archive.
     */
    public function downloadArchiveCsv(\App\Models\LogArchive $archive)
    {
        $fullPath = storage_path('app/' . $archive->csv_path);
        if (!file_exists($fullPath)) {
            abort(404, 'File arsip data mentah (ZIP) tidak ditemukan di server.');
        }

        return response()->download($fullPath, basename($fullPath), [
            'Content-Type' => 'application/zip',
        ]);
    }
}
