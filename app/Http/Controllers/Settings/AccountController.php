<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function index()
    {
        $establishment = auth()->user()->establishment()->with('plan')->first();
        
        return Inertia::render('establishment/settings/account', [
            'user' => auth()->user(),
            'planFeatures' => $establishment->plan ? $establishment->plan->features : [],
        ]);
    }

    public function updateEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email|max:255|unique:users,email,' . auth()->id(),
        ]);

        $user = auth()->user();
        $user->update(['email' => $request->email]);

        // Atualizar também o email do estabelecimento se existir
        if ($user->establishment) {
            $user->establishment->update(['email' => $request->email]);
        }

        return redirect()->back()->with('success', 'Email atualizado com sucesso!');
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = auth()->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return redirect()->back()->withErrors(['current_password' => 'A senha atual está incorreta.']);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return redirect()->back()->with('success', 'Senha atualizada com sucesso!');
    }
}