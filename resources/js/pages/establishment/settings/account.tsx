import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Mail, Save, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
}

interface AccountPageProps {
    user: User;
    planFeatures?: string[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function AccountPage({ user, planFeatures = [], flash }: AccountPageProps) {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const emailForm = useForm({
        email: user.email,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        emailForm.patch('/settings/account/email', {
            onSuccess: () => {
                toast.success('Email atualizado com sucesso!');
            },
            onError: () => {
                toast.error('Erro ao atualizar email');
            },
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.patch('/settings/account/password', {
            onSuccess: () => {
                toast.success('Senha atualizada com sucesso!');
                passwordForm.reset();
            },
            onError: () => {
                toast.error('Erro ao atualizar senha');
            },
        });
    };

    return (
        <EstablishmentAppLayout title="Minha Conta" planFeatures={planFeatures}>
            <Head title="Minha Conta" />

            <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Minha Conta</h1>
                        <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações de segurança</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Informações Pessoais */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Informações Pessoais
                            </CardTitle>
                            <CardDescription>Suas informações básicas da conta</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Nome</Label>
                                    <Input value={user.name} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data de Cadastro</Label>
                                    <Input value={new Date(user.created_at).toLocaleDateString('pt-BR')} disabled />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Status da Conta</Label>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${user.email_verified_at ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                    <span className="text-sm">{user.email_verified_at ? 'Verificado' : 'Pendente de verificação'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alterar Email */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Email
                            </CardTitle>
                            <CardDescription>Altere seu endereço de email</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Endereço de Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={emailForm.data.email}
                                        onChange={(e) => emailForm.setData('email', e.target.value)}
                                        className="max-w-md"
                                    />
                                    {emailForm.errors.email && <p className="text-sm text-red-500">{emailForm.errors.email}</p>}
                                </div>

                                <Button type="submit" disabled={emailForm.processing} className="w-full md:w-auto">
                                    <Save className="mr-2 h-4 w-4" />
                                    {emailForm.processing ? 'Atualizando...' : 'Atualizar Email'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Alterar Senha */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                Senha
                            </CardTitle>
                            <CardDescription>Altere sua senha de acesso</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current_password">Senha Atual</Label>
                                    <div className="relative max-w-md">
                                        <Input
                                            id="current_password"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            placeholder="Digite sua senha atual"
                                            value={passwordForm.data.current_password}
                                            onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    {passwordForm.errors.current_password && (
                                        <p className="text-sm text-red-500">{passwordForm.errors.current_password}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Nova Senha</Label>
                                    <div className="relative max-w-md">
                                        <Input
                                            id="password"
                                            type={showNewPassword ? 'text' : 'password'}
                                            placeholder="Digite sua nova senha"
                                            value={passwordForm.data.password}
                                            onChange={(e) => passwordForm.setData('password', e.target.value)}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    {passwordForm.errors.password && <p className="text-sm text-red-500">{passwordForm.errors.password}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirmar Nova Senha</Label>
                                    <div className="relative max-w-md">
                                        <Input
                                            id="password_confirmation"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Confirme sua nova senha"
                                            value={passwordForm.data.password_confirmation}
                                            onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                            className="pr-10"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    {passwordForm.errors.password_confirmation && (
                                        <p className="text-sm text-red-500">{passwordForm.errors.password_confirmation}</p>
                                    )}
                                </div>

                                <Button type="submit" disabled={passwordForm.processing} className="w-full md:w-auto">
                                    <Save className="mr-2 h-4 w-4" />
                                    {passwordForm.processing ? 'Atualizando...' : 'Atualizar Senha'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Informações Adicionais */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Importantes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg bg-muted p-4">
                                <h4 className="mb-2 font-semibold">Segurança da Conta</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Use uma senha forte com pelo menos 8 caracteres</li>
                                    <li>• Inclua letras maiúsculas, minúsculas, números e símbolos</li>
                                    <li>• Não compartilhe sua senha com outras pessoas</li>
                                    <li>• Mantenha seu email atualizado para recuperação de conta</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </EstablishmentAppLayout>
    );
}
