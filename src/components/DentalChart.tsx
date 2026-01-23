// DentalChart.tsx - COMPLETE CODE WITH SOFT TISSUE AND TMJ SUPPORT
import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  X,
  Plus,
  CheckSquare,
  Square,
  ArrowRight,
  Trash2,
  AlertCircle,
  Stethoscope,
  Bone,
  Grid,
  ChevronDown,
  Menu,
  ChevronUp,
  Check
} from "lucide-react";
import { Badge } from "./ui/badge";

// Import Tooth SVG components
import IncisorSVG from "../assets/svg/dental/incisor.svg?react";
import CanineSVG from "../assets/svg/dental/canine.svg?react";
import PremolarSVG from "../assets/svg/dental/premolar.svg?react";
import MolarSVG from "../assets/svg/dental/molar.svg?react";
import WisdomSVG from "../assets/svg/dental/wisdom.svg?react";

// Import Soft Tissue SVG components
import TongueSVG from "../assets/svg/softTissue/Tongue.svg?react";
import GingivaSVG from "../assets/svg/softTissue/Gingiva.svg?react";
import PalateSVG from "../assets/svg/softTissue/Palate.svg?react";
import BuccalMucosaSVG from "../assets/svg/softTissue/BuccalMucosa.svg?react";
import FloorOfMouthSVG from "../assets/svg/softTissue/FloorOfTheMouth.svg?react";
import LabialMucosaSVG from "../assets/svg/softTissue/LabialMucosa.svg?react";
import SalivaryGlandsSVG from "../assets/svg/softTissue/SalivaryGlands.svg?react";
import FrenumSVG from "../assets/svg/softTissue/Frenum.svg?react";

// Import TMJ SVG components - FIXED PATHS
import TMJLeftSVG from "../assets/svg/tmj/LeftTMJ.svg?react";
import TMJRightSVG from "../assets/svg/tmj/RightTMJ.svg?react";
import TMJBothSVG from "../assets/svg/tmj/BothTMJ.svg?react";
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

interface SoftTissueExamination {
  id: string;
  name: string;
  svgName: string;
  position?: { x: number; y: number };
  onExamination: string[];
  diagnosis: string[];
  treatment: string[];
  notes?: string;
  date?: string;
}

interface TMJExamination {
  id: string;
  name: string;
  svgName: string;
  side: "left" | "right" | "both";
  position?: { x: number; y: number };
  onExamination: string[];
  diagnosis: string[];
  treatment: string[];
  notes?: string;
  date?: string;
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
    }[];
    priority?: "urgent" | "high" | "medium" | "low";
  }[];
  stages: TreatmentPlanStage[];
  startToday?: boolean;
}

interface DentalChartProps {
  patientId: string;
  visitId?: string;
  mode: "view" | "edit";
  patientName?: string;
  patientUniqueId?: string;
  onClose?: () => void;
  onSave?: (dentalData: {
    performedTeeth: any[];
    plannedProcedures: any[];
    treatmentPlan?: TreatmentPlanData | null;
    softTissues: SoftTissueExamination[];
    tmjExaminations: TMJExamination[];
  }) => void;
  onProcedureAdded?: (toothNumber: number, procedure: any) => void;
  existingConditions?: ToothCondition[];
  onToothSelected?: (
    tooth: ToothData,
    condition: ToothCondition | null,
  ) => void;
  existingTreatmentPlan?: TreatmentPlanData | null;
  existingSoftTissues?: SoftTissueExamination[];
  existingTMJExaminations?: TMJExamination[];
}

interface ToothData {
  number: number; // FDI number
  name: string;
  quadrant: number;
  svgName: string;
  position: { x: number; y: number };
  rotation?: number;
  isAdult: boolean;
}

// Adult teeth (Permanent dentition) using FDI numbering
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

// Soft Tissue Data
const SOFT_TISSUE_DATA: SoftTissueExamination[] = [
  {
    id: "tongue",
    name: "Tongue",
    svgName: "tongue",
    position: { x: 160, y: 140 },
    onExamination: [],
    diagnosis: [],
    treatment: [],
  },
  {
    id: "gingiva",
    name: "Gingiva",
    svgName: "gingiva",
    position: { x: 160, y: 100 },
    onExamination: [],
    diagnosis: [],
    treatment: [],
  },
  {
    id: "palate",
    name: "Palate",
    svgName: "palate",
    position: { x: 160, y: 80 },
    onExamination: [],
    diagnosis: [],
    treatment: [],
  },
  {
    id: "buccal-mucosa",
    name: "Buccal Mucosa",
    svgName: "buccal-mucosa",
    position: { x: 100, y: 120 },
    onExamination: [],
    diagnosis: [],
    treatment: [],
  },
  {
    id: "floor-of-mouth",
    name: "Floor of Mouth",
    svgName: "floor-of-mouth",
    position: { x: 160, y: 180 },
    onExamination: [],
    diagnosis: [],
    treatment: [],
  },
  {
    id: "labial-mucosa",
    name: "Labial Mucosa",
    svgName: "labial-mucosa",
    position: { x: 160, y: 60 },
    onExamination: [],
    diagnosis: [],
    treatment: [],
  },
  {
    id: "salivary-glands",
    name: "Salivary Glands",
    svgName: "salivary-glands",
    position: { x: 200, y: 120 },
    onExamination: [],
    diagnosis: [],
    treatment: [],
  },
  {
    id: "frenum",
    name: "Frenum",
    svgName: "frenum",
    position: { x: 160, y: 120 },
    onExamination: [],
    diagnosis: [],
    treatment: [],
  },
];
// Replace the TMJ_DATA array with this:
const TMJ_DATA: TMJExamination[] = [
  {
    id: "tmj-left",
    name: "TMJ Left",
    svgName: "tmj-left",
    side: "left",
    position: { x: 100, y: 70 },
    onExamination: [],
    diagnosis: [],
    treatment: [],
  },
  {
    id: "tmj-right",
    name: "TMJ Right",
    svgName: "tmj-right",
    side: "right",
    position: { x: 220, y: 70 },
    onExamination: [],
    diagnosis: [],
    treatment: [],
  },
  {
    id: "tmj-both",
    name: "TMJ Both",
    svgName: "tmj-both",
    side: "both",
    position: { x: 160, y: 50 },
    onExamination: [],
    diagnosis: [],
    treatment: [],
  },
];

const DENTAL_CONDITIONS = [
  "Caries",
  "Filling",
  "Crown",
  "Root Canal",
  "Extraction Needed",
  "Impacted",
  "Missing",
  "Hypoplastic",
  "Discolored",
  "Fractured",
  "Sensitive",
  "Mobile",
  "Periapical Lesion",
  "Periodontal Pocket",
  "Calculus",
  "Plaque",
  "Gingivitis",
  "Pericoronitis",
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

// Soft Tissue Examination Options
const SOFT_TISSUE_EXAMINATION_OPTIONS = [
  "Normal",
  "Erythema (Redness)",
  "Edema (Swelling)",
  "Ulceration",
  "White Lesion",
  "Red Lesion",
  "Pigmented Lesion",
  "Petechiae",
  "Ecchymosis",
  "Bleeding",
  "Exudate",
  "Dryness",
  "Halitosis",
  "Tenderness",
  "Induration",
  "Nodule",
  "Mass",
  "Asymmetry",
];

const SOFT_TISSUE_DIAGNOSIS_OPTIONS = [
  "Normal",
  "Gingivitis",
  "Periodontitis",
  "Stomatitis",
  "Oral Candidiasis",
  "Aphthous Ulcer",
  "Herpetic Lesion",
  "Leukoplakia",
  "Erythroplakia",
  "Oral Lichen Planus",
  "Geographic Tongue",
  "Fissured Tongue",
  "Hairy Tongue",
  "Angular Cheilitis",
  "Mucocele",
  "Fibroma",
  "Papilloma",
  "Traumatic Ulcer",
  "Burn",
  "Allergic Reaction",
];

const SOFT_TISSUE_TREATMENT_OPTIONS = [
  "Observation",
  "Oral Hygiene Instructions",
  "Antibiotics",
  "Antifungals",
  "Antivirals",
  "Corticosteroids",
  "Analgesics",
  "Antiseptic Mouthwash",
  "Topical Gel/Ointment",
  "Laser Therapy",
  "Cryotherapy",
  "Excision",
  "Biopsy",
  "Referral to Specialist",
  "Dietary Modification",
  "Smoking Cessation",
  "Follow-up in 1 week",
  "Follow-up in 2 weeks",
  "Follow-up in 1 month",
];

// TMJ Examination Options
const TMJ_EXAMINATION_OPTIONS = [
  "Normal",
  "Clicking",
  "Popping",
  "Crepitus",
  "Pain on Palpation",
  "Pain on Movement",
  "Limited Opening",
  "Deviation on Opening",
  "Locking (Open)",
  "Locking (Closed)",
  "Muscle Tenderness",
  "Joint Tenderness",
  "Swelling",
  "Bruxism",
  "Clenching",
  "Muscle Spasm",
  "Headache",
  "Ear Pain",
  "Neck Pain",
];

const TMJ_DIAGNOSIS_OPTIONS = [
  "Normal",
  "TMJ Disorder",
  "Myofascial Pain",
  "Internal Derangement",
  "Arthritis",
  "Disc Displacement",
  "Hyper mobility",
  "Hypo mobility",
  "Bruxism",
  "Muscle Spasm",
  "Tension Headache",
  "Osteoarthritis",
  "Rheumatoid Arthritis",
  "Traumatic Injury",
  "Post-surgical",
  "Stress-related",
  "Postural",
  "Idiopathic",
];

const TMJ_TREATMENT_OPTIONS = [
  "Observation",
  "Soft Diet",
  "Moist Heat",
  "Ice Pack",
  "NSAIDs",
  "Muscle Relaxants",
  "Physical Therapy",
  "Occlusal Splint",
  "Stress Management",
  "Relaxation Exercises",
  "Jaw Exercises",
  "Postural Correction",
  "Avoid Chewing Gum",
  "Avoid Hard Foods",
  "Massage Therapy",
  "Acupuncture",
  "Corticosteroid Injection",
  "Arthrocentesis",
  "Arthroscopy",
  "Surgery",
  "Referral to Specialist",
];

// SVG mapping for Teeth
const TOOTH_SVGS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  incisor: IncisorSVG,
  canine: CanineSVG,
  premolar: PremolarSVG,
  molar: MolarSVG,
  wisdom: WisdomSVG || MolarSVG,
};

