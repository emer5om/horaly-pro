<?php

namespace App\Console\Commands;

use App\Jobs\SendAppointmentConfirmation;
use App\Models\Appointment;
use Illuminate\Console\Command;

class TestWhatsAppNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:whatsapp-notifications {appointment_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test WhatsApp notification system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $appointmentId = $this->argument('appointment_id');
        
        if ($appointmentId) {
            $appointment = Appointment::find($appointmentId);
            if (!$appointment) {
                $this->error("Appointment with ID {$appointmentId} not found.");
                return 1;
            }
        } else {
            // Get the first confirmed appointment
            $appointment = Appointment::where('status', 'confirmed')->first();
            if (!$appointment) {
                $this->error('No confirmed appointments found.');
                return 1;
            }
        }

        $this->info("Testing WhatsApp notification for appointment ID: {$appointment->id}");
        $this->info("Customer: {$appointment->customer_name}");
        $this->info("Phone: {$appointment->customer_phone}");
        $this->info("Establishment: {$appointment->establishment->name}");
        
        try {
            SendAppointmentConfirmation::dispatch($appointment);
            $this->info('✅ Confirmation job dispatched successfully!');
            $this->info('Check the logs and queue for processing status.');
        } catch (\Exception $e) {
            $this->error("❌ Failed to dispatch job: {$e->getMessage()}");
            return 1;
        }

        return 0;
    }
}
