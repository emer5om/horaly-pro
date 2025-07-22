<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\CampaignMessage;
use App\Models\Customer;
use App\Models\Establishment;
use App\Jobs\SendCampaignMessage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CampaignService
{
    public function createCampaign(Establishment $establishment, array $data): Campaign
    {
        return DB::transaction(function () use ($establishment, $data) {
            $campaign = Campaign::create([
                'establishment_id' => $establishment->id,
                'service_id' => $data['service_id'] ?? null,
                'promotional_price' => $data['promotional_price'] ?? null,
                'name' => $data['name'],
                'message' => $data['message'],
                'target_type' => $data['target_type'],
                'selected_clients' => $data['selected_clients'] ?? null,
                'period_start' => $data['period_start'] ?? null,
                'period_end' => $data['period_end'] ?? null,
                'delay_minutes' => $data['delay_minutes'],
                'status' => 'draft',
            ]);

            // Calculate total targets based on target type
            $totalTargets = $this->calculateTotalTargets($establishment, $data);
            $campaign->update(['total_targets' => $totalTargets]);

            return $campaign;
        });
    }

    public function startCampaign(Campaign $campaign): void
    {
        if (!$campaign->canBeStarted()) {
            throw new \Exception('Campanha não pode ser iniciada no estado atual');
        }

        DB::transaction(function () use ($campaign) {
            // Update campaign status
            $campaign->update([
                'status' => 'running',
                'started_at' => now(),
            ]);

            // Generate campaign messages for targets
            $this->generateCampaignMessages($campaign);
        });
    }

    public function pauseCampaign(Campaign $campaign): void
    {
        if (!$campaign->canBePaused()) {
            throw new \Exception('Campanha não pode ser pausada no estado atual');
        }

        $campaign->update(['status' => 'paused']);

        Log::info('Campaign paused', [
            'campaign_id' => $campaign->id,
            'establishment_id' => $campaign->establishment_id,
        ]);
    }

    public function resumeCampaign(Campaign $campaign): void
    {
        if (!$campaign->canBeStarted()) {
            throw new \Exception('Campanha não pode ser retomada no estado atual');
        }

        $campaign->update(['status' => 'running']);

        Log::info('Campaign resumed', [
            'campaign_id' => $campaign->id,
            'establishment_id' => $campaign->establishment_id,
        ]);
    }

    protected function calculateTotalTargets(Establishment $establishment, array $data): int
    {
        switch ($data['target_type']) {
            case 'all':
                return Customer::where('establishment_id', $establishment->id)->count();

            case 'individual':
                return count($data['selected_clients'] ?? []);

            case 'period':
                if (!$data['period_start'] || !$data['period_end']) {
                    return 0;
                }

                // Count customers who had appointments in the specified period
                return Customer::where('establishment_id', $establishment->id)
                    ->whereHas('appointments', function ($query) use ($data) {
                        $query->whereBetween('start_time', [
                            $data['period_start'] . ' 00:00:00',
                            $data['period_end'] . ' 23:59:59'
                        ]);
                    })
                    ->distinct()
                    ->count();

            default:
                return 0;
        }
    }

    protected function generateCampaignMessages(Campaign $campaign): void
    {
        // Load service relationship if campaign has a service
        if ($campaign->service_id) {
            $campaign->load('service');
        }
        
        $customers = $this->getTargetCustomers($campaign);
        $messageCount = 0;
        $delayMinutes = $campaign->delay_minutes;
        $scheduledAt = now();

        foreach ($customers as $customer) {
            // Replace variables in message
            $messageContent = $this->replaceMessageVariables(
                $campaign->message,
                $customer,
                $campaign
            );

            // Create campaign message - convert decimal minutes to seconds for addSeconds
            $delaySeconds = $delayMinutes * 60; // Convert minutes to seconds
            CampaignMessage::create([
                'campaign_id' => $campaign->id,
                'customer_id' => $customer->id,
                'message_content' => $messageContent,
                'phone' => $customer->phone,
                'scheduled_at' => $scheduledAt->copy()->addSeconds($messageCount * $delaySeconds),
                'status' => 'pending',
            ]);

            $messageCount++;
        }

        // Dispatch jobs for immediate messages
        $this->dispatchPendingMessages($campaign);
    }

    protected function getTargetCustomers(Campaign $campaign)
    {
        $query = Customer::where('establishment_id', $campaign->establishment_id);

        switch ($campaign->target_type) {
            case 'all':
                return $query->get();

            case 'individual':
                if (!$campaign->selected_clients) {
                    return collect([]);
                }
                return $query->whereIn('id', $campaign->selected_clients)->get();

            case 'period':
                if (!$campaign->period_start || !$campaign->period_end) {
                    return collect([]);
                }

                return $query->whereHas('appointments', function ($query) use ($campaign) {
                    $query->whereBetween('start_time', [
                        $campaign->period_start . ' 00:00:00',
                        $campaign->period_end . ' 23:59:59'
                    ]);
                })
                ->distinct()
                ->get();

            default:
                return collect([]);
        }
    }

    protected function replaceMessageVariables(string $message, Customer $customer, Campaign $campaign): string
    {
        $establishment = $campaign->establishment;
        
        // Base variables
        $variables = [
            '{cliente}' => $customer->name . ($customer->last_name ? ' ' . $customer->last_name : ''),
            '{estabelecimento}' => $establishment->name,
            '{telefone}' => $establishment->phone ?? '',
            '{endereco}' => $establishment->address ?? '',
            '{servicos}' => $this->getEstablishmentServices($establishment),
        ];

        // Service-specific variables if campaign has a service
        if ($campaign->service_id && $campaign->service) {
            $service = $campaign->service;
            $variables['{servico}'] = $service->name;
            $variables['{valor_original}'] = 'R$ ' . number_format($service->price, 2, ',', '.');
            $variables['{valor_promocional}'] = $campaign->promotional_price 
                ? 'R$ ' . number_format($campaign->promotional_price, 2, ',', '.') 
                : $variables['{valor_original}'];
            $variables['{valor}'] = $variables['{valor_promocional}'];
            $variables['{duracao}'] = $service->duration_minutes . ' minutos';
            
            // Calculate discount if promotional price exists
            if ($campaign->promotional_price && $campaign->promotional_price < $service->price) {
                $discount = (($service->price - $campaign->promotional_price) / $service->price) * 100;
                $variables['{desconto}'] = number_format($discount, 0) . '%';
            } else {
                $variables['{desconto}'] = '0%';
            }
        } else {
            // Generic placeholders when no specific service is selected
            $variables['{servico}'] = '[Nome do Serviço]';
            $variables['{valor_original}'] = '[Valor Original]';
            $variables['{valor_promocional}'] = '[Valor Promocional]';
            $variables['{valor}'] = '[Valor do Serviço]';
            $variables['{duracao}'] = '[Duração do Serviço]';
            $variables['{desconto}'] = '[% Desconto]';
        }

        return str_replace(array_keys($variables), array_values($variables), $message);
    }

    protected function getEstablishmentServices(Establishment $establishment): string
    {
        return $establishment->services()
            ->pluck('name')
            ->join(', ') ?: 'Nossos serviços';
    }

    protected function dispatchPendingMessages(Campaign $campaign): void
    {
        // Get all pending messages for this campaign, ordered by scheduled time
        $pendingMessages = CampaignMessage::where('campaign_id', $campaign->id)
            ->where('status', 'pending')
            ->orderBy('scheduled_at')
            ->get();

        foreach ($pendingMessages as $message) {
            // Calculate delay from now until scheduled time
            $delaySeconds = max(0, $message->scheduled_at->diffInSeconds(now(), false));
            
            if ($delaySeconds > 0) {
                // Schedule the message for future execution
                SendCampaignMessage::dispatch($message)->delay($delaySeconds);
                
                Log::info('Campaign message scheduled with delay', [
                    'message_id' => $message->id,
                    'phone' => $message->phone,
                    'scheduled_at' => $message->scheduled_at,
                    'delay_seconds' => $delaySeconds,
                ]);
            } else {
                // Send immediately if scheduled time has passed
                SendCampaignMessage::dispatch($message);
                
                Log::info('Campaign message dispatched immediately', [
                    'message_id' => $message->id,
                    'phone' => $message->phone,
                    'scheduled_at' => $message->scheduled_at,
                ]);
            }
        }
    }

    public function processPendingCampaignMessages(): void
    {
        $pendingMessages = CampaignMessage::where('status', 'pending')
            ->where('scheduled_at', '<=', now())
            ->with('campaign')
            ->whereHas('campaign', function ($query) {
                $query->where('status', 'running');
            })
            ->orderBy('scheduled_at')
            ->take(50) // Process in batches
            ->get();

        foreach ($pendingMessages as $message) {
            SendCampaignMessage::dispatch($message);
        }
    }

    public function deleteCampaign(Campaign $campaign): void
    {
        if (!$campaign->canBeDeleted()) {
            throw new \Exception('Campanha não pode ser excluída no estado atual');
        }

        DB::transaction(function () use ($campaign) {
            // Delete campaign messages first
            CampaignMessage::where('campaign_id', $campaign->id)->delete();
            
            // Delete the campaign
            $campaign->delete();
        });

        Log::info('Campaign deleted by service', [
            'campaign_id' => $campaign->id,
            'establishment_id' => $campaign->establishment_id,
        ]);
    }

    public function updateCampaignStats(Campaign $campaign): void
    {
        $stats = CampaignMessage::where('campaign_id', $campaign->id)
            ->selectRaw('
                COUNT(*) as total,
                COUNT(CASE WHEN status = "sent" THEN 1 END) as sent,
                COUNT(CASE WHEN status = "delivered" THEN 1 END) as delivered,
                COUNT(CASE WHEN status = "sent" OR status = "delivered" THEN 1 END) as total_delivered,
                COUNT(CASE WHEN status = "failed" THEN 1 END) as failed,
                COUNT(CASE WHEN status = "pending" THEN 1 END) as pending
            ')
            ->first();

        $campaign->update([
            'sent_count' => $stats->total_delivered ?? 0, // Total enviadas (sent + delivered)
            'delivered_count' => $stats->total_delivered ?? 0, // Total entregues (sent + delivered)
            'failed_count' => $stats->failed ?? 0,
        ]);

        Log::info('Campaign stats updated', [
            'campaign_id' => $campaign->id,
            'total' => $stats->total,
            'sent_only' => $stats->sent,
            'delivered_only' => $stats->delivered,
            'total_delivered' => $stats->total_delivered, // sent + delivered
            'failed' => $stats->failed,
            'pending' => $stats->pending,
        ]);

        // Check if campaign is completed (all messages processed - sent, delivered, or failed)
        $processed = ($stats->total_delivered ?? 0) + ($stats->failed ?? 0);
        if ($stats->total > 0 && $processed >= $stats->total) {
            $campaign->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
            
            Log::info('Campaign marked as completed', [
                'campaign_id' => $campaign->id,
                'total_messages' => $stats->total,
                'processed_messages' => $processed,
            ]);
        }
    }
}