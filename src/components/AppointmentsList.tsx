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
  Upload,
  FileText,
  File,
  Image,
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
import clinicServiceBaseUrl from "../clinicServiceUrl";
import { DashboardHeader } from "./DashboardHeader";
import DentalChart from "./DentalChart";

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
  hasTreatmentPlan?: boolean; // ✅ add this
  treatmentPlan?: any; // ✅ add this (if you’re checking it)
}
interface TreatmentPlan {
  _id: string;
  planName: string;
  description?: string;
  createdAt: string;
  startedAt?: string;
  status: "pending" | "in-progress" | "completed" | "ongoing"; // Added "ongoing"
  stages?: {
    stageName: string;
    description: string;
    status: string;
    scheduledDate: string;
    note: string;
    procedures: Procedure[];
  }[];
  // Add these missing properties from your data
  conflictChecked?: boolean;
  patient: {
    _id: string;
    name: string;
    phone: number;
    email?: string;
    patientRandomId?: string;
    patientUniqueId: string;
  };
  clinic: string;
  createdByDoctor: string;
  treatments?: TreatmentItem[];
  updatedAt?: string;
}
interface TreatmentItem {
  toothNumber: number;
  priority: string;
  isCompleted: boolean;
  procedures: DentalProcedure[];
}
interface DentalProcedure {
  procedureId: string;
  name: string;
  surface: string;
  status: string;
  estimatedCost: number;
  notes?: string;
}
interface Stage {
  stageName: string;
  description?: string;
  scheduledDate: string;
  note?: string;
  procedureRefs?: {
    toothNumber: number;
    procedureName: string;
  }[];
}
interface Procedure {
  name: string;
  doctorId: string;
  referredByDoctorId: string;
  referredToDoctorId: string;
  referralNotes: string;
  completed: boolean;
}

interface TreatmentPlanDetailsModalProps {
  plan: TreatmentPlan | null;
  onClose: () => void;
}
interface Department {
  _id: string;
  departmentName: string;
}

