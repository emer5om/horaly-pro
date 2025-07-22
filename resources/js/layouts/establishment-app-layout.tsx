import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { EstablishmentSidebar } from '@/components/establishment-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

interface EstablishmentAppLayoutProps extends PropsWithChildren {
    breadcrumbs?: BreadcrumbItem[];
    title?: string;
    planFeatures?: string[];
}

export default function EstablishmentAppLayout({ children, breadcrumbs = [], title, planFeatures = [] }: EstablishmentAppLayoutProps) {
    // Se o título foi fornecido, criar breadcrumbs automaticamente
    const finalBreadcrumbs = title ? [...breadcrumbs, { title: title }] : breadcrumbs;

    return (
        <SidebarProvider>
            <EstablishmentSidebar planFeatures={planFeatures} />
            <SidebarInset>
                <AppSidebarHeader breadcrumbs={finalBreadcrumbs} />
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
}
