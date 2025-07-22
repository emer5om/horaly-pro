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
            $table->string('booking_slug')->nullable()->unique();
            $table->string('booking_primary_color')->default('#3B82F6');
            $table->string('booking_secondary_color')->default('#1E40AF');
            $table->string('booking_slogan')->nullable();
            $table->string('booking_logo')->nullable();
            $table->string('booking_banner')->nullable();
            $table->string('booking_theme')->default('modern');
            $table->json('required_fields')->nullable();
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
