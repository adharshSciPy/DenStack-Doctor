import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Search,
  User,
  Calendar,
  FileText,
  Pill,
  DollarSign,
  Activity,
  Download,
  Eye,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  UserCircle,
  History,
  Building,
  Hash,
  CalendarDays,
  ChevronLeft,
  ChevronDown,
  Stethoscope,
  CreditCard,
  Receipt,
  Users,
} from "lucide-react";
import axios from "axios";
import patientServiceBaseUrl from "../patientServiceBaseUrl";
import  DentalChartView  from "./DentalChartView";

// Interface for Consulted Patients API response
interface ConsultedPatient {
  patientId: string;
  patientName: string;
  clinicId: string;
  clinicName: string;
  clinicEmail: string;
  clinicPhone: number;
  lastVisitDate: string;
}

interface ConsultedPatientsResponse {
  success: boolean;
  count: number;
  data: ConsultedPatient[];
  nextCursor: {
    visitDate: string;
    _id: string;
  } | null;
  hasNextPage: boolean;
  totalCount: number;
}

interface DentalChart {
  toothNumber: number;
  conditions: string[];
  procedures: any[];
  lastVisitId: string | null;
  lastUpdated: string;
  lastUpdatedBy: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface PatientProfile {
  _id: string;
  name: string;
  phone: number;
  email: string;
  age: number;
  gender: string;
  clinicId: string;
  patientUniqueId: string;
  dentalChart: DentalChart[];
}

interface PatientRecord {
  patientId: string;
  clinicId: string;
  patientUniqueId: string;
  profile: PatientProfile;
  dentalChart: DentalChart[];
  totalVisits: number;
}

interface PatientSearchResponse {
  patientRandomId: string;
  records: PatientRecord[];
}

// Visit History Interfaces
interface SurfaceCondition {
  surface: string;
  conditions: string[];
  _id: string;
}

interface DentalWork {
  toothNumber: number;
  conditions: string[];
  surfaceConditions: SurfaceCondition[];
  procedures: any[];
  _id: string;
}

// ✅ NEW: Interface for clinical dropdown entries
interface ClinicalEntry {
  value: string;
  isCustom: boolean;
  code?: string;
  category?: string;
  selectedAt?: string;
}

interface VisitHistory {
  _id: string;
  clinicId: string;
  doctorId: string;
  appointmentId: string;
  consultationFee: number;
  totalAmount: number;
  isPaid: boolean;
  status: "completed" | "pending";
  dentalWork: DentalWork[];
  visitDate: string;
  treatmentPlanId?: string;
  
  // ✅ FIXED: Replace 'symptoms' with new schema fields
  chiefComplaints: ClinicalEntry[];     // From backend - replaces symptoms
  examinationFindings: ClinicalEntry[]; // New field
  dentalHistory: ClinicalEntry[];       // New field
  diagnosis: string[];                 // Still exists
  prescriptions: {
    medicineName: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }[];
  notes: string;
  files: {
    url: string;
    type: "image" | "pdf" | "report" | "other";
    uploadedAt: string;
  }[];
  procedures: {
    name: string;
    description?: string;
    fee: number;
  }[];
  labHistory: string[];
  referral: {
    status: string;
    referredByDoctorId?: string;
    referredToDoctorId?: string;
    referralReason?: string;
    referralDate?: string;
  };
  receptionBilling: {
    procedureCharges: Array<{ name: string; fee: number; notes?: string }>;
    consumableCharges: Array<{ item: string; fee: number; notes?: string }>;
    addedBy?: string;
    updatedAt?: string;
  };
  softTissueExamination: any[];
  tmjExamination: any[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  billId?: string;
}

interface VisitHistoryResponse {
  success: boolean;
  data: VisitHistory[];
  nextCursor: {
    visitDate: string;
    _id: string;
  };
  hasNextPage: boolean;
}

// Medical History Interface
interface MedicalHistory {
  bloodGroup: string;
  height: string;
  weight: string;
  bloodPressure: string;
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  lastCheckup: string;
  smokingStatus: "Non-smoker" | "Former smoker" | "Current smoker";
  alcoholConsumption: "Never" | "Occasionally" | "Regularly";
}

interface PatientRecordsProps {
  doctorId: string | null;
}

export function PatientRecords({ doctorId }: PatientRecordsProps) {
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientSearchResponse | null>(
    null
  );
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"details" | "history">("details");
  const [visitHistory, setVisitHistory] = useState<VisitHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitHistory | null>(null);
  const [showVisitDrawer, setShowVisitDrawer] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    hasNextPage: false,
    nextCursor: null as { visitDate: string; _id: string } | null,
  });
  
