import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Establishment } from '@/types/models';
import EstablishmentLayout from '@/layouts/establishment-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useForm } from '@inertiajs/react';
import { Smartphone, DollarSign } from 'lucide-react';

interface PaymentPageProps extends PageProps {
    establishment: Establishment;
    planFeatures?: string[];
}

interface PaymentFormData {
    payment_enabled: boolean;
    payment_methods: string[];
}

export default function Payment({ auth, establishment, planFeatures = [] }: PaymentPageProps) {
    const { data, setData, patch, processing, errors } = useForm<PaymentFormData>({
        payment_enabled: establishment.payment_enabled || false,
        payment_methods: establishment.payment_methods || ['pix'],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        patch(route('settings.payment'), {
            onSuccess: () => {
                toast.success('Configurações de pagamento atualizadas com sucesso!');
            },
            onError: () => {
                toast.error('Erro ao atualizar configurações de pagamento.');
            }
        });
    };

    const handlePaymentMethodChange = (method: string, checked: boolean) => {
        if (checked) {
            setData('payment_methods', [...data.payment_methods, method]);
        } else {
            setData('payment_methods', data.payment_methods.filter(m => m !== method));
        }
    };

    const paymentMethods = [
        {
            id: 'pix',
            label: 'PIX',
            description: 'Pagamento instantâneo via PIX',
            icon: Smartphone,
        },
    ];

    return (
        <EstablishmentLayout planFeatures={planFeatures}>
            <Head title="Configurações de Pagamento" />
            
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Configurações de Pagamento</h1>
                    <p className="text-muted-foreground">
                        Configure como seus clientes podem pagar pelos serviços
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Habilitar Pagamentos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Ativar Cobrança
                            </CardTitle>
                            <CardDescription>
                                Ative para permitir que os clientes paguem pelos serviços durante o agendamento
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="payment_enabled"
                                    checked={data.payment_enabled}
                                    onCheckedChange={(checked) => setData('payment_enabled', checked)}
                                />
                                <Label htmlFor="payment_enabled">
                                    {data.payment_enabled ? 'Cobrança ativada' : 'Cobrança desativada'}
                                </Label>
                            </div>
                            {errors.payment_enabled && (
                                <p className="text-sm text-destructive mt-1">{errors.payment_enabled}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Métodos de Pagamento */}
                    {data.payment_enabled && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Métodos de Pagamento</CardTitle>
                                <CardDescription>
                                    Selecione quais métodos de pagamento estarão disponíveis para seus clientes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {paymentMethods.map((method) => {
                                        const Icon = method.icon;
                                        const isChecked = data.payment_methods.includes(method.id);
                                        
                                        return (
                                            <div key={method.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                                                <Checkbox
                                                    id={method.id}
                                                    checked={isChecked}
                                                    onCheckedChange={(checked) => 
                                                        handlePaymentMethodChange(method.id, checked as boolean)
                                                    }
                                                    className="mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                                        <Label 
                                                            htmlFor={method.id} 
                                                            className="text-sm font-medium cursor-pointer"
                                                        >
                                                            {method.label}
                                                        </Label>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {method.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {data.payment_methods.length === 0 && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Selecione pelo menos um método de pagamento
                                    </p>
                                )}
                                
                                {errors.payment_methods && (
                                    <p className="text-sm text-destructive mt-2">{errors.payment_methods}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Informações Importantes */}
                    <Card className="border-amber-200 bg-amber-50">
                        <CardHeader>
                            <CardTitle className="text-amber-800">⚠️ Importante</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-amber-700">
                                <p>• Para aceitar pagamentos, você precisará configurar uma integração com um gateway de pagamento</p>
                                <p>• Os métodos selecionados aparecerão na página de agendamento dos clientes</p>
                                <p>• Certifique-se de ter as credenciais necessárias do seu provedor de pagamento</p>
                                <p>• O pagamento é opcional - clientes ainda podem agendar sem pagar</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Botão de Salvar */}
                    <div className="flex justify-end">
                        <Button 
                            type="submit" 
                            disabled={processing}
                            size="lg"
                        >
                            {processing ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                    </div>
                </form>
            </div>
        </EstablishmentLayout>
    );
}