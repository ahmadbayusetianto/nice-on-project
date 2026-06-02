<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'Bimbel ID Backend API',
        'message' => 'Backend only serves API logic. Use frontend app for UI.',
    ]);
});
