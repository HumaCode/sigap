<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @php
            try {
                $appName = \App\Models\Setting::getValue('app_name') ?: config('app.name', 'SIGAP');
                $seoTitle = \App\Models\Setting::getValue('seo_meta_title') ?: $appName;
                $seoDesc = \App\Models\Setting::getValue('seo_meta_description') ?: 'Platform monitoring keamanan, defacement detection, uptime ketersediaan, dan postur keamanan aset digital dan website secara real-time.';
                $seoKeywords = \App\Models\Setting::getValue('seo_meta_keywords') ?: 'monitoring website, deface detection, cyber security, uptime monitoring, web defense, sigap';
                $seoAuthor = \App\Models\Setting::getValue('seo_author') ?: '';
                $robotsIndex = (bool) \App\Models\Setting::getValue('seo_robots_index', true);
                $seoRobots = $robotsIndex ? 'index, follow' : 'noindex, nofollow';
                $googleVerification = trim(\App\Models\Setting::getValue('seo_google_verification') ?? '');
                if (\Illuminate\Support\Str::startsWith($googleVerification, 'google-site-verification=')) {
                    $googleVerification = substr($googleVerification, strlen('google-site-verification='));
                }
            } catch (\Throwable $e) {
                $appName = config('app.name', 'SIGAP');
                $seoTitle = $appName;
                $seoDesc = 'Platform monitoring keamanan, defacement detection, uptime ketersediaan, dan postur keamanan aset digital dan website secara real-time.';
                $seoKeywords = 'monitoring website, deface detection, cyber security, uptime monitoring, web defense, sigap';
                $seoAuthor = '';
                $seoRobots = 'index, follow';
                $googleVerification = '';
            }
        @endphp

        <meta name="app-name" content="{{ $appName }}">
        <script>
            window.__APP_NAME__ = @json($appName);
        </script>
        <title inertia>{{ $appName }}</title>

        <!-- Favicon / Brand Icon -->
        <link rel="icon" type="image/svg+xml" href="{{ asset('favicon.svg') }}">
        <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('favicon-32x32.png') }}">
        <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('favicon-16x16.png') }}">
        <link rel="shortcut icon" href="{{ asset('favicon.ico') }}">
        <link rel="apple-touch-icon" href="{{ asset('favicon.png') }}">

        <!-- Meta SEO & Crawlers -->
        <meta name="description" content="{{ $seoDesc }}">
        @if(!empty($seoKeywords))
        <meta name="keywords" content="{{ $seoKeywords }}">
        @endif
        @if(!empty($seoAuthor))
        <meta name="author" content="{{ $seoAuthor }}">
        @endif
        <meta name="robots" content="{{ $seoRobots }}">

        <!-- Google Site Verification -->
        @if(!empty($googleVerification))
        <meta name="google-site-verification" content="{{ $googleVerification }}">
        @endif

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:title" content="{{ $seoTitle }}">
        <meta property="og:description" content="{{ $seoDesc }}">

        <!-- Twitter Meta -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $seoTitle }}">
        <meta name="twitter:description" content="{{ $seoDesc }}">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
