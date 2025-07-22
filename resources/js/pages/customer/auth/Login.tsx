import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Phone, User } from 'lucide-react';

export default function CustomerLogin() {
    const { data, setData, post, processing, errors, reset } = useForm({
        phone: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('customer.login'), {
            onFinish: () => reset('phone'),
        });
    };

    return (
        <AuthLayout title="Área do Cliente" description="Digite seu telefone para acessar seus agendamentos">
            <Head title="Área do Cliente - Login" />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Entrar na minha conta
                    </CardTitle>
                    <CardDescription>
                        Use o telefone cadastrado em seus agendamentos. Você pode digitar com ou sem formatação.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="(51) 98065-1119 ou 51980651119"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="text-sm text-red-600">{errors.phone}</p>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        checked={data.remember}
                                        onCheckedChange={(checked) => setData('remember', checked === true)}
                                    />
                                    <Label htmlFor="remember" className="text-sm">
                                        Lembrar de mim
                                    </Label>
                                </div>

                                <Button type="submit" className="w-full" disabled={processing}>
                                    {processing ? 'Entrando...' : 'Entrar'}
                                </Button>
                            </form>

                            <div className="mt-6 text-center text-sm text-muted-foreground">
                                <p>
                                    Ainda não tem agendamentos?{' '}
                                    <Link
                                        href="/"
                                        className="text-primary underline-offset-4 hover:underline"
                                    >
                                        Agende seu primeiro serviço
                                    </Link>
                                </p>
                            </div>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}