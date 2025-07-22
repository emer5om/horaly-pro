import { Head, router, useForm } from '@inertiajs/react';
import { Check, Eye, Image, Link as LinkIcon, Palette, Save, Type, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EstablishmentAppLayout from '@/layouts/establishment-app-layout';

interface Establishment {
    id: number;
    name: string;
    booking_slug: string;
    booking_primary_color: string;
    booking_secondary_color: string;
    booking_slogan: string;
    booking_logo: string;
    booking_banner: string;
    booking_theme: string;
    required_fields: string[] | null;
}

interface BookingLinkPageProps {
    establishment: Establishment;
    themes: Record<string, string>;
    defaultRequiredFields: Record<
        string,
        {
            label: string;
            required: boolean;
            disabled: boolean;
        }
    >;
    planFeatures?: string[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function BookingLinkPage({ establishment, themes, defaultRequiredFields, planFeatures = [], flash }: BookingLinkPageProps) {
    const { data, setData, patch, processing, errors } = useForm({
        booking_slug: establishment.booking_slug || '',
        booking_primary_color: establishment.booking_primary_color || '#3B82F6',
        booking_secondary_color: establishment.booking_secondary_color || '#1E40AF',
        booking_slogan: establishment.booking_slogan || '',
        booking_theme: establishment.booking_theme || 'modern',
        required_fields: Array.isArray(establishment.required_fields) ? establishment.required_fields : ['name', 'phone'],
    });

    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        if (data.booking_slug) {
            setPreviewUrl(`${window.location.origin}/${data.booking_slug}`);
        }
    }, [data.booking_slug]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting form data:', data);
        patch('/settings/booking-link', {
            onSuccess: () => {
                toast.success('Configurações atualizadas com sucesso!');
            },
            onError: (errors) => {
                console.error('Form errors:', errors);
                toast.error('Erro ao atualizar configurações');
            },
        });
    };

    const handleRequiredFieldChange = (field: string, checked: boolean) => {
        const currentFields = [...(Array.isArray(data.required_fields) ? data.required_fields : ['name', 'phone'])];

        if (checked) {
            if (!currentFields.includes(field)) {
                currentFields.push(field);
            }
        } else {
            const index = currentFields.indexOf(field);
            if (index > -1) {
                currentFields.splice(index, 1);
            }
        }

        setData('required_fields', currentFields);
    };

    const handleFileUpload = (type: 'logo' | 'banner', file: File) => {
        const formData = new FormData();
        formData.append(type, file);

        router.post(`/settings/booking-link/${type}`, formData, {
            onSuccess: () => {
                toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} atualizado com sucesso!`);
            },
            onError: () => {
                toast.error(`Erro ao fazer upload do ${type === 'logo' ? 'logo' : 'banner'}`);
            },
        });
    };

    return (
        <EstablishmentAppLayout title="Link de Agendamento" planFeatures={planFeatures}>
            <Head title="Link de Agendamento" />

            <div className="@container/main flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Link de Agendamento</h1>
                        <p className="text-muted-foreground">Configure seu link personalizado para agendamentos online</p>
                    </div>

                    {previewUrl && (
                        <Button variant="outline" asChild>
                            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                            </a>
                        </Button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* URL do Link */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LinkIcon className="h-5 w-5" />
                                URL do Link
                            </CardTitle>
                            <CardDescription>Define a URL personalizada para seus clientes agendarem</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="booking_slug">Slug do Link</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{window.location.origin}/</span>
                                    <Input
                                        id="booking_slug"
                                        placeholder="meu-estabelecimento"
                                        value={data.booking_slug}
                                        onChange={(e) => setData('booking_slug', e.target.value)}
                                        className="flex-1"
                                    />
                                </div>
                                {errors.booking_slug && <p className="text-sm text-red-500">{errors.booking_slug}</p>}
                                {previewUrl && (
                                    <Badge variant="outline" className="mt-2">
                                        <LinkIcon className="mr-1 h-3 w-3" />
                                        {previewUrl}
                                    </Badge>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="booking_slogan">Slogan</Label>
                                <Input
                                    id="booking_slogan"
                                    placeholder="Agende seu horário com facilidade"
                                    value={data.booking_slogan}
                                    onChange={(e) => setData('booking_slogan', e.target.value)}
                                />
                                {errors.booking_slogan && <p className="text-sm text-red-500">{errors.booking_slogan}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Aparência */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5" />
                                Aparência
                            </CardTitle>
                            <CardDescription>Personalize as cores e tema do seu link de agendamento</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="booking_primary_color">Cor Primária</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            id="booking_primary_color"
                                            value={data.booking_primary_color}
                                            onChange={(e) => setData('booking_primary_color', e.target.value)}
                                            className="h-8 w-12 cursor-pointer rounded border"
                                        />
                                        <Input
                                            value={data.booking_primary_color}
                                            onChange={(e) => setData('booking_primary_color', e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="booking_secondary_color">Cor Secundária</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            id="booking_secondary_color"
                                            value={data.booking_secondary_color}
                                            onChange={(e) => setData('booking_secondary_color', e.target.value)}
                                            className="h-8 w-12 cursor-pointer rounded border"
                                        />
                                        <Input
                                            value={data.booking_secondary_color}
                                            onChange={(e) => setData('booking_secondary_color', e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="booking_theme">Tema</Label>
                                <Select value={data.booking_theme} onValueChange={(value) => setData('booking_theme', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(themes).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Imagens */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Image className="h-5 w-5" />
                                Imagens
                            </CardTitle>
                            <CardDescription>Faça upload do logo e banner para personalizar seu link</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Logo</Label>
                                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
                                        {establishment.booking_logo ? (
                                            <div className="space-y-2">
                                                <img
                                                    src={`/storage/${establishment.booking_logo}`}
                                                    alt="Logo"
                                                    className="mx-auto max-h-20 object-contain"
                                                />
                                                <p className="text-sm text-muted-foreground">Logo atual</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                                <p className="text-sm text-muted-foreground">Nenhum logo enviado</p>
                                            </div>
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    handleFileUpload('logo', e.target.files[0]);
                                                }
                                            }}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Banner</Label>
                                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
                                        {establishment.booking_banner ? (
                                            <div className="space-y-2">
                                                <img
                                                    src={`/storage/${establishment.booking_banner}`}
                                                    alt="Banner"
                                                    className="mx-auto max-h-20 object-contain"
                                                />
                                                <p className="text-sm text-muted-foreground">Banner atual</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                                <p className="text-sm text-muted-foreground">Nenhum banner enviado</p>
                                            </div>
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    handleFileUpload('banner', e.target.files[0]);
                                                }
                                            }}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Campos Obrigatórios */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Type className="h-5 w-5" />
                                Campos Obrigatórios
                            </CardTitle>
                            <CardDescription>Selecione quais campos são obrigatórios no formulário de agendamento</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(defaultRequiredFields).map(([key, field]) => (
                                    <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id={key}
                                                checked={Array.isArray(data.required_fields) && data.required_fields.includes(key)}
                                                onCheckedChange={(checked) => handleRequiredFieldChange(key, checked as boolean)}
                                                disabled={field.disabled}
                                            />
                                            <Label htmlFor={key} className="flex-1">
                                                {field.label}
                                            </Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {field.required && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Obrigatório
                                                </Badge>
                                            )}
                                            {data.required_fields.includes(key) ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <X className="h-4 w-4 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {errors.required_fields && <p className="mt-2 text-sm text-red-500">{errors.required_fields}</p>}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                    </div>
                </form>
            </div>
        </EstablishmentAppLayout>
    );
}
