<?php

namespace App\Http\Controllers;

use App\Services\AiRemediationService;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AiRemediationController extends Controller
{
    protected AiRemediationService $aiService;

    public function __construct(AiRemediationService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'incident_id'   => 'required|exists:incidents,id',
            'extra_context' => 'nullable|string|max:1000',
            'model'         => 'nullable|string',
        ]);

        $incident = Incident::with(['site', 'conversations'])->findOrFail($request->incident_id);

        $incidentData = [
            'title'       => $incident->title,
            'site_name'   => $incident->site ? $incident->site->name : 'Situs Terpantau',
            'site_url'    => $incident->site ? $incident->site->url : '',
            'severity'    => $incident->severity,
            'description' => $incident->description,
            'type'        => $incident->type,
        ];

        // Format history for service
        $history = $incident->conversations->map(fn($c) => [
            'user_message' => $c->user_message,
            'ai_response'  => $c->ai_response,
        ])->toArray();

        $result = $this->aiService->generateRemediationPlan($incidentData, $request->extra_context, $request->model, $history);

        // Save conversation record into DB
        if (!empty($result['content'])) {
            $userMsg = $request->extra_context ?: ($incident->conversations()->count() === 0 ? 'Minta rekomendasi perbaikan awal' : 'Pertanyaan lanjutan');
            
            $newConversation = \App\Models\IncidentConversation::create([
                'incident_id'  => $incident->id,
                'user_message' => $userMsg,
                'ai_response'  => $result['content'],
                'model_used'   => $result['model'] ?? ($request->model ?: 'model-2'),
                'provider'     => $result['provider'] ?? '9router AI Engine',
            ]);
        }

        // Return updated conversation list
        $conversations = $incident->conversations()->get();

        return response()->json([
            'success'       => true,
            'data'          => $result,
            'conversations' => $conversations,
        ]);
    }

    public function history(Incident $incident): JsonResponse
    {
        $conversations = $incident->conversations()->get();
        return response()->json([
            'success'       => true,
            'conversations' => $conversations,
        ]);
    }
}
