<?php

namespace App\Http\Controllers;

use App\Http\Requests\SiteRequest;
use App\Http\Resources\PaginateResource;
use App\Http\Resources\SiteResource;
use App\Models\Site;
use App\Services\SiteService;
use App\Services\UptimeCheckService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use phpseclib3\Crypt\PublicKeyLoader;
use phpseclib3\Net\SSH2;

class SiteController extends Controller
{
    public function __construct(protected SiteService $siteService) {}

    public function index(Request $request)
    {
        Gate::authorize('viewAny', Site::class);

        $sites = $this->siteService->getSites(
            $request->input('per_page', 10),
            $request->input('search', ''),
            $request->input('filter', 'all')
        );

        $statsRow = Site::toBase()->selectRaw("
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'up' THEN 1 END) as up_count,
            COUNT(CASE WHEN status = 'down' THEN 1 END) as down_count,
            COUNT(CASE WHEN status = 'warn' THEN 1 END) as warn_count,
            COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_count
        ")->first();

        $stats = [
            'total'  => (int) ($statsRow->total ?? 0),
            'up'     => (int) ($statsRow->up_count ?? 0),
            'down'   => (int) ($statsRow->down_count ?? 0),
            'warn'   => (int) ($statsRow->warn_count ?? 0),
            'paused' => (int) ($statsRow->paused_count ?? 0),
        ];

        $user = $request->user();

        return inertia('Sites/Index', [
            'sites' => new PaginateResource($sites, SiteResource::class),
            'filters' => $request->only(['search', 'filter']),
            'stats' => $stats,
            'can' => [
                'create' => $user?->can('create', Site::class) ?? false,
                'update' => $user?->can('update', Site::class) ?? false,
                'delete' => $user?->can('delete', Site::class) ?? false,
                'check' => $user?->can('checkUptime', Site::class) ?? false,
                'manageSsh' => $user?->can('manageSsh', Site::class) ?? false,
            ]
        ]);
    }

    public function store(SiteRequest $request)
    {
        Gate::authorize('create', Site::class);

        $this->siteService->createSite($request->validated());
        return redirect()->route('sites.index')->with('success', 'Situs berhasil didaftarkan');
    }

    public function update(SiteRequest $request, $id)
    {
        $site = Site::findOrFail($id);
        Gate::authorize('update', $site);

        $this->siteService->updateSite($id, $request->validated());
        return redirect()->route('sites.index')->with('success', 'Situs berhasil diperbarui');
    }

    public function destroy($id)
    {
        $site = Site::findOrFail($id);
        Gate::authorize('delete', $site);

        $this->siteService->deleteSite($id);
        return redirect()->route('sites.index')->with('success', 'Situs berhasil dihapus');
    }

    public function recheck($id, UptimeCheckService $uptimeCheckService)
    {
        $site = Site::findOrFail($id);
        Gate::authorize('checkUptime', $site);

        $result = $uptimeCheckService->checkSite($site);

        $statusText = $result['status'] === 'up' ? 'Online' : "Offline ({$result['status_code']})";
        return redirect()->back()->with('success', "Pengecekan ulang selesai. Status situs saat ini: {$statusText}");
    }

    public function testSshConnection(Request $request)
    {
        Gate::authorize('manageSsh', Site::class);

        $host = $request->input('ssh_host');
        $port = (int)($request->input('ssh_port') ?: 22);
        $username = $request->input('ssh_username');
        $authType = $request->input('ssh_auth_type', 'password');
        $password = $request->input('ssh_password');
        $privateKey = $request->input('ssh_private_key');
        $appPath = rtrim($request->input('ssh_app_path') ?: '', '/');
        $siteId = $request->input('site_id');

        // If in edit mode and password/key is masked (********) or empty, retrieve existing saved credentials
        if ($siteId) {
            $existingSite = Site::find($siteId);
            if ($existingSite) {
                if ($authType === 'password' && ($password === '********' || empty($password))) {
                    $password = $existingSite->ssh_password;
                } elseif ($authType === 'key' && ($privateKey === '********' || empty($privateKey))) {
                    $privateKey = $existingSite->ssh_private_key;
                }
            }
        }

        if (empty($host) || empty($username)) {
            return response()->json([
                'success' => false,
                'message' => 'Host/IP SSH dan Username wajib diisi.'
            ], 422);
        }

        try {
            // First perform low-level socket check to verify TCP accessibility
            $socket = @fsockopen($host, $port, $errno, $errstr, 5);
            if (!$socket) {
                return response()->json([
                    'success' => false,
                    'message' => "Port SSH {$port} pada host {$host} tidak dapat dijangkau dari server SIGAP. Keterangan: [Err {$errno}] {$errstr}. Pastikan port {$port} di-allow pada UFW/Firewall dan Router NAT."
                ], 400);
            }

            // Read banner sample if available
            stream_set_timeout($socket, 3);
            $banner = fgets($socket, 1024);
            fclose($socket);

            $ssh = new SSH2($host, $port, 10);

            $authenticated = false;
            if ($authType === 'key') {
                if (!$privateKey) {
                    return response()->json(['success' => false, 'message' => 'SSH Private Key kosong.'], 422);
                }
                $key = PublicKeyLoader::load($privateKey);
                $authenticated = $ssh->login($username, $key);
            } else {
                $authenticated = $ssh->login($username, $password);
            }

            if (!$authenticated) {
                return response()->json([
                    'success' => false,
                    'message' => 'Autentikasi SSH gagal. Username atau Password/Key tidak cocok untuk akun ' . $username . '.'
                ], 400);
            }

            // Test if directory exists if app path provided
            $pathInfo = '';
            if (!empty($appPath)) {
                $dirExists = trim($ssh->exec("test -d " . escapeshellarg($appPath) . " && echo 'yes' || echo 'no'"));
                if ($dirExists === 'yes') {
                    $pathInfo = " Direktori aplikasi ($appPath) terverifikasi.";
                } else {
                    $pathInfo = " PERINGATAN: Direktori ($appPath) tidak ditemukan di server.";
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Koneksi SSH ke $host:$port ($username) BERHASIL terhubung!" . $pathInfo
            ]);
        } catch (\Exception $e) {
            $bannerHint = isset($banner) && $banner ? " Respon server: " . trim($banner) : "";
            return response()->json([
                'success' => false,
                'message' => 'Gagal terhubung ke server SSH: ' . $e->getMessage() . $bannerHint
            ], 500);
        }
    }

    /**
     * Export Web Asset Inventory & PIC to CSV.
     */
    public function export(Request $request, \App\Services\ExportService $exportService): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        Gate::authorize('viewAny', Site::class);

        return $exportService->exportSitesInventory($request->all());
    }
}
