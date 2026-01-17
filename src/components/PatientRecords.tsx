import { useState } from "react";
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
} from "lucide-react";
import axios from "axios";
import patientServiceBaseUrl from "../patientServiceBaseUrl";

interface Prescription {
  _id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Procedure {
  _id: string;
  name: string;
  description?: string;
  fee?: number;
  doctorId?: string;
  referredToDoctorId?: string;
  referralNotes?: string;
  completed?: boolean;
}

interface Stage {
  _id: string;
  stageName: string;
  description: string;
  procedures: Procedure[];
  status: string;
  scheduledDate: string;
}

interface TreatmentPlan {
  _id: string;
  planName: string;
  description: string;
  stages: Stage[];
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface Doctor {
  name: string;
  phoneNumber: number;
  specialization: string;
}

interface PatientHistory {
  _id: string;
  doctorId: string;
  appointmentId: string;
  symptoms: string[];
  diagnosis: string[];
  prescriptions: Prescription[];
  notes: string;
  files: any[];
  consultationFee: number;
  procedures: Procedure[];
  totalAmount: number;
  isPaid: boolean;
  status: string;
  visitDate: string;
  createdAt: string;
  treatmentPlanId?: string;
  doctor: Doctor | null;
  treatmentPlan: TreatmentPlan | null;
}

interface Patient {
  _id: string;
  name: string;
  phone: number;
  email: string;
  patientUniqueId: string;
  patientRandomId: string;
  age: number;
  gender: string;
  visitHistory: PatientHistory[];
}

interface PatientRecord {
  clinicId: string;
  patientUniqueId: string;
  patientId: string;
  profile: Patient;
  visitHistory: PatientHistory[];
  clinicDetails: {
    name: string;
    email: string;
    phone: string;
  };
  pagination: {
    page: number;
    limit: number;
    totalVisits: number;
    totalPages: number;
  };
}

interface PatientSearchResponse {
  patientRandomId: string;
  records: PatientRecord[];
}

export function PatientRecords() {
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientSearchResponse | null>(
    null
  );
  const [selectedVisit, setSelectedVisit] = useState<PatientHistory | null>(
    null
  );
  const [clinicPage, setClinicPage] = useState<{ [clinicId: string]: number }>(
    {}
  );
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);

  const VISITS_PER_PAGE = 1;

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

