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
            if (!Schema::hasColumn('establishments', 'earliest_booking_time')) {
                $table->string('earliest_booking_time')->nullable()->after('cancel_advance_hours');
            }
            if (!Schema::hasColumn('establishments', 'latest_booking_time')) {
                $table->string('latest_booking_time')->nullable()->after('earliest_booking_time');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('establishments', function (Blueprint $table) {
            $table->dropColumn(['earliest_booking_time', 'latest_booking_time']);
        });
    }
};