interface Doctor {
  doctorId: string;   // existing
  doctor?: any;       // add only if your API actually sends this
}



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
const [patientTreatmentPlans, setPatientTreatmentPlans] = useState<TreatmentPlan[]>([]);
const [treatmentPlansLoading, setTreatmentPlansLoading] = useState(false);
const [selectedTreatmentPlan, setSelectedTreatmentPlan] = useState<TreatmentPlan | null>(null);
const [departments, setDepartments] = useState<Department[]>([]);
const [selectedDepartment, setSelectedDepartment] = useState("");
const [doctors, setDoctors] = useState<Doctor[]>([]);
const [referralDoctorId, setReferralDoctorId] = useState("");
const [referralReason, setReferralReason] = useState("");
const [uploadFiles, setUploadFiles] = useState<File[]>([]);
const [filePreviews, setFilePreviews] = useState<any[]>([]);
const [showDentalChart, setShowDentalChart] = useState(false);
const [showRecall, setShowRecall] = useState(false);
const [recallDate, setRecallDate] = useState<Date | null>(null);
const [recallTime, setRecallTime] = useState("");
const [recallDepartment, setRecallDepartment] = useState("");
const [dentalData, setDentalData] = useState<{
  performedTeeth: any[];
  plannedProcedures: any[];
   treatmentPlan?: any;
}>({
  performedTeeth: [],
  plannedProcedures: []
});
// const [showTreatmentPlan, setShowTreatmentPlan] = useState(false);

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

      // === 1️⃣ Fetch appointment details ===
      const url = `${patientServiceBaseUrl}/api/v1/patient-service/appointment/fetch/${appointmentId}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = response.data;
      // console.log("121212121",result)
      if (!result.success)
        throw new Error(
          result.message || "Failed to fetch appointment details"
        );

      const appointmentData = result.appointment || result.data;
      setAppointmentDetail(appointmentData);

      // === 2️⃣ Fetch patient history ===
      const patientId = appointmentData.patientId._id;
      const clinicId = appointmentData.clinicId;
const historyUrl = `${patientServiceBaseUrl}/api/v1/patient-service/appointment/patient-history/${patientId}?clinicId=${clinicId}`;
const historyResponse = await axios.get(historyUrl, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

      const historyResult = historyResponse.data;
      console.log("32323232",historyResult)
     if (historyResult.success) {
  const { data: historyData = [] } = historyResult;

  const updatedHistory = historyData.map((item: any) => ({
    ...item,
    hasTreatmentPlan: !!item.treatmentPlan,
  }));

  setPatientHistory(updatedHistory);
}

    } catch (err) {
      console.error("Error fetching details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleClinicClick = (clinic: ClinicAppointments) => {
    setSelectedClinic(clinic);
    console.log("clinic iddddddd", clinic.clinicId);
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
    setUploadFiles([]);
    setFilePreviews([]);
      setShowRecall(false);
  setRecallDate(null);
  setRecallTime("");
  setRecallDepartment("");
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
const fetchDepartments = async () => {
  if (!selectedClinic?.clinicId) {
    console.warn("⚠ No selectedClinic.clinicId");
    return;
  }

  console.log("📌 Fetching departments for clinic:", selectedClinic.clinicId);

  try {
    const url = `${clinicServiceBaseUrl}/api/v1/clinic-service/department/details/${selectedClinic.clinicId}`;
    console.log("➡ API URL:", url);
const response = await axios.get(url);

console.log("Departments response:", response.data);

const raw = response.data?.departments || [];

const formatted = raw.map((d: any, index: number) => {
  if (typeof d === "string") {
    return {
      _id: index.toString(),  // temporary ID
      departmentName: d,
    };
  }
  return d;
});

setDepartments(formatted);

  } catch (err) {
    console.error("❌ Error fetching departments:", err);
  }
};



  // to fetch doctors for referal only ones inside clinic
const fetchDoctorsByDepartment = async (department: string) => {
  if (!department) {
    console.warn("⚠ No department selected");
    return;
  }

  console.log("📌 Fetching doctors for department:", department);
  console.log("📌 Using clinicId:", selectedClinic?.clinicId);

  try {
    const url = `${clinicServiceBaseUrl}/api/v1/clinic-service/department-based/availability`;
    console.log("➡ Doctors API URL:", url);

    const response = await axios.get(url, {
      params: {
        clinicId: selectedClinic?.clinicId,
        department,
      },
    });

    console.log("✅ Doctors Response:", response.data);

    setDoctors(response.data?.doctors || []);
  } catch (err) {
    console.error("❌ Error fetching doctors:", err);
  }
};


useEffect(() => {
  console.log("🏥 Selected Clinic changed:", selectedClinic);

  if (selectedClinic) fetchDepartments();
}, [selectedClinic]);

 // ✅ NEW: File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) return;

    setUploadFiles(prev => [...prev, ...selectedFiles]);

    selectedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews(prev => [...prev, {
            name: file.name,
            type: 'image',
            url: reader.result
          }]);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreviews(prev => [...prev, {
          name: file.name,
          type: file.type.includes('pdf') ? 'pdf' : 'other',
          url: null
        }]);
      }
    });
  };

  const handleRemoveFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

// Alternative using axios
const handleSaveConsultation = async () => {
  if (!appointmentDetail?._id) {
    alert("Invalid appointment data");
    return;
  }

  setLoading(true);

  try {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No authentication token found");

    const clinicId = selectedClinic!.clinicId;

    const formData = new FormData();

    // Append all fields
    const symptomsArray = chiefComplaint.split(',').map(s => s.trim()).filter(Boolean);
    const diagnosisArray = diagnosis.split(',').map(d => d.trim()).filter(Boolean);

    formData.append('symptoms', JSON.stringify(symptomsArray));
    formData.append('diagnosis', JSON.stringify(diagnosisArray));
    formData.append('prescriptions', JSON.stringify(prescriptions));
    formData.append('notes', additionalNotes?.trim() || '');
    formData.append('files', JSON.stringify([]));

    // ✅ Transform dental data to lowercase
    if (dentalData.performedTeeth.length > 0) {
      const transformedPerformedTeeth = dentalData.performedTeeth.map(tooth => ({
        ...tooth,
        conditions: tooth.conditions.map((cond: string) => 
          cond.toLowerCase()
        ),
        surfaceConditions: tooth.surfaceConditions.map((sc: any) => ({
          ...sc,
          conditions: sc.conditions.map((cond: string) => 
            cond.toLowerCase()
          )
        }))
      }));
      
      formData.append('performedTeeth', JSON.stringify(transformedPerformedTeeth));
    }

    if (dentalData.plannedProcedures.length > 0) {
      formData.append('plannedProcedures', JSON.stringify(dentalData.plannedProcedures));
    }

    // ✅ FIXED: PRIORITIZE dentalData.treatmentPlan over form treatment plan
    let finalTreatmentPlan = null;
    
    // 1. First priority: Use treatment plan from DentalChart (which includes teeth data)
    if (dentalData.treatmentPlan) {
      console.log("Using treatment plan from DentalChart:", dentalData.treatmentPlan);
      finalTreatmentPlan = dentalData.treatmentPlan;
    }
    // 2. Second priority: If form has treatment plan AND there are teeth from dental chart
    else if (showTreatmentPlan && planName.trim() && dentalData.plannedProcedures.length > 0) {
      console.log("Building treatment plan from form with dental procedures");
      
      // Format stages properly
      const formattedStages = stages.length > 0 
        ? stages.map(stage => ({
            stageName: stage.stageName,
            description: stage.description || '',
            procedureRefs: stage.procedureRefs || [],
            scheduledDate: stage.scheduledDate || new Date().toISOString().split('T')[0],
            status: 'pending'
          }))
        : [{
            stageName: "Initial Treatment",
            description: "Primary procedures",
            procedureRefs: dentalData.plannedProcedures.map(proc => ({
              toothNumber: proc.toothNumber,
              procedureName: proc.name
            })),
            scheduledDate: new Date().toISOString().split('T')[0],
            status: 'pending'
          }];

      // Extract unique teeth from planned procedures
      const uniqueTeeth = Array.from(new Set(dentalData.plannedProcedures.map(p => p.toothNumber)))
        .map(toothNumber => {
          const proceduresForTooth = dentalData.plannedProcedures.filter(p => p.toothNumber === toothNumber);
          return {
            toothNumber: toothNumber,
            procedures: proceduresForTooth.map(proc => ({
              name: proc.name,
              surface: proc.surface || "occlusal",
              estimatedCost: proc.estimatedCost || 0,
              notes: proc.notes || "",
              status: "planned" as const
            })),
            priority: 'medium' as const
          };
        });

      finalTreatmentPlan = {
        planName: planName.trim(),
        description: planDescription.trim(),
        teeth: uniqueTeeth,
        stages: formattedStages
      };
      
      console.log("Created combined treatment plan:", finalTreatmentPlan);
    }

    // Append treatment plan if exists
    if (finalTreatmentPlan) {
      console.log("Final treatment plan being sent:", finalTreatmentPlan);
      formData.append('treatmentPlan', JSON.stringify(finalTreatmentPlan));
    }

    if (referralDoctorId) {
      formData.append('referral', JSON.stringify({
        referredToDoctorId: referralDoctorId,
        referralReason: referralReason?.trim() || '',
      }));
    }

    if (recallDate && recallTime) {
      formData.append('recall', JSON.stringify({
        appointmentDate: recallDate.toISOString().split('T')[0],
        appointmentTime: recallTime,
        department: recallDepartment || appointmentDetail.department,
      }));
    }

    // Append files
    uploadFiles.forEach(file => {
      formData.append('files', file);
    });

    // Debug log
    console.log("=== FORM DATA BEING SENT ===");
    console.log("Has treatment plan:", !!finalTreatmentPlan);
    if (finalTreatmentPlan) {
      console.log("Treatment plan teeth count:", finalTreatmentPlan.teeth?.length || 0);
      console.log("Treatment plan stages count:", finalTreatmentPlan.stages?.length || 0);
    }
    console.log("===========================");

    // Using axios with FormData
    const response = await axios.post(
      `${patientServiceBaseUrl}/api/v1/patient-service/consultation/consult-patient/${appointmentDetail._id}`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = response.data;

    if (data?.success) {
      alert("✅ Consultation saved successfully!");
      if (data.treatmentPlan) {
        console.log('Treatment plan saved:', data.treatmentPlan);
      }
      handleBackToAppointments?.();
    } else {
      alert(data?.message || "Failed to save consultation");
    }
  } catch (err: any) {
    console.error("❌ Error saving consultation:", err);
    console.error("Error details:", err.response?.data);
    alert(err.response?.data?.message || "Error saving consultation");
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

const fetchPatientTreatmentPlans = async () => {
  try {
    if (!appointmentDetail?.patientId?._id) return;
    setTreatmentPlansLoading(true);

    const token = localStorage.getItem("authToken");
    const response = await axios.get(
      `${patientServiceBaseUrl}/api/v1/patient-service/appointment/treatment-plans/${appointmentDetail.patientId._id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setPatientTreatmentPlans(response.data.data || []);
  } catch (err) {
    console.error("Error fetching treatment plans", err);
  } finally {
    setTreatmentPlansLoading(false);
  }
};

