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
            if (!Schema::hasColumn('establishments', 'booking_slug')) {
                $table->string('booking_slug')->nullable()->unique();
            }
            if (!Schema::hasColumn('establishments', 'booking_primary_color')) {
                $table->string('booking_primary_color')->default('#3B82F6');
            }
            if (!Schema::hasColumn('establishments', 'booking_secondary_color')) {
                $table->string('booking_secondary_color')->default('#1E40AF');
            }
            if (!Schema::hasColumn('establishments', 'booking_slogan')) {
                $table->string('booking_slogan')->nullable();
            }
            if (!Schema::hasColumn('establishments', 'booking_logo')) {
                $table->string('booking_logo')->nullable();
            }
            if (!Schema::hasColumn('establishments', 'booking_banner')) {
                $table->string('booking_banner')->nullable();
            }
            if (!Schema::hasColumn('establishments', 'booking_theme')) {
                $table->string('booking_theme')->default('modern');
            }
            if (!Schema::hasColumn('establishments', 'required_fields')) {
                $table->json('required_fields')->nullable();
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
                'booking_slug',
                'booking_primary_color',
                'booking_secondary_color',
                'booking_slogan',
                'booking_logo',
                'booking_banner',
                'booking_theme',
                'required_fields'
            ]);
        });
    }
};
