import { Head, router, useForm } from '@inertiajs/react';
import { Bell, Building, Calendar, Clock, Gift, Plus, Save, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Establishment {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    description: string;
    working_hours: {
        [key: string]: { is_open: boolean; start_time: string; end_time: string };
        monday: { is_open: boolean; start_time: string; end_time: string };
        tuesday: { is_open: boolean; start_time: string; end_time: string };
        wednesday: { is_open: boolean; start_time: string; end_time: string };
        thursday: { is_open: boolean; start_time: string; end_time: string };
        friday: { is_open: boolean; start_time: string; end_time: string };
        saturday: { is_open: boolean; start_time: string; end_time: string };
        sunday: { is_open: boolean; start_time: string; end_time: string };
    };
    slots_per_hour: number;
    allow_rescheduling: boolean;
    allow_cancellation: boolean;
    reschedule_advance_hours: number;
    cancel_advance_hours: number;
    earliest_booking_time: string;
    latest_booking_time: string;
    receive_notifications: boolean;
    notification_settings: Record<string, string | number | boolean>;
    trust_list_active: boolean;
    blacklist_active: boolean;
    trust_list: string[];
    blacklist: string[];
}

interface BlockedDate {
    id: number;
    blocked_date: string;
    reason: string;
    is_recurring: boolean;
}

interface BlockedTime {
    id: number;
    blocked_date: string;
    start_time: string;
    end_time: string;
    reason: string;
}

interface Coupon {
    id: number;
    code: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    usage_limit: number;
    used_count: number;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
}

interface CompanyPageProps {
    establishment: Establishment;
    blockedDates: BlockedDate[];
    blockedTimes: BlockedTime[];
    coupons: Coupon[];
    activeTab?: string;
    planFeatures?: string[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function CompanyPage({ establishment, blockedDates, blockedTimes, coupons, activeTab = 'data', planFeatures = [], flash }: CompanyPageProps) {
    const [deleteItem, setDeleteItem] = useState<{ type: string; id: number } | null>(null);
    const [currentTab, setCurrentTab] = useState(activeTab);

    // Formulário para dados da empresa
    const companyForm = useForm({
        name: establishment.name || '',
        email: establishment.email || '',
        phone: establishment.phone || '',
        address: establishment.address || '',
        description: establishment.description || '',
    });

    // Formulário para horários de funcionamento
    const defaultWorkingHours: {
        [key: string]: { is_open: boolean; start_time: string; end_time: string };
        monday: { is_open: boolean; start_time: string; end_time: string };
        tuesday: { is_open: boolean; start_time: string; end_time: string };
        wednesday: { is_open: boolean; start_time: string; end_time: string };
        thursday: { is_open: boolean; start_time: string; end_time: string };
        friday: { is_open: boolean; start_time: string; end_time: string };
        saturday: { is_open: boolean; start_time: string; end_time: string };
        sunday: { is_open: boolean; start_time: string; end_time: string };
    } = {
        monday: { is_open: false, start_time: '09:00', end_time: '18:00' },
        tuesday: { is_open: false, start_time: '09:00', end_time: '18:00' },
        wednesday: { is_open: false, start_time: '09:00', end_time: '18:00' },
        thursday: { is_open: false, start_time: '09:00', end_time: '18:00' },
        friday: { is_open: false, start_time: '09:00', end_time: '18:00' },
        saturday: { is_open: false, start_time: '09:00', end_time: '18:00' },
        sunday: { is_open: false, start_time: '09:00', end_time: '18:00' },
    };

    const workingHoursForm = useForm({
        working_hours: establishment.working_hours
            ? {
                  monday: { ...defaultWorkingHours.monday, ...establishment.working_hours.monday },
                  tuesday: { ...defaultWorkingHours.tuesday, ...establishment.working_hours.tuesday },
                  wednesday: { ...defaultWorkingHours.wednesday, ...establishment.working_hours.wednesday },
                  thursday: { ...defaultWorkingHours.thursday, ...establishment.working_hours.thursday },
                  friday: { ...defaultWorkingHours.friday, ...establishment.working_hours.friday },
                  saturday: { ...defaultWorkingHours.saturday, ...establishment.working_hours.saturday },
                  sunday: { ...defaultWorkingHours.sunday, ...establishment.working_hours.sunday },
              }
            : defaultWorkingHours,
    });

    // Formulário para configurações de agendamento
    const bookingForm = useForm({
        slots_per_hour: establishment.slots_per_hour || 1,
        allow_rescheduling: establishment.allow_rescheduling || false,
        allow_cancellation: establishment.allow_cancellation || false,
        reschedule_advance_hours: establishment.reschedule_advance_hours || 24,
        cancel_advance_hours: establishment.cancel_advance_hours || 24,
        earliest_booking_time: establishment.earliest_booking_time || 'same_day',
        latest_booking_time: establishment.latest_booking_time || 'no_limit',
    });

    // Formulário para bloquear data
    const blockedDateForm = useForm({
        blocked_date: '',
        reason: '',
        is_recurring: false as boolean,
    });

    // Formulário para bloquear horário
    const blockedTimeForm = useForm({
        blocked_date: '',
        start_time: '',
        end_time: '',
        reason: '',
    });

    // Formulário para cupons
    const couponForm = useForm({
        code: '',
        name: '',
        type: 'percentage' as 'percentage' | 'fixed',
        value: 0,
        usage_limit: null as number | null,
        valid_from: '',
        valid_until: '',
        is_active: true as boolean,
    });

    // Estado para edição de cupons
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    // Formulário para notificações
    const notificationForm = useForm({
        receive_notifications: establishment.receive_notifications || false,
        notification_settings: establishment.notification_settings || {},
    });

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        setCurrentTab(activeTab);
    }, [activeTab]);

    const handleCompanySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        companyForm.patch('/company/data', {
            onSuccess: () => {
                toast.success('Dados da empresa atualizados com sucesso!');
            },
            onError: () => {
                toast.error('Erro ao atualizar dados da empresa');
            }
        });
    };

    const handleWorkingHoursSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        workingHoursForm.patch('/company/working-hours', {
            onSuccess: () => {
                toast.success('Horários de funcionamento atualizados com sucesso!');
            },
            onError: () => {
                toast.error('Erro ao atualizar horários de funcionamento');
            }
        });
    };

    const handleBookingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        bookingForm.patch('/company/booking-settings', {
            onSuccess: () => {
                toast.success('Configurações de agendamento atualizadas com sucesso!');
            },
            onError: () => {
                toast.error('Erro ao atualizar configurações de agendamento');
            }
        });
    };

    const handleBlockedDateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        blockedDateForm.post('/company/blocked-dates', {
            onSuccess: () => {
                blockedDateForm.reset();
                toast.success('Data bloqueada com sucesso!');
            },
            onError: () => {
                toast.error('Erro ao bloquear data');
            }
        });
    };

    const handleBlockedTimeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        blockedTimeForm.post('/company/blocked-times', {
            onSuccess: () => {
                blockedTimeForm.reset();
                toast.success('Horário bloqueado com sucesso!');
            },
            onError: () => {
                toast.error('Erro ao bloquear horário');
            }
        });
    };

    const handleCouponSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCoupon) {
            couponForm.patch(`/company/coupons/${editingCoupon.id}`, {
                onSuccess: () => {
                    couponForm.reset();
                    setEditingCoupon(null);
                    toast.success('Cupom atualizado com sucesso!');
                },
                onError: () => {
                    toast.error('Erro ao atualizar cupom');
                }
            });
        } else {
            couponForm.post('/company/coupons', {
                onSuccess: () => {
                    couponForm.reset();
                    toast.success('Cupom criado com sucesso!');
                },
                onError: () => {
                    toast.error('Erro ao criar cupom');
                }
            });
        }
    };

    const startEditingCoupon = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        couponForm.setData({
            code: coupon.code,
            name: coupon.name,
            type: coupon.type,
            value: coupon.value,
            usage_limit: coupon.usage_limit,
            valid_from: coupon.valid_from,
            valid_until: coupon.valid_until,
            is_active: coupon.is_active,
        });
    };

    const cancelEditingCoupon = () => {
        setEditingCoupon(null);
        couponForm.reset();
        couponForm.setData({
            code: '',
            name: '',
            type: 'percentage',
            value: 0,
            usage_limit: null,
            valid_from: '',
            valid_until: '',
            is_active: true,
        });
    };

    const handleDelete = () => {
        if (!deleteItem) return;

        const { type, id } = deleteItem;
        const routes = {
            'blocked-date': `/company/blocked-dates/${id}`,
            'blocked-time': `/company/blocked-times/${id}`,
            coupon: `/company/coupons/${id}`,
        };

        router.delete(routes[type as keyof typeof routes], {
            onSuccess: () => {
                setDeleteItem(null);
                const messages = {
                    'blocked-date': 'Data desbloqueada com sucesso!',
                    'blocked-time': 'Horário desbloqueado com sucesso!',
                    coupon: 'Cupom excluído com sucesso!',
                };
                toast.success(messages[type as keyof typeof messages]);
            },
            onError: () => {
                const messages = {
                    'blocked-date': 'Erro ao desbloquear data',
                    'blocked-time': 'Erro ao desbloquear horário',
                    coupon: 'Erro ao excluir cupom',
                };
                toast.error(messages[type as keyof typeof messages]);
            }
        });
    };

    const dayNames = {
        monday: 'Segunda-feira',
        tuesday: 'Terça-feira',
        wednesday: 'Quarta-feira',
        thursday: 'Quinta-feira',
        friday: 'Sexta-feira',
        saturday: 'Sábado',
        sunday: 'Domingo',
    };

    return (
        <EstablishmentAppLayout title="Minha Empresa" planFeatures={planFeatures}>
            <Head title="Minha Empresa" />

            <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Minha Empresa</h1>
                        <p className="text-muted-foreground">Configure sua empresa e personalize seu atendimento</p>
                    </div>
                </div>

                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 md:grid-cols-6">
                        <TabsTrigger value="data" className="px-2 py-2 text-xs md:text-sm">
                            Dados
                        </TabsTrigger>
                        <TabsTrigger value="hours" className="px-2 py-2 text-xs md:text-sm">
                            Horários
                        </TabsTrigger>
                        <TabsTrigger value="booking" className="px-2 py-2 text-xs md:text-sm">
                            Agendamento
                        </TabsTrigger>
                        <TabsTrigger value="blocks" className="px-2 py-2 text-xs md:text-sm">
                            Bloqueios
                        </TabsTrigger>
                        <TabsTrigger value="coupons" className="px-2 py-2 text-xs md:text-sm">
                            Cupons
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="px-2 py-2 text-xs md:text-sm">
                            Notificações
                        </TabsTrigger>
                    </TabsList>

                    {/* Dados da Empresa */}
                    <TabsContent value="data">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building className="h-5 w-5" />
                                    Dados da Empresa
                                </CardTitle>
                                <CardDescription>Informações básicas do seu estabelecimento</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCompanySubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome da Empresa</Label>
                                            <Input
                                                id="name"
                                                value={companyForm.data.name}
                                                onChange={(e) => companyForm.setData('name', e.target.value)}
                                                required
                                            />
                                            {companyForm.errors.name && <p className="text-sm text-red-500">{companyForm.errors.name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={companyForm.data.email}
                                                onChange={(e) => companyForm.setData('email', e.target.value)}
                                                required
                                            />
                                            {companyForm.errors.email && <p className="text-sm text-red-500">{companyForm.errors.email}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefone</Label>
                                            <Input
                                                id="phone"
                                                value={companyForm.data.phone}
                                                onChange={(e) => companyForm.setData('phone', e.target.value)}
                                                required
                                            />
                                            {companyForm.errors.phone && <p className="text-sm text-red-500">{companyForm.errors.phone}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="address">Endereço</Label>
                                            <Input
                                                id="address"
                                                value={companyForm.data.address}
                                                onChange={(e) => companyForm.setData('address', e.target.value)}
                                            />
                                            {companyForm.errors.address && <p className="text-sm text-red-500">{companyForm.errors.address}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Descrição</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Descreva sua empresa..."
                                            value={companyForm.data.description}
                                            onChange={(e) => companyForm.setData('description', e.target.value)}
                                        />
                                        {companyForm.errors.description && <p className="text-sm text-red-500">{companyForm.errors.description}</p>}
                                    </div>

                                    <Button type="submit" disabled={companyForm.processing}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {companyForm.processing ? 'Salvando...' : 'Salvar Dados'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Horários de Funcionamento */}
                    <TabsContent value="hours">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Horários de Funcionamento
                                </CardTitle>
                                <CardDescription>Configure os dias e horários de atendimento</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleWorkingHoursSubmit} className="space-y-4">
                                    {Object.entries(dayNames).map(([day, dayLabel]) => (
                                        <div key={day} className="flex items-center gap-4 rounded-lg border p-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={day}
                                                    checked={workingHoursForm.data.working_hours[day]?.is_open || false}
                                                    onCheckedChange={(checked) => {
                                                        workingHoursForm.setData('working_hours', {
                                                            ...workingHoursForm.data.working_hours,
                                                            [day]: {
                                                                ...workingHoursForm.data.working_hours[day],
                                                                is_open: Boolean(checked),
                                                            },
                                                        });
                                                    }}
                                                />
                                                <Label htmlFor={day} className="min-w-[120px]">
                                                    {dayLabel}
                                                </Label>
                                            </div>

                                            {workingHoursForm.data.working_hours[day]?.is_open && (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="time"
                                                        value={workingHoursForm.data.working_hours[day]?.start_time || '09:00'}
                                                        onChange={(e) => {
                                                            workingHoursForm.setData('working_hours', {
                                                                ...workingHoursForm.data.working_hours,
                                                                [day]: {
                                                                    ...workingHoursForm.data.working_hours[day],
                                                                    start_time: e.target.value,
                                                                },
                                                            });
                                                        }}
                                                        className="w-24"
                                                    />
                                                    <span>às</span>
                                                    <Input
                                                        type="time"
                                                        value={workingHoursForm.data.working_hours[day]?.end_time || '18:00'}
                                                        onChange={(e) => {
                                                            workingHoursForm.setData('working_hours', {
                                                                ...workingHoursForm.data.working_hours,
                                                                [day]: {
                                                                    ...workingHoursForm.data.working_hours[day],
                                                                    end_time: e.target.value,
                                                                },
                                                            });
                                                        }}
                                                        className="w-24"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    <Button type="submit" disabled={workingHoursForm.processing}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {workingHoursForm.processing ? 'Salvando...' : 'Salvar Horários'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Configurações de Agendamento */}
                    <TabsContent value="booking">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Configurações de Agendamento
                                </CardTitle>
                                <CardDescription>Configure como funcionam os agendamentos</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleBookingSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="slots_per_hour">Limite de vagas por horário</Label>
                                        <Select
                                            value={bookingForm.data.slots_per_hour.toString()}
                                            onValueChange={(value) => bookingForm.setData('slots_per_hour', parseInt(value))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                                    <SelectItem key={num} value={num.toString()}>
                                                        {num} {num === 1 ? 'vaga' : 'vagas'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground">Quantos clientes podem agendar no mesmo horário</p>
                                    </div>

                                    {/* Configurações de Antecedência para Agendamentos */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="earliest_booking_time">Agendamento mais próximo</Label>
                                            <Select
                                                value={bookingForm.data.earliest_booking_time}
                                                onValueChange={(value) => bookingForm.setData('earliest_booking_time', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Clique para abrir" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="same_day">Permitir agendamento no mesmo dia</SelectItem>
                                                    <SelectItem value="+1 day">1 dia à frente</SelectItem>
                                                    <SelectItem value="+2 days">2 dias à frente</SelectItem>
                                                    <SelectItem value="+3 days">3 dias à frente</SelectItem>
                                                    <SelectItem value="+7 days">7 dias à frente</SelectItem>
                                                    <SelectItem value="+1 month">1 mês à frente</SelectItem>
                                                    <SelectItem value="next_week">Próxima semana</SelectItem>
                                                    <SelectItem value="next_month">Próximo mês</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-sm text-muted-foreground">
                                                Define com qual antecedência mínima os clientes podem fazer agendamentos
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="latest_booking_time">Agendamento mais distante</Label>
                                            <Select
                                                value={bookingForm.data.latest_booking_time}
                                                onValueChange={(value) => bookingForm.setData('latest_booking_time', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Clique para abrir" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="no_limit">Sem limite</SelectItem>
                                                    <SelectItem value="+1 week">1 semana à frente</SelectItem>
                                                    <SelectItem value="+2 weeks">2 semanas à frente</SelectItem>
                                                    <SelectItem value="+1 month">1 mês à frente</SelectItem>
                                                    <SelectItem value="+2 months">2 meses à frente</SelectItem>
                                                    <SelectItem value="+3 months">3 meses à frente</SelectItem>
                                                    <SelectItem value="+6 months">6 meses à frente</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-sm text-muted-foreground">
                                                Define até quando no futuro os clientes podem agendar
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <Separator />

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="allow_rescheduling">Permitir Reagendamento</Label>
                                                <p className="text-sm text-muted-foreground">Clientes podem remarcar seus agendamentos</p>
                                            </div>
                                            <Switch
                                                id="allow_rescheduling"
                                                checked={bookingForm.data.allow_rescheduling}
                                                onCheckedChange={(checked) => bookingForm.setData('allow_rescheduling', checked)}
                                            />
                                        </div>

                                        {bookingForm.data.allow_rescheduling && (
                                            <div className="ml-4 space-y-2">
                                                <Label htmlFor="reschedule_advance_hours">Antecedência mínima (horas)</Label>
                                                <Input
                                                    id="reschedule_advance_hours"
                                                    type="number"
                                                    min="1"
                                                    max="168"
                                                    value={bookingForm.data.reschedule_advance_hours}
                                                    onChange={(e) => bookingForm.setData('reschedule_advance_hours', parseInt(e.target.value) || 24)}
                                                    className="w-32"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label htmlFor="allow_cancellation">Permitir Cancelamento</Label>
                                                <p className="text-sm text-muted-foreground">Clientes podem cancelar seus agendamentos</p>
                                            </div>
                                            <Switch
                                                id="allow_cancellation"
                                                checked={bookingForm.data.allow_cancellation}
                                                onCheckedChange={(checked) => bookingForm.setData('allow_cancellation', checked)}
                                            />
                                        </div>

                                        {bookingForm.data.allow_cancellation && (
                                            <div className="ml-4 space-y-2">
                                                <Label htmlFor="cancel_advance_hours">Antecedência mínima (horas)</Label>
                                                <Input
                                                    id="cancel_advance_hours"
                                                    type="number"
                                                    min="1"
                                                    max="168"
                                                    value={bookingForm.data.cancel_advance_hours}
                                                    onChange={(e) => bookingForm.setData('cancel_advance_hours', parseInt(e.target.value) || 24)}
                                                    className="w-32"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <Button type="submit" disabled={bookingForm.processing}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {bookingForm.processing ? 'Salvando...' : 'Salvar Configurações'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Bloqueios */}
                    <TabsContent value="blocks">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Bloquear Dias */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Bloquear Dias
                                    </CardTitle>
                                    <CardDescription>Bloqueie dias específicos ou feriados anuais</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <form onSubmit={handleBlockedDateSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="blocked_date">Data</Label>
                                            <Input
                                                id="blocked_date"
                                                type="date"
                                                value={blockedDateForm.data.blocked_date}
                                                onChange={(e) => blockedDateForm.setData('blocked_date', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="reason">Motivo</Label>
                                            <Input
                                                id="reason"
                                                placeholder="Ex: Feriado, Férias..."
                                                value={blockedDateForm.data.reason}
                                                onChange={(e) => blockedDateForm.setData('reason', e.target.value)}
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="is_recurring"
                                                checked={blockedDateForm.data.is_recurring}
                                                onCheckedChange={(checked) => blockedDateForm.setData('is_recurring', checked as boolean)}
                                            />
                                            <Label htmlFor="is_recurring">Data recorrente (repete anualmente)</Label>
                                        </div>

                                        <Button type="submit" disabled={blockedDateForm.processing}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Bloquear Data
                                        </Button>
                                    </form>

                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Datas Bloqueadas</h4>
                                        {blockedDates.length > 0 ? (
                                            <div className="space-y-2">
                                                {blockedDates.map((blocked) => (
                                                    <div key={blocked.id} className="flex items-center justify-between rounded border p-2">
                                                        <div>
                                                            <span className="font-medium">
                                                                {new Date(blocked.blocked_date).toLocaleDateString('pt-BR')}
                                                            </span>
                                                            {blocked.reason && (
                                                                <span className="ml-2 text-sm text-muted-foreground">- {blocked.reason}</span>
                                                            )}
                                                            {blocked.is_recurring && (
                                                                <Badge variant="secondary" className="ml-2 text-xs">
                                                                    Anual
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setDeleteItem({ type: 'blocked-date', id: blocked.id })}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Nenhuma data bloqueada</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Bloquear Horários */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Bloquear Horários
                                    </CardTitle>
                                    <CardDescription>Bloqueie horários específicos em determinadas datas</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <form onSubmit={handleBlockedTimeSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="blocked_time_date">Data</Label>
                                            <Input
                                                id="blocked_time_date"
                                                type="date"
                                                value={blockedTimeForm.data.blocked_date}
                                                onChange={(e) => blockedTimeForm.setData('blocked_date', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="start_time">Início</Label>
                                                <Input
                                                    id="start_time"
                                                    type="time"
                                                    value={blockedTimeForm.data.start_time}
                                                    onChange={(e) => blockedTimeForm.setData('start_time', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="end_time">Fim</Label>
                                                <Input
                                                    id="end_time"
                                                    type="time"
                                                    value={blockedTimeForm.data.end_time}
                                                    onChange={(e) => blockedTimeForm.setData('end_time', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="time_reason">Motivo</Label>
                                            <Input
                                                id="time_reason"
                                                placeholder="Ex: Reunião, Almoço..."
                                                value={blockedTimeForm.data.reason}
                                                onChange={(e) => blockedTimeForm.setData('reason', e.target.value)}
                                            />
                                        </div>

                                        <Button type="submit" disabled={blockedTimeForm.processing}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Bloquear Horário
                                        </Button>
                                    </form>

                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Horários Bloqueados</h4>
                                        {blockedTimes.length > 0 ? (
                                            <div className="space-y-2">
                                                {blockedTimes.map((blocked) => (
                                                    <div key={blocked.id} className="flex items-center justify-between rounded border p-2">
                                                        <div>
                                                            <span className="font-medium">
                                                                {new Date(blocked.blocked_date).toLocaleDateString('pt-BR')}
                                                            </span>
                                                            <span className="ml-2 text-sm text-muted-foreground">
                                                                {blocked.start_time} - {blocked.end_time}
                                                            </span>
                                                            {blocked.reason && (
                                                                <span className="ml-2 text-sm text-muted-foreground">- {blocked.reason}</span>
                                                            )}
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setDeleteItem({ type: 'blocked-time', id: blocked.id })}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Nenhum horário bloqueado</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Cupons */}
                    <TabsContent value="coupons">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Gift className="h-5 w-5" />
                                        {editingCoupon ? 'Editar Cupom' : 'Criar Cupom'}
                                    </CardTitle>
                                    <CardDescription>
                                        {editingCoupon ? 'Edite as informações do cupom' : 'Gere cupons de desconto para seus clientes'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCouponSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="coupon_code">Código do Cupom</Label>
                                            <Input
                                                id="coupon_code"
                                                placeholder="Ex: DESCONTO20 (deixe vazio para gerar automaticamente)"
                                                value={couponForm.data.code}
                                                onChange={(e) => couponForm.setData('code', e.target.value.toUpperCase())}
                                                maxLength={20}
                                            />
                                            {couponForm.errors.code && <p className="text-sm text-red-500">{couponForm.errors.code}</p>}
                                            <p className="text-xs text-muted-foreground">Se deixado vazio, um código será gerado automaticamente</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="coupon_name">Nome do Cupom</Label>
                                            <Input
                                                id="coupon_name"
                                                placeholder="Ex: Desconto de Verão"
                                                value={couponForm.data.name}
                                                onChange={(e) => couponForm.setData('name', e.target.value)}
                                                required
                                            />
                                            {couponForm.errors.name && <p className="text-sm text-red-500">{couponForm.errors.name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="coupon_type">Tipo de Desconto</Label>
                                            <Select
                                                value={couponForm.data.type}
                                                onValueChange={(value) => couponForm.setData('type', value as 'percentage' | 'fixed')}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                                                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="coupon_value">Valor ({couponForm.data.type === 'percentage' ? '%' : 'R$'})</Label>
                                            <Input
                                                id="coupon_value"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={couponForm.data.value}
                                                onChange={(e) => couponForm.setData('value', parseFloat(e.target.value) || 0)}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="usage_limit">Limite de Uso (opcional)</Label>
                                            <Input
                                                id="usage_limit"
                                                type="number"
                                                min="1"
                                                value={couponForm.data.usage_limit || ''}
                                                onChange={(e) => couponForm.setData('usage_limit', e.target.value ? parseInt(e.target.value) : null)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="valid_from">Válido de</Label>
                                                <Input
                                                    id="valid_from"
                                                    type="date"
                                                    value={couponForm.data.valid_from}
                                                    onChange={(e) => couponForm.setData('valid_from', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="valid_until">Válido até</Label>
                                                <Input
                                                    id="valid_until"
                                                    type="date"
                                                    value={couponForm.data.valid_until}
                                                    onChange={(e) => couponForm.setData('valid_until', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {editingCoupon && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="coupon_active">Status do Cupom</Label>
                                                    <Switch
                                                        id="coupon_active"
                                                        checked={couponForm.data.is_active ?? editingCoupon.is_active}
                                                        onCheckedChange={(checked) => couponForm.setData('is_active', checked)}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Cupom {(couponForm.data.is_active ?? editingCoupon.is_active) ? 'ativo' : 'inativo'}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            {editingCoupon && (
                                                <Button type="button" variant="outline" onClick={cancelEditingCoupon} className="flex-1">
                                                    Cancelar
                                                </Button>
                                            )}
                                            <Button type="submit" disabled={couponForm.processing} className="flex-1">
                                                {editingCoupon ? (
                                                    <>
                                                        <Save className="mr-2 h-4 w-4" />
                                                        {couponForm.processing ? 'Salvando...' : 'Salvar'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        {couponForm.processing ? 'Criando...' : 'Criar Cupom'}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Cupons Criados</CardTitle>
                                    <CardDescription>Gerencie seus cupons de desconto</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {coupons.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Código</TableHead>
                                                    <TableHead>Nome</TableHead>
                                                    <TableHead>Desconto</TableHead>
                                                    <TableHead>Uso</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {coupons.map((coupon) => (
                                                    <TableRow key={coupon.id}>
                                                        <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                                                        <TableCell>{coupon.name}</TableCell>
                                                        <TableCell>
                                                            {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${Number(coupon.value).toFixed(2)}`}
                                                        </TableCell>
                                                        <TableCell>
                                                            {coupon.used_count}
                                                            {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                                                                {coupon.is_active ? 'Ativo' : 'Inativo'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button size="sm" variant="outline" onClick={() => startEditingCoupon(coupon)}>
                                                                    <Settings className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setDeleteItem({ type: 'coupon', id: coupon.id })}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <p className="py-8 text-center text-muted-foreground">Nenhum cupom criado ainda</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Notificações */}
                    <TabsContent value="notifications">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Configurações de Notificações
                                </CardTitle>
                                <CardDescription>Configure como você deseja receber notificações dos agendamentos</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="receive_notifications">Receber Notificações</Label>
                                        <p className="text-sm text-muted-foreground">Ative para receber notificações sobre agendamentos</p>
                                    </div>
                                    <Switch
                                        id="receive_notifications"
                                        checked={notificationForm.data.receive_notifications}
                                        onCheckedChange={(checked) => notificationForm.setData('receive_notifications', Boolean(checked))}
                                    />
                                </div>

                                {notificationForm.data.receive_notifications && (
                                    <div className="space-y-4 rounded-lg border p-4">
                                        <h4 className="font-semibold">Tipos de Notificação</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Você receberá notificações com títulos emocionais personalizados:
                                        </p>

                                        <div className="space-y-3">
                                            <div className="rounded border border-green-200 bg-green-50 p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                                    <span className="font-medium text-green-800">Agendamento Confirmado</span>
                                                </div>
                                                <p className="mt-1 text-sm text-green-600">
                                                    "🎉 Maravilha! {'{nome do cliente}'} confirmou seu agendamento"
                                                </p>
                                            </div>

                                            <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                                                    <span className="font-medium text-yellow-800">Agendamento Pendente</span>
                                                </div>
                                                <p className="mt-1 text-sm text-yellow-600">
                                                    "⏰ Atenção! Novo agendamento de {'{nome do cliente}'} aguardando confirmação"
                                                </p>
                                            </div>

                                            <div className="rounded border border-red-200 bg-red-50 p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                                    <span className="font-medium text-red-800">Agendamento Cancelado</span>
                                                </div>
                                                <p className="mt-1 text-sm text-red-600">
                                                    "😔 Que pena! {'{nome do cliente}'} cancelou seu agendamento"
                                                </p>
                                            </div>

                                            <div className="rounded border border-blue-200 bg-blue-50 p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                    <span className="font-medium text-blue-800">Agendamento Remarcado</span>
                                                </div>
                                                <p className="mt-1 text-sm text-blue-600">"🔄 Opa! {'{nome do cliente}'} remarcou seu agendamento"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <Button 
                                    onClick={() => notificationForm.patch('/company/notifications', {
                                        onSuccess: () => {
                                            toast.success('Configurações de notificação atualizadas com sucesso!');
                                        },
                                        onError: () => {
                                            toast.error('Erro ao atualizar configurações de notificação');
                                        }
                                    })} 
                                    disabled={notificationForm.processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {notificationForm.processing ? 'Salvando...' : 'Salvar Configurações'}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteItem !== null} onOpenChange={() => setDeleteItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </EstablishmentAppLayout>
    );
}