  // New state for consulted patients
  const [consultedPatients, setConsultedPatients] = useState<ConsultedPatient[]>([]);
  const [loadingConsultedPatients, setLoadingConsultedPatients] = useState(false);
  const [showConsultedPatients, setShowConsultedPatients] = useState(false);
  const [consultedPagination, setConsultedPagination] = useState({
    hasNextPage: false,
    nextCursor: null as { visitDate: string; _id: string } | null,
    totalCount: 0,
  });
  const [showDentalChart, setShowDentalChart] = useState(false);
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date for display
  const formatSimpleDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format age with suffix
  const formatAge = (age: number) => {
    return `${age} ${age === 1 ? 'year' : 'years'} old`;
  };

  // Count dental conditions and procedures
  const getDentalStats = (dentalChart: DentalChart[]) => {
    let totalConditions = 0;
    let totalProcedures = 0;
    let plannedProcedures = 0;
    let completedProcedures = 0;

    dentalChart.forEach(tooth => {
      totalConditions += tooth.conditions.length;
      
      tooth.procedures.forEach(proc => {
        totalProcedures++;
        if (proc.status === "planned") {
          plannedProcedures++;
        } else if (proc.status === "completed") {
          completedProcedures++;
        }
      });
    });

    return { totalConditions, totalProcedures, plannedProcedures, completedProcedures };
  };

  // Fetch consulted patients by doctor ID
  const fetchConsultedPatients = async (loadMore = false) => {
    if (!doctorId) {
      alert("Doctor ID not found. Please login again.");
      return;
    }

    try {
      setLoadingConsultedPatients(true);
      
      let url = `${patientServiceBaseUrl}/api/v1/patient-service/consultation/consulted-patients/${doctorId}`;
      
      // Add cursor for pagination if loading more
      if (loadMore && consultedPagination.nextCursor) {
        const cursor = consultedPagination.nextCursor;
        url += `?cursorDate=${cursor.visitDate}&cursorId=${cursor._id}&limit=10`;
      }

      const res = await axios.get<ConsultedPatientsResponse>(url);

      if (res.data.success) {
        if (loadMore) {
          setConsultedPatients(prev => [...prev, ...res.data.data]);
        } else {
          setConsultedPatients(res.data.data);
        }
        
        setConsultedPagination({
          hasNextPage: res.data.hasNextPage,
          nextCursor: res.data.nextCursor,
          totalCount: res.data.totalCount,
        });
        setShowConsultedPatients(true);
      }
    } catch (error: any) {
      console.error("Error fetching consulted patients:", error);
      alert(error.response?.data?.message || "Error fetching consulted patients");
    } finally {
      setLoadingConsultedPatients(false);
    }
  };

