<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Services\CampaignService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule campaign message processing
Schedule::command('campaigns:process-messages')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground();

// Update campaign statistics every 5 minutes
Schedule::call(function () {
    $campaignService = app(CampaignService::class);
    // This would be implemented if needed for real-time stats updates
})->everyFiveMinutes();
