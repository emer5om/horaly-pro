import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { router } from '@inertiajs/react';
import { Bell, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'appointment_confirmed' | 'appointment_pending' | 'appointment_cancelled' | 'appointment_rescheduled' | 'appointment_completed';
    read: boolean;
    created_at: string;
    appointment_id?: number;
    customer_name?: string;
}

export function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.warn('Response is not JSON, likely redirected to login');
                setNotifications([]);
                setUnreadCount(0);
                return;
            }
            
            const data = await response.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Refresh notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'appointment_confirmed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'appointment_pending':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            case 'appointment_cancelled':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'appointment_rescheduled':
                return <Calendar className="h-4 w-4 text-blue-600" />;
            case 'appointment_completed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'payment_rejected':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'payment_overdue':
                return <Clock className="h-4 w-4 text-orange-600" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const markAsRead = async (notificationId: number) => {
        try {
            console.log('🔔 Marking notification as read:', notificationId);
            
            // Use fetch but then refresh notifications from server
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                console.log('✅ Notification marked as read successfully');
                // Refresh notifications from server to get accurate state
                await fetchNotifications();
            } else {
                console.error('❌ Failed to mark as read:', response.status);
            }
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            console.log('🔔 Marking all notifications as read');
            
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (response.ok) {
                console.log('✅ All notifications marked as read successfully');
                // Refresh notifications from server to get accurate state
                await fetchNotifications();
            } else {
                console.error('❌ Failed to mark all as read:', response.status);
            }
        } catch (error) {
            console.error('❌ Error marking all notifications as read:', error);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Agora';
        if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h atrás`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d atrás`;
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-96 w-80 overflow-y-auto">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notificações</span>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                            Marcar todas como lidas
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {loading ? (
                    <div className="p-4 text-center text-muted-foreground">
                        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        <p>Carregando notificações...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
                        <p>Nenhuma notificação</p>
                    </div>
                ) : (
                    notifications.slice(0, 10).map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            className={`cursor-pointer p-3 ${!notification.read ? 'bg-blue-50 hover:bg-blue-100' : 'opacity-70 hover:opacity-100'}`}
                            onClick={() => {
                                if (!notification.read) {
                                    markAsRead(notification.id);
                                }
                                if (notification.appointment_id) {
                                    setIsOpen(false);
                                    router.visit(`/appointments/${notification.appointment_id}`);
                                }
                            }}
                        >
                            <div className="flex w-full items-start gap-3">
                                <div className="mt-1 flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm leading-tight font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {notification.title}
                                        </p>
                                        {notification.read && (
                                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                                Lida
                                            </Badge>
                                        )}
                                    </div>
                                    <p className={`mt-1 line-clamp-2 text-xs ${!notification.read ? 'text-muted-foreground' : 'text-gray-500'}`}>
                                        {notification.message}
                                    </p>
                                    <p className={`mt-1 text-xs ${!notification.read ? 'text-muted-foreground' : 'text-gray-500'}`}>
                                        {formatTimeAgo(notification.created_at)}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="flex-shrink-0">
                                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                                    </div>
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))
                )}

                {notifications.length > 10 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-center text-muted-foreground">
                            <Button variant="ghost" size="sm" className="w-full">
                                Ver todas as notificações
                            </Button>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
