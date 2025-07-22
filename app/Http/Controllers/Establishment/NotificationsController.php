<?php

namespace App\Http\Controllers\Establishment;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Customer;
use App\Services\WhatsAppService;
use App\Services\CampaignService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class NotificationsController extends Controller
{
    public function __construct(
        private WhatsAppService $whatsAppService
    ) {}

    public function index(): Response
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        // Check WhatsApp status on page load
        $whatsappStatus = null;
        if ($establishment->whatsapp_instance_id && $establishment->whatsapp_status !== 'connected') {
            try {
                $status = $this->whatsAppService->getInstanceStatus($establishment);
                $whatsappStatus = $status;
                
                // Only log if there's a status mismatch
                if ($establishment->whatsapp_status !== ($status['connected'] ? 'connected' : 'disconnected')) {
                    Log::info('WhatsApp status mismatch detected', [
                        'establishment_id' => $establishment->id,
                        'db_status' => $establishment->whatsapp_status,
                        'api_status' => $status['connected'] ? 'connected' : 'disconnected',
                    ]);
                }
            } catch (\Exception $e) {
                Log::warning('Failed to get WhatsApp status on page load', [
                    'establishment_id' => $establishment->id,
                    'error' => $e->getMessage()
                ]);
            }
        } elseif ($establishment->whatsapp_status === 'connected') {
            // Return cached status to avoid API call
            $whatsappStatus = [
                'connected' => true,
                'status' => 'open',
                'qr_code' => null
            ];
        }

        $establishmentData = $establishment->only([
            'id',
            'name',
            'whatsapp_instance_id',
            'whatsapp_status',
            'whatsapp_confirmation_message',
            'whatsapp_welcome_message',
            'whatsapp_reminder_message',
            'whatsapp_birthday_message',
            'whatsapp_promotion_message',
            'whatsapp_cancellation_message',
            'reminder_enabled',
            'confirmation_enabled',
            'welcome_enabled', 
            'birthday_enabled',
            'promotion_enabled',
            'cancellation_enabled',
            'reminder_hours_before'
        ]);


        // Get campaigns with statistics and related service
        $campaigns = Campaign::where('establishment_id', $establishment->id)
            ->with('service')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($campaign) {
                return [
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                    'message' => $campaign->message,
                    'status' => $campaign->status,
                    'sent_count' => $campaign->sent_count,
                    'delivered_count' => $campaign->delivered_count,
                    'failed_count' => $campaign->failed_count,
                    'target_type' => $campaign->target_type,
                    'delay_minutes' => $campaign->delay_minutes,
                    'service' => $campaign->service ? [
                        'id' => $campaign->service->id,
                        'name' => $campaign->service->name,
                        'price' => $campaign->service->price,
                    ] : null,
                    'promotional_price' => $campaign->promotional_price,
                    'created_at' => $campaign->created_at,
                ];
            });

        // Calculate overall statistics
        $totalSent = $campaigns->sum('sent_count');
        $totalDelivered = $campaigns->sum('delivered_count');
        $totalFailed = $campaigns->sum('failed_count');
        $totalInQueue = Campaign::where('establishment_id', $establishment->id)
            ->where('status', 'running')
            ->with('campaignMessages')
            ->get()
            ->sum(function ($campaign) {
                return $campaign->campaignMessages()->where('status', 'pending')->count();
            });

        // Get establishment services for campaign creation
        $services = $establishment->services()
            ->where('is_active', true)
            ->select(['id', 'name', 'price', 'duration_minutes'])
            ->orderBy('name')
            ->get()
            ->map(function ($service) {
                return [
                    'id' => $service->id,
                    'name' => $service->name,
                    'price' => $service->price,
                    'duration' => $service->duration_minutes,
                ];
            });

        return Inertia::render('establishment/notifications/Index', [
            'establishment' => $establishmentData,
            'whatsappStatus' => $whatsappStatus,
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
            'services' => $services,
            'campaigns' => $campaigns,
            'campaignStats' => [
                'total_sent' => $totalSent,
                'total_delivered' => $totalDelivered,
                'total_failed' => $totalFailed,
                'total_in_queue' => $totalInQueue,
            ],
        ]);
    }

    public function connectWhatsapp(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        try {
            $result = $this->whatsAppService->connectInstance($establishment);
            
            return response()->json([
                'success' => true,
                'qr_code' => $result['qr_code'] ?? null,
                'connected' => $result['connected'] ?? false,
                'state' => $result['state'] ?? 'connecting',
                'data' => $result,
                'message' => 'Conexão WhatsApp iniciada'
            ]);
        } catch (\Exception $e) {
            Log::error('WhatsApp connection failed', [
                'establishment_id' => $establishment->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao conectar WhatsApp: ' . $e->getMessage()
            ], 400);
        }
    }

    public function whatsappStatus(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        try {
            $status = $this->whatsAppService->getInstanceStatus($establishment);
            return response()->json($status);
        } catch (\Exception $e) {
            Log::error('WhatsApp status check failed', [
                'establishment_id' => $establishment->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'connected' => false,
                'status' => 'error',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function updateWhatsapp(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        $validated = $request->validate([
            'whatsapp_instance_id' => 'required|string|max:255'
        ]);

        $establishment->update([
            'whatsapp_instance_id' => $validated['whatsapp_instance_id'],
            'whatsapp_connected' => true
        ]);

        return back()->with('success', 'WhatsApp conectado com sucesso!');
    }

    public function disconnectWhatsapp(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        Log::warning('Controller disconnect method called', [
            'establishment_id' => $establishment->id,
            'user_id' => auth()->id(),
            'request_ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
        
        try {
            $success = $this->whatsAppService->disconnectInstance($establishment);
            
            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'WhatsApp desconectado com sucesso'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Erro ao desconectar WhatsApp'
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('WhatsApp disconnect failed', [
                'establishment_id' => $establishment->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao desconectar WhatsApp: ' . $e->getMessage()
            ], 400);
        }
    }

    public function updateMessages(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        $validated = $request->validate([
            'whatsapp_confirmation_message' => 'required|string',
            'whatsapp_welcome_message' => 'required|string',
            'whatsapp_reminder_message' => 'required|string',
            'whatsapp_birthday_message' => 'required|string',
            'whatsapp_promotion_message' => 'required|string',
            'whatsapp_cancellation_message' => 'required|string',
        ]);

        $establishment->update($validated);

        return back()->with('success', 'Mensagens de notificação e lembretes atualizadas com sucesso!');
    }

    public function updateSettings(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        $validated = $request->validate([
            // Notification toggles
            'reminder_enabled' => 'boolean',
            'confirmation_enabled' => 'boolean', 
            'welcome_enabled' => 'boolean',
            'birthday_enabled' => 'boolean',
            'promotion_enabled' => 'boolean',
            'cancellation_enabled' => 'boolean',
            
            // Timing settings
            'reminder_hours_before' => 'integer|min:1|max:168',
            
            // Messages
            'whatsapp_reminder_message' => 'required|string',
            'whatsapp_confirmation_message' => 'required|string',
            'whatsapp_welcome_message' => 'required|string',
            'whatsapp_birthday_message' => 'required|string',
            'whatsapp_promotion_message' => 'required|string',
            'whatsapp_cancellation_message' => 'required|string',
        ]);

        $establishment->update($validated);

        return back()->with('success', 'Configurações de notificações atualizadas com sucesso!');
    }

    public function simulateConnection(Request $request)
    {
        $establishment = auth()->user()->establishment;
        
        // This is only for development/mock mode
        if (app()->environment('production')) {
            return response()->json([
                'success' => false,
                'message' => 'Simulate connection only available in development'
            ], 400);
        }

        try {
            // Create instance if it doesn't exist
            if (!$establishment->whatsapp_instance_id) {
                $instanceName = 'mock_horaly_' . $establishment->id . '_' . time();
                $establishment->update([
                    'whatsapp_instance_name' => $instanceName,
                    'whatsapp_instance_id' => $instanceName,
                ]);
            }

            // Update status to connected
            $establishment->update([
                'whatsapp_status' => 'connected',
            ]);

            Log::info('WhatsApp connection simulated', [
                'establishment_id' => $establishment->id,
                'instance_id' => $establishment->whatsapp_instance_id,
                'status_updated_to' => 'connected'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp connection simulated successfully',
                'status' => 'connected'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to simulate connection', [
                'establishment_id' => $establishment->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to simulate connection: ' . $e->getMessage()
            ], 400);
        }
    }

    public function createCampaign(Request $request)
    {
        try {
            // Verify user authentication
            if (!auth()->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            $establishment = auth()->user()->establishment;
            
            if (!$establishment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estabelecimento não encontrado'
                ], 404);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'message' => 'required|string',
                'target_type' => 'required|in:all,individual,period',
                'selected_clients' => 'nullable|array',
                'period_start' => 'nullable|date',
                'period_end' => 'nullable|date|after_or_equal:period_start',
                'delay_minutes' => 'required|numeric|min:0.5|max:1440', // Min 30 seconds, Max 24 hours
                'service_id' => 'nullable|exists:services,id',
                'promotional_price' => 'nullable|numeric|min:0',
            ]);

            // Convert empty service_id to null
            if (empty($validated['service_id'])) {
                $validated['service_id'] = null;
            }
            // Convert empty promotional_price to null
            if (empty($validated['promotional_price'])) {
                $validated['promotional_price'] = null;
            }
            
            $campaignService = new CampaignService();
            $campaign = $campaignService->createCampaign($establishment, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Campanha criada com sucesso!',
                'campaign' => [
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                    'status' => $campaign->status,
                    'sent_count' => $campaign->sent_count,
                    'delivered_count' => $campaign->delivered_count,
                    'failed_count' => $campaign->failed_count,
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Campaign creation failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage()
            ], 500);
        }
    }

    public function startCampaign(Request $request, Campaign $campaign)
    {
        $establishment = auth()->user()->establishment;

        // Verify campaign belongs to establishment
        if ($campaign->establishment_id !== $establishment->id) {
            return response()->json([
                'success' => false,
                'message' => 'Campanha não encontrada'
            ], 404);
        }

        try {
            $campaignService = new CampaignService();
            $campaignService->startCampaign($campaign);

            return response()->json([
                'success' => true,
                'message' => 'Campanha iniciada com sucesso!'
            ]);
        } catch (\Exception $e) {
            Log::error('Campaign start failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao iniciar campanha: ' . $e->getMessage()
            ], 400);
        }
    }

    public function pauseCampaign(Request $request, Campaign $campaign)
    {
        $establishment = auth()->user()->establishment;

        // Verify campaign belongs to establishment
        if ($campaign->establishment_id !== $establishment->id) {
            return response()->json([
                'success' => false,
                'message' => 'Campanha não encontrada'
            ], 404);
        }

        try {
            $campaignService = new CampaignService();
            $campaignService->pauseCampaign($campaign);

            return response()->json([
                'success' => true,
                'message' => 'Campanha pausada com sucesso!'
            ]);
        } catch (\Exception $e) {
            Log::error('Campaign pause failed', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao pausar campanha: ' . $e->getMessage()
            ], 400);
        }
    }

    public function deleteCampaign(Request $request, Campaign $campaign)
    {
        $establishment = auth()->user()->establishment;

        // Verify campaign belongs to establishment
        if ($campaign->establishment_id !== $establishment->id) {
            return response()->json([
                'success' => false,
                'message' => 'Campanha não encontrada'
            ], 404);
        }

        // Check if campaign can be deleted (only draft and completed campaigns)
        if (!in_array($campaign->status, ['draft', 'completed', 'paused'])) {
            return response()->json([
                'success' => false,
                'message' => 'Não é possível excluir uma campanha em execução'
            ], 400);
        }

        try {
            // Delete associated campaign messages first
            $campaign->campaignMessages()->delete();
            
            // Delete the campaign
            $campaign->delete();

            Log::info('Campaign deleted', [
                'campaign_id' => $campaign->id,
                'establishment_id' => $establishment->id,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Campanha excluída com sucesso!'
            ]);
        } catch (\Exception $e) {
            Log::error('Campaign deletion failed', [
                'campaign_id' => $campaign->id,
                'establishment_id' => $establishment->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao excluir campanha: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getClients(Request $request)
    {
        $establishment = auth()->user()->establishment;

        $clients = Customer::where('establishment_id', $establishment->id)
            ->select(['id', 'name', 'last_name', 'phone', 'created_at'])
            ->orderBy('name')
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name . ($customer->last_name ? ' ' . $customer->last_name : ''),
                    'phone' => $customer->phone,
                    'created_at' => $customer->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'clients' => $clients
        ]);
    }

}