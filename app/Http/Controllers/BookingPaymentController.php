<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Transaction;
use App\Services\MercadoPagoService;
use App\Services\WhatsAppService;
use App\Jobs\SendAppointmentReminderJob;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

class BookingPaymentController extends Controller
{
    /**
     * Get booking fee information for appointment
     */
    public function getBookingFeeInfo(Appointment $appointment): JsonResponse
    {
        $appointment->load(['establishment', 'service']);

        if (!$appointment->establishment->booking_fee_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Taxa de agendamento não habilitada'
            ], 422);
        }

        if (!$appointment->establishment->mercadopago_access_token) {
            return response()->json([
                'success' => false,
                'message' => 'MercadoPago não configurado para este estabelecimento'
            ], 422);
        }

        $feeAmount = $this->calculateBookingFee($appointment);

        return response()->json([
            'success' => true,
            'data' => [
                'appointment_id' => $appointment->id,
                'fee_enabled' => true,
                'fee_type' => $appointment->establishment->booking_fee_type,
                'fee_amount' => $feeAmount,
                'fee_status' => $appointment->booking_fee_status,
                'service_name' => $appointment->service->name,
                'service_price' => $appointment->service->final_price,
                'accepted_payment_methods' => ['pix'],
            ]
        ]);
    }

    /**
     * Create PIX payment for booking fee
     */
    public function createPixPayment(Request $request): JsonResponse
    {
        try {
            \Log::info('PIX Payment Request received', $request->all());

            $validator = Validator::make($request->all(), [
                'appointment_id' => 'required|exists:appointments,id',
                'customer_name' => 'required|string|max:255',
                'customer_email' => 'nullable|email|max:255',
                'customer_phone' => 'nullable|string|max:20',
                'customer_document_type' => 'nullable|in:CPF,CNPJ',
                'customer_document' => 'nullable|string',
            ]);


            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $appointment = Appointment::with(['establishment', 'service'])->findOrFail($request->appointment_id);

            if (!$appointment->establishment->booking_fee_enabled) {
                return response()->json([
                    'success' => false,
                    'message' => 'Taxa de agendamento não habilitada'
                ], 422);
            }

            if ($appointment->booking_fee_status === 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Taxa já foi paga'
                ], 422);
            }

            $mercadoPagoService = MercadoPagoService::forEstablishment($appointment->establishment);
            if (!$mercadoPagoService) {
                return response()->json([
                    'success' => false,
                    'message' => 'MercadoPago não configurado para este estabelecimento'
                ], 422);
            }


            $feeAmount = $this->calculateBookingFee($appointment);

            // Create local transaction
            $externalId = Str::uuid()->toString();
            $transaction = Transaction::create([
                'external_id' => $externalId,
                'establishment_id' => $appointment->establishment_id,
                'customer_name' => $request->customer_name,
                'customer_email' => $request->customer_email ?? '',
                'customer_phone' => $request->customer_phone ?? '',
                'amount' => $feeAmount,
                'commission_amount' => 0.00,
                'net_amount' => $feeAmount,
                'commission_percentage' => 0.00,
                'type' => 'booking_fee',
                'description' => "Taxa de agendamento - {$appointment->service->name}",
                'payment_method' => 'PIX',
                'status' => 'pending',
            ]);

            // Calculate commission if establishment has a plan
            if ($appointment->establishment->plan) {
                $commissionPercentage = $appointment->establishment->plan->commission_percentage ?? 5.0;
                $transaction->calculateCommission($commissionPercentage);
            }

            // Prepare MercadoPago data
            $nameParts = explode(' ', $request->customer_name, 2);
            $paymentData = [
                'amount' => $feeAmount,
                'description' => "Taxa de agendamento - {$appointment->service->name}",
                'appointment_id' => $appointment->id,
                'transaction_id' => $transaction->id,
                'payer' => [
                    'email' => $request->customer_email ?? 'cliente@exemplo.com',
                    'first_name' => $nameParts[0],
                    'last_name' => $nameParts[1] ?? '',
                ],
            ];

            // Add CPF if document is provided
            if ($request->customer_document && $request->customer_document_type === 'CPF') {
                $paymentData['payer']['cpf'] = preg_replace('/[^0-9]/', '', $request->customer_document);
            }

            $mpResponse = $mercadoPagoService->createBookingPixPayment($paymentData);
            // Log payment response only in debug mode or on errors
            if (!$mpResponse || !$mpResponse['success'] || config('app.debug')) {
                \Log::info('PIX payment response:', [
                    'success' => $mpResponse['success'] ?? false,
                    'payment_id' => $mpResponse['payment_id'] ?? null,
                    'error' => $mpResponse['error'] ?? null
                ]);
            }

            if (!$mpResponse || !$mpResponse['success']) {
                $transaction->update(['status' => 'cancelled']);
                $appointment->update(['status' => 'cancelled']);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Erro ao criar pagamento PIX. Tente novamente.',
                    'data' => [
                        'transaction_id' => $transaction->id,
                        'status' => 'cancelled',
                        'appointment_status' => 'cancelled',
                        'error_type' => 'mercadopago_error'
                    ]
                ], 200);
            }

            // Update transaction with MercadoPago data
            $transaction->update([
                'mercadopago_payment_id' => $mpResponse['payment_id'],
                'mercadopago_data' => $mpResponse,
                'mercadopago_status' => $mpResponse['status'],
                'status' => 'waiting_payment',
                'pix_qr_code_base64' => $mpResponse['qr_code_base64'] ?? null,
                'pix_qr_code' => $mpResponse['qr_code'] ?? null,
                'pix_qr_code_text' => $mpResponse['qr_code'] ?? null,
                'expires_at' => $mpResponse['expires_at'] ? now()->parse($mpResponse['expires_at']) : now()->addMinutes(30),
                'last_status_check' => now(),
            ]);

            // Update appointment
            $appointment->update([
                'booking_fee_amount' => $feeAmount,
                'booking_fee_transaction_id' => $transaction->id,
            ]);

            $responseData = [
                'success' => true,
                'message' => 'PIX criado com sucesso',
                'data' => [
                    'transaction_id' => $transaction->id,
                    'payment_id' => $mpResponse['payment_id'],
                    'amount' => $feeAmount,
                    'qr_code' => $transaction->pix_qr_code ?: $mpResponse['qr_code'],
                    'qr_code_base64' => $transaction->pix_qr_code_base64,
                    'expires_at' => $transaction->expires_at,
                    'status' => $transaction->status,
                ]
            ];
            
            \Log::info('PIX Payment Success Response:', $responseData);
            
            return response()->json($responseData);

        } catch (\Exception $e) {
            \Log::error('PIX Payment Creation Error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            if (isset($transaction)) {
                $transaction->update(['status' => 'cancelled']);
            }

            return response()->json([
                'success' => false,
                'message' => 'Erro interno do servidor',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }


    /**
     * Check payment status (polling)
     */
    public function checkPaymentStatus(Transaction $transaction): JsonResponse
    {
        // Only log transaction status checks in debug mode
        if (config('app.debug')) {
            \Log::debug('Checking payment status for transaction:', ['transaction_id' => $transaction->id, 'mercadopago_payment_id' => $transaction->mercadopago_payment_id]);
        }
        
        if (!$transaction->mercadopago_payment_id) {
            return response()->json([
                'success' => false,
                'message' => 'Pagamento não encontrado'
            ], 404);
        }

        $appointment = Appointment::where('booking_fee_transaction_id', $transaction->id)->first();
        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Agendamento não encontrado'
            ], 404);
        }

        $mercadoPagoService = MercadoPagoService::forEstablishment($transaction->establishment);
        if (!$mercadoPagoService) {
            return response()->json([
                'success' => false,
                'message' => 'MercadoPago não configurado'
            ], 422);
        }

        try {
            $mpResponse = $mercadoPagoService->getPaymentStatus($transaction->mercadopago_payment_id);
            
            if (!$mpResponse || !$mpResponse['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erro ao verificar status do pagamento'
                ], 500);
            }

            $newStatus = MercadoPagoService::mapStatusToInternal($mpResponse['status']);
            
            // Update transaction
            $transaction->update([
                'mercadopago_data' => $mpResponse,
                'mercadopago_status' => $mpResponse['status'],
                'status' => $newStatus,
                'last_status_check' => now(),
            ]);

            // Update appointment based on payment status
            if ($mpResponse['status'] === 'approved' && $appointment->booking_fee_status !== 'paid') {
                \Log::info('Payment approved, updating appointment and sending messages', [
                    'appointment_id' => $appointment->id,
                    'current_status' => $appointment->status,
                    'booking_fee_status' => $appointment->booking_fee_status,
                ]);
                
                $appointment->update([
                    'booking_fee_status' => 'paid',
                    'status' => 'confirmed'
                ]);
                $transaction->markAsPaid();
                
                // Send confirmation message via WhatsApp
                \Log::info('Calling sendConfirmationMessage', ['appointment_id' => $appointment->id]);
                $this->sendConfirmationMessage($appointment);
                
                // Send welcome message after confirmation (always, regardless of being new or existing customer)
                \Log::info('Calling sendWelcomeMessage', ['appointment_id' => $appointment->id]);
                $this->sendWelcomeMessage($appointment);
                
                // Schedule reminder based on establishment settings
                \Log::info('Calling scheduleReminderJob', ['appointment_id' => $appointment->id]);
                $this->scheduleReminderJob($appointment);
            } elseif ($mpResponse['status'] === 'rejected' && $appointment->status !== 'cancelled') {
                // Cancel the appointment when payment is rejected
                $appointment->update(['status' => 'cancelled']);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'transaction_id' => $transaction->id,
                    'payment_id' => $transaction->mercadopago_payment_id,
                    'status' => $transaction->status,
                    'mercadopago_status' => $mpResponse['status'],
                    'status_detail' => $mpResponse['status_detail'] ?? null,
                    'amount' => $transaction->amount,
                    'booking_fee_status' => $appointment->booking_fee_status,
                    'updated_at' => $transaction->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao verificar status do pagamento',
                'error' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Get payment methods for establishment
     */
    public function getPaymentMethods(Request $request): JsonResponse
    {
        $establishmentId = $request->establishment_id;
        $establishment = \App\Models\Establishment::find($establishmentId);

        if (!$establishment) {
            return response()->json([
                'success' => false,
                'message' => 'Estabelecimento não encontrado'
            ], 404);
        }

        $mercadoPagoService = MercadoPagoService::forEstablishment($establishment);
        if (!$mercadoPagoService) {
            return response()->json([
                'success' => false,
                'message' => 'MercadoPago não configurado'
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'accepted_methods' => ['pix'],
                'available_methods' => ['pix'],
            ]
        ]);
    }

    /**
     * Calculate booking fee amount
     */
    private function calculateBookingFee(Appointment $appointment): float
    {
        $establishment = $appointment->establishment;
        
        if ($establishment->booking_fee_type === 'fixed') {
            return (float) $establishment->booking_fee_amount;
        }
        
        $servicePrice = $appointment->service->final_price;
        $percentage = $establishment->booking_fee_percentage;
        
        return round($servicePrice * ($percentage / 100), 2);
    }

    /**
     * Get payment method ID from card number
     */
    private function getPaymentMethodFromCardNumber(string $cardNumber): string
    {
        // Remove any non-digit characters
        $cleanNumber = preg_replace('/[^0-9]/', '', $cardNumber);
        
        // Common Brazilian credit card patterns
        $firstDigit = substr($cleanNumber, 0, 1);
        $firstTwoDigits = substr($cleanNumber, 0, 2);
        $firstFourDigits = substr($cleanNumber, 0, 4);
        
        // Visa starts with 4
        if ($firstDigit === '4') {
            return 'visa';
        }
        
        // MasterCard starts with 5 or 2
        if ($firstDigit === '5' || $firstDigit === '2') {
            return 'master';
        }
        
        // American Express starts with 34 or 37
        if ($firstTwoDigits === '34' || $firstTwoDigits === '37') {
            return 'amex';
        }
        
        // Diners Club starts with 30, 36, 38
        if ($firstTwoDigits === '30' || $firstTwoDigits === '36' || $firstTwoDigits === '38') {
            return 'diners';
        }
        
        // Elo cards (common in Brazil)
        $eloRanges = [
            '4011', '4312', '4389', '4514', '4573', '4576', '5041', '5066', '5067',
            '5090', '6277', '6362', '6363', '6504', '6505', '6516', '6550'
        ];
        
        foreach ($eloRanges as $range) {
            if (substr($cleanNumber, 0, strlen($range)) === $range) {
                return 'elo';
            }
        }
        
        // Hipercard starts with 60
        if ($firstTwoDigits === '60') {
            return 'hipercard';
        }
        
        // Default to visa if unknown
        return 'visa';
    }

    /**
     * Send confirmation message via WhatsApp
     */
    private function sendConfirmationMessage(Appointment $appointment): void
    {
        try {
            $establishment = $appointment->establishment;
            
            \Log::info('sendConfirmationMessage called', [
                'appointment_id' => $appointment->id,
                'whatsapp_connected' => $establishment->whatsapp_connected,
                'confirmation_enabled' => $establishment->confirmation_enabled,
            ]);
            
            // Check if WhatsApp is connected and confirmation messages are enabled
            if (!$establishment->whatsapp_connected || !$establishment->confirmation_enabled) {
                \Log::info('Confirmation message not sent - WhatsApp not connected or confirmation disabled', [
                    'appointment_id' => $appointment->id,
                    'whatsapp_connected' => $establishment->whatsapp_connected,
                    'confirmation_enabled' => $establishment->confirmation_enabled,
                ]);
                return;
            }
            
            $whatsappService = new WhatsAppService();
            $message = $this->buildConfirmationMessage($appointment);
            
            if ($message) {
                $customerPhone = $appointment->customer ? $appointment->customer->phone : null;
                if ($customerPhone) {
                    $whatsappService->sendMessage($establishment, $customerPhone, $message);
                    \Log::info('WhatsApp confirmation message sent', [
                        'appointment_id' => $appointment->id,
                        'customer_phone' => $customerPhone,
                    ]);
                } else {
                    \Log::warning('Cannot send confirmation message - no customer phone', [
                        'appointment_id' => $appointment->id,
                    ]);
                }
            }
        } catch (\Exception $e) {
            \Log::error('Failed to send WhatsApp confirmation message', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Build confirmation message with appointment details
     */
    private function buildConfirmationMessage(Appointment $appointment): string
    {
        $establishment = $appointment->establishment;
        $service = $appointment->service;
        
        $message = $establishment->whatsapp_confirmation_message ?: 
            "✅ *Agendamento Confirmado*\n\nOlá {cliente}, \n\nSeu agendamento foi confirmado com sucesso!\n\n📅 *Data:* {data}\n🕐 *Horário:* {hora}\n✂️ *Serviço:* {servico}\n💰 *Valor:* {valor}\n\n📍 *{estabelecimento}*\n📞 *{telefone}*\n\nAguardamos você! 😊";
        
        $replacements = [
            '{cliente}' => $appointment->customer ? $appointment->customer->name : 'Cliente',
            '{data}' => \Carbon\Carbon::parse($appointment->scheduled_at)->format('d/m/Y'),
            '{hora}' => \Carbon\Carbon::parse($appointment->scheduled_at)->format('H:i'),
            '{servico}' => $service->name,
            '{valor}' => 'R$ ' . number_format($service->price, 2, ',', '.'),
            '{estabelecimento}' => $establishment->name,
            '{telefone}' => $establishment->phone,
        ];
        
        return str_replace(array_keys($replacements), array_values($replacements), $message);
    }

    /**
     * Send welcome message after confirmation (always)
     */
    private function sendWelcomeMessage(Appointment $appointment): void
    {
        try {
            $establishment = $appointment->establishment;
            
            \Log::info('sendWelcomeMessage called', [
                'appointment_id' => $appointment->id,
                'whatsapp_connected' => $establishment->whatsapp_connected,
                'welcome_enabled' => $establishment->welcome_enabled,
            ]);
            
            // Check if WhatsApp is connected and welcome messages are enabled
            if (!$establishment->whatsapp_connected || !$establishment->welcome_enabled) {
                \Log::info('Welcome message not sent - WhatsApp not connected or welcome disabled', [
                    'appointment_id' => $appointment->id,
                    'whatsapp_connected' => $establishment->whatsapp_connected,
                    'welcome_enabled' => $establishment->welcome_enabled,
                ]);
                return;
            }
            
            // Check if welcome message was already sent for this appointment
            if ($appointment->reminders()->where('type', 'welcome')->exists()) {
                return;
            }
            
            $whatsappService = new WhatsAppService();
            $message = $this->buildWelcomeMessage($appointment);
            
            if ($message) {
                $customerPhone = $appointment->customer ? $appointment->customer->phone : null;
                if ($customerPhone) {
                    $whatsappService->sendMessage($establishment, $customerPhone, $message);
                    
                    // Log the sent welcome message
                    $appointment->reminders()->create([
                        'type' => 'welcome',
                        'sent_at' => now(),
                        'message' => $message,
                    ]);
                    
                    \Log::info('WhatsApp welcome message sent', [
                        'appointment_id' => $appointment->id,
                        'customer_phone' => $customerPhone,
                    ]);
                } else {
                    \Log::warning('Cannot send welcome message - no customer phone', [
                        'appointment_id' => $appointment->id,
                    ]);
                }
            }
        } catch (\Exception $e) {
            \Log::error('Failed to send WhatsApp welcome message', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Build welcome message with appointment details
     */
    private function buildWelcomeMessage(Appointment $appointment): string
    {
        $establishment = $appointment->establishment;
        
        $message = $establishment->whatsapp_welcome_message ?: 
            "🙏 *Bem-vindo(a) ao {estabelecimento}!*\n\nOlá {cliente}, \n\nÉ um prazer tê-lo(a) como nosso cliente! 😊\n\n🌟 *Nossos serviços:*\n{lista_servicos}\n\n📅 *Para agendar:*\n📞 {telefone}\n🌐 {link_agendamento}\n\n📍 *Endereço:* {endereco}\n\nAguardamos sua visita! ✨";
        
        // Get establishment services for the list
        $services = $establishment->services()->where('is_active', true)->get();
        $servicesList = $services->map(function ($service) {
            return "• {$service->name} - R$ " . number_format($service->price, 2, ',', '.');
        })->implode("\n");
        
        $replacements = [
            '{cliente}' => $appointment->customer ? $appointment->customer->name : 'Cliente',
            '{estabelecimento}' => $establishment->name,
            '{telefone}' => $establishment->phone,
            '{endereco}' => $establishment->address,
            '{lista_servicos}' => $servicesList ?: 'Consulte nossos serviços disponíveis!',
            '{link_agendamento}' => url("/{$establishment->booking_slug}"),
        ];
        
        return str_replace(array_keys($replacements), array_values($replacements), $message);
    }

    /**
     * Schedule reminder job based on establishment settings
     */
    private function scheduleReminderJob(Appointment $appointment): void
    {
        try {
            $establishment = $appointment->establishment;
            
            // Check if reminder is enabled
            if (!$establishment->reminder_enabled) {
                return;
            }
            
            // Get reminder hours before appointment
            $reminderHours = $establishment->reminder_hours_before ?? 24;
            
            // Calculate when to send the reminder
            $appointmentDateTime = Carbon::parse($appointment->scheduled_at);
            $reminderDateTime = $appointmentDateTime->subHours($reminderHours);
            
            // Only schedule if reminder time is in the future
            if ($reminderDateTime->isFuture()) {
                $delayInSeconds = $reminderDateTime->diffInSeconds(now());
                
                SendAppointmentReminderJob::dispatch($appointment, $delayInSeconds);
                
                \Log::info('Appointment reminder job scheduled', [
                    'appointment_id' => $appointment->id,
                    'reminder_hours_before' => $reminderHours,
                    'appointment_datetime' => $appointmentDateTime->format('Y-m-d H:i:s'),
                    'reminder_datetime' => $reminderDateTime->format('Y-m-d H:i:s'),
                    'delay_seconds' => $delayInSeconds,
                ]);
            } else {
                \Log::info('Appointment reminder not scheduled - reminder time is in the past', [
                    'appointment_id' => $appointment->id,
                    'reminder_hours_before' => $reminderHours,
                    'appointment_datetime' => $appointmentDateTime->format('Y-m-d H:i:s'),
                    'reminder_datetime' => $reminderDateTime->format('Y-m-d H:i:s'),
                ]);
            }
        } catch (\Exception $e) {
            \Log::error('Failed to schedule appointment reminder job', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

}