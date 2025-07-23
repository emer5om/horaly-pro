<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <!-- <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script> -->

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <!-- Google Tag Manager -->
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-MCPF7WPD');</script>
        <!-- End Google Tag Manager -->

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/logo-icon.png" sizes="any">
        <link rel="icon" href="/logo-icon.png" type="image/png">
        <link rel="apple-touch-icon" href="/logo-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        <!-- Efí Pay JavaScript Library for Payment Token (Local) -->
        <script src="{{ asset('js/efi-pay-token.min.js') }}"></script>
        
        <!-- Debug script para verificar carregamento -->
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            if (typeof window.EfiJs !== 'undefined') {
              console.log('✅ Efí Pay library loaded successfully');
            } else {
              console.warn('⚠️ Efí Pay library not found');
            }
          });
        </script>
        
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-MCPF7WPD"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <!-- End Google Tag Manager (noscript) -->
        
        @inertia
    </body>
</html>
