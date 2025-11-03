import {
  Clock,
  MapPin,
  Phone,
  Video,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  ArrowLeft,
  User,
  Mail,

} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { useState, useEffect } from "react";
import patientServiceBaseUrl from "../patientServiceBaseUrl";
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./ui/popover";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";
import { Textarea } from "./ui/textarea";

interface Patient {
  _id: string;
  name: string;
  phone: number;
  email: string;
  age: number;
  gender: string;
  patientUniqueId: string;
}

interface AppointmentResponse {
  _id: string;
  patientId: Patient;
  clinicId: string;
  doctorId: string;
  department: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  createdBy: string;
  opNumber: number;
  createdAt: string;
  updatedAt: string;
}

interface Appointment {
  id: string;
  patientName: string;
  patientUniqueId: string;
  time: string;
  date: string;
  type: "in-person" | "video";
  status: "scheduled" | "completed" | "cancelled" | "in-progress";
  department: string;
  contact: string;
  email: string;
  opNumber: number;
  age: number;
  gender: string;
}

interface CursorPaginationData {
  currentPage: number;
  itemsPerPage: number;
  hasMore: boolean;
  cursors: (string | null)[];
  totalFetched: number;
}

interface AppointmentDetail {
  _id: string;
  patientId: Patient;
  clinicId: string;
  doctorId: string;
  department: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  opNumber: number;
}

interface PatientHistoryItem {
  _id: string;
  appointmentId: string;
  appointmentDate?: string;
  visitDate?: string;
  department?: string;
  chiefComplaint?: string;
  symptoms?: string[];
  diagnosis?: string[];
  prescription?: string;
  prescriptions?: any[];
  procedures?: any[];
  notes?: string;
  doctor?: {
    name: string;
    phoneNumber: number;
    specialization: string;
  };
  consultationFee?: number;
  totalAmount?: number;
  isPaid?: boolean;
  status?: string;
  files?: any[];
}

