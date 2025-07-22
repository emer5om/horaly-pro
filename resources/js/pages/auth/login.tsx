import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

/**
 * Tipo para o formulário de login
 */
type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

/**
 * Props para o componente de login
 */
interface LoginProps {
    status?: string;
}

/**
 * Componente de login para estabelecimentos
 *
 * Esta página permite que estabelecimentos façam login no sistema.
 * Utiliza componentes do shadcn/ui para uma interface consistente.
 */
export default function Login({ status }: LoginProps) {
    // Hook do Inertia para gerenciar formulários
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    /**
     * Submete o formulário de login
     */
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Entrar na sua conta" description="Acesse à sua conta para gerir seus agendamentos.">
            <Head title="Login - Horaly" />

            {/* Mensagem de status (se houver) */}
            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}

            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    {/* Campo de email */}
                    <div className="grid gap-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="seu@email.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    {/* Campo de senha */}
                    <div className="grid gap-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Sua senha"
                        />
                        <InputError message={errors.password} />
                    </div>

                    {/* Checkbox "Lembrar-me" */}
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                        />
                        <Label htmlFor="remember">Lembrar-me</Label>
                    </div>

                    {/* Botão de login */}
                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        Entrar
                    </Button>
                </div>

                {/* Link para registro */}
                <div className="text-center text-sm text-muted-foreground">
                    Ainda não tem uma conta?{' '}
                    <TextLink href={route('register')} tabIndex={5}>
                        Cadastre-se aqui
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
