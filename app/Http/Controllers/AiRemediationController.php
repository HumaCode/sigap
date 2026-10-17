<?php

namespace App\Http\Controllers;

use App\Services\AiRemediationService;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class AiRemediationController extends Controller
{
    protected AiRemediationService $aiService;

    public function __construct(AiRemediationService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function generate(Request $request): JsonResponse
    {
        Gate::authorize('view-incidents');

        try {
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
                // Virtual/Security audit item, find by payload first
                $incident = Incident::with(['site', 'conversations'])
                    ->where('payload', $incidentId)
                    ->first();

                // Next fallback: find by title and site
                if (!$incident) {
                    $site = !empty($request->site_name) ? \App\Models\Site::where('name', $request->site_name)->first() : null;
                    $query = Incident::with(['site', 'conversations'])->where('title', $request->title ?: 'Security Audit AuditItem');
                    if ($site) {
                        $query->where('site_id', $site->id);
                    }
                    $incident = $query->first();

                    if ($incident) {
                        $incident->update(['payload' => $incidentId]);
                    }
                }
                
                // If still not found, create new incident record
                if (!$incident) {
                    $site = !empty($request->site_name) ? \App\Models\Site::where('name', $request->site_name)->first() : null;
                    $fallbackSiteId = \App\Models\Site::value('id');
                    $incident = Incident::create([
                        'site_id'     => $site ? $site->id : $fallbackSiteId,
                        'title'       => $request->title ?: 'Audit Keamanan Situs',
                        'type'        => $request->type ?: 'security_audit',
                        'severity'    => $request->severity ?: 'high',
                        'status'      => 'investigating',
                        'description' => $request->description ?: 'Temuan audit keamanan situs.',
                        'payload'     => $incidentId,
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
                $userMsg = $request->extra_context ?: ($incident->conversations->count() === 0 ? 'Minta rekomendasi perbaikan awal' : 'Pertanyaan lanjutan');
                $aiContent = trim($result['content']);
                if (empty($aiContent)) {
                    $aiContent = 'Tidak ada konten respon yang diterima dari model AI.';
                }

                \App\Models\IncidentConversation::create([
                    'incident_id'  => $incident->id,
                    'user_message' => $userMsg,
                    'ai_response'  => $aiContent,
                    'model_used'   => $result['model'] ?? ($request->model ?: 'dattio'),
                    'provider'     => $result['provider'] ?? '9router AI Engine',
                ]);
            }

            // Return updated conversation list
            $conversations = $incident ? $incident->conversations()->orderBy('created_at', 'asc')->get() : [];

            return response()->json([
                'success'       => true,
                'data'          => $result,
                'incident_id'   => $incident ? $incident->id : $incidentId,
                'conversations' => $conversations,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('AI Remediation generate error: ' . $e->getMessage(), [
                'exception' => $e,
                'trace'     => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses rekomendasi AI: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function history(Request $request, $incident): JsonResponse
    {
        Gate::authorize('view-incidents');

        $inc = null;
        $withRelations = ['conversations' => fn($q) => $q->orderBy('created_at', 'asc')];

        if (is_numeric($incident)) {
            $inc = Incident::with($withRelations)->find($incident);
        } else {
            // First lookup by payload key
            $inc = Incident::with($withRelations)->where('payload', $incident)->first();

            // Next lookup by title & optional site
            if (!$inc) {
                $title = $request->query('title');
                $siteName = $request->query('site_name');

                if ($title) {
                    $query = Incident::with($withRelations)->where('title', $title);
                    if ($siteName) {
                        $site = \App\Models\Site::where('name', $siteName)->first();
                        if ($site) {
                            $query->where('site_id', $site->id);
                        }
                    }
                    $inc = $query->first();
                }
            }

            // Fallback for sec-{site_id}-{check_key}: match by site_id & security_audit type
            if (!$inc && str_starts_with($incident, 'sec-')) {
                $parts = explode('-', $incident, 3);
                if (count($parts) >= 2) {
                    $siteId = $parts[1];
                    $query = Incident::with($withRelations)->where('site_id', $siteId)->where('type', 'security_audit');
                    if ($request->query('title')) {
                        $query->where('title', $request->query('title'));
                    }
                    $inc = $query->first();
                }
            }

            // Cache payload association if previously null
            if ($inc && empty($inc->payload)) {
                $inc->update(['payload' => $incident]);
            }
        }

        $conversations = $inc && $inc->relationLoaded('conversations') ? $inc->conversations : ($inc ? $inc->conversations()->orderBy('created_at', 'asc')->get() : []);

        return response()->json([
            'success'       => true,
            'incident_id'   => $inc ? $inc->id : null,
            'conversations' => $conversations,
        ]);
    }

    /**
     * Get available models from 9router settings.
     */
    public function models(): JsonResponse
    {
        Gate::authorize('view-incidents');

        $savedModels = \App\Models\Setting::getValue('ninerouter_available_models');
        $defaultModel = \App\Models\Setting::getValue('ninerouter_model') ?: env('NINEROUTER_MODEL', 'combo-maut');

        return response()->json([
            'success'       => true,
            'default_model' => $defaultModel,
            'models'        => is_array($savedModels) ? $savedModels : [],
        ]);
    }
}
