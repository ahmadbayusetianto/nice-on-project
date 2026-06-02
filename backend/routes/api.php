<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'backend-api',
    ]);
});

Route::get('/landing', function () {
    return response()->json([
        'promo' => 'Satu langkah kecil hari ini, peluang besar di hari seleksi.',
        'hero' => [
            'title' => 'Satu Langkah',
            'highlight' => 'Menuju ASN.',
            'description' => 'Persiapan yang tepat dapat mengubah keraguan menjadi keyakinan.',
        ],
        'stats' => [
            ['platform' => 'YT', 'value' => '1.75Jt+', 'label' => 'Subscribers'],
            ['platform' => 'TT', 'value' => '742K+', 'label' => 'Followers'],
            ['platform' => 'IG', 'value' => '389K+', 'label' => 'Followers'],
            ['platform' => 'X', 'value' => '198K+', 'label' => 'Followers'],
        ],
    ]);
});

Route::get('/me', function (Request $request) {
    return response()->json([
        'authenticated' => $request->user() !== null,
        'user' => $request->user(),
    ]);
});
