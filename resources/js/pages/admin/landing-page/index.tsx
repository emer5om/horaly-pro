import { Head, router, useForm } from '@inertiajs/react';
import { Check, Eye, Palette, Save, Settings, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
    landing_title?: string;
    landing_description?: string;
    landing_features?: string[];
    landing_button_text?: string;
    landing_badge?: string;
    landing_featured: boolean;
    landing_order: number;
    show_on_landing: boolean;
}

interface LandingPageSettings {
    hero_title: string;
    hero_subtitle: string;
    hero_description: string;
    plans_title: string;
    plans_subtitle: string;
    plans_description: string;
    contact_title: string;
    contact_subtitle: string;
    contact_phone: string;
    contact_email: string;
    contact_address: string;
    show_plans: boolean;
    show_contact: boolean;
    show_testimonials: boolean;
    primary_color: string;
    secondary_color: string;
}

interface LandingPageIndexProps {
    auth: any;
    settings: LandingPageSettings;
    plans: Plan[];
}

export default function LandingPageIndex({ auth, settings, plans }: LandingPageIndexProps) {
    const [activeTab, setActiveTab] = useState('hero');
    
    const { data, setData, put, processing, errors } = useForm({
        hero_title: settings.hero_title,
        hero_subtitle: settings.hero_subtitle,
        hero_description: settings.hero_description,
        plans_title: settings.plans_title,
        plans_subtitle: settings.plans_subtitle,
        plans_description: settings.plans_description,
        contact_title: settings.contact_title,
        contact_subtitle: settings.contact_subtitle,
        contact_phone: settings.contact_phone,
        contact_email: settings.contact_email,
        contact_address: settings.contact_address,
        show_plans: settings.show_plans,
        show_contact: settings.show_contact,
        show_testimonials: settings.show_testimonials,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/admin/landing-page');
    };

    const updatePlan = (planId: number, planData: any) => {
        router.put(`/admin/landing-page/plans/${planId}`, planData, {
            preserveScroll: true,
            onSuccess: () => {
                // Success handled by flash message
            },
        });
    };

    const tabs = [
        { id: 'hero', label: 'Seção Hero', icon: Eye },
        { id: 'plans', label: 'Seção Planos', icon: Settings },
        { id: 'plans-edit', label: 'Editar Planos', icon: Settings },
        { id: 'contact', label: 'Seção Contato', icon: Settings },
        { id: 'appearance', label: 'Aparência', icon: Palette },
    ];

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
            <Head title="Configurar Landing Page - Admin" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Configurar Landing Page</h1>
                        <p className="text-gray-600">Gerencie o conteúdo e aparência da página inicial</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={() => window.open('/', '_blank')}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                        </Button>
                        <Button onClick={handleSubmit} disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Tabs Navigation */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-lg">Seções</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {tabs.map((tab) => (
                                <Button
                                    key={tab.id}
                                    variant={activeTab === tab.id ? "default" : "ghost"}
                                    className="w-full justify-start"
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <tab.icon className="mr-2 h-4 w-4" />
                                    {tab.label}
                                </Button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit}>
                            {/* Hero Section */}
                            {activeTab === 'hero' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Seção Hero</CardTitle>
                                        <CardDescription>
                                            Configure o conteúdo da seção principal da página
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="hero_title">Título Principal</Label>
                                                <Input
                                                    id="hero_title"
                                                    value={data.hero_title}
                                                    onChange={(e) => setData('hero_title', e.target.value)}
                                                    placeholder="Digite o título principal"
                                                />
                                                {errors.hero_title && <p className="text-red-500 text-sm">{errors.hero_title}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="hero_subtitle">Subtítulo</Label>
                                                <Input
                                                    id="hero_subtitle"
                                                    value={data.hero_subtitle}
                                                    onChange={(e) => setData('hero_subtitle', e.target.value)}
                                                    placeholder="Digite o subtítulo"
                                                />
                                                {errors.hero_subtitle && <p className="text-red-500 text-sm">{errors.hero_subtitle}</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="hero_description">Descrição</Label>
                                            <Textarea
                                                id="hero_description"
                                                value={data.hero_description}
                                                onChange={(e) => setData('hero_description', e.target.value)}
                                                placeholder="Digite a descrição"
                                                rows={4}
                                            />
                                            {errors.hero_description && <p className="text-red-500 text-sm">{errors.hero_description}</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Plans Section */}
                            {activeTab === 'plans' && (
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Seção Planos</CardTitle>
                                            <CardDescription>
                                                Configure o conteúdo da seção de planos
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    checked={data.show_plans}
                                                    onCheckedChange={(checked) => setData('show_plans', checked)}
                                                />
                                                <Label>Mostrar seção de planos</Label>
                                            </div>
                                            
                                            {data.show_plans && (
                                                <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor="plans_title">Título da Seção</Label>
                                                            <Input
                                                                id="plans_title"
                                                                value={data.plans_title}
                                                                onChange={(e) => setData('plans_title', e.target.value)}
                                                                placeholder="Digite o título da seção"
                                                            />
                                                            {errors.plans_title && <p className="text-red-500 text-sm">{errors.plans_title}</p>}
                                                        </div>
                                                        <div>
                                                            <Label htmlFor="plans_subtitle">Subtítulo da Seção</Label>
                                                            <Input
                                                                id="plans_subtitle"
                                                                value={data.plans_subtitle}
                                                                onChange={(e) => setData('plans_subtitle', e.target.value)}
                                                                placeholder="Digite o subtítulo da seção"
                                                            />
                                                            {errors.plans_subtitle && <p className="text-red-500 text-sm">{errors.plans_subtitle}</p>}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="plans_description">Descrição da Seção</Label>
                                                        <Textarea
                                                            id="plans_description"
                                                            value={data.plans_description}
                                                            onChange={(e) => setData('plans_description', e.target.value)}
                                                            placeholder="Digite a descrição da seção"
                                                            rows={3}
                                                        />
                                                        {errors.plans_description && <p className="text-red-500 text-sm">{errors.plans_description}</p>}
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Plans Preview */}
                                    {data.show_plans && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Planos Disponíveis</CardTitle>
                                                <CardDescription>
                                                    Estes são os planos ativos que aparecerão na landing page
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {plans.map((plan) => (
                                                        <div key={plan.id} className="border rounded-lg p-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h3 className="font-semibold">{plan.name}</h3>
                                                                <Badge variant="default">Ativo</Badge>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm">Preço:</span>
                                                                    <span className="font-semibold text-green-600">
                                                                        R$ {Number(plan.price).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm">Ciclo:</span>
                                                                    <Badge variant="outline">
                                                                        {getBillingCycleLabel(plan.billing_cycle)}
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-sm">Agendamentos:</span>
                                                                    <Badge variant="secondary">
                                                                        {getAppointmentLimitText(plan)}
                                                                    </Badge>
                                                                </div>
                                                                <div className="pt-2">
                                                                    <p className="text-xs text-gray-500 mb-1">Recursos:</p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {plan.features.slice(0, 3).map((feature) => (
                                                                            <Badge key={feature} variant="secondary" className="text-xs">
                                                                                {feature}
                                                                            </Badge>
                                                                        ))}
                                                                        {plan.features.length > 3 && (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                +{plan.features.length - 3}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}

                            {/* Contact Section */}
                            {activeTab === 'contact' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Seção Contato</CardTitle>
                                        <CardDescription>
                                            Configure o conteúdo da seção de contato
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={data.show_contact}
                                                onCheckedChange={(checked) => setData('show_contact', checked)}
                                            />
                                            <Label>Mostrar seção de contato</Label>
                                        </div>
                                        
                                        {data.show_contact && (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="contact_title">Título da Seção</Label>
                                                        <Input
                                                            id="contact_title"
                                                            value={data.contact_title}
                                                            onChange={(e) => setData('contact_title', e.target.value)}
                                                            placeholder="Digite o título da seção"
                                                        />
                                                        {errors.contact_title && <p className="text-red-500 text-sm">{errors.contact_title}</p>}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="contact_subtitle">Subtítulo da Seção</Label>
                                                        <Input
                                                            id="contact_subtitle"
                                                            value={data.contact_subtitle}
                                                            onChange={(e) => setData('contact_subtitle', e.target.value)}
                                                            placeholder="Digite o subtítulo da seção"
                                                        />
                                                        {errors.contact_subtitle && <p className="text-red-500 text-sm">{errors.contact_subtitle}</p>}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <Label htmlFor="contact_phone">Telefone</Label>
                                                        <Input
                                                            id="contact_phone"
                                                            value={data.contact_phone}
                                                            onChange={(e) => setData('contact_phone', e.target.value)}
                                                            placeholder="(11) 99999-9999"
                                                        />
                                                        {errors.contact_phone && <p className="text-red-500 text-sm">{errors.contact_phone}</p>}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="contact_email">E-mail</Label>
                                                        <Input
                                                            id="contact_email"
                                                            type="email"
                                                            value={data.contact_email}
                                                            onChange={(e) => setData('contact_email', e.target.value)}
                                                            placeholder="contato@horaly.com"
                                                        />
                                                        {errors.contact_email && <p className="text-red-500 text-sm">{errors.contact_email}</p>}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="contact_address">Endereço</Label>
                                                        <Input
                                                            id="contact_address"
                                                            value={data.contact_address}
                                                            onChange={(e) => setData('contact_address', e.target.value)}
                                                            placeholder="São Paulo, SP"
                                                        />
                                                        {errors.contact_address && <p className="text-red-500 text-sm">{errors.contact_address}</p>}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Plans Edit Section */}
                            {activeTab === 'plans-edit' && (
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Editar Planos para Landing Page</CardTitle>
                                            <CardDescription>
                                                Customize como cada plano aparece na landing page
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Arraste os planos para reordenar ou use os campos abaixo para personalizar cada plano individualmente.
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {plans.map((plan) => (
                                            <PlanEditCard
                                                key={plan.id}
                                                plan={plan}
                                                onUpdate={updatePlan}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Appearance Section */}
                            {activeTab === 'appearance' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Aparência</CardTitle>
                                        <CardDescription>
                                            Configure as cores e aparência da landing page
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="primary_color">Cor Primária</Label>
                                                <div className="flex items-center space-x-2">
                                                    <Input
                                                        id="primary_color"
                                                        type="color"
                                                        value={data.primary_color}
                                                        onChange={(e) => setData('primary_color', e.target.value)}
                                                        className="w-16 h-10"
                                                    />
                                                    <Input
                                                        value={data.primary_color}
                                                        onChange={(e) => setData('primary_color', e.target.value)}
                                                        placeholder="#3B82F6"
                                                    />
                                                </div>
                                                {errors.primary_color && <p className="text-red-500 text-sm">{errors.primary_color}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="secondary_color">Cor Secundária</Label>
                                                <div className="flex items-center space-x-2">
                                                    <Input
                                                        id="secondary_color"
                                                        type="color"
                                                        value={data.secondary_color}
                                                        onChange={(e) => setData('secondary_color', e.target.value)}
                                                        className="w-16 h-10"
                                                    />
                                                    <Input
                                                        value={data.secondary_color}
                                                        onChange={(e) => setData('secondary_color', e.target.value)}
                                                        placeholder="#10B981"
                                                    />
                                                </div>
                                                {errors.secondary_color && <p className="text-red-500 text-sm">{errors.secondary_color}</p>}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={data.show_testimonials}
                                                onCheckedChange={(checked) => setData('show_testimonials', checked)}
                                            />
                                            <Label>Mostrar seção de depoimentos</Label>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

// Plan Edit Card Component
interface PlanEditCardProps {
    plan: Plan;
    onUpdate: (planId: number, data: any) => void;
}

function PlanEditCard({ plan, onUpdate }: PlanEditCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        landing_title: plan.landing_title || plan.name,
        landing_description: plan.landing_description || plan.description,
        landing_features: plan.landing_features || plan.features,
        landing_button_text: plan.landing_button_text || 'Escolher Plano',
        landing_badge: plan.landing_badge || '',
        landing_featured: plan.landing_featured || false,
        landing_order: plan.landing_order || 0,
        show_on_landing: plan.show_on_landing !== undefined ? plan.show_on_landing : true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(plan.id, formData);
        setIsEditing(false);
    };

    const addFeature = () => {
        setFormData(prev => ({
            ...prev,
            landing_features: [...(prev.landing_features || []), '']
        }));
    };

    const removeFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            landing_features: prev.landing_features?.filter((_, i) => i !== index) || []
        }));
    };

    const updateFeature = (index: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            landing_features: prev.landing_features?.map((feature, i) => 
                i === index ? value : feature
            ) || []
        }));
    };

    if (isEditing) {
        return (
            <Card className="relative">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Editando: {plan.name}</span>
                        <Badge variant={plan.landing_featured ? "default" : "secondary"}>
                            {plan.landing_featured ? 'Destaque' : 'Normal'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="landing_title">Título na Landing Page</Label>
                                <Input
                                    id="landing_title"
                                    value={formData.landing_title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, landing_title: e.target.value }))}
                                    placeholder="Título personalizado"
                                />
                            </div>
                            <div>
                                <Label htmlFor="landing_button_text">Texto do Botão</Label>
                                <Input
                                    id="landing_button_text"
                                    value={formData.landing_button_text}
                                    onChange={(e) => setFormData(prev => ({ ...prev, landing_button_text: e.target.value }))}
                                    placeholder="Escolher Plano"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="landing_description">Descrição na Landing Page</Label>
                            <Textarea
                                id="landing_description"
                                value={formData.landing_description}
                                onChange={(e) => setFormData(prev => ({ ...prev, landing_description: e.target.value }))}
                                placeholder="Descrição personalizada"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="landing_badge">Badge (Opcional)</Label>
                                <Input
                                    id="landing_badge"
                                    value={formData.landing_badge}
                                    onChange={(e) => setFormData(prev => ({ ...prev, landing_badge: e.target.value }))}
                                    placeholder="ex: Mais Popular, Recomendado"
                                />
                            </div>
                            <div>
                                <Label htmlFor="landing_order">Ordem de Exibição</Label>
                                <Input
                                    id="landing_order"
                                    type="number"
                                    min="0"
                                    value={formData.landing_order}
                                    onChange={(e) => setFormData(prev => ({ ...prev, landing_order: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Recursos do Plano</Label>
                            <div className="space-y-2 mt-2">
                                {formData.landing_features?.map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <Input
                                            value={feature}
                                            onChange={(e) => updateFeature(index, e.target.value)}
                                            placeholder="Digite o recurso"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeFeature(index)}
                                        >
                                            Remover
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addFeature}
                                >
                                    Adicionar Recurso
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={formData.show_on_landing}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_on_landing: checked }))}
                                />
                                <Label>Mostrar na Landing Page</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={formData.landing_featured}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, landing_featured: checked }))}
                                />
                                <Label>Plano em Destaque</Label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                Salvar Alterações
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="relative">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{plan.landing_title || plan.name}</span>
                    <div className="flex items-center space-x-2">
                        {plan.landing_featured && (
                            <Badge variant="default">Destaque</Badge>
                        )}
                        <Badge variant={plan.show_on_landing ? "default" : "secondary"}>
                            {plan.show_on_landing ? 'Visível' : 'Oculto'}
                        </Badge>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                        {plan.landing_description || plan.description}
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">
                            R$ {Number(plan.price).toFixed(2)}
                        </span>
                        <Badge variant="outline">
                            Ordem: {plan.landing_order}
                        </Badge>
                    </div>
                    {plan.landing_badge && (
                        <Badge variant="secondary">{plan.landing_badge}</Badge>
                    )}
                    <div className="space-y-1">
                        {(plan.landing_features || plan.features).slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">{feature}</span>
                            </div>
                        ))}
                        {(plan.landing_features || plan.features).length > 3 && (
                            <div className="text-sm text-gray-500">
                                +{(plan.landing_features || plan.features).length - 3} recursos
                            </div>
                        )}
                    </div>
                    <div className="pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="w-full"
                        >
                            Editar Plano
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}