import { Head, useForm } from '@inertiajs/react';
import { Building, LoaderCircle, Mail, MapPin, Phone } from 'lucide-react';
import { FormEventHandler } from 'react';

import HoralyLogo from '@/components/horaly-logo';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Tipos para o formulário de onboarding
 */
type OnboardingForm = {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
};

/**
 * Componente de onboarding do estabelecimento
 *
 * Permite que o usuário configure seu estabelecimento após o registro
 */
export default function Onboarding() {
    const { data, setData, post, processing, errors } = useForm<OnboardingForm>({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
    });

    /**
     * Submete o formulário de onboarding
     */
    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('establishment.onboarding.store'));
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Head title="Configurar Estabelecimento - Horaly" />

            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mb-6 flex justify-center">
                        <HoralyLogo size="lg" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Configure seu Estabelecimento</h1>
                    <p className="mt-2 text-gray-600">Vamos configurar os dados do seu estabelecimento para você começar a usar a plataforma</p>
                </div>

                {/* Formulário */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Dados do Estabelecimento
                        </CardTitle>
                        <CardDescription>Informe os dados do seu estabelecimento para personalizar sua experiência</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid gap-6">
                                {/* Nome do Estabelecimento */}
                                <div className="grid gap-2">
                                    <Label htmlFor="name" className="flex items-center gap-2">
                                        <Building className="h-4 w-4" />
                                        Nome do Estabelecimento
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Digite o nome do seu estabelecimento"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                {/* Email */}
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        E-mail do Estabelecimento
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="contato@seuestablecimento.com"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                {/* Telefone */}
                                <div className="grid gap-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Telefone
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        required
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="(11) 3333-3333"
                                    />
                                    <InputError message={errors.phone} />
                                </div>

                                {/* Endereço */}
                                <div className="grid gap-2">
                                    <Label htmlFor="address" className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Endereço
                                    </Label>
                                    <Input
                                        id="address"
                                        type="text"
                                        required
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="Rua, número, bairro"
                                    />
                                    <InputError message={errors.address} />
                                </div>

                                {/* Cidade e Estado */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="city">Cidade</Label>
                                        <Input
                                            id="city"
                                            type="text"
                                            required
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder="Cidade"
                                        />
                                        <InputError message={errors.city} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="state">Estado</Label>
                                        <Input
                                            id="state"
                                            type="text"
                                            required
                                            value={data.state}
                                            onChange={(e) => setData('state', e.target.value)}
                                            placeholder="SP"
                                        />
                                        <InputError message={errors.state} />
                                    </div>
                                </div>

                                {/* CEP */}
                                <div className="grid gap-2">
                                    <Label htmlFor="postal_code">CEP</Label>
                                    <Input
                                        id="postal_code"
                                        type="text"
                                        required
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        placeholder="00000-000"
                                    />
                                    <InputError message={errors.postal_code} />
                                </div>

                                {/* Botão de envio */}
                                <Button type="submit" className="mt-6 w-full" disabled={processing}>
                                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    Finalizar Configuração
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Informações adicionais */}
                <div className="text-center text-sm text-gray-500">
                    <p>Esses dados serão usados para personalizar sua experiência e podem ser alterados a qualquer momento nas configurações.</p>
                </div>
            </div>
        </div>
    );
}
