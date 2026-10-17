<?php

use App\Models\DetectionLog;
use App\Models\Incident;
use App\Models\Site;
use App\Models\User;

beforeEach(function () {
    $this->withHeader('X-App-Key', (string) config('app.key'));
});

test('requests to inspect API without X-App-Key are rejected with 403', function () {
    $response = $this->flushHeaders()
        ->getJson('/api/v1/inspect');

    $response->assertStatus(403)
        ->assertJson(['success' => false]);
});

test('unauthenticated requests to inspect API are rejected with 401', function () {
    $response = $this->getJson('/api/v1/inspect');

    $response->assertStatus(401);
});

test('inspect returns empty state gracefully when no sites exist', function () {
    $user = User::factory()->create(['is_active' => true]);
    $token = $user->createToken('Mobile App')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/inspect');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'service' => null,
                'available_services' => [],
            ],
        ]);
});

test('inspect returns full service telemetry, 30-day heatmap, and latency breakdown', function () {
    $user = User::factory()->create(['is_active' => true]);
    $token = $user->createToken('Mobile App')->plainTextToken;

    $site = Site::create([
        'name' => 'api.payments.io',
        'url' => 'https://api.payments.io',
        'category' => 'REST API',
        'status' => 'down',
    ]);

    // Create incident for this site
    Incident::create([
        'site_id' => $site->id,
        'title' => 'Bad Gateway 502',
        'type' => 'down',
        'severity' => 'critical',
        'status' => 'investigating',
        'description' => 'Bad Gateway 502 upstream: socket reset by peer',
        'detected_at' => now(),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/inspect');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'service' => [
                    'id',
                    'short_id',
                    'name',
                    'url',
                    'subtitle',
                    'status',
                    'status_code',
                    'status_label',
                    'metrics' => [
                        'uptime_30d',
                        'uptime_30d_formatted',
                        'avg_latency_ms',
                        'avg_latency_formatted',
                        'poll_cycle',
                    ],
                    'alert' => [
                        'is_alert',
                        'message',
                    ],
                ],
                'heatmap' => [
                    'title',
                    'range_label',
                    'summary' => [
                        'operational',
                        'degraded',
                        'downtime',
                    ],
                    'cells' => [
                        '*' => [
                            'day',
                            'date',
                            'label',
                            'uptime_percentage',
                            'status',
                            'is_today',
                        ],
                    ],
                ],
                'latency_breakdown' => [
                    'total_latency_ms',
                    'total_latency_formatted',
                    'is_failed',
                    'stages' => [
                        '*' => [
                            'name',
                            'latency_ms',
                            'percentage',
                            'status',
                        ],
                    ],
                ],
                'available_services',
            ],
        ]);

    expect($response->json('data.service.name'))->toBe('api.payments.io');
    expect($response->json('data.service.status'))->toBe('down');
    expect($response->json('data.service.alert.is_alert'))->toBeTrue();
    expect(count($response->json('data.heatmap.cells')))->toBe(30);
    expect(count($response->json('data.latency_breakdown.stages')))->toBe(3);
    expect(count($response->json('data.available_services')))->toBe(1);
});

test('authenticated user can inspect specific service by ID', function () {
    $user = User::factory()->create(['is_active' => true]);
    $token = $user->createToken('Mobile App')->plainTextToken;

    $site1 = Site::create([
        'name' => 'telemetry.io',
        'url' => 'https://telemetry.io',
        'status' => 'up',
    ]);

    $site2 = Site::create([
        'name' => 'auth.cloudapp.net',
        'url' => 'https://auth.cloudapp.net',
        'status' => 'up',
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/inspect/' . $site2->id);

    $response->assertStatus(200);
    expect($response->json('data.service.id'))->toBe((string) $site2->id);
    expect($response->json('data.service.name'))->toBe('auth.cloudapp.net');
    expect(count($response->json('data.available_services')))->toBe(2);
});
