<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prependToGroup('api', [
            EnsureFrontendRequestsAreStateful::class,
        ]);

        // Sanctum's EnsureFrontendRequestsAreStateful triggers on the
        // request's Origin/Referer header alone (see fromFrontend() in
        // vendor/laravel/sanctum), independent of login state. Once it
        // fires it injects CSRF validation into every api/* request. The
        // frontend does not yet fetch /sanctum/csrf-cookie or attach
        // X-XSRF-TOKEN, so without this exemption every POST/PUT/PATCH/
        // DELETE from the SPA origin returns 419. Remove this exemption
        // once the frontend is updated to do the CSRF handshake.
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
