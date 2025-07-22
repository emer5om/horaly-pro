import { Head, useForm, usePage } from '@inertiajs/react';
import { Building, Calendar, Check, Clock, CreditCard, ExternalLink, LoaderCircle, Palette, Save, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Establishment {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    slug: string;
    booking_slug: string;
    description: string;
    slogan: string;
    theme: string;
    colors: any;
    working_hours: any;
    allow_rescheduling: boolean;
    allow_cancellation: boolean;
    reschedule_advance_hours: number;
    cancel_advance_hours: number;
    slots_per_hour: number;
    charge_fee: boolean;
    fee_type: string;
    fee_amount: number;
    mercadopago_credentials: any;
    whatsapp_instance_id: string;
    facebook_pixel_id: string;
    google_analytics_id: string;
    google_tag_id: string;
}

interface PageProps {
    establishment: Establishment;
    flash?: {
        success?: string;
        error?: string;
    };
    planFeatures?: string[];
    [key: string]: any;
}

export default function EstablishmentSettings() {
    const { establishment, flash, planFeatures = [] } = usePage<PageProps>().props;
    const [activeTab, setActiveTab] = useState('general');
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [checkingSlug, setCheckingSlug] = useState(false);

    // General settings form
    const generalForm = useForm({
        name: establishment.name || '',
        email: establishment.email || '',
        phone: establishment.phone || '',
        address: establishment.address || '',
        booking_slug: establishment.booking_slug || '',
        description: establishment.description || '',
        slogan: establishment.slogan || '',
    });

    // Appearance settings form
    const appearanceForm = useForm({
        theme: establishment.theme || 'default',
        colors: establishment.colors || {
            primary: '#0ea5e9',
            secondary: '#64748b',
            accent: '#f59e0b',
        },
    });

    // Working hours form
    const workingHoursForm = useForm({
        working_hours: establishment.working_hours || [
            { day: 'monday', enabled: true, start_time: '09:00', end_time: '18:00' },
            { day: 'tuesday', enabled: true, start_time: '09:00', end_time: '18:00' },
            { day: 'wednesday', enabled: true, start_time: '09:00', end_time: '18:00' },
            { day: 'thursday', enabled: true, start_time: '09:00', end_time: '18:00' },
            { day: 'friday', enabled: true, start_time: '09:00', end_time: '18:00' },
            { day: 'saturday', enabled: false, start_time: '09:00', end_time: '16:00' },
            { day: 'sunday', enabled: false, start_time: '09:00', end_time: '16:00' },
        ],
    });

    // Booking settings form
    const bookingForm = useForm({
        allow_rescheduling: establishment.allow_rescheduling || false,
        allow_cancellation: establishment.allow_cancellation || false,
        reschedule_advance_hours: establishment.reschedule_advance_hours || 24,
        cancel_advance_hours: establishment.cancel_advance_hours || 24,
        slots_per_hour: establishment.slots_per_hour || 1,
    });

    // Payment settings form
    const paymentForm = useForm({
        charge_fee: establishment.charge_fee || false,
        fee_type: establishment.fee_type || 'fixed',
        fee_amount: establishment.fee_amount || 0,
        mercadopago_credentials: establishment.mercadopago_credentials || {
            access_token: '',
            public_key: '',
        },
    });

    // Integrations form
    const integrationsForm = useForm({
        whatsapp_instance_id: establishment.whatsapp_instance_id || '',
        facebook_pixel_id: establishment.facebook_pixel_id || '',
        google_analytics_id: establishment.google_analytics_id || '',
        google_tag_id: establishment.google_tag_id || '',
    });

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const checkSlugAvailability = async (slug: string) => {
        if (slug === establishment.booking_slug) {
            setSlugAvailable(true);
            return;
        }

        setCheckingSlug(true);
        try {
            const response = await fetch('/settings/check-slug', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ booking_slug: slug }),
            });
            const data = await response.json();
            setSlugAvailable(data.available);
        } catch (error) {
            console.error('Error checking slug:', error);
        } finally {
            setCheckingSlug(false);
        }
    };

    const handleSlugChange = (slug: string) => {
        generalForm.setData('booking_slug', slug);
        if (slug.length > 2) {
            checkSlugAvailability(slug);
        } else {
            setSlugAvailable(null);
        }
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

    const publicUrl = `${window.location.origin}/${generalForm.data.booking_slug}`;

    return (
        <EstablishmentAppLayout title="Configurações" planFeatures={planFeatures}>
            <Head title="Configurações" />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">Configurações</h1>
                        <p className="text-sm text-muted-foreground">Gerencie as configurações do seu estabelecimento</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">Link público: {publicUrl}</Badge>
                        <Button variant="outline" size="sm" asChild>
                            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Visualizar
                            </a>
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Geral
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Aparência
                        </TabsTrigger>
                        <TabsTrigger value="working-hours" className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Horários
                        </TabsTrigger>
                        <TabsTrigger value="booking" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Agendamento
                        </TabsTrigger>
                        <TabsTrigger value="payment" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Pagamento
                        </TabsTrigger>
                        <TabsTrigger value="integrations" className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            Integrações
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações Gerais</CardTitle>
                                <CardDescription>Configure as informações básicas do seu estabelecimento</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        generalForm.put('/settings/general');
                                    }}
                                    className="space-y-4"
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome do Estabelecimento *</Label>
                                            <Input
                                                id="name"
                                                value={generalForm.data.name}
                                                onChange={(e) => generalForm.setData('name', e.target.value)}
                                                placeholder="Nome do seu estabelecimento"
                                                required
                                            />
                                            {generalForm.errors.name && (
                                                <Alert variant="destructive">
                                                    <AlertDescription>{generalForm.errors.name}</AlertDescription>
                                                </Alert>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={generalForm.data.email}
                                                onChange={(e) => generalForm.setData('email', e.target.value)}
                                                placeholder="email@exemplo.com"
                                                required
                                            />
                                            {generalForm.errors.email && (
                                                <Alert variant="destructive">
                                                    <AlertDescription>{generalForm.errors.email}</AlertDescription>
                                                </Alert>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefone *</Label>
                                            <Input
                                                id="phone"
                                                value={generalForm.data.phone}
                                                onChange={(e) => generalForm.setData('phone', e.target.value)}
                                                placeholder="(11) 99999-9999"
                                                required
                                            />
                                            {generalForm.errors.phone && (
                                                <Alert variant="destructive">
                                                    <AlertDescription>{generalForm.errors.phone}</AlertDescription>
                                                </Alert>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="booking_slug">Slug (URL personalizada) *</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="booking_slug"
                                                    value={generalForm.data.booking_slug}
                                                    onChange={(e) => handleSlugChange(e.target.value)}
                                                    placeholder="meu-estabelecimento"
                                                    required
                                                />
                                                {checkingSlug && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                                {slugAvailable === true && <Check className="h-4 w-4 text-green-500" />}
                                                {slugAvailable === false && <X className="h-4 w-4 text-red-500" />}
                                            </div>
                                            {slugAvailable === false && (
                                                <Alert variant="destructive">
                                                    <AlertDescription>Este slug já está em uso</AlertDescription>
                                                </Alert>
                                            )}
                                            {generalForm.errors.booking_slug && (
                                                <Alert variant="destructive">
                                                    <AlertDescription>{generalForm.errors.booking_slug}</AlertDescription>
                                                </Alert>
                                            )}
                                            <p className="text-sm text-muted-foreground">
                                                Seu link será: {window.location.origin}/{generalForm.data.booking_slug}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Endereço *</Label>
                                        <Textarea
                                            id="address"
                                            value={generalForm.data.address}
                                            onChange={(e) => generalForm.setData('address', e.target.value)}
                                            placeholder="Endereço completo do estabelecimento"
                                            required
                                        />
                                        {generalForm.errors.address && (
                                            <Alert variant="destructive">
                                                <AlertDescription>{generalForm.errors.address}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slogan">Slogan</Label>
                                        <Input
                                            id="slogan"
                                            value={generalForm.data.slogan}
                                            onChange={(e) => generalForm.setData('slogan', e.target.value)}
                                            placeholder="Slogan do seu estabelecimento"
                                        />
                                        {generalForm.errors.slogan && (
                                            <Alert variant="destructive">
                                                <AlertDescription>{generalForm.errors.slogan}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Descrição</Label>
                                        <Textarea
                                            id="description"
                                            value={generalForm.data.description}
                                            onChange={(e) => generalForm.setData('description', e.target.value)}
                                            placeholder="Descrição detalhada do seu estabelecimento"
                                            rows={4}
                                        />
                                        {generalForm.errors.description && (
                                            <Alert variant="destructive">
                                                <AlertDescription>{generalForm.errors.description}</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={generalForm.processing}>
                                            {generalForm.processing ? (
                                                <>
                                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                    Salvando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Salvar Configurações
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Aparência</CardTitle>
                                <CardDescription>Personalize a aparência da sua página de agendamento</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        appearanceForm.put('/settings/appearance');
                                    }}
                                    className="space-y-4"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="theme">Tema</Label>
                                        <Select value={appearanceForm.data.theme} onValueChange={(value) => appearanceForm.setData('theme', value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default">Padrão</SelectItem>
                                                <SelectItem value="modern">Moderno</SelectItem>
                                                <SelectItem value="elegant">Elegante</SelectItem>
                                                <SelectItem value="minimal">Minimalista</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="primary-color">Cor Primária</Label>
                                            <Input
                                                id="primary-color"
                                                type="color"
                                                value={appearanceForm.data.colors.primary}
                                                onChange={(e) =>
                                                    appearanceForm.setData('colors', { ...appearanceForm.data.colors, primary: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="secondary-color">Cor Secundária</Label>
                                            <Input
                                                id="secondary-color"
                                                type="color"
                                                value={appearanceForm.data.colors.secondary}
                                                onChange={(e) =>
                                                    appearanceForm.setData('colors', { ...appearanceForm.data.colors, secondary: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="accent-color">Cor de Destaque</Label>
                                            <Input
                                                id="accent-color"
                                                type="color"
                                                value={appearanceForm.data.colors.accent}
                                                onChange={(e) =>
                                                    appearanceForm.setData('colors', { ...appearanceForm.data.colors, accent: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={appearanceForm.processing}>
                                            {appearanceForm.processing ? (
                                                <>
                                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                    Salvando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Salvar Aparência
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Placeholder for other tabs */}
                    <TabsContent value="working-hours">
                        <Card>
                            <CardHeader>
                                <CardTitle>Horários de Funcionamento</CardTitle>
                                <CardDescription>Configure os horários de funcionamento do seu estabelecimento</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Em desenvolvimento...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="booking">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurações de Agendamento</CardTitle>
                                <CardDescription>Configure as regras de agendamento e cancelamento</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Em desenvolvimento...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="payment">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurações de Pagamento</CardTitle>
                                <CardDescription>Configure as opções de pagamento e taxas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Em desenvolvimento...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="integrations">
                        <Card>
                            <CardHeader>
                                <CardTitle>Integrações</CardTitle>
                                <CardDescription>Configure integrações com WhatsApp, Facebook, Google Analytics, etc.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Em desenvolvimento...</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </EstablishmentAppLayout>
    );
}
