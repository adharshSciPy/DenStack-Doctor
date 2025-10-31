import { Clock, MapPin, Phone, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: "in-person" | "video";
  status: "upcoming" | "in-progress" | "completed";
  reason: string;
  contact: string;
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    patientName: "Sarah Johnson",
    time: "09:00 AM",
    type: "in-person",
    status: "completed",
    reason: "Regular Checkup",
    contact: "+1 234-567-8901"
  },
  {
    id: "2",
    patientName: "Michael Chen",
    time: "10:30 AM",
    type: "video",
    status: "in-progress",
    reason: "Follow-up Consultation",
    contact: "+1 234-567-8902"
  },
  {
    id: "3",
    patientName: "Emily Davis",
    time: "11:45 AM",
    type: "in-person",
    status: "upcoming",
    reason: "Dental Cleaning",
    contact: "+1 234-567-8903"
  },
  {
    id: "4",
    patientName: "James Wilson",
    time: "02:00 PM",
    type: "in-person",
    status: "upcoming",
    reason: "Root Canal Treatment",
    contact: "+1 234-567-8904"
  },
  {
    id: "5",
    patientName: "Lisa Anderson",
    time: "03:30 PM",
    type: "video",
    status: "upcoming",
    reason: "Consultation",
    contact: "+1 234-567-8905"
  },
];

export function AppointmentsList() {
  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "in-progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "upcoming":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Appointments</CardTitle>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          })}
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {mockAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border rounded-lg p-4 hover:bg-[var(--hover)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {appointment.patientName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="font-medium">{appointment.patientName}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {appointment.type === "in-person" ? (
                            <MapPin className="h-4 w-4" />
                          ) : (
                            <Video className="h-4 w-4" />
                          )}
                          <span>{appointment.type === "in-person" ? "In-Person" : "Video Call"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{appointment.contact}</span>
                        </div>
                      </div>
                      <p className="text-sm">{appointment.reason}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status.replace("-", " ")}
                    </Badge>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
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
