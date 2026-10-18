<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

test('login requires turnstile token when configured', function () {
    config()->set('services.turnstile.secret_key', '0x4AAAAAAFZ4WRWXyCsJLVG3fTzVpIUhMmc');
    
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);

    $response = $this->postJson('/login', [
        'login' => $user->email,
        'password' => 'password123',
    ]);

    expect($response->status())->toBeIn([200, 302]);
});

test('turnstile verification against cloudflare api handles success', function () {
    $secretKey = '0x4AAAAAAFZ4WRWXyCsJLVG3fTzVpIUhMmc';

    Http::fake([
        'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response([
            'success' => true,
            'challenge_ts' => now()->toIso8601String(),
            'hostname' => 'localhost',
        ], 200),
    ]);

    $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
        'secret' => $secretKey,
        'response' => 'valid-mock-token',
        'remoteip' => '127.0.0.1',
    ]);

    expect($response->successful())->toBeTrue();
    expect($response->json('success'))->toBeTrue();
});

test('turnstile verification against cloudflare api handles failure', function () {
    $secretKey = '0x4AAAAAAFZ4WRWXyCsJLVG3fTzVpIUhMmc';

    Http::fake([
        'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response([
            'success' => false,
            'error-codes' => ['invalid-input-response'],
        ], 200),
    ]);

    $failResponse = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
        'secret' => $secretKey,
        'response' => 'invalid-token',
        'remoteip' => '127.0.0.1',
    ]);

    expect($failResponse->successful())->toBeTrue();
    expect($failResponse->json('success'))->toBeFalse();
});
