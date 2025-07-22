import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/layouts/Admin/AdminLayout';

interface Plan {
    id: number;
    name: string;
    description: string;
    price: number;
    billing_cycle: string;
    features: string[];
    is_active: boolean;
}

interface PermissionsProps {
    auth: any;
    plan: Plan;
}

const availableFeatures = [
    { 
        key: 'appointments', 
        label: 'Agendamentos', 
        description: 'Permite criar, editar e gerenciar agendamentos',
        icon: '📅'
    },
    { 
        key: 'services', 
        label: 'Serviços', 
        description: 'Permite criar e gerenciar serviços oferecidos',
        icon: '✂️'
    },
    { 
        key: 'customers', 
        label: 'Clientes', 
        description: 'Permite gerenciar a base de clientes',
        icon: '👥'
    },
    { 
        key: 'reports', 
        label: 'Relatórios', 
        description: 'Acesso a relatórios e estatísticas',
        icon: '📊'
    },
    { 
        key: 'notifications', 
        label: 'Notificações', 
        description: 'Sistema de notificações push e email',
        icon: '🔔'
    },
    { 
        key: 'integrations', 
        label: 'Integrações', 
        description: 'Integrações com serviços externos',
        icon: '🔗'
    },
    { 
        key: 'analytics', 
        label: 'Analytics', 
        description: 'Analytics avançado e métricas detalhadas',
        icon: '📈'
    },
    { 
        key: 'support', 
        label: 'Suporte', 
        description: 'Suporte prioritário e chat ao vivo',
        icon: '🎧'
    },
    { 
        key: 'custom_branding', 
        label: 'Marca Personalizada', 
        description: 'Personalização de logo e cores',
        icon: '🎨'
    },
    { 
        key: 'api_access', 
        label: 'Acesso API', 
        description: 'Acesso completo à API REST',
        icon: '🔌'
    },
];

export default function PlanPermissions({ auth, plan }: PermissionsProps) {
    const { data, setData, put, processing, errors } = useForm({
        features: plan.features,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/plans/${plan.id}/permissions`, {
            onSuccess: () => {
                // Redirect handled by controller
            }
        });
    };

    const handleFeatureToggle = (feature: string) => {
        const newFeatures = data.features.includes(feature)
            ? data.features.filter(f => f !== feature)
            : [...data.features, feature];
        setData('features', newFeatures);
    };

    const isFeatureEnabled = (feature: string) => {
        return data.features.includes(feature);
    };

    return (
        <AdminLayout auth={auth}>
            <Head title={`Permissões do Plano: ${plan.name} - Admin`} />

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
                            <h1 className="text-2xl font-bold text-gray-900">Permissões do Plano: {plan.name}</h1>
                            <p className="text-gray-600">Configure as funcionalidades disponíveis neste plano</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Informações do Plano
                        </CardTitle>
                        <CardDescription>
                            Detalhes básicos do plano atual
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Nome</Label>
                                <p className="text-lg font-semibold">{plan.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Preço</Label>
                                <p className="text-lg font-semibold text-green-600">R$ {Number(plan.price).toFixed(2)}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Status</Label>
                                <p className={`text-lg font-semibold ${plan.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                    {plan.is_active ? 'Ativo' : 'Inativo'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recursos e Permissões</CardTitle>
                            <CardDescription>
                                Ative ou desative os recursos que estarão disponíveis para os estabelecimentos que usam este plano.
                                Recursos desativados não aparecerão no dashboard do estabelecimento.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {availableFeatures.map((feature) => (
                                    <div key={feature.key} className="flex items-start space-x-4 p-4 border rounded-lg">
                                        <div className="text-2xl">{feature.icon}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-base font-medium">
                                                        {feature.label}
                                                    </Label>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {feature.description}
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={isFeatureEnabled(feature.key)}
                                                    onCheckedChange={() => handleFeatureToggle(feature.key)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.features && <p className="text-sm text-red-600 mt-4">{errors.features}</p>}
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <strong>{data.features.length}</strong> de {availableFeatures.length} recursos ativados
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/admin/plans">
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Salvando...' : 'Salvar Permissões'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}