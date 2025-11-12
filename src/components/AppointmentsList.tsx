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
  Building2,
  Users,
  X,
  Plus,
  Pill,
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
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { format } from "date-fns";
import "react-day-picker/dist/style.css";
import { Textarea } from "./ui/textarea";
import { cn } from "./ui/utils";
import axios from "axios";

interface Patient {
  _id: string;
  name: string;
  phone: number;
  email?: string;
  age: number;
  gender: string;
  patientUniqueId: string;
}

interface AppointmentItem {
  _id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  opNumber: number;
  patient: Patient;
}

interface ClinicAppointments {
  clinicId: string;
  clinicName: string;
  clinicPhone: number;
  appointments: AppointmentItem[];
}

interface AppointmentResponse {
  success: boolean;
  message: string;
  count: number;
  limit: number;
  nextCursor: string;
  hasMore: boolean;
  data: ClinicAppointments[];
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
type Stage = {
  stageName: string;
  description: string;
  scheduledDate: string;
};
export function AppointmentsList() {
  const [clinicAppointments, setClinicAppointments] = useState<
    ClinicAppointments[]
  >([]);
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
  const [selectedClinic, setSelectedClinic] =
    useState<ClinicAppointments | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [appointmentDetail, setAppointmentDetail] =
    useState<AppointmentDetail | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientHistoryItem[]>(
    []
  );
  const [detailLoading, setDetailLoading] = useState(false);
  // const [prescription, setPrescription] = useState("");
  const [selectedHistory, setSelectedHistory] =
    useState<PatientHistoryItem | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescriptions, setPrescriptions] = useState([
    {
      medicineName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
  ]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [showTreatmentPlan, setShowTreatmentPlan] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [treatmentPlanLoading, setTreatmentPlanLoading] = useState(false);

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

//  useEffect(()=>(
// console.log("clnicId",selectedClinic?.clinicId)
//  ),[]) 
  const fetchAppointments = async (
    page: number = 1,
    search: string = "",
    resetSearch: boolean = false,
    date: Date | null = selectedDate
  ) => {
    try {
      // setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      const cursor = resetSearch
        ? null
        : page > 1
        ? pagination.cursors[page - 1]
        : null;

      const formattedDate = date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(date.getDate()).padStart(2, "0")}`
        : "";

      const queryParams = new URLSearchParams({
        limit: pagination.itemsPerPage.toString(),
        ...(search && { search }),
        ...(cursor && { cursor }),
        ...(formattedDate && { date: formattedDate }),
      });

      const response = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/appointment/fetch?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ✅ Axios automatically parses JSON and stores it in `response.data`
      const result: AppointmentResponse = response.data;

      if (!result.success) throw new Error(result.message || "Fetch failed");

      setClinicAppointments(result.data);

      const newCursors = resetSearch ? [] : [...pagination.cursors];
      if (result.nextCursor && page === newCursors.length + 1) {
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
      setDetailLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found");

      // === Fetch appointment details ===
      const url = `${patientServiceBaseUrl}/api/v1/patient-service/appointment/fetch/${appointmentId}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = response.data;
      if (!result.success)
        throw new Error(
          result.message || "Failed to fetch appointment details"
        );

      const appointmentData = result.appointment || result.data;
      setAppointmentDetail(appointmentData);

      // === Fetch patient history ===
      const patientId = appointmentData.patientId._id;
      const clinicId = appointmentData.clinicId;

      const historyUrl = `${patientServiceBaseUrl}/api/v1/patient-service/appointment/patient-history/${patientId}`;

      const historyResponse = await axios.post(
        historyUrl,
        { clinicId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const historyResult = historyResponse.data;
      if (historyResult.success) {
        setPatientHistory(historyResult.data || []);
      }
    } catch (err) {
      console.error("Error fetching details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleClinicClick = (clinic: ClinicAppointments) => {
    setSelectedClinic(clinic);
    console.log("clinic iddddddd",clinic.clinicId)
  };

  const handleBackToClinicList = () => {
    setSelectedClinic(null);
  };

  const handleViewDetails = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    fetchAppointmentDetails(appointmentId);
  };

  const handleBackToAppointments = () => {
    setSelectedAppointmentId(null);
    setAppointmentDetail(null);
    setPatientHistory([]);
    setPrescriptions([
      {
        medicineName: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
    setSelectedHistory(null);
  };

  const handleViewHistory = (historyItem: PatientHistoryItem) => {
    setSelectedHistory(historyItem);
  };

  const handleCloseHistory = () => {
    setSelectedHistory(null);
  };

  // ✅ Initial load
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchAppointments(1, searchQuery, true);
    }, 15000);

    // Refresh when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAppointments(1, searchQuery, true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [searchQuery, selectedDate]);

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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

  // const formatPrescriptions = () => {
  //   // Example format: "Amoxicillin - 500mg - 3/day - 5 days"
  //   return prescriptions
  //     .split("\n")
  //     .filter((line) => line.trim() !== "")
  //     .map((line) => {
  //       const parts = line.split("-").map((p) => p.trim());
  //       return {
  //         medicineName: parts[0] || "",
  //         dosage: parts[1] || "",
  //         frequency: parts[2] || "",
  //         duration: parts[3] || "",
  //       };
  //     });
  // };

  const handlePrescriptionChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...prescriptions];
    (updated[index] as any)[field] = value;
    setPrescriptions(updated);
  };

  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      {
        medicineName: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  };

  const removePrescription = (index: number) => {
    const updated = prescriptions.filter((_, i) => i !== index);
    setPrescriptions(updated);
  };
  const handleSaveConsultation = async () => {
    if (!appointmentDetail?._id) {
      alert("Invalid appointment data");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");

      const payload = {
        symptoms: chiefComplaint
          ? chiefComplaint
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        diagnosis: diagnosis
          ? diagnosis
              .split(",")
              .map((d) => d.trim())
              .filter(Boolean)
          : [],
        prescriptions: prescriptions || [],
        notes: additionalNotes?.trim() || "",
        procedures: [],
        referral: {
          referredToDoctorId: "",
          referralReason: "",
        },
      };

      const res = await axios.post(
        `${patientServiceBaseUrl}/api/v1/patient-service/consultation/consult-patient/${appointmentDetail._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

     if (res?.data?.success) {
  alert("Consultation saved successfully!");

  setClinicAppointments((prev) =>
    prev.map((clinic) =>
      clinic.clinicId === selectedClinic?.clinicId
        ? {
            ...clinic,
            appointments: clinic.appointments.map((appt) =>
              appt._id === appointmentDetail._id
                ? { ...appt, status: "completed" } // ✅ instantly update
                : appt
            ),
          }
        : clinic
    )
  );

  handleBackToAppointments?.();
}
 else {
        alert(res?.data?.message || "Failed to save consultation");
      }
    } catch (err: unknown) {
      console.error("❌ Error saving consultation:", err);
      if (axios.isAxiosError(err)) {
        alert(
          err.response?.data?.message ||
            "Something went wrong. Please try again."
        );
      } else {
        alert("Unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const addStage = () => {
    setStages((prev) => [
      ...prev,
      { stageName: "", description: "", scheduledDate: "" },
    ]);
  };

  const removeStage = (index: number) => {
    setStages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStageChange = (index: number, field: string, value: string) => {
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

const handleStartTreatmentPlan = async () => {
  if (treatmentPlanLoading) return; // prevent multiple clicks instantly
  setTreatmentPlanLoading(true);

  try {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No authentication token found");

    if (!appointmentDetail) {
      alert("Missing appointment details");
      return;
    }

    const clinicId = selectedClinic!.clinicId;

    const payload = {
      clinicId,
      planName,
      description: planDescription,
      stages,
    };

    console.log("Starting treatment plan with payload:", payload);

    const response = await axios.post(
      `${patientServiceBaseUrl}/api/v1/patient-service/consultation/start-treatment/${appointmentDetail.patientId._id}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data;

    if (result.success) {
      alert("✅ Treatment plan started successfully!");
    } else {
      alert(result.message || "Failed to start treatment plan");
    }
  } catch (err) {
    console.error("Error starting treatment plan:", err);
    alert("❌ Error starting treatment plan");
  } finally {
    setTreatmentPlanLoading(false); // ✅ always reset
  }
};




  // History Detail Modal
 if (selectedHistory) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-lg">
        {/* Header */}
        <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold">Visit History Details</h2>
            <p className="text-sm text-muted-foreground">
              {formatDate(
                selectedHistory.visitDate ||
                  selectedHistory.appointmentDate ||
                  ""
              )}
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">

            {/* Doctor Info */}
            {selectedHistory.doctor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Doctor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-gray-700">
                  <p>
                    <strong>Name:</strong> {selectedHistory.doctor.name}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedHistory.doctor.phoneNumber}
                  </p>
                  <p>
                    <strong>Specialization:</strong>{" "}
                    {selectedHistory.doctor.specialization}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Symptoms */}
            {selectedHistory.symptoms &&
              selectedHistory.symptoms.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Symptoms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {selectedHistory.symptoms.join(", ")}
                    </p>
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
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {selectedHistory.chiefComplaint}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Diagnosis */}
            {selectedHistory.diagnosis &&
              selectedHistory.diagnosis.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Diagnosis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {selectedHistory.diagnosis.join(", ")}
                    </p>
                  </CardContent>
                </Card>
              )}

            {/* Prescriptions */}
            {selectedHistory.prescriptions &&
              selectedHistory.prescriptions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      Prescriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedHistory.prescriptions.map((pres, idx) => (
                      <div key={pres._id || idx} className="border-b pb-2">
                        <p className="text-base font-medium text-gray-900">
                          {idx + 1}. {pres.medicineName}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Dosage:</strong> {pres.dosage || "—"} |{" "}
                          <strong>Frequency:</strong> {pres.frequency || "—"}{" "}
                          /day | <strong>Duration:</strong>{" "}
                          {pres.duration || "—"} days
                        </p>
                        {pres.instructions && (
                          <p className="text-sm italic text-gray-600 mt-1">
                            {pres.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

            {/* Additional Notes */}
            {selectedHistory.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-gray-800">
                    {selectedHistory.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end flex-shrink-0">
          <Button onClick={handleCloseHistory}>Close</Button>
        </div>
      </div>
    </div>
  );
}


  // Detail View Screen
  if (selectedAppointmentId && appointmentDetail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToAppointments}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Appointments
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">Appointment Details</h1>
              <p className="text-sm text-muted-foreground">
                OP# {appointmentDetail.opNumber} -{" "}
                {appointmentDetail.patientId.name}
              </p>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-80px)]">
          <div className="w-[30%] bg-primary/5 border-r p-6 overflow-y-auto">
            <div className="space-y-4">
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
                      {appointmentDetail.patientId.age}Y,{" "}
                      {appointmentDetail.patientId.gender}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{appointmentDetail.patientId.phone}</span>
                  </div>
                  {appointmentDetail.patientId.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="truncate">
                        {appointmentDetail.patientId.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <h4 className="font-semibold mb-3 text-primary">
                  Appointment Info
                </h4>
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
                    <Badge className={getStatusColor(appointmentDetail.status)}>
                      {getStatusLabel(appointmentDetail.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <h4 className="font-semibold mb-3 text-primary">
                  Patient History
                </h4>
                {detailLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading history...
                  </p>
                ) : patientHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No previous visits
                  </p>
                ) : (
                  <ScrollArea className="h-[300px] pr-2">
                    <div className="space-y-3">
                      {patientHistory.map((item) => (
                        <div
                          key={item._id}
                          className="bg-white/50 rounded-lg p-3 border border-primary/10 hover:bg-white/80 transition-colors"
                        >
                          <p className="text-xs font-medium text-primary mb-1">
                            {formatDate(
                              item.visitDate || item.appointmentDate || ""
                            )}
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
                              <span className="font-medium">Complaint:</span>{" "}
                              {item.chiefComplaint}
                            </p>
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
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
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
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                    />
                  </div>

                  {/* Prescription */}

                  {/* Prescription */}
                  <div>
                    <label className="text-sm font-semibold mb-3 block text-gray-800">
                      Prescription
                    </label>

                    <div className="space-y-4">
                      {prescriptions.map((prescription, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-2xl shadow-sm p-4 bg-white space-y-3 hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-gray-700">
                              Medicine {index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removePrescription(index)}
                              className="text-red-500 text-sm hover:text-red-600 transition"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Medicine Name
                              </label>
                              <input
                                type="text"
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Amoxicillin"
                                value={prescription.medicineName}
                                onChange={(e) =>
                                  handlePrescriptionChange(
                                    index,
                                    "medicineName",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Dosage
                              </label>
                              <input
                                type="text"
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. 500 mg"
                                value={prescription.dosage}
                                onChange={(e) =>
                                  handlePrescriptionChange(
                                    index,
                                    "dosage",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Frequency
                              </label>
                              <input
                                type="text"
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. 3 times/day"
                                value={prescription.frequency}
                                onChange={(e) =>
                                  handlePrescriptionChange(
                                    index,
                                    "frequency",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Duration
                              </label>
                              <input
                                type="text"
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. 5 days"
                                value={prescription.duration}
                                onChange={(e) =>
                                  handlePrescriptionChange(
                                    index,
                                    "duration",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Instructions
                            </label>
                            <textarea
                              className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[60px]"
                              placeholder="e.g. Take after meals"
                              value={prescription.instructions}
                              onChange={(e) =>
                                handlePrescriptionChange(
                                  index,
                                  "instructions",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={addPrescription}
                          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                        >
                          + Add Another Medicine
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Additional Notes
                    </label>
                    <Textarea
                      placeholder="Any additional notes or observations..."
                      className="min-h-[100px]"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                    />
                  </div>
                  <div className="border-t border-gray-200 pt-6 mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Treatment Plan
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTreatmentPlan((prev) => !prev)}
                      >
                        {showTreatmentPlan ? "Hide" : "Add Treatment Plan"}
                      </Button>
                    </div>

                    {showTreatmentPlan && (
                      <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Plan Name
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Orthodontic Plan"
                            value={planName}
                            onChange={(e) => setPlanName(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                            placeholder="Describe treatment goals, key steps..."
                            value={planDescription}
                            onChange={(e) => setPlanDescription(e.target.value)}
                          />
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-700 mb-2">
                            Stages
                          </h4>
                          {stages.map((stage, index) => (
                            <div
                              key={index}
                              className="border border-gray-300 bg-white rounded-xl p-3 space-y-3"
                            >
                              <div className="flex justify-between items-center">
                                <h5 className="text-sm font-semibold text-gray-700">
                                  Stage {index + 1}
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => removeStage(index)}
                                  className="text-xs text-red-500 hover:text-red-600"
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  placeholder="Stage Name"
                                  value={stage.stageName}
                                  onChange={(e) =>
                                    handleStageChange(
                                      index,
                                      "stageName",
                                      e.target.value
                                    )
                                  }
                                  className="border rounded-lg p-2 text-sm"
                                />
                                <input
                                  type="date"
                                  value={stage.scheduledDate || ""}
                                  onChange={(e) =>
                                    handleStageChange(
                                      index,
                                      "scheduledDate",
                                      e.target.value
                                    )
                                  }
                                  className="border rounded-lg p-2 text-sm"
                                />
                              </div>

                              <textarea
                                placeholder="Stage Description"
                                value={stage.description}
                                onChange={(e) =>
                                  handleStageChange(
                                    index,
                                    "description",
                                    e.target.value
                                  )
                                }
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={addStage}
                            className="text-blue-600 text-sm hover:text-blue-700 font-medium"
                          >
                            + Add Stage
                          </button>
                        </div>

                        <div className="flex justify-end">
                         <Button
  className="bg-green-600 text-white hover:bg-green-700"
  onClick={handleStartTreatmentPlan}
  disabled={treatmentPlanLoading} // disable while loading
>
  {treatmentPlanLoading ? "Starting..." : "Start Plan"}
</Button>

                        </div>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleBackToAppointments}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-primary text-white hover:bg-primary/90"
                      onClick={handleSaveConsultation}
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Consultation"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {/* Treatment Plan Section */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Clinic Appointments Modal View
  if (selectedClinic) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToClinicList}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clinics
          </Button>
          <div className="flex-1">
            {/* <h1 className="text-2xl font-semibold">{selectedClinic.clinicName}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {selectedClinic.clinicPhone}
          </p> */}
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {selectedClinic.appointments.length} Appointment
            {selectedClinic.appointments.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Content Split Layout */}
        <div className="flex h-[calc(100vh-80px)]">
          {/* ===== Left Sidebar ===== */}
          <div className="w-full md:w-[30%] bg-primary/5 border-r p-6 overflow-y-auto">
            {/* Clinic Info */}
            <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary/20 p-3 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedClinic.clinicName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedClinic.clinicPhone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                <span>
                  {selectedClinic.appointments.length} Total Appointments
                </span>
              </div>
            </div>

            {/* Appointment List */}
            <div className="bg-white rounded-xl border border-primary/10 shadow-sm">
              <div className="px-4 py-3 border-b text-primary font-semibold">
                Appointments
              </div>
              <ScrollArea className="h-[calc(100vh-260px)]">
                <div className="divide-y divide-primary/10">
                  {selectedClinic.appointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      onClick={() => handleViewDetails(appointment._id)}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-primary/5 transition-colors",
                        selectedAppointmentId === appointment._id
                          ? "bg-primary/10 border-l-4 border-primary"
                          : ""
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {appointment.patient.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium truncate">
                            {appointment.patient.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {formatTime(appointment.appointmentTime)} •{" "}
                            {formatDate(appointment.appointmentDate)}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getStatusColor(appointment.status)
                          )}
                        >
                          {getStatusLabel(appointment.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* ===== Right Content Panel ===== */}

          {/* <div className="flex-1 p-6 overflow-y-auto">
          {selectedAppointmentId && appointmentDetail ? (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Appointment Details – {appointmentDetail.patientId.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                 
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Chief Complaint
                    </label>
                    <Textarea
                      placeholder="Enter patient's main complaint..."
                      className="min-h-[100px]"
                    />
                  </div>

                
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Diagnosis
                    </label>
                    <Textarea
                      placeholder="Enter diagnosis..."
                      className="min-h-[100px]"
                    />
                  </div>

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

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Additional Notes
                    </label>
                    <Textarea
                      placeholder="Any additional notes or observations..."
                      className="min-h-[100px]"
                    />
                  </div>

                 
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={handleBackToClinicList}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-primary text-white hover:bg-primary/90"
                      onClick={() =>
                        alert("Consultation saved successfully!")
                      }
                    >
                      Save Consultation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <Building2 className="mx-auto h-12 w-12 opacity-50" />
                <p>Select an appointment to view details</p>
              </div>
            </div>
          )}
        </div> */}
        </div>
      </div>
    );
  }

  // Clinic Cards List View
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Appointments by Clinic</CardTitle>
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

        {/* <div className="relative mt-4">
          <Search
            className="absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
            style={{ right: "10px" }}
          />
          <Input
            placeholder="Search by clinic name, patient name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-9"
          />
        </div> */}
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
            {clinicAppointments.length === 0 ? (
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
              <ScrollArea className="max-h-[80vh] overflow-y-auto pr-2 sm:pr-4">
                <div
                  className="
      flex flex-wrap
      gap-4 sm:gap-6
      justify-start
      items-stretch
    "
                >
                  {clinicAppointments.map((clinic) => (
                    <Card
                      key={clinic.clinicId}
                      onClick={() => handleClinicClick(clinic)}
                      className="
          cursor-pointer
          flex flex-col
          justify-between
          border border-border
          hover:border-primary/50
          hover:shadow-lg
          hover:shadow-primary/10
          transition-transform
          transform hover:scale-[1.02]
          duration-300
          rounded-2xl
          bg-card
          w-full sm:w-[calc(50%-0.75rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(25%-1rem)]
        "
                    >
                      <CardContent className="p-4 sm:p-6 flex flex-col justify-between h-full">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/10 p-2.5 sm:p-3 rounded-xl">
                                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-base sm:text-lg truncate max-w-[140px] sm:max-w-[160px]">
                                  {clinic.clinicName}
                                </h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  <span>{clinic.clinicPhone}</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Appointment Count */}
                          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="text-sm sm:text-base">
                                Appointments
                              </span>
                            </div>
                            <Badge className="bg-primary text-primary-foreground text-sm sm:text-base px-3 py-1 rounded-md">
                              {clinic.appointments.length}
                            </Badge>
                          </div>

                          {/* Appointment List Preview */}
                          {/* <div className="pt-1 sm:pt-2">
                            <div className="text-xs text-muted-foreground space-y-1">
                              {clinic.appointments
                                .slice(0, 2)
                                .map((apt, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between"
                                  >
                                    <span className="truncate max-w-[100px] sm:max-w-[120px]">
                                      {apt.patient.name}
                                    </span>
                                    <span className="ml-2 flex-shrink-0">
                                      {formatTime(apt.appointmentTime)}
                                    </span>
                                  </div>
                                ))}
                              {clinic.appointments.length > 2 && (
                                <div className="text-center pt-1 font-medium text-primary">
                                  +{clinic.appointments.length - 2} more
                                </div>
                              )}
                            </div>
                          </div> */}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p>
                  Page {pagination.currentPage} • Showing{" "}
                  {clinicAppointments.length} clinic
                  {clinicAppointments.length !== 1 ? "s" : ""}
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
