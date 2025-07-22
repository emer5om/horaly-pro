import { useState, useEffect } from 'react';

interface CardData {
  number: string;
  name: string;
  cvv: string;
  expiry_month: string;
  expiry_year: string;
  brand: string;
}

interface EfiPayTokenResponse {
  payment_token: string;
  card_mask: string;
  brand: string;
}

interface EfiPayJS {
  CreditCard: {
    setCreditCardData: (data: {
      brand: string;
      number: string;
      cvv: string;
      expirationMonth: string;
      expirationYear: string;
      holderName: string;
      reuse?: boolean;
    }) => {
      getPaymentToken: () => Promise<{ payment_token: string }>;
    };
  };
}

declare global {
  interface Window {
    EfiJs: EfiPayJS;
  }
}

export function useEfiPayToken() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);

  useEffect(() => {
    // Verificar se a biblioteca já está carregada
    if (window.EfiJs) {
      setIsLibraryLoaded(true);
      return;
    }

    // Aguardar carregamento da biblioteca
    const checkLibrary = () => {
      if (window.EfiJs) {
        setIsLibraryLoaded(true);
        return;
      }
      
      // Tentar novamente após um tempo
      setTimeout(checkLibrary, 100);
    };

    // Aguardar DOM estar pronto e script carregado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkLibrary);
    } else {
      checkLibrary();
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', checkLibrary);
    };
  }, []);

  const generateToken = async (cardData: CardData): Promise<EfiPayTokenResponse> => {
    setLoading(true);
    setError(null);

    try {
      // Se for ambiente de desenvolvimento local e biblioteca não carregou, usar fallback
      const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname.includes('.test') ||
                          window.location.hostname === '127.0.0.1';

      if (!window.EfiJs && isDevelopment) {
        console.warn('Efí Pay library not loaded in development. Using fallback token generation.');
        
        // Gerar token no formato correto: 40 caracteres hexadecimais
        const generateHexToken = () => {
          let token = '';
          const hexChars = '0123456789abcdef';
          for (let i = 0; i < 40; i++) {
            token += hexChars[Math.floor(Math.random() * 16)];
          }
          return token;
        };
        
        // Simular tokenização para desenvolvimento
        const response: EfiPayTokenResponse = {
          payment_token: generateHexToken(),
          card_mask: cardData.number.substr(0, 4) + '****' + cardData.number.substr(-4),
          brand: cardData.brand,
        };

        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return response;
      }

      // Verificar se a biblioteca da Efí Pay está carregada
      if (!window.EfiJs) {
        throw new Error('Biblioteca da Efí Pay não carregada. Verifique sua conexão com a internet e recarregue a página.');
      }

      // Gerar token usando a biblioteca oficial da Efí Pay
      const tokenResponse = await window.EfiJs.CreditCard
        .setCreditCardData({
          brand: cardData.brand,
          number: cardData.number.replace(/\s/g, ''), // Remove espaços
          cvv: cardData.cvv,
          expirationMonth: cardData.expiry_month.padStart(2, '0'),
          expirationYear: cardData.expiry_year,
          holderName: cardData.name,
          reuse: false, // Para assinaturas recorrentes, pode ser true
        })
        .getPaymentToken();

      const response: EfiPayTokenResponse = {
        payment_token: tokenResponse.payment_token,
        card_mask: cardData.number.substr(0, 4) + '****' + cardData.number.substr(-4),
        brand: cardData.brand,
      };

      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar token de pagamento';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    generateToken,
    loading,
    error,
    isLibraryLoaded,
  };
}