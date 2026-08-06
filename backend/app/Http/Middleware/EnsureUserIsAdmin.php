<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || (int) ($user->is_admin ?? 0) !== 1) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses admin.',
            ], 403);
        }

        return $next($request);
    }
}
