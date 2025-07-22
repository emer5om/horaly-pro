<?php

namespace App\Http\Controllers;

use App\Models\BlockedDate;
use App\Models\BlockedTime;
use App\Models\Coupon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        return Inertia::render('establishment/company/index', [
            'establishment' => $establishment,
            'blockedDates' => $establishment->blockedDates()->orderBy('blocked_date')->get(),
            'blockedTimes' => $establishment->blockedTimes()->orderBy('blocked_date')->orderBy('start_time')->get(),
            'coupons' => $establishment->coupons()->orderBy('created_at', 'desc')->get(),
            'activeTab' => $request->query('tab', 'data'),
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function updateCompanyData(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:500',
            'description' => 'nullable|string|max:1000',
        ]);

        $establishment = auth()->user()->establishment;
        
        $establishment->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'description' => $request->description,
        ]);

        return redirect()->route('company.index', ['tab' => 'data'])->with('success', 'Dados da empresa atualizados com sucesso!');
    }

    public function updateWorkingHours(Request $request)
    {
        $request->validate([
            'working_hours' => 'required|array',
            'working_hours.*.is_open' => 'boolean',
            'working_hours.*.start_time' => 'nullable|date_format:H:i',
            'working_hours.*.end_time' => 'nullable|date_format:H:i',
        ]);

        $establishment = auth()->user()->establishment;
        
        $establishment->update([
            'working_hours' => $request->working_hours,
        ]);

        return redirect()->route('company.index', ['tab' => 'hours'])->with('success', 'Horários de funcionamento atualizados com sucesso!');
    }

    public function updateBookingSettings(Request $request)
    {
        $request->validate([
            'slots_per_hour' => 'required|integer|min:1|max:10',
            'allow_rescheduling' => 'boolean',
            'allow_cancellation' => 'boolean',
            'reschedule_advance_hours' => 'required|integer|min:1|max:168',
            'cancel_advance_hours' => 'required|integer|min:1|max:168',
            'earliest_booking_time' => 'nullable|string',
            'latest_booking_time' => 'nullable|string',
        ]);

        $establishment = auth()->user()->establishment;
        
        $establishment->update([
            'slots_per_hour' => $request->slots_per_hour,
            'allow_rescheduling' => $request->allow_rescheduling ?? false,
            'allow_cancellation' => $request->allow_cancellation ?? false,
            'reschedule_advance_hours' => $request->reschedule_advance_hours,
            'cancel_advance_hours' => $request->cancel_advance_hours,
            'earliest_booking_time' => $request->earliest_booking_time === 'same_day' ? null : $request->earliest_booking_time,
            'latest_booking_time' => $request->latest_booking_time === 'no_limit' ? null : $request->latest_booking_time,
        ]);

        return redirect()->route('company.index', ['tab' => 'booking'])->with('success', 'Configurações de agendamento atualizadas com sucesso!');
    }

    public function storeBlockedDate(Request $request)
    {
        $request->validate([
            'blocked_date' => 'required|date|after_or_equal:today',
            'reason' => 'nullable|string|max:255',
            'is_recurring' => 'boolean',
        ]);

        $establishment = auth()->user()->establishment;

        BlockedDate::create([
            'establishment_id' => $establishment->id,
            'blocked_date' => $request->blocked_date,
            'reason' => $request->reason,
            'is_recurring' => $request->is_recurring ?? false,
        ]);

        return redirect()->route('company.index', ['tab' => 'blocks'])->with('success', 'Data bloqueada com sucesso!');
    }

    public function destroyBlockedDate(BlockedDate $blockedDate)
    {
        if ($blockedDate->establishment_id !== auth()->user()->establishment->id) {
            abort(403);
        }

        $blockedDate->delete();

        return redirect()->route('company.index', ['tab' => 'blocks'])->with('success', 'Data desbloqueada com sucesso!');
    }

    public function storeBlockedTime(Request $request)
    {
        $request->validate([
            'blocked_date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'reason' => 'nullable|string|max:255',
        ]);

        $establishment = auth()->user()->establishment;

        BlockedTime::create([
            'establishment_id' => $establishment->id,
            'blocked_date' => $request->blocked_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'reason' => $request->reason,
        ]);

        return redirect()->route('company.index', ['tab' => 'blocks'])->with('success', 'Horário bloqueado com sucesso!');
    }

    public function destroyBlockedTime(BlockedTime $blockedTime)
    {
        if ($blockedTime->establishment_id !== auth()->user()->establishment->id) {
            abort(403);
        }

        $blockedTime->delete();

        return redirect()->route('company.index', ['tab' => 'blocks'])->with('success', 'Horário desbloqueado com sucesso!');
    }

    public function storeCoupon(Request $request)
    {
        $request->validate([
            'code' => 'nullable|string|max:20|unique:coupons,code',
            'name' => 'required|string|max:255',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
        ]);

        $establishment = auth()->user()->establishment;

        $code = $request->code ? strtoupper($request->code) : strtoupper(Str::random(8));

        Coupon::create([
            'establishment_id' => $establishment->id,
            'code' => $code,
            'name' => $request->name,
            'type' => $request->type,
            'value' => $request->value,
            'usage_limit' => $request->usage_limit,
            'valid_from' => $request->valid_from,
            'valid_until' => $request->valid_until,
        ]);

        return redirect()->route('company.index', ['tab' => 'coupons'])->with('success', 'Cupom criado com sucesso!');
    }

    public function updateCoupon(Request $request, Coupon $coupon)
    {
        if ($coupon->establishment_id !== auth()->user()->establishment->id) {
            abort(403);
        }

        $request->validate([
            'code' => 'required|string|max:20|unique:coupons,code,' . $coupon->id,
            'name' => 'required|string|max:255',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'boolean',
        ]);

        $coupon->update([
            'code' => strtoupper($request->code),
            'name' => $request->name,
            'type' => $request->type,
            'value' => $request->value,
            'usage_limit' => $request->usage_limit,
            'valid_from' => $request->valid_from,
            'valid_until' => $request->valid_until,
            'is_active' => $request->is_active ?? false,
        ]);

        return redirect()->route('company.index', ['tab' => 'coupons'])->with('success', 'Cupom atualizado com sucesso!');
    }

    public function destroyCoupon(Coupon $coupon)
    {
        if ($coupon->establishment_id !== auth()->user()->establishment->id) {
            abort(403);
        }

        $coupon->delete();

        return redirect()->route('company.index', ['tab' => 'coupons'])->with('success', 'Cupom excluído com sucesso!');
    }

    public function updateNotificationSettings(Request $request)
    {
        $request->validate([
            'receive_notifications' => 'boolean',
            'notification_settings' => 'nullable|array',
        ]);

        $establishment = auth()->user()->establishment;
        
        $establishment->update([
            'receive_notifications' => $request->receive_notifications ?? false,
            'notification_settings' => $request->notification_settings ?? [],
        ]);

        return redirect()->route('company.index', ['tab' => 'notifications'])->with('success', 'Configurações de notificação atualizadas com sucesso!');
    }

    public function updateTrustLists(Request $request)
    {
        $request->validate([
            'trust_list_active' => 'boolean',
            'blacklist_active' => 'boolean',
            'trust_list' => 'nullable|array',
            'blacklist' => 'nullable|array',
        ]);

        $establishment = auth()->user()->establishment;
        
        $establishment->update([
            'trust_list_active' => $request->trust_list_active ?? false,
            'blacklist_active' => $request->blacklist_active ?? false,
            'trust_list' => $request->trust_list ?? [],
            'blacklist' => $request->blacklist ?? [],
        ]);

        return redirect()->back()->with('success', 'Listas de confiança atualizadas com sucesso!');
    }
}