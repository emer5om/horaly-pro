<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            // Message templates - will be populated via model boot method
            if (!Schema::hasColumn('establishments', 'whatsapp_connected')) {
                $table->boolean('whatsapp_connected')->default(false);
            }
            if (!Schema::hasColumn('establishments', 'whatsapp_reminder_message')) {
                $table->text('whatsapp_reminder_message')->nullable();
            }
            if (!Schema::hasColumn('establishments', 'whatsapp_confirmation_message')) {
                $table->text('whatsapp_confirmation_message')->nullable();
            }
            if (!Schema::hasColumn('establishments', 'whatsapp_birthday_message')) {
                $table->text('whatsapp_birthday_message')->nullable();
            }
            if (!Schema::hasColumn('establishments', 'whatsapp_promotion_message')) {
                $table->text('whatsapp_promotion_message')->nullable();
            }
            if (!Schema::hasColumn('establishments', 'whatsapp_cancellation_message')) {
                $table->text('whatsapp_cancellation_message')->nullable();
            }
            if (!Schema::hasColumn('establishments', 'whatsapp_welcome_message')) {
                $table->text('whatsapp_welcome_message')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp_connected',
                'whatsapp_reminder_message',
                'whatsapp_confirmation_message', 
                'whatsapp_birthday_message',
                'whatsapp_promotion_message',
                'whatsapp_cancellation_message',
                'whatsapp_welcome_message'
            ]);
        });
    }
};