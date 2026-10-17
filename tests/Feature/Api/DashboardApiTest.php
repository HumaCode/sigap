<?php

use App\Models\DetectionLog;
use App\Models\Incident;
use App\Models\Site;
use App\Models\User;

beforeEach(function () {
    $this->withHeader('X-App-Key', (string) config('app.key'));
});

test('requests to dashboard stats without X-App-Key header are rejected with 403', function () {
    $response = $this->flushHeaders()
        ->getJson('/api/v1/dashboard/stats');

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
        ]);
});

test('unauthenticated requests to dashboard stats are rejected with 401', function () {
    $response = $this->getJson('/api/v1/dashboard/stats');

    $response->assertStatus(401);
});

test('authenticated user can fetch dashboard stats with empty database', function () {
    $user = User::factory()->create([
        'username' => 'officer',
        'is_active' => true,
    ]);

    $token = $user->createToken('Mobile App')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/dashboard/stats');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'summary' => [
                    'uptime_percentage',
                    'uptime_percentage_formatted',
                    'total_sites',
                    'normal_sites',
                    'warning_sites',
                    'disrupted_sites',
                    'paused_sites',
                    'open_incidents',
                    'critical_incidents',
                ],
                'critical_banner' => [
                    'is_visible',
                    'incident',
                ],
                'latency_sparkline' => [
                    'current_avg_latency_ms',
                    'current_avg_latency_formatted',
                    'labels',
                    'values',
                    'points',
                ],
                'recent_incidents',
            ],
        ]);

    expect($response->json('data.summary.total_sites'))->toBe(0);
    expect((float) $response->json('data.summary.uptime_percentage'))->toBe(0.0);
    expect($response->json('data.critical_banner.is_visible'))->toBeFalse();
    expect($response->json('data.critical_banner.incident'))->toBeNull();
    expect($response->json('data.recent_incidents'))->toBeEmpty();
    expect(count($response->json('data.latency_sparkline.labels')))->toBe(24);
});

test('dashboard stats calculates real sites, incidents, and critical banner correctly', function () {
    $user = User::factory()->create([
        'username' => 'sre_admin',
        'is_active' => true,
    ]);

    $token = $user->createToken('Mobile App')->plainTextToken;

    // Create 3 sites with different status
    $siteUp = Site::create([
        'name' => 'Portal Diskominfo',
        'url' => 'https://diskominfo.go.id',
        'status' => 'up',
    ]);

    $siteWarn = Site::create([
        'name' => 'Layanan Perizinan',
        'url' => 'https://izin.go.id',
        'status' => 'warn',
    ]);

    $siteDown = Site::create([
        'name' => 'Portal Pajak Daerah',
        'url' => 'https://bapenda.go.id',
        'status' => 'down',
    ]);

    // Create active critical incident
    $criticalIncident = Incident::create([
        'site_id' => $siteDown->id,
        'title' => 'Web Defacement & Server Down',
        'type' => 'defacement',
        'severity' => 'critical',
        'status' => 'investigating',
        'description' => 'Tampilan diubah oleh pihak ketiga',
        'detected_at' => now()->subMinutes(15),
    ]);

    // Create a resolved incident (should not trigger critical banner)
    Incident::create([
        'site_id' => $siteUp->id,
        'title' => 'SSL Expired Solved',
        'type' => 'ssl',
        'severity' => 'medium',
        'status' => 'resolved',
        'detected_at' => now()->subHours(2),
    ]);

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/dashboard/stats');

    $response->assertStatus(200);

    $summary = $response->json('data.summary');
    expect($summary['total_sites'])->toBe(3);
    expect($summary['normal_sites'])->toBe(1);
    expect($summary['warning_sites'])->toBe(1);
    expect($summary['disrupted_sites'])->toBe(1);
    expect($summary['open_incidents'])->toBe(1);
    expect($summary['critical_incidents'])->toBe(1);

    // Critical banner must be visible
    $banner = $response->json('data.critical_banner');
    expect($banner['is_visible'])->toBeTrue();
    expect($banner['incident']['id'])->toBe((string) $criticalIncident->id);
    expect($banner['incident']['severity'])->toBe('critical');
    expect($banner['incident']['site_name'])->toBe('Portal Pajak Daerah');

    // Recent incidents must return items
    $recent = $response->json('data.recent_incidents');
    expect(count($recent))->toBe(2);
    expect($recent[0]['title'])->toBe('Web Defacement & Server Down');
});
