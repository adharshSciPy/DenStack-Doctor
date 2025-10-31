import { AlertCircle, Clock, FileText, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface Alert {
  id: string;
  type: "follow-up" | "task" | "report" | "general";
  title: string;
  description: string;
  time: string;
  priority: "high" | "medium" | "low";
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "follow-up",
    title: "Follow-up: Sarah Johnson",
    description: "Scheduled for tomorrow at 10:00 AM - Post root canal checkup",
    time: "2 hours ago",
    priority: "high"
  },
  {
    id: "2",
    type: "report",
    title: "New Lab Report: Michael Chen",
    description: "Blood work results are now available for review",
    time: "3 hours ago",
    priority: "high"
  },
  {
    id: "3",
    type: "task",
    title: "Pending Task: Update Treatment Plan",
    description: "Treatment plan for John Doe requires approval",
    time: "5 hours ago",
    priority: "medium"
  },
  {
    id: "4",
    type: "follow-up",
    title: "Follow-up: Emily Davis",
    description: "Post-cleaning follow-up scheduled for next week",
    time: "1 day ago",
    priority: "low"
  },
  {
    id: "5",
    type: "general",
    title: "Inventory Alert",
    description: "Surgical gloves running low - 15 boxes remaining",
    time: "1 day ago",
    priority: "medium"
  },
];

export function AlertsPanel() {
  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "follow-up":
        return <Clock className="h-5 w-5" />;
      case "task":
        return <AlertCircle className="h-5 w-5" />;
      case "report":
        return <FileText className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: Alert["priority"]) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500";
      case "medium":
        return "border-l-4 border-l-yellow-500";
      case "low":
        return "border-l-4 border-l-green-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Alerts & Notifications</CardTitle>
          <Badge variant="outline">{mockAlerts.length} active</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-4">
            {mockAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 hover:bg-[var(--hover)] transition-colors ${getPriorityColor(
                  alert.priority
                )}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-primary mt-1">{getAlertIcon(alert.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.description}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          alert.priority === "high"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : alert.priority === "medium"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }
                      >
                        {alert.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          Dismiss
                        </Button>
                        <Button size="sm" className="bg-primary hover:bg-primary/90">
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
