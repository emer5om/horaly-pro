import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Building, Calendar, DollarSign, Edit, ExternalLink, Lock, RefreshCw, Shield, TrendingUp, Unlock, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AdminLayout from '@/layouts/Admin/AdminLayout';

interface Plan {
    id: number;
    name: string;
    price: number;
    billing_cycle: string;
    is_active: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Service {
    id: number;
    name: string;
    price: number;
    duration: number;
    is_active: boolean;
}

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
}

interface Appointment {
    id: number;
    date: string;
    time: string;
    status: string;
    price: number;
    discount_amount: number;
    customer: Customer;
}

interface Establishment {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    slug: string;
    description: string;
    status: 'active' | 'inactive' | 'blocked';
    created_at: string;
    plan: Plan;
    user: User;
    services: Service[];
    appointments: Appointment[];
}

interface Stats {
    total_services: number;
    total_appointments: number;
    pending_appointments: number;
    completed_appointments: number;
    total_revenue: number;
}

interface PageProps {
    establishment: Establishment;
    stats: Stats;
    plans?: Plan[];
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
}

export default function ShowEstablishment({ establishment, stats, plans = [], auth }: PageProps) {
    const [changingPlan, setChangingPlan] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(establishment.plan.id.toString());

    const handleStatusChange = () => {
        const action = establishment.status === 'blocked' ? 'desbloquear' : 'bloquear';
        
        if (confirm(`Tem certeza que deseja ${action} este estabelecimento?`)) {
            router.patch(`/admin/establishments/${establishment.id}/toggle-block`, {}, {
                onSuccess: () => {
                    toast.success(`Estabelecimento ${action === 'bloquear' ? 'bloqueado' : 'desbloqueado'} com sucesso!`);
                },
                onError: () => {
                    toast.error('Erro ao alterar status do estabelecimento');
                },
            });
        }
    };

    const handlePlanChange = () => {
        if (selectedPlan === establishment.plan.id.toString()) {
            toast.error('Selecione um plano diferente do atual');
            return;
        }

        if (confirm('Tem certeza que deseja alterar o plano deste estabelecimento?')) {
            router.patch(`/admin/establishments/${establishment.id}/change-plan`, {
                plan_id: selectedPlan,
            }, {
                onSuccess: () => {
                    toast.success('Plano alterado com sucesso!');
                    setChangingPlan(false);
                },
                onError: () => {
                    toast.error('Erro ao alterar plano do estabelecimento');
                    setChangingPlan(false);
                },
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>;
            case 'inactive':
                return <Badge variant="secondary">Inativo</Badge>;
            case 'blocked':
                return <Badge variant="destructive">Bloqueado</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatPrice = (price: number, cycle?: string) => {
        const formatted = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(price);
        
        return cycle ? `${formatted}/${cycle === 'monthly' ? 'mês' : 'ano'}` : formatted;
    };

    const publicUrl = `${window.location.origin}/${establishment.slug}`;

    return (
        <AdminLayout auth={auth}>
            <Head title={`${establishment.name} - Detalhes`} />

            <div className="@container/main flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-4">
                    <Button variant="outline" size="sm" asChild className="w-fit">
                        <Link href="/admin/establishments">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold sm:text-2xl">{establishment.name}</h1>
                                {getStatusBadge(establishment.status)}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground sm:text-base">Visualização detalhada do estabelecimento</p>
                        
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Button variant="outline" size="sm" asChild className="w-fit">
                                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">Ver Página Pública</span>
                                    <span className="sm:hidden">Ver Página</span>
                                </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild className="w-fit">
                                <Link href={`/admin/establishments/${establishment.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                </Link>
                            </Button>
                            <Button
                                variant={establishment.status === 'blocked' ? 'default' : 'destructive'}
                                size="sm"
                                onClick={handleStatusChange}
                                className="w-fit"
                            >
                                {establishment.status === 'blocked' ? (
                                    <>
                                        <Unlock className="mr-2 h-4 w-4" />
                                        <span className="hidden sm:inline">Desbloquear</span>
                                        <span className="sm:hidden">Desbloquear</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock className="mr-2 h-4 w-4" />
                                        <span className="hidden sm:inline">Bloquear</span>
                                        <span className="sm:hidden">Bloquear</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_services}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_appointments}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.pending_appointments} pendentes
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Agendamentos Concluídos</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completed_appointments}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatPrice(stats.total_revenue)}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Informações do Estabelecimento
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                                    <p className="text-sm">{establishment.name}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                                    <p className="text-sm">{establishment.email}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                                    <p className="text-sm">{establishment.phone}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Endereço</Label>
                                    <p className="text-sm">{establishment.address}</p>
                                    <p className="text-sm">{establishment.city}, {establishment.state}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">URL Pública</Label>
                                    <p className="text-sm">/{establishment.slug}</p>
                                </div>
                                {establishment.description && (
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Descrição</Label>
                                        <p className="text-sm">{establishment.description}</p>
                                    </div>
                                )}
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Criado em</Label>
                                    <p className="text-sm">{new Date(establishment.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Plano Atual
                                </CardTitle>
                                <CardDescription>
                                    Gerencie o plano do estabelecimento
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div>
                                        <p className="font-medium">{establishment.plan.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatPrice(establishment.plan.price, establishment.plan.billing_cycle)}
                                        </p>
                                    </div>
                                    <Badge variant="outline">Atual</Badge>
                                </div>

                                {changingPlan ? (
                                    <div className="space-y-3">
                                        <Label htmlFor="plan-select">Alterar para:</Label>
                                        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {plans.map((plan) => (
                                                    <SelectItem key={plan.id} value={plan.id.toString()}>
                                                        {plan.name} - {formatPrice(plan.price, plan.billing_cycle)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex gap-2">
                                            <Button onClick={handlePlanChange} size="sm">
                                                Confirmar Alteração
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setChangingPlan(false);
                                                    setSelectedPlan(establishment.plan.id.toString());
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setChangingPlan(true)}
                                        className="w-full"
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Alterar Plano
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Responsável</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Nome</Label>
                                    <p className="text-sm">{establishment.user.name}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                                    <p className="text-sm">{establishment.user.email}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {establishment.services.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Serviços Oferecidos</CardTitle>
                            <CardDescription>Lista de serviços cadastrados no estabelecimento</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {establishment.services.map((service) => (
                                    <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <p className="font-medium">{service.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatPrice(service.price)} • {service.duration}min
                                            </p>
                                        </div>
                                        <Badge variant={service.is_active ? 'default' : 'secondary'}>
                                            {service.is_active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}