const SOFT_TISSUE_SVGS: Record<
  string,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  tongue: TongueSVG,
  gingiva: GingivaSVG,
  palate: PalateSVG,
  "buccal-mucosa": BuccalMucosaSVG, // This key should match the svgName in SOFT_TISSUE_DATA
  "floor-of-mouth": FloorOfMouthSVG,
  "labial-mucosa": LabialMucosaSVG, // This key should match the svgName in SOFT_TISSUE_DATA
  "salivary-glands": SalivaryGlandsSVG,
  frenum: FrenumSVG,
};
// SVG mapping for TMJ
const TMJ_SVGS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  "tmj-left": TMJLeftSVG,
  "tmj-right": TMJRightSVG,
  "tmj-both": TMJBothSVG,
};
// Tooth SVG Component
const ToothSVG = ({
  type,
  color = "#4b5563",
  width = 60,
  height = 60,
  rotation = 0,
}: {
  type: string;
  color?: string;
  width?: number;
  height?: number;
  rotation?: number;
}) => {
  const SvgComponent = TOOTH_SVGS[type.toLowerCase()];

  if (!SvgComponent) {
    return (
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="4"
        />
      </svg>
    );
  }

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`,
        display: "inline-block",
      }}
    >
      <SvgComponent
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          fill: "none",
          stroke: color,
          strokeWidth: "4px",
        }}
      />
    </div>
  );
};

// Soft Tissue SVG Component
const SoftTissueSVG = ({
  type,
  color = "#4b5563",
  width = 60,
  height = 60,
}: {
  type: string;
  color?: string;
  width?: number;
  height?: number;
}) => {
  const SvgComponent = SOFT_TISSUE_SVGS[type.toLowerCase()];

  if (!SvgComponent) {
    return (
      <svg width={width} height={height} viewBox="0 0 100 100">
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          fill="none"
          stroke={color}
          strokeWidth="4"
          rx="10"
        />
      </svg>
    );
  }

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: "inline-block",
      }}
    >
      <SvgComponent
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          fill: "none",
          // stroke: color,
          // strokeWidth: '4px'
        }}
      />
    </div>
  );
};

// TMJ SVG Component
const TMJSVG = ({
  type,
  color = "#4b5563",
  width = 60,
  height = 60,
}: {
  type: string;
  color?: string;
  width?: number;
  height?: number;
}) => {
  const SvgComponent = TMJ_SVGS[type.toLowerCase()];

  if (!SvgComponent) {
    return (
      <svg width={width} height={height} viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="4"
        />
      </svg>
    );
  }

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: "inline-block",
      }}
    >
      <SvgComponent
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          fill: "none",
          // stroke: color,
          // strokeWidth: '4px'
        }}
      />
    </div>
  );
};

// Tooth Diagram with Area Markers Component - Segmented Circle Design
const ToothDiagram: React.FC<{
  toothType: string;
  rotation: number;
  selectedAreas: string[];
  onAreaClick?: (area: string) => void;
  mode: "view" | "edit";
  conditionsByArea?: Record<string, string[]>;
  size?: number;
}> = ({
  toothType,
  rotation,
  selectedAreas,
  onAreaClick,
  mode,
  conditionsByArea = {},
  size = 80, // Default to tooth size
}) => {
  const areas = ["buccal", "mesial", "lingual", "distal", "occlusal"];
  const areaColors: Record<string, string> = {
    mesial: "#3b82f6", // blue
    distal: "#10b981", // green
    buccal: "#f59e0b", // orange
    lingual: "#8b5cf6", // purple
    occlusal: "#ef4444", // red
  };

  const createArcPath = (
    startAngle: number,
    endAngle: number,
    innerRadius: number,
    outerRadius: number,
  ) => {
    const start = polarToCartesian(40, 40, outerRadius, endAngle);
    const end = polarToCartesian(40, 40, outerRadius, startAngle);
    const innerStart = polarToCartesian(40, 40, innerRadius, endAngle);
    const innerEnd = polarToCartesian(40, 40, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      start.x,
      start.y,
      "A",
      outerRadius,
      outerRadius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "L",
      innerEnd.x,
      innerEnd.y,
      "A",
      innerRadius,
      innerRadius,
      0,
      largeArcFlag,
      1,
      innerStart.x,
      innerStart.y,
      "Z",
    ].join(" ");
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number,
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const getLabelPosition = (area: string) => {
    switch (area) {
      case "buccal":
        return { x: 40, y: 10, anchor: "middle" };
      case "mesial":
        return { x: 10, y: 40, anchor: "middle" };
      case "lingual":
        return { x: 40, y: 70, anchor: "middle" };
      case "distal":
        return { x: 70, y: 40, anchor: "middle" };
      case "occlusal":
        return { x: 40, y: 40, anchor: "middle" };
      default:
        return { x: 0, y: 0, anchor: "middle" };
    }
  };

  return (
    <div className={`relative w-${size} h-${size} mx-auto`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        className="cursor-pointer"
      >
        {/* Buccal (Top) - 0° to 90° */}
        <path
          d={createArcPath(0, 90, 18, 28)}
          fill={
            selectedAreas.includes("buccal") ||
            (conditionsByArea?.buccal || []).length > 0
              ? areaColors.buccal
              : "#f3f4f6"
          }
          stroke="#d1d5db"
          strokeWidth="1.5"
          className={
            mode === "edit"
              ? "cursor-pointer hover:opacity-80 transition-opacity"
              : ""
          }
          onClick={() => mode === "edit" && onAreaClick?.("buccal")}
          opacity={
            selectedAreas.includes("buccal") ||
            (conditionsByArea?.buccal || []).length > 0
              ? 0.8
              : 0.4
          }
        />

        {/* Distal (Right) - 90° to 180° */}
        <path
          d={createArcPath(90, 180, 18, 28)}
          fill={
            selectedAreas.includes("distal") ||
            (conditionsByArea?.distal || []).length > 0
              ? areaColors.distal
              : "#f3f4f6"
          }
          stroke="#d1d5db"
          strokeWidth="1.5"
          className={
            mode === "edit"
              ? "cursor-pointer hover:opacity-80 transition-opacity"
              : ""
          }
          onClick={() => mode === "edit" && onAreaClick?.("distal")}
          opacity={
            selectedAreas.includes("distal") ||
            (conditionsByArea?.distal || []).length > 0
              ? 0.8
              : 0.4
          }
        />

        {/* Lingual (Bottom) - 180° to 270° */}
        <path
          d={createArcPath(180, 270, 18, 28)}
          fill={
            selectedAreas.includes("lingual") ||
            (conditionsByArea?.lingual || []).length > 0
              ? areaColors.lingual
              : "#f3f4f6"
          }
          stroke="#d1d5db"
          strokeWidth="1.5"
          className={
            mode === "edit"
              ? "cursor-pointer hover:opacity-80 transition-opacity"
              : ""
          }
          onClick={() => mode === "edit" && onAreaClick?.("lingual")}
          opacity={
            selectedAreas.includes("lingual") ||
            (conditionsByArea?.lingual || []).length > 0
              ? 0.8
              : 0.4
          }
        />

        {/* Mesial (Left) - 270° to 360° */}
        <path
          d={createArcPath(270, 360, 18, 28)}
          fill={
            selectedAreas.includes("mesial") ||
            (conditionsByArea?.mesial || []).length > 0
              ? areaColors.mesial
              : "#f3f4f6"
          }
          stroke="#d1d5db"
          strokeWidth="1.5"
          className={
            mode === "edit"
              ? "cursor-pointer hover:opacity-80 transition-opacity"
              : ""
          }
          onClick={() => mode === "edit" && onAreaClick?.("mesial")}
          opacity={
            selectedAreas.includes("mesial") ||
            (conditionsByArea?.mesial || []).length > 0
              ? 0.8
              : 0.4
          }
        />

        {/* Occlusal (Center circle) */}
        <circle
          cx="40"
          cy="40"
          r="14"
          fill={
            selectedAreas.includes("occlusal") ||
            (conditionsByArea?.occlusal || []).length > 0
              ? areaColors.occlusal
              : "#f3f4f6"
          }
          stroke="#d1d5db"
          strokeWidth="1.5"
          className={
            mode === "edit"
              ? "cursor-pointer hover:opacity-80 transition-opacity"
              : ""
          }
          onClick={() => mode === "edit" && onAreaClick?.("occlusal")}
          opacity={
            selectedAreas.includes("occlusal") ||
            (conditionsByArea?.occlusal || []).length > 0
              ? 0.8
              : 0.4
          }
        />

        {/* Area Labels (Small text) */}
        {areas.map((area) => {
          const pos = getLabelPosition(area);
          const areaConditions = conditionsByArea?.[area] || [];

          return (
            <g key={area}>
              <text
                x={pos.x}
                y={pos.y}
                textAnchor={pos.anchor as any}
                dominantBaseline="middle"
                className="text-[8px] font-semibold fill-gray-600 pointer-events-none"
                style={{ textTransform: "uppercase" }}
              >
                {area.charAt(0)}
              </text>

              {/* Condition indicator dot - very small */}
              {areaConditions.length > 0 && (
                <circle
                  cx={pos.x}
                  cy={area === "occlusal" ? pos.y + 6 : pos.y + 5}
                  r="2"
                  fill="#ef4444"
                  className="animate-pulse"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

interface ToothPopupProps {
  tooth: ToothData;
  condition: ToothCondition | null;
  mode: "view" | "edit";
  onClose: () => void;
  onSave: (data: Partial<ToothCondition>) => void;
}

const ToothPopup: React.FC<ToothPopupProps> = ({
  tooth,
  condition,
  mode,
  onClose,
  onSave,
}) => {
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    condition?.conditions || [],
  );
  const [notes, setNotes] = useState(condition?.notes || "");
  const [surfaceConditions, setSurfaceConditions] = useState<
    { surface: string; conditions: string[] }[]
  >(condition?.surfaceConditions || []);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [procedures, setProcedures] = useState<
    {
      name: string;
      surface: string;
      cost?: number;
      notes?: string;
      date?: string;
    }[]
  >(condition?.procedures || []);
const [showGeneralConditionsDropdown, setShowGeneralConditionsDropdown] = useState(false);
  // Handle condition toggle
  const handleConditionToggle = (conditionName: string) => {
    setSelectedConditions((prev) =>
      prev.includes(conditionName)
        ? prev.filter((c) => c !== conditionName)
        : [...prev, conditionName],
    );
  };

  // Handle area click - TOGGLE multiple areas
  const handleAreaClick = (area: string) => {
    setSelectedAreas((prev) => {
      if (prev.includes(area)) {
        return prev.filter((a) => a !== area);
      } else {
        return [...prev, area];
      }
    });
  };

  // Handle surface condition toggle for a specific area
  const handleSurfaceConditionToggle = (
    surface: string,
    conditionName: string,
  ) => {
    setSurfaceConditions((prev) => {
      const surfaceIndex = prev.findIndex((sc) => sc.surface === surface);

      if (surfaceIndex === -1) {
        return [...prev, { surface, conditions: [conditionName] }];
      } else {
        const updated = [...prev];
        const currentConditions = updated[surfaceIndex].conditions;

        if (currentConditions.includes(conditionName)) {
          updated[surfaceIndex].conditions = currentConditions.filter(
            (c) => c !== conditionName,
          );
          if (updated[surfaceIndex].conditions.length === 0) {
            return prev.filter((_, i) => i !== surfaceIndex);
          }
        } else {
          updated[surfaceIndex].conditions = [
            ...currentConditions,
            conditionName,
          ];
        }
        return updated;
      }
    });
  };

  // Get conditions by area for the diagram
  const conditionsByArea: Record<string, string[]> = {};
  surfaceConditions.forEach((sc) => {
    conditionsByArea[sc.surface] = sc.conditions;
  });

  // Handle save with formatted data
  const handleSave = () => {
    const toothData: Partial<ToothCondition> = {
      toothNumber: tooth.number,
      conditions: selectedConditions,
      notes,
      surfaceConditions,
      procedures: procedures,
    };

    onSave(toothData);
  };

  // Get the correct color for the tooth in the modal
  const getToothColorForModal = () => {
    if (!condition) return "#4b5563";

    if (condition.conditions.includes("Missing")) return "#9ca3af";
    if (condition.conditions.includes("Caries")) return "#ef4444";
    if (condition.conditions.includes("Filling")) return "#3b82f6";
    if (condition.conditions.includes("Crown")) return "#f59e0b";
    if (condition.conditions.includes("Root Canal")) return "#8b5cf6";
    return condition.color || "#4b5563";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-lg">
        <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Tooth #{tooth.number} (FDI)
            </h3>
            <p className="text-sm text-muted-foreground">{tooth.name}</p>
            <Badge variant="outline" className="mt-1">
              Quadrant {tooth.quadrant} • {tooth.isAdult ? "Adult" : "Primary"}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* TWO CONTAINERS LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
          {/* Left Container: Tooth SVG and General Conditions */}
<div className="space-y-6">
  {/* Tooth SVG Container */}
  <div className="border rounded-xl p-4 bg-gray-50">
    <div className="flex items-start gap-4">
      {/* Tooth SVG - Original dental chart size */}
      <div className="flex-shrink-0">
        <div className="relative">
            <ToothSVG
                        type={tooth.svgName}
                        width={80}
                        height={80}
                        rotation={tooth.rotation || 0}
                        color={getToothColorForModal()}
                      />
        </div>
        <div className="text-center mt-2">
          <div className="text-xl font-bold text-gray-800">
            #{tooth.number}
          </div>
          <div className="text-xs text-gray-600">{tooth.name}</div>
        </div>
      </div>
      
      {/* General Conditions Section with Dropdown */}
      <div className="flex-1">
        <div className="mt-1">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">General Conditions</h4>
            {mode === "edit" && (
              <button
                type="button"
                onClick={() => setShowGeneralConditionsDropdown(!showGeneralConditionsDropdown)}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
              >
                {showGeneralConditionsDropdown ? (
                  <>
                    <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
                  <span className="text-sm font-medium">Hide Conditions</span>
                  </>
                ) : (
                  <>
                   <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
                     <span className="text-sm font-medium">Select Conditions</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Current selected conditions display */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {selectedConditions.map((cond) => (
                <Badge 
                  key={cond} 
                  variant="secondary" 
                  className="text-xs py-1 px-2"
                >
                  {cond}
                  {mode === "edit" && (
                    <button
                      type="button"
                      onClick={() => handleConditionToggle(cond)}
                      className="ml-1.5 text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {selectedConditions.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No general conditions
                </p>
              )}
            </div>
          </div>

          {/* Dropdown for adding conditions - Only visible when toggled */}
          {mode === "edit" && showGeneralConditionsDropdown && (
            <div className="border rounded-lg p-3 bg-white shadow-sm animate-in fade-in duration-200">
              <h5 className="text-xs font-medium mb-2 text-gray-600">
                Select Conditions:
              </h5>
             <div className="grid grid-cols-2 gap-2">
                            {DENTAL_CONDITIONS.map((cond) => {
                              const isSelected = selectedConditions.includes(cond);
                              return (
                                <button
                                  key={cond}
                                  type="button"
                                  onClick={() => handleConditionToggle(cond)}
                                  className={`px-3 py-2 rounded-full border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                                    isSelected
                                      ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3" />
                                      {cond}
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3 w-3" />
                                      {cond}
                                    </>
                                  )}
                                </button>
                              );
                            })}
                          </div>
              
              {/* Quick Actions */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedConditions([])}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border hover:bg-gray-200 transition-colors"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedConditions([...DENTAL_CONDITIONS])}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    Select All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>

  {/* Notes Section */}
  <div>
    <h4 className="font-medium mb-2">Notes</h4>
    <textarea
      className="w-full border rounded-lg p-3 text-sm min-h-[100px]"
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      placeholder="Add notes about this tooth..."
      readOnly={mode === "view"}
    />
  </div>
</div>

          {/* RIGHT CONTAINER: Surface Selection Diagram - COMPACT SIZE */}
