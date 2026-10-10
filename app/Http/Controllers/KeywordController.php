<?php

namespace App\Http\Controllers;

use App\Http\Requests\KeywordIndexRequest;
use App\Http\Requests\StoreKeywordRequest;
use App\Http\Requests\UpdateKeywordRequest;
use App\Http\Resources\KeywordResource;
use App\Http\Resources\PaginateResource;
use App\Services\Interfaces\KeywordServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class KeywordController extends Controller
{
    public function __construct(protected KeywordServiceInterface $keywordService) {}

    /**
     * Display a listing of the keywords.
     */
    public function index(KeywordIndexRequest $request): Response
    {
        $filters = $request->filters();
        $perPage = (int) $request->input('per_page', 10);

        $keywords = $this->keywordService->getPaginatedKeywords($filters, $perPage);
        $stats = $this->keywordService->getStats();
        $user = $request->user();

        return Inertia::render('Keyword/Index', [
            'keywords' => new PaginateResource($keywords, KeywordResource::class),
            'filters' => (object) $filters,
            'stats' => $stats,
            'can' => [
                'create' => $user?->can('create-keywords') ?? false,
                'edit' => $user?->can('edit-keywords') ?? false,
                'delete' => $user?->can('delete-keywords') ?? false,
            ],
        ]);
    }

    /**
     * Store a newly created keyword in storage.
     */
    public function store(StoreKeywordRequest $request): RedirectResponse
    {
        $this->keywordService->createKeyword($request->validated());
        return redirect()->back()->with('success', 'Kata kunci berhasil ditambahkan.');
    }

    /**
     * Update the specified keyword in storage.
     */
    public function update(UpdateKeywordRequest $request, string|int $id): RedirectResponse
    {
        $this->keywordService->updateKeyword($id, $request->validated());
        return redirect()->back()->with('success', 'Kata kunci berhasil diperbarui.');
    }

    /**
     * Remove the specified keyword from storage.
     */
    public function destroy(string|int $id): RedirectResponse
    {
        Gate::authorize('delete-keywords');

        $this->keywordService->deleteKeyword($id);
        return redirect()->back()->with('success', 'Kata kunci berhasil dihapus.');
    }
}
