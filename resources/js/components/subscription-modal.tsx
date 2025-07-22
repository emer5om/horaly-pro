import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard } from 'lucide-react';
import axios from 'axios';

interface SubscriptionError {
    error: string;
    message: string;
    subscription_status: string;
    redirect_url: string;
    show_modal?: boolean;
}

export function GlobalSubscriptionModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [errorData, setErrorData] = useState<SubscriptionError | null>(null);

    useEffect(() => {
        // Interceptar o axios para capturar erros 403
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 403) {
                    const data = error.response.data;
                    
                    // Verificar se é um erro de assinatura
                    if (data?.error && data?.subscription_status && data?.redirect_url && data?.show_modal) {
                        setErrorData(data);
                        setIsOpen(true);
                        // Não rejeitar o erro, apenas mostrar o modal
                        return Promise.resolve(error.response);
                    }
                }
                return Promise.reject(error);
            }
        );

        // Interceptar requisições do Inertia
        const handleInertiaError = (event: any) => {
            const response = event.detail?.response;
            
            if (response?.status === 403) {
                try {
                    let data;
                    if (typeof response.data === 'string') {
                        data = JSON.parse(response.data);
                    } else {
                        data = response.data;
                    }
                    
                    // Verificar se é um erro de assinatura
                    if (data?.error && data?.subscription_status && data?.redirect_url && data?.show_modal) {
                        setErrorData(data);
                        setIsOpen(true);
                        event.preventDefault(); // Prevenir o comportamento padrão do Inertia
                        return;
                    }
                } catch (e) {
                    // Se não conseguir parsear, deixa o Inertia lidar com o erro
                }
            }
        };

        // Interceptar antes da requisição ser processada pelo Inertia
        const handleInertiaStart = (event: any) => {
            // Resetar modal se uma nova navegação começar
            if (isOpen) {
                setIsOpen(false);
                setErrorData(null);
            }
        };

        // Escutar eventos do Inertia
        document.addEventListener('inertia:error', handleInertiaError);
        document.addEventListener('inertia:start', handleInertiaStart);

        return () => {
            document.removeEventListener('inertia:error', handleInertiaError);
            document.removeEventListener('inertia:start', handleInertiaStart);
            axios.interceptors.response.eject(interceptor);
        };
    }, [isOpen]);

    const handleUpgrade = () => {
        setIsOpen(false);
        if (errorData?.redirect_url) {
            router.visit(errorData.redirect_url);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        // Redirect para dashboard ou logout dependendo do status
        if (errorData?.subscription_status === 'overdue') {
            router.visit('/dashboard');
        } else {
            router.post('/logout');
        }
    };

    const getModalContent = () => {
        if (!errorData) return null;

        const isOverdue = errorData.subscription_status === 'overdue';
        
        return {
            title: isOverdue ? 'Pagamento Pendente' : 'Assinatura Expirada',
            description: errorData.message,
            icon: isOverdue ? CreditCard : AlertTriangle,
            buttonText: isOverdue ? 'Atualizar Pagamento' : 'Escolher Plano',
            buttonVariant: isOverdue ? 'default' : 'default' as const,
            showLogout: !isOverdue
        };
    };

    const content = getModalContent();

    if (!content) return null;

    const IconComponent = content.icon;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <IconComponent className="h-6 w-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">
                        {content.title}
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        {content.description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button 
                        onClick={handleUpgrade}
                        variant={content.buttonVariant}
                        className="w-full sm:w-auto"
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {content.buttonText}
                    </Button>
                    
                    {content.showLogout && (
                        <Button 
                            onClick={handleClose}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            Sair da Conta
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}