<div className="space-y-4">
  <div className="border rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm">
    <h4 className="font-semibold mb-4 text-base text-gray-800 text-center">Surface Selection</h4>

    {/* Surface Selection Diagram - Centered */}
    <div className="flex justify-center">
      <ToothDiagram
        toothType={tooth.svgName}
        rotation={tooth.rotation || 0}
        selectedAreas={selectedAreas}
        onAreaClick={handleAreaClick}
        mode={mode}
        conditionsByArea={conditionsByArea}
        size={95}
      />
    </div>



    {/* Selected Areas Display - COMPACT */}
    {selectedAreas.length > 0 && mode === "edit" && (
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h5 className="font-medium mb-2 text-xs text-gray-700">
          Surface Conditions:
        </h5>

        {/* Show each selected area in REVERSE ORDER */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {[...selectedAreas].reverse().map((area) => {
            const areaConditions =
              surfaceConditions.find((sc) => sc.surface === area)
                ?.conditions || [];
            const areaColor = {
              mesial: "#3b82f6",
              distal: "#10b981",
              buccal: "#f59e0b",
              lingual: "#8b5cf6",
              occlusal: "#ef4444",
            }[area];

            return (
              <div key={area} className="border rounded p-2 bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: areaColor }}
                  />
                  <span className="font-medium capitalize text-xs">
                    {area}
                  </span>
                </div>

                {/* Current conditions - COMPACT */}
              <div className="flex flex-wrap gap-1 mb-2">
  {areaConditions.length > 0 ? (
    areaConditions.map((cond) => (
      <Badge
        key={cond}
        variant="secondary"
        className="text-[10px] py-0.5 px-1.5 h-auto"
      >
        {cond}
        <button
          type="button"
          onClick={() => handleSurfaceConditionToggle(area, cond)}
          className="ml-1 text-red-500 hover:text-red-700"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </Badge>
    ))
  ) : (
    <span className="text-[10px] text-gray-400 italic">
      No conditions
    </span>
  )}
</div>

{/* Quick condition buttons - TAB STYLE */}
<div className="flex flex-wrap gap-1">
  {["Caries", "Filling", "Fractured", "Sensitive"].map((cond) => {
    const isApplied = areaConditions.includes(cond);
    return (
      <button
        key={cond}
        type="button"
        onClick={() => handleSurfaceConditionToggle(area, cond)}
        className={`px-2 py-1 text-[10px] font-medium rounded-full transition-all ${
          isApplied
            ? "bg-red-500 text-white shadow-sm"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {isApplied ? (
          <span className="flex items-center gap-1">
            <X className="h-2.5 w-2.5" />
            {cond}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Plus className="h-2.5 w-2.5" />
            {cond}
          </span>
        )}
      </button>
    );
  })}
</div>
              </div>
            );
          })}
        </div>

        {/* Quick actions for ALL selected areas - COMPACT */}
        <div className="mt-2 pt-2 border-t border-blue-300">
          <h6 className="text-[10px] font-medium mb-1 text-gray-600">
            Quick Actions:
          </h6>
          <div className="grid grid-cols-2 gap-1">
            {["Caries", "Filling", "Fractured", "Sensitive"].map((cond) => {
              const isAppliedToAny = selectedAreas.some((area) => {
                const areaConditions =
                  surfaceConditions.find((sc) => sc.surface === area)
                    ?.conditions || [];
                return areaConditions.includes(cond);
              });

              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() => {
                    if (isAppliedToAny) {
                      selectedAreas.forEach((area) => {
                        const areaConditions =
                          surfaceConditions.find((sc) => sc.surface === area)
                            ?.conditions || [];
                        if (areaConditions.includes(cond)) {
                          handleSurfaceConditionToggle(area, cond);
                        }
                      });
                    } else {
                      selectedAreas.forEach((area) => {
                        const areaConditions =
                          surfaceConditions.find((sc) => sc.surface === area)
                            ?.conditions || [];
                        if (!areaConditions.includes(cond)) {
                          handleSurfaceConditionToggle(area, cond);
                        }
                      });
                    }
                  }}
                  className={`px-1.5 py-0.5 text-[10px] border rounded transition-all truncate ${
                    isAppliedToAny
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {isAppliedToAny ? (
                    <span className="flex items-center justify-center gap-0.5">
                      <X className="h-2 w-2" />
                      Remove {cond}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-0.5">
                      <span>+</span>
                      Add {cond}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    )}
  </div>
</div>
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {mode === "edit" && (
            <Button onClick={handleSave}>Save Changes</Button>
          )}
        </div>
      </div>
    </div>
  );
};
// NEW: Multi-Tooth Popup Component
interface MultiToothPopupProps {
  selectedTeeth: number[];
  toothData: ToothData[];
  mode: "view" | "edit";
  onClose: () => void;
  onSave: (data: {
    teethNumbers: number[];
    conditions: string[];
    procedures: any[];
    surfaceConditions: { surface: string; conditions: string[] }[];
    notes?: string;
  }) => void;
}

const MultiToothPopup: React.FC<MultiToothPopupProps> = ({
  selectedTeeth,
  toothData,
  mode,
  onClose,
  onSave,
}) => {
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [surfaceConditions, setSurfaceConditions] = useState<
    { surface: string; conditions: string[] }[]
  >([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [showGeneralConditionsDropdown, setShowGeneralConditionsDropdown] = useState(false);

  // Sort teeth numbers
  const sortedTeethNumbers = [...selectedTeeth].sort((a, b) => a - b);

  // Handle condition toggle
  const handleConditionToggle = (conditionName: string) => {
    setSelectedConditions((prev) =>
      prev.includes(conditionName)
        ? prev.filter((c) => c !== conditionName)
        : [...prev, conditionName],
    );
  };

  // Handle area click - TOGGLE multiple areas
  const handleAreaClick = (area: string) => {
    setSelectedAreas((prev) => {
      if (prev.includes(area)) {
        return prev.filter((a) => a !== area);
      } else {
        return [...prev, area];
      }
    });
  };

  // Handle surface condition toggle for a specific area
  const handleSurfaceConditionToggle = (
    surface: string,
    conditionName: string,
  ) => {
    setSurfaceConditions((prev) => {
      const surfaceIndex = prev.findIndex((sc) => sc.surface === surface);

      if (surfaceIndex === -1) {
        return [...prev, { surface, conditions: [conditionName] }];
      } else {
        const updated = [...prev];
        const currentConditions = updated[surfaceIndex].conditions;

        if (currentConditions.includes(conditionName)) {
          updated[surfaceIndex].conditions = currentConditions.filter(
            (c) => c !== conditionName,
          );
          if (updated[surfaceIndex].conditions.length === 0) {
            return prev.filter((_, i) => i !== surfaceIndex);
          }
        } else {
          updated[surfaceIndex].conditions = [
            ...currentConditions,
            conditionName,
          ];
        }
        return updated;
      }
    });
  };

  // Get conditions by area for the diagram
  const conditionsByArea: Record<string, string[]> = {};
  surfaceConditions.forEach((sc) => {
    conditionsByArea[sc.surface] = sc.conditions;
  });

  // Handle save with formatted data
  const handleSave = () => {
    const toothData = {
      teethNumbers: selectedTeeth,
      conditions: selectedConditions,
      notes,
      surfaceConditions,
      procedures: [],
    };

    onSave(toothData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-lg">
        <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Multiple Teeth - {selectedTeeth.length} Selected
            </h3>
            <p className="text-sm text-muted-foreground">
              Teeth: {sortedTeethNumbers.join(", ")}
            </p>
            <Badge variant="outline" className="mt-1">
              Multi-Tooth Edit
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* TWO CONTAINERS LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Container: Tooth Preview and General Conditions */}
            <div className="space-y-6">
              {/* Teeth Preview Container */}
              <div className="border rounded-xl p-4 bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* Teeth SVG Preview */}
                  <div className="flex-shrink-0">
                    <div className="grid grid-cols-3 gap-2">
                      {selectedTeeth.slice(0, 6).map((toothNumber) => {
                        const tooth = toothData.find(t => t.number === toothNumber);
                        return tooth ? (
                          <div key={tooth.number} className="flex flex-col items-center">
                            <ToothSVG
                              type={tooth.svgName}
                              width={50}
                              height={50}
                              rotation={tooth.rotation || 0}
                              color="#4b5563"
                            />
                            <div className="text-center mt-1">
                              <div className="text-sm font-bold text-gray-800">
                                #{tooth.number}
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                    {selectedTeeth.length > 6 && (
                      <div className="text-center mt-2 text-xs text-gray-500">
                        +{selectedTeeth.length - 6} more teeth
                      </div>
                    )}
                  </div>
                  
                  {/* General Conditions Section with Dropdown */}
                  <div className="flex-1">
                    <div className="mt-1">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">General Conditions</h4>
                        {mode === "edit" && (
                          <button
                            type="button"
                            onClick={() => setShowGeneralConditionsDropdown(!showGeneralConditionsDropdown)}
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                          >
                            {showGeneralConditionsDropdown ? (
                              <>
                                <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
                                <span className="text-sm font-medium">Hide Conditions</span>
                              </>
                            ) : (
                              <>
                                <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
                                <span className="text-sm font-medium">Select Conditions</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* Current selected conditions display */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {selectedConditions.map((cond) => (
                            <Badge 
                              key={cond} 
                              variant="secondary" 
                              className="text-xs py-1 px-2"
                            >
                              {cond}
                              {mode === "edit" && (
                                <button
                                  type="button"
                                  onClick={() => handleConditionToggle(cond)}
                                  className="ml-1.5 text-red-500 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          ))}
                          {selectedConditions.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">
                              No general conditions
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Dropdown for adding conditions - Only visible when toggled */}
                      {mode === "edit" && showGeneralConditionsDropdown && (
                        <div className="border rounded-lg p-3 bg-white shadow-sm animate-in fade-in duration-200">
                          <h5 className="text-xs font-medium mb-2 text-gray-600">
                            Select Conditions:
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            {DENTAL_CONDITIONS.map((cond) => {
                              const isSelected = selectedConditions.includes(cond);
                              return (
                                <button
                                  key={cond}
                                  type="button"
                                  onClick={() => handleConditionToggle(cond)}
                                  className={`px-3 py-2 rounded-full border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3" />
                                      {cond}
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-3 w-3" />
                                      {cond}
                                    </>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedConditions([])}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded border hover:bg-gray-200 transition-colors"
                              >
                                Clear All
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedConditions([...DENTAL_CONDITIONS])}
                                className="text-xs px-2 py-1 bg-primary/10 text-primary rounded border border-primary/20 hover:bg-primary/20 transition-colors"
                              >
                                Select All
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm min-h-[100px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for all selected teeth..."
                  readOnly={mode === "view"}
                />
              </div>
            </div>

            {/* RIGHT CONTAINER: Surface Selection Diagram */}
            <div className="space-y-4">
              <div className="border rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <h4 className="font-semibold mb-4 text-base text-gray-800 text-center">
                  Surface Selection
                </h4>

                {/* Surface Selection Diagram - Centered */}
                <div className="flex justify-center">
                  <ToothDiagram
                    toothType="molar"
                    rotation={0}
                    selectedAreas={selectedAreas}
                    onAreaClick={handleAreaClick}
                    mode={mode}
                    conditionsByArea={conditionsByArea}
                    size={95}
                  />
                </div>

                {/* Selected Areas Display */}
                {selectedAreas.length > 0 && mode === "edit" && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mt-4">
                    <h5 className="font-medium mb-2 text-xs text-gray-700">
                      Surface Conditions:
                    </h5>

                    {/* Show each selected area in REVERSE ORDER */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {[...selectedAreas].reverse().map((area) => {
                        const areaConditions =
                          surfaceConditions.find((sc) => sc.surface === area)
                            ?.conditions || [];
                        const areaColor = {
                          mesial: "#3b82f6",
                          distal: "#10b981",
                          buccal: "#f59e0b",
                          lingual: "#8b5cf6",
                          occlusal: "#ef4444",
                        }[area];

                        return (
                          <div key={area} className="border rounded p-2 bg-white">
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: areaColor }}
                              />
                              <span className="font-medium capitalize text-xs">
                                {area}
                              </span>
                            </div>

                            {/* Current conditions */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {areaConditions.length > 0 ? (
                                areaConditions.map((cond) => (
                                  <Badge
                                    key={cond}
                                    variant="secondary"
                                    className="text-[10px] py-0.5 px-1.5 h-auto"
                                  >
                                    {cond}
                                    <button
                                      type="button"
                                      onClick={() => handleSurfaceConditionToggle(area, cond)}
                                      className="ml-1 text-red-500 hover:text-red-700"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-[10px] text-gray-400 italic">
                                  No conditions
                                </span>
                              )}
                            </div>

                            {/* Quick condition buttons */}
                            <div className="flex flex-wrap gap-1">
                              {["Caries", "Filling", "Fractured", "Sensitive"].map((cond) => {
                                const isApplied = areaConditions.includes(cond);
                                return (
                                  <button
                                    key={cond}
                                    type="button"
                                    onClick={() => handleSurfaceConditionToggle(area, cond)}
                                    className={`px-2 py-1 text-[10px] font-medium rounded-full transition-all ${
                                      isApplied
                                        ? "bg-destructive text-destructive-foreground shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                  >
                                    {isApplied ? (
                                      <span className="flex items-center gap-1">
                                        <X className="h-2.5 w-2.5" />
                                        {cond}
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1">
                                        <Plus className="h-2.5 w-2.5" />
                                        {cond}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick actions for ALL selected areas */}
                    <div className="mt-2 pt-2 border-t border-primary/20">
                      <h6 className="text-[10px] font-medium mb-1 text-gray-600">
                        Quick Actions:
                      </h6>
                      <div className="grid grid-cols-2 gap-1">
                        {["Caries", "Filling", "Fractured", "Sensitive"].map((cond) => {
                          const isAppliedToAny = selectedAreas.some((area) => {
                            const areaConditions =
                              surfaceConditions.find((sc) => sc.surface === area)
                                ?.conditions || [];
                            return areaConditions.includes(cond);
                          });

                          return (
                            <button
                              key={cond}
                              type="button"
                              onClick={() => {
                                if (isAppliedToAny) {
                                  selectedAreas.forEach((area) => {
                                    const areaConditions =
                                      surfaceConditions.find((sc) => sc.surface === area)
                                        ?.conditions || [];
                                    if (areaConditions.includes(cond)) {
                                      handleSurfaceConditionToggle(area, cond);
                                    }
                                  });
                                } else {
                                  selectedAreas.forEach((area) => {
                                    const areaConditions =
                                      surfaceConditions.find((sc) => sc.surface === area)
                                        ?.conditions || [];
                                    if (!areaConditions.includes(cond)) {
                                      handleSurfaceConditionToggle(area, cond);
                                    }
                                  });
                                }
                              }}
                              className={`px-1.5 py-0.5 text-[10px] border rounded transition-all truncate ${
                                isAppliedToAny
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {isAppliedToAny ? (
                                <span className="flex items-center justify-center gap-0.5">
                                  <X className="h-2 w-2" />
                                  Remove {cond}
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-0.5">
                                  <span>+</span>
                                  Add {cond}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {mode === "edit" && (
            <Button onClick={handleSave}>Save to {selectedTeeth.length} Teeth</Button>
          )}
        </div>
      </div>
    </div>
  );
};
// NEW: Soft Tissue Popup Component
interface SoftTissuePopupProps {
  tissue: SoftTissueExamination;
  mode: "view" | "edit";
  onClose: () => void;
  onSave: (data: SoftTissueExamination) => void;
}

const SoftTissuePopup: React.FC<SoftTissuePopupProps> = ({
  tissue,
  mode,
  onClose,
  onSave,
}) => {
  const [onExamination, setOnExamination] = useState<string[]>(
    tissue.onExamination || [],
  );
  const [diagnosis, setDiagnosis] = useState<string[]>(tissue.diagnosis || []);
  const [treatment, setTreatment] = useState<string[]>(tissue.treatment || []);
  const [notes, setNotes] = useState(tissue.notes || "");
  const [customExamination, setCustomExamination] = useState("");
  const [customDiagnosis, setCustomDiagnosis] = useState("");
  const [customTreatment, setCustomTreatment] = useState("");

  const handleAddExamination = (value: string) => {
    if (value && !onExamination.includes(value)) {
      setOnExamination([...onExamination, value]);
    }
  };

  const handleAddDiagnosis = (value: string) => {
    if (value && !diagnosis.includes(value)) {
      setDiagnosis([...diagnosis, value]);
    }
  };

  const handleAddTreatment = (value: string) => {
    if (value && !treatment.includes(value)) {
      setTreatment([...treatment, value]);
    }
  };

  const handleRemoveExamination = (value: string) => {
    setOnExamination(onExamination.filter((item) => item !== value));
  };

  const handleRemoveDiagnosis = (value: string) => {
    setDiagnosis(diagnosis.filter((item) => item !== value));
  };

  const handleRemoveTreatment = (value: string) => {
    setTreatment(treatment.filter((item) => item !== value));
  };

  const handleSave = () => {
    const updatedTissue: SoftTissueExamination = {
      ...tissue,
      onExamination,
      diagnosis,
      treatment,
      notes,
      date: new Date().toISOString(),
    };
    onSave(updatedTissue);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-lg">
        <div className="bg-blue-50 border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">
                Soft Tissue: {tissue.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Oral Cavity Examination
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Tissue SVG */}
            <div className="space-y-6">
              <div className="border rounded-xl p-6 bg-gray-50">
                <h4 className="font-medium mb-4 text-center">{tissue.name}</h4>
                <div className="flex justify-center">
                  <SoftTissueSVG
                    type={tissue.svgName}
                    width={300}
                    height={300}
                    color="#3b82f6"
                  />
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm min-h-[100px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this soft tissue..."
                  readOnly={mode === "view"}
                />
              </div>
            </div>

            {/* Right Column: Examination, Diagnosis, Treatment */}
            <div className="space-y-6">
              {/* On Examination */}
              <div>
                <h4 className="font-medium mb-2">On Examination</h4>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {onExamination.map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {item}
                        {mode === "edit" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExamination(item)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>

                  {mode === "edit" && (
                    <>
                      <select
                        className="w-full border rounded-lg p-2 text-sm"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddExamination(e.target.value);
                          }
                        }}
                      >
                        <option value="">Select from options...</option>
                        {SOFT_TISSUE_EXAMINATION_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 border rounded-lg p-2 text-sm"
                          value={customExamination}
                          onChange={(e) => setCustomExamination(e.target.value)}
                          placeholder="Or enter custom finding..."
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (customExamination.trim()) {
                              handleAddExamination(customExamination.trim());
                              setCustomExamination("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <h4 className="font-medium mb-2">Diagnosis</h4>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {diagnosis.map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {item}
                        {mode === "edit" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDiagnosis(item)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>

                  {mode === "edit" && (
                    <>
                      <select
                        className="w-full border rounded-lg p-2 text-sm"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddDiagnosis(e.target.value);
                          }
                        }}
                      >
                        <option value="">Select from options...</option>
                        {SOFT_TISSUE_DIAGNOSIS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 border rounded-lg p-2 text-sm"
                          value={customDiagnosis}
                          onChange={(e) => setCustomDiagnosis(e.target.value)}
                          placeholder="Or enter custom diagnosis..."
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (customDiagnosis.trim()) {
                              handleAddDiagnosis(customDiagnosis.trim());
                              setCustomDiagnosis("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Treatment */}
              <div>
                <h4 className="font-medium mb-2">Treatment</h4>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {treatment.map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {item}
                        {mode === "edit" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTreatment(item)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>

                  {mode === "edit" && (
                    <>
                      <select
                        className="w-full border rounded-lg p-2 text-sm"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddTreatment(e.target.value);
                          }
                        }}
                      >
                        <option value="">Select from options...</option>
                        {SOFT_TISSUE_TREATMENT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 border rounded-lg p-2 text-sm"
                          value={customTreatment}
                          onChange={(e) => setCustomTreatment(e.target.value)}
                          placeholder="Or enter custom treatment..."
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (customTreatment.trim()) {
                              handleAddTreatment(customTreatment.trim());
                              setCustomTreatment("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {mode === "edit" && (
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// NEW: TMJ Popup Component
interface TMJPopupProps {
  tmj: TMJExamination;
  mode: "view" | "edit";
  onClose: () => void;
  onSave: (data: TMJExamination) => void;
}

const TMJPopup: React.FC<TMJPopupProps> = ({ tmj, mode, onClose, onSave }) => {
  const [onExamination, setOnExamination] = useState<string[]>(
    tmj.onExamination || [],
  );
  const [diagnosis, setDiagnosis] = useState<string[]>(tmj.diagnosis || []);
  const [treatment, setTreatment] = useState<string[]>(tmj.treatment || []);
  const [notes, setNotes] = useState(tmj.notes || "");
  const [customExamination, setCustomExamination] = useState("");
  const [customDiagnosis, setCustomDiagnosis] = useState("");
  const [customTreatment, setCustomTreatment] = useState("");

  const handleAddExamination = (value: string) => {
    if (value && !onExamination.includes(value)) {
      setOnExamination([...onExamination, value]);
    }
  };

  const handleAddDiagnosis = (value: string) => {
    if (value && !diagnosis.includes(value)) {
      setDiagnosis([...diagnosis, value]);
    }
  };

  const handleAddTreatment = (value: string) => {
    if (value && !treatment.includes(value)) {
      setTreatment([...treatment, value]);
    }
  };

  const handleRemoveExamination = (value: string) => {
    setOnExamination(onExamination.filter((item) => item !== value));
  };

  const handleRemoveDiagnosis = (value: string) => {
    setDiagnosis(diagnosis.filter((item) => item !== value));
  };

  const handleRemoveTreatment = (value: string) => {
    setTreatment(treatment.filter((item) => item !== value));
  };

  const handleSave = () => {
    const updatedTMJ: TMJExamination = {
      ...tmj,
      onExamination,
      diagnosis,
      treatment,
      notes,
      date: new Date().toISOString(),
    };
    onSave(updatedTMJ);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-lg">
        <div className="bg-purple-50 border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bone className="h-5 w-5 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold">TMJ: {tmj.name}</h3>
              <p className="text-sm text-muted-foreground">
                Temporomandibular Joint Examination
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: TMJ SVG */}
            <div className="space-y-6">
              <div className="border rounded-xl p-6 bg-gray-50">
                <h4 className="font-medium mb-4 text-center">
                  {tmj.name} ({tmj.side})
                </h4>
                <div className="flex justify-center">
                  <TMJSVG
                    type={tmj.svgName}
                    width={200}
                    height={200}
                    color="#8b5cf6"
                  />
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm min-h-[100px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this TMJ..."
                  readOnly={mode === "view"}
                />
              </div>
            </div>

            {/* Right Column: Examination, Diagnosis, Treatment */}
            <div className="space-y-6">
              {/* On Examination */}
              <div>
                <h4 className="font-medium mb-2">On Examination</h4>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {onExamination.map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {item}
                        {mode === "edit" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExamination(item)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>

                  {mode === "edit" && (
                    <>
                      <select
                        className="w-full border rounded-lg p-2 text-sm"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddExamination(e.target.value);
                          }
                        }}
                      >
                        <option value="">Select from options...</option>
                        {TMJ_EXAMINATION_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 border rounded-lg p-2 text-sm"
                          value={customExamination}
                          onChange={(e) => setCustomExamination(e.target.value)}
                          placeholder="Or enter custom finding..."
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (customExamination.trim()) {
                              handleAddExamination(customExamination.trim());
                              setCustomExamination("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <h4 className="font-medium mb-2">Diagnosis</h4>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {diagnosis.map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {item}
                        {mode === "edit" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDiagnosis(item)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>

                  {mode === "edit" && (
                    <>
                      <select
                        className="w-full border rounded-lg p-2 text-sm"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddDiagnosis(e.target.value);
                          }
                        }}
                      >
                        <option value="">Select from options...</option>
                        {TMJ_DIAGNOSIS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 border rounded-lg p-2 text-sm"
                          value={customDiagnosis}
                          onChange={(e) => setCustomDiagnosis(e.target.value)}
                          placeholder="Or enter custom diagnosis..."
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (customDiagnosis.trim()) {
                              handleAddDiagnosis(customDiagnosis.trim());
                              setCustomDiagnosis("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Treatment */}
              <div>
                <h4 className="font-medium mb-2">Treatment</h4>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {treatment.map((item) => (
                      <Badge
                        key={item}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {item}
                        {mode === "edit" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTreatment(item)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>

                  {mode === "edit" && (
                    <>
                      <select
                        className="w-full border rounded-lg p-2 text-sm"
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddTreatment(e.target.value);
                          }
                        }}
                      >
                        <option value="">Select from options...</option>
                        {TMJ_TREATMENT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 border rounded-lg p-2 text-sm"
                          value={customTreatment}
                          onChange={(e) => setCustomTreatment(e.target.value)}
                          placeholder="Or enter custom treatment..."
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (customTreatment.trim()) {
                              handleAddTreatment(customTreatment.trim());
                              setCustomTreatment("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {mode === "edit" && (
            <Button
              onClick={handleSave}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// NEW: RESPONSIVE DROPDOWN COMPONENTS

// Dropdown Tooth Selection Component
const DropdownToothSelector: React.FC<{
  toothData: ToothData[];
  selectedTeeth: number[];
  selectionMode: "single" | "multiple";
  onSelectTeeth: (toothNumbers: number[]) => void;
  chartType: "adult" | "pediatric";
  onOpenMultiToothModal: () => void;
  disabled?: boolean;
  onToothDetailedView?: (toothNumber: number) => void;
}> = ({
  toothData,
  selectedTeeth,
  selectionMode,
  onSelectTeeth,
  chartType,
  onOpenMultiToothModal,
  disabled,
  onToothDetailedView,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMobileTab, setActiveMobileTab] = useState<"teeth" | "details">(
    "teeth",
  );
  const [selectedToothForDetails, setSelectedToothForDetails] =
    useState<ToothData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Filter teeth based on search
  const filteredTeeth = toothData.filter(
    (tooth) =>
      tooth.number.toString().includes(searchTerm) ||
      tooth.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `quadrant ${tooth.quadrant}`.includes(searchTerm.toLowerCase()),
  );

  // Group teeth by quadrant
  const teethByQuadrant = {
    "Upper Right (Q1)": filteredTeeth.filter((t) => t.quadrant === 1),
    "Upper Left (Q2)": filteredTeeth.filter((t) => t.quadrant === 2),
    "Lower Left (Q3)": filteredTeeth.filter((t) => t.quadrant === 3),
    "Lower Right (Q4)": filteredTeeth.filter((t) => t.quadrant === 4),
  };

  const handleToothToggle = (toothNumber: number) => {
    if (selectionMode === "single") {
      onSelectTeeth([toothNumber]);
      if (isMobile) {
        const tooth = toothData.find((t) => t.number === toothNumber);
        if (tooth) {
          setSelectedToothForDetails(tooth);
          setActiveMobileTab("details");
        }
      } else {
        setIsOpen(false);
      }
    } else {
      const newSelection = selectedTeeth.includes(toothNumber)
        ? selectedTeeth.filter((num) => num !== toothNumber)
        : [...selectedTeeth, toothNumber];
      onSelectTeeth(newSelection);
    }
  };

  // Quick selection options
  const quickSelections = [
    { label: "Full Mouth", teeth: toothData.map((t) => t.number) },
    {
      label: "Upper Arch",
      teeth: toothData
        .filter((t) => [1, 2].includes(t.quadrant))
        .map((t) => t.number),
    },
    {
      label: "Lower Arch",
      teeth: toothData
        .filter((t) => [3, 4].includes(t.quadrant))
        .map((t) => t.number),
    },
    {
      label: "Upper Right",
      teeth: toothData.filter((t) => t.quadrant === 1).map((t) => t.number),
    },
    {
      label: "Upper Left",
      teeth: toothData.filter((t) => t.quadrant === 2).map((t) => t.number),
    },
    {
      label: "Lower Left",
      teeth: toothData.filter((t) => t.quadrant === 3).map((t) => t.number),
    },
    {
      label: "Lower Right",
      teeth: toothData.filter((t) => t.quadrant === 4).map((t) => t.number),
    },
  ];

  const handleQuickSelect = (teethNumbers: number[]) => {
    onSelectTeeth(teethNumbers);
  };

  const clearSelection = () => {
    onSelectTeeth([]);
    setSelectedToothForDetails(null);
    if (isMobile) setActiveMobileTab("teeth");
  };

  // Open detailed view for a single tooth
  const openToothDetails = (tooth: ToothData) => {
    setSelectedToothForDetails(tooth);
    setActiveMobileTab("details");
  };

  // Render tooth details panel (mobile view)
  const renderToothDetailsPanel = () => {
    if (!selectedToothForDetails) return null;

    const tooth = selectedToothForDetails;
    const condition = {}; // You'll need to pass conditions here

    return (
      <div className="bg-white h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveMobileTab("teeth")}
              className="text-gray-500"
            >
              ← Back
            </button>
            <div>
              <h3 className="font-semibold">Tooth #{tooth.number}</h3>
              <p className="text-xs text-gray-500">{tooth.name}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Q{tooth.quadrant}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Tooth Image */}
          <div className="flex justify-center">
            <div className="relative">
              <ToothSVG
                type={tooth.svgName}
                width={120}
                height={120}
                rotation={tooth.rotation}
                color="#4b5563"
              />
            </div>
          </div>

          {/* Surface Selection */}
          <div className="border rounded-xl p-4 bg-gray-50">
            <h4 className="font-medium mb-3 text-center">Select Surfaces</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                "buccal",
                "lingual",
                "mesial",
                "distal",
                "occlusal",
                "entire",
              ].map((surface) => {
                const surfaceColors = {
                  buccal: "#f59e0b",
                  lingual: "#8b5cf6",
                  mesial: "#3b82f6",
                  distal: "#10b981",
                  occlusal: "#ef4444",
                  entire: "#6b7280",
                };

                return (
                  <button
                    key={surface}
                    type="button"
                    className="flex flex-col items-center p-3 border rounded-lg hover:bg-white transition-colors"
                    onClick={() => {
                      // Handle surface selection
                      console.log(`Selected ${surface} surface`);
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full mb-2 flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        backgroundColor:
                          surfaceColors[surface as keyof typeof surfaceColors],
                      }}
                    >
                      {surface.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs capitalize">{surface}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="font-medium mb-2">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              {["Caries", "Filling", "Extraction", "Root Canal"].map(
                (action) => (
                  <button
                    key={action}
                    type="button"
                    className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
                  >
                    {action}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Procedure Selection */}
          <div>
            <h4 className="font-medium mb-2">Add Procedure</h4>
            <select className="w-full border rounded-lg p-2 text-sm mb-2">
              <option value="">Select procedure...</option>
              {DENTAL_PROCEDURES.slice(0, 6).map((proc) => (
                <option key={proc} value={proc}>
                  {proc}
                </option>
              ))}
            </select>
            <textarea
              className="w-full border rounded-lg p-2 text-sm"
              placeholder="Notes..."
              rows={2}
            />
          </div>

          {/* Save Button */}
          <button
            type="button"
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium"
            onClick={() => {
              // Handle save
              setActiveMobileTab("teeth");
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  };

  // Render teeth selection panel
  const renderTeethSelectionPanel = () => (
    <>
      {/* Search and Quick Actions */}
      <div className="p-3 border-b bg-gray-50 sticky top-0 z-10">
        <input
          type="text"
          placeholder="Search tooth number or name..."
          className="w-full px-3 py-2 border rounded text-sm mb-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Quick selection buttons - Horizontal scroll on mobile */}
        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-1 px-1">
          {quickSelections.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickSelect(item.teeth)}
              className="px-3 py-1.5 text-xs border rounded bg-white hover:bg-gray-100 whitespace-nowrap flex-shrink-0"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Teeth Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(teethByQuadrant).map(
          ([quadrantName, teeth]) =>
            teeth.length > 0 && (
              <div key={quadrantName} className="mb-4">
                <div className="sticky top-14 bg-gray-100 px-3 py-2 font-medium text-sm z-5">
                  {quadrantName}
                </div>
                <div className="grid grid-cols-3 gap-2 p-2">
                  {teeth.map((tooth) => {
                    const isSelected = selectedTeeth.includes(tooth.number);
                    return (
                      <button
                        key={tooth.number}
                        type="button"
                        onClick={() =>
                          isMobile
                            ? openToothDetails(tooth)
                            : handleToothToggle(tooth.number)
                        }
                        className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold mb-2 ${
                            isSelected
                              ? "bg-primary-foreground text-primary"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {tooth.number}
                        </div>
                        <div className="text-xs text-center">
                          {tooth.name.split(" ")[0]}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1">
                            <CheckSquare className="h-4 w-4" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ),
        )}
      </div>

      {/* Selection Summary - Fixed at bottom on mobile */}
      <div className="border-t bg-white p-3 sticky bottom-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {selectedTeeth.length} selected
          </span>
          {selectedTeeth.length > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Clear all
            </button>
          )}
        </div>

        {selectedTeeth.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {selectedTeeth.slice(0, 6).map((num) => (
              <Badge
                key={num}
                variant="secondary"
                className="flex items-center gap-1"
              >
                #{num}
                <button
                  type="button"
                  onClick={() => handleToothToggle(num)}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedTeeth.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{selectedTeeth.length - 6} more
              </Badge>
            )}
          </div>
        )}

        {selectedTeeth.length > 0 && selectionMode === "multiple" && (
          <button
            type="button"
            onClick={onOpenMultiToothModal}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700"
          >
            Edit {selectedTeeth.length} Teeth
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 flex items-center justify-between px-4 py-3 border rounded-lg bg-white hover:bg-gray-50"
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              <span>
                {selectedTeeth.length === 0
                  ? "Select teeth..."
                  : `${selectedTeeth.length} tooth${selectedTeeth.length !== 1 ? "s" : ""} selected`}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {selectedTeeth.length > 0 &&
            selectionMode === "multiple" &&
            !isMobile && (
              <Button
                onClick={onOpenMultiToothModal}
                size="sm"
                className="whitespace-nowrap"
                disabled={disabled}
              >
                Edit {selectedTeeth.length}
              </Button>
            )}
        </div>

        {/* Selected teeth pills */}
        {selectedTeeth.length > 0 && !isOpen && (
          <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50">
            {selectedTeeth.slice(0, 5).map((num) => (
              <Badge
                key={num}
                variant="secondary"
                className="flex items-center gap-1"
              >
                #{num}
                <button
                  type="button"
                  onClick={() => handleToothToggle(num)}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedTeeth.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{selectedTeeth.length - 5} more
              </Badge>
            )}
            <button
              type="button"
              onClick={clearSelection}
              className="ml-auto text-xs text-red-500 hover:text-red-700"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 overflow-hidden flex flex-col ${
            isMobile ? "h-[80vh]" : "max-h-[60vh]"
          }`}
        >
          {isMobile && activeMobileTab === "details"
            ? renderToothDetailsPanel()
            : renderTeethSelectionPanel()}
        </div>
      )}
    </div>
  );
};

// Dropdown Surface Selection Component
const DropdownSurfaceSelector: React.FC<{
  selectedSurfaces: string[];
  onSelectSurfaces: (surfaces: string[]) => void;
  mode: "view" | "edit";
}> = ({ selectedSurfaces, onSelectSurfaces, mode }) => {
  const surfaces = [
    { id: "buccal", label: "Buccal (Cheek side)", color: "#f59e0b" },
    { id: "lingual", label: "Lingual (Tongue side)", color: "#8b5cf6" },
    { id: "mesial", label: "Mesial (Front side)", color: "#3b82f6" },
    { id: "distal", label: "Distal (Back side)", color: "#10b981" },
    { id: "occlusal", label: "Occlusal (Biting surface)", color: "#ef4444" },
    { id: "entire", label: "Entire Tooth", color: "#6b7280" },
  ];

  const handleSurfaceToggle = (surfaceId: string) => {
    const newSurfaces = selectedSurfaces.includes(surfaceId)
      ? selectedSurfaces.filter((s) => s !== surfaceId)
      : [...selectedSurfaces, surfaceId];
    onSelectSurfaces(newSurfaces);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Select Surfaces</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {surfaces.map((surface) => {
          const isSelected = selectedSurfaces.includes(surface.id);
          return (
            <button
              key={surface.id}
              type="button"
              onClick={() => mode === "edit" && handleSurfaceToggle(surface.id)}
              disabled={mode === "view"}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                isSelected ? "ring-2 ring-offset-1" : "hover:bg-gray-50"
              } ${mode === "view" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              style={{
                borderColor: isSelected ? surface.color : "#e5e7eb",
                backgroundColor: isSelected ? `${surface.color}20` : "white",
              }}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: surface.color }}
              />
              <span className="text-sm font-medium capitalize">
                {surface.id}
              </span>
              {isSelected && (
                <CheckSquare className="h-4 w-4 ml-auto text-gray-600" />
              )}
            </button>
          );
        })}
      </div>

      {selectedSurfaces.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {selectedSurfaces.map((surface) => {
              const surfaceInfo = surfaces.find((s) => s.id === surface);
              return (
                <Badge
                  key={surface}
                  variant="secondary"
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: surfaceInfo?.color,
                    color: "white",
                  }}
                >
                  {surfaceInfo?.id}
                  {mode === "edit" && (
                    <button
                      type="button"
                      onClick={() => handleSurfaceToggle(surface)}
                      className="ml-1 hover:text-white/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default function DentalChart({
  patientId,
  visitId,
  mode = "edit",
  patientName,
  patientUniqueId,
  onClose,
  onSave,
  onProcedureAdded,
  existingConditions = [],
  onToothSelected,
  existingTreatmentPlan,
  existingSoftTissues = [],
  existingTMJExaminations = [],
}: DentalChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<ToothData | null>(null);
  const [toothConditions, setToothConditions] =
    useState<ToothCondition[]>(existingConditions);
  const [softTissues, setSoftTissues] = useState<SoftTissueExamination[]>(
    () => {
      if (existingSoftTissues && existingSoftTissues.length > 0) {
        return existingSoftTissues;
      }
      // Initialize with empty arrays for all soft tissues
      return SOFT_TISSUE_DATA.map((tissue) => ({
        ...tissue,
        onExamination: [],
        diagnosis: [],
        treatment: [],
      }));
    },
  );
  const [tmjExaminations, setTMJExaminations] = useState<TMJExamination[]>(
    () => {
      if (existingTMJExaminations && existingTMJExaminations.length > 0) {
        return existingTMJExaminations;
      }
      // Initialize with empty arrays for all TMJ examinations
      return TMJ_DATA.map((tmj) => ({
        ...tmj,
        onExamination: [],
        diagnosis: [],
        treatment: [],
      }));
    },
  );
  const [selectedSoftTissue, setSelectedSoftTissue] =
    useState<SoftTissueExamination | null>(null);
  const [selectedTMJ, setSelectedTMJ] = useState<TMJExamination | null>(null);
  const [chartType, setChartType] = useState<"adult" | "pediatric">("adult");
  const [selectedQuadrant, setSelectedQuadrant] = useState<
    "all" | 1 | 2 | 3 | 4
  >("all");
  const [showTreatmentPlanForm, setShowTreatmentPlanForm] = useState(false);
  const [selectedStage, setSelectedStage] = useState(1);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlanData | null>(
    existingTreatmentPlan || null,
  );

  // Multiple Teeth Selection States
  const [selectionMode, setSelectionMode] = useState<"single" | "multiple">(
    "single",
  );
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [multipleSelectionType, setMultipleSelectionType] = useState<
    | "full-mouth"
    | "upper"
    | "lower"
    | "upper-right"
    | "upper-left"
    | "lower-right"
    | "lower-left"
    | "custom"
  >("full-mouth");

  // NEW: Multi-tooth modal state
  const [showMultiToothModal, setShowMultiToothModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  // NEW: Active Tab State
  const [activeTab, setActiveTab] = useState<"teeth" | "soft-tissue" | "tmj">(
    "teeth",
  );
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([
    "occlusal",
  ]);

  // NEW: Procedure selection state
  const [selectedProcedure, setSelectedProcedure] = useState("");
  const [procedureNotes, setProcedureNotes] = useState("");
  const [procedureCost, setProcedureCost] = useState<number>(0);
  const [useDropdownView, setUseDropdownView] = useState(false);
  const toothData =
    chartType === "adult" ? ADULT_TOOTH_DATA : PEDIATRIC_TOOTH_DATA;

  useEffect(() => {
    if (existingTreatmentPlan) {
      console.log("🔄 Existing treatment plan detected, auto-opening form...");
      // Auto-open treatment plan form after a short delay
      const timer = setTimeout(() => {
        setShowTreatmentPlanForm(true);
        console.log("✅ Treatment plan form opened for editing");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [existingTreatmentPlan]);
  // Check window width on mount and resize
  useEffect(() => {
    const checkWidth = () => {
      setUseDropdownView(window.innerWidth < 768); // Switch to dropdown on mobile
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Function to get tooth numbers based on selection type
  const getTeethNumbersBySelectionType = (type: string): number[] => {
    const allTeeth =
      chartType === "adult"
        ? ADULT_TOOTH_DATA.map((t) => t.number)
        : PEDIATRIC_TOOTH_DATA.map((t) => t.number);

    switch (type) {
      case "full-mouth":
        return allTeeth;
      case "upper":
        return allTeeth.filter((num) => num >= 11 && num <= 28);
      case "lower":
        return allTeeth.filter((num) => num >= 31 && num <= 48);
      case "upper-right":
        return allTeeth.filter((num) => num >= 11 && num <= 18);
      case "upper-left":
        return allTeeth.filter((num) => num >= 21 && num <= 28);
      case "lower-right":
        return allTeeth.filter((num) => num >= 41 && num <= 48);
      case "lower-left":
        return allTeeth.filter((num) => num >= 31 && num <= 38);
      default:
        return [];
    }
  };

  // Handle multiple teeth selection
  const handleMultipleSelection = (type: string) => {
    const teethNumbers = getTeethNumbersBySelectionType(type);
    setSelectedTeeth(teethNumbers);
    setMultipleSelectionType(type as any);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedTeeth([]);
    setMultipleSelectionType("full-mouth");
  };

  // Toggle individual tooth selection in custom mode
  const handleToothToggle = (toothNumber: number) => {
    if (selectionMode === "multiple" && multipleSelectionType === "custom") {
      setSelectedTeeth((prev) =>
        prev.includes(toothNumber)
          ? prev.filter((num) => num !== toothNumber)
          : [...prev, toothNumber],
      );
    }
  };

  // Open multi-tooth modal
  const handleOpenMultiToothModal = () => {
    if (selectedTeeth.length === 0) {
      alert("Please select teeth first");
      return;
    }
    setShowMultiToothModal(true);
  };

  // Save multi-tooth data
  const handleSaveMultiToothData = (data: {
    teethNumbers: number[];
    conditions: string[];
    procedures: any[];
    surfaceConditions: { surface: string; conditions: string[] }[];
    notes?: string;
  }) => {
    const updatedConditions = [...toothConditions];

    data.teethNumbers.forEach((toothNumber) => {
      const existingIndex = updatedConditions.findIndex(
        (tc) => tc.toothNumber === toothNumber,
      );

      if (existingIndex >= 0) {
        // Update existing condition
        const existing = updatedConditions[existingIndex];
        updatedConditions[existingIndex] = {
          ...existing,
          conditions: [
            ...new Set([...existing.conditions, ...data.conditions]),
          ],
          notes: data.notes || existing.notes,
          surfaceConditions: [
            ...existing.surfaceConditions,
            ...data.surfaceConditions.map((sc) => ({
              surface: sc.surface,
              conditions: sc.conditions,
            })),
          ],
          procedures: [
            ...existing.procedures,
            ...data.procedures.map((p) => ({
              ...p,
              date: p.date || new Date().toISOString(),
            })),
          ],
        };
      } else {
        // Create new condition
        const tooth = toothData.find((t) => t.number === toothNumber);
        updatedConditions.push({
          toothNumber,
          conditions: data.conditions,
          notes: data.notes || "",
          procedures: data.procedures.map((p) => ({
            ...p,
            date: p.date || new Date().toISOString(),
          })),
          surfaceConditions: data.surfaceConditions.map((sc) => ({
            surface: sc.surface,
            conditions: sc.conditions,
          })),
          color: "#4b5563",
        });
      }
    });

    setToothConditions(updatedConditions);
    setSelectedTeeth([]);
    setShowMultiToothModal(false);

    // Trigger any procedure added callbacks
    if (onProcedureAdded && data.procedures.length > 0) {
      data.teethNumbers.forEach((toothNumber) => {
        data.procedures.forEach((proc) => {
          onProcedureAdded(toothNumber, proc);
        });
      });
    }
  };

  // Handle soft tissue click
  const handleSoftTissueClick = (tissue: SoftTissueExamination) => {
    setSelectedSoftTissue(tissue);
  };

  // Handle TMJ click
  const handleTMJClick = (tmj: TMJExamination) => {
    setSelectedTMJ(tmj);
  };

  // Save soft tissue data
  const handleSaveSoftTissueData = (data: SoftTissueExamination) => {
    const existingIndex = softTissues.findIndex((st) => st.id === data.id);

    if (existingIndex >= 0) {
      const updated = [...softTissues];
      updated[existingIndex] = data;
      setSoftTissues(updated);
    } else {
      setSoftTissues([...softTissues, data]);
    }

    setSelectedSoftTissue(null);
  };

  // Save TMJ data
  const handleSaveTMJData = (data: TMJExamination) => {
    const existingIndex = tmjExaminations.findIndex(
      (tmj) => tmj.id === data.id,
    );

    if (existingIndex >= 0) {
      const updated = [...tmjExaminations];
      updated[existingIndex] = data;
      setTMJExaminations(updated);
    } else {
      setTMJExaminations([...tmjExaminations, data]);
    }

    setSelectedTMJ(null);
  };

  const formatDentalDataForAPI = () => {
    console.log("🦷 Formatting dental data for API...");

   // Format performed teeth (NO status filter)
const performedTeeth = toothConditions
  .filter(
    (tc) =>
      tc.conditions.length > 0 ||
      tc.surfaceConditions?.length > 0 ||
      tc.procedures?.length > 0, // No status filter
  )
  .map((tc) => ({
    toothNumber: tc.toothNumber,
    conditions: tc.conditions || [],
    surfaceConditions: (tc.surfaceConditions || []).map((sc) => ({
      surface: sc.surface,
      conditions: sc.conditions || [],
    })),
    procedures: (tc.procedures || []) // No status filter
      .map((p) => ({
        name: p.name,
        surface: p.surface || "occlusal",
        cost: p.cost || 0,
        notes: p.notes || "",
        performedAt: p.date || new Date().toISOString(),
      })),
  }));

    console.log("✅ Performed teeth:", performedTeeth);

  // Format planned procedures for treatment plan (NO status)
const plannedProcedures = toothConditions.flatMap((tc) =>
  (tc.procedures || [])
    .filter(p => p.name) 
    .map((p) => ({
      toothNumber: tc.toothNumber,
      name: p.name,
      surface: p.surface || "occlusal",
      estimatedCost: p.cost || 0,
      notes: p.notes || "",
    })),
);
    console.log("✅ Planned procedures:", plannedProcedures);

    // ✅ Format treatment plan for backend
    let formattedTreatmentPlan = null;
    if (treatmentPlan) {
      console.log("📋 Formatting treatment plan for backend...");

      // Check if any procedures are in Stage 1 (for startToday logic)
      const stage1Procedures = treatmentPlan.teeth.flatMap((t) =>
        t.procedures.filter((p) => p.stage === 1),
      );
      const shouldStartToday = stage1Procedures.length > 0; // Simple logic

      console.log(`Stage 1: ${stage1Procedures.length} procedures`);
      console.log(`Should start today: ${shouldStartToday}`);

      // Build stages with toothSurfaceProcedures and procedureRefs
      const proceduresByStage: Record<number, any[]> = {};

      treatmentPlan.teeth.forEach((toothPlan) => {
        toothPlan.procedures.forEach((proc: any) => {
          const stageNum = (proc as any).stage || 1;
          if (!proceduresByStage[stageNum]) {
            proceduresByStage[stageNum] = [];
          }

          proceduresByStage[stageNum].push({
            toothNumber: toothPlan.toothNumber,
            name: proc.name,
            surface: proc.surface || "occlusal",
            estimatedCost: proc.estimatedCost || 0,
            notes: proc.notes || "",
            // NO status field
          });
        });
      });

      // Create stages data
      const stagesData = treatmentPlan.stages.map((stage, index) => {
        const stageNumber = index + 1;
        const proceduresInThisStage = proceduresByStage[stageNumber] || [];

        // Group procedures by tooth and surface for toothSurfaceProcedures
        const toothSurfaceMap: Record<number, Record<string, string[]>> = {};

        // Create procedureRefs array
        const procedureRefs = proceduresInThisStage.map((proc) => ({
          toothNumber: proc.toothNumber,
          procedureName: proc.name,
        }));

        proceduresInThisStage.forEach((proc) => {
          if (!toothSurfaceMap[proc.toothNumber]) {
            toothSurfaceMap[proc.toothNumber] = {};
          }

          const surfaceKey = proc.surface || "occlusal";
          if (!toothSurfaceMap[proc.toothNumber][surfaceKey]) {
            toothSurfaceMap[proc.toothNumber][surfaceKey] = [];
          }

          if (
            !toothSurfaceMap[proc.toothNumber][surfaceKey].includes(proc.name)
          ) {
            toothSurfaceMap[proc.toothNumber][surfaceKey].push(proc.name);
          }
        });

        // Convert to toothSurfaceProcedures format
        const toothSurfaceProcedures = Object.entries(toothSurfaceMap).map(
          ([toothNumStr, surfaces]) => {
            const surfaceProcedures = Object.entries(surfaces).map(
              ([surface, procedureNames]) => ({
                surface: surface,
                procedureNames: procedureNames,
              }),
            );

            return {
              toothNumber: parseInt(toothNumStr),
              surfaceProcedures: surfaceProcedures,
            };
          },
        );

        return {
          stageNumber: stageNumber,
          stageName: stage.stageName || `Stage ${stageNumber}`,
          description: stage.description || "",
          // ✅ Required procedureRefs property
          procedureRefs: procedureRefs,
          status: stage.status || "pending",
          scheduledDate:
            stage.scheduledDate || new Date().toISOString().split("T")[0],
          // ✅ Optional toothSurfaceProcedures
          toothSurfaceProcedures: toothSurfaceProcedures,
          notes: stage.notes || "",
          ...(stage.status === "in-progress" && {
            startedAt: new Date().toISOString(),
          }),
          ...(stage.status === "completed" && {
            completedAt: new Date().toISOString(),
          }),
        };
      });

      formattedTreatmentPlan = {
        planName: treatmentPlan.planName.trim(),
        description: treatmentPlan.description?.trim() || "",
        teeth: treatmentPlan.teeth.map((toothPlan) => ({
          toothNumber: toothPlan.toothNumber,
          priority: toothPlan.priority || "medium",
          isCompleted: false,
          procedures: toothPlan.procedures.map((proc) => ({
            name: proc.name,
            surface: proc.surface || "occlusal",
            stage: proc.stage || 1,
            estimatedCost: proc.estimatedCost || 0,
            notes: proc.notes || "",
            // NO status field
          })),
        })),
        stages: stagesData,
        startToday: shouldStartToday,
      };

      console.log("✅ Final treatment plan structure:", {
        planName: formattedTreatmentPlan.planName,
        teethCount: formattedTreatmentPlan.teeth.length,
        stagesCount: formattedTreatmentPlan.stages.length,
        startToday: formattedTreatmentPlan.startToday,
        totalProcedures: formattedTreatmentPlan.teeth.reduce(
          (sum: number, t: any) => sum + t.procedures.length,
          0,
        ),
      });

      // Log each stage status
      console.log("📊 Stage Statuses being sent:");
      formattedTreatmentPlan.stages.forEach((stage: any, index: number) => {
        console.log(
          `  Stage ${stage.stageNumber}: ${stage.stageName} - Status: ${stage.status}`,
        );
      });
    }

    return {
      performedTeeth,
      plannedProcedures,
      treatmentPlan: formattedTreatmentPlan,
      softTissues,
      tmjExaminations,
    };
  };
const handleClose = () => {
  console.log("🦷 DentalChart handleClose called");

  // Log current state for debugging
  console.log("🔍 Current state before closing:", {
    toothConditionsCount: toothConditions.length,
    toothConditions: toothConditions.map(tc => ({
      toothNumber: tc.toothNumber,
      hasConditions: tc.conditions?.length > 0,
      hasSurfaceConditions: tc.surfaceConditions?.length > 0,
      hasProcedures: tc.procedures?.length > 0,
      proceduresWithNames: tc.procedures?.filter(p => p.name && p.name.trim()).length || 0
    })),
    softTissuesCount: softTissues.length,
    tmjExaminationsCount: tmjExaminations.length
  });

  // Always format and send data, even if empty
  const dentalData = formatDentalDataForAPI();

  // ✅ FIXED: Check if there's actually any meaningful data
  // First, check if toothConditions has any actual data (not just empty objects)
  const hasActualToothConditions = toothConditions.some(tc => 
    (tc.conditions && tc.conditions.length > 0) ||
    (tc.surfaceConditions && tc.surfaceConditions.length > 0) ||
    (tc.procedures && tc.procedures.some(p => p.name && p.name.trim()))
  );

  // Check soft tissues for actual findings (not empty arrays)
  const hasActualSoftTissues = softTissues.some(st => 
    (st.onExamination && st.onExamination.length > 0) ||
    (st.diagnosis && st.diagnosis.length > 0) ||
    (st.treatment && st.treatment.length > 0)
  );

  // Check TMJ examinations for actual findings
  const hasActualTMJExaminations = tmjExaminations.some(tmj => 
    (tmj.onExamination && tmj.onExamination.length > 0) ||
    (tmj.diagnosis && tmj.diagnosis.length > 0) ||
    (tmj.treatment && tmj.treatment.length > 0)
  );

  // Check treatment plan
  const hasActualTreatmentPlan = !!treatmentPlan && 
    treatmentPlan.teeth && 
    treatmentPlan.teeth.length > 0 &&
    treatmentPlan.teeth.some(t => t.procedures && t.procedures.length > 0);

  const hasData = hasActualToothConditions || hasActualSoftTissues || 
                  hasActualTMJExaminations || hasActualTreatmentPlan;

  console.log("📊 Data check:", {
    hasActualToothConditions,
    hasActualSoftTissues,
    hasActualTMJExaminations,
    hasActualTreatmentPlan,
    hasData
  });

  // Always send data to parent
  if (onSave) {
    onSave(dentalData);
  }

  // Show alert ONLY if there's actual data
  if (hasData) {
    alert("✅ Dental chart data saved successfully!");
  } else {
    console.log("ℹ️ No actual data found, closing without alert");
  }

  // Close the component
  if (onClose) onClose();
};
  // Function to get teeth sorted by their X position for proper display
  const getSortedTeethByQuadrant = (quadrant: number) => {
    const teethInQuadrant = toothData.filter((t) => t.quadrant === quadrant);
    return teethInQuadrant.sort((a, b) => a.position.x - b.position.x);
  };

  const getToothColor = (toothNumber: number) => {
    const condition = toothConditions.find(
      (tc) => tc.toothNumber === toothNumber,
    );
    if (!condition) return "#4b5563";

    if (condition.conditions.includes("Missing")) return "#9ca3af";
    if (condition.conditions.includes("Caries")) return "#ef4444";
    if (condition.conditions.includes("Filling")) return "#3b82f6";
    if (condition.conditions.includes("Crown")) return "#f59e0b";
    if (condition.conditions.includes("Root Canal")) return "#8b5cf6";
    return condition.color || "#4b5563";
  };

  const handleToothClick = (tooth: ToothData) => {
    if (activeTab !== "teeth") return;

    if (selectionMode === "multiple") {
      // In multiple mode, toggle selection instead of opening popup
      handleToothToggle(tooth.number);
    } else {
      // Single mode - open tooth popup
      setSelectedTooth(tooth);
      if (onToothSelected) {
        const condition =
          toothConditions.find((tc) => tc.toothNumber === tooth.number) || null;
        onToothSelected(tooth, condition);
      }
    }
  };

  const handleSaveToothData = (data: Partial<ToothCondition>) => {
    if (!selectedTooth) return;

    const existingIndex = toothConditions.findIndex(
      (tc) => tc.toothNumber === selectedTooth.number,
    );

    const updatedCondition: ToothCondition = {
      toothNumber: selectedTooth.number,
      conditions: data.conditions || [],
      notes: data.notes || "",
      procedures: data.procedures || [],
      surfaceConditions: data.surfaceConditions || [],
      color: getToothColor(selectedTooth.number),
    };

    if (existingIndex >= 0) {
      const updated = [...toothConditions];
      updated[existingIndex] = updatedCondition;
      setToothConditions(updated);
    } else {
      setToothConditions([...toothConditions, updatedCondition]);
    }

    if (data.procedures && data.procedures.length > 0 && onProcedureAdded) {
      const newProcedure = data.procedures[data.procedures.length - 1];
      onProcedureAdded(selectedTooth.number, newProcedure);
    }

    setSelectedTooth(null);
  };

  const getConditionSummary = () => {
    const stats = {
      totalTeeth: toothData.length,
      affectedTeeth: toothConditions.length,
      caries: toothConditions.filter((tc) => tc.conditions.includes("Caries"))
        .length,
      missing: toothConditions.filter((tc) => tc.conditions.includes("Missing"))
        .length,
      fillings: toothConditions.filter((tc) =>
        tc.conditions.includes("Filling"),
      ).length,
      procedures: toothConditions.reduce(
        (sum, tc) => sum + (tc.procedures?.length || 0),
        0,
      ),
      softTissuesExamined: softTissues.filter(
        (st) =>
          st.onExamination.length > 0 ||
          st.diagnosis.length > 0 ||
          st.treatment.length > 0,
      ).length,
      tmjExamined: tmjExaminations.filter(
        (tmj) =>
          tmj.onExamination.length > 0 ||
          tmj.diagnosis.length > 0 ||
          tmj.treatment.length > 0,
      ).length,
    };
    return stats;
  };

  // const handleCreateTreatmentPlan = () => {
  //   setShowTreatmentPlanForm(true);
  // };

  // const handleSaveTreatmentPlan = (plan: TreatmentPlanData) => {
  //   console.log("✅ Received plan from form WITH TEETH:", plan);

  //   // Verify that teeth data exists
  //   if (!plan.teeth || plan.teeth.length === 0) {
  //     console.error("❌ Treatment plan has no teeth data!");
  //     alert(
  //       "Error: Treatment plan must include teeth procedures. Please add procedures to teeth.",
  //     );
  //     return;
  //   }

  //   // CRITICAL FIX: Ensure stages have proper status from the plan
  //   const enhancedPlan = {
  //     ...plan,
  //     stages: plan.stages.map((stage, index) => {
  //       // Preserve the status from the form (which comes from the stage status toggle buttons)
  //       const stageFromPlan = plan.stages[index];
  //       return {
  //         ...stage,
  //         status: stageFromPlan?.status || "pending", // Use the status from the form
  //         stageNumber: index + 1, // Ensure stage numbers are sequential
  //       };
  //     }),
  //     teeth: plan.teeth,
  //   };

  //   console.log("✅ Enhanced treatment plan with statuses:", enhancedPlan);
  //   console.log("📊 Stage Statuses:");
  //   enhancedPlan.stages.forEach((stage, index) => {
  //     console.log(
  //       `  Stage ${index + 1}: ${stage.stageName} - Status: ${stage.status}`,
  //     );
  //   });

  //   setTreatmentPlan(enhancedPlan);
  //   setShowTreatmentPlanForm(false);
  // };

  const stats = getConditionSummary();

  // Get teeth for each arch based on selected quadrant
  const getTeethForDisplay = () => {
    if (selectedQuadrant === "all") {
      return {
        upperRight: getSortedTeethByQuadrant(1),
        upperLeft: getSortedTeethByQuadrant(2),
        lowerRight: getSortedTeethByQuadrant(4),
        lowerLeft: getSortedTeethByQuadrant(3),
      };
    } else if (selectedQuadrant === 1) {
      return {
        upperRight: getSortedTeethByQuadrant(1),
        upperLeft: [],
        lowerRight: [],
        lowerLeft: [],
      };
    } else if (selectedQuadrant === 2) {
      return {
        upperRight: [],
        upperLeft: getSortedTeethByQuadrant(2),
        lowerRight: [],
        lowerLeft: [],
      };
    } else if (selectedQuadrant === 3) {
      return {
        upperRight: [],
        upperLeft: [],
        lowerRight: [],
        lowerLeft: getSortedTeethByQuadrant(3),
      };
    } else if (selectedQuadrant === 4) {
      return {
        upperRight: [],
        upperLeft: [],
        lowerRight: getSortedTeethByQuadrant(4),
        lowerLeft: [],
      };
    }

    // Default to all
    return {
      upperRight: getSortedTeethByQuadrant(1),
      upperLeft: getSortedTeethByQuadrant(2),
      lowerRight: getSortedTeethByQuadrant(4),
      lowerLeft: getSortedTeethByQuadrant(3),
    };
  };

  const displayTeeth = getTeethForDisplay();
  const upperRightTeeth = displayTeeth.upperRight;
  const upperLeftTeeth = displayTeeth.upperLeft;
  const lowerRightTeeth = displayTeeth.lowerRight;
  const lowerLeftTeeth = displayTeeth.lowerLeft;

  // NEW: Quick Add Procedure Function
  const handleQuickAddProcedure = () => {
    if (selectedTeeth.length === 0) {
      alert("Please select teeth first");
      return;
    }

    if (!selectedProcedure) {
      alert("Please select a procedure");
      return;
    }

    const newProcedures = selectedTeeth.map((toothNumber) => ({
      name: selectedProcedure,
      surface: selectedSurfaces[0] || "occlusal",
      cost: procedureCost,
      notes: procedureNotes,
      date: new Date().toISOString(),
    }));

    // Update each selected tooth with the procedure
    const updatedConditions = [...toothConditions];

    selectedTeeth.forEach((toothNumber) => {
      const existingIndex = updatedConditions.findIndex(
        (tc) => tc.toothNumber === toothNumber,
      );
      const tooth = toothData.find((t) => t.number === toothNumber);

      if (existingIndex >= 0) {
        updatedConditions[existingIndex] = {
          ...updatedConditions[existingIndex],
          procedures: [
            ...updatedConditions[existingIndex].procedures,
            {
              name: selectedProcedure,
              surface: selectedSurfaces[0] || "occlusal",
              cost: procedureCost,
              notes: procedureNotes,
              date: new Date().toISOString(),
            },
          ],
        };
      } else {
        updatedConditions.push({
          toothNumber,
          conditions: [],
          notes: "",
          procedures: [
            {
              name: selectedProcedure,
              surface: selectedSurfaces[0] || "occlusal",
              cost: procedureCost,
              notes: procedureNotes,
              date: new Date().toISOString(),
            },
          ],
          surfaceConditions: [],
          color: "#4b5563",
        });
      }

      // Trigger procedure added callback
      if (onProcedureAdded) {
        onProcedureAdded(toothNumber, {
          name: selectedProcedure,
          surface: selectedSurfaces[0] || "occlusal",
          cost: procedureCost,
          notes: procedureNotes,
        });
      }
    });

    setToothConditions(updatedConditions);
    setShowQuickAddModal(false);

    // Reset form
    setSelectedProcedure("");
    setProcedureNotes("");
    setProcedureCost(0);
  };
const getToothSize = () => {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    if (width < 640) return 42; 
    if (width < 768) return 46; 
    if (width < 1024) return 50; 
    if (width < 1280) return 54; 
    return 58; 
  }
  return chartType === "adult" ? 52 : 48;
};

const renderTeethTab = () => (
  <div className="space-y-6">
    {/* Control buttons - unchanged */}
    <div className="flex flex-wrap items-center gap-4 mt-1">
      {/* Chart Type */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Chart:</span>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          {["adult", "pediatric"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setChartType(type as "adult" | "pediatric")}
              className={`px-3 py-1 text-sm transition-all ${
                chartType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {type === "adult" ? "Adult" : "Pediatric"}
            </button>
          ))}
        </div>
      </div>

      {/* Quadrant */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Quadrant:</span>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          {["all", 1, 2, 3, 4].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() =>
                setSelectedQuadrant(q === "all" ? "all" : (q as 1 | 2 | 3 | 4))
              }
              className={`px-3 py-1 text-sm transition-all ${
                selectedQuadrant === q
                  ? "bg-primary text-primary-foreground"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {q === "all" ? "All" : `Q${q}`}
            </button>
          ))}
        </div>
      </div>

      {/* Multi Select Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Multi-select:</span>
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1 bg-white">
          <span className="text-sm text-gray-700">
            {selectionMode === "multiple" ? "On" : "Off"}
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
            className={`relative w-9 h-5 rounded-full transition-colors ${
              selectionMode === "multiple" ? "bg-primary" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                selectionMode === "multiple"
                  ? "translate-x-4"
                  : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>

    {/* Selection Options as Tabs (only shown when multi-select is enabled) */}
    {selectionMode === "multiple" && (
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600">Select:</span>
        {[
          { type: "full-mouth", label: "Full" },
          { type: "upper", label: "Upper" },
          { type: "lower", label: "Lower" },
          { type: "upper-right", label: "Upper Right" },
          { type: "upper-left", label: "Upper Left" },
          { type: "lower-right", label: "Lower Right" },
          { type: "lower-left", label: "Lower Left" },
          { type: "custom", label: "Custom" },
        ].map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => {
              if (item.type === "custom") {
                setMultipleSelectionType("custom");
                setSelectedTeeth([]);
              } else {
                handleMultipleSelection(item.type);
              }
            }}
            className={`px-2.5 py-[2px] text-sm rounded-md border transition-all ${
              multipleSelectionType === item.type
                ? "bg-primary/10 border-primary text-primary"
                : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </button>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        {selectedTeeth.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {selectedTeeth.length}
            </span>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-2.5 py-[2px] text-sm rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleOpenMultiToothModal}
              className="px-2.5 py-[2px] text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    )}

    {/* Teeth Chart - UPDATED AS REQUESTED */}
<div className="relative border border-border rounded-xl bg-white p-3 md:p-5">
  {/* Vertical midline - separates left and right sides */}
  <div className="absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2">
    <div className="w-px h-full bg-gray-200"></div>
  </div>

  {/* Upper Arch */}
  {(upperRightTeeth.length > 0 || upperLeftTeeth.length > 0) && (
    <div className="flex justify-center items-center gap-1.5 sm:gap-2 md:gap-2.5 mb-6 sm:mb-8 md:mb-10">
      {/* Quadrant 1 - Upper Right */}
      {upperRightTeeth.map((tooth) => {
        const condition = toothConditions.find(
          (tc) => tc.toothNumber === tooth.number
        );
        const isSelected = selectedTeeth.includes(tooth.number);

        return (
          <div
            key={tooth.number}
            className="relative group flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => handleToothClick(tooth)}
              className="relative transition-all hover:scale-105 active:scale-95"
              disabled={mode === "view" && selectionMode === "multiple"}
            >
              <div className="p-1 sm:p-1.5">
                <ToothSVG
                  type={tooth.svgName}
                  color={isSelected ? "#22c55e" : getToothColor(tooth.number)}
                  width={getToothSize()}
                  height={getToothSize()}
                  rotation={tooth.rotation}
                />
              </div>
              {isSelected && (
                <div className="absolute inset-0 bg-green-500/20 rounded-md pointer-events-none"></div>
              )}
              {condition && !isSelected && (
                <div className="absolute -top-2 sm:-top-2.5 left-1/2 transform -translate-x-1/2">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${condition.conditions.length > 0 ? "animate-pulse" : ""}`}
                      style={{
                        backgroundColor: getToothColor(tooth.number),
                      }}
                    />
                    {condition.procedures?.length > 0 && (
                      <div className="mt-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
              )}
            </button>
            <div className={`mt-1.5 text-[11px] sm:text-xs font-semibold mb-2 ${
              isSelected ? "text-green-600" : "text-gray-700"
            }`}>
              {tooth.number}
            </div>
          </div>
        );
      })}

      {/* Quadrant 2 - Upper Left */}
      {upperLeftTeeth.map((tooth) => {
        const condition = toothConditions.find(
          (tc) => tc.toothNumber === tooth.number
        );
        const isSelected = selectedTeeth.includes(tooth.number);

        return (
          <div
            key={tooth.number}
            className="relative group flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => handleToothClick(tooth)}
              className="relative transition-all hover:scale-105 active:scale-95"
              disabled={mode === "view" && selectionMode === "multiple"}
            >
              <div className="p-1 sm:p-1.5">
                <ToothSVG
                  type={tooth.svgName}
                  color={isSelected ? "#22c55e" : getToothColor(tooth.number)}
                  width={getToothSize()}
                  height={getToothSize()}
                  rotation={tooth.rotation}
                />
              </div>
              {isSelected && (
                <div className="absolute inset-0 bg-green-500/20 rounded-md pointer-events-none"></div>
              )}
              {condition && !isSelected && (
                <div className="absolute -top-2 sm:-top-2.5 left-1/2 transform -translate-x-1/2">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${condition.conditions.length > 0 ? "animate-pulse" : ""}`}
                      style={{
                        backgroundColor: getToothColor(tooth.number),
                      }}
                    />
                    {condition.procedures?.length > 0 && (
                      <div className="mt-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
              )}
            </button>
            <div className={`mt-1.5 text-[11px] sm:text-xs font-semibold mb-2 ${
              isSelected ? "text-green-600" : "text-gray-700"
            }`}>
              {tooth.number}
            </div>
          </div>
        );
      })}
    </div>
  )}

  {/* Horizontal midline - optional if you still want it */}
  {/* <div className="flex justify-center my-3">
    <div className="h-px w-11/12 bg-gray-200"></div>
  </div> */}

  {/* Lower Arch - WITH NUMBER BELOW TEETH */}
  {(lowerRightTeeth.length > 0 || lowerLeftTeeth.length > 0) && (
    <div className="flex justify-center items-center gap-1.5 sm:gap-2 md:gap-2.5 mt-6 sm:mt-8 md:mt-10">
      {/* Quadrant 4 - Lower Right */}
      {lowerRightTeeth.map((tooth) => {
        const condition = toothConditions.find(
          (tc) => tc.toothNumber === tooth.number
        );
        const isSelected = selectedTeeth.includes(tooth.number);

        return (
          <div
            key={tooth.number}
            className="relative group flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => handleToothClick(tooth)}
              className="relative transition-all hover:scale-105 active:scale-95"
              disabled={mode === "view" && selectionMode === "multiple"}
            >
              <div className="p-1 sm:p-1.5">
                <ToothSVG
                  type={tooth.svgName}
                  color={isSelected ? "#22c55e" : getToothColor(tooth.number)}
                  width={getToothSize()}
                  height={getToothSize()}
                  rotation={tooth.rotation}
                />
              </div>
              {isSelected && (
                <div className="absolute inset-0 bg-green-500/20 rounded-md pointer-events-none"></div>
              )}
              {condition && !isSelected && (
                <div className="absolute -bottom-2 sm:-bottom-2.5 left-1/2 transform -translate-x-1/2">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${condition.conditions.length > 0 ? "animate-pulse" : ""}`}
                      style={{
                        backgroundColor: getToothColor(tooth.number),
                      }}
                    />
                    {condition.procedures?.length > 0 && (
                      <div className="mt-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
              )}
            </button>
            <div className={`mt-1.5 text-[11px] sm:text-xs font-semibold mb-2 ${
              isSelected ? "text-green-600" : "text-gray-700"
            }`}>
              {tooth.number}
            </div>
          </div>
        );
      })}

      {/* Quadrant 3 - Lower Left */}
      {lowerLeftTeeth.map((tooth) => {
        const condition = toothConditions.find(
          (tc) => tc.toothNumber === tooth.number
        );
        const isSelected = selectedTeeth.includes(tooth.number);

        return (
          <div
            key={tooth.number}
            className="relative group flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => handleToothClick(tooth)}
              className="relative transition-all hover:scale-105 active:scale-95"
              disabled={mode === "view" && selectionMode === "multiple"}
            >
              <div className="p-1 sm:p-1.5">
                <ToothSVG
                  type={tooth.svgName}
                  color={isSelected ? "#22c55e" : getToothColor(tooth.number)}
                  width={getToothSize()}
                  height={getToothSize()}
                  rotation={tooth.rotation}
                />
              </div>
              {isSelected && (
                <div className="absolute inset-0 bg-green-500/20 rounded-md pointer-events-none"></div>
              )}
              {condition && !isSelected && (
                <div className="absolute -bottom-2 sm:-bottom-2.5 left-1/2 transform -translate-x-1/2">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${condition.conditions.length > 0 ? "animate-pulse" : ""}`}
                      style={{
                        backgroundColor: getToothColor(tooth.number),
                      }}
                    />
                    {condition.procedures?.length > 0 && (
                      <div className="mt-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
              )}
            </button>
            <div className={`mt-1.5 text-[11px] sm:text-xs font-semibold mb-2 ${
              isSelected ? "text-green-600" : "text-gray-700"
            }`}>
              {tooth.number}
            </div>
          </div>
        );
      })}
    </div>
  )}

  {/* Quadrant Labels - with adjusted bottom padding */}
{selectedQuadrant === "all" && (
  <>
    {/* Upper Left - Q1 */}
    <div className="absolute top-2 left-2">
      <Badge className="bg-blue-50 text-blue-700 text-xs border border-blue-200">
        Q1(UL)
      </Badge>
    </div>
    
    {/* Upper Right - Q2 */}
    <div className="absolute top-2 right-2">
      <Badge className="bg-green-50 text-green-700 text-xs border border-green-200">
        Q2(UR)
      </Badge>
    </div>
    
    {/* Lower Left - Q3 */}
    <div className="absolute bottom-2 left-2">
      <Badge className="bg-yellow-50 text-yellow-700 text-xs border border-yellow-200">
        Q3(LL)
      </Badge>
    </div>
    
    {/* Lower Right - Q4 */}
    <div className="absolute bottom-2 right-2">
      <Badge className="bg-red-50 text-red-700 text-xs border border-red-200">
        Q4(LR)
      </Badge>
    </div>
  </>
)}
</div>

    {/* Teeth Color Legend - simplified */}
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-full bg-[#ef4444]"></div>
        <span className="text-gray-700">Caries</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-full bg-[#3b82f6]"></div>
        <span className="text-gray-700">Filling</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-full bg-[#f59e0b]"></div>
        <span className="text-gray-700">Crown</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-full bg-[#8b5cf6]"></div>
        <span className="text-gray-700">Root Canal</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-full bg-[#9ca3af]"></div>
        <span className="text-gray-700">Missing</span>
      </div>
      {selectionMode === "multiple" && (
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-[#22c55e]"></div>
          <span className="text-gray-700">Selected</span>
        </div>
      )}
    </div>
  </div>
);
  const renderSoftTissueTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          <Stethoscope className="h-4 w-4 mr-2" />
          Soft Tissue Examination
        </Badge>
        <p className="text-sm text-muted-foreground mt-2">
          Click on any soft tissue area to examine and document findings
        </p>
      </div>

      {/* Soft Tissue Grid - Updated to 4x2 layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SOFT_TISSUE_DATA.map((tissue) => {
          const examination = softTissues.find((st) => st.id === tissue.id);
          const hasFindings =
            examination &&
            (examination.onExamination.length > 0 ||
              examination.diagnosis.length > 0 ||
              examination.treatment.length > 0);

          return (
            <div key={tissue.id} className="relative group">
              <button
                type="button"
                onClick={() => handleSoftTissueClick(tissue)}
                className="w-full border rounded-lg p-4 bg-white hover:bg-blue-50 transition-colors flex flex-col items-center gap-3"
              >
                <SoftTissueSVG
                  type={tissue.svgName}
                  width={80}
                  height={80}
                  color={hasFindings ? "#3b82f6" : "#9ca3af"}
                />
                <span className="font-medium text-sm text-center">
                  {tissue.name}
                </span>

                {hasFindings && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                  </div>
                )}
              </button>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {tissue.name}
                {hasFindings && (
                  <div className="mt-1 text-green-300 text-[10px]">
                    {examination?.onExamination.length || 0} finding(s)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Soft Tissue Summary */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Soft Tissue Findings Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm text-gray-500">Areas Examined</div>
            <div className="text-2xl font-bold text-blue-600">
              {
                softTissues.filter(
                  (st) =>
                    st.onExamination.length > 0 ||
                    st.diagnosis.length > 0 ||
                    st.treatment.length > 0,
                ).length
              }
              /{SOFT_TISSUE_DATA.length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm text-gray-500">Total Findings</div>
            <div className="text-2xl font-bold text-blue-600">
              {softTissues.reduce(
                (sum, st) => sum + st.onExamination.length,
                0,
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm text-gray-500">Treatments Planned</div>
            <div className="text-2xl font-bold text-blue-600">
              {softTissues.reduce((sum, st) => sum + st.treatment.length, 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTMJTab = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          <Bone className="h-4 w-4 mr-2" />
          Temporomandibular Joint (TMJ) Examination
        </Badge>
        <p className="text-sm text-muted-foreground mt-2">
          Click on TMJ joints to examine and document findings
        </p>
      </div>

      {/* TMJ Grid - Updated to show Left, Right, and Both */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TMJ_DATA.map((tmj) => {
          const examination = tmjExaminations.find((t) => t.id === tmj.id);
          const hasFindings =
            examination &&
            (examination.onExamination.length > 0 ||
              examination.diagnosis.length > 0 ||
              examination.treatment.length > 0);

          return (
            <div key={tmj.id} className="relative group">
              <button
                type="button"
                onClick={() => handleTMJClick(tmj)}
                className="w-full border rounded-lg p-6 bg-white hover:bg-purple-50 transition-colors flex flex-col items-center gap-4"
              >
                <TMJSVG
                  type={tmj.svgName}
                  width={120}
                  height={120}
                  color={hasFindings ? "#8b5cf6" : "#9ca3af"}
                />
                <div className="text-center">
                  <span className="font-medium text-sm">{tmj.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs capitalize">
                    {tmj.side}
                  </Badge>
                </div>

                {hasFindings && (
                  <div className="absolute top-4 right-4">
                    <div className="w-4 h-4 rounded-full bg-purple-500 animate-pulse"></div>
                  </div>
                )}
              </button>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {tmj.name} ({tmj.side})
                {hasFindings && (
                  <div className="mt-1 text-green-300 text-[10px]">
                    {examination?.onExamination.length || 0} finding(s)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TMJ Summary */}
      <div className="border rounded-lg p-4 bg-purple-50">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          TMJ Findings Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm text-gray-500">Joints Examined</div>
            <div className="text-2xl font-bold text-purple-600">
              {
                tmjExaminations.filter(
                  (tmj) =>
                    tmj.onExamination.length > 0 ||
                    tmj.diagnosis.length > 0 ||
                    tmj.treatment.length > 0,
                ).length
              }
              /{TMJ_DATA.length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm text-gray-500">Total Findings</div>
            <div className="text-2xl font-bold text-purple-600">
              {tmjExaminations.reduce(
                (sum, tmj) => sum + tmj.onExamination.length,
                0,
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm text-gray-500">Treatments Planned</div>
            <div className="text-2xl font-bold text-purple-600">
              {tmjExaminations.reduce(
                (sum, tmj) => sum + tmj.treatment.length,
                0,
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // NEW: Render Dropdown View for Teeth

  const renderDropdownTeethView = () => (
    <div className="space-y-6 h-full overflow-y-auto pb-20">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Chart Type:</label>
          <div className="flex border rounded-lg">
            <button
              type="button"
              onClick={() => {
                setChartType("adult");
                setSelectedTeeth([]);
              }}
              className={`px-3 py-1 text-sm ${chartType === "adult" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            >
              Adult
            </button>
            <button
              type="button"
              onClick={() => {
                setChartType("pediatric");
                setSelectedTeeth([]);
              }}
              className={`px-3 py-1 text-sm ${chartType === "pediatric" ? "bg-primary text-primary-foreground" : "bg-white"}`}
            >
              Pediatric
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Selection:</label>
          <div className="flex border rounded-lg">
            <button
              type="button"
              onClick={() => {
                setSelectionMode("single");
                setSelectedTeeth([]);
              }}
              className={`px-3 py-1 text-sm flex items-center gap-2 ${
                selectionMode === "single"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white"
              }`}
            >
              {selectionMode === "single" ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Single
            </button>
            <button
              type="button"
              onClick={() => setSelectionMode("multiple")}
              className={`px-3 py-1 text-sm flex items-center gap-2 ${
                selectionMode === "multiple"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white"
              }`}
            >
              {selectionMode === "multiple" ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Multiple
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Tooth Selector - Increased height and better styling */}
      <div className="min-h-[300px] relative z-10">
        <DropdownToothSelector
          toothData={toothData}
          selectedTeeth={selectedTeeth}
          selectionMode={selectionMode}
          onSelectTeeth={setSelectedTeeth}
          chartType={chartType}
          onOpenMultiToothModal={() => {
            if (selectedTeeth.length > 0) {
              setShowMultiToothModal(true);
            } else {
              alert("Please select teeth first");
            }
          }}
          disabled={mode === "view"}
        />
      </div>

      {/* Quick Add Procedures Section */}
      {mode === "edit" && selectedTeeth.length > 0 && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Quick Add Procedure</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickAddModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Procedure
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Surface Selection */}
            <DropdownSurfaceSelector
              selectedSurfaces={selectedSurfaces}
              onSelectSurfaces={setSelectedSurfaces}
              mode={mode}
            />

            {/* Selected Teeth Summary */}
            <div className="border rounded-lg p-4 bg-white">
              <h5 className="font-medium mb-2">Selected Summary</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Teeth:</span>
                  <Badge variant="outline">
                    {selectedTeeth.length} selected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Surfaces:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedSurfaces.map((surface) => (
                      <Badge
                        key={surface}
                        variant="secondary"
                        className="text-xs capitalize"
                      >
                        {surface}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing Conditions Summary - Scrollable if needed */}
      {toothConditions.length > 0 && (
        <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
          <h4 className="font-medium mb-3">
            Existing Conditions ({toothConditions.length})
          </h4>
          <div className="space-y-3">
            {toothConditions.map((condition) => {
              const tooth = toothData.find(
                (t) => t.number === condition.toothNumber,
              );
              return (
                <div key={condition.toothNumber} className="border rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        Tooth #{condition.toothNumber}
                      </div>
                      {tooth && (
                        <div className="text-sm text-gray-600">
                          {tooth.name}
                        </div>
                      )}
                      {condition.conditions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {condition.conditions.slice(0, 3).map((cond) => (
                            <Badge
                              key={cond}
                              variant="secondary"
                              className="text-xs"
                            >
                              {cond}
                            </Badge>
                          ))}
                          {condition.conditions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{condition.conditions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      {condition.procedures?.length > 0 && (
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-50"
                          >
                            {condition.procedures.length} procedure(s)
                          </Badge>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const tooth = toothData.find(
                          (t) => t.number === condition.toothNumber,
                        );
                        if (tooth) setSelectedTooth(tooth);
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2">
      <Card className="max-w-7xl w-full max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <div>
              {/* <CardTitle className="text-lg">Dental Chart</CardTitle> */}
              <div className="text-xm text-muted-foreground mt-1 flex items-center gap-2">
                {patientName && <span>Patient: {patientName}</span>}
                {patientUniqueId && <span>• ID: {patientUniqueId}</span>}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* View Toggle Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseDropdownView(!useDropdownView)}
                title={
                  useDropdownView
                    ? "Switch to visual chart"
                    : "Switch to dropdown view"
                }
                className="h-8 px-2"
              >
                {useDropdownView ? (
                  <Grid className="h-3 w-3" />
                ) : (
                  <Menu className="h-3 w-3" />
                )}
              </Button>
              {/* Add Clear All Button */}
              {mode === "edit" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear all data?")) {
                      setToothConditions([]);
                      setSelectedTeeth([]);
                      setSoftTissues([]);
                      setTMJExaminations([]);
                    }
                  }}
                  title="Clear all data"
                  className="h-8 px-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Main Tabs - Make them smaller */}
          <div className="mt-3 border-b">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab("teeth")}
                className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 ${
                  activeTab === "teeth"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Teeth
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("soft-tissue")}
                className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 ${
                  activeTab === "soft-tissue"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Soft Tissue
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tmj")}
                className={`px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 ${
                  activeTab === "tmj"
                    ? "border-b-2 border-purple-500 text-purple-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Bone className="h-3.5 w-3.5" />
                TMJ
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto">
          {activeTab === "teeth" ? (
            useDropdownView ? (
              <div className="h-full overflow-y-auto">
                {renderDropdownTeethView()}
              </div>
            ) : (
              <div className="h-full overflow-y-auto">{renderTeethTab()}</div>
            )
          ) : activeTab === "soft-tissue" ? (
            <div className="h-full overflow-y-auto">
              {renderSoftTissueTab()}
            </div>
          ) : (
            <div className="h-full overflow-y-auto">{renderTMJTab()}</div>
          )}

          {/* Summary Cards - Only show in visual view or when not in dropdown */}
          {(!useDropdownView || activeTab !== "teeth") && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Common Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {toothConditions.slice(0, 5).map((tc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">Tooth #{tc.toothNumber}</span>
                        <div className="flex gap-1">
                          {tc.conditions.slice(0, 2).map((cond) => (
                            <Badge
                              key={cond}
                              variant="outline"
                              className="text-xs"
                            >
                              {cond}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Treatment Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  {treatmentPlan ? (
                    <div className="space-y-2">
                      <div className="font-medium">
                        {treatmentPlan.planName}
                      </div>
                      {treatmentPlan.description && (
                        <p className="text-sm text-muted-foreground">
                          {treatmentPlan.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {treatmentPlan.stages.length} stages
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {treatmentPlan.teeth.reduce(
                            (sum, tooth) => sum + tooth.procedures.length,
                            0,
                          )}{" "}
                          procedures
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {
                            treatmentPlan.stages.filter(
                              (s) => s.status === "completed",
                            ).length
                          }{" "}
                          completed,
                          {
                            treatmentPlan.stages.filter(
                              (s) => s.status === "in-progress",
                            ).length
                          }{" "}
                          in-progress
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        No treatment plan created
                      </p>
                      {mode === "edit" && activeTab === "teeth" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleCreateTreatmentPlan}
                        >
                          Create Treatment Plan
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card> */}

              {/* <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      Print Chart
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Export as PDF
                    </Button>
                    {mode === "edit" &&
                      !treatmentPlan &&
                      activeTab === "teeth" && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={handleCreateTreatmentPlan}
                        >
                          Generate Treatment Plan
                        </Button>
                      )}
                  </div>
                </CardContent>
              </Card> */}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Tooth Popup */}
      {selectedTooth && (
        <ToothPopup
          tooth={selectedTooth}
          condition={
            toothConditions.find(
              (tc) => tc.toothNumber === selectedTooth.number,
            ) || null
          }
          mode={mode}
          onClose={() => setSelectedTooth(null)}
          onSave={handleSaveToothData}
        />
      )}

      {/* Multi-Tooth Popup */}
      {showMultiToothModal && (
        <MultiToothPopup
          selectedTeeth={selectedTeeth}
          toothData={toothData}
          mode={mode}
          onClose={() => setShowMultiToothModal(false)}
          onSave={handleSaveMultiToothData}
        />
      )}

      {/* Soft Tissue Popup */}
      {selectedSoftTissue && (
        <SoftTissuePopup
          tissue={selectedSoftTissue}
          mode={mode}
          onClose={() => setSelectedSoftTissue(null)}
          onSave={handleSaveSoftTissueData}
        />
      )}

      {/* TMJ Popup */}
      {selectedTMJ && (
        <TMJPopup
          tmj={selectedTMJ}
          mode={mode}
          onClose={() => setSelectedTMJ(null)}
          onSave={handleSaveTMJData}
        />
      )}

      {/* Treatment Plan Form */}
      {/* {showTreatmentPlanForm && (
        <TreatmentPlanForm
          patientId={patientId}
          existingConditions={toothConditions}
          onClose={() => setShowTreatmentPlanForm(false)}
          onSave={handleSaveTreatmentPlan}
          initialData={treatmentPlan}
        />
      )} */}

      {/* Quick Add Procedure Modal */}
      {showQuickAddModal && (
        <Card className="max-w-7xl w-full max-h-[90vh] flex flex-col md:max-h-[90vh] h-[90vh]">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-lg">
            <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Add Procedure</h3>
                <p className="text-sm text-muted-foreground">
                  For {selectedTeeth.length} selected teeth
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickAddModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Procedure Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Procedure
                  </label>
                  <select
                    className="w-full border rounded-lg p-2"
                    value={selectedProcedure}
                    onChange={(e) => setSelectedProcedure(e.target.value)}
                  >
                    <option value="">Select a procedure...</option>
                    {DENTAL_PROCEDURES.map((proc) => (
                      <option key={proc} value={proc}>
                        {proc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Surfaces Display */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Selected Surfaces
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSurfaces.map((surface) => (
                      <Badge
                        key={surface}
                        variant="secondary"
                        className="capitalize"
                      >
                        {surface}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Estimated Cost */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-2"
                    value={procedureCost}
                    onChange={(e) => setProcedureCost(Number(e.target.value))}
                    min="0"
                    step="100"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes
                  </label>
                  <textarea
                    className="w-full border rounded-lg p-2"
                    value={procedureNotes}
                    onChange={(e) => setProcedureNotes(e.target.value)}
                    placeholder="Add any notes about this procedure..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="border-t px-6 py-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Will apply to {selectedTeeth.length} teeth
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowQuickAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuickAddProcedure}
                  disabled={!selectedProcedure}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Add to Selected Teeth
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Treatment Plan Form Component (Remains the same as before)
// interface TreatmentPlanFormProps {
//   patientId: string;
//   existingConditions: ToothCondition[];
//   onClose: () => void;
//   onSave: (plan: TreatmentPlanData) => void;
//   initialData?: TreatmentPlanData | null;
// }

// const TreatmentPlanForm: React.FC<TreatmentPlanFormProps> = ({
//   patientId,
//   existingConditions,
//   onClose,
//   onSave,
//   initialData,
// }) => {
//   const [planName, setPlanName] = useState(
//     initialData?.planName || "Treatment Plan",
//   );
//   const [description, setDescription] = useState(
//     initialData?.description || "",
//   );
//   const [stages, setStages] = useState<TreatmentPlanStage[]>(
//     initialData?.stages || [
//       {
//         stageName: "Initial Treatment",
//         description: "Primary procedures",
//         procedureRefs: [],
//         status: "pending",
//         scheduledDate: new Date().toISOString().split("T")[0],
//       },
//       {
//         stageName: "Follow-up",
//         description: "Secondary procedures",
//         procedureRefs: [],
//         status: "pending",
//         scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//           .toISOString()
//           .split("T")[0],
//       },
//     ],
//   );
//   const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
//   const [selectedProcedure, setSelectedProcedure] = useState("");
//   const [selectedSurface, setSelectedSurface] = useState("");
//   const [estimatedCost, setEstimatedCost] = useState<number>(0);
//   const [notes, setNotes] = useState("");
//   const [teethPlans, setTeethPlans] = useState<
//     {
//       toothNumber: number;
//       procedures: any[];
//       priority: "urgent" | "high" | "medium" | "low";
//     }[]
//   >(
//     initialData?.teeth.map((t) => ({
//       toothNumber: t.toothNumber,
//       priority: t.priority || "medium",
//       procedures: t.procedures.map((p) => ({
//         name: p.name,
//         surface: p.surface || "occlusal",
//         stage: p.stage || 1,
//         estimatedCost: p.estimatedCost || 0,
//         notes: p.notes || "",
//       })),
//     })) || [],
//   );
//   const [selectedPriority, setSelectedPriority] = useState<
//     "urgent" | "high" | "medium" | "low"
//   >("medium");
//   const [selectedStage, setSelectedStage] = useState<number>(1);

//   useEffect(() => {
//     if (initialData) {
//       console.log("📋 TreatmentPlanForm received initial data:", initialData);
//       console.log("- Teeth:", initialData.teeth?.length || 0);
//       console.log("- Stages:", initialData.stages?.length || 0);
//       console.log(
//         "- Procedures count:",
//         initialData.teeth?.reduce((sum, t) => sum + t.procedures.length, 0) ||
//           0,
//       );
//     }
//   }, [initialData]);

//   const handleAddProcedure = () => {
//     if (!selectedTooth || !selectedProcedure || !selectedSurface) {
//       alert("Please select tooth, procedure, and surface");
//       return;
//     }

//     const toothIndex = teethPlans.findIndex(
//       (tp) => tp.toothNumber === selectedTooth,
//     );
//     const newProcedure = {
//       name: selectedProcedure,
//       surface: selectedSurface,
//       stage: selectedStage,
//       estimatedCost: estimatedCost || 0,
//       notes,
//     };

//     if (toothIndex === -1) {
//       setTeethPlans([
//         ...teethPlans,
//         {
//           toothNumber: selectedTooth,
//           procedures: [newProcedure],
//           priority: selectedPriority,
//         },
//       ]);
//     } else {
//       const updated = [...teethPlans];
//       updated[toothIndex].procedures.push(newProcedure);
//       setTeethPlans(updated);
//     }

//     // Reset form
//     setSelectedProcedure("");
//     setSelectedSurface("");
//     setEstimatedCost(0);
//     setNotes("");
//   };

//   const handleSavePlan = () => {
//     if (teethPlans.length === 0) {
//       alert(
//         "Please add at least one tooth procedure before saving the treatment plan",
//       );
//       return;
//     }

//     // Format teeth data properly
//     const formattedTeeth = teethPlans.map((toothPlan) => ({
//       toothNumber: toothPlan.toothNumber,
//       priority: toothPlan.priority || "medium",
//       procedures: toothPlan.procedures.map((proc) => ({
//         name: proc.name,
//         surface: proc.surface || "occlusal",
//         stage: proc.stage || 1,
//         estimatedCost: proc.estimatedCost || 0,
//         notes: proc.notes || "",
//       })),
//     }));

//     // Format stages with procedureRefs
//     const formattedStages = stages.map((stage, index) => {
//       const stageNumber = index + 1;

//       const proceduresInStage = teethPlans.flatMap((toothPlan) =>
//         toothPlan.procedures
//           .filter((proc) => proc.stage === stageNumber)
//           .map((proc) => ({
//             toothNumber: toothPlan.toothNumber,
//             procedureName: proc.name,
//           })),
//       );

//       const stageStatus = stage.status || "pending";

//       return {
//         stageName: stage.stageName || `Stage ${stageNumber}`,
//         description: stage.description || "",
//         procedureRefs: proceduresInStage,
//         status: stageStatus,
//         scheduledDate:
//           stage.scheduledDate ||
//           new Date(Date.now() + index * 7 * 24 * 60 * 60 * 1000)
//             .toISOString()
//             .split("T")[0],
//         notes: stage.notes || "",
//         ...(stageStatus === "in-progress" && {
//           startedAt: new Date().toISOString(),
//         }),
//         ...(stageStatus === "completed" && {
//           completedAt: new Date().toISOString(),
//         }),
//       };
//     });

//     console.log("📊 Stage Statuses being sent to backend:");
//     formattedStages.forEach((stage, idx) => {
//       console.log(
//         `  Stage ${idx + 1}: ${stage.stageName} - Status: ${stage.status}`,
//       );
//     });

//     const plan: TreatmentPlanData = {
//       planName,
//       description,
//       teeth: formattedTeeth,
//       stages: formattedStages,
//     };

//     console.log("✅ Saving treatment plan:");
//     console.log("- Stages count:", formattedStages.length);

//     onSave(plan);
//   };

//   const handleAddStage = () => {
//     const newStageNumber = stages.length + 1;
//     setStages([
//       ...stages,
//       {
//         stageName: `Stage ${newStageNumber}`,
//         description: "",
//         procedureRefs: [],
//         status: "pending",
//         scheduledDate: new Date(
//           Date.now() + (newStageNumber - 1) * 7 * 24 * 60 * 60 * 1000,
//         )
//           .toISOString()
//           .split("T")[0],
//       },
//     ]);
//   };

//   const handleRemoveStage = (index: number) => {
//     if (stages.length <= 1) {
//       alert("At least one stage is required");
//       return;
//     }

//     // Check if any procedures are assigned to this stage
//     const proceduresInStage = teethPlans.reduce((count, tooth) => {
//       return (
//         count + tooth.procedures.filter((p) => p.stage === index + 1).length
//       );
//     }, 0);

//     if (proceduresInStage > 0) {
//       if (
//         !confirm(
//           `Stage ${index + 1} has ${proceduresInStage} procedure(s). Removing the stage will also remove these procedures. Continue?`,
//         )
//       ) {
//         return;
//       }

//       // Remove procedures assigned to this stage completely
//       const updatedTeethPlans = teethPlans
//         .map((tooth) => ({
//           ...tooth,
//           procedures: tooth.procedures.filter(
//             (proc) => proc.stage !== index + 1,
//           ),
//         }))
//         .filter((tooth) => tooth.procedures.length > 0); // Remove teeth with no procedures

//       setTeethPlans(updatedTeethPlans);
//     }

//     // Remove the stage
//     const updatedStages = stages.filter((_, i) => i !== index);

//     // Renumber remaining stages to maintain order
//     const renumberedStages = updatedStages.map((stage, idx) => ({
//       ...stage,
//       stageName: stage.stageName.replace(/\d+$/, String(idx + 1)),
//     }));

//     setStages(renumberedStages);

//     // Adjust selected stage if needed
//     if (selectedStage > renumberedStages.length) {
//       setSelectedStage(renumberedStages.length);
//     } else if (selectedStage === index + 1) {
//       setSelectedStage(1);
//     }
//   };

//   const handleUpdateStageStatus = (
//     stageIndex: number,
//     newStatus: "pending" | "completed" | "in-progress",
//   ) => {
//     const updatedStages = [...stages];
//     updatedStages[stageIndex].status = newStatus;
//     setStages(updatedStages);
//   };

//   const getProceduresByStage = (stageNumber: number) => {
//     return teethPlans.flatMap((tooth) =>
//       tooth.procedures
//         .filter((proc) => proc.stage === stageNumber)
//         .map((proc) => ({
//           toothNumber: tooth.toothNumber,
//           ...proc,
//         })),
//     );
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-lg">
//         <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between">
//           <div>
//             <h3 className="text-lg font-semibold">Create Treatment Plan</h3>
//             <p className="text-sm text-muted-foreground">
//               Patient ID: {patientId}
//             </p>
//           </div>
//           <Button variant="ghost" size="sm" onClick={onClose}>
//             <X className="h-4 w-4" />
//           </Button>
//         </div>

//         <div className="flex-1 overflow-y-auto p-6">
//           <div className="space-y-6">
//             {/* Plan Basic Info */}
//             <div>
//               <label className="block text-sm font-medium mb-2">
//                 Plan Name
//               </label>
//               <input
//                 type="text"
//                 className="w-full border rounded-lg p-2"
//                 value={planName}
//                 onChange={(e) => setPlanName(e.target.value)}
//                 placeholder="Enter plan name"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-2">
//                 Description
//               </label>
//               <textarea
//                 className="w-full border rounded-lg p-2"
//                 value={description}
//                 onChange={(e) => setDescription(e.target.value)}
//                 placeholder="Enter description"
//                 rows={3}
//               />
//             </div>

//             {/* Stages Management - WITHOUT REMOVE BUTTON */}
//             <div className="border rounded-lg p-4">
//               <div className="flex justify-between items-center mb-4">
//                 <h4 className="font-medium">Stages Management</h4>
//                 <Button variant="outline" size="sm" onClick={handleAddStage}>
//                   <Plus className="h-4 w-4 mr-2" />
//                   Add Stage
//                 </Button>
//               </div>

//               <div className="space-y-3">
//                 {stages.map((stage, index) => {
//                   const stageNumber = index + 1;
//                   const proceduresInStage = getProceduresByStage(stageNumber);

//                   return (
//                     <div key={index} className="border rounded p-4 bg-white">
//                       <div className="flex justify-between items-center mb-3">
//                         <div className="flex items-center gap-2">
//                           <Badge
//                             variant="outline"
//                             className="bg-blue-50 text-blue-700"
//                           >
//                             Stage {stageNumber}
//                           </Badge>
//                           <span className="font-medium">{stage.stageName}</span>
//                           <Badge variant="secondary" className="text-xs">
//                             {proceduresInStage.length} procedure(s)
//                           </Badge>
//                         </div>
//                       </div>

//                       {/* Stage Status Badge */}
//                       <div className="mb-3">
//                         <Badge
//                           className={`text-xs ${
//                             stage.status === "completed"
//                               ? "bg-green-100 text-green-700"
//                               : stage.status === "in-progress"
//                                 ? "bg-blue-100 text-blue-700"
//                                 : "bg-gray-100 text-gray-700"
//                           }`}
//                         >
//                           Status: {stage.status}
//                         </Badge>
//                       </div>

//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                         <div>
//                           <label className="block text-xs text-gray-500 mb-1">
//                             Stage Name
//                           </label>
//                           <input
//                             type="text"
//                             className="w-full border rounded p-2 text-sm"
//                             value={stage.stageName}
//                             onChange={(e) => {
//                               const updated = [...stages];
//                               updated[index].stageName = e.target.value;
//                               setStages(updated);
//                             }}
//                           />
//                         </div>

//                         <div>
//                           <label className="block text-xs text-gray-500 mb-1">
//                             Scheduled Date
//                           </label>
//                           <input
//                             type="date"
//                             className="w-full border rounded p-2 text-sm"
//                             value={stage.scheduledDate || ""}
//                             onChange={(e) => {
//                               const updated = [...stages];
//                               updated[index].scheduledDate = e.target.value;
//                               setStages(updated);
//                             }}
//                           />
//                         </div>

//                         <div className="md:col-span-2">
//                           <label className="block text-xs text-gray-500 mb-1">
//                             Description
//                           </label>
//                           <textarea
//                             className="w-full border rounded p-2 text-sm"
//                             value={stage.description || ""}
//                             onChange={(e) => {
//                               const updated = [...stages];
//                               updated[index].description = e.target.value;
//                               setStages(updated);
//                             }}
//                             rows={2}
//                             placeholder="Describe what will be done in this stage"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Add Procedures */}
//             <div className="border rounded-lg p-4">
//               <h4 className="font-medium mb-4">Add Procedures</h4>

//               {/* Stage Selection */}
//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-2">
//                   Assign to Stage
//                 </label>
//                 <div className="flex flex-wrap gap-2">
//                   {stages.map((stage, index) => {
//                     const stageNumber = index + 1;
//                     const proceduresInStage =
//                       getProceduresByStage(stageNumber).length;

//                     return (
//                       <button
//                         key={index}
//                         type="button"
//                         onClick={() => setSelectedStage(stageNumber)}
//                         className={`px-3 py-2 border rounded-lg flex items-center gap-2 ${
//                           selectedStage === stageNumber
//                             ? "bg-primary text-primary-foreground border-primary"
//                             : "bg-white border-gray-300 hover:bg-gray-50"
//                         }`}
//                       >
//                         <span>Stage {stageNumber}</span>
//                         <Badge variant="secondary" className="text-xs">
//                           {proceduresInStage}
//                         </Badge>
//                         <Badge
//                           className={`text-[10px] ${
//                             stage.status === "completed"
//                               ? "bg-green-100 text-green-700"
//                               : stage.status === "in-progress"
//                                 ? "bg-blue-100 text-blue-700"
//                                 : "bg-gray-100 text-gray-700"
//                           }`}
//                         >
//                           {stage.status}
//                         </Badge>
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Tooth Number
//                   </label>
//                   <select
//                     className="w-full border rounded-lg p-2"
//                     value={selectedTooth || ""}
//                     onChange={(e) =>
//                       setSelectedTooth(
//                         e.target.value ? Number(e.target.value) : null,
//                       )
//                     }
//                   >
//                     <option value="">Select tooth...</option>
//                     {[...ADULT_TOOTH_DATA, ...PEDIATRIC_TOOTH_DATA]
//                       .filter(
//                         (tooth, index, self) =>
//                           index ===
//                           self.findIndex((t) => t.number === tooth.number),
//                       )
//                       .sort((a, b) => a.number - b.number)
//                       .map((tooth) => (
//                         <option key={tooth.number} value={tooth.number}>
//                           Tooth #{tooth.number} ({tooth.name})
//                         </option>
//                       ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Procedure
//                   </label>
//                   <select
//                     className="w-full border rounded-lg p-2"
//                     value={selectedProcedure}
//                     onChange={(e) => setSelectedProcedure(e.target.value)}
//                   >
//                     <option value="">Select procedure...</option>
//                     {DENTAL_PROCEDURES.map((proc) => (
//                       <option key={proc} value={proc}>
//                         {proc}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Surface
//                   </label>
//                   <select
//                     className="w-full border rounded-lg p-2"
//                     value={selectedSurface}
//                     onChange={(e) => setSelectedSurface(e.target.value)}
//                   >
//                     <option value="">Select surface...</option>
//                     <option value="mesial">Mesial</option>
//                     <option value="distal">Distal</option>
//                     <option value="buccal">Buccal</option>
//                     <option value="lingual">Lingual</option>
//                     <option value="occlusal">Occlusal</option>
//                     <option value="entire">Entire Tooth</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium mb-1">
//                     Estimated Cost (₹)
//                   </label>
//                   <input
//                     type="number"
//                     className="w-full border rounded-lg p-2"
//                     value={estimatedCost}
//                     onChange={(e) => setEstimatedCost(Number(e.target.value))}
//                     min="0"
//                     step="100"
//                   />
//                 </div>
//               </div>

//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-1">
//                   Priority
//                 </label>
//                 <div className="flex gap-2">
//                   {(["urgent", "high", "medium", "low"] as const).map(
//                     (priority) => (
//                       <button
//                         key={priority}
//                         type="button"
//                         onClick={() => setSelectedPriority(priority)}
//                         className={`px-3 py-1 border rounded capitalize ${
//                           selectedPriority === priority
//                             ? "bg-primary text-primary-foreground border-primary"
//                             : "bg-white border-gray-300 hover:bg-gray-50"
//                         }`}
//                       >
//                         {priority}
//                       </button>
//                     ),
//                   )}
//                 </div>
//               </div>

//               <div className="mb-4">
//                 <label className="block text-sm font-medium mb-1">Notes</label>
//                 <textarea
//                   className="w-full border rounded-lg p-2"
//                   value={notes}
//                   onChange={(e) => setNotes(e.target.value)}
//                   placeholder="Add notes about this procedure"
//                   rows={2}
//                 />
//               </div>

//               <Button
//                 onClick={handleAddProcedure}
//                 disabled={
//                   !selectedTooth || !selectedProcedure || !selectedSurface
//                 }
//                 className="w-full"
//               >
//                 <Plus className="h-4 w-4 mr-2" />
//                 Add Procedure to Stage {selectedStage}
//               </Button>
//             </div>

//             {/* Added Procedures */}
//             {teethPlans.length > 0 && (
//               <div className="border rounded-lg p-4">
//                 <div className="flex justify-between items-center mb-4">
//                   <h4 className="font-medium">Added Procedures</h4>
//                   <div className="text-sm text-gray-500">
//                     Total:{" "}
//                     {teethPlans.reduce(
//                       (sum, tp) => sum + tp.procedures.length,
//                       0,
//                     )}{" "}
//                     procedures
//                   </div>
//                 </div>

//                 {/* Summary by Stage WITH STATUS TOGGLE BUTTONS AND REMOVE BUTTON */}
//                 <div className="mb-6">
//                   <h5 className="text-sm font-medium mb-3 text-gray-700">
//                     Stage Status Management
//                   </h5>
//                   <div className="space-y-3">
//                     {stages.map((stage, index) => {
//                       const stageNumber = index + 1;
//                       const proceduresInStage =
//                         getProceduresByStage(stageNumber);

//                       return (
//                         <div
//                           key={index}
//                           className="border rounded-lg p-4 bg-white"
//                         >
//                           <div className="flex justify-between items-center mb-2">
//                             <div className="flex items-center gap-2">
//                               <Badge
//                                 variant="outline"
//                                 className="bg-blue-50 text-blue-700"
//                               >
//                                 Stage {stageNumber}
//                               </Badge>
//                               <span className="font-medium">
//                                 {stage.stageName}
//                               </span>
//                               <Badge variant="outline" className="text-xs">
//                                 {proceduresInStage.length} procedure(s)
//                               </Badge>
//                             </div>

//                             <div className="flex items-center gap-2">
//                               {/* Current Status Badge */}
//                               <Badge
//                                 className={`text-xs ${
//                                   stage.status === "completed"
//                                     ? "bg-green-100 text-green-700"
//                                     : stage.status === "in-progress"
//                                       ? "bg-blue-100 text-blue-700"
//                                       : "bg-gray-100 text-gray-700"
//                                 }`}
//                               >
//                                 {stage.status}
//                               </Badge>

//                               {/* Remove Stage Button - Only show if more than 1 stage */}
//                               {stages.length > 1 && (
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => handleRemoveStage(index)}
//                                   className="text-red-500 hover:text-red-700"
//                                   title="Remove this stage"
//                                 >
//                                   <X className="h-4 w-4" />
//                                 </Button>
//                               )}
//                             </div>
//                           </div>

//                           {/* Stage Status Toggle Buttons */}
//                           <div className="mt-3 flex items-center gap-2">
//                             <span className="text-xs text-gray-500">
//                               Update Status:
//                             </span>
//                             <div className="flex gap-1">
//                               <button
//                                 type="button"
//                                 onClick={() =>
//                                   handleUpdateStageStatus(index, "pending")
//                                 }
//                                 className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
//                                   stage.status === "pending"
//                                     ? "bg-gray-100 text-gray-700 border-gray-300"
//                                     : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
//                                 }`}
//                                 title="Mark as Pending"
//                               >
//                                 Pending
//                               </button>
//                               <button
//                                 type="button"
//                                 onClick={() =>
//                                   handleUpdateStageStatus(index, "in-progress")
//                                 }
//                                 className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
//                                   stage.status === "in-progress"
//                                     ? "bg-blue-100 text-blue-700 border-blue-300"
//                                     : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
//                                 }`}
//                                 title="Mark as In Progress"
//                               >
//                                 In Progress
//                               </button>
//                               <button
//                                 type="button"
//                                 onClick={() =>
//                                   handleUpdateStageStatus(index, "completed")
//                                 }
//                                 className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
//                                   stage.status === "completed"
//                                     ? "bg-green-100 text-green-700 border-green-300"
//                                     : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
//                                 }`}
//                                 title="Mark as Completed"
//                               >
//                                 Completed
//                               </button>
//                             </div>
//                           </div>

//                           {/* Optional: Show procedures in this stage */}
//                           {proceduresInStage.length > 0 && (
//                             <div className="mt-3 pt-3 border-t">
//                               <p className="text-xs text-gray-500 mb-1">
//                                 Procedures in this stage:
//                               </p>
//                               <div className="flex flex-wrap gap-1">
//                                 {proceduresInStage
//                                   .slice(0, 3)
//                                   .map((proc, procIdx) => (
//                                     <Badge
//                                       key={procIdx}
//                                       variant="outline"
//                                       className="text-[10px]"
//                                     >
//                                       T{proc.toothNumber}: {proc.name}
//                                     </Badge>
//                                   ))}
//                                 {proceduresInStage.length > 3 && (
//                                   <Badge
//                                     variant="outline"
//                                     className="text-[10px]"
//                                   >
//                                     +{proceduresInStage.length - 3} more
//                                   </Badge>
//                                 )}
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   {teethPlans.map((toothPlan, idx) => (
//                     <div key={idx} className="border rounded-lg p-4">
//                       <div className="flex justify-between items-center mb-3">
//                         <div className="flex items-center gap-2">
//                           <Badge variant="outline" className="bg-gray-100">
//                             Tooth #{toothPlan.toothNumber}
//                           </Badge>
//                           {toothPlan.priority &&
//                             toothPlan.priority !== "medium" && (
//                               <Badge
//                                 className={`text-xs ${
//                                   toothPlan.priority === "urgent"
//                                     ? "bg-red-100 text-red-700"
//                                     : toothPlan.priority === "high"
//                                       ? "bg-orange-100 text-orange-700"
//                                       : "bg-green-100 text-green-700"
//                                 }`}
//                               >
//                                 {toothPlan.priority}
//                               </Badge>
//                             )}
//                         </div>
//                         <span className="text-sm text-gray-500">
//                           {toothPlan.procedures.length} procedure(s)
//                         </span>
//                       </div>

//                       {/* Group procedures by stage */}
//                       {(() => {
//                         const proceduresByStage: Record<number, any[]> = {};
//                         toothPlan.procedures.forEach((proc) => {
//                           const stage = proc.stage || 1;
//                           if (!proceduresByStage[stage]) {
//                             proceduresByStage[stage] = [];
//                           }
//                           proceduresByStage[stage].push(proc);
//                         });

//                         return Object.entries(proceduresByStage).map(
//                           ([stageNum, procs]) => (
//                             <div key={stageNum} className="mb-3 last:mb-0">
//                               <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
//                                 <span>Stage {stageNum}</span>
//                                 <Badge
//                                   variant="outline"
//                                   className="text-[10px]"
//                                 >
//                                   {procs.length} procedure(s)
//                                 </Badge>
//                                 {/* Show stage status */}
//                                 <Badge
//                                   className={`text-[10px] ${
//                                     stages[parseInt(stageNum) - 1]?.status ===
//                                     "completed"
//                                       ? "bg-green-100 text-green-700"
//                                       : stages[parseInt(stageNum) - 1]
//                                             ?.status === "in-progress"
//                                         ? "bg-blue-100 text-blue-700"
//                                         : "bg-gray-100 text-gray-700"
//                                   }`}
//                                 >
//                                   {stages[parseInt(stageNum) - 1]?.status ||
//                                     "pending"}
//                                 </Badge>
//                               </div>
//                               <div className="space-y-2">
//                                 {procs.map((proc, procIdx) => (
//                                   <div
//                                     key={procIdx}
//                                     className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border"
//                                   >
//                                     <div className="flex-1">
//                                       <div className="flex items-center gap-2">
//                                         <span className="font-medium">
//                                           {proc.name}
//                                         </span>
//                                         <Badge
//                                           variant="outline"
//                                           className="text-xs"
//                                         >
//                                           {proc.surface}
//                                         </Badge>
//                                       </div>
//                                       {proc.notes && (
//                                         <div className="text-sm text-gray-600 mt-1">
//                                           {proc.notes}
//                                         </div>
//                                       )}
//                                     </div>
//                                     <div className="flex items-center gap-3">
//                                       <span className="text-sm font-medium">
//                                         ₹{proc.estimatedCost}
//                                       </span>
//                                     </div>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           ),
//                         );
//                       })()}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="border-t px-6 py-4 flex justify-between items-center">
//           <div className="text-sm text-gray-500">
//             {teethPlans.length > 0 ? (
//               <>
//                 {teethPlans.length} teeth,{" "}
//                 {teethPlans.reduce((sum, tp) => sum + tp.procedures.length, 0)}{" "}
//                 procedures
//                 <div className="mt-1">
//                   Stages:{" "}
//                   {stages.filter((s) => s.status === "completed").length}{" "}
//                   completed,
//                   {stages.filter((s) => s.status === "in-progress").length}{" "}
//                   in-progress,
//                   {stages.filter((s) => s.status === "pending").length} pending
//                 </div>
//               </>
//             ) : (
//               "No procedures added yet"
//             )}
//           </div>
//           <div className="flex gap-2">
//             <Button variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button
//               onClick={handleSavePlan}
//               disabled={teethPlans.length === 0}
//               className="bg-primary text-primary-foreground hover:bg-primary/90"
//             >
//               Save Treatment Plan
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
