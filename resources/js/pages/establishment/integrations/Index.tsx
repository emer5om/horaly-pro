import { Head, useForm } from '@inertiajs/react';
import { Facebook, BarChart3, Tag } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Establishment {
    id: number;
    name: string;
    facebook_pixel_id: string | null;
    google_analytics_id: string | null;
    google_tag_id: string | null;
}

interface IntegrationsPageProps {
    establishment: Establishment;
    planFeatures?: string[];
}

export default function IntegrationsPage({ establishment, planFeatures = [] }: IntegrationsPageProps) {
    // Analytics forms
    const analyticsForm = useForm({
        facebook_pixel_id: establishment.facebook_pixel_id || '',
        google_analytics_id: establishment.google_analytics_id || '',
        google_tag_id: establishment.google_tag_id || '',
    });

    const handleAnalyticsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        analyticsForm.patch('/establishment/integrations/analytics', {
            onSuccess: () => toast.success('Configurações de analytics atualizadas!'),
            onError: () => toast.error('Erro ao atualizar configurações'),
        });
    };

    return (
        <EstablishmentAppLayout title="Marketing & Analytics" planFeatures={planFeatures}>
            <Head title="Marketing & Analytics" />

            <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Marketing & Analytics</h1>
                        <p className="text-muted-foreground">Configure Facebook Pixel, Google Analytics e Google Tag Manager</p>
                    </div>
                </div>

                <div className="max-w-4xl">
                    {/* Analytics Integration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Analytics & Tracking
                            </CardTitle>
                            <CardDescription>
                                Configure Facebook Pixel, Google Analytics e Google Tag Manager
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAnalyticsSubmit} className="space-y-6">
                                {/* Facebook Pixel */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Facebook className="h-4 w-4" />
                                        <Label className="text-base font-medium">Facebook Pixel</Label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pixel ID</Label>
                                        <Input
                                            value={analyticsForm.data.facebook_pixel_id}
                                            onChange={(e) => analyticsForm.setData('facebook_pixel_id', e.target.value)}
                                            placeholder="123456789012345"
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Encontre seu Pixel ID no Gerenciador de Eventos do Facebook
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Google Analytics */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" />
                                        <Label className="text-base font-medium">Google Analytics</Label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tracking ID</Label>
                                        <Input
                                            value={analyticsForm.data.google_analytics_id}
                                            onChange={(e) => analyticsForm.setData('google_analytics_id', e.target.value)}
                                            placeholder="GA4-XXXXXXXXXX ou UA-XXXXXXXXX-X"
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            ID de acompanhamento do Google Analytics (GA4 ou Universal Analytics)
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Google Tag Manager */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        <Label className="text-base font-medium">Google Tag Manager</Label>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Container ID</Label>
                                        <Input
                                            value={analyticsForm.data.google_tag_id}
                                            onChange={(e) => analyticsForm.setData('google_tag_id', e.target.value)}
                                            placeholder="GTM-XXXXXXX"
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            ID do contêiner do Google Tag Manager
                                        </p>
                                    </div>
                                </div>

                                <Button type="submit" disabled={analyticsForm.processing} className="w-full">
                                    {analyticsForm.processing ? 'Salvando...' : 'Salvar Configurações'}
                                </Button>

                                <Alert>
                                    <BarChart3 className="h-4 w-4" />
                                    <AlertDescription>
                                        As configurações de analytics serão aplicadas automaticamente em todas as páginas do seu site de agendamento.
                                    </AlertDescription>
                                </Alert>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </EstablishmentAppLayout>
    );
}