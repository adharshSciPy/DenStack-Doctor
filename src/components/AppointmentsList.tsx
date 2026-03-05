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
  PlayCircle,
  CheckCircle,
  Trash2,
  Check,
  ChevronDown,
} from "lucide-react";

import DentalLabOrderModal from "./DentalLabOrderModal";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { useState, useEffect, useCallback, useRef } from "react";
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
import DentalChartView from "./DentalChartView";
import MedicineInput from "./MedicineInput";
import labBaseUrl from "../labBaseUrl";
import ThreeDCBCTViewer from "./nifti/Niftiviewer";
import { preloadAllDentalSvgs } from "../utils/dentalSvgCache";
interface ToothCondition {
  toothNumber: number;
  conditions: string[];
  notes?: string;
  color?: string;
  surfaceConditions: {
    surface: string;
    conditions: string[];
  }[];
  procedures: {
    name: string;
    surface: string;
    cost?: number;
    notes?: string;
    date?: string;
  }[];
}
interface TreatmentPlanStage {
  stageName: string;
  stageNumber?: number;
  description?: string;
  procedureRefs: {
    // This is required
    toothNumber: number;
    procedureName: string;
  }[];
  toothSurfaceProcedures?: {
    // This is optional
    toothNumber: number;
    surfaceProcedures: {
      surface: string;
      procedureNames: string[];
    }[];
  }[];
  status: "pending" | "completed" | "in-progress";
  scheduledDate?: string;
  completedAt?: string;
  notes?: string;
}

// Update the TreatmentPlanData interface to match backend schema
// interface TreatmentPlanData {
//   planName: string;
//   description?: string;
//   teeth: {
//     toothNumber: number;
//     priority?: "urgent" | "high" | "medium" | "low";
//     // Add clinical findings fields to match backend
//     onExamination?: Array<{
//       id: string;
//       name: string;
//       code?: string;
//       category?: string;
//       isCustom: boolean;
//       selectedAt?: string;
//     }>;
//     diagnosis?: Array<{
//       id: string;
//       name: string;
//       code?: string;
//       category?: string;
//       isCustom: boolean;
//       selectedAt?: string;
//     }>;
//     treatment?: Array<{
//       id: string;
//       name: string;
//       code?: string;
//       category?: string;
//       isCustom: boolean;
//       selectedAt?: string;
//     }>;
//     notes?: string;
//     procedures: Array<{
//       name: string;
//       surface: string;
//       stage?: number;
//       estimatedCost: number;
//       notes?: string;
//       status?: "planned" | "in-progress" | "completed";
//     }>;
//   }[];
//   stages: TreatmentPlanStage[];
//   startToday?: boolean;
// }
interface ToothData {
  number: number; // FDI number
  name: string;
  quadrant: number;
  svgName: string;
  position: { x: number; y: number };
  rotation?: number;
  isAdult: boolean;
}
interface DentalChartData {
  performedTeeth: any[];
  plannedProcedures: any[];
  softTissues?: any[];
  tmjExaminations?: any[];
  treatmentPlan?: any;
}
// Add these interfaces near your other interface definitions
interface TreatmentPlanProcedureChange {
  type: string;
  toothNumber: number;
  procedureName: string;
  surface: string;
  stage: number;
  previousStatus: string;
  newStatus: string;
  changedAt: string;
}

interface TreatmentPlanStageChange {
  stageNumber: number;
  stageName: string;
  previousStatus: string;
  newStatus: string;
  changedAt?: string;
  completedAt?: string;
}

interface TreatmentPlanChangeData {
  planId: string;
  changes: any[];
  completedStages: TreatmentPlanStageChange[];
  updatedProcedures: TreatmentPlanProcedureChange[];
  stageStatusChanges: TreatmentPlanStageChange[];
  addedStages: any[];
  removedStages: any[];
}
// Add these interfaces near your other interface definitions
interface ComplaintItem {
  id: string;
  name: string;
  code?: string;
  category?: string;
  description?: string;
  isCustom: boolean;
  selectedAt?: string;
}

interface ExaminationFindingItem {
  id: string;
  name: string;
  code?: string;
  category?: string;
  isCustom: boolean;
  selectedAt?: string;
}

