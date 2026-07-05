<?php

use App\Models\Site;
use App\Models\SiteSecurity;
use App\Services\SiteSecurityService;
use Illuminate\Support\Facades\Http;

test('scanning unreachable website returns grade F, score 0 and 6 fails', function () {
    $site = Site::create([
        'name' => 'Offline Test Site',
        'url' => 'offline.invalid-domain-test.local',
        'category' => 'Lainnya',
        'pic_name' => 'Test PIC',
        'check_interval' => 5,
        'status' => 'up',
    ]);

    $service = app(SiteSecurityService::class);
    $result = $service->scanSite($site->id);

    expect($result->score)->toBe(0);
    expect($result->grade)->toBe('F');
    expect($result->issues_count)->toBe(6);
    
    foreach ($result->checks as $check) {
        expect($check['status'])->toBe('fail');
        expect($check['desc'])->toContain('Pemindaian gagal: Domain tidak terdaftar atau gagal melakukan resolusi DNS.');
    }
});