  // Search patient by Random ID
  const handlePatientSearch = async () => {
    if (!patientSearchQuery.trim()) return alert("Enter Patient ID");

    try {
      setSearchLoading(true);
      setSelectedVisit(null);

      const res = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/patient-by-randomId/${patientSearchQuery}?page=1&limit=${VISITS_PER_PAGE}`
      );

      if (res.data.success) {
        setPatientData(res.data.data);

        const pages: { [key: string]: number } = {};
        res.data.data.records.forEach((rec: PatientRecord) => {
          pages[rec.clinicId] = 1;
        });

        setClinicPage(pages);
      } else {
        alert("No patient found");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Error fetching patient");
    } finally {
      setSearchLoading(false);
    }
  };

  // Fetch visits for a clinic with pagination
  const fetchClinicVisits = async (clinicId: string, page: number) => {
    if (!patientSearchQuery.trim()) return;

    try {
      setSearchLoading(true);

      const res = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/patient-by-randomId/${patientSearchQuery}?clinicId=${clinicId}&page=${page}&limit=${VISITS_PER_PAGE}`
      );

      if (res.data.success) {
        const updatedRecord = res.data.data.records.find(
          (r: PatientRecord) => r.clinicId === clinicId
        );

        setPatientData((prev) => {
          if (!prev) return res.data.data;

          return {
            ...prev,
            records: prev.records.map((rec) =>
              rec.clinicId === clinicId ? updatedRecord : rec
            ),
          };
        });

        setClinicPage((prev) => ({ ...prev, [clinicId]: page }));
      }
    } finally {
      setSearchLoading(false);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setPatientSearchQuery("");
    setPatientData(null);
    setSelectedVisit(null);
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
                placeholder="Enter Patient Random ID (e.g., PI-995465)"
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

      {/* Patient Info Card */}
      {patientData && (
        <Card className="bg-green-50 border-2 border-green-300">
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold text-green-800">
              Patient ID: {patientData.patientRandomId}
            </h3>
            <p className="text-sm text-gray-600">
              Linked Clinics: {patientData.records.length}
            </p>
          </CardContent>
        </Card>
      )}

      {/* History List */}
      {selectedClinic === null ? (
        <div className="space-y-4">
          {patientData?.records.map((record) => {
            const visitCount = record.visitHistory.length;
            const lastVisit = visitCount
              ? formatDate(record.visitHistory[0].visitDate)
              : "Not visited yet";

            return (
              <Card
                key={record.clinicId}
                className="p-5 hover:shadow-lg cursor-pointer transition"
                onClick={() => setSelectedClinic(record.clinicId)}
              >
                <CardContent>
                  <h2 className="font-bold text-lg">
                    {record.clinicDetails.name} — ({record.patientUniqueId})
                  </h2>

                  <p className="text-sm text-gray-600 mt-2">
                    Visits: <strong>{visitCount}</strong>
                    {" | "}
                    Last Visit: <strong>{lastVisit}</strong>
                  </p>

                  {record.clinicDetails?.phone && (
                    <p className="text-sm text-gray-500">
                      Contact: {record.clinicDetails.phone}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div>
          {/* Back button */}
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => setSelectedClinic(null)}
          >
            ← Back to Clinics
          </Button>

          {patientData?.records
            .filter((r) => r.clinicId === selectedClinic)
            .map((record) => {
              const currentPage = record.pagination?.page || 1;
              const totalPages = record.pagination?.totalPages || 1;

              return (
                <div key={record.clinicId}>
                  <h2 className="text-xl font-bold mb-3">
                    {record.clinicDetails.name} — Visit History
                  </h2>

                  {record.visitHistory.length > 0 ? (
                    <>
                      {record.visitHistory.map((visit) => (
                        <Card
                          key={visit._id}
                          className="hover:shadow-md cursor-pointer mt-3"
                          onClick={() => setSelectedVisit(visit)}
                        >
                          <CardContent className="p-5">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">
                                {formatDate(visit.visitDate)}
                              </span>
                              <Badge
                                className={
                                  visit.status === "completed"
                                    ? "bg-green-600"
                                    : "bg-gray-400"
                                }
                              >
                                {visit.status}
                              </Badge>
                            </div>

                            <div className="text-sm mt-3">
                              Doctor:{" "}
                              <span className="font-bold">
                                {visit.doctor?.name || "N/A"}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Prescriptions: {visit.prescriptions.length}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                          <Button
                            size="sm"
                            disabled={currentPage === 1 || searchLoading}
                            onClick={() =>
                              fetchClinicVisits(
                                record.clinicId,
                                currentPage - 1
                              )
                            }
                          >
                            Previous
                          </Button>

                          <span className="px-2 py-1 text-sm bg-gray-200 rounded">
                            {currentPage} / {totalPages}
                          </span>

                          <Button
                            size="sm"
                            disabled={
                              currentPage === totalPages || searchLoading
                            }
                            onClick={() =>
                              fetchClinicVisits(
                                record.clinicId,
                                currentPage + 1
                              )
                            }
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 italic">
                      No visit history available.
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedVisit && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setSelectedVisit(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-primary text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Visit Details</h2>
                <p className="text-sm text-white/80 mt-1">
                  {formatDate(selectedVisit.visitDate)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
                onClick={() => setSelectedVisit(null)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              {/* Doctor Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Doctor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">
                      {selectedVisit.doctor?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Specialization</p>
                    <p className="font-semibold">
                      {selectedVisit.doctor?.specialization || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">
                      {selectedVisit.doctor?.phoneNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge
                      className={
                        selectedVisit.status === "completed"
                          ? "bg-green-600"
                          : "bg-gray-400"
                      }
                    >
                      {selectedVisit.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Symptoms & Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertCircle className="w-4 h-4" />
                      Symptoms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedVisit.symptoms.map((symptom, idx) => (
                        <li key={idx} className="text-sm">
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="w-4 h-4" />
                      Diagnosis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedVisit.diagnosis.map((diag, idx) => (
                        <li key={idx} className="text-sm">
                          {diag}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Prescriptions */}
              {selectedVisit.prescriptions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5" />
                      Prescriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedVisit.prescriptions.map((prescription) => (
                        <div
                          key={prescription._id}
                          className="p-4 bg-gray-50 rounded-lg border"
                        >
                          <p className="font-semibold text-lg">
                            {prescription.medicineName}
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                            <div>
                              <p className="text-gray-600">Dosage</p>
                              <p className="font-medium">
                                {prescription.dosage}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Frequency</p>
                              <p className="font-medium">
                                {prescription.frequency}/day
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Duration</p>
                              <p className="font-medium">
                                {prescription.duration} days
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedVisit.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Clinical Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedVisit.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Treatment Plan */}
              {selectedVisit.treatmentPlan && (
                <Card className="border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      Treatment Plan: {selectedVisit.treatmentPlan.planName}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {selectedVisit.treatmentPlan.description}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedVisit.treatmentPlan.stages.map((stage, idx) => (
                      <div
                        key={stage._id}
                        className={`p-4 rounded-lg border-2 ${
                          stage.status === "completed"
                            ? "bg-green-50 border-green-300"
                            : "bg-gray-50 border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">
                            Stage {idx + 1}: {stage.stageName}
                          </h4>
                          <Badge
                            className={
                              stage.status === "completed"
                                ? "bg-green-600"
                                : "bg-gray-400"
                            }
                          >
                            {stage.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {stage.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Scheduled: {formatDate(stage.scheduledDate)}
                        </p>
                        {stage.procedures.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-gray-700">
                              Procedures:
                            </p>
                            {stage.procedures.map((proc) => (
                              <div
                                key={proc._id}
                                className="pl-4 text-sm flex items-center gap-2"
                              >
                                {proc.completed ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                                <span>{proc.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3"
              style={{ padding: "10px" }}
            >
              <Button variant="outline" onClick={() => setSelectedVisit(null)}>
                Close
              </Button>
              <Button className="bg-primary">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
