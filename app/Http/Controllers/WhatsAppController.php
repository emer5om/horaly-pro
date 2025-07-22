<?php

namespace App\Http\Controllers;

use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WhatsAppController extends Controller
{
    protected WhatsAppService $whatsAppService;

    public function __construct(WhatsAppService $whatsAppService)
    {
        $this->whatsAppService = $whatsAppService;
    }

    /**
     * Create WhatsApp instance for establishment
     */
    public function createInstance(Request $request)
    {
        try {
            $establishment = auth()->user()->establishment;
            
            if ($establishment->whatsapp_instance_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'WhatsApp instance already exists'
                ], 400);
            }

            $result = $this->whatsAppService->createInstance($establishment);

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp instance created successfully',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create WhatsApp instance: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Connect WhatsApp instance (get QR code)
     */
    public function connect(Request $request)
    {
        try {
            $establishment = auth()->user()->establishment;

            $result = $this->whatsAppService->connectInstance($establishment);

            return response()->json([
                'success' => true,
                'message' => 'Connection initiated. Please scan the QR code.',
                'qr_code' => $result['qr_code'] ?? null,
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to connect WhatsApp: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get instance status and QR code
     */
    public function status(Request $request)
    {
        try {
            $establishment = auth()->user()->establishment;
            
            if (!$establishment->whatsapp_instance_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'WhatsApp instance not found'
                ], 404);
            }

            $result = $this->whatsAppService->getInstanceStatus($establishment);

            return response()->json([
                'success' => true,
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Disconnect WhatsApp instance
     */
    public function disconnect(Request $request)
    {
        try {
            $establishment = auth()->user()->establishment;
            
            $result = $this->whatsAppService->disconnectInstance($establishment);

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'WhatsApp disconnected successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to disconnect WhatsApp'
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to disconnect: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete WhatsApp instance
     */
    public function delete(Request $request)
    {
        try {
            $establishment = auth()->user()->establishment;
            
            $result = $this->whatsAppService->deleteInstance($establishment);

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'WhatsApp instance deleted successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete WhatsApp instance'
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send test message
     */
    public function sendTestMessage(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'message' => 'required|string|max:1000',
        ]);

        try {
            $establishment = auth()->user()->establishment;
            
            $result = $this->whatsAppService->sendMessage(
                $establishment,
                $request->phone,
                $request->message
            );

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully',
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send message: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update notification settings
     */
    public function updateNotificationSettings(Request $request)
    {
        $request->validate([
            'notifications_enabled' => 'required|boolean',
            'notification_templates' => 'nullable|array',
            'notification_settings' => 'nullable|array',
        ]);

        try {
            $establishment = auth()->user()->establishment;
            
            $establishment->update([
                'notifications_enabled' => $request->notifications_enabled,
                'notification_templates' => $request->notification_templates,
                'notification_settings' => $request->notification_settings,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notification settings updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle Evolution API webhooks
     */
    public function webhook(Request $request)
    {
        Log::info('WhatsApp webhook received', $request->all());

        try {
            $event = $request->input('event');
            $instanceName = $request->input('instance');
            $data = $request->input('data');

            // Find establishment by instance name
            $establishment = \App\Models\Establishment::where('whatsapp_instance_id', $instanceName)->first();
            
            if (!$establishment) {
                Log::warning('Webhook received for unknown instance', ['instance' => $instanceName]);
                return response()->json(['success' => false], 404);
            }

            // Handle different webhook events
            switch ($event) {
                case 'qrcode.updated':
                    // QR code updated - could store for frontend display
                    break;

                case 'connection.update':
                    $this->handleConnectionUpdate($establishment, $data);
                    break;

                case 'messages.upsert':
                    // Handle incoming messages if needed
                    break;

                case 'send.message':
                    // Handle message sent confirmation
                    break;

                default:
                    Log::info('Unhandled webhook event', ['event' => $event]);
                    break;
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'error' => $e->getMessage(),
                'data' => $request->all()
            ]);

            return response()->json(['success' => false], 500);
        }
    }

    /**
     * Handle connection update webhook
     */
    private function handleConnectionUpdate($establishment, $data)
    {
        $state = $data['state'] ?? null;

        switch ($state) {
            case 'open':
                $establishment->update([
                    'whatsapp_status' => 'connected',
                    'whatsapp_connected_at' => now(),
                ]);
                break;

            case 'close':
                $establishment->update([
                    'whatsapp_status' => 'disconnected',
                    'whatsapp_disconnected_at' => now(),
                ]);
                break;

            case 'connecting':
                $establishment->update([
                    'whatsapp_status' => 'connecting',
                ]);
                break;

            default:
                Log::info('Unknown connection state', ['state' => $state]);
                break;
        }
    }
}