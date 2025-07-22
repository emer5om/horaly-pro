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
            // Notification toggles
            $table->boolean('reminder_enabled')->default(true);
            $table->boolean('confirmation_enabled')->default(true);
            $table->boolean('welcome_enabled')->default(true);
            $table->boolean('birthday_enabled')->default(true);
            $table->boolean('promotion_enabled')->default(true);
            $table->boolean('cancellation_enabled')->default(true);
            
            // Timing settings
            $table->integer('reminder_hours_before')->default(24);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->dropColumn([
                'reminder_enabled',
                'confirmation_enabled', 
                'welcome_enabled',
                'birthday_enabled',
                'promotion_enabled',
                'cancellation_enabled',
                'reminder_hours_before'
            ]);
        });
    }
};