interface DentalHistoryItem {
  id: string;
  name: string;
  code?: string;
  category?: string;
  isCustom: boolean;
  selectedAt?: string;
}
const ADULT_TOOTH_DATA: ToothData[] = [
  // Upper Right (Quadrant 1) - FDI numbers 18-11
  {
    number: 18,
    name: "Third Molar (Wisdom)",
    quadrant: 1,
    svgName: "wisdom",
    position: { x: 85, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 17,
    name: "Second Molar",
    quadrant: 1,
    svgName: "molar",
    position: { x: 95, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 16,
    name: "First Molar",
    quadrant: 1,
    svgName: "molar",
    position: { x: 105, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 15,
    name: "Second Premolar",
    quadrant: 1,
    svgName: "premolar",
    position: { x: 115, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 14,
    name: "First Premolar",
    quadrant: 1,
    svgName: "premolar",
    position: { x: 125, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 13,
    name: "Canine",
    quadrant: 1,
    svgName: "canine",
    position: { x: 135, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 12,
    name: "Lateral Incisor",
    quadrant: 1,
    svgName: "incisor",
    position: { x: 145, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 11,
    name: "Central Incisor",
    quadrant: 1,
    svgName: "incisor",
    position: { x: 155, y: 90 },
    rotation: 180,
    isAdult: true,
  },

  // Upper Left (Quadrant 2) - FDI numbers 21-28
  {
    number: 21,
    name: "Central Incisor",
    quadrant: 2,
    svgName: "incisor",
    position: { x: 165, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 22,
    name: "Lateral Incisor",
    quadrant: 2,
    svgName: "incisor",
    position: { x: 175, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 23,
    name: "Canine",
    quadrant: 2,
    svgName: "canine",
    position: { x: 185, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 24,
    name: "First Premolar",
    quadrant: 2,
    svgName: "premolar",
    position: { x: 195, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 25,
    name: "Second Premolar",
    quadrant: 2,
    svgName: "premolar",
    position: { x: 205, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 26,
    name: "First Molar",
    quadrant: 2,
    svgName: "molar",
    position: { x: 215, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 27,
    name: "Second Molar",
    quadrant: 2,
    svgName: "molar",
    position: { x: 225, y: 90 },
    rotation: 180,
    isAdult: true,
  },
  {
    number: 28,
    name: "Third Molar (Wisdom)",
    quadrant: 2,
    svgName: "wisdom",
    position: { x: 235, y: 90 },
    rotation: 180,
    isAdult: true,
  },

  // Lower Right (Quadrant 4) - FDI numbers 41-48
  {
    number: 41,
    name: "Central Incisor",
    quadrant: 4,
    svgName: "incisor",
    position: { x: 155, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 42,
    name: "Lateral Incisor",
    quadrant: 4,
    svgName: "incisor",
    position: { x: 145, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 43,
    name: "Canine",
    quadrant: 4,
    svgName: "canine",
    position: { x: 135, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 44,
    name: "First Premolar",
    quadrant: 4,
    svgName: "premolar",
    position: { x: 125, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 45,
    name: "Second Premolar",
    quadrant: 4,
    svgName: "premolar",
    position: { x: 115, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 46,
    name: "First Molar",
    quadrant: 4,
    svgName: "molar",
    position: { x: 105, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 47,
    name: "Second Molar",
    quadrant: 4,
    svgName: "molar",
    position: { x: 95, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 48,
    name: "Third Molar (Wisdom)",
    quadrant: 4,
    svgName: "wisdom",
    position: { x: 85, y: 210 },
    rotation: 0,
    isAdult: true,
  },

  // Lower Left (Quadrant 3) - FDI numbers 31-38
  {
    number: 31,
    name: "Central Incisor",
    quadrant: 3,
    svgName: "incisor",
    position: { x: 165, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 32,
    name: "Lateral Incisor",
    quadrant: 3,
    svgName: "incisor",
    position: { x: 175, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 33,
    name: "Canine",
    quadrant: 3,
    svgName: "canine",
    position: { x: 185, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 34,
    name: "First Premolar",
    quadrant: 3,
    svgName: "premolar",
    position: { x: 195, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 35,
    name: "Second Premolar",
    quadrant: 3,
    svgName: "premolar",
    position: { x: 205, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 36,
    name: "First Molar",
    quadrant: 3,
    svgName: "molar",
    position: { x: 215, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 37,
    name: "Second Molar",
    quadrant: 3,
    svgName: "molar",
    position: { x: 225, y: 210 },
    rotation: 0,
    isAdult: true,
  },
  {
    number: 38,
    name: "Third Molar (Wisdom)",
    quadrant: 3,
    svgName: "wisdom",
    position: { x: 235, y: 210 },
    rotation: 0,
    isAdult: true,
  },
];

// Pediatric teeth (Primary dentition) using FDI numbering
const PEDIATRIC_TOOTH_DATA: ToothData[] = [
  // Upper Right (Quadrant 1) - Primary teeth 55-51
  {
    number: 55,
    name: "Primary Second Molar",
    quadrant: 1,
    svgName: "molar",
    position: { x: 85, y: 90 },
    rotation: 180,
    isAdult: false,
  },
  {
    number: 54,
    name: "Primary First Molar",
    quadrant: 1,
    svgName: "molar",
    position: { x: 95, y: 90 },
    rotation: 180,
    isAdult: false,
  },
  {
    number: 53,
    name: "Primary Canine",
    quadrant: 1,
    svgName: "canine",
    position: { x: 105, y: 90 },
    rotation: 180,
    isAdult: false,
  },
  {
    number: 52,
    name: "Primary Lateral Incisor",
    quadrant: 1,
    svgName: "incisor",
    position: { x: 115, y: 90 },
    rotation: 180,
    isAdult: false,
  },
  {
    number: 51,
    name: "Primary Central Incisor",
    quadrant: 1,
    svgName: "incisor",
    position: { x: 125, y: 90 },
    rotation: 180,
    isAdult: false,
  },

  // Upper Left (Quadrant 2) - Primary teeth 61-65
  {
    number: 61,
    name: "Primary Central Incisor",
    quadrant: 2,
    svgName: "incisor",
    position: { x: 135, y: 90 },
    rotation: 180,
    isAdult: false,
  },
  {
    number: 62,
    name: "Primary Lateral Incisor",
    quadrant: 2,
    svgName: "incisor",
    position: { x: 145, y: 90 },
    rotation: 180,
    isAdult: false,
  },
  {
    number: 63,
    name: "Primary Canine",
    quadrant: 2,
    svgName: "canine",
    position: { x: 155, y: 90 },
    rotation: 180,
    isAdult: false,
  },
  {
    number: 64,
    name: "Primary First Molar",
    quadrant: 2,
    svgName: "molar",
    position: { x: 165, y: 90 },
    rotation: 180,
    isAdult: false,
  },
  {
    number: 65,
    name: "Primary Second Molar",
    quadrant: 2,
    svgName: "molar",
    position: { x: 175, y: 90 },
    rotation: 180,
    isAdult: false,
  },

  // Lower Right (Quadrant 4) - Primary teeth 81-85
  {
    number: 81,
    name: "Primary Central Incisor",
    quadrant: 4,
    svgName: "incisor",
    position: { x: 125, y: 210 },
    rotation: 0,
    isAdult: false,
  },
  {
    number: 82,
    name: "Primary Lateral Incisor",
    quadrant: 4,
    svgName: "incisor",
    position: { x: 115, y: 210 },
    rotation: 0,
    isAdult: false,
  },
  {
    number: 83,
    name: "Primary Canine",
    quadrant: 4,
    svgName: "canine",
    position: { x: 105, y: 210 },
    rotation: 0,
    isAdult: false,
  },
  {
    number: 84,
    name: "Primary First Molar",
    quadrant: 4,
    svgName: "molar",
    position: { x: 95, y: 210 },
    rotation: 0,
    isAdult: false,
  },
  {
    number: 85,
    name: "Primary Second Molar",
    quadrant: 4,
    svgName: "molar",
    position: { x: 85, y: 210 },
    rotation: 0,
    isAdult: false,
  },

  // Lower Left (Quadrant 3) - Primary teeth 71-75
  {
    number: 71,
    name: "Primary Central Incisor",
    quadrant: 3,
    svgName: "incisor",
    position: { x: 135, y: 210 },
    rotation: 0,
    isAdult: false,
  },
  {
    number: 72,
    name: "Primary Lateral Incisor",
    quadrant: 3,
    svgName: "incisor",
    position: { x: 145, y: 210 },
    rotation: 0,
    isAdult: false,
  },
  {
    number: 73,
    name: "Primary Canine",
    quadrant: 3,
    svgName: "canine",
    position: { x: 155, y: 210 },
    rotation: 0,
    isAdult: false,
  },
  {
    number: 74,
    name: "Primary First Molar",
    quadrant: 3,
    svgName: "molar",
    position: { x: 165, y: 210 },
    rotation: 0,
    isAdult: false,
  },
  {
    number: 75,
    name: "Primary Second Molar",
    quadrant: 3,
    svgName: "molar",
    position: { x: 175, y: 210 },
    rotation: 0,
    isAdult: false,
  },
];

const DENTAL_PROCEDURES = [
  "Cleaning/Prophylaxis",
  "Scaling & Root Planing",
  "Filling (Composite)",
  "Filling (Amalgam)",
  "Root Canal Treatment",
  "Crown Placement",
  "Bridge",
  "Denture",
  "Extraction",
  "Implant",
  "Orthodontic Treatment",
  "Whitening",
  "Veneer",
  "Gum Surgery",
  "Frenectomy",
  "Apicoectomy",
];

const TreatmentPlanDetailsModal = ({
  plan,
  onClose,
  viewOnly = false,
  refetchTreatmentPlans,
  onEditPlan,
}: TreatmentPlanDetailsModalProps & {
  refetchTreatmentPlans?: () => void;
  viewOnly?: boolean;
}) => {
  const [localPlan, setLocalPlan] = useState<TreatmentPlan | null>(plan);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"teeth" | "stages">("teeth");
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });
  useEffect(() => {
    console.log("TreatmentPlanDetailsModal viewOnly:", viewOnly);
  }, [viewOnly]);
  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("authToken");
  };

  // Show toast notification

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };
  // API BASE URL
  const API_BASE = "/api/v1/patient-service/consultation";

  // Fetch updated plan data
  const fetchPlanDetails = async () => {
    if (!plan?._id) return;

    try {
      const token = getAuthToken();
      const response = await axios.get(
        `${patientServiceBaseUrl}${API_BASE}/treatment-plan/${plan._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setLocalPlan(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching plan details:", error);
    }
  };

  // 1️⃣ Start Treatment Plan (Draft → Ongoing)
  const handleStartPlan = async () => {
    if (viewOnly) return;
    if (!localPlan?._id) return;

    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await axios.post(
        `${patientServiceBaseUrl}${API_BASE}/start-treatment/${localPlan._id}`,
        {}, // Empty body since clinicId is already in plan
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setLocalPlan(response.data.data);
        showToast("Treatment plan started successfully!", "success");
        refetchTreatmentPlans?.();
      }
    } catch (error: any) {
      console.error("Error starting plan:", error);
      showToast(
        error.response?.data?.message || "Failed to start plan",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ Complete Treatment Plan
  const handleFinishPlan = async () => {
    if (viewOnly) return;
    if (!localPlan?._id) return;

    if (!confirm("Are you sure you want to complete this treatment plan?"))
      return;

    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await axios.patch(
        `${patientServiceBaseUrl}${API_BASE}/finish-treatment/${localPlan._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setLocalPlan(response.data.data);
        showToast("Treatment plan completed successfully!", "success");
        refetchTreatmentPlans?.();
      }
    } catch (error: any) {
      console.error("Error completing plan:", error);
      showToast(
        error.response?.data?.message || "Failed to complete plan",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ Complete Stage(passing array index as stageNumber from the button)

  const handleCompleteStage = async (stageNumber: number) => {
    if (viewOnly) return;
    if (!localPlan?._id) return;

    setLoading(true);
    try {
      const token = getAuthToken();

      // Find the array index for this stageNumber
      const stageIndex = localPlan.stages?.findIndex(
        (s) => s.stageNumber === stageNumber,
      );

      if (stageIndex === -1 || stageIndex === undefined) {
        showToast("Stage not found", "error");
        setLoading(false);
        return;
      }

      const response = await axios.patch(
        `${patientServiceBaseUrl}${API_BASE}/complete-stage/${localPlan._id}/${stageIndex}`, // Use array index
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        // Update the local plan with the response data
        setLocalPlan(response.data.treatmentPlan);

        // Get the completed stage number from the response
        const completedStageNumber =
          response.data.stage?.stageNumber || stageNumber;
        showToast(
          `Stage ${completedStageNumber} completed successfully!`,
          "success",
        );
        refetchTreatmentPlans?.();

        // Force a refresh of the plan details
        await fetchPlanDetails();
      }
    } catch (error: any) {
      console.error("Error completing stage:", error);
      showToast(
        error.response?.data?.message || "Failed to complete stage",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };
  // 4️⃣ Add New Stage
  const handleAddStage = async () => {
    if (viewOnly) return;
    if (!localPlan?._id) return;

    const stageName = prompt("Enter stage name:");
    if (!stageName) return;

    const description = prompt("Enter stage description (optional):") || "";
    const scheduledDate =
      prompt("Enter scheduled date (YYYY-MM-DD, optional):") ||
      new Date().toISOString().split("T")[0];

    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await axios.patch(
        `${patientServiceBaseUrl}${API_BASE}/add-stage/${localPlan._id}`,
        {
          stageName,
          description,
          scheduledDate,
          toothSurfaceProcedures: [], // Can be populated from UI
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setLocalPlan(response.data.data);
        showToast("Stage added successfully!", "success");
        refetchTreatmentPlans?.();
      }
    } catch (error: any) {
      console.error("Error adding stage:", error);
      showToast(
        error.response?.data?.message || "Failed to add stage",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // 5️⃣ Remove Stage
  const handleRemoveStage = async (stageNumber: number) => {
    if (viewOnly) return;

    if (!localPlan?._id) return;

    if (!confirm(`Are you sure you want to remove Stage ${stageNumber}?`))
      return;

    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await axios.delete(
        `${patientServiceBaseUrl}${API_BASE}/remove-stage/${localPlan._id}/${stageNumber}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setLocalPlan(response.data.treatmentPlan);
        showToast(`Stage ${stageNumber} removed successfully!`, "success");
        refetchTreatmentPlans?.();

        // Force a refresh of the plan details to get updated status
        await fetchPlanDetails();
      }
    } catch (error: any) {
      console.error("Error removing stage:", error);
      showToast(
        error.response?.data?.message || "Failed to remove stage",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // 6️⃣ Remove Procedure
  const handleRemoveProcedure = async (
    toothNumber: number,
    procedureName: string,
    surface: string,
  ) => {
    if (!localPlan?._id) return;
    if (viewOnly) return;

    if (
      !confirm(`Remove procedure "${procedureName}" from tooth ${toothNumber}?`)
    )
      return;

    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await axios.delete(
        `${patientServiceBaseUrl}${API_BASE}/remove-procedure/${localPlan._id}/${toothNumber}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            procedureName,
            surface,
          },
        },
      );

      if (response.data.success) {
        // Update local plan with response data
        setLocalPlan(response.data.treatmentPlan);
        showToast("Procedure removed successfully!", "success");
        refetchTreatmentPlans?.();
        await fetchPlanDetails(); // Refresh data
      }
    } catch (error: any) {
      console.error("Error removing procedure:", error);
      showToast(
        error.response?.data?.message || "Failed to remove procedure",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // 7️⃣ Remove/Cancel Treatment Plan
  const handleRemovePlan = async () => {
    if (viewOnly) return;

    if (!localPlan?._id) return;

    const action = localPlan.status === "draft" ? "remove" : "cancel";
    const message =
      action === "remove"
        ? "Are you sure you want to remove this treatment plan?"
        : "Are you sure you want to cancel this treatment plan?";

    if (!confirm(message)) return;

    setLoading(true);
    try {
      const token = getAuthToken();

      let response;
      if (action === "remove") {
        response = await axios.delete(
          `${patientServiceBaseUrl}${API_BASE}/remove-plan/${localPlan._id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } else {
        const cancellationReason =
          prompt("Please provide a cancellation reason:") ||
          "No reason provided";
        response = await axios.patch(
          `${patientServiceBaseUrl}${API_BASE}/cancel-plan/${localPlan._id}`,
          { cancellationReason },
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }

      if (response.data.success) {
        showToast(
          `Treatment plan ${action === "remove" ? "removed" : "cancelled"} successfully!`,
          "success",
        );
        refetchTreatmentPlans?.();
        onClose();
      }
    } catch (error: any) {
      console.error(`Error ${action}ing plan:`, error);
      showToast(
        error.response?.data?.message || `Failed to ${action} plan`,
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // 8️⃣ Update Procedure Status
  const handleUpdateProcedureStatus = async (
    toothIndex: number,
    procedureIndex: number,
    completed: boolean,
  ) => {
    if (viewOnly) return;

    if (!localPlan?._id) return;

    setLoading(true);
    try {
      // Get the procedure to find its stage
      const procedure = localPlan.teeth[toothIndex]?.procedures[procedureIndex];
      if (!procedure) {
        showToast("Procedure not found", "error");
        return;
      }

      // Find the stage index by stage number
      const stageIndex = localPlan.stages?.findIndex(
        (stage) => stage.stageNumber == procedure.stage,
      );

      if (stageIndex === -1) {
        showToast("Stage not found for this procedure", "error");
        return;
      }

      const token = getAuthToken();
      const response = await axios.patch(
        `${patientServiceBaseUrl}${API_BASE}/update-procedure-status/${localPlan._id}/${stageIndex}/${procedureIndex}`,
        { completed },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setLocalPlan(response.data.treatmentPlan);
        showToast("Procedure status updated!", "success");
        refetchTreatmentPlans?.();
        await fetchPlanDetails(); // Refresh data
      }
    } catch (error: any) {
      console.error("Error updating procedure:", error);
      showToast(
        error.response?.data?.message || "Failed to update procedure",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (plan) {
      console.log("🚀 Treatment Plan Details Modal Opened");
      console.log("📋 Full Plan Data Received:", plan);

      console.log("🔍 Plan Structure Check:");
      console.log(
        "   Has stages array?",
        !!plan.stages && plan.stages.length > 0,
      );
      console.log("   Stages count:", plan.stages?.length || 0);

      if (plan.stages) {
        console.log("📈 Stages Analysis:");
        plan.stages.forEach((stage, i) => {
          console.log(
            `   Stage ${i + 1}: ${stage.stageName || "Unnamed Stage"}`,
          );
          console.log(`     Status: ${stage.status}`);
          console.log(
            `     Tooth-Surface Procedures:`,
            stage.toothSurfaceProcedures,
          );
        });
      }
    }
  }, [plan]);

  if (!localPlan) return null;

  // Helper functions (keep existing ones)
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getProceduresForToothInStage = (toothNumber: number, stage: any) => {
    if (!stage.toothSurfaceProcedures) return [];

    const toothData = stage.toothSurfaceProcedures.find(
      (tsp: any) => tsp.toothNumber === toothNumber,
    );

    if (!toothData || !toothData.surfaceProcedures) return [];

    const procedures = [];
    for (const sp of toothData.surfaceProcedures) {
      for (const procName of sp.procedureNames) {
        procedures.push({
          name: procName,
          surface: sp.surface,
          status: stage.status || "pending",
        });
      }
    }

    return procedures;
  };

  const getAllTeethFromStages = () => {
    const teethSet = new Set<number>();
    if (localPlan.stages) {
      localPlan.stages.forEach((stage) => {
        if (stage.toothSurfaceProcedures) {
          stage.toothSurfaceProcedures.forEach((tsp) => {
            teethSet.add(tsp.toothNumber);
          });
        }
      });
    }
    return Array.from(teethSet).sort((a, b) => a - b);
  };
  const calculateStats = () => {
    const teeth = localPlan.teeth || localPlan.treatments || [];
    const stages = localPlan.stages || [];

    const totalTeeth = teeth.length;
    const totalProcedures = teeth.reduce(
      (sum, tooth) => sum + (tooth.procedures?.length || 0),
      0,
    );
    const completedProcedures = teeth.reduce(
      (sum, tooth) =>
        sum +
        (tooth.procedures?.filter((p) => p.status === "completed").length || 0),
      0,
    );
    const totalCost = teeth.reduce(
      (sum, tooth) =>
        sum +
        (tooth.procedures?.reduce(
          (procSum, proc) => procSum + (proc.estimatedCost || 0),
          0,
        ) || 0),
      0,
    );
    const completedStages = stages.filter(
      (s) => s.status === "completed",
    ).length;

    const progressPercentage =
      stages.length > 0
        ? Math.round((completedStages / stages.length) * 100)
        : 0;

    return {
      totalTeeth,
      totalProcedures,
      completedProcedures,
      totalCost,
      stagesCount: stages.length,
      completedStages,
      progressPercentage, // ← Now based on stage completion
    };
  };
  const stats = calculateStats();

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "planned":
      case "pending":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      {/* Toast Notification - hide if viewOnly */}
      {!viewOnly && toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
            toast.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10"
          disabled={!viewOnly && loading}
        >
          <X size={20} />
        </button>

        {/* Treatment Plan Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-1">
                {localPlan.planName || "Treatment Plan"}
              </h2>
              <p className="text-gray-600 mb-2">
                {localPlan.description || "No description provided"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                className={`
                  ${
                    localPlan.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : localPlan.status === "ongoing"
                        ? "bg-blue-100 text-blue-700"
                        : localPlan.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                  } font-medium
                `}
              >
                {localPlan.status?.toUpperCase() || "DRAFT"}
              </Badge>
              {viewOnly && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 text-xs"
                >
                  👁️ Preview Only
                </Badge>
              )}
              {viewOnly &&
                localPlan?._id?.startsWith("temp-") &&
                onEditPlan && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose(); // Close the modal
                      onEditPlan(localPlan); // Trigger edit in parent
                    }}
                    className="text-sm flex items-center gap-2"
                  >
                    <span>✏️</span>
                    Edit Plan
                  </Button>
                )}
            </div>
          </div>

          {/* Plan Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-500 text-xs">Patient</p>
              <p className="font-medium">{localPlan.patient?.name}</p>
              <p className="text-xs text-gray-500">
                {localPlan.patient?.patientUniqueId}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-500 text-xs">Created</p>
              <p className="font-medium">{formatDate(localPlan.createdAt)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-500 text-xs">Total Stages</p>
              <p className="font-medium text-lg">{stats.stagesCount}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-500 text-xs">Total Cost</p>
              <p className="font-medium text-lg">₹{stats.totalCost}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("teeth")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "teeth"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              🦷 Teeth View ({stats.totalTeeth} teeth)
            </button>
            <button
              onClick={() => setActiveTab("stages")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "stages"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              📋 Stages View ({stats.stagesCount} stages)
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "teeth" ? (
          /* TEETH VIEW - Read Only */
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  Teeth & Procedures
                </h3>
                <p className="text-sm text-gray-500">
                  {stats.totalProcedures} procedures across {stats.totalTeeth}{" "}
                  teeth
                </p>
              </div>
              {/* {!localPlan.conflictChecked && !viewOnly && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    ⚠️ Needs Conflict Check
                  </Badge>
                )} */}
            </div>

            {/* Teeth List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {(localPlan.teeth || localPlan.treatments || []).length > 0 ? (
                (localPlan.teeth || localPlan.treatments || []).map(
                  (tooth, toothIndex) => (
                    <div
                      key={tooth._id || `tooth-${toothIndex}`}
                      className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <span className="font-bold text-primary text-lg">
                              {tooth.toothNumber}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              Tooth #{tooth.toothNumber}
                            </h4>
                            <Badge
                              className={`text-xs ${
                                tooth.isCompleted
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {tooth.isCompleted ? "Completed" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Procedures List */}
                      <div className="border-t pt-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Procedures:
                        </h5>
                        <div className="space-y-2">
                          {tooth.procedures && tooth.procedures.length > 0 ? (
                            tooth.procedures.map(
                              (procedure, procedureIndex) => (
                                <div
                                  key={
                                    procedure.procedureId ||
                                    `proc-${procedureIndex}`
                                  }
                                  className="p-3 border border-gray-200 rounded-lg bg-gray-50/50"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">
                                          {procedure.name}
                                        </span>
                                        <Badge
                                          className={`text-[10px] ${getStatusColor(procedure.status)}`}
                                        >
                                          {procedure.status || "Planned"}
                                        </Badge>
                                      </div>
                                      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                                        <span>
                                          Surface: {procedure.surface}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          Cost: ₹{procedure.estimatedCost || 0}
                                        </span>
                                        {procedure.notes && (
                                          <>
                                            <span>•</span>
                                            <span className="italic">
                                              Note: {procedure.notes}
                                            </span>
                                          </>
                                        )}
                                        {procedure.stage && (
                                          <>
                                            <span>•</span>
                                            <span className="text-blue-600">
                                              Stage: {procedure.stage}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    {/* Only show action buttons if NOT viewOnly */}

                                    {/* {!viewOnly && (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleUpdateProcedureStatus(toothIndex, procedureIndex, true)}
        disabled={procedure.status === 'completed' || loading}
      >
        ✓ Complete
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-red-500 hover:text-red-600"
        onClick={() => handleRemoveProcedure(tooth.toothNumber, procedure.name, procedure.surface)}
        disabled={loading}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  )} */}
                                  </div>
                                </div>
                              ),
                            )
                          ) : (
                            <div className="text-center py-4 border border-dashed rounded-lg">
                              <p className="text-gray-500 text-sm">
                                No procedures added
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )
              ) : (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <p className="text-gray-500">No teeth added yet</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STAGES VIEW - Read Only */
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  Treatment Stages
                </h3>
                <p className="text-sm text-gray-500">
                  {stats.completedStages} of {stats.stagesCount} stages
                  completed
                </p>
              </div>
              {/* Only show Add Stage button if NOT viewOnly */}
              {/* {!viewOnly && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddStage}
                    disabled={localPlan.status === 'completed' || localPlan.status === 'cancelled' || loading}
                  >
                    <Plus size={14} className="mr-1" />
                    Add Stage
                  </Button>
                )} */}
            </div>

            {/* Stages List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {localPlan.stages && localPlan.stages.length > 0 ? (
                localPlan.stages.map((stage, index) => (
                  <div
                    key={stage._id || `stage-${stage.stageNumber}`}
                    className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
                  >
                    {/* Stage Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                          <span className="font-bold text-blue-700 text-lg">
                            {stage.stageNumber}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {stage.stageName || `Stage ${stage.stageNumber}`}
                          </h4>
                          <div className="flex gap-2 mt-1">
                            <Badge
                              className={`text-xs ${getStatusColor(stage.status)}`}
                            >
                              {stage.status?.toUpperCase() || "PENDING"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700"
                            >
                              Scheduled: {formatDate(stage.scheduledDate)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {/* Only show delete button if NOT viewOnly */}
                      {!viewOnly && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleRemoveStage(stage.stageNumber)}
                          disabled={stage.status === "completed" || loading}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>

                    {/* Stage Description */}
                    {stage.description && (
                      <div className="mb-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        {stage.description}
                      </div>
                    )}

                    {/* Tooth-Surface Procedures */}
                    <div className="border-t pt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Procedures in this Stage:
                      </h5>
                      <div className="space-y-3">
                        {stage.toothSurfaceProcedures &&
                        stage.toothSurfaceProcedures.length > 0 ? (
                          stage.toothSurfaceProcedures.map((tsp, tspIndex) => (
                            <div
                              key={tspIndex}
                              className="border border-gray-200 rounded-lg p-3"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                                  <span className="font-bold text-primary text-sm">
                                    {tsp.toothNumber}
                                  </span>
                                </div>
                                <span className="font-medium">
                                  Tooth #{tsp.toothNumber}
                                </span>
                              </div>

                              <div className="ml-10 space-y-2">
                                {tsp.surfaceProcedures &&
                                  tsp.surfaceProcedures.map((sp, spIndex) => (
                                    <div key={spIndex} className="text-sm">
                                      <div className="flex items-start gap-2">
                                        <Badge
                                          variant="outline"
                                          className="text-xs capitalize bg-gray-100"
                                        >
                                          {sp.surface} Surface
                                        </Badge>
                                        <div className="flex-1">
                                          <div className="font-medium text-gray-700">
                                            Procedures:
                                          </div>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {sp.procedureNames.map(
                                              (procName, pIndex) => (
                                                <Badge
                                                  key={pIndex}
                                                  className="text-xs bg-green-50 text-green-700"
                                                >
                                                  {procName}
                                                </Badge>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 border border-dashed rounded-lg">
                            <p className="text-gray-500 text-sm">
                              No procedures scheduled for this stage
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {!viewOnly && (
                      <div className="mt-4 pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">
                            {stage.toothSurfaceProcedures?.reduce(
                              (total, tsp) =>
                                total +
                                (tsp.surfaceProcedures?.reduce(
                                  (spTotal, sp) =>
                                    spTotal + (sp.procedureNames?.length || 0),
                                  0,
                                ) || 0),
                              0,
                            ) || 0}{" "}
                            procedures in this stage
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            disabled={stage.status === "completed" || loading}
                            onClick={() =>
                              handleCompleteStage(stage.stageNumber)
                            }
                          >
                            {stage.status === "completed"
                              ? "✓ Stage Completed"
                              : "Mark as Completed"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border rounded-lg bg-gray-50">
                  <p className="text-gray-500">No stages defined yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Summary - Only show for saved plans (not temp plans) */}
        {!localPlan?._id?.startsWith("temp-") && (
          <div className="mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-3">
                Treatment Progress
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stats.totalTeeth}
                  </div>
                  <div className="text-xs text-blue-600">Teeth</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.completedProcedures}
                  </div>
                  <div className="text-xs text-green-600">
                    Completed Procedures
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.completedStages}/{stats.stagesCount}
                  </div>
                  <div className="text-xs text-orange-600">
                    Stages Completed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {stats.progressPercentage}%
                  </div>
                  <div className="text-xs text-gray-600">Overall Progress</div>
                </div>
              </div>
              {stats.totalProcedures > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Stage Progress</span>
                    <span>
                      {stats.completedStages}/{stats.stagesCount} stages
                      completed
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${stats.progressPercentage}%` }}
                    />
                  </div>
                  {/* Optional: Show procedure completion separately */}
                  <div className="text-xs text-gray-500 mt-1">
                    ({stats.completedProcedures}/{stats.totalProcedures}{" "}
                    procedures completed)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons - Hide if viewOnly */}
        {!viewOnly && (
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-500 flex gap-4">
              {localPlan.conflictChecked && (
                <span className="text-green-600">
                  ✓ Conflict check completed
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={handleRemovePlan}
                disabled={loading}
              >
                {localPlan.status === "draft" ? "Delete Plan" : "Cancel Plan"}
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="text-sm"
                disabled={loading}
              >
                Close
              </Button>
              <Button
                className="text-sm bg-primary hover:bg-primary/90"
                disabled={
                  loading ||
                  localPlan.status === "completed" ||
                  localPlan.status === "cancelled"
                }
                onClick={() => {
                  if (localPlan.status === "draft") {
                    handleStartPlan();
                  } else if (localPlan.status === "ongoing") {
                    handleFinishPlan();
                  }
                }}
              >
                {loading ? (
                  "Processing..."
                ) : localPlan.status === "draft" ? (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Plan
                  </>
                ) : localPlan.status === "ongoing" ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Plan
                  </>
                ) : (
                  "Plan Completed"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* If viewOnly, show only Close button */}
        {/* If viewOnly, show only Close button */}
      </div>
    </div>
  );
};

// Treatment Plan Form Component (Remains the same as before)
interface TreatmentPlanFormProps {
  patientId: string;
  patientName: string;
  clinicId: string; // Added clinicId prop
  existingConditions: ToothCondition[];
  onClose: () => void;
  onSave: (plan: TreatmentPlanData) => void;
  initialData?: TreatmentPlanData | null;
}

const TreatmentPlanForm: React.FC<TreatmentPlanFormProps> = ({
  patientId,
  patientName,
  clinicId, // Receive clinicId from parent
  existingConditions,
  onClose,
  onSave,
  initialData,
}) => {
  const [planName, setPlanName] = useState(
    initialData?.planName || "Treatment Plan",
  );
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [stages, setStages] = useState<TreatmentPlanStage[]>(
    initialData?.stages || [
      {
        stageName: "Initial Treatment",
        description: "Primary procedures",
        procedureRefs: [],
        status: "pending",
        scheduledDate: new Date().toISOString().split("T")[0],
      },
      {
        stageName: "Follow-up",
        description: "Secondary procedures",
        procedureRefs: [],
        status: "pending",
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
    ],
  );
  
  // REMOVED: selectedProcedure, selectedSurface, estimatedCost - not needed anymore
  
  // State for multi-select dropdowns
  const [selectedOnExamination, setSelectedOnExamination] = useState<any[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<any[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState<any[]>([]);
  const [selectedSurface, setSelectedSurface] = useState<string>("entire");
  const [notes, setNotes] = useState("");
  
  // Loading states
  const [loadingExaminations, setLoadingExaminations] = useState(false);
  const [loadingDiagnoses, setLoadingDiagnoses] = useState(false);
  const [loadingTreatments, setLoadingTreatments] = useState(false);
  
  const [teethPlans, setTeethPlans] = useState<
    {
      toothNumber: number;
      onExamination?: any[];
      diagnosis?: any[];
      treatment?: any[];
      notes?: string;
      priority: "urgent" | "high" | "medium" | "low";
    }[]
  >(
    initialData?.teeth.map((t) => ({
      toothNumber: t.toothNumber,
      priority: t.priority || "medium",
      // Remove procedures - we're only storing clinical findings now
      onExamination: (t as any).onExamination || [],
      diagnosis: (t as any).diagnosis || [],
      treatment: (t as any).treatment || [],
      notes: (t as any).notes || "",
    })) || [],
  );
  
  const [selectedPriority, setSelectedPriority] = useState<
    "urgent" | "high" | "medium" | "low"
  >("medium");
  
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [chartType, setChartType] = useState<"adult" | "pediatric">("adult");
  const [selectionMode, setSelectionMode] = useState<"single" | "multiple">(
    "single",
  );
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [multipleSelectionType, setMultipleSelectionType] =
    useState<string>("full-mouth");

  // ==================== FETCH FUNCTIONS USING CLINICID PROP ====================
  const fetchExaminationFindings = useCallback(async (search: string = "") => {
    if (!clinicId) {
      console.warn("⚠ No clinic ID available for fetching examination findings");
      return [];
    }

    setLoadingExaminations(true);
    try {
      const token = localStorage.getItem("authToken");
      const params = new URLSearchParams({
        clinicId: clinicId,
        ...(search && { search }),
        limit: "50",
      });

      const response = await axios.get(
        `${clinicServiceBaseUrl}/api/v1/patient_treatment/details/examination-findings?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      const findings = (data.data || data.results || data || []);
      
      const transformedFindings = findings.map((item: any) => ({
        id: item._id || item.id || `finding_${Date.now()}_${Math.random()}`,
        name: item.findingName || item.name || item.title,
        code: item.findingCode || item.code,
        category: item.category || 'Examination Finding',
        isCustom: false,
      }));

      return transformedFindings;
    } catch (err: any) {
      console.error("❌ Error fetching examination findings:", err);
      return [];
    } finally {
      setLoadingExaminations(false);
    }
  }, [clinicId]);

  const fetchDiagnoses = useCallback(async (search: string = "") => {
    if (!clinicId) {
      console.warn("⚠ No clinic ID available for fetching diagnoses");
      return [];
    }

    setLoadingDiagnoses(true);
    try {
      const token = localStorage.getItem("authToken");
      const params = new URLSearchParams({
        clinicId: clinicId,
        ...(search && { search }),
        limit: "50",
        type: "diagnosis",
      });

      const response = await axios.get(
        `${clinicServiceBaseUrl}/api/v1/patient_treatment/details/patient-diagnosis?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      const diagnoses = (data.data || data.results || data || []);
      
      const transformedDiagnoses = diagnoses.map((item: any) => ({
        id: item._id || item.id || `diagnosis_${Date.now()}_${Math.random()}`,
        name: item.procedureName || item.name || item.title,
        code: item.procedureCode || item.code,
        category: item.category || 'Diagnosis',
        isCustom: false,
      }));

      return transformedDiagnoses;
    } catch (err: any) {
      console.error("❌ Error fetching diagnoses:", err);
      return [];
    } finally {
      setLoadingDiagnoses(false);
    }
  }, [clinicId]);

  const fetchTreatments = useCallback(async (search: string = "") => {
    if (!clinicId) {
      console.warn("⚠ No clinic ID available for fetching treatments");
      return [];
    }

    setLoadingTreatments(true);
    try {
      const token = localStorage.getItem("authToken");
      const params = new URLSearchParams({
        clinicId: clinicId,
        ...(search && { search }),
        limit: "50",
      });

      const response = await axios.get(
        `${clinicServiceBaseUrl}/api/v1/patient_treatment/details/treatment-procedures?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      const treatments = (data.data || data.results || data || []);
      
      const transformedTreatments = treatments.map((item: any) => ({
        id: item._id || item.id || `treatment_${Date.now()}_${Math.random()}`,
        name: item.procedureName || item.name || item.title,
        code: item.procedureCode || item.code,
        category: item.category || 'Treatment',
        isCustom: false,
      }));

      return transformedTreatments;
    } catch (err: any) {
      console.error("❌ Error fetching treatments:", err);
      return [];
    } finally {
      setLoadingTreatments(false);
    }
  }, [clinicId]);

  // Pre-fetch data when clinicId is available
  useEffect(() => {
    if (clinicId) {
      console.log("🏥 Clinic ID available, pre-fetching dropdown options...");
      fetchExaminationFindings("");
      fetchDiagnoses("");
      fetchTreatments("");
    }
  }, [clinicId, fetchExaminationFindings, fetchDiagnoses, fetchTreatments]);

  useEffect(() => {
    if (initialData) {
      console.log("📋 TreatmentPlanForm received initial data:", initialData);
    }
  }, [initialData]);

  // UPDATED: Handle adding clinical findings without procedures
 const handleAddFindings = () => {
  if (selectionMode === "single") {
    // Single tooth mode
    if (!selectedTooth) {
      alert("Please select a tooth");
      return;
    }

    const toothIndex = teethPlans.findIndex(
      (tp) => tp.toothNumber === selectedTooth,
    );

    // Add stage information to treatments
    const treatmentsWithStage = selectedTreatment.map(treatment => ({
      ...treatment,
      stage: selectedStage // Add the current stage to each treatment
    }));

    if (toothIndex === -1) {
      // New tooth
      setTeethPlans([
        ...teethPlans,
        {
          toothNumber: selectedTooth,
          onExamination: selectedOnExamination,
          diagnosis: selectedDiagnosis,
          treatment: treatmentsWithStage,
          notes: notes,
          priority: selectedPriority,
        },
      ]);
    } else {
      // Update existing tooth - merge findings
      const updated = [...teethPlans];
      
      // Merge onExamination
      updated[toothIndex].onExamination = [
        ...(updated[toothIndex].onExamination || []),
        ...selectedOnExamination.filter(
          item => !updated[toothIndex].onExamination?.some(
            existing => existing.id === item.id
          )
        )
      ];
      
      // Merge diagnosis
      updated[toothIndex].diagnosis = [
        ...(updated[toothIndex].diagnosis || []),
        ...selectedDiagnosis.filter(
          item => !updated[toothIndex].diagnosis?.some(
            existing => existing.id === item.id
          )
        )
      ];
      
      // Merge treatment (with stage info)
      const existingTreatments = updated[toothIndex].treatment || [];
      const newTreatments = treatmentsWithStage.filter(
        item => !existingTreatments.some(
          existing => existing.id === item.id
        )
      );
      
      updated[toothIndex].treatment = [
        ...existingTreatments,
        ...newTreatments
      ];
      
      // Update notes and priority
      updated[toothIndex].notes = notes || updated[toothIndex].notes;
      updated[toothIndex].priority = selectedPriority;
      
      setTeethPlans(updated);
    }

    // Reset single selection
    setSelectedTooth(null);
  } else {
    // Multiple teeth mode
    if (selectedTeeth.length === 0) {
      alert("Please select teeth first");
      return;
    }

    // Add stage information to treatments
    const treatmentsWithStage = selectedTreatment.map(treatment => ({
      ...treatment,
      stage: selectedStage // Add the current stage to each treatment
    }));

    const newTeethPlans = [...teethPlans];

    selectedTeeth.forEach((toothNumber) => {
      const toothIndex = newTeethPlans.findIndex(
        (tp) => tp.toothNumber === toothNumber,
      );

      if (toothIndex === -1) {
        // New tooth
        newTeethPlans.push({
          toothNumber,
          onExamination: selectedOnExamination,
          diagnosis: selectedDiagnosis,
          treatment: treatmentsWithStage,
          notes: notes,
          priority: selectedPriority,
        });
      } else {
        // Update existing tooth - merge findings
        // Merge onExamination
        newTeethPlans[toothIndex].onExamination = [
          ...(newTeethPlans[toothIndex].onExamination || []),
          ...selectedOnExamination.filter(
            item => !newTeethPlans[toothIndex].onExamination?.some(
              existing => existing.id === item.id
            )
          )
        ];
        
        // Merge diagnosis
        newTeethPlans[toothIndex].diagnosis = [
          ...(newTeethPlans[toothIndex].diagnosis || []),
          ...selectedDiagnosis.filter(
            item => !newTeethPlans[toothIndex].diagnosis?.some(
              existing => existing.id === item.id
            )
          )
        ];
        
        // Merge treatment (with stage info)
        const existingTreatments = newTeethPlans[toothIndex].treatment || [];
        const newTreatments = treatmentsWithStage.filter(
          item => !existingTreatments.some(
            existing => existing.id === item.id
          )
        );
        
        newTeethPlans[toothIndex].treatment = [
          ...existingTreatments,
          ...newTreatments
        ];
        
        // Update notes and priority
        newTeethPlans[toothIndex].notes = notes || newTeethPlans[toothIndex].notes;
        newTeethPlans[toothIndex].priority = selectedPriority;
      }
    });

    setTeethPlans(newTeethPlans);

    // Clear selection after adding
    setSelectedTeeth([]);
  }

  // Reset form fields
  setNotes("");
  setSelectedOnExamination([]);
  setSelectedDiagnosis([]);
  setSelectedTreatment([]);
};

const handleSavePlan = () => {
  if (teethPlans.length === 0) {
    alert("Please add at least one tooth with clinical findings before saving the treatment plan");
    return;
  }

  // Build procedures by stage from the treatments added to teeth
  const proceduresByStage: Record<number, any[]> = {};
  
  teethPlans.forEach((toothPlan) => {
    // Only include treatment findings as procedures
    (toothPlan.treatment || []).forEach((treatment: any) => {
      // Find which stage this treatment belongs to
      // You need to store the stage with each treatment when adding findings
      // For now, let's assume treatments are assigned to the stage that was selected when they were added
      
      // IMPORTANT FIX: We need to know which stage each treatment belongs to
      // Since treatments don't have stage info in your current structure,
      // we need to add stage information when adding findings
      
      // Temporary solution: You need to modify handleAddFindings to store stage with each treatment
      // For now, I'll show you the fix assuming treatments have a 'stage' property
      
      const stageNum = treatment.stage || 1; // Default to stage 1 if no stage info
      
      if (!proceduresByStage[stageNum]) {
        proceduresByStage[stageNum] = [];
      }
      
      proceduresByStage[stageNum].push({
        toothNumber: toothPlan.toothNumber,
        procedureName: treatment.name, // Changed from 'name' to 'procedureName' to match backend
        name: treatment.name,
        surface: "entire", // Default surface
        estimatedCost: 0,
        notes: toothPlan.notes || "",
        status: "planned",
        stage: stageNum
      });
    });
  });

  console.log("📊 Procedures by stage before saving:", proceduresByStage);

  // Format teeth data with clinical findings and procedures
  const formattedTeeth = teethPlans.map((toothPlan) => {
    // Get all procedures for this tooth across all stages
    const toothProcedures: any[] = [];
    
    Object.entries(proceduresByStage).forEach(([stageNum, procs]) => {
      const toothProcs = procs.filter(p => p.toothNumber === toothPlan.toothNumber);
      toothProcedures.push(...toothProcs);
    });
    
    return {
      toothNumber: toothPlan.toothNumber,
      priority: toothPlan.priority || "medium",
      procedures: toothProcedures,
      // Include clinical findings with proper structure
      onExamination: (toothPlan.onExamination || []).map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        category: item.category,
        isCustom: item.isCustom || false,
        selectedAt: item.selectedAt || new Date().toISOString()
      })),
      diagnosis: (toothPlan.diagnosis || []).map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        category: item.category,
        isCustom: item.isCustom || false,
        selectedAt: item.selectedAt || new Date().toISOString()
      })),
      treatment: (toothPlan.treatment || []).map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        category: item.category,
        isCustom: item.isCustom || false,
        selectedAt: item.selectedAt || new Date().toISOString()
      })),
      notes: toothPlan.notes || "",
    };
  });

  // Format stages with procedureRefs and toothSurfaceProcedures
  const formattedStages = stages.map((stage, index) => {
    const stageNumber = index + 1;
    const stageProcedures = proceduresByStage[stageNumber] || [];
    
    console.log(`📋 Stage ${stageNumber} procedures:`, stageProcedures);
    
    // Build toothSurfaceProcedures for this stage
    const toothSurfaceMap: Record<number, Record<string, string[]>> = {};
    
    stageProcedures.forEach((proc) => {
      if (!toothSurfaceMap[proc.toothNumber]) {
        toothSurfaceMap[proc.toothNumber] = {};
      }
      if (!toothSurfaceMap[proc.toothNumber][proc.surface]) {
        toothSurfaceMap[proc.toothNumber][proc.surface] = [];
      }
      if (!toothSurfaceMap[proc.toothNumber][proc.surface].includes(proc.procedureName)) {
        toothSurfaceMap[proc.toothNumber][proc.surface].push(proc.procedureName);
      }
    });
    
    const toothSurfaceProcedures = Object.entries(toothSurfaceMap).map(
      ([toothNumStr, surfaces]) => ({
        toothNumber: parseInt(toothNumStr),
        surfaceProcedures: Object.entries(surfaces).map(([surface, procedureNames]) => ({
          surface,
          procedureNames
        }))
      })
    );
    
    return {
      stageName: stage.stageName || `Stage ${stageNumber}`,
      stageNumber,
      description: stage.description || "",
      procedureRefs: stageProcedures.map(p => ({
        toothNumber: p.toothNumber,
        procedureName: p.procedureName
      })),
      toothSurfaceProcedures,
      status: stage.status || "pending",
      scheduledDate: stage.scheduledDate || 
        new Date(Date.now() + (stageNumber - 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: stage.notes || "",
    };
  });

  const plan: TreatmentPlanData = {
    planName,
    description,
    teeth: formattedTeeth,
    stages: formattedStages,
  };

  console.log("📤 Final plan being saved:", plan);
  onSave(plan);
};

  const handleAddStage = () => {
    const newStageNumber = stages.length + 1;
    setStages([
      ...stages,
      {
        stageName: `Stage ${newStageNumber}`,
        description: "",
        procedureRefs: [],
        status: "pending",
        scheduledDate: new Date(
          Date.now() + (newStageNumber - 1) * 7 * 24 * 60 * 60 * 1000,
        )
          .toISOString()
          .split("T")[0],
      },
    ]);
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 1) {
      alert("At least one stage is required");
      return;
    }

    const updatedStages = stages.filter((_, i) => i !== index);
    const renumberedStages = updatedStages.map((stage, idx) => ({
      ...stage,
      stageName: stage.stageName.replace(/\d+$/, String(idx + 1)),
    }));

    setStages(renumberedStages);

    if (selectedStage > renumberedStages.length) {
      setSelectedStage(renumberedStages.length);
    } else if (selectedStage === index + 1) {
      setSelectedStage(1);
    }
  };

  const handleUpdateStageStatus = (
    stageIndex: number,
    newStatus: "pending" | "completed" | "in-progress",
  ) => {
    const updatedStages = [...stages];
    updatedStages[stageIndex].status = newStatus;
    setStages(updatedStages);
  };

  const getFilteredTeeth = () => {
    return chartType === "adult" ? ADULT_TOOTH_DATA : PEDIATRIC_TOOTH_DATA;
  };

  const handleMultipleSelection = (selectionType: string) => {
    setMultipleSelectionType(selectionType);
    const filteredTeeth = getFilteredTeeth();

    let teethToSelect: number[] = [];

    switch (selectionType) {
      case "full-mouth":
        teethToSelect = filteredTeeth.map((t) => t.number);
        break;
      case "upper":
        teethToSelect = filteredTeeth
          .filter((t) => t.quadrant === 1 || t.quadrant === 2)
          .map((t) => t.number);
        break;
      case "lower":
        teethToSelect = filteredTeeth
          .filter((t) => t.quadrant === 3 || t.quadrant === 4)
          .map((t) => t.number);
        break;
      case "upper-right":
        teethToSelect = filteredTeeth
          .filter((t) => t.quadrant === 1)
          .map((t) => t.number);
        break;
      case "upper-left":
        teethToSelect = filteredTeeth
          .filter((t) => t.quadrant === 2)
          .map((t) => t.number);
        break;
      case "lower-right":
        teethToSelect = filteredTeeth
          .filter((t) => t.quadrant === 4)
          .map((t) => t.number);
        break;
      case "lower-left":
        teethToSelect = filteredTeeth
          .filter((t) => t.quadrant === 3)
          .map((t) => t.number);
        break;
      case "custom":
        teethToSelect = [...selectedTeeth];
        break;
      default:
        teethToSelect = filteredTeeth.map((t) => t.number);
    }

    setSelectedTeeth(teethToSelect);
  };

  const handleClearSelection = () => {
    setSelectedTeeth([]);
    setSelectedTooth(null);
  };

  const getToothName = (toothNumber: number) => {
    const allTeeth = getFilteredTeeth();
    const tooth = allTeeth.find((t) => t.number === toothNumber);
    return tooth ? tooth.name : `Tooth ${toothNumber}`;
  };

  // Handle clearing all selections for a tooth
  const handleClearToothFindings = (toothIndex: number, field: 'onExamination' | 'diagnosis' | 'treatment') => {
    const updated = [...teethPlans];
    if (updated[toothIndex]) {
      updated[toothIndex][field] = [];
      setTeethPlans(updated);
    }
  };

  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b px-6 py-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Create Clinical Findings Plan</h3>
          <p className="text-sm text-gray-600 mt-1">
            Patient: <span className="font-medium">{patientName}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-primary/10">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Plan Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g., Comprehensive Oral Examination"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the plan"
                />
              </div>
            </div>
          </div>

          {/* Stages Management */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full"></span>
                Treatment Stages
              </h4>
              <Button variant="outline" size="sm" onClick={handleAddStage} className="border-primary/30 text-primary hover:bg-primary/5">
                <Plus className="h-4 w-4 mr-1" />
                Add Stage
              </Button>
            </div>

            <div className="space-y-3">
              {stages.map((stage, index) => {
                const stageNumber = index + 1;

                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{stageNumber}</span>
                        </div>
                        <span className="font-medium text-gray-800">{stage.stageName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs px-3 py-1 ${
                            stage.status === "completed"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : stage.status === "in-progress"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {stage.status || "pending"}
                        </Badge>
                        {stages.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStage(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Stage Name</label>
                        <input
                          type="text"
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary/30 focus:border-primary bg-white"
                          value={stage.stageName}
                          onChange={(e) => {
                            const updated = [...stages];
                            updated[index].stageName = e.target.value;
                            setStages(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Scheduled Date</label>
                        <input
                          type="date"
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary/30 focus:border-primary bg-white"
                          value={stage.scheduledDate || ""}
                          onChange={(e) => {
                            const updated = [...stages];
                            updated[index].scheduledDate = e.target.value;
                            setStages(updated);
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Description</label>
                        <textarea
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary/30 focus:border-primary bg-white"
                          value={stage.description || ""}
                          onChange={(e) => {
                            const updated = [...stages];
                            updated[index].description = e.target.value;
                            setStages(updated);
                          }}
                          rows={1}
                          placeholder="Stage description"
                        />
                      </div>
                    </div>
                    
                    {/* Stage Status Toggle */}
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">Update Status:</span>
                        <div className="flex gap-1">
                          {["pending", "in-progress", "completed"].map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleUpdateStageStatus(index, status as any)}
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                stage.status === status
                                  ? status === "completed"
                                    ? "bg-green-100 text-green-700 border-green-300"
                                    : status === "in-progress"
                                      ? "bg-blue-100 text-blue-700 border-blue-300"
                                      : "bg-gray-100 text-gray-700 border-gray-300"
                                  : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                              }`}
                            >
                              {status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Clinical Findings Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-primary rounded-full"></span>
              Add Clinical Findings
            </h4>

            {/* Selection Mode Toggle */}
            <div className="mb-6 bg-gray-50/80 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-wrap items-center gap-6">
                {/* Chart Type */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">Chart:</span>
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
                    {["adult", "pediatric"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setChartType(type as "adult" | "pediatric");
                          if (selectionMode === "single") {
                            setSelectedTooth(null);
                          } else {
                            setSelectedTeeth([]);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-medium transition-all ${
                          chartType === type
                            ? "bg-primary text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {type === "adult" ? "Adult" : "Pediatric"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selection Mode */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">Selection Mode:</span>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
                    <span className="text-xs text-gray-700 font-medium">
                      {selectionMode === "multiple" ? "Multiple Teeth" : "Single Tooth"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectionMode === "multiple") {
                          setSelectionMode("single");
                          setSelectedTeeth([]);
                        } else {
                          setSelectionMode("multiple");
                          handleMultipleSelection("full-mouth");
                        }
                      }}
                      className={`relative w-8 h-4 rounded-full transition-colors ${
                        selectionMode === "multiple" ? "bg-primary" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                          selectionMode === "multiple" ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Selection for Multiple Mode */}
              {selectionMode === "multiple" && (
                <div className="mt-4">
                  <span className="text-xs text-gray-600 mb-2 block">Quick Selection:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { type: "full-mouth", label: "Full Mouth" },
                      { type: "upper", label: "Upper" },
                      { type: "lower", label: "Lower" },
                      { type: "upper-right", label: "UR" },
                      { type: "upper-left", label: "UL" },
                      { type: "lower-right", label: "LR" },
                      { type: "lower-left", label: "LL" },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleMultipleSelection(item.type)}
                        className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                          multipleSelectionType === item.type
                            ? "bg-primary/10 border-primary text-primary font-medium"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stage Selection */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Assign to Stage
              </label>
              <div className="flex flex-wrap gap-2">
                {stages.map((stage, index) => {
                  const stageNumber = index + 1;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedStage(stageNumber)}
                      className={`px-3 py-1.5 border rounded-lg flex items-center gap-1.5 text-sm transition-all ${
                        selectedStage === stageNumber
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>Stage {stageNumber}</span>
                      <Badge
                        className={`text-[10px] px-1.5 py-0.5 ${
                          selectedStage === stageNumber
                            ? "bg-white/20 text-white"
                            : stage.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : stage.status === "in-progress"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {stage.status === "in-progress" ? "IP" : stage.status?.charAt(0).toUpperCase() || "P"}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tooth Selection */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                {selectionMode === "single" ? "Tooth Number" : "Selected Teeth"}
              </label>
              {selectionMode === "single" ? (
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
                  value={selectedTooth || ""}
                  onChange={(e) =>
                    setSelectedTooth(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                >
                  <option value="">Select a tooth...</option>
                  {getFilteredTeeth()
                    .sort((a, b) => a.number - b.number)
                    .map((tooth) => (
                      <option key={tooth.number} value={tooth.number}>
                        Tooth #{tooth.number} - {tooth.name}
                      </option>
                    ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 min-h-[70px]">
                    {selectedTeeth.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTeeth
                          .sort((a, b) => a - b)
                          .map((toothNum) => (
                            <div key={toothNum} className="relative group">
                              <span className="px-2.5 py-1.5 bg-white border border-primary/30 text-primary rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm">
                                #{toothNum}
                                <span className="text-[10px] text-gray-500">
                                  ({getToothName(toothNum).split(' ')[0]})
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTeeth(
                                    selectedTeeth.filter(
                                      (num) => num !== toothNum,
                                    ),
                                  );
                                }}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-10">
                        <span className="text-xs text-gray-400 italic">
                          No teeth selected. Use quick selection buttons above.
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedTeeth.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">
                        <span className="font-medium">{selectedTeeth.length}</span> teeth selected
                      </span>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="px-2.5 py-1 text-xs border border-red-300 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MULTI-SELECT DROPDOWNS */}
            <div className="space-y-4 mb-5">
              <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                  Clinical Findings for Selected Tooth/Teeth
                </h5>
                
                <div className="space-y-4">
                  {/* On Examination Dropdown */}
                  <MultiSelectDropdown
                    label="On Examination"
                    value={selectedOnExamination}
                    onChange={setSelectedOnExamination}
                    fetchOptions={fetchExaminationFindings}
                    placeholder="Search and select examination findings..."
                    loading={loadingExaminations}
                    allowCustom={true}
                  />

                  {/* Diagnosis Dropdown */}
                  <MultiSelectDropdown
                    label="Diagnosis"
                    value={selectedDiagnosis}
                    onChange={setSelectedDiagnosis}
                    fetchOptions={fetchDiagnoses}
                    placeholder="Search and select diagnoses..."
                    loading={loadingDiagnoses}
                    allowCustom={true}
                  />

                  {/* Treatment Dropdown */}
                  <MultiSelectDropdown
                    label="Treatment"
                    value={selectedTreatment}
                    onChange={setSelectedTreatment}
                    fetchOptions={fetchTreatments}
                    placeholder="Search and select treatments..."
                    loading={loadingTreatments}
                    allowCustom={true}
                  />
                </div>
              </div>
            </div>

            {/* Priority & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(["urgent", "high", "medium", "low"] as const).map(
                    (priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setSelectedPriority(priority)}
                        className={`px-3 py-1.5 text-xs rounded-full border capitalize transition-all ${
                          selectedPriority === priority
                            ? priority === "urgent"
                              ? "bg-red-500 text-white border-red-500"
                              : priority === "high"
                                ? "bg-orange-500 text-white border-orange-500"
                                : priority === "medium"
                                  ? "bg-blue-500 text-white border-blue-500"
                                  : "bg-gray-500 text-white border-gray-500"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {priority}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add clinical notes..."
                />
              </div>
            </div>

            {/* Summary of selections */}
            {(selectedOnExamination.length > 0 || selectedDiagnosis.length > 0 || selectedTreatment.length > 0) && (
              <div className="mb-5 bg-blue-50/80 p-4 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                  <span>📋</span> Findings to be added:
                </p>
                <div className="space-y-2">
                  {selectedOnExamination.length > 0 && (
                    <div>
                      <span className="text-[10px] font-medium text-blue-700">On Examination:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedOnExamination.map(item => (
                          <Badge key={item.id} className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5">
                            {item.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedDiagnosis.length > 0 && (
                    <div>
                      <span className="text-[10px] font-medium text-purple-700">Diagnosis:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedDiagnosis.map(item => (
                          <Badge key={item.id} className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5">
                            {item.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedTreatment.length > 0 && (
                    <div>
                      <span className="text-[10px] font-medium text-green-700">Treatment:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTreatment.map(item => (
                          <Badge key={item.id} className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5">
                            {item.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={handleAddFindings}
              disabled={
                (selectionMode === "single" && !selectedTooth) ||
                (selectionMode === "multiple" && selectedTeeth.length === 0) ||
                (selectedOnExamination.length === 0 && selectedDiagnosis.length === 0 && selectedTreatment.length === 0)
              }
              className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white rounded-lg font-medium transition-all shadow-sm hover:shadow"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              {selectionMode === "multiple"
                ? `Add Findings to ${selectedTeeth.length} Selected ${selectedTeeth.length === 1 ? 'Tooth' : 'Teeth'}`
                : `Add Findings to Tooth ${selectedTooth || ""}`}
            </Button>
          </div>

          {/* Added Findings Summary */}
          {teethPlans.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-green-500 rounded-full"></span>
                  Added Clinical Findings
                </h4>
                <Badge variant="outline" className="bg-gray-100 text-gray-700 px-3 py-1">
                  {teethPlans.length} {teethPlans.length === 1 ? 'tooth' : 'teeth'}
                </Badge>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {teethPlans.map((toothPlan, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-bold text-primary text-sm">#{toothPlan.toothNumber}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">Tooth #{toothPlan.toothNumber}</span>
                          {toothPlan.priority && toothPlan.priority !== "medium" && (
                            <Badge
                              className={`ml-2 text-[10px] ${
                                toothPlan.priority === "urgent"
                                  ? "bg-red-100 text-red-700"
                                  : toothPlan.priority === "high"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-green-100 text-green-700"
                              }`}
                            >
                              {toothPlan.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(toothPlan.onExamination?.length ?? 0) > 0 && (
                          <button
                            onClick={() => handleClearToothFindings(idx, 'onExamination')}
                            className="text-[10px] text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
                          >
                            Clear Exam
                          </button>
                        )}
                        {(toothPlan.diagnosis?.length ?? 0) > 0 && (
                          <button
                            onClick={() => handleClearToothFindings(idx, 'diagnosis')}
                            className="text-[10px] text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
                          >
                            Clear Dx
                          </button>
                        )}
                        {(toothPlan.treatment?.length ?? 0) > 0 && (
                          <button
                            onClick={() => handleClearToothFindings(idx, 'treatment')}
                            className="text-[10px] text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
                          >
                            Clear Tx
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Clinical Findings Display */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {toothPlan.onExamination && toothPlan.onExamination.length > 0 && (
                        <div className="bg-blue-50/30 p-2 rounded-lg border border-blue-100">
                          <span className="text-[10px] font-semibold text-blue-700 block mb-1 flex items-center gap-1">
                            <span>🔍</span> On Examination
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {toothPlan.onExamination.map((item: any) => (
                              <Badge key={item.id} className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5">
                                {item.name}
                                {item.isCustom && " ✏️"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {toothPlan.diagnosis && toothPlan.diagnosis.length > 0 && (
                        <div className="bg-purple-50/30 p-2 rounded-lg border border-purple-100">
                          <span className="text-[10px] font-semibold text-purple-700 block mb-1 flex items-center gap-1">
                            <span>📌</span> Diagnosis
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {toothPlan.diagnosis.map((item: any) => (
                              <Badge key={item.id} className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5">
                                {item.name}
                                {item.isCustom && " ✏️"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {toothPlan.treatment && toothPlan.treatment.length > 0 && (
                        <div className="bg-green-50/30 p-2 rounded-lg border border-green-100">
                          <span className="text-[10px] font-semibold text-green-700 block mb-1 flex items-center gap-1">
                            <span>💊</span> Treatment
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {toothPlan.treatment.map((item: any) => (
                              <Badge key={item.id} className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5">
                                {item.name}
                                {item.isCustom && " ✏️"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {toothPlan.notes && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-200">
                        <span className="font-medium">Notes:</span> {toothPlan.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/80 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {teethPlans.length > 0 ? (
            <span className="flex items-center gap-2">
              <span className="font-medium">{teethPlans.length}</span> teeth with findings
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span className="font-medium">{stages.length}</span> stages
            </span>
          ) : (
            <span className="text-gray-400 italic">No findings added yet</span>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="px-5">
            Cancel
          </Button>
          <Button
            onClick={handleSavePlan}
            disabled={teethPlans.length === 0}
            className="bg-primary hover:bg-primary/90 text-white px-6 shadow-sm hover:shadow"
          >
            Save Clinical Findings Plan
          </Button>
        </div>
      </div>
    </div>
  );
};
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
  status:
    | "draft"
    | "pending"
    | "in-progress"
    | "completed"
    | "ongoing"
    | "cancelled";
  conflictChecked: boolean;
  currentStage?: number;
  totalEstimatedCost: number;
  completedCost: number;

  patient: {
    _id: string;
    name: string;
    phone: number;
    email?: string;
    patientUniqueId: string;
    patientRandomId?: string;
  };
  clinic: {
    _id: string;
    name: string;
    phone: number;
    address?: string;
  };
  createdByDoctor: {
    _id: string;
    name: string;
    specialization: string;
    phoneNumber: number;
  };

  // Main data arrays
  teeth: TreatmentItem[];
  treatments: TreatmentItem[]; // For backward compatibility
  stages: {
    _id: string;
    stageNumber: number;
    stageName: string;
    description?: string;
    toothSurfaceProcedures: {
      toothNumber: number;
      surfaceProcedures: {
        _id?: string;
        surface: string;
        procedureNames: string[];
      }[];
    }[];
    status: string;
    scheduledDate: string;
    notes?: string;
  }[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  startedAt?: string;

  __v: number;
}
interface TreatmentItem {
  _id?: string;
  toothNumber: number;
  priority: string;
  isCompleted: boolean;
  procedures: {
    procedureId: string;
    name: string;
    surface: string;
    status: string;
    estimatedCost: number;
    notes?: string;
    stage?: number; // Stage number for this procedure
  }[];
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
  status?: string;
  procedureRefs?: {
    toothNumber: number;
    procedureName: string;
  }[];
}
// interface Procedure {
//   name: string;
//   doctorId: string;
//   referredByDoctorId: string;
//   referredToDoctorId: string;
//   referralNotes: string;
//   completed: boolean;
// }
interface ResultFile {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}
interface TreatmentPlanData {
  planName: string;
  description?: string;
  teeth: {
    toothNumber: number;
    procedures: {
      name: string;
      surface: string;
      stage?: number;
      estimatedCost: number;
      notes?: string;
      status?: "planned" | "in-progress" | "completed";
    }[];
    priority?: "urgent" | "high" | "medium" | "low";
  }[];
  stages: {
    stageName: string;
    stageNumber?: number;
    description?: string;
    procedureRefs: {
      // This is required
      toothNumber: number;
      procedureName: string;
    }[];
    toothSurfaceProcedures?: {
      // This is optional
      toothNumber: number;
      surfaceProcedures: {
        surface: string;
        procedureNames: string[];
      }[];
    }[];
    status: "pending" | "completed" | "in-progress";
    scheduledDate?: string;
    completedAt?: string;
    notes?: string;
  }[];
  startToday?: boolean;
}
interface TreatmentPlanDetailsModalProps {
  plan: TreatmentPlan | null;
  onClose: () => void;
  refetchTreatmentPlans?: () => void;
  viewOnly?: boolean;
  onEditPlan?: (plan: TreatmentPlan) => void;
}
interface Department {
  _id: string;
  departmentName: string;
}

interface Doctor {
  doctorId: string; // existing
  doctor?: any; // add only if your API actually sends this
}
interface ExaminationItem {
  value: string;
  isCustom: boolean;
}
interface SoftTissueData {
  id: string;
  name: string;
  onExamination: string[];
  diagnosis: string[];
  treatment: string[];
  notes?: string;
  surfaceConditions?: {
    surface: string;
    conditions: string[];
  }[];
}
interface TMJData {
  id: string;
  name: string;
  onExamination: string[];
  diagnosis: string[];
  treatment: string[];
  notes?: string;
}
// Inside AppointmentsList component, add this interface
interface Prescription {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  medicineId?: string;
  // Optional fields for auto-creation
  genericName?: string;
  brandNames?: string[];
  dosageForms?: string[];
  strengths?: string[];
  category?: string;
}
interface LabResult {
  _id: string;
}
interface FileMeta {
  fileName: string;
  fileUrl: string;
  uploadedAt?: string;
}
interface ResultFile {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}
interface LabOrder {
  order: any;
  _id: string;
  status: string;
  price: number;
  attachments: FileMeta[];
  resultFiles: ResultFile[];
  vendor: string;
  dentist: string;
  appointmentId: string;
  note: string;
  createdAt: string;
}
interface ResultFile {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}
// Add these constants before the AppointmentsList component
const SOFT_TISSUE_DATA = [
  { id: "tongue", name: "Tongue" },
  { id: "gingiva", name: "Gingiva" },
  { id: "palate", name: "Palate" },
  { id: "buccal-mucosa", name: "Buccal Mucosa" },
  { id: "floor-of-mouth", name: "Floor of Mouth" },
  { id: "labial-mucosa", name: "Labial Mucosa" },
  { id: "salivary-glands", name: "Salivary Glands" },
  { id: "frenum", name: "Frenum" },
];

const TMJ_DATA: Pick<TMJData, "id" | "name">[] = [
  { id: "tmj-left", name: "TMJ Left" },
  { id: "tmj-right", name: "TMJ Right" },
  { id: "tmj-both", name: "TMJ Both" },
];

const generateProcedureId = (): string => {
  return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateObjectId = (): string => {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
  const random = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  return timestamp + random;
};
// ==================== Reusable MultiSelect Dropdown Component ====================

const MultiSelectDropdown = ({
  label,
  value = [],
  onChange,
  fetchOptions,
  placeholder = "Select options...",
  disabled = false,
  loading = false,
  allowCustom = true,
}: {
  label: string;
  value: any[];
  onChange: (items: any[]) => void;
  fetchOptions: (search: string) => Promise<any[]>;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  allowCustom?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<any[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const customOptionRef = useRef<HTMLDivElement | null>(null);

  // Load ALL options when dropdown opens
  useEffect(() => {
    const loadOptions = async () => {
      if (!isOpen) return;

      setIsLoading(true);
      const results = await fetchOptions("");
      setOptions(results);
      setIsLoading(false);
    };

    loadOptions();
  }, [isOpen, fetchOptions]);

  // Filter options locally when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = options.filter(
        (opt) =>
          opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (opt.code && opt.code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options]);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(-1);
    optionRefs.current = new Array(filteredOptions.length).fill(null);
  }, [filteredOptions]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0) {
      if (highlightedIndex < filteredOptions.length) {
        optionRefs.current[highlightedIndex]?.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      } else if (highlightedIndex === filteredOptions.length && allowCustom && searchTerm.trim()) {
        customOptionRef.current?.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex, filteredOptions.length, allowCustom, searchTerm]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        setCustomMode(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelectItem = (item: any) => {
    if (!value.some((v) => v.id === item.id)) {
      onChange([...value, { ...item, selectedAt: new Date().toISOString() }]);
    }
    // Don't close dropdown after selection to allow multiple selections
    setSearchTerm("");
    setHighlightedIndex(-1);
    
    // Keep focus on search input
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 10);
  };

  const handleRemoveItem = (itemId: string) => {
    onChange(value.filter((v) => v.id !== itemId));
  };

  const handleAddCustom = () => {
    if (!customInput.trim()) return;

    const customItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: customInput.trim(),
      isCustom: true,
      selectedAt: new Date().toISOString(),
    };

    onChange([...value, customItem]);
    setCustomInput("");
    setCustomMode(false);
    setHighlightedIndex(-1);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = filteredOptions.length + (allowCustom && searchTerm.trim() ? 1 : 0);

    // Arrow Down: Navigate down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (totalItems > 0) {
        setHighlightedIndex(prev => {
          const next = prev < totalItems - 1 ? prev + 1 : 0;
          return next;
        });
      }
      return;
    }

    // Arrow Up: Navigate up
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (totalItems > 0) {
        setHighlightedIndex(prev => {
          const next = prev > 0 ? prev - 1 : totalItems - 1;
          return next;
        });
      }
      return;
    }

    // Enter: Select highlighted item
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (highlightedIndex >= 0) {
        if (highlightedIndex < filteredOptions.length) {
          // Select an option
          handleSelectItem(filteredOptions[highlightedIndex]);
        } else if (highlightedIndex === filteredOptions.length && allowCustom && searchTerm.trim()) {
          // Open custom mode
          setCustomMode(true);
          setCustomInput(searchTerm);
        }
      } else if (filteredOptions.length > 0) {
        // No highlight, select first option
        handleSelectItem(filteredOptions[0]);
      } else if (allowCustom && searchTerm.trim().length >= 2) {
        // No options, go to custom
        setCustomMode(true);
        setCustomInput(searchTerm);
      }
      return;
    }

    // Escape: Close dropdown
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    // Tab: Close dropdown
    if (e.key === 'Tab') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, item: any, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectItem(item);
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < filteredOptions.length + (allowCustom && searchTerm.trim() ? 1 : 0)) {
        setHighlightedIndex(nextIndex);
      }
    }
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        setHighlightedIndex(index - 1);
      } else {
        searchInputRef.current?.focus();
        setHighlightedIndex(-1);
      }
    }
    
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleToggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label className="text-sm font-medium mb-2 block">{label}</label>

      {/* Selected Items Tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 mb-2">
          {value.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm group hover:bg-blue-200 transition-all"
            >
              <span className="font-medium">{item.name}</span>
              {item.code && (
                <span className="text-xs bg-blue-200 px-1.5 py-0.5 rounded-full ml-1">
                  {item.code}
                </span>
              )}
              {item.isCustom && (
                <span className="text-xs bg-purple-200 px-1.5 py-0.5 rounded-full ml-1">
                  Custom
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="ml-1 p-0.5 rounded-full hover:bg-blue-300 transition-colors"
                disabled={disabled}
                aria-label={`Remove ${item.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {value.length > 1 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 hover:bg-gray-200 rounded-full transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Dropdown Trigger Button */}
      <div className="relative">
        <button
          type="button"
          onClick={handleToggleDropdown}
          className={`
            w-full px-4 py-2.5 text-left border rounded-lg flex items-center justify-between
            ${isOpen ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-300"}
            ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:border-gray-400"}
            transition-all
          `}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span
            className={value.length === 0 ? "text-gray-400" : "text-gray-700"}
          >
            {value.length === 0
              ? placeholder
              : `${value.length} item${value.length > 1 ? "s" : ""} selected`}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-96 flex flex-col"
            role="listbox"
            aria-label={`${label} options`}
          >
            {/* Search Input */}
            <div className="p-2 border-b flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Filter ${label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCustomMode(false);
                    setHighlightedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  aria-autocomplete="list"
                  aria-controls="multi-select-options"
                  aria-expanded={true}
                  aria-activedescendant={
                    highlightedIndex >= 0 
                      ? highlightedIndex < filteredOptions.length
                        ? `option-${filteredOptions[highlightedIndex]?.id}`
                        : `custom-option`
                      : undefined
                  }
                />
              </div>
            </div>

            {/* Options List */}
            <div 
              id="multi-select-options"
              className="overflow-y-auto flex-1"
              role="listbox"
              aria-multiselectable="true"
            >
              {isLoading || loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected = value.some((v) => v.id === option.id);
                  const isHighlighted = highlightedIndex === index;
                  
                  return (
                    <div
                      key={option.id}
                      id={`option-${option.id}`}
                      ref={el => { optionRefs.current[index] = el; }}
                      onClick={() => handleSelectItem(option)}
                      onKeyDown={(e) => handleOptionKeyDown(e, option, index)}
                      className={`
                        flex items-start gap-3 p-3 border-b last:border-b-0 cursor-pointer
                        ${isSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}
                        ${isHighlighted ? "bg-gray-100 ring-2 ring-blue-500" : ""}
                        transition-colors
                      `}
                      tabIndex={0}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.name}</span>
                          {option.code && (
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {option.code}
                            </span>
                          )}
                          {isSelected && (
                            <Check className="h-4 w-4 text-blue-500 ml-auto" />
                          )}
                        </div>
                        {option.category && (
                          <p className="text-xs text-gray-500 mt-1">
                            {option.category}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No results found
                </div>
              )}
            </div>

            {/* Custom Entry Option */}
            {allowCustom && searchTerm.trim() && !customMode && (
              <div 
                ref={customOptionRef}
                id="custom-option"
                onClick={() => {
                  setCustomMode(true);
                  setCustomInput(searchTerm);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCustomMode(true);
                    setCustomInput(searchTerm);
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    // Stay at this item or wrap to first
                    setHighlightedIndex(filteredOptions.length);
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (filteredOptions.length > 0) {
                      setHighlightedIndex(filteredOptions.length - 1);
                    } else {
                      searchInputRef.current?.focus();
                      setHighlightedIndex(-1);
                    }
                  }
                }}
                className={`
                  border-t p-2 flex-shrink-0 cursor-pointer
                  ${highlightedIndex === filteredOptions.length ? 'bg-gray-100 ring-2 ring-blue-500' : ''}
                `}
                tabIndex={0}
                role="option"
              >
                {/* <div className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                  <Plus className="h-4 w-4" />
                  Add "{searchTerm}" as custom
                </div> */}
              </div>
            )}

            {/* Custom Input Mode */}
           {/* {allowCustom && customMode && (
              <div className="border-t p-2 flex-shrink-0">
                <div className="space-y-2">
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg text-sm"
                    placeholder="Enter custom value..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustom();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setCustomMode(false);
                        setHighlightedIndex(-1);
                        setTimeout(() => {
                          searchInputRef.current?.focus();
                        }, 10);
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMode(false);
                        setHighlightedIndex(-1);
                        setTimeout(() => {
                          searchInputRef.current?.focus();
                        }, 10);
                      }}
                      className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustom}
                      disabled={!customInput.trim()}
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}*/}
          </div>
        )}
      </div>
    </div>
  );
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
    [],
  );
  const [detailLoading, setDetailLoading] = useState(false);
  // const [prescription, setPrescription] = useState("");
  const [selectedHistory, setSelectedHistory] =
    useState<PatientHistoryItem | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    {
      medicineName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      medicineId: "",
    },
  ]);

  const [additionalNotes, setAdditionalNotes] = useState("");
  const [showTreatmentPlan, setShowTreatmentPlan] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [treatmentPlanLoading, setTreatmentPlanLoading] = useState(false);
  const [patientTreatmentPlans, setPatientTreatmentPlans] = useState<
    TreatmentPlan[]
  >([]);
  const [treatmentPlansLoading, setTreatmentPlansLoading] = useState(false);
  const [selectedTreatmentPlan, setSelectedTreatmentPlan] =
    useState<TreatmentPlan | null>(null);
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
    plannedProcedures: [],
  });
  const [editingTreatmentPlan, setEditingTreatmentPlan] =
    useState<TreatmentPlan | null>(null);
  const [isTransitioningToEdit, setIsTransitioningToEdit] = useState(false);
  // const [showTreatmentPlan, setShowTreatmentPlan] = useState(false);
  const [softTissues, setSoftTissues] = useState<SoftTissueData[]>([]);
  const [tmjExaminations, setTMJExaminations] = useState<TMJData[]>([]);
  // In AppointmentsList component, add these states:
  const [dentalChartMode, setDentalChartMode] = useState<
    "chart-only" | "with-treatment-plan"
  >("chart-only");
  const [showTreatmentPlanForm, setShowTreatmentPlanForm] = useState(false);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlanData | null>(
    null,
  );
  const [selectedTeethForPlan, setSelectedTeethForPlan] = useState<number[]>(
    [],
  );
  const [viewDentalHistory, setViewDentalHistory] = useState(false);
  const [labResults, setLabResults] = useState<string[] | null>([]);
  const [labHistory, setLabHistory] = useState<LabOrder[]>([]);
  const [labDetails, setLabDetails] = useState<ResultFile | undefined>();
  const [ishandleResult, setHandleResult] = useState(false);
  // Add these state variables with your other useState declarations
  const [chiefComplaints, setChiefComplaints] = useState<ComplaintItem[]>([]);
  const [examinationFindings, setExaminationFindings] = useState<
    ExaminationFindingItem[]
  >([]);
  const [dentalHistoryItems, setDentalHistoryItems] = useState<
    DentalHistoryItem[]
  >([]);

  // Loading states for each dropdown
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [loadingExaminations, setLoadingExaminations] = useState(false);
  const [loadingDentalHistory, setLoadingDentalHistory] = useState(false);

  // console.log("ded", selectedHistory);

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
  useEffect(() => {
    // Preload dental chart when user views appointments
    // This ensures it's loaded before they click the button
    const timer = setTimeout(() => {
      preloadAllDentalSvgs();
    }, 2000); // Wait 2 seconds after page load

    return () => clearTimeout(timer);
  }, []);
  const [showLabOrderModal, setShowLabOrderModal] = useState(false);
  //  useEffect(()=>(
  // console.log("clnicId",selectedClinic?.clinicId)
  //  ),[])

  const fetchAppointments = async (
    page: number = 1,
    search: string = "",
    resetSearch: boolean = false,
    date: Date | null = selectedDate,
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
            "0",
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
        },
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
          result.message || "Failed to fetch appointment details",
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
      // console.log("helloo",appointmentData)
      // console.log("patientId type:", typeof appointmentData?.patientId);
      // console.log("patientId value:", appointmentData?.patientId);
      const historyResult = historyResponse.data;
      console.log("32323232", historyResult);
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
    setChiefComplaints([]);
    setExaminationFindings([]);
    setDentalHistoryItems([]);
    setLoadingComplaints(false);
    setLoadingExaminations(false);
    setLoadingDentalHistory(false);
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
  useEffect(() => {
    if (selectedClinic?.clinicId) {
      console.log("🏥 Clinic selected, pre-fetching dropdown options...");
      // Pre-fetch initial options for better UX
      fetchChiefComplaints("");
      fetchExaminationFindings("");
      fetchDentalHistory("");
    }
  }, [selectedClinic?.clinicId]);

  // ✅ Existing useEffect for departments
  useEffect(() => {
    console.log("🏥 Selected Clinic changed:", selectedClinic);
    if (selectedClinic) fetchDepartments();
  }, [selectedClinic]);
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
  const handleMedicineSelect = (index: number, medicine: any) => {
    const updated = [...prescriptions];
    if (medicine) {
      updated[index] = {
        ...updated[index],
        medicineName: medicine.name || medicine.medicineName,
        medicineId: medicine._id || medicine.medicineId,
        genericName: medicine.genericName,
        brandNames: medicine.brandNames,
        dosageForms: medicine.dosageForms,
        strengths: medicine.strengths,
        category: medicine.category,
      };
    }
    setPrescriptions(updated);
  };
  const handlePrescriptionChange = (
    index: number,
    field: string,
    value: string,
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
        medicineId: "",
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
            _id: index.toString(), // temporary ID
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

    setUploadFiles((prev) => [...prev, ...selectedFiles]);

    selectedFiles.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews((prev) => [
            ...prev,
            {
              name: file.name,
              type: "image",
              url: reader.result,
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreviews((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type.includes("pdf") ? "pdf" : "other",
            url: null,
          },
        ]);
      }
    });
  };
  const handleViewResult = (resultFile: ResultFile) => {
    console.log("🎯 handleViewResult called");
    console.log("📄 resultFile received:", resultFile);
    console.log("🔗 fileUrl:", resultFile?.fileUrl);
    console.log("📝 fileName:", resultFile?.fileName);

    if (resultFile && resultFile.fileUrl) {
      setLabDetails(resultFile);
      setHandleResult(true);
      console.log("✅ Modal state updated, viewer should open");
    } else {
      console.error("❌ No valid resultFile or fileUrl provided");
      alert("No valid scan file available");
    }
  };
  // Add this near your other useEffects in AppointmentsList
  useEffect(() => {
    if (ishandleResult && labDetails) {
      console.log("🔍 Modal state check:");
      console.log("  - ishandleResult:", ishandleResult);
      console.log("  - labDetails:", labDetails);
      console.log("  - fileUrl:", labDetails.fileUrl);
      console.log(
        "  - Full URL will be:",
        labDetails.fileUrl?.startsWith("http")
          ? labDetails.fileUrl
          : `${labBaseUrl}${labDetails.fileUrl}`,
      );
    }
  }, [ishandleResult, labDetails]);
  const handleRemoveFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Fixed helper function to generate ObjectId-like strings

  const handleSaveConsultation = async () => {
    // Validate required fields
    // if (!chiefComplaint.trim()) {
    //   alert("Please enter chief complaint");
    //   return;
    // }

    // if (!diagnosis.trim()) {
    //   alert("Please enter diagnosis");
    //   return;
    // }

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

      // Append basic fields
      // const cheifComplaints = chiefComplaints.map((c) => c.name);
      const diagnosisArray = diagnosis
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
    formData.append("chiefComplaints", JSON.stringify(chiefComplaints));
    formData.append("examinationFindings", JSON.stringify(examinationFindings));
    formData.append("dentalHistory", JSON.stringify(dentalHistoryItems));
      formData.append("diagnosis", JSON.stringify(diagnosisArray));

      // Filter out empty prescriptions
      const validPrescriptions = prescriptions.filter(
        (p) => p.medicineName.trim() && p.dosage.trim(),
      );

      // if (validPrescriptions.length === 0) {
      //   alert("Please add at least one valid prescription");
      //   return;
      // }

      formData.append("prescriptions", JSON.stringify(validPrescriptions));
      formData.append("notes", additionalNotes?.trim() || "");

      // Append existing files
      const existingFiles = filePreviews.map((fp) => ({
        name: fp.name,
        type: fp.type,
        url: fp.url || "",
      }));
      formData.append("files", JSON.stringify(existingFiles));

      // ✅ Transform soft tissue examinations for backend
      if (softTissues && softTissues.length > 0) {
        const transformedSoftTissues = softTissues
          .filter(
            (st: SoftTissueData) =>
              (st.onExamination && st.onExamination.length > 0) ||
              (st.diagnosis && st.diagnosis.length > 0) ||
              (st.treatment && st.treatment.length > 0),
          )
          .map((st: SoftTissueData) => ({
            id: st.id,
            name: st.name,
            onExamination: (st.onExamination || []).map((item: string) => ({
              value: item,
              isCustom: false, // You can add logic to detect custom entries
            })),
            diagnosis: (st.diagnosis || []).map((item: string) => ({
              value: item,
              isCustom: false,
            })),
            treatment: (st.treatment || []).map((item: string) => ({
              value: item,
              isCustom: false,
            })),
            notes: st.notes || "",
          }));

        if (transformedSoftTissues.length > 0) {
          formData.append(
            "softTissueExamination",
            JSON.stringify(transformedSoftTissues),
          );
          console.log(
            "✅ Soft tissue data added:",
            transformedSoftTissues.length,
            "tissues",
          );
        }
      }

      // ✅ Transform TMJ examinations for backend
      if (tmjExaminations && tmjExaminations.length > 0) {
        const transformedTMJExaminations = tmjExaminations
          .filter(
            (tmj: TMJData) =>
              (tmj.onExamination && tmj.onExamination.length > 0) ||
              (tmj.diagnosis && tmj.diagnosis.length > 0) ||
              (tmj.treatment && tmj.treatment.length > 0),
          )
          .map((tmj: TMJData) => ({
            id: tmj.id,
            name: tmj.name,
            onExamination: (tmj.onExamination || []).map((item: string) => ({
              value: item,
              isCustom: false,
            })),
            diagnosis: (tmj.diagnosis || []).map((item: string) => ({
              value: item,
              isCustom: false,
            })),
            treatment: (tmj.treatment || []).map((item: string) => ({
              value: item,
              isCustom: false,
            })),
            notes: tmj.notes || "",
          }));

        if (transformedTMJExaminations.length > 0) {
          formData.append(
            "tmjExamination",
            JSON.stringify(transformedTMJExaminations),
          );
          console.log(
            "✅ TMJ data added:",
            transformedTMJExaminations.length,
            "examinations",
          );
        }
      }

      // ✅ Transform performed teeth (NO status filter)
      if (dentalData.performedTeeth && dentalData.performedTeeth.length > 0) {
        const transformedPerformedTeeth = dentalData.performedTeeth
          .filter(
            (tc) =>
              tc.conditions.length > 0 ||
              tc.surfaceConditions?.length > 0 ||
              tc.procedures?.length > 0,
          )
          .map((tc) => ({
            toothNumber: tc.toothNumber,
            conditions: tc.conditions || [],
            surfaceConditions: (tc.surfaceConditions || []).map((sc: any) => ({
              surface: sc.surface,
              conditions: sc.conditions || [],
            })),
            procedures: (tc.procedures || []).map((p: any) => ({
              name: p.name,
              surface: p.surface || "occlusal",
              cost: p.cost || p.estimatedCost || 0,
              notes: p.notes || "",
              performedAt: p.performedAt || new Date().toISOString(),
            })),
          }));

        if (transformedPerformedTeeth.length > 0) {
          formData.append(
            "performedTeeth",
            JSON.stringify(transformedPerformedTeeth),
          );
          console.log(
            "✅ Performed teeth data added:",
            transformedPerformedTeeth.length,
            "teeth",
          );
        }
      }

      // ✅ Transform planned procedures for treatment plan
      if (
        dentalData.plannedProcedures &&
        dentalData.plannedProcedures.length > 0
      ) {
        formData.append(
          "plannedProcedures",
          JSON.stringify(dentalData.plannedProcedures),
        );
        console.log(
          "✅ Planned procedures added:",
          dentalData.plannedProcedures.length,
        );
      }

      // ✅ TREATMENT PLAN HANDLING
      let treatmentPlanInput = null;
      let treatmentPlanStatusUpdate = null;
      
if (dentalData.treatmentPlan) {
  console.log("📋 Processing treatment plan data");

  // Check if we're editing an existing plan
  if (
    editingTreatmentPlan &&
    !editingTreatmentPlan._id.startsWith("temp-")
  ) {
    console.log(
      "🔄 Updating existing treatment plan:",
      editingTreatmentPlan._id,
    );

    // Track completed procedures
    const completedProcedures: any[] = [];

    dentalData.treatmentPlan.teeth.forEach((toothPlan: any) => {
      toothPlan.procedures.forEach((proc: any) => {
        if (proc.status === "completed" && proc.stage === 1) {
          completedProcedures.push({
            toothNumber: toothPlan.toothNumber,
            procedureName: proc.name,
            surface: proc.surface || "occlusal",
            stageNumber: 1,
            estimatedCost: proc.estimatedCost || 0,
            notes: proc.notes || "",
          });
        }
      });
    });

    // Check if Stage 1 is fully completed
    const stage1Procedures = dentalData.treatmentPlan.teeth.flatMap(
      (t: any) => t.procedures.filter((p: any) => p.stage === 1),
    );
    const allStage1Completed =
      stage1Procedures.length > 0 &&
      stage1Procedures.every((p: any) => p.status === "completed");

    treatmentPlanStatusUpdate = {
      planId: editingTreatmentPlan._id,
      completedStageNumber: allStage1Completed ? 1 : null,
      completedProcedures: completedProcedures,
    };

    formData.append(
      "treatmentPlanStatus",
      JSON.stringify(treatmentPlanStatusUpdate),
    );
  } else {
    // Creating new treatment plan with clinical findings
    console.log("🆕 Creating new treatment plan");

    // Build treatment plan input with clinical findings
    treatmentPlanInput = {
      planName: dentalData.treatmentPlan.planName.trim(),
      description: dentalData.treatmentPlan.description?.trim() || "",
      teeth: dentalData.treatmentPlan.teeth.map((toothPlan: any) => ({
        toothNumber: toothPlan.toothNumber,
        priority: toothPlan.priority || "medium",
        // Include clinical findings
        onExamination: toothPlan.onExamination || [],
        diagnosis: toothPlan.diagnosis || [],
        treatment: toothPlan.treatment || [],
        notes: toothPlan.notes || "",
        procedures: toothPlan.procedures.map((proc: any) => ({
          name: proc.name,
          surface: proc.surface || "occlusal",
          stage: proc.stage || 1,
          estimatedCost: proc.estimatedCost || 0,
          notes: proc.notes || "",
          status: proc.status || "planned",
        })),
      })),
      stages: dentalData.treatmentPlan.stages,
      startToday: dentalData.treatmentPlan.startToday || false,
    };

    formData.append("treatmentPlan", JSON.stringify(treatmentPlanInput));
  }
}

      // Append referral if exists
      if (referralDoctorId && referralReason.trim()) {
        formData.append(
          "referral",
          JSON.stringify({
            referredToDoctorId: referralDoctorId,
            referralReason: referralReason.trim(),
          }),
        );
      }

      // Append recall if exists
      if (recallDate && recallTime) {
        formData.append(
          "recall",
          JSON.stringify({
            appointmentDate: recallDate.toISOString().split("T")[0],
            appointmentTime: recallTime,
            department: recallDepartment || appointmentDetail.department,
          }),
        );
      }

      // Append uploaded files
      uploadFiles.forEach((file) => {
        formData.append("files", file);
      });

      console.log("=== FORM DATA SUMMARY ===");
      console.log(
        "Soft tissues:",
        softTissues.filter(
          (st) =>
            st.onExamination.length > 0 ||
            st.diagnosis.length > 0 ||
            st.treatment.length > 0,
        ).length,
      );
      console.log(
        "TMJ examinations:",
        tmjExaminations.filter(
          (tmj) =>
            tmj.onExamination.length > 0 ||
            tmj.diagnosis.length > 0 ||
            tmj.treatment.length > 0,
        ).length,
      );
      console.log("Has treatment plan:", !!dentalData.treatmentPlan);
      console.log(
        "Has performed teeth:",
        dentalData.performedTeeth?.length || 0,
      );
      console.log("Has files:", uploadFiles.length);

      // Using axios with FormData
      const response = await axios.post(
        `${patientServiceBaseUrl}/api/v1/patient-service/consultation/consult-patient/${appointmentDetail._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const data = response.data;

      if (data?.success) {
        console.log("✅ Consultation saved successfully!");
        console.log("Response data:", data);

        // Refresh patient treatment plans
        await fetchPatientTreatmentPlans();

        // Clear editing state
        setEditingTreatmentPlan(null);

        // Reset form
        setChiefComplaint("");
        setDiagnosis("");
        setPrescriptions([
          {
            medicineName: "",
            dosage: "",
            frequency: "",
            duration: "",
            instructions: "",
          },
        ]);
        setAdditionalNotes("");
        setUploadFiles([]);
        setFilePreviews([]);
        setReferralDoctorId("");
        setReferralReason("");
        setRecallDate(null);
        setRecallTime("");
        setRecallDepartment("");
        setDentalData({
          performedTeeth: [],
          plannedProcedures: [],
          treatmentPlan: null,
        });

        // Reset soft tissues and TMJ examinations
        setSoftTissues(
          SOFT_TISSUE_DATA.map((tissue) => ({
            ...tissue,
            onExamination: [],
            diagnosis: [],
            treatment: [],
          })),
        );
        setTMJExaminations(
          TMJ_DATA.map((tmj) => ({
            ...tmj,
            onExamination: [],
            diagnosis: [],
            treatment: [],
          })),
        );

        // Close dental chart if open
        setShowDentalChart(false);

        alert("✅ Consultation saved successfully!");

        // Optionally close the consultation view
        handleBackToAppointments();
      } else {
        alert(data?.message || "Failed to save consultation");
      }
    } catch (err: any) {
      console.error("❌ Error saving consultation:", err);
      console.error("Error response:", err.response?.data);

      if (err.response?.data?.errors) {
        const errorMessages = Object.entries(err.response.data.errors)
          .map(([field, message]) => `${field}: ${message}`)
          .join("\n");
        alert(`Validation errors:\n${errorMessages}`);
      } else {
        alert(err.response?.data?.message || "Error saving consultation");
      }
    } finally {
      setLoading(false);
    }
  };
  // ==================== Fetch Chief Complaints ====================
  const fetchChiefComplaints = useCallback(
    async (search: string = "") => {
      if (!selectedClinic?.clinicId) {
        console.warn("⚠ No clinic ID available for fetching complaints");
        return [];
      }

      setLoadingComplaints(true);
      try {
        const token = localStorage.getItem("authToken");
        const params = new URLSearchParams({
          clinicId: selectedClinic.clinicId,
          ...(search && { search }),
          limit: "50",
          type: "complaint",
        });

        const response = await axios.get(
          `${clinicServiceBaseUrl}/api/v1/patient_treatment/details/treatment-procedures?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        console.log("Hitler", response.data);
        const data = response.data;

        // Transform the data based on your API response structure
        const transformedComplaints = (data.data || data.results || []).map(
          (item: any) => ({
            id:
              item._id || item.id || `complaint_${Date.now()}_${Math.random()}`,
            name: item.procedureName || item.name || item.title,
            code: item.procedureCode || item.code,
            category: item.category,
            description: item.description,
            isCustom: false,
          }),
        );

        return transformedComplaints;
      } catch (err) {
        console.error("❌ Error fetching chief complaints:", err);
        return [];
      } finally {
        setLoadingComplaints(false);
      }
    },
    [selectedClinic?.clinicId],
  );

  // ==================== Fetch Examination Findings ====================
  const fetchExaminationFindings = useCallback(
    async (search: string = "") => {
      if (!selectedClinic?.clinicId) {
        console.warn(
          "⚠ No clinic ID available for fetching examination findings",
        );
        return [];
      }

      setLoadingExaminations(true);
      try {
        const token = localStorage.getItem("authToken");
        const params = new URLSearchParams({
          clinicId: selectedClinic.clinicId,
          ...(search && { search }),
          limit: "50",
        });

        const response = await axios.get(
          `${clinicServiceBaseUrl}/api/v1/patient_treatment/details/examination-findings?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = response.data;

        const transformedFindings = (data.data || data.results || []).map(
          (item: any) => ({
            id: item._id || item.id || `finding_${Date.now()}_${Math.random()}`,
            name: item.findingName || item.name || item.title,
            code: item.findingCode || item.code,
            category: item.category,
            isCustom: false,
          }),
        );

        return transformedFindings;
      } catch (err) {
        console.error("❌ Error fetching examination findings:", err);
        return [];
      } finally {
        setLoadingExaminations(false);
      }
    },
    [selectedClinic?.clinicId],
  );

  // ==================== Fetch Dental History ====================
  const fetchDentalHistory = useCallback(
    async (search: string = "") => {
      if (!selectedClinic?.clinicId) {
        console.warn("⚠ No clinic ID available for fetching dental history");
        return [];
      }

      setLoadingDentalHistory(true);
      try {
        const token = localStorage.getItem("authToken");
        const params = new URLSearchParams({
          clinicId: selectedClinic.clinicId,
          ...(search && { search }),
          limit: "50",
        });

        const response = await axios.get(
          `${clinicServiceBaseUrl}/api/v1/patient_treatment/details/dental-history?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = response.data;

        const transformedHistory = (data.data || data.results || []).map(
          (item: any) => ({
            id: item._id || item.id || `history_${Date.now()}_${Math.random()}`,
            name: item.historyName || item.name || item.title,
            code: item.historyCode || item.code,
            category: item.category,
            isCustom: false,
          }),
        );

        return transformedHistory;
      } catch (err) {
        console.error("❌ Error fetching dental history:", err);
        return [];
      } finally {
        setLoadingDentalHistory(false);
      }
    },
    [selectedClinic?.clinicId],
  );

  const handleEditTreatmentPlan = (plan: TreatmentPlan) => {
    console.log("✏️ Editing treatment plan:", plan.planName);

    setIsTransitioningToEdit(true);

    const dentalChartPlan = convertToDentalChartFormat(plan);

    setSelectedTreatmentPlan(null);
    setEditingTreatmentPlan(plan);
    setShowDentalChart(true);

    setDentalData((prev) => ({
      ...prev,
      treatmentPlan: dentalChartPlan,
    }));

    setTimeout(() => {
      setIsTransitioningToEdit(false);
    }, 1000);
  };

  {
    isTransitioningToEdit && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div>
              <p className="font-medium">Opening treatment plan editor...</p>
              <p className="text-sm text-gray-500">Please wait</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
const convertToDentalChartFormat = (
  treatmentPlan: TreatmentPlan,
): TreatmentPlanData | null => {
  if (!treatmentPlan) return null;

  console.log(
    "🔄 Converting treatment plan to dental chart format:",
    treatmentPlan,
  );

  const teeth = treatmentPlan.teeth.map((tooth) => ({
    toothNumber: tooth.toothNumber,
    priority:
      (tooth.priority as "urgent" | "high" | "medium" | "low") || "medium",
    // Include clinical findings from backend
    onExamination: (tooth as any).onExamination || [],
    diagnosis: (tooth as any).diagnosis || [],
    treatment: (tooth as any).treatment || [],
    notes: (tooth as any).notes || "",
    procedures: tooth.procedures.map((proc) => ({
      name: proc.name,
      surface: proc.surface || "occlusal",
      stage: proc.stage || 1,
      estimatedCost: proc.estimatedCost || 0,
      notes: proc.notes || "",
      status:
        (proc.status as "planned" | "in-progress" | "completed") || "planned",
    })),
  }));

  const stages = treatmentPlan.stages.map((stage) => {
    const procedureRefs: { toothNumber: number; procedureName: string }[] = [];

    if (
      stage.toothSurfaceProcedures &&
      stage.toothSurfaceProcedures.length > 0
    ) {
      stage.toothSurfaceProcedures.forEach((tsp) => {
        tsp.surfaceProcedures.forEach((sp) => {
          sp.procedureNames.forEach((procName) => {
            procedureRefs.push({
              toothNumber: tsp.toothNumber,
              procedureName: procName,
            });
          });
        });
      });
    } else {
      const stageNum = stage.stageNumber;
      teeth.forEach((tooth) => {
        tooth.procedures.forEach((proc) => {
          if (proc.stage === stageNum) {
            procedureRefs.push({
              toothNumber: tooth.toothNumber,
              procedureName: proc.name,
            });
          }
        });
      });
    }

    return {
      stageName: stage.stageName || `Stage ${stage.stageNumber}`,
      stageNumber: stage.stageNumber,
      description: stage.description || "",
      procedureRefs: procedureRefs,
      toothSurfaceProcedures: stage.toothSurfaceProcedures,
      status: stage.status as "pending" | "completed" | "in-progress",
      scheduledDate:
        stage.scheduledDate || new Date().toISOString().split("T")[0],
      notes: stage.notes || "",
    };
  });

  const formattedPlan: TreatmentPlanData = {
    planName: treatmentPlan.planName,
    description: treatmentPlan.description || "",
    teeth: teeth,
    stages: stages,
  };

  return formattedPlan;
};

  // const formatDate = (dateString: string) => {
  //   if (!dateString) return "N/A";
  //   return new Date(dateString).toLocaleDateString('en-IN', {
  //     day: 'numeric',
  //     month: 'short',
  //     year: 'numeric'
  //   });
  // };
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
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
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
        },
      );

      setPatientTreatmentPlans(response.data.data || []);
    } catch (err) {
      console.error("Error fetching treatment plans", err);
    } finally {
      setTreatmentPlansLoading(false);
    }
  };
  const closeModal = () => {
    setHandleResult(false);
  };
  useEffect(() => {
    if (appointmentDetail?.patientId?._id) {
      fetchPatientTreatmentPlans();
      getPatientId();
    }
  }, [appointmentDetail]);
  useEffect(() => {
    getLabData();
  }, [labResults]);
  const getDoctorId = (): string | undefined => {
    // Priority 1: DoctorId from current appointment
    if (appointmentDetail?.doctorId) {
      return appointmentDetail.doctorId;
    }

    // Priority 2: DoctorId from localStorage (logged-in doctor)
    const storedDoctorId = localStorage.getItem("doctorId");
    if (storedDoctorId) {
      return storedDoctorId;
    }

    // Priority 3: Check if doctor info is in auth token
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.doctorId) {
          return payload.doctorId;
        }
      }
    } catch (e) {
      console.error("Error parsing token:", e);
    }

    return undefined;
  };
  const getPatientId = async () => {
    try {
      setDetailLoading(true);

      const res = await axios.get(
        `${patientServiceBaseUrl}/api/v1/patient-service/patient/details/${appointmentDetail?.patientId?._id}`,
      );
      // console.log(res.data?.data?.labHistory || []);
      setLabResults(res.data?.data?.labHistory || []);
    } catch (error) {
      console.log(error);
    } finally {
      setDetailLoading(false);
    }
  };

  // const getLabDetails = () => {
  //   try {
  //     if (labResults?.length === 0) {
  //       return;
  //     }
  //     const res = labResults?.map(async (item) => {
  //       return await axios.get(
  //         `${labBaseUrl}api/v1/lab-orders/dental-orders/${item}`,
  //       );
  //     });
  //     console.log("lab results", res);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const getLabData = async () => {
    try {
      if (labResults?.length === 0) {
        console.log("No lab history found");
        return;
      }

      const urls = labResults?.map(
        (id) => `${labBaseUrl}/api/v1/lab-orders/dental-orders/${id}`,
      );

      if (!urls) {
        console.log("URLs could not be generated");
        return;
      }

      const responses = await Promise.all(urls.map((url) => axios.get(url)));

      const labData = responses.map((res) => res.data);
      console.log("lab", labData);

      setLabHistory(labData);
      console.log("Lab Data:", labData);

      return labData;
    } catch (error) {
      console.error("Error fetching lab data", error);
    }
  };
  // just above the JSX where you render the overlay, still inside the component:
  const viewerFileUrl =
    labDetails?.fileUrl && labDetails.fileUrl.startsWith("http")
      ? labDetails.fileUrl
      : labDetails?.fileUrl
        ? `${labBaseUrl}${labDetails.fileUrl}`
        : undefined;
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
                    "",
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(filePath, "_blank")}
                      >
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
      <>
        {/* Treatment Plan Form Modal - Drawer Style - NOW AT TOP LEVEL OF THIS VIEW */}
        {showTreatmentPlanForm && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowTreatmentPlanForm(false)}
            />

            {/* Drawer */}
            <div className="relative z-10 w-full max-w-2xl h-full bg-white shadow-2xl overflow-y-auto animate-slide-in-right">
              <div className="p-6">
                <TreatmentPlanForm
                  patientId={appointmentDetail?.patientId?._id || ""}
                  patientName={appointmentDetail?.patientId?.name || ""}
                  existingConditions={dentalData.performedTeeth || []}
                   clinicId={selectedClinic?.clinicId || appointmentDetail?.clinicId || ""} 
                  onClose={() => setShowTreatmentPlanForm(false)}
                  onSave={(plan) => {
                    console.log("Saving treatment plan:", plan);
                    setDentalData((prev) => ({
                      ...prev,
                      treatmentPlan: plan,
                    }));
                    alert("Treatment plan created successfully!");
                    setShowTreatmentPlanForm(false);
                  }}
                  initialData={treatmentPlan}
                />
              </div>
            </div>
          </div>
        )}

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
              <Button
                //      variant="outline"
                // className="gap-2"
                onClick={() => setViewDentalHistory(!viewDentalHistory)}
              >
                Dental History
              </Button>
            </div>
          </div>
          {viewDentalHistory && (
            <div className="fixed inset-0 z-[100] bg-white">
              {/* Dental History Header - Similar styling */}
              <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewDentalHistory(false)}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Consultation
                  </Button>
                  <div className="flex-1">
                    <h1 className="text-2xl font-semibold">Dental History</h1>
                    <p className="text-sm text-muted-foreground">
                      Patient: {appointmentDetail.patientId.name} • ID:{" "}
                      {appointmentDetail.patientId.patientUniqueId}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewDentalHistory(false)}
                >
                  Close
                </Button>
              </div>

              {/* Full-screen Dental History Container with loader */}
              <div className="h-[calc(100vh-60px)] w-full">
                <DentalChartView
                  patientId={appointmentDetail.patientId._id}
                  onClose={() => setViewDentalHistory(false)}
                />
              </div>
            </div>
          )}

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
                      Patient: {appointmentDetail.patientId.name} • ID:{" "}
                      {appointmentDetail.patientId.patientUniqueId}
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
              <div className="h-[calc(100vh-60px)] w-full">
                <DentalChart
                  patientId={appointmentDetail.patientId._id}
                  visitId={appointmentDetail._id}
                  mode="edit"
                  patientName={appointmentDetail.patientId.name}
                  clinicId={appointmentDetail.clinicId}
                  patientUniqueId={appointmentDetail.patientId.patientUniqueId}
                  onClose={() => {
                    setShowDentalChart(false);
                  }}
                  onSave={(dentalDataFromChart) => {
                    console.log(
                      "DentalChart onSave called with:",
                      dentalDataFromChart,
                    );

                    // Update the state
                    setDentalData({
                      performedTeeth: dentalDataFromChart.performedTeeth || [],
                      plannedProcedures:
                        dentalDataFromChart.plannedProcedures || [],
                      treatmentPlan: dentalDataFromChart.treatmentPlan || null,
                    });

                    // Also update soft tissues and TMJ from the chart
                    if (dentalDataFromChart.softTissues) {
                      setSoftTissues(dentalDataFromChart.softTissues);
                    }

                    if (dentalDataFromChart.tmjExaminations) {
                      setTMJExaminations(dentalDataFromChart.tmjExaminations);
                    }

                    console.log("Updated dental data:", {
                      performedTeeth:
                        dentalDataFromChart.performedTeeth?.length || 0,
                      plannedProcedures:
                        dentalDataFromChart.plannedProcedures?.length || 0,
                      hasTreatmentPlan: !!dentalDataFromChart.treatmentPlan,
                      softTissues: dentalDataFromChart.softTissues?.length || 0,
                      tmjExaminations:
                        dentalDataFromChart.tmjExaminations?.length || 0,
                    });

                    // Clear editing state if we were editing
                    if (editingTreatmentPlan) {
                      setEditingTreatmentPlan(null);
                    }

                    setShowDentalChart(false);
                  }}
                  onProcedureAdded={(toothNumber, procedure) => {
                    console.log(
                      `Procedure ${procedure.name} added to tooth ${toothNumber}`,
                    );
                  }}
                  existingTreatmentPlan={
                    editingTreatmentPlan
                      ? convertToDentalChartFormat(editingTreatmentPlan)
                      : null
                  }
                  existingConditions={dentalData.performedTeeth}
                  // dentalChartMode={dentalChartMode} // Pass the mode
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
                        <span>
                          {formatDate(appointmentDetail.appointmentDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>
                          {formatTime(appointmentDetail.appointmentTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-normal">
                          {appointmentDetail.department}
                        </Badge>
                      </div>
                      {/* <div className="mt-2">
                      <Badge className={getStatusColor(appointmentDetail.status)}>
                        {getStatusLabel(appointmentDetail.status)}
                      </Badge>
                    </div> */}
                    </div>
                  </div>

                  {/* ✅ Patient Treatment Plans */}

                  <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 mt-4">
                    <h4 className="font-semibold mb-3 text-primary">
                      Patient Treatment Plans
                    </h4>

                    {treatmentPlansLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Loading treatment plans...
                      </p>
                    ) : patientTreatmentPlans.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No treatment plans found
                      </p>
                    ) : (
                      <ScrollArea className="h-[250px] pr-2">
                        <div className="space-y-2">
                          {patientTreatmentPlans.map((plan) => (
                            <div
                              key={plan._id}
                              className="flex items-center justify-between p-3 border border-primary/20 rounded-lg bg-white/60 hover:bg-white transition-all cursor-pointer"
                              onClick={() => {
                                console.log(
                                  "📋 Treatment Plan Clicked:",
                                  plan.planName,
                                );
                                console.log("🆔 Plan ID:", plan._id);
                                console.log("📊 Status:", plan.status);

                                // Specifically log stages data
                                console.log("📈 STAGES DATA:");
                                if (plan.stages && plan.stages.length > 0) {
                                  plan.stages.forEach((stage, index) => {
                                    console.log(`  Stage ${index + 1}:`);
                                    console.log(`    ID: ${stage._id}`);
                                    console.log(`    Name: ${stage.stageName}`);
                                    console.log(
                                      `    Number: ${stage.stageNumber}`,
                                    );
                                    console.log(`    Status: ${stage.status}`);
                                    console.log(
                                      `    Scheduled: ${stage.scheduledDate}`,
                                    );

                                    // Log toothSurfaceProcedures
                                    if (
                                      stage.toothSurfaceProcedures &&
                                      stage.toothSurfaceProcedures.length > 0
                                    ) {
                                      console.log(
                                        `    Tooth-Surface Procedures: ${stage.toothSurfaceProcedures.length}`,
                                      );
                                      stage.toothSurfaceProcedures.forEach(
                                        (tsp, tspIndex) => {
                                          console.log(
                                            `      Tooth #${tsp.toothNumber}:`,
                                          );
                                          tsp.surfaceProcedures.forEach(
                                            (sp, spIndex) => {
                                              console.log(
                                                `        Surface: ${sp.surface}`,
                                              );
                                              console.log(
                                                `        Procedures: ${sp.procedureNames.join(", ")}`,
                                              );
                                            },
                                          );
                                        },
                                      );
                                    } else {
                                      console.log(
                                        `    Tooth-Surface Procedures: None`,
                                      );
                                    }
                                  });
                                } else {
                                  console.log("  No stages found in this plan");
                                }

                                // Also show complete stages array
                                console.log(
                                  "📋 Complete Stages Array:",
                                  plan.stages,
                                );

                                // Show JSON stringified version for full structure
                                console.log(
                                  "📋 Stages JSON:",
                                  JSON.stringify(plan.stages, null, 2),
                                );

                                setSelectedTreatmentPlan(plan);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <CalendarIcon className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-700">
                                  {formatDate(plan.startedAt || plan.createdAt)}
                                </span>
                                <span className="text-sm text-gray-600 truncate max-w-[120px]">
                                  {plan.planName}
                                </span>
                                {/* Show stages count badge */}
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-blue-50 text-blue-700"
                                >
                                  {plan.stages?.length || 0} stages
                                </Badge>
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
                      refetchTreatmentPlans={fetchPatientTreatmentPlans}
                      viewOnly={selectedTreatmentPlan._id.startsWith("temp-")}
                      onEditPlan={handleEditTreatmentPlan}
                    />
                  )}
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
                          {patientHistory.map((item) => {
                            const hasTreatmentPlan = !!item.treatmentPlan;

                            return (
                              <div
                                key={item._id}
                                className="bg-white/50 rounded-lg p-3 border border-primary/10 hover:bg-white/80 transition-colors"
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-xs font-medium text-primary">
                                    {formatDate(
                                      item.visitDate ||
                                        item.appointmentDate ||
                                        "",
                                    )}
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
                  <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                    <h4 className="font-semibold mb-3 text-primary">
                      Previous Prescriptions
                    </h4>
                    {detailLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Loading Orders...
                      </p>
                    ) : labHistory?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No previous visits
                      </p>
                    ) : (
                      <ScrollArea className="h-[300px] pr-2">
                        <div className="space-y-3">
                          {labHistory?.map((labItem, index) => {
                            // ✅ Extract the actual order data
                            const order = labItem.order || labItem;

                            return (
                              <div
                                key={index}
                                className="bg-white/50 rounded-lg p-3 border border-primary/10 hover:bg-white/80 transition-colors"
                              >
                                <div className="flex justify-between items-center mb-1">
                                  {order.note}
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                  {formatDate(order.createdAt)}
                                </div>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full mt-2"
                                  onClick={() => {
                                    if (!order.niftiFile) return;

                                    const url = order.niftiFile.fileUrl;
                                    const name =
                                      order.niftiFile.fileName || "CBCT Scan";

                                    const viewerUrl = `/dashboard/cbct-viewer?fileUrl=${encodeURIComponent(
                                      url,
                                    )}&fileName=${encodeURIComponent(name)}`;

                                    window.open(
                                      viewerUrl,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                  }}
                                  disabled={!order.niftiFile}
                                >
                                  View 3D
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
                      {/* Chief Complaint - Multi-select Dropdown */}
                      <div className="space-y-4">
                        <MultiSelectDropdown
                          label="Chief Complaint"
                          value={chiefComplaints}
                          onChange={setChiefComplaints}
                          fetchOptions={fetchChiefComplaints}
                          placeholder="Search and select chief complaints..."
                          loading={loadingComplaints}
                          allowCustom={true}
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
                      {/* Examination Findings - Multi-select Dropdown */}
                      <div className="mt-6">
                        <MultiSelectDropdown
                          label="Examination Findings"
                          value={examinationFindings}
                          onChange={setExaminationFindings}
                          fetchOptions={fetchExaminationFindings}
                          placeholder="Search and select examination findings..."
                          loading={loadingExaminations}
                          allowCustom={true}
                        />
                      </div>

                      {/* Dental History - Multi-select Dropdown */}
                      <div className="mt-6">
                        <MultiSelectDropdown
                          label="Dental History"
                          value={dentalHistoryItems}
                          onChange={setDentalHistoryItems}
                          fetchOptions={fetchDentalHistory}
                          placeholder="Search and select dental history items..."
                          loading={loadingDentalHistory}
                          allowCustom={true}
                        />
                      </div>
                   

                      {/* Prescription */}
                      {/* Prescription Section with Auto-suggestion */}
                      <div id="prescriptions-section">
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

                              {/* Medicine Name with Auto-suggestion */}
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                  Medicine Name *
                                </label>
                                <MedicineInput
                                  value={prescription.medicineName}
                                  onChange={(value) =>
                                    handlePrescriptionChange(
                                      index,
                                      "medicineName",
                                      value,
                                    )
                                  }
                                  onMedicineSelect={(medicine) =>
                                    handleMedicineSelect(index, medicine)
                                  }
                                  placeholder="Search and select medicine..."
                                  doctorId={getDoctorId()}
                                  clinicId={selectedClinic?.clinicId}
                                  className="w-full"
                                  name={`prescriptions[${index}].medicineName`}
                                  id={`medicine-${index}`}
                                />
                              </div>

                              {/* Other prescription fields */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">
                                    Dosage *
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g., 500 mg"
                                    value={prescription.dosage}
                                    onChange={(e) =>
                                      handlePrescriptionChange(
                                        index,
                                        "dosage",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">
                                    Frequency *
                                  </label>
                                  <select
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={prescription.frequency}
                                    onChange={(e) =>
                                      handlePrescriptionChange(
                                        index,
                                        "frequency",
                                        e.target.value,
                                      )
                                    }
                                  >
                                    <option value="">Select frequency</option>
                                    <option value="Once daily">
                                      Once daily
                                    </option>
                                    <option value="Twice daily">
                                      Twice daily
                                    </option>
                                    <option value="Thrice daily">
                                      Thrice daily
                                    </option>
                                    <option value="Four times daily">
                                      Four times daily
                                    </option>
                                    <option value="Every 6 hours">
                                      Every 6 hours
                                    </option>
                                    <option value="Every 8 hours">
                                      Every 8 hours
                                    </option>
                                    <option value="Every 12 hours">
                                      Every 12 hours
                                    </option>
                                    <option value="As needed">As needed</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">
                                    Duration *
                                  </label>
                                  <input
                                    type="text"
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g., 5 days"
                                    value={prescription.duration}
                                    onChange={(e) =>
                                      handlePrescriptionChange(
                                        index,
                                        "duration",
                                        e.target.value,
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
                                  placeholder="e.g., Take after meals, with plenty of water"
                                  value={prescription.instructions || ""}
                                  onChange={(e) =>
                                    handlePrescriptionChange(
                                      index,
                                      "instructions",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          ))}

                          {/* Prescription Summary */}
                          {prescriptions.filter((p) => p.medicineName.trim())
                            .length > 0 && (
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <p className="text-sm font-medium text-blue-800">
                                Prescription Summary:{" "}
                                {
                                  prescriptions.filter((p) =>
                                    p.medicineName.trim(),
                                  ).length
                                }{" "}
                                medicine(s) added
                              </p>
                              {prescriptions
                                .filter((p) => p.medicineName.trim())
                                .map((p, idx) => (
                                  <p
                                    key={idx}
                                    className="text-xs text-blue-600 mt-1"
                                  >
                                    • {p.medicineName} - {p.dosage}{" "}
                                    {p.frequency} for {p.duration}
                                  </p>
                                ))}
                            </div>
                          )}

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={addPrescription}
                              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition flex items-center gap-1"
                            >
                              <Plus className="h-4 w-4" />
                              Add Another Medicine
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
                              <span className="text-sm text-gray-600">
                                Choose Files
                              </span>
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
                              {uploadFiles.length} file
                              {uploadFiles.length > 1 ? "s" : ""} selected
                            </span>
                          )}
                        </div>

                        {/* ✅ Dental Chart Section */}

                        <div className="mt-6">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setShowDentalChart(true);
                                setDentalChartMode("chart-only");
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Open Dental Chart
                            </Button>
                          </div>
                        </div>

                        {/* Direct Treatment Plan Button */}
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setTreatmentPlan(null);
                              setShowTreatmentPlanForm(true);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Create New Treatment Plan
                          </Button>
                        </div>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setShowLabOrderModal(true)}
                          >
                            {/* <Flask className="mr-2 h-4 w-4" /> */}
                            Create Lab Order
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

                                {preview.type === "image" && preview.url ? (
                                  <img
                                    src={preview.url}
                                    alt={preview.name}
                                    className="w-full h-24 object-cover rounded mb-2"
                                  />
                                ) : (
                                  <div className="w-full h-24 flex items-center justify-center bg-gray-200 rounded mb-2">
                                    {preview.type === "pdf" ? (
                                      <FileText className="h-5 w-5 text-red-500" />
                                    ) : (
                                      <File className="h-5 w-5 text-gray-500" />
                                    )}
                                  </div>
                                )}

                                <p
                                  className="text-xs text-gray-600 truncate"
                                  title={preview.name}
                                >
                                  {preview.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Treatment Plan Section */}
                      {dentalData.treatmentPlan && (
                        <div className="border-t border-gray-200 pt-6 mt-4">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-800">
                              Treatment Plan
                            </h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // View full details or edit
                                setTreatmentPlan(dentalData.treatmentPlan);
                                setShowTreatmentPlanForm(true);
                              }}
                            >
                              Edit Plan
                            </Button>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="font-medium text-gray-700">
                              {dentalData.treatmentPlan.planName}
                            </div>
                            {dentalData.treatmentPlan.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {dentalData.treatmentPlan.description}
                              </p>
                            )}
                            <div className="grid grid-cols-3 gap-4 mt-3">
                              <div className="bg-white p-2 rounded text-center">
                                <div className="text-xs text-gray-500">
                                  Teeth
                                </div>
                                <div className="font-bold">
                                  {dentalData.treatmentPlan.teeth.length}
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded text-center">
                                <div className="text-xs text-gray-500">
                                  Procedures
                                </div>
                                <div className="font-bold">
                                  {dentalData.treatmentPlan.teeth.reduce(
                                    (sum: number, t: any) =>
                                      sum + t.procedures.length,
                                    0,
                                  )}
                                </div>
                              </div>
                              <div className="bg-white p-2 rounded text-center">
                                <div className="text-xs text-gray-500">
                                  Stages
                                </div>
                                <div className="font-bold">
                                  {dentalData.treatmentPlan.stages.length}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Treatment Plan Form Modal - Standalone */}
                      {/* {showTreatmentPlanForm && (
    <TreatmentPlanForm
      patientId={appointmentDetail?.patientId?._id || ""}
      existingConditions={dentalData.performedTeeth || []}
      onClose={() => setShowTreatmentPlanForm(false)}
      onSave={(plan) => {
        console.log("Saving treatment plan:", plan);
        setDentalData(prev => ({
          ...prev,
          treatmentPlan: plan
        }));
        alert("Treatment plan created successfully!");
        setShowTreatmentPlanForm(false);
      }}
      initialData={treatmentPlan}
    />
  )} */}

                      {/* Treatment Plan Details Modal */}
                      {/* {selectedTreatmentPlan && (
    <TreatmentPlanDetailsModal
      plan={selectedTreatmentPlan}
      onClose={() => setSelectedTreatmentPlan(null)}
      refetchTreatmentPlans={fetchPatientTreatmentPlans}
    />
  )} */}

                      {/* Treatment Plan Details Modal */}
                      {selectedTreatmentPlan && (
                        <TreatmentPlanDetailsModal
                          plan={selectedTreatmentPlan}
                          onClose={() => setSelectedTreatmentPlan(null)}
                          refetchTreatmentPlans={fetchPatientTreatmentPlans}
                          viewOnly={selectedTreatmentPlan._id.startsWith(
                            "temp-",
                          )}
                          onEditPlan={handleEditTreatmentPlan}
                        />
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
                              onChange={(e) =>
                                setReferralReason(e.target.value)
                              }
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
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={recallDate || undefined}
                                      onSelect={(date) =>
                                        setRecallDate(date || null)
                                      }
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
                                    onChange={(e) =>
                                      setRecallTime(e.target.value)
                                    }
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
                                  📅 {format(recallDate, "EEEE, MMMM dd, yyyy")}{" "}
                                  at {recallTime}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Department:{" "}
                                  {recallDepartment ||
                                    appointmentDetail?.department ||
                                    "Current"}
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
          <DentalLabOrderModal
            isOpen={showLabOrderModal}
            onClose={() => setShowLabOrderModal(false)}
            appointmentId={appointmentDetail?._id}
            patientId={appointmentDetail?.patientId?._id}
            clinicId={selectedClinic?.clinicId}
            doctorId={getDoctorId()}
            onSuccess={() => {
              alert("Lab order created successfully!");
            }}
          />
        </div>
        {ishandleResult && labDetails && viewerFileUrl && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "#0f172a",
              zIndex: 10000,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <button onClick={closeModal} /* ...close styles... */>
              ✕ Close
            </button>

            <div
              style={{
                flex: 1,
                padding: "16px",
                paddingTop: "60px",
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <ThreeDCBCTViewer
                fileUrl={labDetails?.fileUrl}
                fileName={labDetails?.fileName || "CBCT Scan"}
                onError={(msg) => {
                  console.error("Viewer error:", msg);
                  alert("This 3D scan is too large to render on this device.");
                }}
              />
            </div>
          </div>
        )}
      </>
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
                          : "",
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
                            getStatusColor(appointment.status),
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
        </div>
      </div>
    );
  }

  // Clinic Cards List View
  return (
    <>
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
    </>
  );
}
