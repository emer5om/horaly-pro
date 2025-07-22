import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AdminLoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface AdminLoginProps {
    status?: string;
}

export default function AdminLogin({ status }: AdminLoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<AdminLoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Admin Login - Horaly" />

            <div className="flex min-h-screen items-center justify-center bg-slate-900">
                <div className="w-full max-w-md space-y-8 p-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white">Admin Login</h1>
                        <p className="mt-2 text-slate-400">Acesse o painel administrativo</p>
                    </div>

                    {status && <div className="text-center text-sm font-medium text-green-400">{status}</div>}

                    <form className="mt-8 space-y-6" onSubmit={submit}>
                        <div>
                            <Label htmlFor="email" className="text-white">
                                E-mail
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="mt-1 border-slate-700 bg-slate-800 text-white"
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div>
                            <Label htmlFor="password" className="text-white">
                                Senha
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="mt-1 border-slate-700 bg-slate-800 text-white"
                            />
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        <Button type="submit" className="w-full bg-red-600 text-white hover:bg-red-700" disabled={processing}>
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar
                        </Button>
                    </form>

                    <div className="text-center">
                        <TextLink href={route('login')} className="text-slate-400 hover:text-white">
                            Voltar para login de estabelecimento
                        </TextLink>
                    </div>
                </div>
            </div>
        </>
    );
}