  const handleLoadMoreConsulted = () => {
    if (consultedPagination.hasNextPage) {
      fetchConsultedPatients(true);
    }
  };

// Search patient by Random ID - Using /single-patient endpoint
const handlePatientSearch = async () => {
  if (!patientSearchQuery.trim()) {
    alert("Enter Patient ID");
    return;
  }

  try {
    setSearchLoading(true);
    setSelectedRecord(null);
    setViewMode("details");
    setShowVisitDrawer(false);
    setVisitHistory([]);
    setShowConsultedPatients(false);

    // IMPORTANT: We need clinicId, but we don't have it yet
    // For now, let's use the old endpoint that works
    const res = await axios.get(
      `${patientServiceBaseUrl}/api/v1/patient-service/patient/patient-by-randomId/${patientSearchQuery}`
    );

    if (res.data.success) {
      setPatientData(res.data.data);
      // Select the first record by default
      if (res.data.data.records.length > 0) {
        setSelectedRecord(res.data.data.records[0]);
      }
    } else {
      alert("No patient found");
    }
  } catch (error: any) {
    console.error("Error fetching patient:", error);
    alert(error.response?.data?.message || "Error fetching patient");
  } finally {
    setSearchLoading(false);
  }
};

// Alternative approach using /single-patient endpoint
const handleSelectConsultedPatient = async (patient: ConsultedPatient) => {
  try {
    setSearchLoading(true);
    setShowConsultedPatients(false);
    setSelectedRecord(null);
    setViewMode("details");
    setShowVisitDrawer(false);
    setVisitHistory([]);

    console.log("Consulted patient selected:", patient);

    // Create a mock PatientRecord using the data we have from consulted patients
    // This avoids the need for additional API calls
    const patientRecord: PatientRecord = {
      patientId: patient.patientId, // Use the MongoDB ID from consulted patient
      clinicId: patient.clinicId,
      patientUniqueId: patient.patientId.substring(0, 8), // Generate a shorter ID for display
      profile: {
        _id: patient.patientId,
        name: patient.patientName,
        phone: patient.clinicPhone, // Use clinic phone as placeholder
        email: patient.clinicEmail,
        age: 0, // We don't have this data
        gender: "Unknown", // We don't have this data
        clinicId: patient.clinicId,
        patientUniqueId: patient.patientId.substring(0, 8),
        dentalChart: [] // We'll fetch this separately if needed
      },
      dentalChart: [], // Will be fetched separately
      totalVisits: 1 // At least 1 visit since they're consulted
    };

    // Create a PatientSearchResponse
    const patientSearchResponse: PatientSearchResponse = {
      patientRandomId: patient.patientId.substring(0, 8), // Generate random ID
      records: [patientRecord]
    };

    setPatientData(patientSearchResponse);
    setSelectedRecord(patientRecord);
    
    // Now fetch the actual patient details in background
    fetchFullPatientDetails(patient.patientId, patient.clinicId);

  } catch (error: any) {
    console.error("Error selecting consulted patient:", error);
    alert("Patient selected. Some details may be limited.");
  } finally {
    setSearchLoading(false);
  }
};

// New function to fetch full patient details
const fetchFullPatientDetails = async (patientId: string, clinicId: string) => {
  try {
    // Try to get full patient data
    const res = await axios.get(
      `${patientServiceBaseUrl}/api/v1/patient-service/patient/details/${patientId}`
    );

    if (res.data.success) {
      const patientData = res.data.data;
      
      // Update the selected record with full data
      setSelectedRecord(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          profile: {
            _id: patientData._id,
            name: patientData.name,
            phone: patientData.phone || prev.profile.phone,
            email: patientData.email || prev.profile.email,
            age: patientData.age || prev.profile.age,
            gender: patientData.gender || prev.profile.gender,
            clinicId: patientData.clinicId,
            patientUniqueId: patientData.patientUniqueId || prev.profile.patientUniqueId,
            dentalChart: patientData.dentalChart || []
          },
          dentalChart: patientData.dentalChart || [],
          patientUniqueId: patientData.patientUniqueId || prev.patientUniqueId,
          totalVisits: patientData.visitHistory?.length || patientData.totalVisits || 1
        };
      });

      // Also update patientData
      setPatientData(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          patientRandomId: patientData.patientUniqueId || prev.patientRandomId,
          records: [{
            patientId: patientData._id,
            clinicId: patientData.clinicId,
            patientUniqueId: patientData.patientUniqueId || prev.records[0].patientUniqueId,
            profile: {
              _id: patientData._id,
              name: patientData.name,
              phone: patientData.phone || prev.records[0].profile.phone,
              email: patientData.email || prev.records[0].profile.email,
              age: patientData.age || prev.records[0].profile.age,
              gender: patientData.gender || prev.records[0].profile.gender,
              clinicId: patientData.clinicId,
              patientUniqueId: patientData.patientUniqueId || prev.records[0].profile.patientUniqueId,
              dentalChart: patientData.dentalChart || []
            },
            dentalChart: patientData.dentalChart || [],
            totalVisits: patientData.visitHistory?.length || patientData.totalVisits || 1
          }]
        };
      });

      console.log("Updated with full patient data:", res.data.data);
    }
  } catch (error) {
    console.log("Could not fetch full patient details, using basic info");
  }
};

  // Fetch visit history  
  const fetchVisitHistory = async (patientId: string, loadMore = false) => {
    if (!patientId || !doctorId) return;

    try {
      setLoadingHistory(true);
      
      let url = `${patientServiceBaseUrl}/api/v1/patient-service/patient/visit-history/${patientId}?doctorId=${doctorId}`;
      
      // Add cursor for pagination if loading more
      if (loadMore && historyPagination.nextCursor) {
        const cursor = historyPagination.nextCursor;
        url += `&cursorDate=${cursor.visitDate}&cursorId=${cursor._id}`;
      }

      console.log("Fetching visit history from:", url);

      const res = await axios.get<VisitHistoryResponse>(url);
      console.log("Visit history response:", res.data);


      if (res.data.success) {
        if (loadMore) {
          setVisitHistory(prev => [...prev, ...res.data.data]);
        } else {
          setVisitHistory(res.data.data);
        }
        
        setHistoryPagination({
          hasNextPage: res.data.hasNextPage,
          nextCursor: res.data.nextCursor,
        });
      }
    } catch (error: any) {
      console.error("Error fetching visit history:", error);
      console.error("Error details:", {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data
      });
      alert(error.response?.data?.message || "Error fetching visit history");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setPatientSearchQuery("");
    setPatientData(null);
    setSelectedRecord(null);
    setViewMode("details");
    setShowVisitDrawer(false);
    setVisitHistory([]);
    setShowConsultedPatients(false);
  };

  // Toggle consulted patients view
  const handleShowConsultedPatients = () => {
    if (!doctorId) {
      alert("Doctor ID not found. Please login again.");
      return;
    }

    if (!showConsultedPatients) {
      fetchConsultedPatients();
    } else {
      setShowConsultedPatients(false);
    }
  };

  // Open visit details drawer
  const handleViewVisitDetails = (visit: VisitHistory) => {
    setSelectedVisit(visit);
    setShowVisitDrawer(true);
  };

  // Close visit details drawer
  const handleCloseVisitDrawer = () => {
    setShowVisitDrawer(false);
    setSelectedVisit(null);
  };

  // Handle view mode change
  const handleViewModeChange = (mode: "details" | "history") => {
    setViewMode(mode);
    setShowVisitDrawer(false);
    
    if (mode === "history" && selectedRecord && doctorId) {
      fetchVisitHistory(selectedRecord.patientId);
    }
  };

  // Load more visits
  const handleLoadMore = () => {
    if (selectedRecord && historyPagination.hasNextPage && doctorId) {
      fetchVisitHistory(selectedRecord.patientId, true);
    }
  };

  // Initial load - fetch consulted patients only if doctorId is available
  useEffect(() => {
    if (doctorId) {
      fetchConsultedPatients();
    }
  }, [doctorId]);

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="bg-muted/60">
        <CardContent className="p-6">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label className="mb-2 block font-medium">Patient ID</Label>
              <Input
                placeholder="Enter Patient Random ID (e.g., PZ-318596)"
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePatientSearch();
                }}
                className="h-12"
              />
            </div>
            <Button
              onClick={handlePatientSearch}
              disabled={searchLoading || !doctorId}
              className="h-12 min-w-[140px]"
            >
              <Search className="w-4 h-4 mr-2" />
              {searchLoading ? "Searching..." : "Search"}
            </Button>
            <Button
              variant="outline"
              onClick={handleShowConsultedPatients}
              disabled={!doctorId}
              className="h-12 min-w-[180px]"
            >
              <Users className="w-4 h-4 mr-2" />
              {showConsultedPatients ? "Hide Consulted" : "Show Consulted"}
            </Button>
            {(patientData || showConsultedPatients) && (
              <Button
                variant="outline"
                onClick={handleClearSearch}
                className="h-12"
              >
                Clear
              </Button>
            )}
          </div>
          {!doctorId && (
            <p className="text-red-500 text-sm mt-2">
              Doctor ID not available. Please check your authentication.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Consulted Patients Section */}
      {showConsultedPatients && !patientData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recently Consulted Patients
              {consultedPagination.totalCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {consultedPatients.length} of {consultedPagination.totalCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingConsultedPatients && !consultedPatients.length ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading consulted patients...</p>
              </div>
            ) : consultedPatients.length > 0 ? (
              <>
                <div className="space-y-4">
                  {consultedPatients.map((patient) => (
                    <Card 
                      key={`${patient.patientId}-${patient.clinicId}`}
                      className="hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => handleSelectConsultedPatient(patient)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg">{patient.patientName}</h4>
                            
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Building className="w-4 h-4 text-gray-400" />
                                <span>{patient.clinicName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>Last visit: {formatSimpleDate(patient.lastVisitDate)}</span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Load More Button - Inside CardContent */}
                {consultedPagination.hasNextPage && (
                  <div className="text-center pt-6 border-t mt-6">
                    <Button 
                      variant="outline" 
                      onClick={handleLoadMoreConsulted}
                      disabled={loadingConsultedPatients}
                      className="w-full max-w-xs mx-auto"
                    >
                      {loadingConsultedPatients ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Loading More Patients...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Load More Patients
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No Consulted Patients Found
                </h3>
                <p className="text-gray-500">
                  You haven't consulted any patients recently.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Patient Info Header */}
      {patientData && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-blue-800">
                  Patient ID: {patientData.patientRandomId}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Found in {patientData.records.length} clinic record{patientData.records.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              {selectedRecord && (
                <div className="flex gap-3">
                  <Button
                    variant={viewMode === "details" ? "default" : "outline"}
                    onClick={() => handleViewModeChange("details")}
                    className="h-10"
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Patient Details
                  </Button>
                  <Button
                    variant={viewMode === "history" ? "default" : "outline"}
                    onClick={() => handleViewModeChange("history")}
                    className="h-10"
                  >
                    <History className="w-4 h-4 mr-2" />
                    View History ({selectedRecord.totalVisits})
                  </Button>
                </div>
              )}
            </div>

            {/* Clinic Selection */}
            {patientData.records.length > 1 && (
              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-700">Select Clinic Record:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {patientData.records.map((record) => (
                    <Button
                      key={record.clinicId}
                      variant={selectedRecord?.clinicId === record.clinicId ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedRecord(record);
                        setViewMode("details");
                        setShowVisitDrawer(false);
                        setVisitHistory([]);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Building className="w-3 h-3" />
                      {record.patientUniqueId}
                      <Badge variant="secondary" className="ml-1">
                        {record.totalVisits} visits
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {selectedRecord && (
        <div className="space-y-6">
          {viewMode === "details" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient Profile Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-500">Full Name</Label>
                        <p className="text-lg font-semibold">{selectedRecord.profile.name}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm text-gray-500">Patient ID</Label>
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <p className="font-mono font-semibold">{selectedRecord.patientUniqueId}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-gray-500">Age & Gender</Label>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-gray-400" />
                          <p className="font-medium">
                            {formatAge(selectedRecord.profile.age)} • {selectedRecord.profile.gender}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-500">Contact</Label>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <p className="font-medium">{selectedRecord.profile.phone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <p className="font-medium">
                              {selectedRecord.profile.email || "No email provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                   <div className="col-span-2 pt-4 border-t">
        <Button
          onClick={() => setShowDentalChart(true)}
          className="w-full"
          variant="outline"
        >
          <FileText className="w-4 h-4 mr-2" />
          View Full Dental Chart
        </Button>
      </div>
                </CardContent>
              </Card>

              {/* Dental Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Dental Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border">
                        <p className="text-sm text-gray-600">Total Teeth Recorded</p>
                        <p className="text-2xl font-bold">{selectedRecord.dentalChart.length}</p>
                      </div>
                      
                      <div className="bg-amber-50 p-4 rounded-lg border">
                        <p className="text-sm text-gray-600">Total Conditions</p>
                        <p className="text-2xl font-bold">
                          {getDentalStats(selectedRecord.dentalChart).totalConditions}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Procedures</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-green-50 p-3 rounded-lg border text-center">
                          <p className="text-sm text-gray-600">Completed</p>
                          <p className="text-xl font-bold text-green-600">
                            {getDentalStats(selectedRecord.dentalChart).completedProcedures}
                          </p>
                        </div>
                        
                        <div className="bg-yellow-50 p-3 rounded-lg border text-center">
                          <p className="text-sm text-gray-600">Planned</p>
                          <p className="text-xl font-bold text-yellow-600">
                            {getDentalStats(selectedRecord.dentalChart).plannedProcedures}
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg border text-center">
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="text-xl font-bold">
                            {getDentalStats(selectedRecord.dentalChart).totalProcedures}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">Total Visits</p>
                        <Badge variant="secondary" className="text-lg px-3 py-1">
                          {selectedRecord.totalVisits}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {showDentalChart && selectedRecord && (
  <div className="fixed inset-0 z-50 bg-white overflow-hidden">
    <div className="h-screen w-full flex flex-col">
      <div className="border-b p-4 flex justify-between items-center bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDentalChart(false)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Patient Details
          </Button>
          <h2 className="text-xl font-bold">
            Dental Chart - {selectedRecord.profile.name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Patient ID: {selectedRecord.patientUniqueId}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDentalChart(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <DentalChartView
          patientId={selectedRecord.patientId}
          onClose={() => setShowDentalChart(false)}
        />
      </div>
    </div>
  </div>
)}

              {/* Enhanced Dental Chart */}

             {selectedRecord.dentalChart.length > 0 && (
  <Card className="lg:col-span-3">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Dental Chart Overview
        </div>
        <Badge variant="outline" className="text-sm">
          {selectedRecord.dentalChart.length} teeth recorded
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <div className="text-xs text-blue-600 font-medium">CONDITIONS</div>
          <div className="text-xl font-bold mt-1">{getDentalStats(selectedRecord.dentalChart).totalConditions}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
          <div className="text-xs text-green-600 font-medium">COMPLETED</div>
          <div className="text-xl font-bold mt-1">{getDentalStats(selectedRecord.dentalChart).completedProcedures}</div>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
          <div className="text-xs text-amber-600 font-medium">PLANNED</div>
          <div className="text-xl font-bold mt-1">{getDentalStats(selectedRecord.dentalChart).plannedProcedures}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div className="text-xs text-gray-600 font-medium">TOTAL PROCS</div>
          <div className="text-xl font-bold mt-1">{getDentalStats(selectedRecord.dentalChart).totalProcedures}</div>
        </div>
      </div>

      {/* Dental Grid - Classic Layout */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedRecord.dentalChart
            .sort((a, b) => a.toothNumber - b.toothNumber)
            .map((tooth) => (
              <div 
                key={tooth._id} 
                className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                  tooth.conditions.length > 0 ? 'border-red-200 bg-red-50/50' : 
                  tooth.procedures.length > 0 ? 'border-blue-200 bg-blue-50/50' : 
                  'border-gray-200'
                }`}
              >
                {/* Tooth Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center">
                        <span className="font-bold text-gray-800">{tooth.toothNumber}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">Tooth #{tooth.toothNumber}</h4>
                        <p className="text-xs text-gray-500">
                          Updated {formatDate(tooth.lastUpdated)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={tooth.procedures.length > 0 ? "default" : "outline"} 
                    className="text-xs"
                  >
                    {tooth.procedures.length} proc
                  </Badge>
                </div>

                {/* Conditions - Compact */}
                {tooth.conditions.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-xs font-medium text-gray-700">Conditions</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tooth.conditions.slice(0, 2).map((cond, idx) => (
                        <Badge 
                          key={idx} 
                          variant="destructive" 
                          className="text-xs px-2 py-0.5"
                        >
                          {cond}
                        </Badge>
                      ))}
                      {tooth.conditions.length > 2 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          +{tooth.conditions.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Procedures - Compact List */}
                {tooth.procedures.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-3 h-3 text-blue-500" />
                      <span className="text-xs font-medium text-gray-700">Procedures</span>
                    </div>
                    <div className="space-y-2">
                      {tooth.procedures.slice(0, 2).map((proc, idx) => (
                        <div 
                          key={idx} 
                          className={`text-xs p-2 rounded border ${
                            proc.status === 'completed' 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-amber-50 border-amber-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium truncate">{proc.name}</span>
                            <Badge 
                              variant={proc.status === 'completed' ? 'default' : 'secondary'}
                              className="text-xs px-1.5 py-0"
                            >
                              {proc.status === 'completed' ? '✓' : '○'}
                            </Badge>
                          </div>
                          <div className="mt-1 text-gray-600 flex items-center gap-2">
                            <span>{proc.type}</span>
                            {proc.surface && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span>{proc.surface}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      {tooth.procedures.length > 2 && (
                        <div className="text-xs text-gray-500 text-center pt-1 border-t">
                          +{tooth.procedures.length - 2} more procedures
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {tooth.conditions.length === 0 && tooth.procedures.length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <p className="text-sm">No issues recorded</p>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Summary Footer */}
        {selectedRecord.dentalChart.length > 9 && (
          <div className="pt-4 border-t flex justify-between items-center text-sm text-gray-600">
            <div>
              Showing {Math.min(9, selectedRecord.dentalChart.length)} of {selectedRecord.dentalChart.length} teeth
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              View all teeth →
            </Button>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)}
            </div>
          ) : (
            /* History View - Stacked Cards Layout */
    <div className="space-y-6">
  <div className="flex justify-between items-center">
    <div>
      <h2 className="text-xl font-semibold text-gray-800">Visit History</h2>
      <p className="text-sm text-gray-500">{selectedRecord.totalVisits} total visits</p>
    </div>
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => setViewMode("details")}
      className="flex items-center gap-1"
    >
      <ChevronLeft className="w-4 h-4" />
      Back to Details
    </Button>
  </div>

  {/* Visit Table */}
  {loadingHistory && !visitHistory.length ? (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
    </div>
  ) : visitHistory.length > 0 ? (
    <div className="border rounded-lg overflow-hidden">
      {/* Table Header */}
   <div className="grid grid-cols-8 bg-gray-50 text-sm font-medium text-gray-600 border-b">
  <div className="col-span-2 p-3">Date & Time</div>
  <div className="col-span-4 p-3">Diagnosis & Treatment</div>
  <div className="col-span-2 p-3 text-right">Actions</div>
</div>
      {/* Table Rows */}
      <div className="divide-y">
        {visitHistory.map((visit) => (
       <div 
  key={visit._id}
  className="grid grid-cols-8 hover:bg-gray-50 transition-colors cursor-pointer"
  onClick={() => handleViewVisitDetails(visit)}
>
  {/* Date & Time */}
  <div className="col-span-2 p-3">
    <div className="text-sm font-medium">
      {formatSimpleDate(visit.visitDate)}
    </div>
    <div className="text-xs text-gray-500">
      {new Date(visit.visitDate).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </div>
  </div>

  {/* Diagnosis & Treatment */}
  <div className="col-span-4 p-3">
    <div className="space-y-1">
      {visit.diagnosis.length > 0 ? (
        <div>
          <div className="text-xs font-medium text-gray-500">
            Diagnosis:
          </div>
          <div className="text-sm line-clamp-2">
            {visit.diagnosis[0]}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-400">No diagnosis</div>
      )}

      {visit.dentalWork?.length > 0 && (
        <div className="mt-1">
          <div className="text-xs font-medium text-gray-500">
            Teeth treated:
          </div>
          <div className="flex flex-wrap gap-1">
            {visit.dentalWork.slice(0, 5).map((work, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                #{work.toothNumber}
              </Badge>
            ))}
            {visit.dentalWork.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{visit.dentalWork.length - 5}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Actions */}
  <div className="col-span-2 p-3 flex justify-end items-center gap-2">
    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
      <Eye className="w-4 h-4" />
    </Button>
  </div>
</div>

        ))}
      </div>

      {/* Load More */}
      {historyPagination.hasNextPage && (
        <div className="border-t p-4 text-center">
          <Button 
            variant="outline" 
            onClick={handleLoadMore}
            disabled={loadingHistory}
            size="sm"
            className="min-w-[120px]"
          >
            {loadingHistory ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  ) : (
    /* Empty State */
    <div className="text-center py-20">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <History className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-700 mb-2">No Visits Yet</h3>
      <p className="text-gray-500 max-w-sm mx-auto mb-6">
        This patient hasn't had any recorded visits in the system.
      </p>
    </div>
  )}
</div>
          )}
        </div>
      )}

      {/* ✅ FIXED: Visit Details Drawer with New Schema Fields */}
      {showVisitDrawer && selectedVisit && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={handleCloseVisitDrawer} />
          
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div className="relative w-screen max-w-3xl">
              <div className="flex h-full flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="bg-primary px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={handleCloseVisitDrawer}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div>
                        <h2 className="text-xl font-bold text-white">Visit Details</h2>
                        <p className="text-white/80 text-sm">{formatDate(selectedVisit.visitDate)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={handleCloseVisitDrawer}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Visit Overview Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Visit Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500">Visit Date</Label>
                            <p className="text-sm mt-1">{formatSimpleDate(selectedVisit.visitDate)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ✅ FIXED: Chief Complaints, Examination Findings, Dental History */}
                    {(selectedVisit.chiefComplaints?.length > 0 || 
                      selectedVisit.examinationFindings?.length > 0 || 
                      selectedVisit.dentalHistory?.length > 0 || 
                      selectedVisit.diagnosis.length > 0) && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Stethoscope className="w-5 h-5" />
                            Clinical Assessment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Chief Complaints - NEW */}
                          {selectedVisit.chiefComplaints && selectedVisit.chiefComplaints.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Chief Complaints</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {selectedVisit.chiefComplaints.map((complaint, idx) => (
                                  <Badge key={idx} variant="outline" className="text-sm">
                                    {complaint.value}
                                    {complaint.isCustom && (
                                      <span className="ml-1 text-xs bg-purple-100 px-1 rounded">custom</span>
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Examination Findings - NEW */}
                          {selectedVisit.examinationFindings && selectedVisit.examinationFindings.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Examination Findings</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {selectedVisit.examinationFindings.map((finding, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-sm">
                                    {finding.value}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Dental History - NEW */}
                          {selectedVisit.dentalHistory && selectedVisit.dentalHistory.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Dental History</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {selectedVisit.dentalHistory.map((history, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-sm">
                                    {history.value}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Diagnosis - Existing */}
                          {selectedVisit.diagnosis.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Diagnosis</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {selectedVisit.diagnosis.map((diag, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-sm">
                                    {diag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Notes - Existing */}
                          {selectedVisit.notes && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Doctor's Notes</Label>
                              <p className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded">
                                {selectedVisit.notes}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Prescriptions */}
                    {selectedVisit.prescriptions.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Pill className="w-5 h-5" />
                            Prescriptions ({selectedVisit.prescriptions.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedVisit.prescriptions.map((prescription, idx) => (
                              <div key={idx} className="p-3 border rounded-lg bg-blue-50/50">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-800">{prescription.medicineName}</h4>
                                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                                      {prescription.dosage && (
                                        <div>
                                          <span className="text-gray-500">Dosage:</span>
                                          <span className="ml-2 font-medium">{prescription.dosage}</span>
                                        </div>
                                      )}
                                      {prescription.frequency && (
                                        <div>
                                          <span className="text-gray-500">Frequency:</span>
                                          <span className="ml-2 font-medium">{prescription.frequency}</span>
                                        </div>
                                      )}
                                      {prescription.duration && (
                                        <div>
                                          <span className="text-gray-500">Duration:</span>
                                          <span className="ml-2 font-medium">{prescription.duration}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Dental Work */}
                    {selectedVisit.dentalWork && selectedVisit.dentalWork.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Dental Work ({selectedVisit.dentalWork.length} teeth)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedVisit.dentalWork.map((work, idx) => (
                              <div key={idx} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start mb-3">
                                  <h4 className="font-bold text-lg">Tooth #{work.toothNumber}</h4>
                                  <Badge variant="outline">
                                    {work.conditions.length} condition{work.conditions.length !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                                
                                {work.conditions.length > 0 && (
                                  <div className="mb-3">
                                    <Label className="text-sm font-medium text-gray-700">Conditions:</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {work.conditions.map((cond, condIdx) => (
                                        <Badge key={condIdx} variant="secondary" className="text-sm">
                                          {cond}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Files Attached */}
                    {selectedVisit.files.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Attached Files ({selectedVisit.files.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3">
                            {selectedVisit.files.map((file, idx) => (
                              <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm truncate">{file.url.split('/').pop()}</p>
                                    <p className="text-xs text-gray-500">{file.type}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Created on {formatSimpleDate(selectedVisit.createdAt)}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleCloseVisitDrawer}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}