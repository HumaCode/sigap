<?php

namespace App\Http\Middleware;

use App\Helpers\ResponseHelper;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateAppKey
{
    /**
     * Handle an incoming request.
     * Validate X-App-Key or X-Api-Key against APP_KEY from .env / config.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $clientKey = $request->header('X-App-Key') 
            ?? $request->header('X-Api-Key') 
            ?? $request->header('x-app-key') 
            ?? $request->header('x-api-key');

        if (empty($clientKey)) {
            return ResponseHelper::error(
                'Akses Ditolak: Header "X-App-Key" tidak ditemukan. Sertakan kunci aplikasi resmi untuk mengakses API ini.',
                403
            );
        }

        $appKey = (string) config('app.key');
        $rawAppKey = str_starts_with($appKey, 'base64:') ? substr($appKey, 7) : $appKey;
        $mobileKey = (string) env('MOBILE_APP_KEY', '');

        $isValid = hash_equals($appKey, $clientKey)
            || hash_equals($rawAppKey, $clientKey)
            || (!empty($mobileKey) && hash_equals($mobileKey, $clientKey));

        if (! $isValid) {
            return ResponseHelper::error(
                'Akses Ditolak: "X-App-Key" yang disertakan tidak valid.',
                403
            );
        }

        return $next($request);
    }
}
