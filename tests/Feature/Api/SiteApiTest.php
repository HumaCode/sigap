<?php

use App\Models\DetectionLog;
use App\Models\Shield\Role;
use App\Models\Site;
use App\Models\User;
use App\Services\UptimeCheckService;

beforeEach(function () {
    $this->withHeader('X-App-Key', (string) config('app.key'));
});

test('requests to sites API without X-App-Key are rejected with 403', function () {
    $response = $this->flushHeaders()
        ->getJson('/api/v1/sites');

    $response->assertStatus(403)
        ->assertJson(['success' => false]);
});

test('unauthenticated requests to sites API are rejected with 401', function () {
    $response = $this->getJson('/api/v1/sites');

    $response->assertStatus(401);
});

test('authenticated user can list sites with filter counts', function () {
    $user = User::factory()->create(['is_active' => true]);
    $token = $user->createToken('Mobile App')->plainTextToken;

    // Create test sites
    $siteUp = Site::create([
        'name' => 'api.payments.io',
        'url' => 'https://api.payments.io',
        'category' => 'REST API · Global Gateway',
        'status' => 'up',
        'ssl_status' => 'valid',
        'ssl_days_left' => 148,
    ]);

    $siteDown = Site::create([
        'name' => 'auth.cloudapp.net',
        'url' => 'https://auth.cloudapp.net',
        'category' => 'OAuth2 Provider',
        'status' => 'down',
        'ssl_status' => 'valid',
        'ssl_days_left' => 12,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/sites');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'counts' => [
                    'all',
                    'operational',
                    'outage',
                    'ssl',
                    'warn',
                ],
                'items' => [
                    '*' => [
                        'id',
                        'name',
                        'url',
                        'category',
                        'status',
                        'status_code',
                        'status_label',
                        'latency' => [
                            'value_ms',
                            'formatted',
                            'is_timeout',
                        ],
                        'ssl' => [
                            'days_left',
                            'status',
                            'status_label',
                            'is_warning',
                        ],
                        'summary_badge',
                        'uptime_percentage',
                        'last_checked_at',
                        'last_checked_ago',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                    'has_more',
                ],
            ],
        ]);

    expect($response->json('data.counts.all'))->toBe(2);
    expect($response->json('data.counts.operational'))->toBe(1);
    expect($response->json('data.counts.outage'))->toBe(1);
    expect($response->json('data.counts.ssl'))->toBe(1); // 12 days left <= 14
    expect(count($response->json('data.items')))->toBe(2);
});

test('filtering sites by status or search works properly', function () {
    $user = User::factory()->create(['is_active' => true]);
    $token = $user->createToken('Mobile App')->plainTextToken;

    Site::create([
        'name' => 'telemetry-collector.io',
        'url' => 'https://telemetry-collector.io',
        'category' => 'gRPC · Event Streaming',
        'status' => 'up',
    ]);

    Site::create([
        'name' => 'broken-service.internal',
        'url' => 'https://broken-service.internal',
        'category' => 'Database Worker',
        'status' => 'down',
    ]);

    // Test filter: operational
    $operationalResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/sites?filter=operational');

    $operationalResponse->assertStatus(200);
    $operationalItems = $operationalResponse->json('data.items');
    expect(count($operationalItems))->toBe(1);
    expect($operationalItems[0]['name'])->toBe('telemetry-collector.io');

    // Test filter: outage
    $outageResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/sites?filter=outage');

    $outageResponse->assertStatus(200);
    $outageItems = $outageResponse->json('data.items');
    expect(count($outageItems))->toBe(1);
    expect($outageItems[0]['name'])->toBe('broken-service.internal');

    // Test search query
    $searchResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/sites?search=telemetry');

    $searchResponse->assertStatus(200);
    $searchItems = $searchResponse->json('data.items');
    expect(count($searchItems))->toBe(1);
    expect($searchItems[0]['name'])->toBe('telemetry-collector.io');
});

test('authenticated user can view single site details', function () {
    $user = User::factory()->create(['is_active' => true]);
    $token = $user->createToken('Mobile App')->plainTextToken;

    $site = Site::create([
        'name' => 'api.payments.io',
        'url' => 'https://api.payments.io',
        'category' => 'REST API',
        'status' => 'up',
        'ssl_issuer' => "Let's Encrypt",
        'ssl_days_left' => 60,
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/sites/' . $site->id);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'url',
                'category',
                'status',
                'ssl_details' => [
                    'status',
                    'issuer',
                    'days_left',
                ],
                'domain_details',
                'uptime_history_30d',
                'security_audit',
                'recent_incidents',
                'recent_logs',
            ],
        ]);

    expect($response->json('data.id'))->toBe((string) $site->id);
    expect(count($response->json('data.uptime_history_30d')))->toBe(30);
});

test('admin can trigger quick ping check successfully', function () {
    Role::firstOrCreate(['name' => 'admin'], [
        'type_role' => 'management',
        'slug' => 'administrator',
        'guard_name' => 'web',
    ]);
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole('admin');
    $token = $user->createToken('Mobile App')->plainTextToken;

    $site = Site::create([
        'name' => 'auth.cloudapp.net',
        'url' => 'https://auth.cloudapp.net',
        'status' => 'up',
    ]);

    // Mock UptimeCheckService
    $mock = Mockery::mock(UptimeCheckService::class);
    $mock->shouldReceive('checkSite')
        ->once()
        ->andReturn([
            'site_id' => $site->id,
            'name' => $site->name,
            'url' => $site->url,
            'status' => 'up',
            'status_code' => 200,
            'response_time_ms' => 45,
            'error' => null,
        ]);
    app()->instance(UptimeCheckService::class, $mock);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->postJson('/api/v1/sites/' . $site->id . '/check');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'check_result',
                'site',
            ],
        ]);

    expect($response->json('data.check_result.status'))->toBe('up');
    expect($response->json('data.check_result.status_code'))->toBe(200);
});

test('non-admin user without permission is forbidden from quick ping', function () {
    $user = User::factory()->create(['is_active' => true]);
    $token = $user->createToken('Mobile App')->plainTextToken;

    $site = Site::create([
        'name' => 'secure.portal.gov',
        'url' => 'https://secure.portal.gov',
        'status' => 'up',
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->postJson('/api/v1/sites/' . $site->id . '/check');

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
        ]);
});