useEffect(() => {
  if (appointmentDetail?.patientId?._id) {
    fetchPatientTreatmentPlans();
  }
}, [appointmentDetail]);
const TreatmentPlanDetailsModal = ({
  plan,
  onClose,
}: TreatmentPlanDetailsModalProps) => {
  const [localPlan, setLocalPlan] = useState<TreatmentPlan | null>(plan);
  const [loading, setLoading] = useState(false);

  if (!localPlan) return null;

  const API_BASE = "/api/v1/patient-service/consultation";

  // Add a new stage

  const handleAddStage = async () => {
    // ✅ Prevent adding stages to completed plans
    if (localPlan.status === "completed") {
      alert("Cannot add stage to a completed treatment plan");
      return;
    }

    const stageName = `Stage ${localPlan.stages?.length! + 1}`;
    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Authentication token not found. Please log in again.");
        return;
      }

      const { data } = await axios.patch(
        `${patientServiceBaseUrl}${API_BASE}/add-stage/${localPlan._id}`,
        {
          stageName,
          description: "",
          scheduledDate: new Date().toISOString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!data.success) throw new Error(data.message);

      setLocalPlan(data.treatmentPlan);
      alert("Stage added successfully!");
    } catch (err: any) {
      console.error("Error adding stage:", err);
      const msg = err.response?.data?.message || err.message || "Failed to add stage";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Finish a stage
const handleFinishStage = async (stageIndex: number) => {
  try {
    setLoading(true);

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Authentication token not found. Please log in again.");
      return;
    }

    const planId = localPlan._id;
    if (!planId) {
      alert("Invalid plan ID");
      return;
    }

    const stage = localPlan.stages?.[stageIndex];
    if (!stage) {
      alert("Stage not found");
      return;
    }

    // ✅ Ensure at least one procedure
    const procedures =
      stage.procedures && stage.procedures.length > 0
        ? stage.procedures
        : [{ name: "Default Procedure" }];

    console.log(
      "Finishing stage:",
      stage.stageName,
      "with",
      procedures.length,
      "procedure(s)"
    );

    let updatedPlan = localPlan;

    // ✅ Loop through procedures
    for (let i = 0; i < procedures.length; i++) {
      const url = `${patientServiceBaseUrl}${API_BASE}/update-procedure-status/${planId}/${stageIndex}/${i}`;
      console.log("Calling:", url);

      const { data } = await axios.patch(
        url,
        { completed: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (data.success) {
        updatedPlan = data.treatmentPlan; // Use updated plan from response
      } else {
        throw new Error(data.message || "Procedure update failed");
      }
    }

    // ✅ Update local plan directly (no GET needed)
    setLocalPlan(updatedPlan);
    alert("Stage completed successfully!");
  } catch (error: any) {
    console.error("Error finishing stage:", error);
    const msg =
      error.response?.data?.message ||
      error.message ||
      "Failed to complete stage";
    alert(msg);
  } finally {
    setLoading(false);
  }
};

  // Complete entire treatment plan
 const handleCompletePlan = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Authentication token not found. Please log in again.");
      return;
    }

    const planId = localPlan._id;
    if (!planId) {
      alert("Invalid treatment plan ID");
      return;
    }

    const url = `${patientServiceBaseUrl}${API_BASE}/finish-treatment/${planId}`;
    console.log("Completing entire treatment plan:", url);

    const { data } = await axios.patch(
      url,
      {}, // backend does NOT expect body
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!data.success) {
      throw new Error(data.message || "Failed to complete treatment plan");
    }

    setLocalPlan(data.treatmentPlan);
    alert("Treatment plan completed successfully!");
    fetchPatientTreatmentPlans()
     onClose(); 

  } catch (error: any) {
    console.error("Error completing treatment plan:", error);
    const msg =
      error.response?.data?.message ||
      error.message ||
      "Failed to complete plan";
    alert(msg);
  } finally {
    setLoading(false);
  }
};


  const handleNoteChange = (index: number, note: string) => {
    const updatedStages = [...(localPlan.stages || [])];
    updatedStages[index].note = note;
    setLocalPlan({ ...localPlan, stages: updatedStages });
  };
  const DentalDataSummary = ({ dentalData }: { dentalData: any }) => {
  if (!dentalData.performedTeeth.length && !dentalData.plannedProcedures.length) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Dental Treatment Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {dentalData.performedTeeth.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-2 text-primary">
              Performed Procedures
            </h4>
            <div className="space-y-3">
              {dentalData.performedTeeth.map((tooth: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Tooth #{tooth.toothNumber}</Badge>
                    {tooth.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tooth.conditions.map((cond: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {cond}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {tooth.surfaceConditions.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-gray-600">Surface Conditions:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {tooth.surfaceConditions.map((sc: any, i: number) => (
                          <div key={i} className="text-xs">
                            <span className="font-medium">{sc.surface}:</span>{" "}
                            {sc.conditions.join(", ")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {tooth.procedures.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Procedures:</p>
                      <div className="space-y-2 mt-1">
                        {tooth.procedures.map((proc: any, i: number) => (
                          <div key={i} className="text-sm bg-green-50 p-2 rounded">
                            <div className="flex justify-between">
                              <span className="font-medium">{proc.name}</span>
                              <Badge className="bg-green-100 text-green-800">
                                Completed
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Surface: {proc.surface} • Cost: ₹{proc.cost || 0}
                              {proc.notes && ` • Notes: ${proc.notes}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {dentalData.plannedProcedures.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-primary">
              Planned Procedures
            </h4>
            <div className="space-y-2">
              {dentalData.plannedProcedures.map((proc: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="font-medium">Tooth #{proc.toothNumber} - {proc.name}</div>
                    <div className="text-sm text-gray-600">
                      Surface: {proc.surface} • Estimated: ₹{proc.estimatedCost || 0}
                      {proc.notes && ` • Notes: ${proc.notes}`}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Planned
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

return (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
      >
        <X size={18} />
      </button>

      {/* Treatment Plan Header */}
      <h2 className="text-xl font-semibold text-primary mb-1">
        {localPlan?.planName || "Treatment Plan"}
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        {localPlan?.description || "No description provided"}
      </p>

      {/* Plan Information */}
      <div className="space-y-3 text-xs text-gray-600 mb-4">
        <p>
          <strong>Status:</strong>{" "}
          <span className={`font-medium ${
            localPlan?.status === "completed" ? "text-green-600" :
            localPlan?.status === "ongoing" ? "text-blue-600" :
            "text-yellow-600"
          }`}>
            {localPlan?.status || "Unknown"}
          </span>
        </p>
        <p>
          <strong>Created:</strong> {formatDate(localPlan?.createdAt)}
        </p>
        <p>
          <strong>Started:</strong> {localPlan?.startedAt ? formatDate(localPlan.startedAt) : "Not started"}
        </p>
        <p>
          <strong>Patient:</strong> {localPlan?.patient?.name} ({localPlan?.patient?.patientUniqueId})
        </p>
        <p>
          <strong>Created by Doctor ID:</strong> {localPlan?.createdByDoctor}
        </p>
      </div>

      {/* Treatments (Dental Procedures) */}
      <div className="mt-4">
        <h4 className="font-medium text-sm mb-2 text-primary">
          Dental Treatments
        </h4>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
          {(localPlan?.treatments || []).map((treatment, i) => (
            <div
              key={i}
              className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-sm">
                    Tooth {treatment.toothNumber}
                  </p>
                  <Badge className={`text-[10px] ${
                    treatment.priority === "high" ? "bg-red-100 text-red-700" :
                    treatment.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    Priority: {treatment.priority}
                  </Badge>
                </div>
                <Badge className={`text-[10px] ${
                  treatment.isCompleted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {treatment.isCompleted ? "Completed" : "Pending"}
                </Badge>
              </div>

              {/* Procedures for this tooth */}
              <div className="space-y-1">
                {treatment.procedures.map((procedure, procIndex) => (
                  <div key={procIndex} className="text-xs border-l-2 border-blue-300 pl-2 ml-1">
                    <p className="font-medium">{procedure.name}</p>
                    <div className="flex flex-wrap gap-1 text-gray-600">
                      <span>Surface: {procedure.surface}</span>
                      <span>|</span>
                      <span>Status: {procedure.status}</span>
                      <span>|</span>
                      <span>Cost: ₹{procedure.estimatedCost}</span>
                    </div>
                    {procedure.notes && (
                      <p className="text-gray-500 italic mt-1">Notes: {procedure.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Treatment Stages (If you want to keep stages concept) */}
      {localPlan?.stages && localPlan.stages.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-sm mb-2 text-primary">
            Treatment Stages
          </h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {localPlan.stages.map((stage, i) => (
              <div
                key={i}
                className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-all"
              >
                <p className="font-semibold text-sm">{stage.stageName}</p>
                <p className="text-xs text-gray-600 mb-1">{stage.description}</p>
                <p className="text-xs text-gray-500 mb-2">
                  Scheduled: {formatDate(stage.scheduledDate)}
                </p>

                {stage.procedures && stage.procedures.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Procedures:</p>
                    <div className="space-y-1">
                      {stage.procedures.map((proc, idx) => (
                        <div key={idx} className="text-xs text-gray-600">
                          • {proc.name} {proc.completed ? "(Completed)" : "(Pending)"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Textarea
                  placeholder="Add note..."
                  value={stage.note || ""}
                  onChange={(e) => handleNoteChange(i, e.target.value)}
                  className="text-xs mb-2"
                />

                <div className="flex items-center justify-between">
                  <Badge
                    className={`${
                      stage.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    } text-[10px]`}
                  >
                    {stage.status}
                  </Badge>
                  {stage.status !== "completed" && (
                    <Button
                      size="lg"
                      onClick={() => handleFinishStage(i)}
                      className="text-[11px]"
                      disabled={loading}
                    >
                      Finish Stage
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {/* <div className="flex justify-between mt-5">
        {!localPlan?.conflictChecked && (
          <Button variant="outline" onClick={handleCheckConflict} disabled={loading}>
            <AlertTriangle size={14} className="mr-1" /> Check Conflict
          </Button>
        )}
        <Button
          variant="default"
          onClick={handleCompletePlan}
          disabled={localPlan?.status === "completed" || loading}
        >
          {localPlan?.status === "ongoing" ? "Complete Plan" : "Mark as Ongoing"}
        </Button>
      </div> */}

      {/* Display conflict check status */}
      {localPlan?.conflictChecked && (
        <div className="mt-3 text-xs text-green-600">
          ✓ Conflict check completed
        </div>
      )}
    </div>
  </div>
);
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
                    <CardTitle className="text-lg">
                      Doctor Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-gray-700">
                    <p>
                      <strong>Name:</strong> {selectedHistory.doctor.name}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {selectedHistory.doctor.phoneNumber}
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
          {/* Files Section */}
{selectedHistory.files && selectedHistory.files.length > 0 && (
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Attached Files</CardTitle>
  </CardHeader>

  <CardContent className="space-y-4">
    {selectedHistory.files.map((file, index) => {
      const filePath = `${patientServiceBaseUrl}${file.url}`;
      
      const isImage = file.type?.includes("image");

      return (
        <div
          key={file._id || index}
          className="flex items-center justify-between border p-3 rounded-lg"
        >
          <div className="flex items-center gap-3">
            {/* Preview */}
            {isImage ? (
              <img
                src={filePath}
                crossOrigin="anonymous"
                // onError={(e) => (e.target.src = "/no-preview.png")} // fallback
                alt="Preview"
                className="h-14 w-14 rounded-md object-cover border"
              />
            ) : (
              <div className="h-14 w-14 flex items-center justify-center border rounded-md bg-red-50 text-red-600 font-semibold">
                PDF
              </div>
            )}

            {/* File Info */}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isImage ? "Image" : "PDF"}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(file.uploadedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* View Button */}
          <Button variant="outline" size="sm" onClick={() => window.open(filePath, "_blank")}>
            View
          </Button>
        </div>
      );
    })}
  </CardContent>
</Card>

)}


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

      {/* Full-screen Dental Chart Mode */}
      {showDentalChart ? (
        <div className="fixed inset-0 z-[100] bg-white">
          {/* Dental Chart Header */}
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDentalChart(false)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Consultation
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">Dental Chart</h1>
                <p className="text-sm text-muted-foreground">
                  Patient: {appointmentDetail.patientId.name} • 
                  ID: {appointmentDetail.patientId.patientUniqueId}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDentalChart(false)}
            >
              Save & Close
            </Button>
          </div>

          {/* Full-screen Dental Chart Container */}
          <div className="h-[calc(100vh-80px)] w-full">
         <DentalChart
  patientId={appointmentDetail.patientId._id}
  visitId={appointmentDetail._id}
  mode="edit"
  patientName={appointmentDetail.patientId.name}
  patientUniqueId={appointmentDetail.patientId.patientUniqueId}
  onClose={() => {
    setShowDentalChart(false);
  }}
  onSave={(dentalDataFromChart) => {
    console.log("DentalChart onSave called with:", dentalDataFromChart);
    
    // IMPORTANT: ALWAYS use the treatment plan from DentalChart if it exists
    if (dentalDataFromChart.treatmentPlan) {
      console.log("Setting treatment plan from DentalChart:", dentalDataFromChart.treatmentPlan);
      setDentalData({
        performedTeeth: dentalDataFromChart.performedTeeth || [],
        plannedProcedures: dentalDataFromChart.plannedProcedures || [],
        treatmentPlan: dentalDataFromChart.treatmentPlan
      });
      
      // Update form fields to match DentalChart treatment plan
      setShowTreatmentPlan(true);
      setPlanName(dentalDataFromChart.treatmentPlan.planName);
      setPlanDescription(dentalDataFromChart.treatmentPlan.description || '');
      
      // Type-safe transformation of stages
      const transformedStages: Stage[] = (dentalDataFromChart.treatmentPlan.stages || []).map((stage: any) => {
        let scheduledDate = stage.scheduledDate;
        if (scheduledDate && scheduledDate.includes('T')) {
          scheduledDate = scheduledDate.split('T')[0];
        } else if (!scheduledDate) {
          scheduledDate = new Date().toISOString().split('T')[0];
        }
        
        return {
          stageName: stage.stageName || '',
          description: stage.description || '',
          scheduledDate,
          note: '',
          procedureRefs: stage.procedureRefs || []
        };
      });
      
      setStages(transformedStages);
    } else {
      // If no treatment plan in DentalChart, just update the other data
      setDentalData(prev => ({
        ...prev,
        performedTeeth: [...prev.performedTeeth, ...(dentalDataFromChart.performedTeeth || [])],
        plannedProcedures: [...prev.plannedProcedures, ...(dentalDataFromChart.plannedProcedures || [])]
      }));
    }
    
    alert("Dental chart data saved successfully!");
    setShowDentalChart(false);
  }}
  onProcedureAdded={(toothNumber, procedure) => {
    console.log(`Procedure ${procedure.name} added to tooth ${toothNumber}`);
  }}
/>
          </div>
        </div>
      ) : (
        // Original consultation view when dental chart is not open
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

              {/* ✅ Patient Treatment Plans */}
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 mt-4">
                <h4 className="font-semibold mb-3 text-primary">Patient Treatment Plans</h4>

                {treatmentPlansLoading ? (
                  <p className="text-sm text-muted-foreground">Loading treatment plans...</p>
                ) : patientTreatmentPlans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No treatment plans found</p>
                ) : (
                  <ScrollArea className="h-[250px] pr-2">
                    <div className="space-y-2">
                      {patientTreatmentPlans.map((plan) => (
                        <div
                          key={plan._id}
                          className="flex items-center justify-between p-3 border border-primary/20 rounded-lg bg-white/60 hover:bg-white transition-all cursor-pointer"
                          onClick={() => setSelectedTreatmentPlan(plan)}
                        >
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700">
                              {formatDate(plan.startedAt || plan.createdAt)}
                            </span>
                          </div>
                          <Badge
                            className={`${
                              plan.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : plan.status === "in-progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-yellow-100 text-yellow-700"
                            } text-[10px]`}
                          >
                            {plan.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* ✅ Modal for Treatment Plan Details */}
              {selectedTreatmentPlan && (
                <TreatmentPlanDetailsModal
                  plan={selectedTreatmentPlan}
                  onClose={() => setSelectedTreatmentPlan(null)}
                />
              )}

              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <h4 className="font-semibold mb-3 text-primary">Patient History</h4>

                {detailLoading ? (
                  <p className="text-sm text-muted-foreground">Loading history...</p>
                ) : patientHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No previous visits</p>
                ) : (
                  <ScrollArea className="h-[300px] pr-2">
                    <div className="space-y-3">
                      {patientHistory.map((item) => {
                        const hasTreatmentPlan = !!item.treatmentPlan;

                        return (
                          <div
                            key={item._id}
                            className="bg-white/50 rounded-lg p-3 border border-primary/10 hover:bg-white/80 transition-colors"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-xs font-medium text-primary">
                                {formatDate(item.visitDate || item.appointmentDate || "")}
                              </p>

                              {hasTreatmentPlan && (
                                <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                  Treatment Plan
                                </span>
                              )}
                            </div>

                            {item.doctor && (
                              <p className="text-xs text-muted-foreground mb-1">
                                Dr. {item.doctor.name}
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
                        );
                      })}
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
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Attach Files (Images, PDFs, X-rays, etc.)
                    </label>

                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all">
                          <Upload className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-600">Choose Files</span>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      {uploadFiles.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''} selected
                        </span>
                      )}
                    </div>

                    {/* ✅ Dental Chart Section */}
                    <div className="mt-6">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowDentalChart(true)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Open Dental Chart
                      </Button>
                    </div>

                    {/* File Previews */}
                    {filePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        {filePreviews.map((preview, index) => (
                          <div
                            key={index}
                            className="relative border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-all"
                          >
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-all shadow-md"
                            >
                              <X className="h-3 w-3" />
                            </button>

                            {preview.type === 'image' && preview.url ? (
                              <img
                                src={preview.url}
                                alt={preview.name}
                                className="w-full h-24 object-cover rounded mb-2"
                              />
                            ) : (
                              <div className="w-full h-24 flex items-center justify-center bg-gray-200 rounded mb-2">
                                {preview.type === 'pdf' ? (
                                  <FileText className="h-5 w-5 text-red-500" />
                                ) : (
                                  <File className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                            )}

                            <p className="text-xs text-gray-600 truncate" title={preview.name}>
                              {preview.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Treatment Plan Section */}

                  {dentalData.treatmentPlan && dentalData.treatmentPlan.teeth && dentalData.treatmentPlan.teeth.length > 0 && (
                    <div className="border-t border-gray-200 pt-6 mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">Treatment Plan</h3>
                      </div>

                      <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="mb-4">
                          <div className="font-medium text-gray-700">{dentalData.treatmentPlan.planName}</div>
                          {dentalData.treatmentPlan.description && (
                            <p className="text-sm text-gray-600 mt-1">{dentalData.treatmentPlan.description}</p>
                          )}
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-700">Planned Procedures</h4>
                          {dentalData.treatmentPlan.teeth.map((toothPlan: any, idx: number) => (
                            <div key={idx} className="border border-gray-300 bg-white rounded-lg p-3">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">Tooth #{toothPlan.toothNumber}</Badge>
                                  {/* {toothPlan.priority && (
                                    <Badge 
                                      className={`text-xs ${
                                        toothPlan.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                        toothPlan.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                        toothPlan.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      {toothPlan.priority}
                                    </Badge>
                                  )} */}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {toothPlan.procedures.length} procedure(s)
                                </span>
                              </div>

                              <div className="space-y-2">
                                {toothPlan.procedures.map((proc: any, procIdx: number) => (
                                  <div key={procIdx} className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-start mb-1">
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">{proc.name}</div>
                                        <div className="text-sm text-gray-600 mt-1">
                                          Surface: <span className="font-medium capitalize">{proc.surface}</span>
                                        </div>
                                        {proc.notes && (
                                          <div className="text-sm text-gray-600 mt-1 italic">
                                            Note: {proc.notes}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right ml-4">
                                        <div className="font-semibold text-gray-900">
                                          ₹{proc.estimatedCost || 0}
                                        </div>
                                        <Badge variant="outline" className="mt-1 bg-yellow-50 text-yellow-700 text-xs">
                                          {proc.status || 'Planned'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Total cost for this tooth */}
                              <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">
                                  Total for Tooth #{toothPlan.toothNumber}:
                                </span>
                                <span className="font-semibold text-gray-900">
                                  ₹{toothPlan.procedures.reduce((sum: number, p: any) => sum + (p.estimatedCost || 0), 0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Overall summary */}
                        <div className="mt-4 pt-4 border-t-2 border-gray-300 bg-primary/5 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-gray-900">Treatment Plan Summary</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {dentalData.treatmentPlan.teeth.length} teeth • {' '}
                                {dentalData.treatmentPlan.teeth.reduce((sum: number, t: any) => sum + t.procedures.length, 0)} total procedures
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Estimated Total</div>
                              <div className="text-xl font-bold text-primary">
                                ₹{dentalData.treatmentPlan.teeth.reduce((sum: number, t: any) => 
                                  sum + t.procedures.reduce((pSum: number, p: any) => pSum + (p.estimatedCost || 0), 0), 0
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Referral Section */}
                  <div className="border-t border-gray-200 pt-6 mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Refer Patient
                    </h3>

                    {/* Department Select */}
                    <select
                      className="w-full p-2 border rounded"
                      value={selectedDepartment}
                      onChange={(e) => {
                        const depName = e.target.value;
                        console.log("🟦 Department selected:", depName);
                        setSelectedDepartment(depName);
                        fetchDoctorsByDepartment(depName);
                      }}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dep: any) => (
                        <option key={dep._id} value={dep.departmentName}>
                          {dep.departmentName}
                        </option>
                      ))}
                    </select>

                    {/* Doctors Dropdown */}
                    <div className="mb-4">
                      <label className="text-sm font-medium block mb-1">
                        Refer To Doctor
                      </label>
                      <select
                        className="w-full p-2 border rounded"
                        value={referralDoctorId}
                        onChange={(e) => {
                          const doctorId = e.target.value;
                          console.log("🟩 Doctor selected:", doctorId);
                          setReferralDoctorId(doctorId);
                        }}
                      >
                        <option value="">Select Doctor</option>
                        {doctors.map((doc) => (
                          <option key={doc.doctorId} value={doc.doctorId}>
                            {doc.doctor?.name || "Unnamed Doctor"}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Referral Reason */}
                    {referralDoctorId && (
                      <div className="mb-4">
                        <label className="text-sm font-medium block mb-1">
                          Referral Reason
                        </label>
                        <textarea
                          className="w-full border p-2 rounded-lg text-sm min-h-[80px]"
                          placeholder="Explain why patient is being referred..."
                          value={referralReason}
                          onChange={(e) => setReferralReason(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Recall/Follow-up Section */}
                  <div className="border-t border-gray-200 pt-6 mt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Schedule Recall/Follow-up
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRecall((prev) => !prev)}
                      >
                        {showRecall ? "Hide" : "Add Recall"}
                      </Button>
                    </div>

                    {showRecall && (
                      <div className="space-y-4 bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Recall Date Picker */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Recall Date
                            </label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {recallDate ? (
                                    format(recallDate, "MMM dd, yyyy")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={recallDate || undefined}
                                  onSelect={(date) => setRecallDate(date || null)}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Recall Time */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Recall Time
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="time"
                                className="pl-10"
                                value={recallTime}
                                onChange={(e) => setRecallTime(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Preview */}
                        {recallDate && recallTime && (
                          <div className="bg-white p-3 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-gray-700">
                              Recall Appointment Preview:
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              📅 {format(recallDate, "EEEE, MMMM dd, yyyy")} at {recallTime}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Department: {recallDepartment || appointmentDetail?.department || 'Current'}
                            </p>
                          </div>
                        )}
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
            </div>
          </div>
        </div>
      )}
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
