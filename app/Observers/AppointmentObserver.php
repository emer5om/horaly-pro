<?php

namespace App\Observers;

use App\Models\Appointment;
use App\Services\AppointmentNotificationService;

class AppointmentObserver
{
    public function __construct(
        private AppointmentNotificationService $notificationService
    ) {}

    /**
     * Handle the Appointment "created" event.
     */
    public function created(Appointment $appointment): void
    {
        // Send confirmation and schedule reminder for new appointments
        if ($appointment->status === 'confirmed') {
            $this->notificationService->handleAppointmentCreated($appointment);
        }
    }

    /**
     * Handle the Appointment "updated" event.
     */
    public function updated(Appointment $appointment): void
    {
        // Check if status changed
        if ($appointment->wasChanged('status')) {
            $oldStatus = $appointment->getOriginal('status');
            $this->notificationService->handleAppointmentStatusChanged($appointment, $oldStatus);
        }
    }

    /**
     * Handle the Appointment "deleted" event.
     */
    public function deleted(Appointment $appointment): void
    {
        //
    }

    /**
     * Handle the Appointment "restored" event.
     */
    public function restored(Appointment $appointment): void
    {
        //
    }

    /**
     * Handle the Appointment "force deleted" event.
     */
    public function forceDeleted(Appointment $appointment): void
    {
        //
    }
}
