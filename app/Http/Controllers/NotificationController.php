<?php

namespace App\Http\Controllers;

use App\Http\Requests\NotificationIndexRequest;
use App\Http\Resources\NotificationResource;
use App\Http\Resources\PaginateResource;
use App\Services\Interfaces\NotificationServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationServiceInterface $notificationService
    ) {}

    /**
     * Display a paginated listing of notifications for the authenticated user.
     */
    public function index(NotificationIndexRequest $request): Response
    {
        $user = $request->user();
        Gate::authorize('viewAny', \Illuminate\Notifications\DatabaseNotification::class);

        $filters = $request->filters();
        $perPage = (int) $request->input('per_page', 10);

        $notifications = $this->notificationService->getPaginatedForUser($user, $perPage, $filters);
        $stats = $this->notificationService->getStatsForUser($user);

        return Inertia::render('Notifikasi/Index', [
            'notifications' => new PaginateResource($notifications, NotificationResource::class),
            'filters'       => $filters,
            'stats'         => $stats,
            'can'           => [
                'clearAll'    => Gate::allows('clearAll', \Illuminate\Notifications\DatabaseNotification::class),
                'markAllRead' => Gate::allows('markAllRead', \Illuminate\Notifications\DatabaseNotification::class),
            ],
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, string $id)
    {
        $user = $request->user();
        $notification = $this->notificationService->findForUser($user, $id);

        if (!$notification) {
            return redirect()->back()->with('error', 'Notifikasi tidak ditemukan.');
        }

        Gate::authorize('markAsRead', $notification);

        $this->notificationService->markAsRead($user, $id);

        return redirect()->back()->with('success', 'Notifikasi telah ditandai sebagai sudah dibaca.');
    }

    /**
     * Mark all unread notifications for the authenticated user as read.
     */
    public function markAllRead(Request $request)
    {
        $user = $request->user();
        Gate::authorize('markAllRead', \Illuminate\Notifications\DatabaseNotification::class);

        $affected = $this->notificationService->markAllAsRead($user);

        return redirect()->back()->with('success', "{$affected} notifikasi berhasil ditandai sebagai sudah dibaca.");
    }

    /**
     * Delete a specific notification.
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $notification = $this->notificationService->findForUser($user, $id);

        if (!$notification) {
            return redirect()->back()->with('error', 'Notifikasi tidak ditemukan.');
        }

        Gate::authorize('delete', $notification);

        $this->notificationService->delete($user, $id);

        return redirect()->back()->with('success', 'Notifikasi berhasil dihapus.');
    }

    /**
     * Clear all notifications for the authenticated user.
     */
    public function clearAll(Request $request)
    {
        $user = $request->user();
        Gate::authorize('clearAll', \Illuminate\Notifications\DatabaseNotification::class);

        $affected = $this->notificationService->clearAll($user);

        return redirect()->back()->with('success', "Seluruh riwayat ({$affected}) notifikasi telah dibersihkan.");
    }
}
