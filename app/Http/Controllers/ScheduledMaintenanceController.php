<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ScheduledMaintenance;
use App\Models\Site;
use Inertia\Inertia;
use Carbon\Carbon;

class ScheduledMaintenanceController extends Controller
{
    /**
     * Display a listing of scheduled maintenances.
     */
    public function index(Request $request)
    {
        $query = ScheduledMaintenance::with(['sites:id,name,url,category', 'creator:id,name'])
            ->latest('start_time');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('sites', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%")
                         ->orWhere('url', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $maintenances = $query->paginate(10)->withQueryString();

        $stats = [
            'total' => ScheduledMaintenance::count(),
            'in_progress' => ScheduledMaintenance::where('status', 'in_progress')->count(),
            'scheduled' => ScheduledMaintenance::where('status', 'scheduled')->count(),
            'completed' => ScheduledMaintenance::where('status', 'completed')->count(),
        ];

        $availableSites = Site::where('is_active', true)
            ->select('id', 'name', 'url', 'category')
            ->orderBy('name')
            ->get();

        return Inertia::render('Pemeliharaan/Index', [
            'maintenances' => $maintenances,
            'stats' => $stats,
            'availableSites' => $availableSites,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
            ],
        ]);
    }

    /**
     * Store a newly created scheduled maintenance in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'site_ids' => 'required|array|min:1',
            'site_ids.*' => 'exists:sites,id',
        ], [
            'title.required' => 'Judul pemeliharaan wajib diisi.',
            'site_ids.required' => 'Pilih minimal satu situs yang terdampak.',
            'site_ids.min' => 'Pilih minimal satu situs yang terdampak.',
            'end_time.after' => 'Waktu selesai harus setelah waktu mulai.',
        ]);

        $maintenance = ScheduledMaintenance::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'start_time' => Carbon::parse($validated['start_time']),
            'end_time' => Carbon::parse($validated['end_time']),
            'created_by' => auth()->id(),
        ]);

        $maintenance->sites()->sync($validated['site_ids']);

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'title' => 'Berhasil Disimpan',
            'message' => "Jadwal pemeliharaan \"{$maintenance->title}\" berhasil dibuat.",
        ]);
    }

    /**
     * Update the specified scheduled maintenance.
     */
    public function update(Request $request, ScheduledMaintenance $maintenance)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'site_ids' => 'required|array|min:1',
            'site_ids.*' => 'exists:sites,id',
        ], [
            'title.required' => 'Judul pemeliharaan wajib diisi.',
            'site_ids.required' => 'Pilih minimal satu situs yang terdampak.',
            'end_time.after' => 'Waktu selesai harus setelah waktu mulai.',
        ]);

        $maintenance->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'start_time' => Carbon::parse($validated['start_time']),
            'end_time' => Carbon::parse($validated['end_time']),
        ]);

        $maintenance->sites()->sync($validated['site_ids']);

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'title' => 'Berhasil Diperbarui',
            'message' => "Jadwal pemeliharaan \"{$maintenance->title}\" berhasil diperbarui.",
        ]);
    }

    /**
     * Quick update status.
     */
    public function updateStatus(Request $request, ScheduledMaintenance $maintenance)
    {
        $validated = $request->validate([
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
        ]);

        $maintenance->update(['status' => $validated['status']]);

        $statusLabels = [
            'scheduled' => 'Terjadwal',
            'in_progress' => 'Sedang Berlangsung',
            'completed' => 'Selesai',
            'cancelled' => 'Dibatalkan',
        ];

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'title' => 'Status Diperbarui',
            'message' => "Status diubah menjadi: {$statusLabels[$validated['status']]}.",
        ]);
    }

    /**
     * Remove the specified scheduled maintenance.
     */
    public function destroy(ScheduledMaintenance $maintenance)
    {
        $title = $maintenance->title;
        $maintenance->sites()->detach();
        $maintenance->delete();

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'title' => 'Berhasil Dihapus',
            'message' => "Jadwal pemeliharaan \"{$title}\" telah dihapus.",
        ]);
    }
}
