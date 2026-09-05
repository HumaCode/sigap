<?php

namespace App\Http\Controllers;

use App\Http\Requests\SiteRequest;
use App\Http\Resources\PaginateResource;
use App\Http\Resources\SiteResource;
use App\Services\SiteService;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    public function __construct(protected SiteService $siteService) {}

    public function index(Request $request)
    {
        $sites = $this->siteService->getSites(
            $request->input('per_page', 10),
            $request->input('search', ''),
            $request->input('filter', 'all')
        );

        $stats = [
            'total' => \App\Models\Site::count(),
            'up' => \App\Models\Site::where('status', 'up')->count(),
            'down' => \App\Models\Site::where('status', 'down')->count(),
            'warn' => \App\Models\Site::where('status', 'warn')->count(),
            'paused' => \App\Models\Site::where('status', 'paused')->count(),
        ];

        return inertia('Sites/Index', [
            'sites' => new PaginateResource($sites, SiteResource::class),
            'filters' => $request->only(['search', 'filter']),
            'stats' => $stats
        ]);
    }

    public function store(SiteRequest $request)
    {
        $this->siteService->createSite($request->validated());
        return redirect()->route('sites.index')->with('success', 'Situs berhasil didaftarkan');
    }

    public function update(SiteRequest $request, $id)
    {
        $this->siteService->updateSite($id, $request->validated());
        return redirect()->route('sites.index')->with('success', 'Situs berhasil diperbarui');
    }

    public function destroy($id)
    {
        $this->siteService->deleteSite($id);
        return redirect()->route('sites.index')->with('success', 'Situs berhasil dihapus');
    }

    public function recheck($id, \App\Services\UptimeCheckService $uptimeCheckService)
    {
        $site = \App\Models\Site::findOrFail($id);
        $result = $uptimeCheckService->checkSite($site);

        $statusText = $result['status'] === 'up' ? 'Online' : "Offline ({$result['status_code']})";
        return redirect()->back()->with('success', "Pengecekan ulang selesai. Status situs saat ini: {$statusText}");
    }

    public function testSshConnection(\Illuminate\Http\Request $request)
    {
        $host = $request->input('ssh_host');
        $port = (int)($request->input('ssh_port') ?: 22);
        $username = $request->input('ssh_username');
        $authType = $request->input('ssh_auth_type', 'password');
        $password = $request->input('ssh_password');
        $privateKey = $request->input('ssh_private_key');
        $appPath = rtrim($request->input('ssh_app_path') ?: '', '/');

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

            $ssh = new \phpseclib3\Net\SSH2($host, $port, 10);

            $authenticated = false;
            if ($authType === 'key') {
                if (!$privateKey) {
                    return response()->json(['success' => false, 'message' => 'SSH Private Key kosong.'], 422);
                }
                $key = \phpseclib3\Crypt\PublicKeyLoader::load($privateKey);
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
}
