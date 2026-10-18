<?php

namespace App\Http\Controllers;

use App\Models\Site;
use App\Models\Incident;
use App\Models\Keyword;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function search(Request $request)
    {
        $q = trim($request->get('q', ''));
        if (strlen($q) < 2) {
            return response()->json([
                'categories' => [],
                'total' => 0,
                'query' => $q,
            ]);
        }

        $results = [];

        // 1. Navigation / Menu Category
        $navItems = [
            ['name' => 'Dashboard Utama', 'url' => route('dashboard'), 'icon' => 'bi-grid-1x2-fill', 'desc' => 'Ringkasan operasional & tren uptime'],
            ['name' => 'Daftar Situs Terpantau', 'url' => route('sites.index'), 'icon' => 'bi-hdd-network', 'desc' => 'Inventaris aset & status ketersediaan'],
            ['name' => 'Statistik & Telemetri', 'url' => route('statistics.index'), 'icon' => 'bi-pie-chart-fill', 'desc' => 'Radar SOC & agregat SLA ketersediaan'],
            ['name' => 'Laporan Uptime', 'url' => route('reports.uptime'), 'icon' => 'bi-graph-up-arrow', 'desc' => 'Rekapitulasi riwayat ketersediaan'],
            ['name' => 'Rapor Mutu Website', 'url' => route('scorecard.index'), 'icon' => 'bi-award-fill', 'desc' => 'Indeks kematangan & kepatuhan website'],
            ['name' => 'Insiden Keamanan', 'url' => route('incidents.index'), 'icon' => 'bi-shield-exclamation', 'desc' => 'Daftar insiden siber & downtime'],
            ['name' => 'Log Deteksi Konten', 'url' => route('logs.detection'), 'icon' => 'bi-bug-fill', 'desc' => 'Riwayat temuan anomali & sisipan'],
            ['name' => 'Kamus Kata Kunci', 'url' => route('keywords.index'), 'icon' => 'bi-journal-code', 'desc' => 'Pustaka kata kunci pemindaian'],
            ['name' => 'Forensik & Scanner Keamanan', 'url' => route('security.index'), 'icon' => 'bi-shield-check', 'desc' => 'Audit header, SSL, dan file sensitif'],
            ['name' => 'Investigasi Server', 'url' => route('server-investigations.index'), 'icon' => 'bi-terminal-fill', 'desc' => 'Diagnostik resource & karantina file'],
            ['name' => 'Pemeliharaan Terjadwal', 'url' => route('maintenance.index'), 'icon' => 'bi-calendar-event-fill', 'desc' => 'Jadwal pemeliharaan server'],
            ['name' => 'Pengguna & Peran', 'url' => route('users.index'), 'icon' => 'bi-people', 'desc' => 'Manajemen akses dan tim'],
            ['name' => 'Notifikasi & Alert', 'url' => route('notifications.index'), 'icon' => 'bi-bell', 'desc' => 'Pusat pemberitahuan sistem'],
            ['name' => 'Backup & Pemulihan', 'url' => route('backups.index'), 'icon' => 'bi-archive-fill', 'desc' => 'Cadangan database & snapshot'],
            ['name' => 'Pengaturan Sistem', 'url' => route('settings.index'), 'icon' => 'bi-gear', 'desc' => 'Konfigurasi platform SIGAP'],
        ];

        $matchedNav = array_values(array_filter($navItems, function ($item) use ($q) {
            return stripos($item['name'], $q) !== false || stripos($item['desc'], $q) !== false;
        }));

        if (!empty($matchedNav)) {
            $results[] = [
                'category_id' => 'navigation',
                'category_name' => 'Navigasi & Menu Pintasan',
                'category_icon' => 'bi-compass-fill',
                'category_color' => '#0284c7',
                'category_bg' => 'rgba(2, 132, 199, 0.1)',
                'items' => array_map(function ($item) {
                    return [
                        'id' => $item['url'],
                        'title' => $item['name'],
                        'subtitle' => $item['desc'],
                        'badge' => 'Menu',
                        'badge_type' => 'primary',
                        'url' => $item['url'],
                        'icon' => $item['icon'],
                    ];
                }, array_slice($matchedNav, 0, 4))
            ];
        }

        // 2. Sites Category
        $qLower = strtolower($q);
        $sites = Site::where(function ($sq) use ($qLower) {
            $sq->whereRaw('LOWER(name) LIKE ?', ["%{$qLower}%"])
               ->orWhereRaw('LOWER(url) LIKE ?', ["%{$qLower}%"])
               ->orWhereRaw('LOWER(category) LIKE ?', ["%{$qLower}%"])
               ->orWhereRaw('LOWER(COALESCE(domain_name, "")) LIKE ?', ["%{$qLower}%"]);
        })
            ->take(5)
            ->get(['id', 'name', 'url', 'status', 'category'])
            ->map(function ($s) {
                return [
                    'id' => (string) $s->id,
                    'title' => $s->name,
                    'subtitle' => $s->url,
                    'badge' => $s->status === 'up' ? 'Online' : ($s->status === 'down' ? 'Down' : 'Atensi'),
                    'badge_type' => $s->status === 'up' ? 'success' : ($s->status === 'down' ? 'danger' : 'warning'),
                    'url' => route('sites.index') . '?search=' . urlencode($s->name),
                    'icon' => 'bi-globe2',
                ];
            });

        if ($sites->isNotEmpty()) {
            $results[] = [
                'category_id' => 'sites',
                'category_name' => 'Situs Web & Domain',
                'category_icon' => 'bi-hdd-network-fill',
                'category_color' => '#0ea5a3',
                'category_bg' => 'rgba(14, 165, 163, 0.1)',
                'items' => $sites->toArray()
            ];
        }

        // 3. Incidents Category
        $incidents = Incident::with('site:id,name')
            ->where('title', 'like', "%{$q}%")
            ->take(5)
            ->get(['id', 'title', 'severity', 'status', 'site_id', 'created_at'])
            ->map(function ($inc) {
                return [
                    'id' => (string) $inc->id,
                    'title' => $inc->title,
                    'subtitle' => ($inc->site?->name ?? 'Domain') . ' • ' . ($inc->created_at ? $inc->created_at->diffForHumans() : 'baru saja'),
                    'badge' => ucfirst($inc->severity),
                    'badge_type' => $inc->severity === 'critical' ? 'danger' : ($inc->severity === 'high' ? 'warning' : 'info'),
                    'url' => route('incidents.index') . '?search=' . urlencode($inc->title),
                    'icon' => 'bi-shield-exclamation',
                ];
            });

        if ($incidents->isNotEmpty()) {
            $results[] = [
                'category_id' => 'incidents',
                'category_name' => 'Insiden Keamanan & Downtime',
                'category_icon' => 'bi-exclamation-triangle-fill',
                'category_color' => '#dc2626',
                'category_bg' => 'rgba(239, 68, 68, 0.1)',
                'items' => $incidents->toArray()
            ];
        }

        // 4. Keywords Category
        $keywords = Keyword::where('keyword', 'like', "%{$q}%")
            ->take(5)
            ->get(['id', 'keyword', 'category'])
            ->map(function ($kw) {
                return [
                    'id' => (string) $kw->id,
                    'title' => $kw->keyword,
                    'subtitle' => 'Kategori: ' . ($kw->category ?: 'Umum'),
                    'badge' => 'Kata Kunci',
                    'badge_type' => 'secondary',
                    'url' => route('keywords.index') . '?search=' . urlencode($kw->keyword),
                    'icon' => 'bi-journal-code',
                ];
            });

        if ($keywords->isNotEmpty()) {
            $results[] = [
                'category_id' => 'keywords',
                'category_name' => 'Kamus Kata Kunci Deteksi',
                'category_icon' => 'bi-journal-bookmark-fill',
                'category_color' => '#8b5cf6',
                'category_bg' => 'rgba(139, 92, 246, 0.1)',
                'items' => $keywords->toArray()
            ];
        }

        $totalCount = array_reduce($results, function ($carry, $cat) {
            return $carry + count($cat['items']);
        }, 0);

        return response()->json([
            'categories' => $results,
            'total' => $totalCount,
            'query' => $q
        ]);
    }
}
