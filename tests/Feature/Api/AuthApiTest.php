<?php

use App\Models\User;

beforeEach(function () {
    $this->withHeader('X-App-Key', (string) config('app.key'));
});

test('requests without X-App-Key header are rejected with 403', function () {
    $response = $this->flushHeaders()
        ->postJson('/api/v1/auth/login', [
            'login' => 'dev',
            'password' => '123',
        ]);

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
        ]);
});

test('requests with invalid X-App-Key header are rejected with 403', function () {
    $response = $this->withHeader('X-App-Key', 'invalid-secret-key')
        ->postJson('/api/v1/auth/login', [
            'login' => 'dev',
            'password' => '123',
        ]);

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
        ]);
});

test('users can authenticate via mobile api using email with valid APP_KEY', function () {
    $user = User::factory()->create([
        'username' => 'testuser',
        'email' => 'testuser@sigap.id',
        'password' => bcrypt('secret123'),
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'login' => 'testuser@sigap.id',
        'password' => 'secret123',
        'device_name' => 'Pixel 8 Pro',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'token',
                'token_type',
                'user' => [
                    'id',
                    'name',
                    'username',
                    'email',
                    'roles',
                    'permissions',
                ],
            ],
        ]);

    expect($response->json('success'))->toBeTrue();
    expect($response->json('data.token'))->not->toBeEmpty();
    expect($response->json('data.token_type'))->toBe('Bearer');
    expect($response->json('data.user.email'))->toBe('testuser@sigap.id');
});

test('users can authenticate via mobile api using username with valid APP_KEY', function () {
    $user = User::factory()->create([
        'username' => 'officer_sigap',
        'email' => 'officer@sigap.id',
        'password' => bcrypt('password123'),
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'login' => 'officer_sigap',
        'password' => 'password123',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);

    expect($response->json('data.user.username'))->toBe('officer_sigap');
});

test('users cannot authenticate with wrong password', function () {
    $user = User::factory()->create([
        'username' => 'validuser',
        'password' => bcrypt('correct_password'),
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'login' => 'validuser',
        'password' => 'wrong_password',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'success' => false,
        ]);
});

test('inactive users cannot authenticate via mobile api', function () {
    $user = User::factory()->create([
        'username' => 'inactive_user',
        'password' => bcrypt('password123'),
        'is_active' => false,
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'login' => 'inactive_user',
        'password' => 'password123',
    ]);

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
        ]);
});

test('authenticated user can access profile via /api/v1/auth/me', function () {
    $user = User::factory()->create([
        'username' => 'profileuser',
        'email' => 'profile@sigap.id',
        'is_active' => true,
    ]);

    $token = $user->createToken('Test Device')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/auth/me');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => 'profileuser',
                    'email' => 'profile@sigap.id',
                ],
            ],
        ]);
});

test('unauthenticated request to /api/v1/auth/me returns 401', function () {
    $response = $this->getJson('/api/v1/auth/me');

    $response->assertStatus(401);
});

test('authenticated user can logout and revoke token', function () {
    $user = User::factory()->create([
        'username' => 'logoutuser',
        'is_active' => true,
    ]);

    $token = $user->createToken('Logout Device')->plainTextToken;

    $response = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->postJson('/api/v1/auth/logout');

    $response->assertStatus(200)
        ->assertJson([
            'success' => true,
        ]);

    // Token must be deleted from database
    $this->assertDatabaseMissing('personal_access_tokens', [
        'tokenable_id' => $user->id,
    ]);

    // Clear resolved user from auth guard memory
    app('auth')->forgetGuards();

    // Subsequent request with the revoked token must fail with 401
    $secondResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
        ->getJson('/api/v1/auth/me');

    $secondResponse->assertStatus(401);
});
