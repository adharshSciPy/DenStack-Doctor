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
  ChevronRight,

  Stethoscope,
  CreditCard,
  Receipt,
} from "lucide-react";
import axios from "axios";
import patientServiceBaseUrl from "../patientServiceBaseUrl";

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

interface VisitHistory {
  _id: string;
  clinicId: string;
  doctorId: string;
  appointmentId: string;
  consultationFee: number;
  totalAmount: number;
  isPaid: boolean;
  status: "completed" | "scheduled" | "cancelled";
  dentalWork: DentalWork[];
  visitDate: string;
  treatmentPlanId?: string;
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

export function PatientRecords() {
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

  // Dummy medical history data (you can replace with real API later)
  const dummyMedicalHistory: MedicalHistory = {
    bloodGroup: "O+",
    height: "175 cm",
    weight: "72 kg",
    bloodPressure: "120/80 mmHg",
    allergies: ["Penicillin", "Dust mites"],
    chronicConditions: ["Hypertension", "Type 2 Diabetes"],
    medications: ["Metformin 500mg", "Lisinopril 10mg"],
    lastCheckup: "2024-01-15",
    smokingStatus: "Former smoker",
    alcoholConsumption: "Occasionally",
  };

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

  // Search patient by Random ID
  const handlePatientSearch = async () => {
    if (!patientSearchQuery.trim()) return alert("Enter Patient ID");

    try {
      setSearchLoading(true);
      setSelectedRecord(null);
      setViewMode("details");
      setShowVisitDrawer(false);
      setVisitHistory([]);

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
      alert(error.response?.data?.message || "Error fetching patient");
    } finally {
      setSearchLoading(false);
    }
  };

  // Fetch visit history
  const fetchVisitHistory = async (patientId: string, loadMore = false) => {
    if (!patientId) return;

    try {
      setLoadingHistory(true);
      
      let url = `${patientServiceBaseUrl}/api/v1/patient-service/patient/visit-history/${patientId}`;
      
      // Add cursor for pagination if loading more
      if (loadMore && historyPagination.nextCursor) {
        const cursor = historyPagination.nextCursor;
        url += `?cursorDate=${cursor.visitDate}&cursorId=${cursor._id}`;
      }

      const res = await axios.get<VisitHistoryResponse>(url);

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
    
    if (mode === "history" && selectedRecord) {
      fetchVisitHistory(selectedRecord.patientId);
    }
  };

  // Load more visits
  const handleLoadMore = () => {
    if (selectedRecord && historyPagination.hasNextPage) {
      fetchVisitHistory(selectedRecord.patientId, true);
    }
  };

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
              disabled={searchLoading}
              className="h-12 min-w-[140px]"
            >
              <Search className="w-4 h-4 mr-2" />
              {searchLoading ? "Searching..." : "Search"}
            </Button>
            {patientData && (
              <Button
                variant="outline"
                onClick={handleClearSearch}
                className="h-12"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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

                      <div>
                        <Label className="text-sm text-gray-500">Clinic ID</Label>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {selectedRecord.clinicId}
                          </p>
                        </div>
                      </div>
                    </div>
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

              {/* Enhanced Dental Chart */}
              {selectedRecord.dentalChart.length > 0 && (
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Dental Chart with Procedures
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Detailed view of dental conditions and procedures
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedRecord.dentalChart.map((tooth) => (
                        <Card key={tooth._id} className="border">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="text-xl font-bold">Tooth #{tooth.toothNumber}</span>
                                <p className="text-xs text-gray-500">
                                  Last updated: {formatDate(tooth.lastUpdated)}
                                </p>
                              </div>
                              <Badge>
                                {tooth.procedures.length} procedure{tooth.procedures.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            
                            {tooth.conditions.length > 0 && (
                              <div className="mb-3">
                                <Label className="text-sm font-medium text-gray-700">Conditions:</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {tooth.conditions.map((cond, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {cond}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {tooth.procedures.length > 0 && (
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Procedures:</Label>
                                <div className="space-y-2 mt-2">
                                  {tooth.procedures.map((proc, idx) => (
                                    <div 
                                      key={idx} 
                                      className={`p-3 rounded-lg border ${proc.status === 'completed' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">{proc.name}</span>
                                        <Badge 
                                          variant={proc.status === 'completed' ? 'default' : 'secondary'}
                                          className="text-xs"
                                        >
                                          {proc.status}
                                        </Badge>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                        <div>
                                          <span className="text-gray-500">Type:</span>
                                          <span className="ml-2 font-medium">{proc.type}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Surface:</span>
                                          <span className="ml-2 font-medium">{proc.surface}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Date:</span>
                                          <span className="ml-2 font-medium">{formatDate(proc.date)}</span>
                                        </div>
                                        {proc.estimatedCost && (
                                          <div>
                                            <span className="text-gray-500">Cost:</span>
                                            <span className="ml-2 font-medium">${proc.estimatedCost}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* History View - Stacked Cards Layout */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Visit History</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {visitHistory.length} of {selectedRecord.totalVisits} visits
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setViewMode("details")}
                  >
                    ← Back to Details
                  </Button>
                </div>
              </div>
              
              {loadingHistory && !visitHistory.length ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading visit history...</p>
                </div>
              ) : visitHistory.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {visitHistory.map((visit, index) => (
                      <Card 
                        key={visit._id} 
                        className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
                        onClick={() => handleViewVisitDetails(visit)}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold">{formatDate(visit.visitDate)}</span>
                                    <Badge 
                                      className={
                                        visit.status === "completed" ? "bg-green-600" : 
                                        visit.status === "scheduled" ? "bg-blue-600" : "bg-red-600"
                                      }
                                    >
                                      {visit.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Appointment ID: {visit.appointmentId}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Dental Work Summary */}
                              {visit.dentalWork && visit.dentalWork.length > 0 && (
                                <div className="ml-11">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">Dental Work:</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {visit.dentalWork.map((work, idx) => (
                                      <div key={idx} className="bg-gray-50 px-3 py-2 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold">Tooth #{work.toothNumber}</span>
                                          <Badge variant="outline" className="text-xs">
                                            {work.conditions.length} conditions
                                          </Badge>
                                        </div>
                                        {work.conditions.length > 0 && (
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            {work.conditions.map((cond, condIdx) => (
                                              <Badge key={condIdx} variant="secondary" className="text-xs">
                                                {cond}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Payment Status */}
                              <div className="ml-11 flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">
                                    Fee: <span className="font-bold">${visit.totalAmount}</span>
                                  </span>
                                </div>
                                <Badge variant={visit.isPaid ? "default" : "destructive"}>
                                  {visit.isPaid ? "Paid" : "Unpaid"}
                                </Badge>
                                {visit.treatmentPlanId && (
                                  <Badge variant="outline" className="text-xs">
                                    Treatment Plan
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <Button size="sm" variant="ghost" className="text-blue-600">
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {historyPagination.hasNextPage && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={handleLoadMore}
                        disabled={loadingHistory}
                      >
                        {loadingHistory ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                            Loading...
                          </>
                        ) : (
                          "Load More Visits"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No Visit History Found
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      This patient has no recorded visits in the system yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Visit Details Drawer */}
      {showVisitDrawer && selectedVisit && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={handleCloseVisitDrawer}
          />
          
          {/* Drawer */}
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div className="relative w-screen max-w-2xl">
              <div className="flex h-full flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="bg-primary px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={handleCloseVisitDrawer}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </Button>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Visit Details</h2>
                        <p className="text-white/80">{formatDate(selectedVisit.visitDate)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={handleCloseVisitDrawer}
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Visit Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Receipt className="w-5 h-5" />
                          Visit Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-gray-500">Status</Label>
                            <Badge 
                              className={
                                selectedVisit.status === "completed" ? "bg-green-600" : 
                                selectedVisit.status === "scheduled" ? "bg-blue-600" : "bg-red-600"
                              }
                              // className="mt-1"
                            >
                              {selectedVisit.status}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Appointment ID</Label>
                            <p className="font-mono text-sm mt-1">{selectedVisit.appointmentId}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Clinic ID</Label>
                            <p className="font-mono text-sm mt-1">{selectedVisit.clinicId}</p>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-500">Doctor ID</Label>
                            <p className="font-mono text-sm mt-1">{selectedVisit.doctorId}</p>
                          </div>
                          {selectedVisit.treatmentPlanId && (
                            <div className="col-span-2">
                              <Label className="text-sm text-gray-500">Treatment Plan ID</Label>
                              <p className="font-mono text-sm mt-1">{selectedVisit.treatmentPlanId}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dental Work Details */}
                    {selectedVisit.dentalWork && selectedVisit.dentalWork.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Dental Work Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {selectedVisit.dentalWork.map((work, idx) => (
                              <Card key={idx} className="border">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-lg">Tooth #{work.toothNumber}</h4>
                                    <Badge variant="outline">
                                      {work.conditions.length} condition{work.conditions.length !== 1 ? 's' : ''}
                                    </Badge>
                                  </div>
                                  
                                  {work.conditions.length > 0 && (
                                    <div className="mb-3">
                                      <Label className="text-sm font-medium text-gray-700">Conditions:</Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {work.conditions.map((cond, condIdx) => (
                                          <Badge key={condIdx} variant="secondary" className="text-sm">
                                            {cond}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {work.surfaceConditions && work.surfaceConditions.length > 0 && (
                                    <div>
                                      <Label className="text-sm font-medium text-gray-700">Surface Conditions:</Label>
                                      <div className="space-y-2 mt-2">
                                        {work.surfaceConditions.map((surface, surfIdx) => (
                                          <div key={surfIdx} className="bg-gray-50 p-3 rounded-lg">
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium">{surface.surface} Surface</span>
                                              <Badge variant="outline" className="text-xs">
                                                {surface.conditions.length} condition{surface.conditions.length !== 1 ? 's' : ''}
                                              </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                              {surface.conditions.map((cond, condIdx) => (
                                                <Badge key={condIdx} variant="default" className="text-xs">
                                                  {cond}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Billing Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          Billing Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-gray-500">Consultation Fee</p>
                              <p className="text-2xl font-bold">${selectedVisit.consultationFee}</p>
                            </div>
                            <Badge 
                              variant={selectedVisit.isPaid ? "default" : "destructive"}
                              className="text-lg px-4 py-2"
                            >
                              {selectedVisit.isPaid ? "Paid" : "Unpaid"}
                            </Badge>
                          </div>
                          
                          <div className="pt-4 border-t">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold">Total Amount</span>
                              <span className="text-2xl font-bold">${selectedVisit.totalAmount}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-4 flex justify-end gap-3">
                  <Button variant="outline" onClick={handleCloseVisitDrawer}>
                    Close
                  </Button>
                  <Button>
                    <Download className="w-4 h-4 mr-2" />
                    Download Visit Report
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}