<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Models\SiteBackup;
use App\Services\BackupService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BackupController extends Controller
{
    public function __construct(protected BackupService $backupService) {}

    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $siteFilter = $request->input('site_id', '');
        $typeFilter = $request->input('type', '');

        $query = SiteBackup::with(['site', 'creator'])->latest();

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('filename', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('site', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%")
                         ->orWhere('url', 'like', "%{$search}%");
                  });
            });
        }

        if (!empty($siteFilter)) {
            $query->where('site_id', $siteFilter);
        }

        if (!empty($typeFilter)) {
            $query->where('backup_type', $typeFilter);
        }

        $backups = $query->paginate($request->input('per_page', 10))->withQueryString();

        // Calculate statistics
        $totalCount = SiteBackup::count();
        $totalBytes = (int)SiteBackup::sum('file_size');
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = $totalBytes > 0 ? floor(log($totalBytes, 1024)) : 0;
        $power = min($power, count($units) - 1);
        $totalSizeFormatted = $totalBytes > 0 ? round($totalBytes / pow(1024, $power), 2) . ' ' . $units[$power] : '0 MB';

        $protectedSitesCount = SiteBackup::distinct('site_id')->count('site_id');
        $latestBackup = SiteBackup::latest()->first();

        // Get sites with SSH enabled for creating new backups
        $sshSites = Site::whereNotNull('ssh_host')
            ->where('ssh_host', '!=', '')
            ->whereNotNull('ssh_app_path')
            ->where('ssh_app_path', '!=', '')
            ->orderBy('name')
            ->get(['id', 'name', 'url', 'ssh_app_path', 'ssh_host']);

        return Inertia::render('Backup/Index', [
            'backups' => [
                'data' => $backups->items(),
                'links' => $backups->linkCollection()->toArray(),
                'meta' => [
                    'current_page' => $backups->currentPage(),
                    'from' => $backups->firstItem(),
                    'last_page' => $backups->lastPage(),
                    'links' => $backups->linkCollection()->toArray(),
                    'path' => $backups->path(),
                    'per_page' => $backups->perPage(),
                    'to' => $backups->lastItem(),
                    'total' => $backups->total(),
                ],
            ],
            'filters' => [
                'search' => $search,
                'site_id' => $siteFilter,
                'type' => $typeFilter,
            ],
            'stats' => [
                'total_backups' => $totalCount,
                'total_size_formatted' => $totalSizeFormatted,
                'protected_sites_count' => $protectedSitesCount,
                'latest_backup_time' => $latestBackup ? $latestBackup->created_at->format('d M Y, H:i') : '-',
            ],
            'sshSites' => $sshSites,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'site_id' => 'required|exists:sites,id',
            'notes' => 'nullable|string|max:500',
        ]);

        $site = Site::findOrFail($request->input('site_id'));

        try {
            $backup = $this->backupService->createBackup(
                $site,
                $request->input('notes'),
                'manual',
                $request->user()?->id
            );

            return redirect()->back()->with('success', "Arsip backup \"{$backup->filename}\" ({$backup->formatted_size}) berhasil dibuat via SSH.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Gagal membuat backup: " . $e->getMessage());
        }
    }

    public function download(Request $request, $id)
    {
        $backup = SiteBackup::with('site')->findOrFail($id);
        $isAjax = $request->ajax() || $request->header('X-Download-Mode') === 'stream' || $request->has('stream');
        return $this->backupService->streamDownload($backup, $isAjax);
    }

    public function restore($id)
    {
        $backup = SiteBackup::with('site')->findOrFail($id);

        try {
            $this->backupService->restoreBackup($backup);
            return redirect()->back()->with('success', "Situs \"{$backup->site->name}\" berhasil dipulihkan dari arsip \"{$backup->filename}\".");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Gagal memulihkan situs: " . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $backup = SiteBackup::with('site')->findOrFail($id);
        $filename = $backup->filename;

        try {
            $this->backupService->deleteBackup($backup);
            return redirect()->back()->with('success', "Arsip backup \"{$filename}\" berhasil dihapus.");
        } catch (\Exception $e) {
            return redirect()->back()->with('error', "Gagal menghapus arsip: " . $e->getMessage());
        }
    }
}
