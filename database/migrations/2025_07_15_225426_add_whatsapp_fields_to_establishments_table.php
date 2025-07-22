<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            // Only add fields that don't exist yet
            $table->string('whatsapp_status')->default('disconnected'); // disconnected, connecting, connected
            $table->json('whatsapp_config')->nullable(); // Store instance config
            $table->timestamp('whatsapp_connected_at')->nullable();
            $table->timestamp('whatsapp_disconnected_at')->nullable();
            
            // Notification settings (notifications_enabled might exist as receive_notifications)
            $table->boolean('notifications_enabled')->default(true);
            $table->json('notification_templates')->nullable(); // Store custom message templates
            
            $table->index('whatsapp_status');
        });
    }

    public function down(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp_status',
                'whatsapp_config',
                'whatsapp_connected_at',
                'whatsapp_disconnected_at',
                'notifications_enabled',
                'notification_templates',
            ]);
        });
    }
};