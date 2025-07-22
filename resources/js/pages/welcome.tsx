import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import React from 'react';
import { 
    Calendar, 
    Clock, 
    Users, 
    BarChart3, 
    MessageCircle, 
    ArrowRight,
    Bell,
    CreditCard,
    ChevronRight,
    Menu,
    X,
    Check
} from 'lucide-react';


// Animated background with system colors
const AnimatedBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-slate-400/20 to-slate-600/20 blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-slate-500/20 to-slate-700/20 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-slate-400/10 to-slate-600/10 blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
    );
};

// Infinite moving cards component
const InfiniteMovingCards = ({ 
    items, 
    direction = "left", 
    speed = "slow", 
    pauseOnHover = true,
    className = ""
}: {
    items: { name: string; role: string; content: string }[];
    direction?: "left" | "right";
    speed?: "fast" | "normal" | "slow";
    pauseOnHover?: boolean;
    className?: string;
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const scrollerRef = React.useRef<HTMLUListElement>(null);

    const [start, setStart] = useState(true);

    useEffect(() => {
        if (containerRef.current && scrollerRef.current) {
            const scrollerContent = Array.from(scrollerRef.current.children);

            // Duplicar os items múltiplas vezes para garantir que sempre tenha cards visíveis
            for (let i = 0; i < 3; i++) {
                scrollerContent.forEach((item) => {
                    const duplicatedItem = item.cloneNode(true);
                    if (scrollerRef.current) {
                        scrollerRef.current.appendChild(duplicatedItem);
                    }
                });
            }

            getDirection();
            getSpeed();
        }
    }, []);

    function addAnimation() {
        // Função não mais necessária, mas mantida para compatibilidade
    }

    const getDirection = () => {
        if (containerRef.current) {
            if (direction === "left") {
                containerRef.current.style.setProperty("--animation-direction", "forwards");
            } else {
                containerRef.current.style.setProperty("--animation-direction", "reverse");
            }
        }
    };

    const getSpeed = () => {
        if (containerRef.current) {
            if (speed === "fast") {
                containerRef.current.style.setProperty("--animation-duration", "20s");
            } else if (speed === "normal") {
                containerRef.current.style.setProperty("--animation-duration", "40s");
            } else {
                // Sincronizar ambos os carrosséis com o mesmo tempo
                containerRef.current.style.setProperty("--animation-duration", "60s");
            }
        }
    };

    return (
        <div
            ref={containerRef}
            className={`scroller relative z-20 max-w-7xl overflow-hidden ${className}`}
            style={{
                maskImage: "linear-gradient(to right, transparent, white 20%, white 80%, transparent)",
            }}
        >
            <ul
                ref={scrollerRef}
                className={`flex min-w-full shrink-0 gap-6 py-4 w-max flex-nowrap ${
                    start ? "animate-scroll" : ""
                } ${pauseOnHover ? "hover:[animation-play-state:paused]" : ""}`}
            >
                {items.map((item, idx) => (
                    <li
                        key={idx}
                        className="w-[280px] max-w-full relative rounded-2xl border border-slate-200 flex-shrink-0 px-6 py-4 md:w-[320px]"
                        style={{
                            background: "linear-gradient(180deg, #F4F2F0, #FBFAFA)",
                        }}
                    >
                        <blockquote>
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 flex items-center justify-center text-white font-bold text-sm">
                                    {item.name.charAt(0)}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                    <p className="text-xs text-slate-600">{item.role}</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{item.content}</p>
                        </blockquote>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// Testimonials data
const testimonials = [
    {
        name: "Ana Silva",
        role: "Proprietária - Estúdio Beleza",
        content: "O Horaly revolucionou meu negócio! Antes perdia muitos clientes por não ter um sistema organizado. Agora meus agendamentos aumentaram 300%."
    },
    {
        name: "Carlos Santos",
        role: "Barbeiro - Barbearia Moderna",
        content: "Incrível como o sistema facilita tudo! Meus clientes adoram poder agendar pelo celular e eu nunca mais tive conflitos de horários."
    },
    {
        name: "Maria Oliveira",
        role: "Cliente Regular",
        content: "Muito prático! Agendo meus tratamentos de beleza em segundos, recebo lembretes automáticos e posso reagendar quando necessário."
    },
    {
        name: "João Ferreira",
        role: "Proprietário - Academia Force",
        content: "Desde que implementei o Horaly, meu faturamento aumentou 45%. O sistema de cobrança automática me poupou horas de trabalho."
    },
    {
        name: "Fernanda Costa",
        role: "Esteticista",
        content: "O que mais gosto é do relatório detalhado que me mostra os horários mais procurados e me ajuda a otimizar minha agenda."
    },
    {
        name: "Pedro Almeida",
        role: "Proprietário - Clínica Saúde+",
        content: "Os lembretes automáticos reduziram em 70% os não comparecimentos. Meus pacientes nunca mais esquecem das consultas!"
    },
    {
        name: "Lucia Martins",
        role: "Proprietária - Spa Relax",
        content: "A integração com WhatsApp é fantástica! Meus clientes recebem lembretes automáticos e posso enviar promoções facilmente."
    },
    {
        name: "Roberto Silva",
        role: "Dono - Salão Premium",
        content: "Nunca mais perdi tempo com planilhas! O sistema organiza tudo automaticamente e me dá relatórios incríveis sobre meu negócio."
    },
    {
        name: "Carla Mendes",
        role: "Fisioterapeuta",
        content: "Meus pacientes amam a facilidade de reagendar online. O sistema é intuitivo e me economiza muito tempo administrativo."
    },
    {
        name: "Daniel Rocha",
        role: "Proprietário - Barbearia Elite",
        content: "O Horaly me ajudou a profissionalizar meu negócio. Agora tenho controle total sobre agendamentos e receita."
    },
    {
        name: "Juliana Souza",
        role: "Cliente Fidelizada",
        content: "Uso o Horaly para agendar em 3 estabelecimentos diferentes. É super prático ter tudo em um só lugar!"
    },
    {
        name: "Marcos Oliveira",
        role: "Proprietário - Clínica Dental",
        content: "Os relatórios me mostram os horários de pico e me ajudam a otimizar minha agenda. Aumentei minha produtividade em 60%!"
    }
];

// Features data
const features = [
    {
        title: "Agendamento Online",
        description: "Permita que os clientes agendem compromissos 24/7 com sua página de reservas personalizável.",
        icon: <Calendar className="w-5 h-5" />,
    },
    {
        title: "Lembretes Automatizados",
        description: "Reduza os não comparecimentos com lembretes automáticos por WhatsApp e E-mail para seus clientes.",
        icon: <Bell className="w-5 h-5" />,
    },
    {
        title: "Pagamentos Integrados",
        description: "Aceite pagamentos de forma Online PIX durante o agendamento direto em seu MercadoPago.",
        icon: <CreditCard className="w-5 h-5" />,
    },
    {
        title: "Horários Personalizáveis",
        description: "Defina sua disponibilidade, tempos de intervalo e durações de serviços com facilidade.",
        icon: <Clock className="w-5 h-5" />,
    },
    {
        title: "Gerenciamento de Clientes",
        description: "Mantenha registros detalhados de clientes e histórico de compromissos em um só lugar.",
        icon: <Users className="w-5 h-5" />,
    },
    {
        title: "Painel de Análises",
        description: "Acompanhe Agendamentos, receita e crescimento do negócio com insights detalhados.",
        icon: <BarChart3 className="w-5 h-5" />,
    },
];

// FAQ data
const faqs = [
    {
        question: "Como funciona o teste grátis de 7 dias?",
        answer: "Nosso teste grátis de 7 dias dá a você acesso total a todos os recursos do plano escolhido. Não é necessário cartão de crédito para se inscrever, e você pode cancelar a qualquer momento durante o período de teste sem compromisso."
    },
    {
        question: "Posso mudar de plano depois?",
        answer: "Sim, você pode atualizar ou rebaixar seu plano a qualquer momento. Se você atualizar, o novo preço será prorrogado para o restante do ciclo de faturamento."
    },
    {
        question: "Quantos agendamentos posso fazer?",
        answer: "Todos os nossos planos incluem agendamentos ilimitados. Você pode criar quantos compromissos precisar sem restrições."
    },
    {
        question: "Como funciona a integração com WhatsApp?",
        answer: "Integramos com a Evolution API para enviar lembretes automáticos via WhatsApp. Você conecta sua conta e o sistema envia as notificações automaticamente."
    },
    {
        question: "Meus dados estão seguros?",
        answer: "Sim, levamos a segurança muito a sério. Todos os dados são criptografados e armazenados em servidores seguros com backup automático diário."
    },
    {
        question: "Que tipo de suporte vocês oferecem?",
        answer: "Oferecemos suporte por email, WhatsApp e sistema de tickets. Todos os planos incluem suporte técnico durante horário comercial."
    }
];

interface WelcomeProps {
    auth: any;
    plans: any[];
    settings: any;
}

export default function Welcome() {
    const { auth, plans, settings } = usePage<WelcomeProps>().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            <Head title="Horaly - Sistema de Agendamento Online para Salões, Barbearias e Clínicas">
                <meta name="description" content="Sistema de agendamento online completo para salões, barbearias, clínicas e academias. Aumente faturamento em 300%, reduza faltas e automatize reservas. Teste grátis 7 dias!" />
                <meta name="keywords" content="sistema agendamento online, agendamento salão, agendamento barbearia, agendamento clínica, software agendamento, app agendamento, sistema reservas online, agendamento automático, gestão clientes, lembretes whatsapp, pagamento pix, agenda online" />
                <meta name="author" content="Horaly" />
                <meta name="robots" content="index, follow" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="canonical" href="https://horaly.com.br" />
                
                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://horaly.com.br" />
                <meta property="og:title" content="Horaly - Sistema de Agendamento Online para Salões, Barbearias e Clínicas" />
                <meta property="og:description" content="Sistema de agendamento online completo para salões, barbearias, clínicas e academias. Aumente faturamento em 300%, reduza faltas e automatize reservas. Teste grátis 7 dias!" />
                <meta property="og:image" content="https://horaly.com.br/use-isso/sistema-5.png" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:locale" content="pt_BR" />
                <meta property="og:site_name" content="Horaly" />
                
                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content="https://horaly.com.br" />
                <meta name="twitter:title" content="Horaly - Sistema de Agendamento Online para Salões, Barbearias e Clínicas" />
                <meta name="twitter:description" content="Sistema de agendamento online completo para salões, barbearias, clínicas e academias. Aumente faturamento em 300%, reduza faltas e automatize reservas. Teste grátis 7 dias!" />
                <meta name="twitter:image" content="https://horaly.com.br/use-isso/sistema-5.png" />
                
                {/* Additional SEO tags */}
                <meta name="theme-color" content="#425164" />
                <meta name="msapplication-TileColor" content="#425164" />
                <meta name="application-name" content="Horaly" />
                <meta name="apple-mobile-web-app-title" content="Horaly" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                
                {/* Structured Data - Organization */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "Horaly",
                        "url": "https://horaly.com.br",
                        "logo": "https://horaly.com.br/logo.png",
                        "description": "Sistema de agendamento online completo para salões, barbearias, clínicas e academias",
                        "contactPoint": {
                            "@type": "ContactPoint",
                            "telephone": "+55-51-98946-2745",
                            "contactType": "customer service",
                            "availableLanguage": "pt-BR"
                        },
                        "sameAs": [
                            "https://wa.me/5551989462745"
                        ]
                    })}
                </script>
                
                {/* Structured Data - Software Application */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Horaly",
                        "operatingSystem": "Web",
                        "applicationCategory": "BusinessApplication",
                        "description": "Sistema de agendamento online para salões, barbearias, clínicas e academias",
                        "url": "https://horaly.com.br",
                        "author": {
                            "@type": "Organization",
                            "name": "Horaly"
                        },
                        "offers": {
                            "@type": "Offer",
                            "price": "49.90",
                            "priceCurrency": "BRL",
                            "priceValidUntil": "2025-12-31"
                        },
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.9",
                            "ratingCount": "150"
                        }
                    })}
                </script>
                
                {/* Structured Data - FAQ */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": faqs.map(faq => ({
                            "@type": "Question",
                            "name": faq.question,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": faq.answer
                            }
                        }))
                    })}
                </script>
                
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
                <style>{`
                    html {
                        scroll-behavior: smooth;
                    }
                    @keyframes scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-33.333%); }
                    }
                    .animate-scroll {
                        animation: scroll var(--animation-duration, 60s) var(--animation-direction, forwards) linear infinite;
                        animation-delay: 0s !important;
                        animation-fill-mode: none;
                        animation-play-state: running;
                        will-change: transform;
                    }
                    .testimonial-container {
                        opacity: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 1.5rem;
                    }
                    .testimonial-row-1,
                    .testimonial-row-2 {
                        opacity: 1;
                        visibility: visible;
                        display: block;
                    }
                    .testimonial-row-1 .animate-scroll,
                    .testimonial-row-2 .animate-scroll {
                        animation-delay: 0s !important;
                        animation-timing-function: linear;
                        animation-play-state: running;
                        transform: translateX(0);
                        will-change: transform;
                    }
                `}</style>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
                <AnimatedBackground />
                
                {/* Navigation */}
                <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                                <img src="/logo.png" alt="Horaly - Sistema de Agendamento Online" className="h-8 w-auto" />
                            </div>
                            
                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center space-x-8">
                                <a href="#hero" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                    Início
                                </a>
                                <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                    Recursos
                                </a>
                                <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                    Como Funciona
                                </a>
                                <a href="#testimonials" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                    Depoimentos
                                </a>
                                <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                    Preços
                                </a>
                                <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                                    FAQ
                                </a>
                            </div>
                            
                            <div className="hidden md:flex items-center space-x-4">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-full font-medium transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
                                        >
                                            Entrar
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-full font-medium transition-colors inline-flex items-center"
                                        >
                                            Começar Grátis
                                            <ChevronRight className="ml-1 w-4 h-4" />
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Mobile menu button */}
                            <div className="md:hidden">
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="text-slate-600 hover:text-slate-900 p-2"
                                >
                                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                        
                        {/* Mobile menu */}
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="md:hidden absolute top-16 inset-x-0 bg-white/95 backdrop-blur-lg border-b border-slate-200"
                            >
                                <div className="px-4 py-4 space-y-4">
                                    <a href="#hero" className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>
                                        Início
                                    </a>
                                    <a href="#features" className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>
                                        Recursos
                                    </a>
                                    <a href="#how-it-works" className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>
                                        Como Funciona
                                    </a>
                                    <a href="#testimonials" className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>
                                        Depoimentos
                                    </a>
                                    <a href="#pricing" className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>
                                        Preços
                                    </a>
                                    <a href="#faq" className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>
                                        FAQ
                                    </a>
                                    <div className="pt-4 border-t border-slate-200">
                                        {auth.user ? (
                                            <Link
                                                href={route('dashboard')}
                                                className="block bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-full font-medium text-center transition-colors"
                                            >
                                                Dashboard
                                            </Link>
                                        ) : (
                                            <>
                                                <Link
                                                    href={route('login')}
                                                    className="block py-2 text-sm font-medium text-slate-600 hover:text-slate-900 text-center"
                                                >
                                                    Entrar
                                                </Link>
                                                <Link
                                                    href={route('register')}
                                                    className="block bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-full font-medium text-center transition-colors mt-2"
                                                >
                                                    Começar Grátis
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </nav>

                {/* Hero Section */}
                <section id="hero" className="relative z-10 pt-20 pb-32">
                    <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="mb-4"
                            >
                                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                                    🚀 Agenda Simplificada
                                </span>
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-slate-900"
                            >
                                {settings.hero_title || 'Sistema de Agendamento Online que Faz'}
                                <span className="bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent block">
                                    {settings.hero_subtitle || 'seu Negócio Crescer'}
                                </span>
                            </motion.h1>
                            
                            <motion.p 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-lg md:text-xl text-slate-600 mb-8 max-w-3xl mx-auto"
                            >
                                {settings.hero_description || 'Sistema completo de agendamento para salões, barbearias, clínicas e academias. Aumente seu faturamento em 300%, reduza faltas e automatize reservas online.'}
                            </motion.p>
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                            >
                                <Link
                                    href={route('register')}
                                    className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 flex items-center shadow-lg"
                                >
                                    Iniciar Teste Grátis
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                                
                                <button className="flex items-center text-slate-600 hover:text-slate-900 font-semibold text-lg transition-colors border border-slate-300 hover:border-slate-400 px-8 py-4 rounded-full bg-transparent">
                                    Agendar Demonstração
                                </button>
                            </motion.div>
                            
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="mt-12 flex justify-center items-center space-x-8 text-slate-600"
                            >
                                <div className="flex items-center">
                                    <Check className="w-5 h-5 text-green-500 mr-2" />
                                    <span>Sem cartão de crédito</span>
                                </div>
                                <div className="flex items-center">
                                    <Check className="w-5 h-5 text-green-500 mr-2" />
                                    <span>Teste de 7 dias</span>
                                </div>
                                <div className="flex items-center">
                                    <Check className="w-5 h-5 text-green-500 mr-2" />
                                    <span>Cancele a qualquer momento</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Dashboard Preview */}
                <section className="relative z-10 py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="relative mx-auto max-w-5xl"
                        >
                            <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50">
                                <img
                                    src="/use-isso/sistema-5.png"
                                    alt="Dashboard completo do Horaly - Sistema de agendamento online mostrando agenda, clientes, relatórios e configurações"
                                    className="w-full h-auto"
                                />
                                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-slate-900/10"></div>
                            </div>
                            <div className="absolute -bottom-6 -right-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-slate-400/30 to-slate-600/30 blur-3xl opacity-70"></div>
                            <div className="absolute -top-6 -left-6 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-slate-500/30 to-slate-700/30 blur-3xl opacity-70"></div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="relative z-10 py-20 md:py-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-16"
                        >
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-700 mb-4">
                                Recursos
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                                Tudo o que Você Precisa para Ter Sucesso
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                Nossa plataforma completa oferece todas as ferramentas necessárias para otimizar seu fluxo de trabalho, aumentar a produtividade e alcançar seus objetivos.
                            </p>
                        </motion.div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
                                >
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 mb-6">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-600">
                                        {feature.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <section id="how-it-works" className="relative z-10 py-20 md:py-32 bg-slate-50">
                    <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-16"
                        >
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-700 mb-4">
                                Como Funciona
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                                Processo Simples, Resultados Poderosos
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                Comece em minutos e veja a diferença que nossa plataforma pode fazer para seu negócio.
                            </p>
                        </motion.div>

                        <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
                            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent -translate-y-1/2 z-0"></div>

                            {[
                                {
                                    step: "01",
                                    title: "Crie uma Conta",
                                    description: "Cadastre-se em segundos com apenas seu e-mail. Nenhum cartão de crédito é necessário para começar.",
                                },
                                {
                                    step: "02",
                                    title: "Configure seu Estabelecimento",
                                    description: "Personalize seu perfil, adicione serviços, defina horários e configure suas preferências.",
                                },
                                {
                                    step: "03",
                                    title: "Comece a Receber Agendamentos",
                                    description: "Compartilhe seu link personalizado e comece a receber agendamentos automaticamente.",
                                },
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="relative z-10 flex flex-col items-center text-center space-y-4"
                                >
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-white text-xl font-bold shadow-lg">
                                        {step.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                                    <p className="text-slate-600 text-center">{step.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section id="testimonials" className="relative z-10 py-20 md:py-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-16"
                        >
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-700 mb-4">
                                Depoimentos
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                                O que nossos clientes dizem
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                Histórias reais de sucesso de estabelecimentos que transformaram seus negócios com o Horaly.
                            </p>
                        </motion.div>
                        
                        <div className="space-y-6">
                            <div className="testimonial-container">
                                <InfiniteMovingCards
                                    items={testimonials.slice(0, 6)}
                                    direction="right"
                                    speed="slow"
                                    className="testimonial-row-1"
                                />
                                <InfiniteMovingCards
                                    items={testimonials.slice(6, 12)}
                                    direction="left"
                                    speed="slow"
                                    className="testimonial-row-2"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="relative z-10 py-20 md:py-32 bg-slate-50">
                    <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>
                    
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-16"
                        >
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-700 mb-4">
                                Preços
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                                {settings.plans_title || 'Preços Simples e Transparentes'}
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                {settings.plans_subtitle || 'Escolha o plano certo para seu negócio. Todos os planos incluem um teste grátis de 7 dias.'}
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {plans.map((plan, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className={`relative bg-white rounded-2xl p-8 shadow-lg border ${plan.landing_featured ? 'border-slate-600 shadow-xl' : 'border-slate-200'}`}
                                >
                                    {plan.landing_featured && (
                                        <div className="absolute top-0 right-0 bg-slate-600 text-white px-3 py-1 text-xs font-medium rounded-bl-lg rounded-tr-2xl">
                                            {plan.landing_badge || 'Destaque'}
                                        </div>
                                    )}
                                    <div className="text-center">
                                        <h3 className="text-2xl font-bold text-slate-900">{plan.landing_title || plan.name}</h3>
                                        <div className="flex items-baseline justify-center mt-4">
                                            <span className="text-4xl font-bold text-slate-900">R$ {Number(plan.price).toFixed(2)}</span>
                                            <span className="text-slate-600 ml-1">/mês</span>
                                        </div>
                                        <p className="text-slate-600 mt-2">{plan.landing_description || plan.description}</p>
                                        <ul className="space-y-3 my-6 text-left">
                                            {(plan.landing_features || plan.features).map((feature, j) => (
                                                <li key={j} className="flex items-center">
                                                    <Check className="mr-2 w-5 h-5 text-green-500" />
                                                    <span className="text-slate-700">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Link
                                            href={route('register')}
                                            className={`w-full mt-auto rounded-full py-3 px-6 font-medium transition-colors inline-block text-center ${
                                                plan.landing_featured 
                                                    ? 'bg-slate-600 hover:bg-slate-700 text-white' 
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                                            }`}
                                        >
                                            {plan.landing_button_text || 'Escolher Plano'}
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section id="faq" className="relative z-10 py-20 md:py-32">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-16"
                        >
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-700 mb-4">
                                FAQ
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                                Perguntas Frequentes
                            </h2>
                            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                                Encontre respostas para perguntas comuns sobre nossa plataforma.
                            </p>
                        </motion.div>

                        <div className="max-w-3xl mx-auto">
                            <div className="space-y-6">
                                {faqs.map((faq, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: i * 0.05 }}
                                        className="bg-white rounded-lg shadow-sm border border-slate-200"
                                    >
                                        <details className="group">
                                            <summary className="flex items-center justify-between cursor-pointer p-6 font-medium text-slate-900 hover:text-slate-700 transition-colors">
                                                {faq.question}
                                                <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
                                            </summary>
                                            <div className="px-6 pb-6 text-slate-600">
                                                {faq.answer}
                                            </div>
                                        </details>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="relative z-10 py-20 md:py-32 bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                                Pronto para Transformar seu Agendamento?
                            </h2>
                            <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
                                Junte-se a milhares de negócios que otimizaram seu processo de reservas e aumentaram sua receita com Horaly.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link
                                    href={route('register')}
                                    className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 flex items-center shadow-lg"
                                >
                                    Iniciar Teste Grátis
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Link>
                                
                                <a 
                                    href="https://wa.me/5551989462745"
                                    className="flex items-center text-white hover:text-slate-200 font-semibold text-lg transition-colors border border-white hover:border-slate-200 px-8 py-4 rounded-full bg-transparent"
                                >
                                    <MessageCircle className="mr-2 w-6 h-6" />
                                    Agendar Demonstração
                                </a>
                            </div>
                            
                            <p className="text-sm text-slate-300 mt-6">
                                Sem cartão de crédito necessário. Teste grátis de 7 dias. Cancele a qualquer momento.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="relative z-10 bg-slate-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <img src="/logo.png" alt="Horaly - Sistema de Agendamento Online para Salões, Barbearias e Clínicas" className="h-8 w-auto mb-4" />
                                <p className="text-slate-400">
                                    Sistema de agendamento inteligente para salões, barbearias, clínicas e academias crescerem.
                                </p>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Produto</h3>
                                <ul className="space-y-2 text-slate-400">
                                    <li><a href="#features" className="hover:text-white transition-colors">Funcionalidades</a></li>
                                    <li><a href="#pricing" className="hover:text-white transition-colors">Preços</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Integrações</a></li>
                                </ul>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Suporte</h3>
                                <ul className="space-y-2 text-slate-400">
                                    <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">WhatsApp</a></li>
                                </ul>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Empresa</h3>
                                <ul className="space-y-2 text-slate-400">
                                    <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
                            <p>&copy; 2024 Horaly. Todos os direitos reservados.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}