import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/Admin/AdminLayout';

interface CreatePlanProps {
    auth: any;
}

const availableFeatures = [
    { key: 'appointments', label: 'Agendamentos' },
    { key: 'services', label: 'Serviços' },
    { key: 'customers', label: 'Clientes' },
    { key: 'reports', label: 'Relatórios' },
    { key: 'notifications', label: 'Notificações' },
    { key: 'integrations', label: 'Integrações' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'support', label: 'Suporte' },
    { key: 'custom_branding', label: 'Marca Personalizada' },
    { key: 'api_access', label: 'Acesso API' },
];

export default function CreatePlan({ auth }: CreatePlanProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        price: '',
        billing_cycle: '',
        features: [] as string[],
        monthly_appointment_limit: '',
        unlimited_appointments: false,
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/plans');
    };

    const handleFeatureToggle = (feature: string) => {
        const newFeatures = data.features.includes(feature)
            ? data.features.filter(f => f !== feature)
            : [...data.features, feature];
        setData('features', newFeatures);
    };

    return (
        <AdminLayout auth={auth}>
            <Head title="Criar Plano - Admin" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/admin/plans">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Criar Novo Plano</h1>
                            <p className="text-gray-600">Crie um novo plano de assinatura</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações Básicas</CardTitle>
                                <CardDescription>
                                    Defina as informações básicas do plano
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Nome do Plano</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Ex: Plano Básico"
                                        className="mt-1"
                                    />
                                    {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="description">Descrição</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Descreva o plano e seus benefícios..."
                                        rows={3}
                                        className="mt-1"
                                    />
                                    {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="price">Preço (R$)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        placeholder="99.90"
                                        className="mt-1"
                                    />
                                    {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="billing_cycle">Ciclo de Cobrança</Label>
                                    <Select value={data.billing_cycle} onValueChange={(value) => setData('billing_cycle', value)}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Selecione o ciclo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Mensal</SelectItem>
                                            <SelectItem value="quarterly">Trimestral</SelectItem>
                                            <SelectItem value="yearly">Anual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.billing_cycle && <p className="text-sm text-red-600 mt-1">{errors.billing_cycle}</p>}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => setData('is_active', checked)}
                                    />
                                    <Label htmlFor="is_active">Plano Ativo</Label>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Limites de Agendamento</CardTitle>
                                <CardDescription>
                                    Configure os limites de agendamento para este plano
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="unlimited_appointments"
                                            checked={data.unlimited_appointments}
                                            onCheckedChange={(checked) => setData('unlimited_appointments', checked)}
                                        />
                                        <Label htmlFor="unlimited_appointments">Agendamentos Ilimitados</Label>
                                    </div>

                                    {!data.unlimited_appointments && (
                                        <div>
                                            <Label htmlFor="monthly_appointment_limit">Limite de Agendamentos por Mês</Label>
                                            <Input
                                                id="monthly_appointment_limit"
                                                type="number"
                                                min="1"
                                                value={data.monthly_appointment_limit}
                                                onChange={(e) => setData('monthly_appointment_limit', e.target.value)}
                                                placeholder="Ex: 100"
                                                className="mt-1"
                                            />
                                            {errors.monthly_appointment_limit && <p className="text-sm text-red-600 mt-1">{errors.monthly_appointment_limit}</p>}
                                            <p className="text-sm text-gray-500 mt-1">
                                                Deixe em branco para ilimitado ou digite 0 para não permitir agendamentos
                                            </p>
                                        </div>
                                    )}

                                    {data.unlimited_appointments && (
                                        <div className="p-3 bg-blue-50 rounded-md">
                                            <p className="text-sm text-blue-800">
                                                ✨ Este plano permite agendamentos ilimitados por mês
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recursos e Permissões</CardTitle>
                                <CardDescription>
                                    Selecione os recursos incluídos neste plano
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {availableFeatures.map((feature) => (
                                        <div key={feature.key} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={feature.key}
                                                checked={data.features.includes(feature.key)}
                                                onCheckedChange={() => handleFeatureToggle(feature.key)}
                                            />
                                            <Label htmlFor={feature.key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {feature.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.features && <p className="text-sm text-red-600 mt-2">{errors.features}</p>}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex items-center justify-end space-x-4">
                        <Link href="/admin/plans">
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Criando...' : 'Criar Plano'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}