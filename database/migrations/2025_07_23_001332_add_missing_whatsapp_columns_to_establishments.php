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
            // Add missing WhatsApp columns that are being used in the code but don't exist in migrations
            if (!Schema::hasColumn('establishments', 'whatsapp_instance_name')) {
                $table->string('whatsapp_instance_name')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_instance_name']);
        });
    }
};
