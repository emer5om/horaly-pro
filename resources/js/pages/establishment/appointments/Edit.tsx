import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Calendar, Save, Scissors, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Customer {
    id: number;
    name: string;
    surname?: string;
    phone: string;
    email?: string;
}

interface Service {
    id: number;
    name: string;
    description?: string;
    duration_minutes: number;
    price: number;
    is_active: boolean;
}

interface Appointment {
    id: number;
    scheduled_at: string;
    status: 'pending' | 'confirmed' | 'started' | 'completed' | 'cancelled';
    notes?: string;
    cancellation_reason?: string;
    customer: Customer;
    service: Service;
}

interface EditAppointmentProps {
    appointment: Appointment;
    services: Service[];
    customers: Customer[];
}

export default function EditAppointment({ appointment, services, customers }: EditAppointmentProps) {
    const { data, setData, put, processing, errors } = useForm({
        customer_id: appointment.customer.id.toString(),
        service_id: appointment.service.id.toString(),
        scheduled_at: appointment.scheduled_at.slice(0, 16), // Format for datetime-local input
        notes: appointment.notes || '',
        status: appointment.status,
        cancellation_reason: appointment.cancellation_reason || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/appointments/${appointment.id}`);
    };

    const selectedService = services.find((service) => service.id.toString() === data.service_id);

    return (
        <EstablishmentAppLayout title="Editar Agendamento">
            <Head title="Editar Agendamento" />

            <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={`/appointments/${appointment.id}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Editar Agendamento #{appointment.id}</h1>
                        <p className="text-muted-foreground">Modifique as informações do agendamento</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Client Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Informações do Cliente
                                </CardTitle>
                                <CardDescription>Selecione o cliente para este agendamento</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customer_id">Cliente *</Label>
                                    <Select value={data.customer_id} onValueChange={(value) => setData('customer_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um cliente..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                                    {customer.name} {customer.surname} - {customer.phone}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.customer_id && <p className="text-sm text-red-500">{errors.customer_id}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Service Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scissors className="h-5 w-5" />
                                    Serviço
                                </CardTitle>
                                <CardDescription>Escolha o serviço a ser realizado</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="service_id">Serviço *</Label>
                                    <Select value={data.service_id} onValueChange={(value) => setData('service_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um serviço..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {services.map((service) => (
                                                <SelectItem key={service.id} value={service.id.toString()}>
                                                    {service.name} - {service.duration_minutes}min - R$ {Number(service.price).toFixed(2)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.service_id && <p className="text-sm text-red-500">{errors.service_id}</p>}
                                </div>

                                {selectedService && (
                                    <div className="rounded-lg bg-muted p-3">
                                        <h4 className="font-semibold">{selectedService.name}</h4>
                                        <p className="text-sm text-muted-foreground">Duração: {selectedService.duration_minutes} minutos</p>
                                        <p className="text-sm text-muted-foreground">Preço: R$ {Number(selectedService.price).toFixed(2)}</p>
                                        {selectedService.description && (
                                            <p className="mt-1 text-sm text-muted-foreground">{selectedService.description}</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Appointment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Detalhes do Agendamento
                            </CardTitle>
                            <CardDescription>Configure a data, hora, status e observações</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="scheduled_at">Data e Hora *</Label>
                                    <Input
                                        id="scheduled_at"
                                        type="datetime-local"
                                        value={data.scheduled_at}
                                        onChange={(e) => setData('scheduled_at', e.target.value)}
                                        required
                                    />
                                    {errors.scheduled_at && <p className="text-sm text-red-500">{errors.scheduled_at}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pendente</SelectItem>
                                            <SelectItem value="confirmed">Confirmado</SelectItem>
                                            <SelectItem value="started">Em Atendimento</SelectItem>
                                            <SelectItem value="completed">Concluído</SelectItem>
                                            <SelectItem value="cancelled">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Observações</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Adicione observações sobre o agendamento..."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                />
                                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                            </div>

                            {data.status === 'cancelled' && (
                                <div className="space-y-2">
                                    <Label htmlFor="cancellation_reason">Motivo do Cancelamento *</Label>
                                    <Textarea
                                        id="cancellation_reason"
                                        placeholder="Informe o motivo do cancelamento..."
                                        value={data.cancellation_reason}
                                        onChange={(e) => setData('cancellation_reason', e.target.value)}
                                        rows={2}
                                        required={data.status === 'cancelled'}
                                    />
                                    {errors.cancellation_reason && <p className="text-sm text-red-500">{errors.cancellation_reason}</p>}
                                </div>
                            )}

                            {selectedService && data.scheduled_at && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <h4 className="mb-2 font-semibold text-blue-900">Resumo do Agendamento</h4>
                                    <div className="space-y-1 text-sm text-blue-800">
                                        <p>
                                            <strong>Serviço:</strong> {selectedService.name}
                                        </p>
                                        <p>
                                            <strong>Duração:</strong> {selectedService.duration_minutes} minutos
                                        </p>
                                        <p>
                                            <strong>Data/Hora:</strong> {new Date(data.scheduled_at).toLocaleString('pt-BR')}
                                        </p>
                                        <p>
                                            <strong>Preço:</strong> R$ {Number(selectedService.price).toFixed(2)}
                                        </p>
                                        <p>
                                            <strong>Status:</strong>{' '}
                                            {
                                                {
                                                    pending: 'Pendente',
                                                    confirmed: 'Confirmado',
                                                    started: 'Em Atendimento',
                                                    completed: 'Concluído',
                                                    cancelled: 'Cancelado',
                                                }[data.status]
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button variant="outline" asChild>
                            <Link href={`/appointments/${appointment.id}`}>Cancelar</Link>
                        </Button>
                        <Button type="submit" disabled={processing || !data.customer_id || !data.service_id || !data.scheduled_at}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </form>
            </div>
        </EstablishmentAppLayout>
    );
}
