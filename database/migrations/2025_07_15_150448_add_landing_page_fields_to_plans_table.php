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
        Schema::table('plans', function (Blueprint $table) {
            $table->string('landing_title')->nullable()->after('name');
            $table->text('landing_description')->nullable()->after('description');
            $table->json('landing_features')->nullable()->after('features');
            $table->string('landing_button_text')->default('Escolher Plano')->after('landing_features');
            $table->string('landing_badge')->nullable()->after('landing_button_text');
            $table->boolean('landing_featured')->default(false)->after('landing_badge');
            $table->integer('landing_order')->default(0)->after('landing_featured');
            $table->boolean('show_on_landing')->default(true)->after('landing_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn([
                'landing_title',
                'landing_description',
                'landing_features',
                'landing_button_text',
                'landing_badge',
                'landing_featured',
                'landing_order',
                'show_on_landing'
            ]);
        });
    }
};
