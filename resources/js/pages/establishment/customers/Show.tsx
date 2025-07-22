import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Calendar, Clock, Crown, Edit, FileText, Mail, Phone, Scissors, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Service {
    id: number;
    name: string;
    price: number;
    duration: number;
}

interface Appointment {
    id: number;
    scheduled_at: string;
    status: string;
    service: Service;
    created_at: string;
}

interface Customer {
    id: number;
    name: string;
    last_name: string;
    email: string;
    phone: string;
    birth_date: string;
    notes: string;
    is_blocked: boolean;
    list_type: string;
    created_at: string;
    full_name: string;
}

interface PageProps {
    customer: Customer;
    recentAppointments: Appointment[];
    planFeatures?: string[];
    [key: string]: any;
}

export default function CustomersShow() {
    const { customer, recentAppointments, planFeatures = [] } = usePage<PageProps>().props;

    const getListTypeColor = (type: string) => {
        switch (type) {
            case 'vip':
                return 'bg-yellow-100 text-yellow-800';
            case 'priority':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getListTypeLabel = (type: string) => {
        switch (type) {
            case 'vip':
                return 'VIP';
            case 'priority':
                return 'Prioridade';
            default:
                return 'Regular';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'confirmed':
                return 'bg-blue-100 text-blue-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'completed':
                return 'Finalizado';
            case 'confirmed':
                return 'Confirmado';
            case 'cancelled':
                return 'Cancelado';
            default:
                return 'Pendente';
        }
    };

    return (
        <EstablishmentAppLayout
            title={customer.full_name || `${customer.name} ${customer.last_name || ''}`.trim()}
            breadcrumbs={[
                { title: 'Clientes', href: '/customers' },
                { title: customer.full_name || `${customer.name} ${customer.last_name || ''}`.trim(), href: `/customers/${customer.id}` },
            ]}
            planFeatures={planFeatures}
        >
            <Head title={customer.full_name || `${customer.name} ${customer.last_name || ''}`.trim()} />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/customers">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
                            </Link>
                        </Button>
                        <div>
                            <h1 className="flex items-center gap-2 text-lg font-semibold">
                                {customer.full_name || `${customer.name} ${customer.last_name || ''}`.trim()}
                                <Badge className={getListTypeColor(customer.list_type)}>{getListTypeLabel(customer.list_type)}</Badge>
                                <Badge variant={customer.is_blocked ? 'destructive' : 'default'}>{customer.is_blocked ? 'Bloqueado' : 'Ativo'}</Badge>
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Cliente desde {format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={`/customers/${customer.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Informações do Cliente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Nome:</span>
                                    <span className="text-sm">{customer.full_name || `${customer.name} ${customer.last_name || ''}`.trim()}</span>
                                </div>

                                {customer.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Email:</span>
                                        <span className="text-sm">{customer.email}</span>
                                    </div>
                                )}

                                {customer.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Telefone:</span>
                                        <span className="text-sm">{customer.phone}</span>
                                    </div>
                                )}

                                {customer.birth_date && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Nascimento:</span>
                                        <span className="text-sm">{format(new Date(customer.birth_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Crown className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Tipo:</span>
                                    <Badge className={getListTypeColor(customer.list_type)}>{getListTypeLabel(customer.list_type)}</Badge>
                                </div>
                            </div>

                            {customer.notes && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Observações:</span>
                                        </div>
                                        <p className="pl-6 text-sm text-muted-foreground">{customer.notes}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Appointments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Agendamentos Recentes
                            </CardTitle>
                            <CardDescription>Últimos agendamentos do cliente</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentAppointments.length > 0 ? (
                                <div className="space-y-4">
                                    {recentAppointments.map((appointment) => (
                                        <div key={appointment.id} className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Scissors className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">{appointment.service.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {appointment.scheduled_at
                                                        ? (() => {
                                                              try {
                                                                  return format(new Date(appointment.scheduled_at), "dd/MM/yyyy 'às' HH:mm", {
                                                                      locale: ptBR,
                                                                  });
                                                              } catch (error) {
                                                                  return 'Data inválida';
                                                              }
                                                          })()
                                                        : 'Data não informada'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">R$ {Number(appointment.service.price).toFixed(2)}</div>
                                            </div>
                                            <Badge className={getStatusColor(appointment.status)}>{getStatusLabel(appointment.status)}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-muted-foreground">
                                    <Clock className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                    <p>Nenhum agendamento encontrado</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </EstablishmentAppLayout>
    );
}
