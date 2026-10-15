<?php

namespace App\Http\Controllers;

use App\Services\ScorecardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ScorecardController extends Controller
{
    public function __construct(protected ScorecardService $scorecardService) {}

    /**
     * Display the Executive Website Quality Scorecard & Leaderboard.
     */
    public function index(Request $request): Response
    {
        $filters = [
            'search' => $request->input('search', ''),
            'category' => $request->input('category', 'all'),
        ];

        $data = $this->scorecardService->getLeaderboard($filters);

        return Inertia::render('Scorecard/Index', [
            'leaderboard' => $data['leaderboard'],
            'summary' => $data['summary'],
            'categories' => $data['categories'],
            'filters' => $filters,
            'can' => [
                'export' => $request->user()?->can('export-uptime-reports') ?? true,
            ],
        ]);
    }

    /**
     * Export Scorecard / Leaderboard to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $filters = [
            'search' => $request->input('search', ''),
            'category' => $request->input('category', 'all'),
        ];

        return $this->scorecardService->exportScorecard($filters);
    }
}
