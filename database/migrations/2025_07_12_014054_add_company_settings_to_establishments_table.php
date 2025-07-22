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
            // Apenas campos que ainda não existem
            if (!Schema::hasColumn('establishments', 'receive_notifications')) {
                $table->boolean('receive_notifications')->default(true);
            }
            if (!Schema::hasColumn('establishments', 'notification_settings')) {
                $table->json('notification_settings')->nullable();
            }
            if (!Schema::hasColumn('establishments', 'trust_list_active')) {
                $table->boolean('trust_list_active')->default(false);
            }
            if (!Schema::hasColumn('establishments', 'blacklist_active')) {
                $table->boolean('blacklist_active')->default(false);
            }
            if (!Schema::hasColumn('establishments', 'trust_list')) {
                $table->json('trust_list')->nullable();
            }
            if (!Schema::hasColumn('establishments', 'blacklist')) {
                $table->json('blacklist')->nullable();
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
                'receive_notifications',
                'notification_settings',
                'trust_list_active',
                'blacklist_active',
                'trust_list',
                'blacklist'
            ]);
        });
    }
};
