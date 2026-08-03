<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MeController extends Controller
{
    public function show(Request $request)
    {
        return response()->json([
            'authenticated' => $request->user() !== null,
            'user' => $request->user(),
        ]);
    }
}
