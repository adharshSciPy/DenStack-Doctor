import { Bell, Search, CheckCheck, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useState, useEffect, useRef } from "react";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  appointmentId?: string;
  patientId?: string;
  clinicId?: string;
  metadata?: any;
}

interface DashboardHeaderProps {
  doctorName: string;
  doctorId: string;
  userRole?: string;
  notificationServiceUrl?: string;
  onNotificationsUpdate?: (notifications: Notification[], unreadCount: number) => void;
}

export function DashboardHeader({ 
  doctorName, 
  doctorId,
  userRole = "doctor",
  notificationServiceUrl = "http://localhost:8011",
  onNotificationsUpdate
}: DashboardHeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<any>(null);
  const [socketReady, setSocketReady] = useState(false);

  const fetchNotifications = async () => {
    if (!doctorId || doctorId === 'undefined') {
      console.warn('⚠️ Skipping fetch: Invalid doctorId');
      return;
    }

    try {
      setIsLoading(true);
      console.log(`📥 Fetching notifications for doctor: ${doctorId}`);
      const response = await fetch(`${notificationServiceUrl}/api/notifications/in-app/${doctorId}?limit=20`);
      const data = await response.json();
      
      if (data.success) {
        const notifs = data.notifications || [];
        const count = data.unreadCount || 0;
        console.log(`✅ Fetched ${notifs.length} notifications, ${count} unread`);
        setNotifications(notifs);
        setUnreadCount(count);
        
        if (onNotificationsUpdate) {
          onNotificationsUpdate(notifs, count);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!doctorId || doctorId === 'undefined') {
      console.warn('⚠️ Cannot mark as read: Invalid doctorId');
      return;
    }

    try {
      const response = await fetch(`${notificationServiceUrl}/api/notifications/in-app/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: doctorId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedNotifications = notifications.map(n => 
          n._id === notificationId ? { ...n, isRead: true } : n
        );
        setNotifications(updatedNotifications);
        const newUnreadCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newUnreadCount);
        
        if (onNotificationsUpdate) {
          onNotificationsUpdate(updatedNotifications, newUnreadCount);
        }
      }
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!doctorId || doctorId === 'undefined') {
      console.warn('⚠️ Cannot mark all as read: Invalid doctorId');
      return;
    }

    try {
      const response = await fetch(`${notificationServiceUrl}/api/notifications/in-app/${doctorId}/read-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
        setNotifications(updatedNotifications);
        setUnreadCount(0);
        
        if (onNotificationsUpdate) {
          onNotificationsUpdate(updatedNotifications, 0);
        }
      }
    } catch (error) {
      console.error("❌ Error marking all as read:", error);
    }
  };

  // Socket.IO connection
  useEffect(() => {
    // ✅ Validate doctorId
    if (!doctorId || doctorId === 'undefined' || doctorId === 'null') {
      console.error('❌ Cannot initialize socket: Invalid doctorId:', doctorId);
      return;
    }

    console.log(`🔌 Initializing Socket.IO for doctor: ${doctorId}`);

    // Fetch initial notifications
    fetchNotifications();

    // Check if Socket.IO is already loaded
    const initializeSocket = () => {
      const io = (window as any).io;
      if (!io) {
        console.error('❌ Socket.IO library not loaded');
        return;
      }

      console.log(`🔌 Connecting to ${notificationServiceUrl}`);
      const socket = io(notificationServiceUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Socket.IO connected:', socket.id);
        setIsConnected(true);
        
        console.log(`🔐 Authenticating with userId: ${doctorId}, role: ${userRole}`);
        socket.emit('authenticate', { userId: doctorId, userRole });
      });

      socket.on('authenticated', (data: any) => {
        console.log('✅ Authentication successful:', data);
        setSocketReady(true);
      });

      socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
        setIsConnected(false);
        setSocketReady(false);
      });

      socket.on('connect_error', (error: any) => {
        console.error('❌ Connection error:', error.message);
        setIsConnected(false);
      });

      socket.on('new_notification', (data: any) => {
        console.log('🔔 New notification received:', data);
        
        const newNotification: Notification = {
          _id: data.id || data._id,
          type: data.type,
          title: data.title,
          message: data.message,
          isRead: false,
          createdAt: data.createdAt || new Date().toISOString(),
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          clinicId: data.clinicId,
          metadata: data.metadata
        };
        
        setNotifications(prev => {
          const updated = [newNotification, ...prev];
          if (onNotificationsUpdate) {
            onNotificationsUpdate(updated, unreadCount + 1);
          }
          return updated;
        });
        
        setUnreadCount(prev => prev + 1);
        
        // Browser notification
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(data.title, { body: data.message });
        }
      });
    };

    // Load Socket.IO if not already loaded
    if (!(window as any).io) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.4/socket.io.min.js';
      script.onload = () => {
        console.log('✅ Socket.IO library loaded');
        initializeSocket();
      };
      script.onerror = () => {
        console.error('❌ Failed to load Socket.IO library');
      };
      document.head.appendChild(script);
    } else {
      initializeSocket();
    }

    // Request notification permission
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket');
        socketRef.current.disconnect();
      }
    };
  }, [doctorId, userRole, notificationServiceUrl]);

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_appointment': return '📅';
      case 'appointment_reminder': return '⏰';
      case 'appointment_cancelled': return '❌';
      case 'token_ready': return '🔔';
      default: return '📬';
    }
  };

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search patients, appointments, records..."
              className="pl-10 bg-background border-border"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-muted-foreground">{isConnected ? 'Live' : 'Offline'}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive animate-pulse"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-2">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification._id}
                      className={`p-3 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                      onClick={() => !notification.isRead && markAsRead(notification._id)}
                    >
                      <div className="flex gap-3 w-full">
                        <div className="text-xl">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="font-medium text-sm">{notification.title}</p>
                            {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notification.createdAt)}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {doctorName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span>Dr. {doctorName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}