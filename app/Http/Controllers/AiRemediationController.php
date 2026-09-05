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
            'incident_id'   => 'required',
            'extra_context' => 'nullable|string|max:1000',
            'model'         => 'nullable|string',
            'title'         => 'nullable|string',
            'site_name'     => 'nullable|string',
            'site_url'      => 'nullable|string',
            'severity'      => 'nullable|string',
            'type'          => 'nullable|string',
            'description'   => 'nullable|string',
        ]);

        $incidentId = $request->incident_id;

        // If numeric ID, fetch real incident
        if (is_numeric($incidentId)) {
            $incident = Incident::with(['site', 'conversations'])->find($incidentId);
        } else {
            // Virtual/Security audit item, find by title or create temporary DB incident for conversation persistence
            $incident = Incident::with(['site', 'conversations'])->where('title', $request->title ?: 'Security Audit AuditItem')->first();
            
            if (!$incident) {
                $site = \App\Models\Site::where('name', $request->site_name)->first();
                $incident = Incident::create([
                    'site_id'     => $site ? $site->id : 1,
                    'title'       => $request->title ?: 'Audit Keamanan Situs',
                    'type'        => $request->type ?: 'security_audit',
                    'severity'    => $request->severity ?: 'high',
                    'status'      => 'investigating',
                    'description' => $request->description ?: 'Temuan audit keamanan situs.',
                    'detected_at' => now(),
                ]);
            }
        }

        $incidentData = [
            'title'       => $incident ? $incident->title : ($request->title ?: 'Audit Keamanan Situs'),
            'site_name'   => $incident && $incident->site ? $incident->site->name : ($request->site_name ?: 'Situs Terpantau'),
            'site_url'    => $incident && $incident->site ? $incident->site->url : ($request->site_url ?: ''),
            'severity'    => $incident ? $incident->severity : ($request->severity ?: 'high'),
            'description' => $incident ? $incident->description : ($request->description ?: ''),
            'type'        => $incident ? $incident->type : ($request->type ?: 'security_audit'),
        ];

        // Format history for service
        $history = $incident ? $incident->conversations->map(fn($c) => [
            'user_message' => $c->user_message,
            'ai_response'  => $c->ai_response,
        ])->toArray() : [];

        $result = $this->aiService->generateRemediationPlan($incidentData, $request->extra_context, $request->model, $history);

        // Save conversation record into DB if incident exists
        if ($incident && !empty($result['content'])) {
            $userMsg = $request->extra_context ?: ($incident->conversations()->count() === 0 ? 'Minta rekomendasi perbaikan awal' : 'Pertanyaan lanjutan');
            
            \App\Models\IncidentConversation::create([
                'incident_id'  => $incident->id,
                'user_message' => $userMsg,
                'ai_response'  => $result['content'],
                'model_used'   => $result['model'] ?? ($request->model ?: 'model-2'),
                'provider'     => $result['provider'] ?? '9router AI Engine',
            ]);
        }

        // Return updated conversation list
        $conversations = $incident ? $incident->conversations()->get() : [];

        return response()->json([
            'success'       => true,
            'data'          => $result,
            'conversations' => $conversations,
        ]);
    }

    public function history($incident): JsonResponse
    {
        if (is_numeric($incident)) {
            $inc = Incident::find($incident);
            $conversations = $inc ? $inc->conversations()->get() : [];
        } else {
            $conversations = [];
        }

        return response()->json([
            'success'       => true,
            'conversations' => $conversations,
        ]);
    }
}
