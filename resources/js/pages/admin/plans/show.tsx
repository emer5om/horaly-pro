import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building, Calendar, Check, Crown, CreditCard, DollarSign, Mail, Phone, Star, User, Users, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/Admin/AdminLayout';

interface Plan {
    id: number;
    name: string;
    description: string;
    price: number;
    billing_cycle: string;
    features: string[];
    monthly_appointment_limit: number | null;
    unlimited_appointments: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Establishment {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
        created_at: string;
    };
}

interface PlansShowProps {
    auth: any;
    plan: Plan;
    establishments: Establishment[];
}

const availableFeatures = [
    'appointments',
    'services',
    'customers',
    'reports',
    'notifications',
    'integrations',
    'analytics',
    'support',
    'custom_branding',
    'api_access',
];

const featureLabels = {
    appointments: 'Agendamentos',
    services: 'Serviços',
    customers: 'Clientes',
    reports: 'Relatórios',
    notifications: 'Notificações',
    integrations: 'Integrações',
    analytics: 'Analytics',
    support: 'Suporte',
    custom_branding: 'Marca Personalizada',
    api_access: 'Acesso API',
};

export default function PlansShow({ auth, plan, establishments }: PlansShowProps) {
    const getBillingCycleLabel = (cycle: string) => {
        const labels = {
            monthly: 'Mensal',
            quarterly: 'Trimestral',
            yearly: 'Anual',
        };
        return labels[cycle as keyof typeof labels] || cycle;
    };

    const getAppointmentLimitText = (plan: Plan) => {
        if (plan.unlimited_appointments) {
            return 'Ilimitado';
        }
        
        if (plan.monthly_appointment_limit) {
            return `${plan.monthly_appointment_limit} agendamentos/mês`;
        }
        
        return 'Sem limite definido';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <AdminLayout auth={auth}>
            <Head title={`Plano: ${plan.name} - Admin`} />

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
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                {plan.name}
                                <Badge variant={plan.is_active ? "default" : "secondary"} className="ml-3">
                                    {plan.is_active ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </h1>
                            <p className="text-gray-600">{plan.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Link href={`/admin/plans/${plan.id}/edit`}>
                            <Button variant="outline">
                                Editar Plano
                            </Button>
                        </Link>
                        <Link href={`/admin/plans/${plan.id}/permissions`}>
                            <Button>
                                Gerenciar Permissões
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Preço</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                R$ {Number(plan.price).toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {getBillingCycleLabel(plan.billing_cycle)}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Limite de Agendamentos</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {plan.unlimited_appointments ? (
                                    <span className="text-blue-600 flex items-center">
                                        <Star className="mr-1 h-5 w-5" />
                                        Ilimitado
                                    </span>
                                ) : (
                                    <span className="text-gray-900">
                                        {plan.monthly_appointment_limit || 0}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {plan.unlimited_appointments ? 'Sem restrições' : 'por mês'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Estabelecimentos</CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{establishments.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {establishments.length === 1 ? 'estabelecimento' : 'estabelecimentos'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Star className="mr-2 h-5 w-5" />
                            Recursos Incluídos
                        </CardTitle>
                        <CardDescription>
                            Funcionalidades disponíveis neste plano
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableFeatures.map((feature) => (
                                <div key={feature} className="flex items-center space-x-2">
                                    {plan.features.includes(feature) ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <X className="h-4 w-4 text-gray-400" />
                                    )}
                                    <span className={`text-sm ${plan.features.includes(feature) ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {featureLabels[feature as keyof typeof featureLabels] || feature}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Users className="mr-2 h-5 w-5" />
                            Estabelecimentos ({establishments.length})
                        </CardTitle>
                        <CardDescription>
                            Estabelecimentos que utilizam este plano
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {establishments.length === 0 ? (
                            <div className="text-center py-8">
                                <Building className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    Nenhum estabelecimento
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Ainda não há estabelecimentos utilizando este plano.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Estabelecimento</TableHead>
                                        <TableHead>Responsável</TableHead>
                                        <TableHead>Contato</TableHead>
                                        <TableHead>Data de Cadastro</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {establishments.map((establishment) => (
                                        <TableRow key={establishment.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                                        <Building className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{establishment.name}</div>
                                                        <div className="text-sm text-gray-500">{establishment.address}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                                                        <User className="h-4 w-4 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{establishment.user.name}</div>
                                                        <div className="text-sm text-gray-500">{establishment.user.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2 text-sm">
                                                        <Mail className="h-3 w-3 text-gray-400" />
                                                        <span>{establishment.email}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-sm">
                                                        <Phone className="h-3 w-3 text-gray-400" />
                                                        <span>{establishment.phone}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-gray-500">
                                                    {formatDate(establishment.created_at)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">
                                                    Ver Detalhes
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}