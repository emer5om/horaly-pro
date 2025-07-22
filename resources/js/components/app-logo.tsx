import { useSidebar } from '@/components/ui/sidebar';

interface AppLogoProps {
    collapsed?: boolean;
}

export default function AppLogo({ collapsed }: AppLogoProps) {
    // Tentar usar o sidebar hook se estiver disponível
    let isCollapsed = collapsed;
    try {
        const { state } = useSidebar();
        isCollapsed = state === 'collapsed';
    } catch {
        // Se não estiver dentro de um SidebarProvider, usar o prop collapsed
        isCollapsed = collapsed ?? false;
    }

    if (isCollapsed) {
        return (
            <div className="flex aspect-square size-8 items-center justify-center rounded-md">
                <img src="/logo-icon.png" alt="Horaly" className="size-7 object-contain" />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Horaly" className="h-8 object-contain" />
        </div>
    );
}
