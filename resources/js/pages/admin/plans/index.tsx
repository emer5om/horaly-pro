import { Head, Link, router } from '@inertiajs/react';
import { Check, Edit, Eye, Plus, Power, PowerOff, Settings, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
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

interface PlansIndexProps {
    auth: any;
    plans: Plan[];
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

export default function PlansIndex({ auth, plans }: PlansIndexProps) {
    const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

    const handleToggleStatus = (plan: Plan) => {
        router.patch(`/admin/plans/${plan.id}/toggle-status`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (plan: Plan) => {
        router.delete(`/admin/plans/${plan.id}`, {
            onSuccess: () => {
                setDeletingPlan(null);
            },
        });
    };

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

    return (
        <AdminLayout auth={auth}>
            <Head title="Gerenciar Planos - Admin" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Planos</h1>
                        <p className="text-gray-600">Gerencie os planos de assinatura disponíveis</p>
                    </div>
                    <Link href="/admin/plans/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Plano
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Planos</CardTitle>
                        <CardDescription>Todos os planos cadastrados no sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Preço</TableHead>
                                    <TableHead>Ciclo</TableHead>
                                    <TableHead>Limite Agendamentos</TableHead>
                                    <TableHead>Recursos</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{plan.name}</div>
                                                <div className="text-sm text-gray-500">{plan.description}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-green-600">
                                                R$ {Number(plan.price).toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{getBillingCycleLabel(plan.billing_cycle)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={plan.unlimited_appointments ? "default" : "secondary"} className="text-xs">
                                                {getAppointmentLimitText(plan)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {plan.features.slice(0, 3).map((feature) => (
                                                    <Badge key={feature} variant="secondary" className="text-xs">
                                                        {featureLabels[feature as keyof typeof featureLabels] || feature}
                                                    </Badge>
                                                ))}
                                                {plan.features.length > 3 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{plan.features.length - 3} mais
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    checked={plan.is_active}
                                                    onCheckedChange={() => handleToggleStatus(plan)}
                                                />
                                                <Badge variant={plan.is_active ? "default" : "secondary"}>
                                                    {plan.is_active ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Link href={`/admin/plans/${plan.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/admin/plans/${plan.id}/edit`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/admin/plans/${plan.id}/permissions`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" onClick={() => setDeletingPlan(plan)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Confirmar Exclusão</DialogTitle>
                                                            <DialogDescription>
                                                                Tem certeza que deseja excluir o plano "{plan.name}"?
                                                                Esta ação não pode ser desfeita.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => setDeletingPlan(null)}>
                                                                Cancelar
                                                            </Button>
                                                            <Button variant="destructive" onClick={() => handleDelete(plan)}>
                                                                Excluir
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
