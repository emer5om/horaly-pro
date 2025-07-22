import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CustomerAppLayout from '@/layouts/customer-app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Heart, MapPin, Clock, Plus, Trash2, MessageCircle } from 'lucide-react';

interface Establishment {
    id: number;
    name: string;
    phone: string;
}

interface Service {
    id: number;
    name: string;
    duration_minutes: number;
    price: number;
    establishment: Establishment;
}

interface FavoriteService {
    id: number;
    service: Service;
    created_at: string;
}

interface CustomerFavoritesProps {
    favorites: FavoriteService[];
}

export default function CustomerFavorites({ favorites }: CustomerFavoritesProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const removeFavorite = (serviceId: number) => {
        router.post(`/customer/services/${serviceId}/favorite`, {}, {
            onSuccess: () => {
                // Página será recarregada automaticamente
            },
        });
    };

    const scheduleService = (serviceId: number) => {
        // Redirecionar para página de agendamento com serviço pré-selecionado
        window.location.href = `/?service=${serviceId}`;
    };

    return (
        <CustomerAppLayout title="Meus Favoritos">
            <Head title="Meus Favoritos" />

            <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="grid gap-1">
                        <h1 className="text-3xl font-semibold">Meus Serviços Favoritos</h1>
                        <p className="text-muted-foreground">
                            Seus serviços preferidos para agendamento rápido
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button asChild>
                            <Link href="/">
                                <Plus className="mr-2 h-4 w-4" />
                                Buscar Serviços
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Lista de Favoritos */}
                {favorites.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {favorites.map((favorite) => (
                            <Card key={favorite.id} className="relative">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="grid gap-1">
                                            <CardTitle className="text-lg">{favorite.service.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {favorite.service.establishment.name}
                                            </CardDescription>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeFavorite(favorite.service.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span>{favorite.service.duration_minutes} minutos</span>
                                            </div>
                                            <div className="text-lg font-bold">
                                                {formatCurrency(favorite.service.price)}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button 
                                                className="flex-1"
                                                onClick={() => scheduleService(favorite.service.id)}
                                            >
                                                Agendar Agora
                                            </Button>
                                            <Button 
                                                variant="outline"
                                                onClick={() => {
                                                    const phone = favorite.service.establishment.phone.replace(/[^0-9]/g, '');
                                                    const message = encodeURIComponent(
                                                        `Olá! Gostaria de agendar o serviço "${favorite.service.name}" que está nos meus favoritos.`
                                                    );
                                                    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                                                }}
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                            Favoritado em {new Date(favorite.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">Nenhum serviço favorito</h3>
                                <p className="mb-4 text-muted-foreground">
                                    Você ainda não favoritou nenhum serviço. Explore nossos estabelecimentos e marque seus favoritos para agendamento rápido!
                                </p>
                                <Button asChild>
                                    <Link href="/">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Explorar Serviços
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Dica */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <Heart className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-blue-900">Dica</h4>
                                <p className="text-sm text-blue-700">
                                    Favorite seus serviços preferidos para ter acesso rápido e agendar com apenas um clique!
                                    Você pode favoritar quantos serviços quiser.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </CustomerAppLayout>
    );
}