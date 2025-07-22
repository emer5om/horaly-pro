import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building, LoaderCircle, Save } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/Admin/AdminLayout';

interface Plan {
    id: number;
    name: string;
    price: number;
    billing_cycle: string;
    is_active: boolean;
}

interface PageProps {
    plans: Plan[];
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
}

export default function CreateEstablishment({ plans, auth }: PageProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        plan_id: '',
        description: '',
        status: 'active',
        user_name: '',
        user_password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/establishments');
    };

    const formatPrice = (price: number, cycle: string) => {
        const formatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
        
        return `${formatted}/${cycle === 'monthly' ? 'mês' : 'ano'}`;
    };

    return (
        <AdminLayout auth={auth}>
            <Head title="Novo Estabelecimento" />

            <div className="@container/main flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-4">
                    <Button variant="outline" size="sm" asChild className="w-fit">
                        <Link href="/admin/establishments">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold sm:text-2xl">Novo Estabelecimento</h1>
                        <p className="text-sm text-muted-foreground sm:text-base">Crie um novo estabelecimento na plataforma</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Informações do Responsável
                            </CardTitle>
                            <CardDescription>
                                Dados do usuário responsável pelo estabelecimento
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="user_name">Nome do Responsável *</Label>
                                    <Input
                                        id="user_name"
                                        value={data.user_name}
                                        onChange={(e) => setData('user_name', e.target.value)}
                                        placeholder="Nome completo do responsável"
                                        required
                                    />
                                    {errors.user_name && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.user_name}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="user_password">Senha de Acesso *</Label>
                                    <Input
                                        id="user_password"
                                        type="password"
                                        value={data.user_password}
                                        onChange={(e) => setData('user_password', e.target.value)}
                                        placeholder="Mínimo 8 caracteres"
                                        required
                                        minLength={8}
                                    />
                                    {errors.user_password && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.user_password}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Informações do Estabelecimento
                            </CardTitle>
                            <CardDescription>
                                Preencha os dados básicos do estabelecimento
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome do Estabelecimento *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Nome do estabelecimento"
                                        required
                                    />
                                    {errors.name && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.name}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email do Estabelecimento *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="email@exemplo.com"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Este será também o email de login do responsável
                                    </p>
                                    {errors.email && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.email}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone *</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="(11) 99999-9999"
                                        required
                                    />
                                    {errors.phone && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.phone}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="plan_id">Plano *</Label>
                                    <Select value={data.plan_id} onValueChange={(value) => setData('plan_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um plano" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                                    {plan.name} - {formatPrice(plan.price, plan.billing_cycle)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.plan_id && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.plan_id}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Endereço *</Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Endereço completo do estabelecimento"
                                    required
                                />
                                {errors.address && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{errors.address}</AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="city">Cidade *</Label>
                                    <Input
                                        id="city"
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        placeholder="Cidade"
                                        required
                                    />
                                    {errors.city && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.city}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">Estado *</Label>
                                    <Input
                                        id="state"
                                        value={data.state}
                                        onChange={(e) => setData('state', e.target.value)}
                                        placeholder="Estado"
                                        required
                                    />
                                    {errors.state && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.state}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="postal_code">CEP *</Label>
                                    <Input
                                        id="postal_code"
                                        value={data.postal_code}
                                        onChange={(e) => setData('postal_code', e.target.value)}
                                        placeholder="00000-000"
                                        required
                                    />
                                    {errors.postal_code && (
                                        <Alert variant="destructive">
                                            <AlertDescription>{errors.postal_code}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Descrição opcional do estabelecimento"
                                    rows={3}
                                />
                                {errors.description && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{errors.description}</AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status *</Label>
                                <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="inactive">Inativo</SelectItem>
                                        <SelectItem value="blocked">Bloqueado</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{errors.status}</AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-4">
                        <Button variant="outline" asChild>
                            <Link href="/admin/establishments">Cancelar</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Criar Estabelecimento
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}