import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { MessageCircle, QrCode, CheckCircle, Save, Clock, Gift, Megaphone, X, Shield, Lock, RefreshCw, Power, Bell, Users, Calendar, Play, Pause, BarChart3, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Establishment {
    id: number;
    name: string;
    whatsapp_instance_id: string | null;
    whatsapp_connected: boolean;
    whatsapp_confirmation_message: string | null;
    whatsapp_welcome_message: string | null;
    whatsapp_reminder_message: string | null;
    whatsapp_birthday_message: string | null;
    whatsapp_promotion_message: string | null;
    whatsapp_cancellation_message: string | null;
    reminder_enabled: boolean;
    confirmation_enabled: boolean;
    welcome_enabled: boolean;
    birthday_enabled: boolean;
    promotion_enabled: boolean;
    cancellation_enabled: boolean;
    reminder_hours_before: number;
}

interface Service {
    id: number;
    name: string;
    price: number;
    duration: number;
}

interface Campaign {
    id: number;
    name: string;
    message: string;
    status: 'draft' | 'running' | 'paused' | 'completed';
    sent_count: number;
    delivered_count: number;
    failed_count: number;
    target_type: 'all' | 'individual' | 'period';
    delay_minutes: number;
    service?: Service | null;
    promotional_price?: number | null;
    created_at: string;
}

interface NotificationsPageProps {
    establishment: Establishment;
    whatsappStatus?: any;
    planFeatures?: string[];
    services?: Service[];
    campaigns?: Campaign[];
    campaignStats?: {
        total_sent: number;
        total_delivered: number;
        total_failed: number;
        total_in_queue: number;
    };
}

export default function NotificationsPage({ 
    establishment, 
    whatsappStatus: initialWhatsappStatus, 
    planFeatures = [], 
    services = [],
    campaigns: initialCampaigns = [], 
    campaignStats = { total_sent: 0, total_delivered: 0, total_failed: 0, total_in_queue: 0 } 
}: NotificationsPageProps) {
    const [activeTab, setActiveTab] = useState('reminders');
    const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
    const [selectedClients, setSelectedClients] = useState<number[]>([]);
    const [showCampaignForm, setShowCampaignForm] = useState(false);
    const [clients, setClients] = useState<Array<{id: number, name: string, phone: string}>>([]);
    const [loadingClients, setLoadingClients] = useState(false);
    
    // Formulário para campanhas
    const campaignForm = useForm({
        name: '',
        message: '',
        target_type: 'all',
        selected_clients: [] as number[],
        period_start: '',
        period_end: '',
        delay_minutes: 1,
        service_id: '',
        promotional_price: '',
    });
    const [whatsappQrCode, setWhatsappQrCode] = useState<string | null>(null);
    const [whatsappStatus, setWhatsappStatus] = useState<'disconnected' | 'connecting' | 'connected'>(() => {
        // Check localStorage for persisted connection state first
        const persistedStatus = localStorage.getItem(`whatsapp_status_${establishment.id}`);
        
        // Priority 1: Initialize status from backend props
        if (initialWhatsappStatus?.connected) {
            return 'connected';
        }
        
        // Priority 2: Use establishment's whatsapp_status field
        if (establishment.whatsapp_status === 'connected') {
            return 'connected';
        }
        
        // Priority 3: Use persisted status if connected and we have instance
        if (persistedStatus === 'connected' && establishment.whatsapp_instance_id) {
            return 'connected';
        }
        
        return 'disconnected';
    });
    const [isConnectingWhatsapp, setIsConnectingWhatsapp] = useState(false);

    // Settings form with notification toggles and timing
    const settingsForm = useForm({
        // Notification toggles
        reminder_enabled: establishment.reminder_enabled ?? true,
        confirmation_enabled: establishment.confirmation_enabled ?? true,
        welcome_enabled: establishment.welcome_enabled ?? true,
        birthday_enabled: establishment.birthday_enabled ?? true,
        promotion_enabled: establishment.promotion_enabled ?? true,
        cancellation_enabled: establishment.cancellation_enabled ?? true,
        
        // Timing settings
        reminder_hours_before: establishment.reminder_hours_before ?? 24,
        
        // Messages
        whatsapp_reminder_message: establishment.whatsapp_reminder_message || `*Está chegando! 🕑*

Olá {cliente}, você tem um agendamento confirmado no {estabelecimento} para {data} às {hora}.

📅 *Serviço:* {servico}
📍 *Endereço:* {endereco}

➡️ _Não responda esta mensagem caso tenha dúvida contate diretamente:_
📞 {telefone}

Aguardamos você! 😊`,

        whatsapp_confirmation_message: establishment.whatsapp_confirmation_message || `✅ *Agendamento Confirmado*

Olá {cliente}, 

Seu agendamento foi confirmado com sucesso!

📅 *Data:* {data}
🕐 *Horário:* {hora}
✂️ *Serviço:* {servico}
💰 *Valor:* {valor}

📍 *{estabelecimento}*
📞 *{telefone}*

Aguardamos você! 😊`,

        whatsapp_welcome_message: establishment.whatsapp_welcome_message || `🙏 *Bem-vindo(a) ao {estabelecimento}!*

Olá {cliente}, 

É um prazer tê-lo(a) como nosso cliente! 😊

🌟 *Nossos serviços:*
{lista_servicos}

📅 *Para agendar:*
📞 {telefone}
🌐 {link_agendamento}

📍 *Endereço:* {endereco}

Aguardamos sua visita! ✨`,

        whatsapp_birthday_message: establishment.whatsapp_birthday_message || `🎉 *Parabéns pelo seu aniversário!*

Olá {cliente}, 

A equipe do *{estabelecimento}* deseja um feliz aniversário! 🎂

🎁 *Oferta especial de aniversário:*
*15% de desconto* em qualquer serviço até o final do mês!

📅 Agende já: {telefone}
📍 {endereco}

Comemore conosco! 🥳✨`,

        whatsapp_promotion_message: establishment.whatsapp_promotion_message || `🔥 *PROMOÇÃO ESPECIAL*

Olá {cliente}, 

Não perca esta oportunidade incrível no *{estabelecimento}*!

💰 *{titulo_promocao}*
{descricao_promocao}

⏰ *Válido até:* {data_validade}
📅 *Agende já:* {telefone}

📍 {endereco}

Corre que é por tempo limitado! 🏃‍♀️💨`,

        whatsapp_cancellation_message: establishment.whatsapp_cancellation_message || `❌ *Agendamento Cancelado*

Olá {cliente}, 

Seu agendamento foi cancelado:

📅 *Data:* {data}
🕐 *Horário:* {hora}
✂️ *Serviço:* {servico}

😔 Sentimos muito! Para reagendar entre em contato:
📞 {telefone}

Esperamos vê-lo em breve! 🙏`,
    });

    // Persist WhatsApp status to localStorage
    const persistWhatsappStatus = (status: 'disconnected' | 'connecting' | 'connected') => {
        const key = `whatsapp_status_${establishment.id}`;
        localStorage.setItem(key, status);
    };

    // Update status and persist
    const updateWhatsappStatus = (status: 'disconnected' | 'connecting' | 'connected') => {
        setWhatsappStatus(status);
        persistWhatsappStatus(status);
    };

    // Initialize WhatsApp status on component mount - prioritize server data over localStorage
    useEffect(() => {
        const persistedStatus = localStorage.getItem(`whatsapp_status_${establishment.id}`);
        
        // If server already provided status, trust it and don't make additional API calls
        if (initialWhatsappStatus && initialWhatsappStatus.connected) {
            // Server says connected, trust it
            updateWhatsappStatus('connected');
            return;
        }
        
        // If server data shows connected in DB, trust it too
        if (establishment.whatsapp_status === 'connected') {
            updateWhatsappStatus('connected');
            return;
        }
        
        // Only make API call if we have instance but no clear connected status
        if (establishment.whatsapp_instance_id && (!persistedStatus || persistedStatus !== 'connected')) {
            // Only check if we don't have any indication of connection
            if (establishment.whatsapp_status !== 'connected' && !initialWhatsappStatus?.connected) {
                checkWhatsappStatus();
            }
        } else if (persistedStatus === 'connected') {
            setWhatsappStatus('connected');
        }
    }, []);

    // Smart status verification - only check when window regains focus or after long inactivity
    useEffect(() => {
        if (whatsappStatus === 'connected' && establishment.whatsapp_instance_id) {
            let lastActivity = Date.now();
            let inactivityTimeout: NodeJS.Timeout;
            
            // Check when window regains focus (user comes back to tab)
            const handleFocus = () => {
                checkWhatsappStatus();
                lastActivity = Date.now();
            };
            
            // Track user activity to reset inactivity timer
            const handleActivity = () => {
                lastActivity = Date.now();
                clearTimeout(inactivityTimeout);
                
                // Only check again after 5 minutes of inactivity
                inactivityTimeout = setTimeout(() => {
                    if (Date.now() - lastActivity >= 300000) { // 5 minutes
                        checkWhatsappStatus();
                    }
                }, 300000);
            };
            
            window.addEventListener('focus', handleFocus);
            window.addEventListener('click', handleActivity);
            window.addEventListener('keydown', handleActivity);
            window.addEventListener('scroll', handleActivity);
            
            // Initial activity setup
            handleActivity();
            
            return () => {
                window.removeEventListener('focus', handleFocus);
                window.removeEventListener('click', handleActivity);
                window.removeEventListener('keydown', handleActivity);
                window.removeEventListener('scroll', handleActivity);
                clearTimeout(inactivityTimeout);
            };
        }
    }, [whatsappStatus, establishment.whatsapp_instance_id]);

    const checkWhatsappStatus = async () => {
        try {
            const response = await fetch('/whatsapp/status', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            
            // Determine new status
            let newStatus: 'disconnected' | 'connecting' | 'connected';
            if (data.connected) {
                newStatus = 'connected';
            } else if (data.status === 'connecting') {
                newStatus = 'connecting';
            } else {
                newStatus = 'disconnected';
            }
            
            // Only update if status actually changed
            if (newStatus !== whatsappStatus) {
                updateWhatsappStatus(newStatus);
            } else {
            }
        } catch (error) {
            console.error('Error checking WhatsApp status:', error);
            // Only update to disconnected if we're not already disconnected
            if (whatsappStatus !== 'disconnected') {
                updateWhatsappStatus('disconnected');
            }
        }
    };

    const connectWhatsapp = async () => {
        setIsConnectingWhatsapp(true);
        updateWhatsappStatus('connecting');

        try {
            const response = await fetch('/establishment/integrations/whatsapp/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    instance_id: `horaly_${establishment.id}_${Date.now()}`,
                }),
            });

            const data = await response.json();

            if (data.success) {
                if (data.qr_code) {
                    setWhatsappQrCode(data.qr_code);
                    // Poll for connection status
                    pollWhatsappConnection();
                } else if (data.connected || data.data?.connected) {
                    // Already connected
                    updateWhatsappStatus('connected');
                    toast.success('WhatsApp já está conectado!');
                } else {
                    // QR code not ready yet, try polling for it
                    console.log('QR Code not ready, starting polling...');
                    pollForQRCode();
                }
            } else {
                console.log('Error response:', data);
                toast.error(data.message || 'Erro ao conectar WhatsApp');
                updateWhatsappStatus('disconnected');
            }
        } catch (error) {
            toast.error('Erro ao conectar WhatsApp');
            updateWhatsappStatus('disconnected');
        } finally {
            setIsConnectingWhatsapp(false);
        }
    };

    const pollForQRCode = () => {
        let attempts = 0;
        const maxAttempts = 15; // 15 attempts * 2 seconds = 30 seconds
        
        const interval = setInterval(async () => {
            attempts++;
            
            try {
                const response = await fetch('/whatsapp/status');
                const data = await response.json();
                
                if (data.data?.qr_code) {
                    setWhatsappQrCode(data.data.qr_code);
                    clearInterval(interval);
                    pollWhatsappConnection();
                    return;
                } else if (data.data?.connected || data.connected) {
                    updateWhatsappStatus('connected');
                    clearInterval(interval);
                    toast.success('WhatsApp conectado com sucesso!');
                    return;
                }
                
                // Stop polling after max attempts
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    updateWhatsappStatus('disconnected');
                    toast.error('Não foi possível obter o QR Code. Tente novamente.');
                }
            } catch (error) {
                console.error('Error polling for QR code:', error);
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    updateWhatsappStatus('disconnected');
                }
            }
        }, 2000);
    };

    const pollWhatsappConnection = () => {
        let attempts = 0;
        const maxAttempts = 40; // 40 attempts * 3 seconds = 2 minutes
        
        const interval = setInterval(async () => {
            attempts++;
            
            try {
                const response = await fetch('/whatsapp/status');
                const data = await response.json();
                
                if (data.data?.connected || data.connected) {
                    updateWhatsappStatus('connected');
                    setWhatsappQrCode(null);
                    clearInterval(interval);
                    toast.success('WhatsApp conectado com sucesso!');
                    return;
                }
                
                // Stop polling after max attempts
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    // Only disconnect if we're still in connecting state
                    if (whatsappStatus === 'connecting') {
                        updateWhatsappStatus('disconnected');
                        setWhatsappQrCode(null);
                        toast.error('Timeout na conexão do WhatsApp');
                    }
                }
            } catch (error) {
                console.error('Error polling WhatsApp status:', error);
                // Only stop on repeated errors
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    if (whatsappStatus === 'connecting') {
                        updateWhatsappStatus('disconnected');
                        setWhatsappQrCode(null);
                        toast.error('Erro na verificação de conexão');
                    }
                }
            }
        }, 3000);
    };

    const disconnectWhatsapp = async () => {
        try {
            const response = await fetch('/whatsapp/disconnect', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();
            
            if (data.success) {
                updateWhatsappStatus('disconnected');
                setWhatsappQrCode(null);
                toast.success('WhatsApp desconectado');
            }
        } catch (error) {
            toast.error('Erro ao desconectar WhatsApp');
        }
    };


    const handleSettingsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        settingsForm.patch('/establishment/notifications/settings', {
            onSuccess: () => toast.success('Configurações de notificações e lembretes atualizadas!'),
            onError: () => toast.error('Erro ao atualizar configurações'),
        });
    };

    const loadClients = async () => {
        if (clients.length > 0) return; // Already loaded

        setLoadingClients(true);
        try {
            const response = await fetch('/establishment/clients', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const result = await response.json();
            
            if (result.success) {
                setClients(result.clients);
            } else {
                toast.error('Erro ao carregar clientes');
            }
        } catch (error) {
            toast.error('Erro ao carregar clientes');
            console.error('Error loading clients:', error);
        } finally {
            setLoadingClients(false);
        }
    };

    const handleClientSelection = (clientId: number) => {
        setSelectedClients(prev => {
            const newSelected = prev.includes(clientId) 
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId];
            
            campaignForm.setData('selected_clients', newSelected);
            return newSelected;
        });
    };

    return (
        <EstablishmentAppLayout title="Notificações" planFeatures={planFeatures}>
            <Head title="Notificações" />

            <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <MessageCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">Notificações e Lembretes</h1>
                        </div>
                        <p className="text-muted-foreground">Configure WhatsApp e mensagens automáticas para seus clientes</p>
                    </div>
                </div>

                {/* WhatsApp Connection Section */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        {/* Estado Desconectado */}
                        {whatsappStatus === 'disconnected' && (
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-shrink-0 flex justify-center md:justify-start">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 border-4 border-green-200">
                                        <MessageCircle className="h-10 w-10 text-green-600" />
                                    </div>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-semibold mb-2">Conecte seu WhatsApp</h3>
                                    <p className="text-muted-foreground mb-6">
                                        Escaneie o QR Code para iniciar a integração com o WhatsApp e começar a enviar mensagens automáticas.
                                    </p>
                                    <Button 
                                        onClick={connectWhatsapp}
                                        disabled={isConnectingWhatsapp}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                                    >
                                        {isConnectingWhatsapp ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Gerando QR Code...
                                            </>
                                        ) : (
                                            <>
                                                <MessageCircle className="mr-2 h-4 w-4" />
                                                Conectar WhatsApp
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* QR Code */}
                        {whatsappStatus === 'connecting' && whatsappQrCode && (
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-shrink-0 flex justify-center">
                                    <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                                        <img 
                                            src={whatsappQrCode} 
                                            alt="QR Code WhatsApp" 
                                            className="w-48 h-48"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold mb-4">Escaneie o QR Code</h3>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                                                1
                                            </div>
                                            <span className="text-sm">Abra o WhatsApp no seu celular</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                                                2
                                            </div>
                                            <span className="text-sm">Acesse Configurações &gt; Aparelhos conectados</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-medium">
                                                3
                                            </div>
                                            <span className="text-sm">Aponte a câmera para o QR Code</span>
                                        </div>
                                    </div>
                                    <Alert className="mb-4">
                                        <QrCode className="h-4 w-4" />
                                        <AlertDescription>
                                            O QR Code expira em 2 minutos. Conecte rapidamente!
                                        </AlertDescription>
                                    </Alert>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline"
                                            onClick={connectWhatsapp}
                                            disabled={isConnectingWhatsapp}
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Atualizar QR Code
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Estado Conectado */}
                        {whatsappStatus === 'connected' && (
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-shrink-0 flex flex-col items-center gap-4">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 border-4 border-green-200">
                                        <MessageCircle className="h-10 w-10 text-green-600" />
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
                                        <CheckCircle className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-green-600 mb-4">WhatsApp Conectado</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                                <Shield className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <h6 className="font-medium text-sm">Proteção Anti-Spam</h6>
                                                <p className="text-xs text-muted-foreground">Sistema inteligente contra envios em massa</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                                <Lock className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <h6 className="font-medium text-sm">Mensagens Seguras</h6>
                                                <p className="text-xs text-muted-foreground">Criptografia e conformidade WhatsApp</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                                <Clock className="h-4 w-4 text-orange-600" />
                                            </div>
                                            <div>
                                                <h6 className="font-medium text-sm">Envios Controlados</h6>
                                                <p className="text-xs text-muted-foreground">Sistema de fila inteligente</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline"
                                        onClick={disconnectWhatsapp}
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                        <Power className="mr-2 h-4 w-4" />
                                        Desconectar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tabs Section */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 h-auto min-h-[3rem] p-1">
                        <TabsTrigger value="reminders" className="flex items-center gap-1 md:gap-2 px-1 md:px-2 py-2 h-auto text-xs md:text-sm">
                            <Clock className="h-3 w-3 md:h-4 md:w-4" />
                            <span>Lembretes</span>
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center gap-1 md:gap-2 px-1 md:px-2 py-2 h-auto text-xs md:text-sm">
                            <Bell className="h-3 w-3 md:h-4 md:w-4" />
                            <span>Notificações</span>
                        </TabsTrigger>
                        <TabsTrigger value="birthday" className="flex items-center gap-1 md:gap-2 px-1 md:px-2 py-2 h-auto text-xs md:text-sm">
                            <Gift className="h-3 w-3 md:h-4 md:w-4" />
                            <span>Aniversário</span>
                        </TabsTrigger>
                        <TabsTrigger value="promotions" className="flex items-center gap-1 md:gap-2 px-1 md:px-2 py-2 h-auto text-xs md:text-sm">
                            <Megaphone className="h-3 w-3 md:h-4 md:w-4" />
                            <span>Promoções</span>
                        </TabsTrigger>
                        <TabsTrigger value="campaigns" className="flex items-center gap-1 md:gap-2 px-1 md:px-2 py-2 h-auto text-xs md:text-sm">
                            <Users className="h-3 w-3 md:h-4 md:w-4" />
                            <span>Campanhas</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Lembretes */}
                    <TabsContent value="reminders" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Lembretes de Agendamento
                                </CardTitle>
                                <CardDescription>
                                    Configure quando e como enviar lembretes automáticos aos seus clientes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <Label className="text-base font-medium">Ativar Lembretes</Label>
                                                <p className="text-sm text-muted-foreground">Enviar lembrete automático antes do agendamento</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settingsForm.data.reminder_enabled}
                                            onCheckedChange={(checked) => settingsForm.setData('reminder_enabled', checked)}
                                        />
                                    </div>
                                    
                                    {settingsForm.data.reminder_enabled && (
                                        <div className="space-y-6 border-t pt-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Enviar antes do agendamento</Label>
                                                    <Select
                                                        value={settingsForm.data.reminder_hours_before.toString()}
                                                        onValueChange={(value) => settingsForm.setData('reminder_hours_before', parseInt(value))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1">1 hora</SelectItem>
                                                            <SelectItem value="2">2 horas</SelectItem>
                                                            <SelectItem value="6">6 horas</SelectItem>
                                                            <SelectItem value="12">12 horas</SelectItem>
                                                            <SelectItem value="24">24 horas (1 dia)</SelectItem>
                                                            <SelectItem value="48">48 horas (2 dias)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label>Template da Mensagem</Label>
                                                    <div className="flex gap-1 text-xs text-muted-foreground">
                                                        <span>Variáveis disponíveis:</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-1 md:gap-2 mb-3">
                                                    {['{cliente}', '{data}', '{hora}', '{servico}', '{estabelecimento}', '{endereco}', '{telefone}'].map((variable) => (
                                                        <Button
                                                            key={variable}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 md:h-7 text-xs px-2 md:px-3"
                                                            onClick={() => {
                                                                const textarea = document.querySelector('textarea[name="reminder_message"]') as HTMLTextAreaElement;
                                                                if (textarea) {
                                                                    const start = textarea.selectionStart;
                                                                    const end = textarea.selectionEnd;
                                                                    const currentValue = settingsForm.data.whatsapp_reminder_message;
                                                                    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
                                                                    settingsForm.setData('whatsapp_reminder_message', newValue);
                                                                    setTimeout(() => {
                                                                        textarea.focus();
                                                                        textarea.setSelectionRange(start + variable.length, start + variable.length);
                                                                    }, 0);
                                                                }
                                                            }}
                                                        >
                                                            {variable}
                                                        </Button>
                                                    ))}
                                                </div>
                                                
                                                <Textarea
                                                    name="reminder_message"
                                                    value={settingsForm.data.whatsapp_reminder_message}
                                                    onChange={(e) => settingsForm.setData('whatsapp_reminder_message', e.target.value)}
                                                    rows={8}
                                                    placeholder="Digite sua mensagem de lembrete..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    <Button type="submit" disabled={settingsForm.processing} className="w-full">
                                        {settingsForm.processing ? 'Salvando...' : 'Salvar Configurações de Lembretes'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notificações */}
                    <TabsContent value="notifications" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    Notificações de Sistema
                                </CardTitle>
                                <CardDescription>
                                    Configure mensagens automáticas de confirmação, boas-vindas e cancelamento
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSettingsSubmit} className="space-y-8">
                                    {/* Confirmation Message */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="h-5 w-5 text-green-600" />
                                                <div>
                                                    <Label className="text-base font-medium">Confirmação de Agendamento</Label>
                                                    <p className="text-sm text-muted-foreground">Enviar quando agendamento for confirmado</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={settingsForm.data.confirmation_enabled}
                                                onCheckedChange={(checked) => settingsForm.setData('confirmation_enabled', checked)}
                                            />
                                        </div>
                                        
                                        {settingsForm.data.confirmation_enabled && (
                                            <div className="ml-8 space-y-3">
                                                <div className="flex flex-wrap gap-1 md:gap-2 mb-3">
                                                    {['{cliente}', '{data}', '{hora}', '{servico}', '{valor}', '{estabelecimento}', '{telefone}'].map((variable) => (
                                                        <Button
                                                            key={variable}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 md:h-7 text-xs px-2 md:px-3"
                                                            onClick={() => {
                                                                const textarea = document.querySelector('textarea[name="confirmation_message"]') as HTMLTextAreaElement;
                                                                if (textarea) {
                                                                    const start = textarea.selectionStart;
                                                                    const end = textarea.selectionEnd;
                                                                    const currentValue = settingsForm.data.whatsapp_confirmation_message;
                                                                    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
                                                                    settingsForm.setData('whatsapp_confirmation_message', newValue);
                                                                    setTimeout(() => {
                                                                        textarea.focus();
                                                                        textarea.setSelectionRange(start + variable.length, start + variable.length);
                                                                    }, 0);
                                                                }
                                                            }}
                                                        >
                                                            {variable}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <Textarea
                                                    name="confirmation_message"
                                                    value={settingsForm.data.whatsapp_confirmation_message}
                                                    onChange={(e) => settingsForm.setData('whatsapp_confirmation_message', e.target.value)}
                                                    rows={8}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <Separator />

                                    {/* Welcome Message */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <MessageCircle className="h-5 w-5 text-purple-600" />
                                                <div>
                                                    <Label className="text-base font-medium">Mensagem de Boas-vindas</Label>
                                                    <p className="text-sm text-muted-foreground">Enviar para novos clientes</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={settingsForm.data.welcome_enabled}
                                                onCheckedChange={(checked) => settingsForm.setData('welcome_enabled', checked)}
                                            />
                                        </div>
                                        
                                        {settingsForm.data.welcome_enabled && (
                                            <div className="ml-8 space-y-3">
                                                <div className="flex flex-wrap gap-1 md:gap-2 mb-3">
                                                    {['{cliente}', '{estabelecimento}', '{telefone}', '{endereco}', '{lista_servicos}', '{link_agendamento}'].map((variable) => (
                                                        <Button
                                                            key={variable}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 md:h-7 text-xs px-2 md:px-3"
                                                            onClick={() => {
                                                                const textarea = document.querySelector('textarea[name="welcome_message"]') as HTMLTextAreaElement;
                                                                if (textarea) {
                                                                    const start = textarea.selectionStart;
                                                                    const end = textarea.selectionEnd;
                                                                    const currentValue = settingsForm.data.whatsapp_welcome_message;
                                                                    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
                                                                    settingsForm.setData('whatsapp_welcome_message', newValue);
                                                                    setTimeout(() => {
                                                                        textarea.focus();
                                                                        textarea.setSelectionRange(start + variable.length, start + variable.length);
                                                                    }, 0);
                                                                }
                                                            }}
                                                        >
                                                            {variable}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <Textarea
                                                    name="welcome_message"
                                                    value={settingsForm.data.whatsapp_welcome_message}
                                                    onChange={(e) => settingsForm.setData('whatsapp_welcome_message', e.target.value)}
                                                    rows={8}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <Separator />

                                    {/* Cancellation Message */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <X className="h-5 w-5 text-gray-600" />
                                                <div>
                                                    <Label className="text-base font-medium">Cancelamento</Label>
                                                    <p className="text-sm text-muted-foreground">Enviar quando agendamento for cancelado</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={settingsForm.data.cancellation_enabled}
                                                onCheckedChange={(checked) => settingsForm.setData('cancellation_enabled', checked)}
                                            />
                                        </div>
                                        
                                        {settingsForm.data.cancellation_enabled && (
                                            <div className="ml-8 space-y-3">
                                                <div className="flex flex-wrap gap-1 md:gap-2 mb-3">
                                                    {['{cliente}', '{data}', '{hora}', '{servico}', '{telefone}'].map((variable) => (
                                                        <Button
                                                            key={variable}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 md:h-7 text-xs px-2 md:px-3"
                                                            onClick={() => {
                                                                const textarea = document.querySelector('textarea[name="cancellation_message"]') as HTMLTextAreaElement;
                                                                if (textarea) {
                                                                    const start = textarea.selectionStart;
                                                                    const end = textarea.selectionEnd;
                                                                    const currentValue = settingsForm.data.whatsapp_cancellation_message;
                                                                    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
                                                                    settingsForm.setData('whatsapp_cancellation_message', newValue);
                                                                    setTimeout(() => {
                                                                        textarea.focus();
                                                                        textarea.setSelectionRange(start + variable.length, start + variable.length);
                                                                    }, 0);
                                                                }
                                                            }}
                                                        >
                                                            {variable}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <Textarea
                                                    name="cancellation_message"
                                                    value={settingsForm.data.whatsapp_cancellation_message}
                                                    onChange={(e) => settingsForm.setData('whatsapp_cancellation_message', e.target.value)}
                                                    rows={8}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <Button type="submit" disabled={settingsForm.processing} className="w-full">
                                        {settingsForm.processing ? 'Salvando...' : 'Salvar Configurações de Notificações'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Mensagem Aniversário */}
                    <TabsContent value="birthday" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gift className="h-5 w-5" />
                                    Mensagens de Aniversário
                                </CardTitle>
                                <CardDescription>
                                    Configure mensagens automáticas para aniversariantes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <Label className="text-base font-medium">Ativar Mensagens de Aniversário</Label>
                                                <p className="text-sm text-muted-foreground">Enviar mensagem automática no aniversário do cliente</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settingsForm.data.birthday_enabled}
                                            onCheckedChange={(checked) => settingsForm.setData('birthday_enabled', checked)}
                                        />
                                    </div>
                                    
                                    {settingsForm.data.birthday_enabled && (
                                        <div className="space-y-6 border-t pt-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label>Template da Mensagem de Aniversário</Label>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-1 md:gap-2 mb-3">
                                                    {['{cliente}', '{estabelecimento}', '{telefone}', '{endereco}'].map((variable) => (
                                                        <Button
                                                            key={variable}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 md:h-7 text-xs px-2 md:px-3"
                                                            onClick={() => {
                                                                const textarea = document.querySelector('textarea[name="birthday_message"]') as HTMLTextAreaElement;
                                                                if (textarea) {
                                                                    const start = textarea.selectionStart;
                                                                    const end = textarea.selectionEnd;
                                                                    const currentValue = settingsForm.data.whatsapp_birthday_message;
                                                                    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
                                                                    settingsForm.setData('whatsapp_birthday_message', newValue);
                                                                    setTimeout(() => {
                                                                        textarea.focus();
                                                                        textarea.setSelectionRange(start + variable.length, start + variable.length);
                                                                    }, 0);
                                                                }
                                                            }}
                                                        >
                                                            {variable}
                                                        </Button>
                                                    ))}
                                                </div>
                                                
                                                <Textarea
                                                    name="birthday_message"
                                                    value={settingsForm.data.whatsapp_birthday_message}
                                                    onChange={(e) => settingsForm.setData('whatsapp_birthday_message', e.target.value)}
                                                    rows={8}
                                                    placeholder="Digite sua mensagem de aniversário..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    <Button type="submit" disabled={settingsForm.processing} className="w-full">
                                        {settingsForm.processing ? 'Salvando...' : 'Salvar Configurações de Aniversário'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Promoções */}
                    <TabsContent value="promotions" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Megaphone className="h-5 w-5" />
                                    Promoções e Ofertas
                                </CardTitle>
                                <CardDescription>
                                    Configure mensagens promocionais para seus clientes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSettingsSubmit} className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <Label className="text-base font-medium">Ativar Mensagens Promocionais</Label>
                                                <p className="text-sm text-muted-foreground">Permitir envio de campanhas promocionais</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={settingsForm.data.promotion_enabled}
                                            onCheckedChange={(checked) => settingsForm.setData('promotion_enabled', checked)}
                                        />
                                    </div>
                                    
                                    {settingsForm.data.promotion_enabled && (
                                        <div className="space-y-6 border-t pt-6">
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label>Template Padrão para Promoções</Label>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-1 md:gap-2 mb-3">
                                                    {['{cliente}', '{estabelecimento}', '{telefone}', '{endereco}', '{titulo_promocao}', '{descricao_promocao}', '{data_validade}'].map((variable) => (
                                                        <Button
                                                            key={variable}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 md:h-7 text-xs px-2 md:px-3"
                                                            onClick={() => {
                                                                const textarea = document.querySelector('textarea[name="promotion_message"]') as HTMLTextAreaElement;
                                                                if (textarea) {
                                                                    const start = textarea.selectionStart;
                                                                    const end = textarea.selectionEnd;
                                                                    const currentValue = settingsForm.data.whatsapp_promotion_message;
                                                                    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
                                                                    settingsForm.setData('whatsapp_promotion_message', newValue);
                                                                    setTimeout(() => {
                                                                        textarea.focus();
                                                                        textarea.setSelectionRange(start + variable.length, start + variable.length);
                                                                    }, 0);
                                                                }
                                                            }}
                                                        >
                                                            {variable}
                                                        </Button>
                                                    ))}
                                                </div>
                                                
                                                <Textarea
                                                    name="promotion_message"
                                                    value={settingsForm.data.whatsapp_promotion_message}
                                                    onChange={(e) => settingsForm.setData('whatsapp_promotion_message', e.target.value)}
                                                    rows={8}
                                                    placeholder="Digite seu template de promoção..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    <Button type="submit" disabled={settingsForm.processing} className="w-full">
                                        {settingsForm.processing ? 'Salvando...' : 'Salvar Configurações de Promoções'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Disparo de Mensagens - Campanhas */}
                    <TabsContent value="campaigns" className="mt-6">
                        <div className="space-y-6">
                            {/* Campaign Statistics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card>
                                    <CardContent className="p-3 md:p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                                <BarChart3 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Total Enviadas</p>
                                                <p className="text-xl md:text-2xl font-bold">{campaignStats.total_sent.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-3 md:p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                                <CheckCircle className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Entregues</p>
                                                <p className="text-xl md:text-2xl font-bold">{campaignStats.total_delivered.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-3 md:p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                                                <X className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Falharam</p>
                                                <p className="text-xl md:text-2xl font-bold">{campaignStats.total_failed.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-3 md:p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Na Fila</p>
                                                <p className="text-xl md:text-2xl font-bold">{campaignStats.total_in_queue.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Campaign Management */}
                            <Card>
                                <CardHeader>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Users className="h-5 w-5" />
                                                Disparo de Mensagens
                                            </CardTitle>
                                            <CardDescription>
                                                Crie e gerencie campanhas de mensagens para seus clientes
                                            </CardDescription>
                                        </div>
                                        <Button onClick={() => setShowCampaignForm(true)} className="w-full sm:w-auto">
                                            <Users className="mr-2 h-4 w-4" />
                                            Nova Campanha
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {showCampaignForm ? (
                                        <form className="space-y-6" onSubmit={async (e) => {
                                            e.preventDefault();
                                            
                                            try {
                                                const response = await fetch('/establishment/campaigns', {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                                    },
                                                    body: JSON.stringify(campaignForm.data),
                                                });

                                                const result = await response.json();

                                                if (result.success) {
                                                    toast.success('Campanha criada com sucesso!');
                                                    setShowCampaignForm(false);
                                                    campaignForm.reset();
                                                    // Reload page to get updated campaigns
                                                    window.location.reload();
                                                } else {
                                                    toast.error(result.message || 'Erro ao criar campanha');
                                                }
                                            } catch (error) {
                                                toast.error('Erro ao criar campanha');
                                                console.error('Campaign creation error:', error);
                                            }
                                        }}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Nome da Campanha</Label>
                                                    <Input
                                                        value={campaignForm.data.name}
                                                        onChange={(e) => campaignForm.setData('name', e.target.value)}
                                                        placeholder="Ex: Promoção de Verão"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Delay entre mensagens (minutos)</Label>
                                                    <Select
                                                        value={campaignForm.data.delay_minutes.toString()}
                                                        onValueChange={(value) => campaignForm.setData('delay_minutes', parseFloat(value))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="0.5">30 segundos</SelectItem>
                                                            <SelectItem value="1">1 minuto</SelectItem>
                                                            <SelectItem value="2">2 minutos</SelectItem>
                                                            <SelectItem value="5">5 minutos</SelectItem>
                                                            <SelectItem value="15">15 minutos</SelectItem>
                                                            <SelectItem value="30">30 minutos</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            
                                            {/* Seleção de Serviço e Preço Promocional */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Serviço (opcional)</Label>
                                                    <Select
                                                        value={campaignForm.data.service_id || 'none'}
                                                        onValueChange={(value) => campaignForm.setData('service_id', value === 'none' ? '' : value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecione um serviço" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Nenhum serviço específico</SelectItem>
                                                            {services.map((service) => (
                                                                <SelectItem key={service.id} value={service.id.toString()}>
                                                                    {service.name} - R$ {parseFloat(service.price).toFixed(2).replace('.', ',')}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {campaignForm.data.service_id && (
                                                    <div className="space-y-2">
                                                        <Label>Preço Promocional (opcional)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={campaignForm.data.promotional_price}
                                                            onChange={(e) => campaignForm.setData('promotional_price', e.target.value)}
                                                            placeholder="Ex: 29,90"
                                                        />
                                                        {(() => {
                                                            const selectedService = services.find(s => s.id.toString() === campaignForm.data.service_id);
                                                            const promoPrice = parseFloat(campaignForm.data.promotional_price);
                                                            const servicePrice = selectedService ? parseFloat(selectedService.price) : 0;
                                                            if (selectedService && promoPrice && promoPrice < servicePrice) {
                                                                const discount = ((servicePrice - promoPrice) / servicePrice) * 100;
                                                                return (
                                                                    <p className="text-sm text-green-600">
                                                                        Desconto de {discount.toFixed(0)}% (De R$ {servicePrice.toFixed(2).replace('.', ',')} por R$ {promoPrice.toFixed(2).replace('.', ',')})
                                                                    </p>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Seleção de Clientes</Label>
                                                <Select
                                                    value={campaignForm.data.target_type}
                                                    onValueChange={(value) => {
                                                        campaignForm.setData('target_type', value as 'all' | 'individual' | 'period');
                                                        if (value === 'individual') {
                                                            loadClients();
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Todos os clientes</SelectItem>
                                                        <SelectItem value="individual">Selecionar individualmente</SelectItem>
                                                        <SelectItem value="period">Clientes por período de atendimento</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            
                                            {/* Seleção individual de clientes */}
                                            {campaignForm.data.target_type === 'individual' && (
                                                <div className="space-y-3">
                                                    <Label>Clientes ({selectedClients.length} selecionados)</Label>
                                                    {loadingClients ? (
                                                        <div className="flex items-center justify-center py-8">
                                                            <RefreshCw className="h-6 w-6 animate-spin" />
                                                            <span className="ml-2">Carregando clientes...</span>
                                                        </div>
                                                    ) : clients.length === 0 ? (
                                                        <div className="text-center py-8 text-muted-foreground">
                                                            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                                            <p className="mt-2">Nenhum cliente encontrado</p>
                                                        </div>
                                                    ) : (
                                                        <div className="max-h-64 overflow-y-auto border rounded-lg">
                                                            {clients.map((client) => (
                                                                <div
                                                                    key={client.id}
                                                                    className={`flex items-center p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                                                                        selectedClients.includes(client.id) ? 'bg-blue-50' : ''
                                                                    }`}
                                                                    onClick={() => handleClientSelection(client.id)}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedClients.includes(client.id)}
                                                                        onChange={() => handleClientSelection(client.id)}
                                                                        className="mr-3"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <p className="font-medium">{client.name}</p>
                                                                        <p className="text-sm text-muted-foreground">{client.phone}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {clients.length > 0 && (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const allIds = clients.map(c => c.id);
                                                                    setSelectedClients(allIds);
                                                                    campaignForm.setData('selected_clients', allIds);
                                                                }}
                                                            >
                                                                Selecionar Todos
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedClients([]);
                                                                    campaignForm.setData('selected_clients', []);
                                                                }}
                                                            >
                                                                Desmarcar Todos
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {campaignForm.data.target_type === 'period' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Data inicial</Label>
                                                        <Input
                                                            type="date"
                                                            value={campaignForm.data.period_start}
                                                            onChange={(e) => campaignForm.setData('period_start', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Data final</Label>
                                                        <Input
                                                            type="date"
                                                            value={campaignForm.data.period_end}
                                                            onChange={(e) => campaignForm.setData('period_end', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="space-y-3">
                                                <Label>Mensagem da Campanha</Label>
                                                <div className="flex flex-wrap gap-1 md:gap-2 mb-3">
                                                    {['{cliente}', '{estabelecimento}', '{telefone}', '{endereco}', '{servicos}', '{servico}', '{valor}', '{valor_original}', '{valor_promocional}', '{desconto}', '{duracao}'].map((variable) => (
                                                        <Button
                                                            key={variable}
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 md:h-7 text-xs px-2 md:px-3"
                                                            onClick={() => {
                                                                const textarea = document.querySelector('textarea[name="campaign_message"]') as HTMLTextAreaElement;
                                                                if (textarea) {
                                                                    const start = textarea.selectionStart;
                                                                    const end = textarea.selectionEnd;
                                                                    const currentValue = campaignForm.data.message;
                                                                    const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
                                                                    campaignForm.setData('message', newValue);
                                                                    setTimeout(() => {
                                                                        textarea.focus();
                                                                        textarea.setSelectionRange(start + variable.length, start + variable.length);
                                                                    }, 0);
                                                                }
                                                            }}
                                                        >
                                                            {variable}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <Textarea
                                                    name="campaign_message"
                                                    value={campaignForm.data.message}
                                                    onChange={(e) => campaignForm.setData('message', e.target.value)}
                                                    rows={6}
                                                    placeholder="Digite a mensagem da sua campanha..."
                                                    required
                                                />
                                            </div>
                                            
                                            <div className="flex gap-3">
                                                <Button type="submit" className="flex-1">
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Criar Campanha
                                                </Button>
                                                <Button type="button" variant="outline" onClick={() => setShowCampaignForm(false)}>
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-4">
                                            {campaigns.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                                    <h3 className="mt-4 text-lg font-semibold">Nenhuma campanha criada</h3>
                                                    <p className="text-muted-foreground">Comece criando sua primeira campanha de mensagens</p>
                                                    <Button className="mt-4" onClick={() => setShowCampaignForm(true)}>
                                                        <Users className="mr-2 h-4 w-4" />
                                                        Criar Primera Campanha
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {campaigns.map((campaign) => (
                                                        <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                            <div className="flex-1">
                                                                <h4 className="font-medium">{campaign.name}</h4>
                                                                {campaign.service && (
                                                                    <p className="text-sm font-medium text-blue-600 mb-1">
                                                                        {campaign.service.name} 
                                                                        {campaign.promotional_price ? (
                                                                            <span className="ml-1">
                                                                                - R$ {parseFloat(campaign.promotional_price).toFixed(2).replace('.', ',')} 
                                                                                <span className="line-through text-gray-500 ml-1">
                                                                                    R$ {parseFloat(campaign.service.price).toFixed(2).replace('.', ',')}
                                                                                </span>
                                                                            </span>
                                                                        ) : (
                                                                            <span className="ml-1">- R$ {parseFloat(campaign.service.price).toFixed(2).replace('.', ',')}</span>
                                                                        )}
                                                                    </p>
                                                                )}
                                                                <p className="text-sm text-muted-foreground">
                                                                    Enviadas: {campaign.sent_count} | Entregues: {campaign.delivered_count} | Falharam: {campaign.failed_count}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={campaign.status === 'running' ? 'default' : campaign.status === 'completed' ? 'secondary' : 'outline'}>
                                                                    {campaign.status === 'running' ? 'Rodando' : campaign.status === 'completed' ? 'Concluída' : 'Pausada'}
                                                                </Badge>
                                                                {campaign.status === 'running' ? (
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline"
                                                                        onClick={async () => {
                                                                            try {
                                                                                const response = await fetch(`/establishment/campaigns/${campaign.id}/pause`, {
                                                                                    method: 'POST',
                                                                                    headers: {
                                                                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                                                                    },
                                                                                });
                                                                                const result = await response.json();
                                                                                if (result.success) {
                                                                                    toast.success('Campanha pausada!');
                                                                                    window.location.reload();
                                                                                } else {
                                                                                    toast.error(result.message);
                                                                                }
                                                                            } catch (error) {
                                                                                toast.error('Erro ao pausar campanha');
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Pause className="h-4 w-4" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline"
                                                                        onClick={async () => {
                                                                            try {
                                                                                const response = await fetch(`/establishment/campaigns/${campaign.id}/start`, {
                                                                                    method: 'POST',
                                                                                    headers: {
                                                                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                                                                    },
                                                                                });
                                                                                const result = await response.json();
                                                                                if (result.success) {
                                                                                    toast.success('Campanha iniciada!');
                                                                                    window.location.reload();
                                                                                } else {
                                                                                    toast.error(result.message);
                                                                                }
                                                                            } catch (error) {
                                                                                toast.error('Erro ao iniciar campanha');
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Play className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                
                                                                {/* Botão de Exclusão - disponível para campanhas draft, completed ou paused */}
                                                                {['draft', 'completed', 'paused'].includes(campaign.status) && (
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline"
                                                                        onClick={async () => {
                                                                            if (!confirm('Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.')) {
                                                                                return;
                                                                            }
                                                                            
                                                                            try {
                                                                                const response = await fetch(`/establishment/campaigns/${campaign.id}`, {
                                                                                    method: 'DELETE',
                                                                                    headers: {
                                                                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                                                                    },
                                                                                });
                                                                                const result = await response.json();
                                                                                if (result.success) {
                                                                                    toast.success('Campanha excluída com sucesso!');
                                                                                    window.location.reload();
                                                                                } else {
                                                                                    toast.error(result.message || 'Erro ao excluir campanha');
                                                                                }
                                                                            } catch (error) {
                                                                                toast.error('Erro ao excluir campanha');
                                                                                console.error('Campaign deletion error:', error);
                                                                            }
                                                                        }}
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </EstablishmentAppLayout>
    );
}