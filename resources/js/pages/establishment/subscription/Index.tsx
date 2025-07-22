import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, CheckCircle, Crown, Star, Zap, QrCode, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Plan {
  id: number;
  name: string;
  price: number;
  description: string;
  features: string[];
  is_active: boolean;
  service_limit: number | string;
  appointment_limit: number | string;
  landing_page: boolean;
  whatsapp_integration: boolean;
  custom_domain: boolean;
  priority_support: boolean;
  analytics: boolean;
  reports: boolean;
  billing_cycle: string;
  monthly_appointment_limit: number;
  unlimited_appointments: boolean;
}

interface Establishment {
  id: number;
  name: string;
  plan: Plan;
  subscription_status: string;
  trial_ends_at: string;
  subscription_expires_at: string;
}

interface SubscriptionStatus {
  status: string;
  label: string;
  canUse: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  hasActiveSubscription: boolean;
  hasExpiredSubscription: boolean;
}

interface Props {
  establishment: Establishment;
  plans: Plan[];
  currentPlan: Plan;
  subscriptionStatus: SubscriptionStatus;
  planFeatures?: string[];
  currentServiceCount?: number;
}

export default function SubscriptionIndex({ establishment, plans, currentPlan, subscriptionStatus, planFeatures = [], currentServiceCount = 0 }: Props) {
  const page = usePage();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pixPayment, setPixPayment] = useState<{
    payment_id: string;
    qr_code: string;
    qr_code_base64: string;
    amount: number;
    expires_at: string;
  } | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixStatusInterval, setPixStatusInterval] = useState<NodeJS.Timeout | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState({
    reason: '',
    satisfaction: '',
    recommendation: ''
  });
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAccessModal, setShowAccessModal] = useState(false);

  // Mostrar modal se há problema com assinatura
  useEffect(() => {
    const flashError = (page.props as any).flash?.error;
    
    // Mostrar modal automaticamente se vem da página de erro
    const urlParams = new URLSearchParams(window.location.search);
    const fromError = urlParams.get('from_error') === '1';
    
    if (
      flashError ||
      fromError ||
      subscriptionStatus.status === 'overdue' ||
      (subscriptionStatus.hasExpiredSubscription && !subscriptionStatus.hasActiveSubscription && !subscriptionStatus.isInTrial)
    ) {
      setShowAccessModal(true);
    }
  }, [page.props, subscriptionStatus]);

  const handleSubscribe = (plan: Plan) => {
    setSelectedPlan(plan);
    setErrorMessage(''); // Limpar erros anteriores
    setPixPayment(null); // Limpar PIX anterior
    setShowQrCode(false); // Reset QR code visibility
    setCopiedText(false); // Reset copy state
    setShowPaymentModal(true);
  };

  const handlePixPayment = async () => {
    if (!selectedPlan) return;

    setPixLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/subscription/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          plan_id: selectedPlan.id,
        }),
      });

      // Verificar se a resposta é JSON ou HTML
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Se não for JSON, provavelmente é um erro HTML
        const text = await response.text();
        console.error('Resposta não é JSON:', text);
        setErrorMessage('Erro no servidor. Verifique se você tem permissão para gerar PIX.');
        return;
      }

      if (response.ok && data.success) {
        setPixPayment({
          payment_id: data.payment_id,
          qr_code: data.qr_code,
          qr_code_base64: data.qr_code_base64,
          amount: data.amount,
          expires_at: data.expires_at,
        });
        
        // Start polling payment status
        startPixStatusPolling(data.payment_id);
      } else {
        setErrorMessage(data.message || 'Erro ao gerar pagamento PIX');
      }
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      setErrorMessage('Erro ao gerar pagamento PIX. Tente novamente.');
    } finally {
      setPixLoading(false);
    }
  };

  const startPixStatusPolling = (paymentId: string) => {
    // Clear any existing interval
    if (pixStatusInterval) {
      clearInterval(pixStatusInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/subscription/pix/${paymentId}/status`, {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'same-origin',
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (data.approved) {
            // Payment approved, stop polling and show success
            clearInterval(interval);
            setPixStatusInterval(null);
            setShowPaymentModal(false);
            setPixPayment(null);
            setSuccessMessage('🎉 Pagamento PIX aprovado! Bem-vindo ao plano ' + selectedPlan?.name + '!');
            setShowSuccessModal(true);
          }
          // If not approved yet, continue polling
        }
      } catch (error) {
        console.error('Erro ao verificar status do PIX:', error);
      }
    }, 3000); // Check every 3 seconds

    setPixStatusInterval(interval);

    // Stop polling after 15 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPixStatusInterval(null);
    }, 15 * 60 * 1000);
  };

  // Function to copy PIX code
  const handleCopyPixCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (pixStatusInterval) {
        clearInterval(pixStatusInterval);
      }
    };
  }, [pixStatusInterval]);

  const handleCancel = () => {
    setErrorMessage(''); // Limpar erros anteriores
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.reason || !cancelReason.satisfaction || !cancelReason.recommendation) {
      setErrorMessage('Por favor, responda todas as perguntas antes de continuar.');
      return;
    }

    setCancelLoading(true);

    try {
      // Fazer requisição AJAX direta em vez de usar router.post do Inertia
      const response = await fetch('/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          cancel_reason: cancelReason.reason,
          satisfaction_rating: cancelReason.satisfaction,
          recommendation_rating: cancelReason.recommendation
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowCancelModal(false);
        setSuccessMessage('✅ Assinatura cancelada com sucesso! Agradecemos pelo seu feedback.');
        setShowSuccessModal(true);
        // Reset form
        setCancelReason({
          reason: '',
          satisfaction: '',
          recommendation: ''
        });
      } else {
        // Mostrar erro no modal
        setErrorMessage(data.message || 'Erro ao cancelar assinatura');
      }
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      setErrorMessage('Erro ao cancelar assinatura. Tente novamente.');
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'básico':
        return <Star className="w-5 h-5" />;
      case 'profissional':
        return <Zap className="w-5 h-5" />;
      case 'empresarial':
        return <Crown className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  return (
    <EstablishmentAppLayout planFeatures={planFeatures}>
      <Head title="Meu Plano" />

      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Gerenciar Assinatura
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Controle seu plano e mantenha seu negócio sempre ativo
          </p>
        </div>

        {/* Status do Plano Atual - Unificado */}
        <div className="max-w-5xl mx-auto">
          <Card className="shadow-xl rounded-2xl overflow-hidden border-0">
            {/* Header baseado no status */}
            <CardHeader className={`text-center pb-6 relative overflow-hidden ${
              subscriptionStatus.hasActiveSubscription 
                ? 'bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600' 
                : subscriptionStatus.isInTrial 
                ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600'
                : 'bg-gradient-to-br from-red-600 via-rose-600 to-pink-600'
            } text-white`}>
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm shadow-lg">
                    <div className="text-white text-2xl">
                      {subscriptionStatus.hasActiveSubscription ? '✅' : 
                       subscriptionStatus.isInTrial ? '🎁' : '⚠️'}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold mb-2">
                      {subscriptionStatus.hasActiveSubscription ? 'Plano Ativo' : 
                       subscriptionStatus.isInTrial ? 'Período de Teste' : 'Ação Necessária'}
                    </CardTitle>
                    <p className="text-white/80 text-sm">
                      {subscriptionStatus.hasActiveSubscription ? 'Sua assinatura está funcionando perfeitamente' : 
                       subscriptionStatus.isInTrial ? 'Aproveite todos os recursos gratuitamente' : 'Renove para continuar usando o sistema'}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8">
              {/* Informações do Plano */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getPlanIcon(currentPlan.name)}
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">{currentPlan.name}</h3>
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {Number(currentPlan.price).toFixed(2)}
                    <span className="text-sm font-normal text-gray-500">/mês</span>
                  </div>
                </div>

                {/* Status Info */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-600 mb-6">
                  {subscriptionStatus.isInTrial ? (
                    establishment.trial_ends_at ? 
                      `🎁 Teste gratuito até ${new Date(establishment.trial_ends_at).toLocaleDateString('pt-BR')}` :
                      '🎁 Período de teste ativo'
                  ) : subscriptionStatus.hasActiveSubscription && establishment.subscription_expires_at ? (
                    (() => {
                      const date = new Date(establishment.subscription_expires_at);
                      if (date.getFullYear() > 2020) {
                        return `💳 Próxima cobrança: ${date.toLocaleDateString('pt-BR')}`;
                      } else {
                        return '💳 Assinatura ativa';
                      }
                    })()
                  ) : subscriptionStatus.status === 'overdue' ? (
                    '⚠️ Pagamento em atraso'
                  ) : (
                    '📋 Aguardando ativação'
                  )}
                </div>
              </div>

              {/* Recursos do Plano */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {currentServiceCount}
                    {currentPlan.service_limit !== '∞' && <span className="text-lg text-gray-400">/{currentPlan.service_limit}</span>}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Serviços</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-2">{currentPlan.appointment_limit}</div>
                  <div className="text-sm text-gray-600 font-medium">Agendamentos</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {currentPlan.landing_page ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Landing Page</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {currentPlan.whatsapp_integration ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">WhatsApp</div>
                </div>
              </div>

              {/* Ações baseadas no status */}
              <div className="text-center space-y-4">
                {subscriptionStatus.hasActiveSubscription ? (
                  /* Assinatura Ativa */
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-green-800 font-medium">✅ Sua assinatura está ativa e funcionando perfeitamente!</p>
                    </div>
                    <Button variant="outline" onClick={handleCancel} className="text-red-600 border-red-200 hover:bg-red-50">
                      Cancelar Assinatura
                    </Button>
                  </div>
                ) : subscriptionStatus.isInTrial ? (
                  /* Período de Teste */
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-blue-800 font-medium mb-2">🎁 Você está no período de teste!</p>
                      <p className="text-blue-600 text-sm">Renove antecipadamente para garantir a continuidade sem interrupções.</p>
                    </div>
                    <Button 
                      onClick={() => handleSubscribe(currentPlan)} 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow-lg"
                    >
                      💎 Renovar Antecipadamente
                    </Button>
                  </div>
                ) : (
                  /* Expirado/Overdue */
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-800 font-medium mb-2">
                        {subscriptionStatus.status === 'overdue' ? '🚨 Pagamento em atraso' : '⚠️ Período expirado'}
                      </p>
                      <p className="text-red-600 text-sm">
                        {subscriptionStatus.status === 'overdue' 
                          ? 'Seu último pagamento foi rejeitado. Renove para reativar o acesso completo.'
                          : 'Seu período de teste expirou. Renove para continuar usando todas as funcionalidades.'}
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleSubscribe(currentPlan)} 
                      className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl text-lg font-semibold shadow-lg"
                    >
                      {subscriptionStatus.status === 'overdue' ? '💳 Renovar Assinatura' : '🚀 Ativar Plano'}
                    </Button>
                    <p className="text-sm text-gray-600">Pagamento via PIX • Ativação imediata</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Outros Planos Disponíveis */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Outros Planos</h2>
            <p className="text-gray-600 text-sm sm:text-base">Compare e escolha o plano ideal para seu negócio</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.filter(plan => plan.id !== currentPlan.id).map((plan) => (
              <Card key={plan.id} className="relative hover:shadow-lg transition-all duration-200 rounded-xl border border-gray-200 bg-white">
                {plan.name.toLowerCase() === 'profissional' && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs">
                      ⭐ Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4 pt-6">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getPlanIcon(plan.name)}
                    </div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    R$ {Number(plan.price).toFixed(2)}
                    <span className="text-sm font-normal text-gray-500">/mês</span>
                  </div>
                </CardHeader>
                
                <CardContent className="px-4 pb-6">
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{plan.service_limit} serviços</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{plan.appointment_limit} agendamentos</span>
                    </div>
                    {plan.landing_page && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Landing Page</span>
                      </div>
                    )}
                    {plan.whatsapp_integration && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>WhatsApp</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={() => handleSubscribe(plan)}
                    variant="outline"
                    className="w-full py-2 text-sm border-gray-300 hover:bg-gray-50"
                  >
                    {subscriptionStatus.isInTrial ? 'Trocar Plano' : 'Escolher Plano'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-2xl">
          <DialogHeader className="text-center pb-4">
            <DialogTitle className="text-xl font-bold">
              Finalizar Assinatura
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {selectedPlan?.name} • R$ {Number(selectedPlan?.price || 0).toFixed(2)}/mês
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 text-sm">{errorMessage}</p>
                </div>
              </div>
            )}

            {!pixPayment ? (
              /* Tela inicial - Gerar PIX */
              <div className="text-center space-y-6">
                <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Pagamento via PIX</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Pagamento instantâneo e seguro através do PIX
                  </p>
                  
                  <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Total a pagar:</span>
                      <span className="text-2xl font-bold text-green-600">
                        R$ {Number(selectedPlan?.price || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handlePixPayment}
                  disabled={pixLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg"
                >
                  {pixLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Gerando PIX...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      Gerar código PIX
                    </div>
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setErrorMessage('');
                  }}
                  className="w-full rounded-xl"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              /* Tela com PIX gerado */
              <div className="space-y-4">
                {/* Header com valor */}
                <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    R$ {Number(pixPayment.amount).toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Expira em: {new Date(pixPayment.expires_at).toLocaleString('pt-BR')}
                  </p>
                </div>

                {/* Status de aguardando pagamento */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <p className="text-blue-800 font-medium text-sm">Aguardando pagamento...</p>
                  </div>
                  <p className="text-blue-700 text-xs">
                    Sua assinatura será ativada automaticamente após o pagamento.
                  </p>
                </div>

                {/* Botão para mostrar/ocultar QR Code */}
                <Button 
                  onClick={() => setShowQrCode(!showQrCode)}
                  variant="outline"
                  className="w-full py-3 rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                >
                  <div className="flex items-center gap-2">
                    {showQrCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showQrCode ? 'Ocultar QR Code' : 'Mostrar QR Code'}
                  </div>
                </Button>

                {/* QR Code (mostrado condicionalmente) */}
                {showQrCode && (
                  <div className="bg-white p-6 rounded-xl border border-gray-200 text-center">
                    <p className="text-sm text-gray-600 mb-4">Escaneie com o app do seu banco</p>
                    {pixPayment.qr_code_base64 ? (
                      <img 
                        src={`data:image/png;base64,${pixPayment.qr_code_base64}`} 
                        alt="QR Code PIX" 
                        className="mx-auto w-40 h-40 border border-gray-200 rounded-lg"
                      />
                    ) : (
                      <div className="w-40 h-40 mx-auto bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                        <QrCode className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                )}

                {/* Código PIX para cópia */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-sm text-gray-700 mb-3">Código PIX (Copia e Cola):</h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={pixPayment.qr_code} 
                      readOnly 
                      className="flex-1 text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-gray-700"
                    />
                    <Button 
                      size="sm" 
                      variant={copiedText ? "default" : "outline"}
                      onClick={() => handleCopyPixCode(pixPayment.qr_code)}
                      className={`px-4 rounded-lg ${copiedText ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                    >
                      {copiedText ? (
                        <div className="flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span className="text-xs">Copiado!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                          <span className="text-xs">Copiar</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Ações finais */}
                <div className="space-y-2 pt-2">
                  <Button 
                    variant="outline"
                    onClick={() => setPixPayment(null)}
                    className="w-full rounded-xl text-sm"
                  >
                    Gerar novo código PIX
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setShowPaymentModal(false);
                      setErrorMessage('');
                      setPixPayment(null);
                      setShowQrCode(false);
                      setCopiedText(false);
                      if (pixStatusInterval) {
                        clearInterval(pixStatusInterval);
                        setPixStatusInterval(null);
                      }
                    }}
                    className="w-full rounded-xl text-sm"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Cancelar Assinatura</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-2 sm:p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 text-sm font-medium">{errorMessage}</p>
                </div>
              </div>
            )}
            
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-red-800 text-sm">
                ⚠️ Antes de cancelar, gostaríamos de entender melhor sua experiência para podermos melhorar nosso serviço.
              </p>
            </div>

            <div className="space-y-4">
              {/* Pergunta 1: Motivo do cancelamento */}
              <div>
                <Label className="text-sm font-medium block mb-2">
                  1. Qual o principal motivo para cancelar sua assinatura?
                </Label>
                <Select value={cancelReason.reason} onValueChange={(value) => setCancelReason({...cancelReason, reason: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preco">Preço muito alto</SelectItem>
                    <SelectItem value="recursos">Não uso os recursos suficientes</SelectItem>
                    <SelectItem value="complexidade">Sistema muito complexo</SelectItem>
                    <SelectItem value="suporte">Problemas com suporte</SelectItem>
                    <SelectItem value="concorrente">Encontrei uma alternativa melhor</SelectItem>
                    <SelectItem value="negocio">Fechando/mudando o negócio</SelectItem>
                    <SelectItem value="temporario">Pausa temporária</SelectItem>
                    <SelectItem value="outro">Outro motivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pergunta 2: Satisfação */}
              <div>
                <Label className="text-sm font-medium block mb-2">
                  2. Como você avalia sua experiência com o Horaly?
                </Label>
                <Select value={cancelReason.satisfaction} onValueChange={(value) => setCancelReason({...cancelReason, satisfaction: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma avaliação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ Excelente</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ Bom</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ Regular</SelectItem>
                    <SelectItem value="2">⭐⭐ Ruim</SelectItem>
                    <SelectItem value="1">⭐ Péssimo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pergunta 3: Recomendação */}
              <div>
                <Label className="text-sm font-medium block mb-2">
                  3. Você recomendaria o Horaly para outros estabelecimentos?
                </Label>
                <Select value={cancelReason.recommendation} onValueChange={(value) => setCancelReason({...cancelReason, recommendation: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="definitivamente">Definitivamente sim</SelectItem>
                    <SelectItem value="provavelmente">Provavelmente sim</SelectItem>
                    <SelectItem value="neutro">Neutro</SelectItem>
                    <SelectItem value="provavelmente_nao">Provavelmente não</SelectItem>
                    <SelectItem value="definitivamente_nao">Definitivamente não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-yellow-800 text-sm">
                💡 <strong>Que tal uma pausa?</strong> Você pode reativar sua assinatura a qualquer momento. 
                Seus dados permanecerão seguros conosco.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCancelModal(false);
                  setErrorMessage('');
                }}
                className="flex-1"
              >
                Continuar com o Plano
              </Button>
              <Button 
                onClick={handleCancelConfirm}
                disabled={cancelLoading || !cancelReason.reason || !cancelReason.satisfaction || !cancelReason.recommendation}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {cancelLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600 text-center">Sucesso!</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {successMessage}
              </p>
              <p className="text-sm text-gray-500">
                A página será atualizada automaticamente.
              </p>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.reload();
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Acesso Negado */}
      <Dialog open={showAccessModal} onOpenChange={setShowAccessModal}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              {subscriptionStatus.status === 'overdue' ? 'Pagamento Pendente' : 
               subscriptionStatus.hasExpiredSubscription ? 'Assinatura Expirada' : 'Ação Necessária'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {(page.props as any).flash?.error || 
               (subscriptionStatus.status === 'overdue' ? 'Seu último pagamento foi rejeitado. Renove para reativar o acesso completo.' :
                subscriptionStatus.hasExpiredSubscription ? 'Seu período de teste expirou. Escolha um plano para continuar.' :
                'Acesso bloqueado devido ao status da assinatura.')}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button 
              onClick={() => {
                setShowAccessModal(false);
                if (subscriptionStatus.status === 'overdue' || subscriptionStatus.hasExpiredSubscription) {
                  handleSubscribe(currentPlan);
                }
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              {subscriptionStatus.status === 'overdue' ? '💳 Renovar Assinatura' : '🚀 Escolher Plano'}
            </Button>
            
            <Button 
              onClick={() => setShowAccessModal(false)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EstablishmentAppLayout>
  );
}