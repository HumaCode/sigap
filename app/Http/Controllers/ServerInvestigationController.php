<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Services\Interfaces\ServerInvestigationServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServerInvestigationController extends Controller
{
    public function __construct(
        protected ServerInvestigationServiceInterface $investigationService
    ) {}

    /**
     * Tampilkan halaman utama Investigasi Server CSIRT.
     */
    public function index(Request $request): Response
    {
        $sites = $this->investigationService->getSitesWithSsh();

        $selectedSiteId = $request->query('site_id');
        $selectedSite = null;

        if ($selectedSiteId) {
            $selectedSite = $sites->firstWhere('id', $selectedSiteId);
        }

        if (!$selectedSite && $sites->isNotEmpty()) {
            $selectedSite = $sites->first();
            $selectedSiteId = (string) $selectedSite->id;
        }

        $serverHealth = null;
        $latestScan = null;
        $resourceUsage = null;
        if ($selectedSite) {
            // Load full site model with decrypted credentials for backend SSH health check
            $fullSite = Site::find($selectedSite->id);
            if ($fullSite) {
                $serverHealth = $this->investigationService->checkServerConnection($fullSite);
                $latestScan = $this->investigationService->getLatestScan($fullSite);
                $resourceUsage = $this->investigationService->getServerResourceUsage($fullSite);
            }
        }

        return Inertia::render('InvestigasiServer/Index', [
            'sites' => $sites,
            'selectedSiteId' => $selectedSiteId,
            'selectedSite' => $selectedSite ? [
                'id' => $selectedSite->id,
                'name' => $selectedSite->name,
                'url' => $selectedSite->url,
                'status' => $selectedSite->status,
                'ssh_host' => $selectedSite->ssh_host,
                'ssh_port' => $selectedSite->ssh_port,
                'ssh_username' => $selectedSite->ssh_username,
                'ssh_app_path' => $selectedSite->ssh_app_path,
                'ssh_auth_type' => $selectedSite->ssh_auth_type,
            ] : null,
            'initialServerHealth' => $serverHealth,
            'initialResourceUsage' => $resourceUsage,
            'latestScan' => $latestScan ? [
                'id' => $latestScan->id,
                'mode' => $latestScan->scan_mode,
                'app_path' => $latestScan->app_path,
                'scanned_at' => $latestScan->formatted_scanned_at,
                'total_scanned' => $latestScan->total_scanned,
                'total_findings' => $latestScan->total_findings,
                'risk_summary' => $latestScan->risk_summary,
                'threat_level' => $latestScan->threat_level,
                'findings' => method_exists($this->investigationService, 'classifyFindings')
                    ? $this->investigationService->classifyFindings($latestScan->findings ?? [])
                    : ($latestScan->findings ?? []),
                'scanned_by' => $latestScan->user?->name,
                'created_at' => $latestScan->created_at,
            ] : null,
        ]);
    }

    /**
     * Dapatkan utilisasi resource server real-time (CPU, RAM, Disk).
     */
    public function resourceUsage(Site $site): JsonResponse
    {
        try {
            $usage = $this->investigationService->getServerResourceUsage($site);
            return response()->json($usage);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Uji koneksi dan periksa status server terkini via SSH.
     */
    public function checkHealth(Site $site): JsonResponse
    {
        try {
            $health = $this->investigationService->checkServerConnection($site);
            return response()->json([
                'success' => $health['success'] ?? false,
                'data' => $health,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mulai pemindaian berkas proyek di server.
     */
    public function scanFiles(Request $request, Site $site): JsonResponse
    {
        $validated = $request->validate([
            'mode' => 'required|in:quick,deep,git',
            'include_vendor' => 'sometimes|boolean',
        ]);

        try {
            $includeVendor = (bool) ($validated['include_vendor'] ?? false);
            $result = $this->investigationService->scanFiles($site, $validated['mode'], auth()->id(), $includeVendor);
            
            activity('server_investigation')
                ->performedOn($site)
                ->withProperties(['mode' => $validated['mode'], 'findings_count' => $result['total_findings'] ?? 0])
                ->log("Pemeriksaan berkas server ({$validated['mode']}) dijalankan pada situs {$site->name}");

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memindai berkas server: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Karantina berkas berbahaya ke folder .sigap_quarantine dengan izin non-eksekusi (chmod 000).
     */
    public function quarantineFile(Request $request, Site $site): JsonResponse
    {
        $validated = $request->validate([
            'file_path' => 'required|string',
        ]);

        try {
            $result = $this->investigationService->quarantineFile($site, $validated['file_path'], auth()->id());

            activity('server_investigation')
                ->performedOn($site)
                ->withProperties(['file' => $validated['file_path']])
                ->log("Berkas {$validated['file_path']} berhasil dikarantina pada situs {$site->name}");

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengisolasi berkas: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Hapus berkas berbahaya secara permanen dari server.
     */
    public function deleteFile(Request $request, Site $site): JsonResponse
    {
        $validated = $request->validate([
            'file_path' => 'required|string',
        ]);

        try {
            $result = $this->investigationService->deleteFile($site, $validated['file_path'], auth()->id());

            activity('server_investigation')
                ->performedOn($site)
                ->withProperties(['file' => $validated['file_path']])
                ->log("Berkas {$validated['file_path']} berhasil dihapus permanen pada situs {$site->name}");

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus berkas: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Pulihkan berkas inti (misal index.php) dari komit Git baseline atau backup snapshot.
     */
    public function rollbackFile(Request $request, Site $site): JsonResponse
    {
        $validated = $request->validate([
            'file_path' => 'required|string',
        ]);

        try {
            $result = $this->investigationService->rollbackFile($site, $validated['file_path']);

            activity('server_investigation')
                ->performedOn($site)
                ->withProperties(['file' => $validated['file_path']])
                ->log("Rollback berkas {$validated['file_path']} berhasil dilakukan pada situs {$site->name}");

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memulihkan berkas: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Alihkan situs ke mode darurat (maintenance mode) atau kembalikan ke normal.
     */
    public function toggleMaintenance(Request $request, Site $site): JsonResponse
    {
        $validated = $request->validate([
            'enable' => 'required|boolean',
        ]);

        try {
            $result = $this->investigationService->toggleMaintenance($site, (bool) $validated['enable']);

            activity('server_investigation')
                ->performedOn($site)
                ->withProperties(['is_maintenance' => $validated['enable']])
                ->log("Mode darurat (maintenance) " . ($validated['enable'] ? 'diaktifkan' : 'dinonaktifkan') . " pada situs {$site->name}");

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah status pemeliharaan situs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Analisis log akses web server untuk melacak jejak dan IP penyerang.
     */
    public function analyzeLogs(Request $request, Site $site): JsonResponse
    {
        $validated = $request->validate([
            'custom_log_path' => 'nullable|string',
        ]);

        try {
            $result = $this->investigationService->analyzeLogs($site, $validated['custom_log_path'] ?? null);

            activity('server_investigation')
                ->performedOn($site)
                ->log("Analisis log web server dijalankan pada situs {$site->name}");

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menganalisis berkas log: ' . $e->getMessage(),
            ], 500);
        }
    }
}
