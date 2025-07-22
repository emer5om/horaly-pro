<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentsController extends Controller
{
    public function index(): Response
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        return Inertia::render('Payments/Index', [
            'establishment' => $establishment,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }
}