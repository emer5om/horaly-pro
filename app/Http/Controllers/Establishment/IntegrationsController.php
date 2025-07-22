<?php

namespace App\Http\Controllers\Establishment;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IntegrationsController extends Controller
{
    public function index(): Response
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        return Inertia::render('establishment/integrations/Index', [
            'establishment' => $establishment->only([
                'id',
                'name',
                'charge_fee',
                'fee_type',
                'fee_amount',
                'fee_percentage',
                'mercadopago_access_token',
                'mercadopago_public_key',
                'mercadopago_sandbox',
                'payment_enabled',
                'payment_methods',
                'whatsapp_instance_id',
                'facebook_pixel_id',
                'google_analytics_id',
                'google_tag_id'
            ]),
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function updatePaymentSettings(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        $validated = $request->validate([
            'charge_fee' => 'boolean',
            'fee_type' => 'required_if:charge_fee,true|in:fixed,percentage',
            'fee_amount' => 'required_if:fee_type,fixed|nullable|numeric|min:0',
            'fee_percentage' => 'required_if:fee_type,percentage|nullable|integer|min:10|max:100',
        ]);

        $establishment->update($validated);

        return back()->with('success', 'Configurações de cobrança atualizadas com sucesso!');
    }

    public function updateMercadoPago(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        $validated = $request->validate([
            'mercadopago_access_token' => 'nullable|string',
            'mercadopago_public_key' => 'nullable|string',
            'mercadopago_sandbox' => 'boolean',
            'payment_enabled' => 'boolean',
            'payment_methods' => 'nullable|array',
            'payment_methods.*' => 'in:pix,credit_card,debit_card',
        ]);

        // If enabling payment, require access token
        if ($validated['payment_enabled'] && empty($validated['mercadopago_access_token'])) {
            return back()->withErrors([
                'mercadopago_access_token' => 'Token de acesso é obrigatório para habilitar pagamentos.'
            ]);
        }

        $establishment->update($validated);

        return back()->with('success', 'Configurações do Mercado Pago atualizadas com sucesso!');
    }

    public function testMercadoPago(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        if (!$establishment->mercadopago_access_token) {
            return response()->json([
                'success' => false,
                'message' => 'Token de acesso não configurado'
            ], 400);
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => "Bearer {$establishment->mercadopago_access_token}",
            ])->get('https://api.mercadopago.com/v1/users/me');

            if ($response->successful()) {
                $data = $response->json();
                return response()->json([
                    'success' => true,
                    'message' => 'Conexão testada com sucesso!',
                    'user_id' => $data['id'] ?? null,
                    'email' => $data['email'] ?? null
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Token inválido ou erro na conexão'
                ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao testar conexão: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateAnalytics(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        $validated = $request->validate([
            'facebook_pixel_id' => 'nullable|string|max:255',
            'google_analytics_id' => 'nullable|string|max:255',
            'google_tag_id' => 'nullable|string|max:255',
        ]);

        $establishment->update($validated);

        return back()->with('success', 'Configurações de analytics atualizadas com sucesso!');
    }

    public function connectWhatsapp(Request $request)
    {
        $validated = $request->validate([
            'instance_id' => 'required|string|max:255'
        ]);

        // Simulate Evolution API QR code generation
        // In production, you would make a real call to Evolution API
        $qrCodeUrl = $this->generateWhatsappQr($validated['instance_id']);

        if ($qrCodeUrl) {
            return response()->json([
                'success' => true,
                'qr_code' => $qrCodeUrl,
                'message' => 'QR Code gerado com sucesso'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Erro ao gerar QR Code'
        ], 400);
    }

    public function whatsappStatus(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        if (!$establishment->whatsapp_instance_id) {
            return response()->json(['connected' => false]);
        }

        // Simulate checking Evolution API status
        // In production, you would check the actual connection status
        $isConnected = $this->checkWhatsappConnection($establishment->whatsapp_instance_id);

        return response()->json(['connected' => $isConnected]);
    }

    public function updateWhatsapp(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        $validated = $request->validate([
            'whatsapp_instance_id' => 'required|string|max:255'
        ]);

        $establishment->update($validated);

        return back()->with('success', 'WhatsApp conectado com sucesso!');
    }

    public function disconnectWhatsapp(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        // In production, you would call Evolution API to disconnect the instance
        $establishment->update(['whatsapp_instance_id' => null]);

        return response()->json([
            'success' => true,
            'message' => 'WhatsApp desconectado com sucesso'
        ]);
    }

    private function generateWhatsappQr(string $instanceId): ?string
    {
        // Simulate QR code generation for demo purposes
        // In production, replace with actual Evolution API call
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }

    private function checkWhatsappConnection(string $instanceId): bool
    {
        // Simulate connection check for demo purposes
        // In production, replace with actual Evolution API call
        return rand(0, 1) === 1; // Random for demo
    }
}
