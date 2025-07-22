<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class EstablishmentRegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Dados do usuário
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            
            // Dados do estabelecimento
            'establishment_name' => ['required', 'string', 'max:255'],
            'establishment_email' => ['required', 'string', 'email', 'max:255'],
            'establishment_phone' => ['required', 'string', 'max:20'],
            'establishment_address' => ['required', 'string', 'max:500'],
            'plan_id' => ['required', 'exists:plans,id'],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'O nome é obrigatório.',
            'email.required' => 'O e-mail é obrigatório.',
            'email.email' => 'O e-mail deve ser um endereço válido.',
            'email.unique' => 'Este e-mail já está sendo usado.',
            'password.required' => 'A senha é obrigatória.',
            'password.min' => 'A senha deve ter pelo menos 8 caracteres.',
            'password.confirmed' => 'A confirmação da senha não confere.',
            'establishment_name.required' => 'O nome do estabelecimento é obrigatório.',
            'establishment_email.required' => 'O e-mail do estabelecimento é obrigatório.',
            'establishment_email.email' => 'O e-mail do estabelecimento deve ser válido.',
            'establishment_phone.required' => 'O telefone do estabelecimento é obrigatório.',
            'establishment_address.required' => 'O endereço do estabelecimento é obrigatório.',
            'plan_id.required' => 'Selecione um plano.',
            'plan_id.exists' => 'Plano selecionado inválido.',
        ];
    }
}
