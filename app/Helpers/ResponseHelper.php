<?php

namespace App\Helpers;

use Illuminate\Http\JsonResponse;

class ResponseHelper
{
    /**
     * Respon sukses standar
     */
    public static function success(string $message = 'Success', mixed $data = null, int $statusCode = 200): JsonResponse
    {
        return self::jsonResponse(true, $message, $data, $statusCode);
    }

    /**
     * Respon error standar
     */
    public static function error(string $message = 'Error', int $statusCode = 400, mixed $data = null): JsonResponse
    {
        return self::jsonResponse(false, $message, $data, $statusCode);
    }

    /**
     * Core JSON response
     */
    public static function jsonResponse(
        bool $success,
        string $message,
        mixed $data = null,
        int $statusCode = 200
    ): JsonResponse {
        return response()->json([
            'success' => $success,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }
}
