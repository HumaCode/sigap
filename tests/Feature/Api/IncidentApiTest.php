<?php

use App\Models\Incident;
use App\Models\Shield\Role;
use App\Models\Site;
use App\Models\User;

beforeEach(function () {
    $this->withHeader('X-App-Key', (string) config('app.key'));
});

test('requests to incidents API without X-App-Key are rejected with 403', function () {
    $response = $this->flushHeaders()
        ->getJson('/api/v1/incidents');

    $response->assertStatus(403)
        ->assertJson(['success' => false]);
});

test('unauthenticated requests to incidents API are rejected with 401', function () {
    $response = $this->getJson('/api/v1/incidents');

    $response->assertStatus(401);
});

test('authenticated user can list incidents with war room stats and filter counts', function () {
    $user = User::factory()->create(['is_active' => true]);
    $token = $user->createToken('Mobile App')->plainTextToken;

    $site = Site::create([
        'name' => 'api.payments.io',
        'url' => 'https://api.payments.io',
        'status' => 'down',
    ]);

    // Create 1 critical incident, 1 resolved incident
    $criticalIncident = Incident::create([
        'site_id' => $site->id,
        'title' => 'Payment Gateway API Down (HTTP 502)',
        'type' => 'down',
        'severity' => 'critical',
        'status' => 'investigating',
        'description' => 'Upstream Envoy ingress pool exhaustion',
        'detected_at' => now()->subMinutes(14),
    ]);

    $resolvedIncident = Incident::create([
        'site_id' => $site->id,
        'title' => 'Latency Spike on DB',
        'type' => 'latency',
        'severity' => 'medium',
        'status' => 'resolved',
        'detected_at' => now()->subHours(1),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/incidents');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'war_room' => [
                    'active_p1',
                    'active_p1_label',
                    'resolved_today',
                    'resolved_today_label',
                    'mttr_minutes',
                    'mttr_label',
                ],
                'counts' => [
                    'all',
                    'critical',
                    'high',
                    'investigating',
                    'resolved',
                ],
                'items' => [
                    '*' => [
                        'id',
                        'incident_code',
                        'title',
                        'endpoint',
                        'site_name',
                        'site_url',
                        'type',
                        'severity',
                        'severity_badge',
                        'status',
                        'status_label',
                        'metrics' => [
                            'error_rate',
                            'affected_users',
                            'blast_radius',
                            'subtext',
                            'peak_rps',
                        ],
                        'ai_diagnostic' => [
                            'provider',
                            'model',
                            'confidence',
                            'root_cause',
                            'recommended_steps',
                        ],
                        'detected_at',
                        'detected_ago',
                    ],
                ],
                'meta',
            ],
        ]);

    expect($response->json('data.war_room.active_p1'))->toBe(1);
    expect($response->json('data.war_room.resolved_today'))->toBe(1);
    expect($response->json('data.counts.critical'))->toBe(1);
    expect($response->json('data.counts.resolved'))->toBe(1);
    expect(count($response->json('data.items')))->toBe(2);
});

test('filtering incidents by severity or status works properly', function () {
    $user = User::factory()->create(['is_active' => true]);
    $token = $user->createToken('Mobile App')->plainTextToken;

    $site = Site::create([
        'name' => 'cloudapp.net',
        'url' => 'https://cloudapp.net',
        'status' => 'up',
    ]);

    Incident::create([
        'site_id' => $site->id,
        'title' => 'Critical Defacement',
        'type' => 'deface',
        'severity' => 'critical',
        'status' => 'investigating',
        'detected_at' => now()->subMinutes(10),
    ]);

    Incident::create([
        'site_id' => $site->id,
        'title' => 'Resolved SSL Warning',
        'type' => 'ssl',
        'severity' => 'low',
        'status' => 'resolved',
        'detected_at' => now()->subHours(3),
    ]);

    // Test filter: critical
    $criticalResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/incidents?filter=critical');

    $criticalResponse->assertStatus(200);
    $items = $criticalResponse->json('data.items');
    expect(count($items))->toBe(1);
    expect($items[0]['title'])->toBe('Critical Defacement');
    expect($items[0]['severity_badge'])->toBe('P1 CRITICAL');

    // Test filter: resolved
    $resolvedResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/incidents?filter=resolved');

    $resolvedResponse->assertStatus(200);
    $resolvedItems = $resolvedResponse->json('data.items');
    expect(count($resolvedItems))->toBe(1);
    expect($resolvedItems[0]['title'])->toBe('Resolved SSL Warning');
});

test('authenticated user can view single incident details with AI diagnostics and share text', function () {
    $user = User::factory()->create(['is_active' => true]);
    $token = $user->createToken('Mobile App')->plainTextToken;

    $site = Site::create([
        'name' => 'api.payments.io',
        'url' => 'https://api.payments.io',
        'status' => 'down',
    ]);

    $incident = Incident::create([
        'site_id' => $site->id,
        'title' => 'Payment Gateway API Down (HTTP 502)',
        'type' => 'down',
        'severity' => 'critical',
        'status' => 'investigating',
        'description' => 'Upstream 502 Bad Gateway detected on checkout service',
        'payload' => [
            'url' => 'https://api.payments.io/v1/checkout/charge',
            'status_code' => 502,
        ],
        'detected_at' => now()->subMinutes(14),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/incidents/' . $incident->id);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'incident_code',
                'title',
                'description',
                'ai_diagnostic' => [
                    'provider',
                    'model',
                    'root_cause',
                    'recommended_steps',
                ],
                'share_text',
                'conversations',
            ],
        ]);

    expect($response->json('data.id'))->toBe((string) $incident->id);
    expect($response->json('data.share_text'))->toContain('WAR ROOM LIVE');
    expect($response->json('data.share_text'))->toContain('Payment Gateway API Down');
});

test('admin can update incident status successfully', function () {
    Role::firstOrCreate(['name' => 'admin'], [
        'type_role' => 'management',
        'slug' => 'administrator',
        'guard_name' => 'web',
    ]);
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole('admin');
    $token = $user->createToken('Mobile App')->plainTextToken;

    $site = Site::create([
        'name' => 'portal.gov',
        'url' => 'https://portal.gov',
        'status' => 'up',
    ]);

    $incident = Incident::create([
        'site_id' => $site->id,
        'title' => 'High CPU Alert',
        'type' => 'server',
        'severity' => 'high',
        'status' => 'investigating',
        'detected_at' => now()->subMinutes(30),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->patchJson('/api/v1/incidents/' . $incident->id . '/status', [
            'status' => 'resolved',
            'note' => 'Worker restart telah berhasil dan memory stabil.',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);

    expect($incident->fresh()->status)->toBe('resolved');
});

test('admin can add technician note to incident', function () {
    Role::firstOrCreate(['name' => 'admin'], [
        'type_role' => 'management',
        'slug' => 'administrator',
        'guard_name' => 'web',
    ]);
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole('admin');
    $token = $user->createToken('Mobile App')->plainTextToken;

    $site = Site::create([
        'name' => 'db.internal',
        'url' => 'https://db.internal',
        'status' => 'up',
    ]);

    $incident = Incident::create([
        'site_id' => $site->id,
        'title' => 'Database Latency',
        'type' => 'latency',
        'severity' => 'medium',
        'status' => 'in_progress',
        'detected_at' => now(),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->postJson('/api/v1/incidents/' . $incident->id . '/notes', [
            'message' => 'Sedang memeriksa slow query log di pod database replica.',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);

    expect($incident->conversations()->count())->toBe(1);
    expect($incident->conversations()->first()->user_message)->toBe('Sedang memeriksa slow query log di pod database replica.');
});
