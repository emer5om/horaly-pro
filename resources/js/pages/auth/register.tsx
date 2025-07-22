import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

/**
 * Tipos para o formulário de registro
 */
type RegisterForm = {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
};

/**
 * Componente de registro simplificado
 *
 * Permite que novos usuários se registrem com dados básicos.
 * O estabelecimento será cadastrado posteriormente dentro da plataforma.
 */
export default function Register() {
    // Hook do Inertia para gerenciar formulários
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    /**
     * Submete o formulário de registro
     */
    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Cadastrar-se" description="Crie sua conta e comece a usar a plataforma">
            <Head title="Cadastro - Horaly" />

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    {/* Nome */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Seu nome completo"
                        />
                        <InputError message={errors.name} />
                    </div>

                    {/* Email */}
                    <div className="grid gap-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="seu@email.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    {/* Telefone (WhatsApp) */}
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                        <Input
                            id="phone"
                            type="tel"
                            required
                            tabIndex={3}
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="(11) 99999-9999"
                        />
                        <InputError message={errors.phone} />
                    </div>

                    {/* Senha */}
                    <div className="grid gap-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Sua senha"
                        />
                        <InputError message={errors.password} />
                    </div>

                    {/* Confirmar Senha */}
                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirmar Senha</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={5}
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Confirme sua senha"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    {/* Botão de registro */}
                    <Button type="submit" className="mt-4 w-full" tabIndex={6} disabled={processing}>
                        {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Criar Conta
                    </Button>
                </div>

                {/* Link para login */}
                <div className="text-center text-sm text-muted-foreground">
                    Já tem uma conta?{' '}
                    <TextLink href={route('login')} tabIndex={7}>
                        Faça login aqui
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