export function AppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<CursorPaginationData>({
    currentPage: 1,
    itemsPerPage: 10,
    hasMore: false,
    cursors: [null],
    totalFetched: 0,
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [appointmentDetail, setAppointmentDetail] = useState<AppointmentDetail | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientHistoryItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [prescription, setPrescription] = useState("");
  const [selectedHistory, setSelectedHistory] = useState<PatientHistoryItem | null>(null);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const transformAppointment = (apt: AppointmentResponse): Appointment => {
    return {
      id: apt._id,
      patientName: apt.patientId.name,
      patientUniqueId: apt.patientId.patientUniqueId,
      time: formatTime(apt.appointmentTime),
      date: formatDate(apt.appointmentDate),
      type: "in-person",
      status: apt.status as any,
      department: apt.department,
      contact: apt.patientId.phone.toString(),
      email: apt.patientId.email || "",
      opNumber: apt.opNumber,
      age: apt.patientId.age,
      gender: apt.patientId.gender,
    };
  };

  const fetchAppointments = async (
    page: number = 1,
    search: string = "",
    resetSearch: boolean = false,
    date: Date | null = selectedDate
  ) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      const cursor =
        resetSearch ? null : page > 1 ? pagination.cursors[page - 1] : null;

      const formattedDate = date
        ? `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}/${String(date.getDate()).padStart(2, "0")}`
        : "";

      const queryParams = new URLSearchParams({
        limit: pagination.itemsPerPage.toString(),
        ...(search && { search }),
        ...(cursor && { cursor }),
        ...(formattedDate && { date: formattedDate }),
      });

      const response = await fetch(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/fetch?${queryParams}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error(`Failed to fetch: ${response.statusText}`);

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Fetch failed");

      const transformed = result.data.map(transformAppointment);
      setAppointments(transformed);

      const newCursors = [...pagination.cursors];
      if (resetSearch) newCursors.length = 1;

      if (result.nextCursor && page === newCursors.length) {
        newCursors.push(result.nextCursor);
      }

      setPagination((prev) => ({
        ...prev,
        currentPage: page,
        hasMore: result.hasMore || false,
        cursors: newCursors,
        totalFetched: resetSearch
          ? result.count
          : prev.totalFetched + result.count,
      }));
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentDetails = async (appointmentId: string) => {
    try {
      console.log("🟢 Fetching details for appointment:", appointmentId);
      setDetailLoading(true);
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      // Fetch appointment details
      const url = `${patientServiceBaseUrl}/api/v1/patient-service/appointment/fetch/${appointmentId}`;
      console.log("🟢 Appointment details URL:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("🟢 Appointment details response status:", response.status);
      
      if (!response.ok) throw new Error("Failed to fetch appointment details");
      const result = await response.json();
      
      console.log("🟢 Appointment details result:", result);
      
      if (!result.success) throw new Error(result.message || "Fetch failed");
      
      // API returns data in 'appointment' field, not 'data'
      const appointmentData = result.appointment || result.data;
      setAppointmentDetail(appointmentData);
      console.log("🟢 Appointment detail state set:", appointmentData);

      // Fetch patient history
      const patientId = appointmentData.patientId._id;
      const clinicId = appointmentData.clinicId;
      
      console.log("🟡 Fetching patient history for:", { patientId, clinicId });

      const historyUrl = `${patientServiceBaseUrl}/api/v1/patient-service/appointment/patient-history/${patientId}`;
      console.log("🟡 Patient history URL:", historyUrl);

      const historyResponse = await fetch(historyUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clinicId }),
      });

      console.log("🟡 Patient history response status:", historyResponse.status);

      if (historyResponse.ok) {
        const historyResult = await historyResponse.json();
        console.log("🟡 Patient history result:", historyResult);
        if (historyResult.success) {
          setPatientHistory(historyResult.data || []);
          console.log("🟡 Patient history state set:", historyResult.data);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching details:", err);
    } finally {
      setDetailLoading(false);
      console.log("✅ Detail loading complete");
    }
  };

  const handleViewDetails = (appointmentId: string) => {
    console.log("🔵 View Details clicked for appointment:", appointmentId);
    setSelectedAppointmentId(appointmentId);
    console.log("🔵 Selected appointment ID set to:", appointmentId);
    fetchAppointmentDetails(appointmentId);
  };

  const handleBack = () => {
    console.log("🔙 Back button clicked");
    setSelectedAppointmentId(null);
    setAppointmentDetail(null);
    setPatientHistory([]);
    setPrescription("");
    setSelectedHistory(null);
    console.log("🔙 State cleared, returning to list view");
  };

  const handleViewHistory = (historyItem: PatientHistoryItem) => {
    console.log("📋 Viewing history item:", historyItem);
    setSelectedHistory(historyItem);
  };

  const handleCloseHistory = () => {
    console.log("❌ Closing history modal");
    setSelectedHistory(null);
  };

  useEffect(() => {
    fetchAppointments(1);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length === 0 || searchQuery.length >= 3) {
        setPagination((prev) => ({
          ...prev,
          currentPage: 1,
          cursors: [null],
          totalFetched: 0,
        }));
        fetchAppointments(1, searchQuery, true);
      }
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handlePageChange = (direction: "prev" | "next") => {
    const newPage =
      direction === "next"
        ? pagination.currentPage + 1
        : pagination.currentPage - 1;
    if (direction === "prev" && newPage >= 1) {
      fetchAppointments(newPage, searchQuery);
    } else if (direction === "next" && pagination.hasMore) {
      fetchAppointments(newPage, searchQuery);
    }
  };

  const getStatusColor = (status: Appointment["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "in-progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ");
  };

  // History Detail Modal

if (selectedHistory) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Modal Header - Fixed */}
        <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold">Visit History Details</h2>
            <p className="text-sm text-muted-foreground">
              {formatDate(selectedHistory.visitDate || selectedHistory.appointmentDate || "")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseHistory}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Doctor Info */}
            {selectedHistory.doctor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Doctor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedHistory.doctor.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{selectedHistory.doctor.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedHistory.doctor.specialization}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Symptoms */}
            {selectedHistory.symptoms && selectedHistory.symptoms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Symptoms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedHistory.symptoms.map((symptom, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chief Complaint */}
            {selectedHistory.chiefComplaint && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chief Complaint</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedHistory.chiefComplaint}</p>
                </CardContent>
              </Card>
            )}

            {/* Diagnosis */}
            {selectedHistory.diagnosis && selectedHistory.diagnosis.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Diagnosis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedHistory.diagnosis.map((diag, idx) => (
                      <Badge key={idx} className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        {diag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prescriptions */}
            {selectedHistory.prescriptions && selectedHistory.prescriptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prescriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedHistory.prescriptions.map((prescription, idx) => (
                      <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Medicine:</span>
                            <p className="font-semibold">{prescription.medicine || "N/A"}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Dosage:</span>
                            <p>{prescription.dosage || "N/A"}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Frequency:</span>
                            <p>{prescription.frequency || "N/A"}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Duration:</span>
                            <p>{prescription.duration || "N/A"}</p>
                          </div>
                          {prescription.instructions && (
                            <div className="col-span-2">
                              <span className="font-medium text-muted-foreground">Instructions:</span>
                              <p>{prescription.instructions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Procedures */}
            {selectedHistory.procedures && selectedHistory.procedures.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Procedures</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedHistory.procedures.map((procedure, idx) => (
                      <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Procedure:</span>
                            <p className="font-semibold">{procedure.name || "N/A"}</p>
                          </div>
                          {procedure.cost && (
                            <div>
                              <span className="font-medium text-muted-foreground">Cost:</span>
                              <p>₹{procedure.cost}</p>
                            </div>
                          )}
                          {procedure.description && (
                            <div>
                              <span className="font-medium text-muted-foreground">Description:</span>
                              <p>{procedure.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {selectedHistory.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{selectedHistory.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Payment Info */}
            {(selectedHistory.consultationFee || selectedHistory.totalAmount) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {selectedHistory.consultationFee && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Consultation Fee:</span>
                        <span className="font-semibold">₹{selectedHistory.consultationFee}</span>
                      </div>
                    )}
                    {selectedHistory.totalAmount && (
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Total Amount:</span>
                        <span className="font-bold text-lg">₹{selectedHistory.totalAmount}</span>
                      </div>
                    )}
                    {selectedHistory.isPaid !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Status:</span>
                        <Badge className={selectedHistory.isPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                          {selectedHistory.isPaid ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status */}
            {selectedHistory.status && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visit Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(selectedHistory.status as any)}>
                    {getStatusLabel(selectedHistory.status)}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modal Footer - Fixed */}
        <div className="border-t px-6 py-4 flex justify-end flex-shrink-0">
          <Button onClick={handleCloseHistory}>Close</Button>
        </div>
      </div>
    </div>
  );
}

  // Detail View Screen
  if (selectedAppointmentId && appointmentDetail) {
    console.log("🎯 Rendering detail view for:", selectedAppointmentId);
    console.log("🎯 Appointment detail data:", appointmentDetail);
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Appointments
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">Appointment Details</h1>
              <h3 className="text-sm text-muted-foreground text-bold">
                OP# {appointmentDetail.opNumber} 
                <h3>
                 {appointmentDetail.patientId.name}
                </h3>
              </h3>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-80px)]">
          {/* Left Sidebar - 30% */}
          <div className="w-[30%] bg-primary/5 border-r p-6 overflow-y-auto">
            <div className="space-y-4">
              {/* Patient Info Card */}
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {appointmentDetail.patientId.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {appointmentDetail.patientId.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {appointmentDetail.patientId.patientUniqueId}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span>
                      {appointmentDetail.patientId.age}Y, {appointmentDetail.patientId.gender}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{appointmentDetail.patientId.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="truncate">{appointmentDetail.patientId.email}</span>
                  </div>
                </div>
              </div>

              {/* Appointment Info Card */}
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <h4 className="font-semibold mb-3 text-primary">Appointment Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span>{formatDate(appointmentDetail.appointmentDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{formatTime(appointmentDetail.appointmentTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-normal">
                      {appointmentDetail.department}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <Badge className={getStatusColor(appointmentDetail.status as any)}>
                      {getStatusLabel(appointmentDetail.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Patient History */}
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <h4 className="font-semibold mb-3 text-primary">Patient History</h4>
                {detailLoading ? (
                  <p className="text-sm text-muted-foreground">Loading history...</p>
                ) : patientHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No previous visits</p>
                ) : (
                  <ScrollArea className="h-[300px] pr-2">
                    <div className="space-y-3">
                      {patientHistory.map((item) => (
                        <div
                          key={item._id}
                          className="bg-white/50 rounded-lg p-3 border border-primary/10 hover:bg-white/80 transition-colors"
                        >
                          <p className="text-xs font-medium text-primary mb-1">
                            {formatDate(item.visitDate || item.appointmentDate || "")}
                          </p>
                          {item.department && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {item.department}
                            </p>
                          )}
                          {item.doctor && (
                            <p className="text-xs text-muted-foreground mb-1">
                              Dr. {item.doctor.name}
                            </p>
                          )}
                          {item.chiefComplaint && (
                            <p className="text-sm mb-1">
                              <span className="font-medium">Complaint:</span> {item.chiefComplaint}
                            </p>
                          )}
                          {item.symptoms && item.symptoms.length > 0 && (
                            <p className="text-sm mb-1">
                              <span className="font-medium">Symptoms:</span> {item.symptoms.join(", ")}
                            </p>
                          )}
                          {item.diagnosis && item.diagnosis.length > 0 && (
                            <p className="text-sm mb-1">
                              <span className="font-medium">Diagnosis:</span> {item.diagnosis.join(", ")}
                            </p>
                          )}
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mb-2">{item.notes}</p>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => handleViewHistory(item)}
                          >
                            View Full Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>

          {/* Right Content - 70% */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Consultation Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Chief Complaint */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Chief Complaint
                    </label>
                    <Textarea
                      placeholder="Enter patient's main complaint..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Diagnosis
                    </label>
                    <Textarea
                      placeholder="Enter diagnosis..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Prescription */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Prescription
                    </label>
                    <Textarea
                      placeholder="Write prescription here..."
                      value={prescription}
                      onChange={(e) => setPrescription(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Additional Notes
                    </label>
                    <Textarea
                      placeholder="Any additional notes or observations..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={handleBack}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-primary text-white hover:bg-primary/90"
                      onClick={() => alert("Consultation saved successfully!")}
                    >
                      Save Consultation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View (Original)
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Appointments</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedDate
                ? format(selectedDate, "EEEE, MMMM d, yyyy")
                : "Select a date"}
            </p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {selectedDate
                  ? format(selectedDate, "MMM d, yyyy")
                  : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date: Date | undefined) => {
                  const normalizedDate = date ?? null;
                  setSelectedDate(normalizedDate);
                  fetchAppointments(1, searchQuery, true, normalizedDate);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="relative mt-4">
          <Search
            className="absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
            style={{ right: "10px" }}
          />
          <Input
            placeholder="Search by name, phone, or patient ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading appointments...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <p className="text-red-500">{error}</p>
              <Button
                onClick={() =>
                  fetchAppointments(pagination.currentPage, searchQuery)
                }
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            {appointments.length === 0 ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground text-lg">
                    No appointments found
                  </p>
                  {searchQuery && (
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search criteria
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border rounded-lg p-4 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3 flex-1">
                          <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                              {appointment.patientName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium">
                                {appointment.patientName}
                              </h4>
                              <span className="text-xs text-muted-foreground">
                                ({appointment.patientUniqueId})
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {appointment.age}Y, {appointment.gender}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span>{appointment.time}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">
                                  OP#{appointment.opNumber}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {appointment.type === "in-person" ? (
                                  <MapPin className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                  <Video className="h-4 w-4 flex-shrink-0" />
                                )}
                                <span>
                                  {appointment.type === "in-person"
                                    ? "In-Person"
                                    : "Video Call"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <span>{appointment.contact}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                              <Badge variant="outline" className="font-normal">
                                {appointment.department}
                              </Badge>
                              <span className="text-muted-foreground">
                                {appointment.date}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusLabel(appointment.status)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(appointment.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p>
                  Page {pagination.currentPage} • Showing {appointments.length}{" "}
                  appointment
                  {appointments.length !== 1 ? "s" : ""}
                </p>
                {searchQuery && (
                  <p className="text-xs mt-1">Filtered by: "{searchQuery}"</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange("prev")}
                  disabled={pagination.currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="px-3 py-1 text-sm border rounded-md bg-muted">
                  {pagination.currentPage}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange("next")}
                  disabled={!pagination.hasMore || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}