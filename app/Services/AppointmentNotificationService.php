<?php

namespace App\Services;

use App\Jobs\SendAppointmentConfirmation;
use App\Jobs\SendAppointmentReminder;
use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AppointmentNotificationService
{
    /**
     * Send instant appointment confirmation
     */
    public function sendConfirmation(Appointment $appointment): void
    {
        try {
            // Dispatch the confirmation job immediately
            SendAppointmentConfirmation::dispatch($appointment);
            
            Log::info('Appointment confirmation job dispatched', [
                'appointment_id' => $appointment->id,
                'establishment_id' => $appointment->establishment_id
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to dispatch appointment confirmation', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Schedule appointment reminder based on establishment settings
     */
    public function scheduleReminder(Appointment $appointment): void
    {
        try {
            $establishment = $appointment->establishment;
            
            // Check if reminders are enabled
            if (!$establishment->reminder_enabled) {
                Log::info('Reminders disabled for establishment', [
                    'appointment_id' => $appointment->id,
                    'establishment_id' => $establishment->id
                ]);
                return;
            }

            // Calculate when to send the reminder
            $appointmentDateTime = Carbon::parse($appointment->date . ' ' . $appointment->time);
            $reminderHours = $establishment->reminder_hours_before ?? 24;
            $reminderTime = $appointmentDateTime->subHours($reminderHours);

            // Only schedule if reminder time is in the future
            if ($reminderTime->isFuture()) {
                SendAppointmentReminder::dispatch($appointment)->delay($reminderTime);
                
                Log::info('Appointment reminder scheduled', [
                    'appointment_id' => $appointment->id,
                    'establishment_id' => $establishment->id,
                    'reminder_time' => $reminderTime->toDateTimeString(),
                    'reminder_hours_before' => $reminderHours
                ]);
            } else {
                Log::info('Reminder time is in the past, not scheduling', [
                    'appointment_id' => $appointment->id,
                    'reminder_time' => $reminderTime->toDateTimeString(),
                    'appointment_time' => $appointmentDateTime->toDateTimeString()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to schedule appointment reminder', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Handle appointment creation - send confirmation and schedule reminder
     */
    public function handleAppointmentCreated(Appointment $appointment): void
    {
        // Send instant confirmation
        $this->sendConfirmation($appointment);
        
        // Schedule reminder
        $this->scheduleReminder($appointment);
    }

    /**
     * Handle appointment status change
     */
    public function handleAppointmentStatusChanged(Appointment $appointment, string $oldStatus): void
    {
        $establishment = $appointment->establishment;
        
        // If appointment was just confirmed, send confirmation
        if ($oldStatus !== 'confirmed' && $appointment->status === 'confirmed') {
            $this->sendConfirmation($appointment);
            $this->scheduleReminder($appointment);
        }
        
        // If appointment was cancelled, you might want to send a cancellation message
        if ($appointment->status === 'cancelled' && $establishment->cancellation_enabled) {
            // You can implement this later if needed
            Log::info('Appointment cancelled, cancellation message feature not implemented yet', [
                'appointment_id' => $appointment->id
            ]);
        }
    }
}
