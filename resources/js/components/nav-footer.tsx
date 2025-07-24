import { Icon } from '@/components/icon';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { type ComponentPropsWithoutRef } from 'react';

export function NavFooter({
    items,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
}) {
    return (
        <SidebarGroup {...props} className={`group-data-[collapsible=icon]:p-0 ${className || ''}`}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                className="text-green-600 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-200 dark:hover:bg-green-900/20 font-medium"
                            >
                                <a 
                                    href={item.href} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ 
                                        color: '#059669', 
                                        fontWeight: '500',
                                        opacity: '1 !important' 
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#047857';
                                        e.currentTarget.style.backgroundColor = '#ecfdf5';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#059669';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }}
                                >
                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" style={{ color: '#059669' }} />}
                                    <span style={{ color: '#059669', fontWeight: '500' }}>{item.title}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
