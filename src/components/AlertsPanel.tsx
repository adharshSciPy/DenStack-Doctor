// src/components/AlertsPanel.tsx
import { AlertCircle, Clock, FileText, Bell, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import type { MouseEvent } from "react";

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

interface AlertsPanelProps {
  notifications?: Notification[];
  unreadCount?: number;
  onMarkAsRead?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
}

export function AlertsPanel({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onDismiss,
}: AlertsPanelProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "new_appointment":
        return <Calendar className="h-5 w-5" />;
      case "appointment_reminder":
        return <Clock className="h-5 w-5" />;
      case "appointment_cancelled":
        return <AlertCircle className="h-5 w-5" />;
      case "token_ready":
        return <Bell className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (isRead: boolean) => {
    return !isRead
      ? "border-l-4 border-l-red-500 bg-red-50/50"
      : "border-l-4 border-l-gray-300";
  };

  const getPriorityBadge = (isRead: boolean) => {
    return !isRead ? (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
        New
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-[10px]">
        Read
      </Badge>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 172800) return "Yesterday";
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const handleView = (notification: Notification) => {
    console.log("Viewing notification:", notification);
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }
    if (notification.appointmentId) {
      console.log("Navigate to appointment:", notification.appointmentId);
      // Add navigation here later
    }
  };

  const handleDismiss = (notificationId: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDismiss?.(notificationId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Alerts & Notifications</CardTitle>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {unreadCount} new
              </Badge>
            )}
            <Badge variant="outline">{notifications.length} total</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No Notifications Yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  You'll receive real-time notifications about appointments,
                  reminders, and important updates here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`border rounded-lg p-4 hover:bg-accent/50 transition-all cursor-pointer ${getPriorityColor(
                    notification.isRead
                  )}`}
                  onClick={() => handleView(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-primary mt-1">
                      {getAlertIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>

                          {notification.metadata && (
                            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {notification.metadata.patientName && (
                                <p>• Patient: {notification.metadata.patientName}</p>
                              )}
                              {notification.metadata.appointmentDate && (
                                <p>• Date: {notification.metadata.appointmentDate}</p>
                              )}
                              {notification.metadata.appointmentTime && (
                                <p>• Time: {notification.metadata.appointmentTime}</p>
                              )}
                              {notification.metadata.opNumber && (
                                <p>• OP Number: {notification.metadata.opNumber}</p>
                              )}
                            </div>
                          )}
                        </div>
                        {getPriorityBadge(notification.isRead)}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleDismiss(notification._id, e)}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => handleView(notification)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}