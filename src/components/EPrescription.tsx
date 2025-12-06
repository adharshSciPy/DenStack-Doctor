import { Plus, FileText, Send, Mail, MessageCircle, Clock, User, Phone, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:8002/api/v1/patient-service";

interface Patient {
  _id: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  patientUniqueId: string;
}

interface Appointment {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  opNumber: string;
  patient: Patient;
}

interface ClinicGroup {
  clinicId: string | null;
  clinicName: string;
  clinicPhone: string | null;
  appointments: Appointment[];
}

interface Prescription {
  id: string;
  patientName: string;
  medication: string;
  dosage: string;
  duration: string;
  status: "pending" | "approved" | "sent";
}

const mockPrescriptions: Prescription[] = [
  {
    id: "1",
    patientName: "Sarah Johnson",
    medication: "Amoxicillin",
    dosage: "500mg, 3 times daily",
    duration: "7 days",
    status: "approved"
  },
  {
    id: "2",
    patientName: "Michael Chen",
    medication: "Ibuprofen",
    dosage: "400mg, as needed",
    duration: "5 days",
    status: "pending"
  },
];

export default function EPrescription() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [appointments, setAppointments] = useState<ClinicGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState("");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("authToken"); // Adjust based on your auth implementation
      
      const queryParams = new URLSearchParams({
        status: "all",
        date: selectedDate,
        search: search,
        limit: "50"
      });

      const response = await fetch(`${API_BASE_URL}/appointment/fetch?${queryParams}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (data.success) {
        setAppointments(data.data || []);
      } else {
        setError(data.message || "Failed to fetch appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const handleSearch = () => {
    fetchAppointments();
  };

  const handleShare = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShareDialogOpen(true);
  };

  const handleSendEmail = () => {
    console.log("Sending via email...");
    setShareDialogOpen(false);
  };

  const handleSendWhatsApp = () => {
    console.log("Sending via WhatsApp...");
    setShareDialogOpen(false);
  };

  const totalAppointments = appointments.reduce((sum, clinic) => sum + clinic.appointments.length, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Today's Appointments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Today's Appointments</span>
              {totalAppointments > 0 && (
                <Badge variant="secondary">{totalAppointments}</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, phone, or patient ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-center py-4 text-destructive">
              <p>{error}</p>
            </div>
          )}

          {/* Appointments List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No appointments found for selected date</p>
            </div>
          ) : (
            <div className="space-y-6">
              {appointments.map((clinic) => (
                <div key={clinic.clinicId || "unknown"} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <FileText className="w-4 h-4" />
                    {clinic.clinicName}
                    {clinic.clinicPhone && (
                      <span className="text-muted-foreground font-normal">
                        • {clinic.clinicPhone}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {clinic.appointments.map((appointment) => (
                      <div
                        key={appointment._id}
                        className="flex justify-between items-start p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <p className="font-semibold">{appointment.patient?.name || "Unknown Patient"}</p>
                            <Badge
                              variant={
                                appointment.status === "scheduled"
                                  ? "default"
                                  : appointment.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {appointment.status.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="font-medium">
                              OP No: <span className="font-bold">{appointment.opNumber}</span>
                            </span>
                            <span className="font-medium">
                              Patient ID:{" "}
                              <span className="font-bold">
                                {appointment.patient?.patientUniqueId}
                              </span>
                            </span>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{appointment.patient?.phone}</span>
                            </div>
                            <div className="text-primary font-semibold">
                              {appointment.appointmentTime}
                            </div>
                          </div>
                        </div>

                        <Button size="sm" className="ml-4">
                          Create Prescription
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Treatment Plan</DialogTitle>
            <DialogDescription>
              Choose how to share this prescription with {selectedPrescription?.patientName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              variant="outline"
              className="h-auto py-4 justify-start"
              onClick={handleSendEmail}
            >
              <Mail className="mr-4 h-6 w-6" />
              <div className="text-left">
                <p className="font-medium">Send via Email</p>
                <p className="text-sm text-muted-foreground">
                  Send prescription to patient's registered email
                </p>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="h-auto py-4 justify-start"
              onClick={handleSendWhatsApp}
            >
              <MessageCircle className="mr-4 h-6 w-6" />
              <div className="text-left">
                <p className="font-medium">Send via WhatsApp</p>
                <p className="text-sm text-muted-foreground">
                  Send prescription to patient's WhatsApp
                </p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}