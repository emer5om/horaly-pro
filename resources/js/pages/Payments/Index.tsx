import { Head } from '@inertiajs/react';
import { PageProps, Establishment } from '@/types';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Smartphone, 
    DollarSign, 
    Settings, 
    AlertCircle,
    CheckCircle,
    Info,
    Key,
    Eye,
    EyeOff,
    Percent,
    Calculator
} from 'lucide-react';

interface PaymentsPageProps extends PageProps {
    establishment: Establishment;
    planFeatures?: string[];
}

interface PaymentFormData {
    mercadopago_access_token: string;
    accepted_payment_methods: string[];
    booking_fee_enabled: boolean;
    booking_fee_type: 'fixed' | 'percentage';
    booking_fee_amount: number;
    booking_fee_percentage: number;
}

export default function PaymentsIndex({ auth, establishment, planFeatures = [] }: PaymentsPageProps) {
    const [showAccessToken, setShowAccessToken] = useState(false);

    const { data, setData, put, processing, errors } = useForm<PaymentFormData>({
        mercadopago_access_token: establishment.mercadopago_access_token || '',
        accepted_payment_methods: establishment.accepted_payment_methods || ['pix'],
        booking_fee_enabled: establishment.booking_fee_enabled || false,
        booking_fee_type: establishment.booking_fee_type || 'fixed',
        booking_fee_amount: Number(establishment.booking_fee_amount) || 10.00,
        booking_fee_percentage: Number(establishment.booking_fee_percentage) || 50.00,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        put(route('settings.payment'), {
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
            setData('accepted_payment_methods', [...data.accepted_payment_methods, method]);
        } else {
            setData('accepted_payment_methods', data.accepted_payment_methods.filter(m => m !== method));
        }
    };


    const paymentMethods = [
        {
            id: 'pix',
            label: 'PIX',
            description: 'Pagamento instantâneo via PIX',
            icon: Smartphone,
            popular: true,
        },
    ];

    const getStatusBadge = () => {
        if (!data.mercadopago_access_token) {
            return <Badge variant="destructive">Não Configurado</Badge>;
        }
        if (data.accepted_payment_methods.length === 0) {
            return <Badge variant="destructive">Configuração Incompleta</Badge>;
        }
        return <Badge variant="default" className="bg-green-500">Configurado</Badge>;
    };

    const calculateFeeAmount = () => {
        if (!data.booking_fee_enabled) return 0;
        
        if (data.booking_fee_type === 'fixed') {
            return Number(data.booking_fee_amount) || 0;
        } else {
            // Assuming average service price of R$ 50 for calculation
            const averageServicePrice = 50;
            const percentage = Number(data.booking_fee_percentage) || 0;
            return (averageServicePrice * percentage) / 100;
        }
    };

    return (
        <EstablishmentAppLayout title="Pagamentos" planFeatures={planFeatures}>
            <Head title="Pagamentos" />
            
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">Pagamentos</h1>
                                <p className="text-muted-foreground">
                                    Configure o MercadoPago e taxas de agendamento
                                </p>
                            </div>
                            {getStatusBadge()}
                        </div>

                        {/* Status Overview */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-2">
                                        {data.mercadopago_access_token ? (
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-500" />
                                        )}
                                        <div>
                                            <p className="text-sm font-medium">MercadoPago</p>
                                            <p className="text-xs text-muted-foreground">
                                                {data.mercadopago_access_token ? 'Configurado' : 'Não configurado'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-2">
                                        <DollarSign className="h-5 w-5 text-blue-500" />
                                        <div>
                                            <p className="text-sm font-medium">Métodos Aceitos</p>
                                            <p className="text-xs text-muted-foreground">
                                                {data.accepted_payment_methods.length} de {paymentMethods.length} métodos
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-2">
                                        <DollarSign className="h-5 w-5 text-green-500" />
                                        <div>
                                            <p className="text-sm font-medium">Taxa de Agendamento</p>
                                            <p className="text-xs text-muted-foreground">
                                                {data.booking_fee_enabled ? 
                                                    `R$ ${Number(calculateFeeAmount()).toFixed(2)}` : 
                                                    'Desativada'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* MercadoPago Configuration */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Key className="h-5 w-5" />
                                        Configuração do MercadoPago
                                    </CardTitle>
                                    <CardDescription>
                                        Configure seu access token do MercadoPago para processar pagamentos
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mercadopago_access_token">Access Token do MercadoPago</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    id="mercadopago_access_token"
                                                    type={showAccessToken ? "text" : "password"}
                                                    placeholder="APP_USR-..."
                                                    value={data.mercadopago_access_token}
                                                    onChange={(e) => setData('mercadopago_access_token', e.target.value)}
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full px-3"
                                                    onClick={() => setShowAccessToken(!showAccessToken)}
                                                >
                                                    {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Obtenha seu access token no painel do MercadoPago em Integrações → Suas aplicações
                                        </p>
                                        {errors.mercadopago_access_token && (
                                            <p className="text-sm text-destructive">{errors.mercadopago_access_token}</p>
                                        )}
                                    </div>

                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>
                                            <strong>Importante:</strong> Use o access token de produção para processar pagamentos reais.
                                            Para testes, use o access token de sandbox.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>

                            {/* Payment Methods */}
                            {data.mercadopago_access_token && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Métodos de Pagamento Aceitos</CardTitle>
                                        <CardDescription>
                                            Selecione quais métodos de pagamento seus clientes poderão usar
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {paymentMethods.map((method) => {
                                                const Icon = method.icon;
                                                const isChecked = data.accepted_payment_methods.includes(method.id);
                                                
                                                return (
                                                    <div 
                                                        key={method.id} 
                                                        className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                                                            isChecked ? 'border-primary bg-primary/5' : 'border-border'
                                                        }`}
                                                    >
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
                                                                {method.popular && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Popular
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {method.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {errors.accepted_payment_methods && (
                                            <p className="text-sm text-destructive mt-2">{errors.accepted_payment_methods}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Booking Fee Configuration */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calculator className="h-5 w-5" />
                                        Taxa de Agendamento
                                    </CardTitle>
                                    <CardDescription>
                                        Configure se deseja cobrar uma taxa para confirmar agendamentos
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="booking_fee_enabled"
                                            checked={data.booking_fee_enabled}
                                            onCheckedChange={(checked) => setData('booking_fee_enabled', checked)}
                                        />
                                        <Label htmlFor="booking_fee_enabled">
                                            Cobrar taxa de agendamento
                                        </Label>
                                    </div>

                                    {data.booking_fee_enabled && (
                                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="space-y-2">
                                                <Label htmlFor="booking_fee_type">Tipo de Taxa</Label>
                                                <Select
                                                    value={data.booking_fee_type}
                                                    onValueChange={(value: 'fixed' | 'percentage') => setData('booking_fee_type', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                                                        <SelectItem value="percentage">Porcentagem do Serviço (%)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {data.booking_fee_type === 'fixed' ? (
                                                <div className="space-y-2">
                                                    <Label htmlFor="booking_fee_amount">Valor da Taxa (R$)</Label>
                                                    <Input
                                                        id="booking_fee_amount"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="10.00"
                                                        value={data.booking_fee_amount || 0}
                                                        onChange={(e) => setData('booking_fee_amount', parseFloat(e.target.value) || 0)}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Valor fixo cobrado em todos os agendamentos
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Label htmlFor="booking_fee_percentage">Porcentagem (%)</Label>
                                                    <Input
                                                        id="booking_fee_percentage"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        placeholder="50.00"
                                                        value={data.booking_fee_percentage || 0}
                                                        onChange={(e) => setData('booking_fee_percentage', parseFloat(e.target.value) || 0)}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Porcentagem do valor do serviço cobrada como taxa
                                                    </p>
                                                </div>
                                            )}

                                            <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                                <p className="text-sm text-blue-800">
                                                    <strong>Valor estimado da taxa:</strong> R$ {Number(calculateFeeAmount()).toFixed(2)}
                                                    {data.booking_fee_type === 'percentage' && (
                                                        <span className="text-xs text-blue-600 block mt-1">
                                                            (Baseado em serviço de R$ 50,00)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {errors.booking_fee_amount && (
                                        <p className="text-sm text-destructive">{errors.booking_fee_amount}</p>
                                    )}
                                    {errors.booking_fee_percentage && (
                                        <p className="text-sm text-destructive">{errors.booking_fee_percentage}</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Info Card */}
                            <Card className="border-blue-200 bg-blue-50">
                                <CardHeader>
                                    <CardTitle className="text-blue-800 flex items-center gap-2">
                                        <Info className="h-5 w-5" />
                                        Como Funciona
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm text-blue-700">
                                        <p>• <strong>Checkout Transparente:</strong> Pagamentos processados pelo MercadoPago</p>
                                        <p>• <strong>Taxa de Agendamento:</strong> Cliente paga para confirmar o agendamento</p>
                                        <p>• <strong>Verificação Automática:</strong> Sistema verifica status do pagamento automaticamente</p>
                                        <p>• <strong>Confirmação:</strong> Agendamento só é confirmado após pagamento aprovado</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Submit Button */}
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
                </div>
            </div>
        </EstablishmentAppLayout>
    );
}