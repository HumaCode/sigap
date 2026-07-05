<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreKeywordRequest;
use App\Http\Requests\UpdateKeywordRequest;
use App\Services\KeywordService;
use App\Http\Resources\KeywordResource;
use App\Models\Keyword;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KeywordController extends Controller
{
    public function __construct(protected KeywordService $keywordService) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'filter']);
        
        $keywords = $this->keywordService->getPaginatedKeywords($filters, 10);
        
        // Let's get some stats for the cards
        $stats = [
            'total' => Keyword::count(),
            'judol' => Keyword::where('category', 'judol')->count(),
            'obat' => Keyword::where('category', 'obat')->count(),
            'regex' => Keyword::where('type', 'regex')->where('is_active', true)->count(),
        ];

        return Inertia::render('Keyword/Index', [
            'keywords' => KeywordResource::collection($keywords),
            'filters' => (object) $filters,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreKeywordRequest $request)
    {
        $this->keywordService->createKeyword($request->validated());
        return redirect()->back()->with('success', 'Kata kunci berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateKeywordRequest $request, string $id)
    {
        $this->keywordService->updateKeyword($id, $request->validated());
        return redirect()->back()->with('success', 'Kata kunci berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $this->keywordService->deleteKeyword($id);
        return redirect()->back()->with('success', 'Kata kunci berhasil dihapus.');
    }
}
