<?php

namespace App\Http\Controllers;

use App\Models\Notification;

class NotificationController extends Controller
{
    public function index()
    {
        // Verificar se o usuário está autenticado
        if (!auth()->check() || !auth()->user()->establishment) {
            return response()->json([
                'notifications' => [],
                'unread_count' => 0,
            ]);
        }

        $establishment = auth()->user()->establishment;
        
        $notifications = Notification::where('establishment_id', $establishment->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        $unreadCount = Notification::where('establishment_id', $establishment->id)
            ->where('read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(Notification $notification)
    {
        $establishment = auth()->user()->establishment;
        
        \Log::info('🔔 Marking notification as read', [
            'notification_id' => $notification->id,
            'establishment_id' => $establishment->id,
            'notification_establishment_id' => $notification->establishment_id,
            'current_read_status' => $notification->read
        ]);
        
        if ($notification->establishment_id !== $establishment->id) {
            \Log::error('❌ Unauthorized access to notification', [
                'notification_id' => $notification->id,
                'user_establishment_id' => $establishment->id,
                'notification_establishment_id' => $notification->establishment_id
            ]);
            abort(403);
        }

        $updated = $notification->update(['read' => true]);
        
        \Log::info('✅ Notification marked as read', [
            'notification_id' => $notification->id,
            'update_result' => $updated,
            'new_read_status' => $notification->fresh()->read
        ]);

        return response()->json(['success' => true, 'message' => 'Notificação marcada como lida!']);
    }

    public function markAllAsRead()
    {
        $establishment = auth()->user()->establishment;
        
        $updated = Notification::where('establishment_id', $establishment->id)
            ->where('read', false)
            ->update(['read' => true]);
            
        \Log::info('✅ All notifications marked as read', [
            'establishment_id' => $establishment->id,
            'updated_count' => $updated
        ]);

        return response()->json(['success' => true, 'message' => 'Todas as notificações foram marcadas como lidas!']);
    }
}
