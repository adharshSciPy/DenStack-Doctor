// DentalChart.tsx - COMPLETE CODE WITH SOFT TISSUE AND TMJ SUPPORT
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { X, Plus, CheckSquare, Square, ArrowRight,Trash2, AlertCircle, Stethoscope, Bone } from "lucide-react";
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
  side: 'left' | 'right' | 'both';
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
  procedureRefs: { // This is required
    toothNumber: number;
    procedureName: string;
  }[];
  toothSurfaceProcedures?: { // This is optional
    toothNumber: number;
    surfaceProcedures: {
      surface: string;
      procedureNames: string[];
    }[];
  }[];
  status: 'pending' | 'completed' | 'in-progress';
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
    priority?: 'urgent' | 'high' | 'medium' | 'low';
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
  onToothSelected?: (tooth: ToothData, condition: ToothCondition | null) => void;
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
  { number: 18, name: "Third Molar (Wisdom)", quadrant: 1, svgName: "wisdom", position: { x: 85, y: 90 }, rotation: 180, isAdult: true },
  { number: 17, name: "Second Molar", quadrant: 1, svgName: "molar", position: { x: 95, y: 90 }, rotation: 180, isAdult: true },
  { number: 16, name: "First Molar", quadrant: 1, svgName: "molar", position: { x: 105, y: 90 }, rotation: 180, isAdult: true },
  { number: 15, name: "Second Premolar", quadrant: 1, svgName: "premolar", position: { x: 115, y: 90 }, rotation: 180, isAdult: true },
  { number: 14, name: "First Premolar", quadrant: 1, svgName: "premolar", position: { x: 125, y: 90 }, rotation: 180, isAdult: true },
  { number: 13, name: "Canine", quadrant: 1, svgName: "canine", position: { x: 135, y: 90 }, rotation: 180, isAdult: true },
  { number: 12, name: "Lateral Incisor", quadrant: 1, svgName: "incisor", position: { x: 145, y: 90 }, rotation: 180, isAdult: true },
  { number: 11, name: "Central Incisor", quadrant: 1, svgName: "incisor", position: { x: 155, y: 90 }, rotation: 180, isAdult: true },
  
  // Upper Left (Quadrant 2) - FDI numbers 21-28
  { number: 21, name: "Central Incisor", quadrant: 2, svgName: "incisor", position: { x: 165, y: 90 }, rotation: 180, isAdult: true },
  { number: 22, name: "Lateral Incisor", quadrant: 2, svgName: "incisor", position: { x: 175, y: 90 }, rotation: 180, isAdult: true },
  { number: 23, name: "Canine", quadrant: 2, svgName: "canine", position: { x: 185, y: 90 }, rotation: 180, isAdult: true },
  { number: 24, name: "First Premolar", quadrant: 2, svgName: "premolar", position: { x: 195, y: 90 }, rotation: 180, isAdult: true },
  { number: 25, name: "Second Premolar", quadrant: 2, svgName: "premolar", position: { x: 205, y: 90 }, rotation: 180, isAdult: true },
  { number: 26, name: "First Molar", quadrant: 2, svgName: "molar", position: { x: 215, y: 90 }, rotation: 180, isAdult: true },
  { number: 27, name: "Second Molar", quadrant: 2, svgName: "molar", position: { x: 225, y: 90 }, rotation: 180, isAdult: true },
  { number: 28, name: "Third Molar (Wisdom)", quadrant: 2, svgName: "wisdom", position: { x: 235, y: 90 }, rotation: 180, isAdult: true },
  
  // Lower Right (Quadrant 4) - FDI numbers 41-48
  { number: 41, name: "Central Incisor", quadrant: 4, svgName: "incisor", position: { x: 155, y: 210 }, rotation: 0, isAdult: true },
  { number: 42, name: "Lateral Incisor", quadrant: 4, svgName: "incisor", position: { x: 145, y: 210 }, rotation: 0, isAdult: true },
  { number: 43, name: "Canine", quadrant: 4, svgName: "canine", position: { x: 135, y: 210 }, rotation: 0, isAdult: true },
  { number: 44, name: "First Premolar", quadrant: 4, svgName: "premolar", position: { x: 125, y: 210 }, rotation: 0, isAdult: true },
  { number: 45, name: "Second Premolar", quadrant: 4, svgName: "premolar", position: { x: 115, y: 210 }, rotation: 0, isAdult: true },
  { number: 46, name: "First Molar", quadrant: 4, svgName: "molar", position: { x: 105, y: 210 }, rotation: 0, isAdult: true },
  { number: 47, name: "Second Molar", quadrant: 4, svgName: "molar", position: { x: 95, y: 210 }, rotation: 0, isAdult: true },
  { number: 48, name: "Third Molar (Wisdom)", quadrant: 4, svgName: "wisdom", position: { x: 85, y: 210 }, rotation: 0, isAdult: true },
  
  // Lower Left (Quadrant 3) - FDI numbers 31-38
  { number: 31, name: "Central Incisor", quadrant: 3, svgName: "incisor", position: { x: 165, y: 210 }, rotation: 0, isAdult: true },
  { number: 32, name: "Lateral Incisor", quadrant: 3, svgName: "incisor", position: { x: 175, y: 210 }, rotation: 0, isAdult: true },
  { number: 33, name: "Canine", quadrant: 3, svgName: "canine", position: { x: 185, y: 210 }, rotation: 0, isAdult: true },
  { number: 34, name: "First Premolar", quadrant: 3, svgName: "premolar", position: { x: 195, y: 210 }, rotation: 0, isAdult: true },
  { number: 35, name: "Second Premolar", quadrant: 3, svgName: "premolar", position: { x: 205, y: 210 }, rotation: 0, isAdult: true },
  { number: 36, name: "First Molar", quadrant: 3, svgName: "molar", position: { x: 215, y: 210 }, rotation: 0, isAdult: true },
  { number: 37, name: "Second Molar", quadrant: 3, svgName: "molar", position: { x: 225, y: 210 }, rotation: 0, isAdult: true },
  { number: 38, name: "Third Molar (Wisdom)", quadrant: 3, svgName: "wisdom", position: { x: 235, y: 210 }, rotation: 0, isAdult: true },
];

// Pediatric teeth (Primary dentition) using FDI numbering
const PEDIATRIC_TOOTH_DATA: ToothData[] = [
  // Upper Right (Quadrant 1) - Primary teeth 55-51
  { number: 55, name: "Primary Second Molar", quadrant: 1, svgName: "molar", position: { x: 85, y: 90 }, rotation: 180, isAdult: false },
  { number: 54, name: "Primary First Molar", quadrant: 1, svgName: "molar", position: { x: 95, y: 90 }, rotation: 180, isAdult: false },
  { number: 53, name: "Primary Canine", quadrant: 1, svgName: "canine", position: { x: 105, y: 90 }, rotation: 180, isAdult: false },
  { number: 52, name: "Primary Lateral Incisor", quadrant: 1, svgName: "incisor", position: { x: 115, y: 90 }, rotation: 180, isAdult: false },
  { number: 51, name: "Primary Central Incisor", quadrant: 1, svgName: "incisor", position: { x: 125, y: 90 }, rotation: 180, isAdult: false },
  
  // Upper Left (Quadrant 2) - Primary teeth 61-65
  { number: 61, name: "Primary Central Incisor", quadrant: 2, svgName: "incisor", position: { x: 135, y: 90 }, rotation: 180, isAdult: false },
  { number: 62, name: "Primary Lateral Incisor", quadrant: 2, svgName: "incisor", position: { x: 145, y: 90 }, rotation: 180, isAdult: false },
  { number: 63, name: "Primary Canine", quadrant: 2, svgName: "canine", position: { x: 155, y: 90 }, rotation: 180, isAdult: false },
  { number: 64, name: "Primary First Molar", quadrant: 2, svgName: "molar", position: { x: 165, y: 90 }, rotation: 180, isAdult: false },
  { number: 65, name: "Primary Second Molar", quadrant: 2, svgName: "molar", position: { x: 175, y: 90 }, rotation: 180, isAdult: false },
  
  // Lower Right (Quadrant 4) - Primary teeth 81-85
  { number: 81, name: "Primary Central Incisor", quadrant: 4, svgName: "incisor", position: { x: 125, y: 210 }, rotation: 0, isAdult: false },
  { number: 82, name: "Primary Lateral Incisor", quadrant: 4, svgName: "incisor", position: { x: 115, y: 210 }, rotation: 0, isAdult: false },
  { number: 83, name: "Primary Canine", quadrant: 4, svgName: "canine", position: { x: 105, y: 210 }, rotation: 0, isAdult: false },
  { number: 84, name: "Primary First Molar", quadrant: 4, svgName: "molar", position: { x: 95, y: 210 }, rotation: 0, isAdult: false },
  { number: 85, name: "Primary Second Molar", quadrant: 4, svgName: "molar", position: { x: 85, y: 210 }, rotation: 0, isAdult: false },
  
  // Lower Left (Quadrant 3) - Primary teeth 71-75
  { number: 71, name: "Primary Central Incisor", quadrant: 3, svgName: "incisor", position: { x: 135, y: 210 }, rotation: 0, isAdult: false },
  { number: 72, name: "Primary Lateral Incisor", quadrant: 3, svgName: "incisor", position: { x: 145, y: 210 }, rotation: 0, isAdult: false },
  { number: 73, name: "Primary Canine", quadrant: 3, svgName: "canine", position: { x: 155, y: 210 }, rotation: 0, isAdult: false },
  { number: 74, name: "Primary First Molar", quadrant: 3, svgName: "molar", position: { x: 165, y: 210 }, rotation: 0, isAdult: false },
  { number: 75, name: "Primary Second Molar", quadrant: 3, svgName: "molar", position: { x: 175, y: 210 }, rotation: 0, isAdult: false },
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
    treatment: []
  },
  { 
    id: "gingiva", 
    name: "Gingiva", 
    svgName: "gingiva", 
    position: { x: 160, y: 100 },
    onExamination: [],
    diagnosis: [],
    treatment: []
  },
  { 
    id: "palate", 
    name: "Palate", 
    svgName: "palate", 
    position: { x: 160, y: 80 },
    onExamination: [],
    diagnosis: [],
    treatment: []
  },
  { 
    id: "buccal-mucosa", 
    name: "Buccal Mucosa", 
    svgName: "buccal-mucosa", 
    position: { x: 100, y: 120 },
    onExamination: [],
    diagnosis: [],
    treatment: []
  },
  { 
    id: "floor-of-mouth", 
    name: "Floor of Mouth", 
    svgName: "floor-of-mouth", 
    position: { x: 160, y: 180 },
    onExamination: [],
    diagnosis: [],
    treatment: []
  },
  { 
    id: "labial-mucosa", 
    name: "Labial Mucosa", 
     svgName: "labial-mucosa",  
    position: { x: 160, y: 60 },
    onExamination: [],
    diagnosis: [],
    treatment: []
  },
  { 
    id: "salivary-glands", 
    name: "Salivary Glands", 
    svgName: "salivary-glands", 
    position: { x: 200, y: 120 },
    onExamination: [],
    diagnosis: [],
    treatment: []
  },
  { 
    id: "frenum", 
    name: "Frenum", 
    svgName: "frenum", 
    position: { x: 160, y: 120 },
    onExamination: [],
    diagnosis: [],
    treatment: []
  }
];
// Replace the TMJ_DATA array with this:
const TMJ_DATA: TMJExamination[] = [
  { 
    id: "tmj-left", 
    name: "TMJ Left", 
    svgName: "tmj-left", 
    side: 'left', 
    position: { x: 100, y: 70 },
    onExamination: [],
    diagnosis: [],
    treatment: []
  },
  { 
    id: "tmj-right", 
    name: "TMJ Right", 
    svgName: "tmj-right", 
    side: 'right', 
    position: { x: 220, y: 70 },
    onExamination: [],
    diagnosis: [],
    treatment: []
  },
  { 
    id: "tmj-both", 
    name: "TMJ Both", 
    svgName: "tmj-both", 
    side: 'both', 
    position: { x: 160, y: 50 },
    onExamination: [],
    diagnosis: [],
    treatment: []
  }
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
  "Pericoronitis"
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
  "Apicoectomy"
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
  "Asymmetry"
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
  "Allergic Reaction"
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
  "Follow-up in 1 month"
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
  "Neck Pain"
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
  "Idiopathic"
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
  "Referral to Specialist"
];

// SVG mapping for Teeth
const TOOTH_SVGS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  incisor: IncisorSVG,
  canine: CanineSVG,
  premolar: PremolarSVG,
  molar: MolarSVG,
  wisdom: WisdomSVG || MolarSVG,
};

const SOFT_TISSUE_SVGS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  tongue: TongueSVG,
  gingiva: GingivaSVG,
  palate: PalateSVG,
  "buccal-mucosa": BuccalMucosaSVG,  // This key should match the svgName in SOFT_TISSUE_DATA
  "floor-of-mouth": FloorOfMouthSVG,
  "labial-mucosa": LabialMucosaSVG,  // This key should match the svgName in SOFT_TISSUE_DATA
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
  rotation = 0
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
      <svg width={width} height={height} viewBox="0 0 100 100" style={{ transform: `rotate(${rotation}deg)` }}>
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="4"/>
      </svg>
    );
  }

  return (
    <div style={{
      width: `${width}px`,
      height: `${height}px`,
      transform: `rotate(${rotation}deg)`,
      display: 'inline-block'
    }}>
      <SvgComponent 
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          fill: 'none',
          stroke: color,
          strokeWidth: '4px'
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
  height = 60
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
        <rect x="10" y="10" width="80" height="80" fill="none" stroke={color} strokeWidth="4" rx="10"/>
      </svg>
    );
  }

  return (
    <div style={{
      width: `${width}px`,
      height: `${height}px`,
      display: 'inline-block'
    }}>
      <SvgComponent 
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          fill: 'none',
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
  height = 60
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
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="4"/>
      </svg>
    );
  }

  return (
    <div style={{
      width: `${width}px`,
      height: `${height}px`,
      display: 'inline-block'
    }}>
      <SvgComponent 
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          fill: 'none',
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
}> = ({ toothType, rotation, selectedAreas, onAreaClick, mode, conditionsByArea = {} }) => {
  const areas = ["buccal", "mesial", "lingual", "distal", "occlusal"];
  const areaColors: Record<string, string> = {
    mesial: "#3b82f6", // blue
    distal: "#10b981", // green
    buccal: "#f59e0b", // orange
    lingual: "#8b5cf6", // purple
    occlusal: "#ef4444", // red
  };

  const createArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const start = polarToCartesian(100, 100, outerRadius, endAngle);
    const end = polarToCartesian(100, 100, outerRadius, startAngle);
    const innerStart = polarToCartesian(100, 100, innerRadius, endAngle);
    const innerEnd = polarToCartesian(100, 100, innerRadius, startAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", start.x, start.y,
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
      "L", innerEnd.x, innerEnd.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      "Z"
    ].join(" ");
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const getLabelPosition = (area: string) => {
    switch(area) {
      case "buccal":
        return { x: 100, y: 30, anchor: "middle" };
      case "mesial":
        return { x: 30, y: 100, anchor: "middle" };
      case "lingual":
        return { x: 100, y: 170, anchor: "middle" };
      case "distal":
        return { x: 170, y: 100, anchor: "middle" };
      case "occlusal":
        return { x: 100, y: 100, anchor: "middle" };
      default:
        return { x: 0, y: 0, anchor: "middle" };
    }
  };
  

  return (
    <div className="relative w-64 h-64 mx-auto">
      <svg width="100%" height="100%" viewBox="0 0 200 200" className="absolute inset-0">
        {/* Buccal (Top) - 0° to 90° */}
        <path
          d={createArcPath(0, 90, 45, 70)}
          fill={selectedAreas.includes("buccal") || (conditionsByArea?.buccal || []).length > 0 
            ? areaColors.buccal 
            : "#f3f4f6"}
          stroke="#d1d5db"
          strokeWidth="2"
          className={mode === "edit" ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
          onClick={() => mode === "edit" && onAreaClick?.("buccal")}
          opacity={selectedAreas.includes("buccal") || (conditionsByArea?.buccal || []).length > 0 ? 0.8 : 0.4}
        />
        
        {/* Distal (Right) - 90° to 180° */}
        <path
          d={createArcPath(90, 180, 45, 70)}
          fill={selectedAreas.includes("distal") || (conditionsByArea?.distal || []).length > 0 
            ? areaColors.distal 
            : "#f3f4f6"}
          stroke="#d1d5db"
          strokeWidth="2"
          className={mode === "edit" ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
          onClick={() => mode === "edit" && onAreaClick?.("distal")}
          opacity={selectedAreas.includes("distal") || (conditionsByArea?.distal || []).length > 0 ? 0.8 : 0.4}
        />
        
        {/* Lingual (Bottom) - 180° to 270° */}
        <path
          d={createArcPath(180, 270, 45, 70)}
          fill={selectedAreas.includes("lingual") || (conditionsByArea?.lingual || []).length > 0 
            ? areaColors.lingual 
            : "#f3f4f6"}
          stroke="#d1d5db"
          strokeWidth="2"
          className={mode === "edit" ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
          onClick={() => mode === "edit" && onAreaClick?.("lingual")}
          opacity={selectedAreas.includes("lingual") || (conditionsByArea?.lingual || []).length > 0 ? 0.8 : 0.4}
        />
        
        {/* Mesial (Left) - 270° to 360° */}
        <path
          d={createArcPath(270, 360, 45, 70)}
          fill={selectedAreas.includes("mesial") || (conditionsByArea?.mesial || []).length > 0 
            ? areaColors.mesial 
            : "#f3f4f6"}
          stroke="#d1d5db"
          strokeWidth="2"
          className={mode === "edit" ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
          onClick={() => mode === "edit" && onAreaClick?.("mesial")}
          opacity={selectedAreas.includes("mesial") || (conditionsByArea?.mesial || []).length > 0 ? 0.8 : 0.4}
        />
        
        {/* Occlusal (Center circle) */}
        <circle
          cx="100"
          cy="100"
          r="35"
          fill={selectedAreas.includes("occlusal") || (conditionsByArea?.occlusal || []).length > 0 
            ? areaColors.occlusal 
            : "#f3f4f6"}
          stroke="#d1d5db"
          strokeWidth="2"
          className={mode === "edit" ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
          onClick={() => mode === "edit" && onAreaClick?.("occlusal")}
          opacity={selectedAreas.includes("occlusal") || (conditionsByArea?.occlusal || []).length > 0 ? 0.8 : 0.4}
        />
        
        {/* Area Labels */}
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
                className="text-xs font-semibold fill-gray-700 pointer-events-none"
                style={{ textTransform: 'capitalize' }}
              >
                {area}
              </text>
              
              {/* Condition indicator dot */}
              {areaConditions.length > 0 && (
                <circle
                  cx={pos.x}
                  cy={area === "occlusal" ? pos.y + 15 : pos.y + 12}
                  r="4"
                  fill="#ef4444"
                  className="animate-pulse"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2 flex-wrap">
        {areas.map((area) => (
          <div key={area} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: areaColors[area] }}
            />
            <span className="text-xs text-gray-600 capitalize">{area}</span>
          </div>
        ))}
      </div>
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

const ToothPopup: React.FC<ToothPopupProps> = ({ tooth, condition, mode, onClose, onSave }) => {
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    condition?.conditions || []
  );
  const [notes, setNotes] = useState(condition?.notes || "");
  const [surfaceConditions, setSurfaceConditions] = useState<{surface: string, conditions: string[]}[]>(
    condition?.surfaceConditions || []
  );
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [procedures, setProcedures] = useState<{
    name: string;
    surface: string;
    cost?: number;
    notes?: string;
    date?: string;
  }[]>(condition?.procedures || []);

  // Handle condition toggle
  const handleConditionToggle = (conditionName: string) => {
    setSelectedConditions(prev => 
      prev.includes(conditionName)
        ? prev.filter(c => c !== conditionName)
        : [...prev, conditionName]
    );
  };

  // Handle area click - TOGGLE multiple areas
  const handleAreaClick = (area: string) => {
    setSelectedAreas(prev => {
      if (prev.includes(area)) {
        // Remove area if already selected
        return prev.filter(a => a !== area);
      } else {
        // Add area if not already selected
        return [...prev, area];
      }
    });
  };

  // Handle surface condition toggle for a specific area
  const handleSurfaceConditionToggle = (surface: string, conditionName: string) => {
    setSurfaceConditions(prev => {
      const surfaceIndex = prev.findIndex(sc => sc.surface === surface);
      
      if (surfaceIndex === -1) {
        // New surface - add with this condition
        return [...prev, { surface, conditions: [conditionName] }];
      } else {
        const updated = [...prev];
        const currentConditions = updated[surfaceIndex].conditions;
        
        if (currentConditions.includes(conditionName)) {
          // Remove condition from this surface
          updated[surfaceIndex].conditions = currentConditions.filter(c => c !== conditionName);
          if (updated[surfaceIndex].conditions.length === 0) {
            // Remove entire surface entry if no conditions left
            return prev.filter((_, i) => i !== surfaceIndex);
          }
        } else {
          // Add condition to this surface
          updated[surfaceIndex].conditions = [...currentConditions, conditionName];
        }
        return updated;
      }
    });
  };

  // Add procedure
  const handleAddProcedure = () => {
    const procedureName = prompt("Enter procedure name:");
    if (!procedureName) return;
    
    const surface = prompt("Enter surface (occlusal, buccal, lingual, mesial, distal):") || "occlusal";
    const cost = Number(prompt("Enter estimated cost:") || 0);
    const notes = prompt("Enter notes (optional):") || "";
    
    const newProcedure = {
      name: procedureName,
      surface,
      cost,
      notes
    };
    
    setProcedures([...procedures, newProcedure]);
  };

  // Remove procedure
  const handleRemoveProcedure = (index: number) => {
    const updated = procedures.filter((_, i) => i !== index);
    setProcedures(updated);
  };

  // Get conditions by area for the diagram
  const conditionsByArea: Record<string, string[]> = {};
  surfaceConditions.forEach(sc => {
    conditionsByArea[sc.surface] = sc.conditions;
  });

  // Handle save with formatted data
  const handleSave = () => {
    const toothData: Partial<ToothCondition> = {
      toothNumber: tooth.number,
      conditions: selectedConditions,
      notes,
      surfaceConditions,
      procedures: procedures
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
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-lg">
        <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Tooth #{tooth.number} (FDI)</h3>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Tooth Diagram and Areas */}
            <div className="space-y-6">
              <div className="border rounded-xl p-6 bg-gray-50">
                <h4 className="font-medium mb-4 text-center">Tooth Diagram</h4>
                
                {/* Main Tooth SVG in modal with correct rotation */}
                <div className="relative w-64 h-64 mx-auto mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ToothSVG 
                      type={tooth.svgName}
                      width={120}
                      height={120}
                      rotation={tooth.rotation || 0}
                      color={getToothColorForModal()}
                    />
                  </div>
                </div>
                
                {/* Area Markers Diagram */}
                <ToothDiagram
                  toothType={tooth.svgName}
                  rotation={tooth.rotation || 0}
                  selectedAreas={selectedAreas}
                  onAreaClick={handleAreaClick}
                  mode={mode}
                  conditionsByArea={conditionsByArea}
                />
                
                {/* Selected Areas Display */}
                {selectedAreas.length > 0 && mode === "edit" && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium mb-2 text-sm">Conditions for Selected Areas:</h5>
                    
                    {/* Show each selected area separately */}
                    <div className="space-y-3">
                      {selectedAreas.map(area => {
                        const areaConditions = surfaceConditions.find(sc => sc.surface === area)?.conditions || [];
                        const areaColor = {
                          mesial: "#3b82f6",
                          distal: "#10b981",
                          buccal: "#f59e0b",
                          lingual: "#8b5cf6",
                          occlusal: "#ef4444"
                        }[area];
                        
                        return (
                          <div key={area} className="border rounded-lg p-3 bg-white">
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: areaColor }}
                              />
                              <span className="font-medium capitalize">{area} Surface</span>
                            </div>
                            
                            {/* Current conditions for this area */}
                            <div className="mb-3">
                              <div className="text-xs text-gray-500 mb-1">Current conditions:</div>
                              <div className="flex flex-wrap gap-1">
                                {areaConditions.length > 0 ? (
                                  areaConditions.map(cond => (
                                    <Badge 
                                      key={cond} 
                                      variant="secondary" 
                                      className="text-xs flex items-center gap-1"
                                    >
                                      {cond}
                                      <button
                                        type="button"
                                        onClick={() => handleSurfaceConditionToggle(area, cond)}
                                        className="ml-1 text-red-500 hover:text-red-700"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400 italic">No conditions added</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Add condition buttons for this specific area */}
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Add condition:</div>
                              <div className="flex flex-wrap gap-1">
                                {["Caries", "Filling", "Fractured", "Sensitive"].map(cond => {
                                  const isApplied = areaConditions.includes(cond);
                                  return (
                                    <button
                                      key={cond}
                                      type="button"
                                      onClick={() => handleSurfaceConditionToggle(area, cond)}
                                      className={`px-2 py-1 text-xs border rounded transition-all ${
                                        isApplied
                                          ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                      }`}
                                    >
                                      {isApplied ? (
                                        <span className="flex items-center gap-1">
                                          <X className="h-3 w-3" />
                                          Remove {cond}
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1">
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
                        );
                      })}
                    </div>
                    
                    {/* Quick actions for ALL selected areas */}
                    <div className="mt-4 pt-4 border-t">
                      <h6 className="text-xs font-medium mb-2 text-gray-600">Quick Actions for All Selected Areas:</h6>
                      <div className="grid grid-cols-2 gap-2">
                        {["Caries", "Filling", "Fractured", "Sensitive"].map(cond => {
                          const isAppliedToAny = selectedAreas.some(area => {
                            const areaConditions = surfaceConditions.find(sc => sc.surface === area)?.conditions || [];
                            return areaConditions.includes(cond);
                          });
                          
                          return (
                            <button
                              key={cond}
                              type="button"
                              onClick={() => {
                                if (isAppliedToAny) {
                                  // Remove from all selected areas
                                  selectedAreas.forEach(area => {
                                    const areaConditions = surfaceConditions.find(sc => sc.surface === area)?.conditions || [];
                                    if (areaConditions.includes(cond)) {
                                      handleSurfaceConditionToggle(area, cond);
                                    }
                                  });
                                } else {
                                  // Add to all selected areas
                                  selectedAreas.forEach(area => {
                                    const areaConditions = surfaceConditions.find(sc => sc.surface === area)?.conditions || [];
                                    if (!areaConditions.includes(cond)) {
                                      handleSurfaceConditionToggle(area, cond);
                                    }
                                  });
                                }
                              }}
                              className={`px-2 py-1 text-xs border rounded transition-all ${
                                isAppliedToAny
                                  ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {isAppliedToAny ? (
                                <span className="flex items-center justify-center gap-1">
                                  <X className="h-3 w-3" />
                                  Remove {cond} from All
                                </span>
                              ) : (
                                <span className="flex items-center justify-center gap-1">
                                  <span>+</span>
                                  Add {cond} to All
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      * Click X on individual condition badges to remove them
                    </div>
                  </div>
                )}
              </div>

              {/* Area Conditions Summary */}
              <div>
                <h4 className="font-medium mb-3">Area-Specific Conditions</h4>
                <div className="space-y-3">
                  {["buccal", "mesial", "lingual", "distal", "occlusal"].map(area => {
                    const conditions = conditionsByArea[area] || [];
                    const areaColor = {
                      mesial: "#3b82f6",
                      distal: "#10b981",
                      buccal: "#f59e0b",
                      lingual: "#8b5cf6",
                      occlusal: "#ef4444"
                    }[area];
                    
                    if (conditions.length === 0) {
                      return null;
                    }
                    
                    return (
                      <div key={area} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: areaColor }}
                            />
                            <span className="font-medium capitalize">{area}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {conditions.length} condition(s)
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {conditions.map(cond => (
                            <Badge 
                              key={cond} 
                              variant="secondary" 
                              className="text-xs"
                            >
                              {cond}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {Object.keys(conditionsByArea).length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      No area-specific conditions recorded. Click on areas in the diagram to add conditions.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Conditions, Notes */}
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">General Tooth Conditions</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedConditions.map(cond => (
                    <Badge key={cond} variant="secondary">
                      {cond}
                    </Badge>
                  ))}
                  {selectedConditions.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No general conditions</p>
                  )}
                </div>
                
                {mode === "edit" && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <h5 className="text-sm font-medium mb-2">Add General Conditions:</h5>
                    <div className="flex flex-wrap gap-2">
                      {DENTAL_CONDITIONS.map(cond => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => handleConditionToggle(cond)}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                            selectedConditions.includes(cond)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {selectedConditions.includes(cond) ? '✓ ' : '+ '}{cond}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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

              {/* Procedures Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Procedures</h4>
                  {mode === "edit" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddProcedure}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Procedure
                    </Button>
                  )}
                </div>
                
                {procedures.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No procedures added</p>
                ) : (
                  <div className="space-y-2">
                    {procedures.map((proc, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">{proc.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {proc.surface}
                              </Badge>
                            </div>
                            {proc.notes && (
                              <p className="text-sm text-gray-600 mt-1">{proc.notes}</p>
                            )}
                            {proc.cost && proc.cost > 0 && (
                              <p className="text-sm font-medium mt-1">Cost: ₹{proc.cost}</p>
                            )}
                          </div>
                          
                          {mode === "edit" && (
                            <button
                              type="button"
                              onClick={() => handleRemoveProcedure(index)}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                              title="Remove Procedure"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
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
            <Button onClick={handleSave}>
              Save Changes
            </Button>
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
    surfaceConditions: {surface: string, conditions: string[]}[];
    notes?: string;
  }) => void;
}

const MultiToothPopup: React.FC<MultiToothPopupProps> = ({ 
  selectedTeeth, 
  toothData,
  mode, 
  onClose, 
  onSave 
}) => {
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [surfaceConditions, setSurfaceConditions] = useState<{surface: string, conditions: string[]}[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<'conditions' | 'procedures'>('conditions');

  // Get tooth names for display
  const selectedToothObjects = toothData.filter(t => selectedTeeth.includes(t.number));
  
  const handleAreaClick = (area: string) => {
    setSelectedAreas(prev => {
      if (prev.includes(area)) {
        return prev.filter(a => a !== area);
      } else {
        return [...prev, area];
      }
    });
  };

  const handleConditionToggle = (conditionName: string) => {
    setSelectedConditions(prev => 
      prev.includes(conditionName)
        ? prev.filter(c => c !== conditionName)
        : [...prev, conditionName]
    );
  };

  const handleSurfaceConditionToggle = (surface: string, conditionName: string) => {
    setSurfaceConditions(prev => {
      const surfaceIndex = prev.findIndex(sc => sc.surface === surface);
      
      if (surfaceIndex === -1) {
        return [...prev, { surface, conditions: [conditionName] }];
      } else {
        const updated = [...prev];
        const currentConditions = updated[surfaceIndex].conditions;
        
        if (currentConditions.includes(conditionName)) {
          updated[surfaceIndex].conditions = currentConditions.filter(c => c !== conditionName);
          if (updated[surfaceIndex].conditions.length === 0) {
            return prev.filter((_, i) => i !== surfaceIndex);
          }
        } else {
          updated[surfaceIndex].conditions = [...currentConditions, conditionName];
        }
        return updated;
      }
    });
  };

  const handleAddProcedure = () => {
    const procedureName = prompt("Enter procedure name:");
    if (!procedureName) return;
    
    const surface = prompt("Enter surface (occlusal, buccal, lingual, mesial, distal):") || "occlusal";
    const cost = Number(prompt("Enter estimated cost:") || 0);
    const notes = prompt("Enter notes (optional):") || "";
    
    const newProcedure = {
      name: procedureName,
      surface,
      cost,
      notes,
      date: new Date().toISOString()
    };
    
    setProcedures([...procedures, newProcedure]);
  };

  const handleSave = () => {
    onSave({
      teethNumbers: selectedTeeth,
      conditions: selectedConditions,
      procedures,
      surfaceConditions,
      notes
    });
  };

  const conditionsByArea: Record<string, string[]> = {};
  surfaceConditions.forEach(sc => {
    conditionsByArea[sc.surface] = sc.conditions;
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-lg">
        <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Bulk Edit - {selectedTeeth.length} Teeth Selected
            </h3>
            <p className="text-sm text-muted-foreground">
              Teeth: {selectedTeeth.sort((a, b) => a - b).join(", ")}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Selected Teeth Preview */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Selected Teeth</h4>
            <div className="flex flex-wrap gap-3">
              {selectedToothObjects.map(tooth => (
                <div key={tooth.number} className="flex flex-col items-center">
                  <ToothSVG
                    type={tooth.svgName}
                    width={50}
                    height={50}
                    rotation={tooth.rotation}
                    color="#4b5563"
                  />
                  <div className="mt-1 text-xs font-bold bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                    {tooth.number}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b mb-6">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab('conditions')}
                className={`px-4 py-2 font-medium ${activeTab === 'conditions' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
              >
                Conditions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('procedures')}
                className={`px-4 py-2 font-medium ${activeTab === 'procedures' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
              >
                Procedures
              </button>
            </div>
          </div>

          {activeTab === 'conditions' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Surface Selection */}
              <div className="space-y-6">
                <div className="border rounded-xl p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Surface Selection</h4>
                  
                  <ToothDiagram
                    toothType="molar"
                    rotation={0}
                    selectedAreas={selectedAreas}
                    onAreaClick={handleAreaClick}
                    mode={mode}
                    conditionsByArea={conditionsByArea}
                  />
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Selected surfaces will apply to all {selectedTeeth.length} teeth
                    </p>
                    {selectedAreas.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedAreas.map(area => (
                          <Badge key={area} variant="secondary" className="capitalize">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Surface Conditions */}
                {selectedAreas.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Surface Conditions</h4>
                    <div className="space-y-3">
                      {selectedAreas.map(area => {
                        const areaConditions = surfaceConditions.find(sc => sc.surface === area)?.conditions || [];
                        
                        return (
                          <div key={area} className="border rounded p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="capitalize">
                                {area}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {areaConditions.length} condition(s)
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              {areaConditions.map(cond => (
                                <Badge key={cond} variant="secondary" className="text-xs flex items-center gap-1">
                                  {cond}
                                  <button
                                    type="button"
                                    onClick={() => handleSurfaceConditionToggle(area, cond)}
                                    className="ml-1 text-red-500 hover:text-red-700"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              {["Caries", "Filling", "Fractured", "Sensitive"].map(cond => {
                                const isApplied = areaConditions.includes(cond);
                                return (
                                  <button
                                    key={cond}
                                    type="button"
                                    onClick={() => handleSurfaceConditionToggle(area, cond)}
                                    className={`px-2 py-1 text-xs border rounded ${
                                      isApplied
                                        ? 'bg-red-100 text-red-700 border-red-200'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {isApplied ? `Remove ${cond}` : `Add ${cond}`}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: General Conditions */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">General Tooth Conditions</h4>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedConditions.map(cond => (
                        <Badge key={cond} variant="secondary">
                          {cond}
                          <button
                            type="button"
                            onClick={() => handleConditionToggle(cond)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Common Conditions:</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {["Caries", "Missing", "Filling", "Crown", "Root Canal", "Extraction Needed"].map(cond => (
                          <button
                            key={cond}
                            type="button"
                            onClick={() => handleConditionToggle(cond)}
                            className={`px-3 py-2 border rounded text-sm ${
                              selectedConditions.includes(cond)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {selectedConditions.includes(cond) ? '✓ ' : '+ '}{cond}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <textarea
                    className="w-full border rounded-lg p-3 text-sm min-h-[100px]"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes for all selected teeth..."
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Procedures Tab */
            <div className="space-y-6">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Procedures</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddProcedure}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Procedure
                  </Button>
                </div>
                
                {procedures.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No procedures added. Click "Add Procedure" to add one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {procedures.map((proc, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{proc.name}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                Surface: {proc.surface}
                              </Badge>
                              {proc.cost > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Cost: ₹{proc.cost}
                                </Badge>
                              )}
                            </div>
                            {proc.notes && (
                              <p className="text-sm text-gray-600 mt-2">{proc.notes}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = procedures.filter((_, i) => i !== index);
                              setProcedures(updated);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Will apply to all {selectedTeeth.length} selected teeth
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground">
            Apply to All {selectedTeeth.length} Teeth
          </Button>
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

const SoftTissuePopup: React.FC<SoftTissuePopupProps> = ({ tissue, mode, onClose, onSave }) => {
  const [onExamination, setOnExamination] = useState<string[]>(tissue.onExamination || []);
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
    setOnExamination(onExamination.filter(item => item !== value));
  };

  const handleRemoveDiagnosis = (value: string) => {
    setDiagnosis(diagnosis.filter(item => item !== value));
  };

  const handleRemoveTreatment = (value: string) => {
    setTreatment(treatment.filter(item => item !== value));
  };

  const handleSave = () => {
    const updatedTissue: SoftTissueExamination = {
      ...tissue,
      onExamination,
      diagnosis,
      treatment,
      notes,
      date: new Date().toISOString()
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
              <h3 className="text-lg font-semibold">Soft Tissue: {tissue.name}</h3>
              <p className="text-sm text-muted-foreground">Oral Cavity Examination</p>
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
                    {onExamination.map(item => (
                      <Badge key={item} variant="secondary" className="flex items-center gap-1">
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
                        {SOFT_TISSUE_EXAMINATION_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
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
                    {diagnosis.map(item => (
                      <Badge key={item} variant="secondary" className="flex items-center gap-1">
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
                        {SOFT_TISSUE_DIAGNOSIS_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
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
                    {treatment.map(item => (
                      <Badge key={item} variant="secondary" className="flex items-center gap-1">
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
                        {SOFT_TISSUE_TREATMENT_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
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
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
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
  const [onExamination, setOnExamination] = useState<string[]>(tmj.onExamination || []);
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
    setOnExamination(onExamination.filter(item => item !== value));
  };

  const handleRemoveDiagnosis = (value: string) => {
    setDiagnosis(diagnosis.filter(item => item !== value));
  };

  const handleRemoveTreatment = (value: string) => {
    setTreatment(treatment.filter(item => item !== value));
  };

  const handleSave = () => {
    const updatedTMJ: TMJExamination = {
      ...tmj,
      onExamination,
      diagnosis,
      treatment,
      notes,
      date: new Date().toISOString()
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
              <p className="text-sm text-muted-foreground">Temporomandibular Joint Examination</p>
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
                <h4 className="font-medium mb-4 text-center">{tmj.name} ({tmj.side})</h4>
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
                    {onExamination.map(item => (
                      <Badge key={item} variant="secondary" className="flex items-center gap-1">
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
                        {TMJ_EXAMINATION_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
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
                    {diagnosis.map(item => (
                      <Badge key={item} variant="secondary" className="flex items-center gap-1">
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
                        {TMJ_DIAGNOSIS_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
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
                    {treatment.map(item => (
                      <Badge key={item} variant="secondary" className="flex items-center gap-1">
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
                        {TMJ_TREATMENT_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
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
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
              Save Changes
            </Button>
          )}
        </div>
      </div>
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
  const [toothConditions, setToothConditions] = useState<ToothCondition[]>(existingConditions);
  const [softTissues, setSoftTissues] = useState<SoftTissueExamination[]>(() => {
  if (existingSoftTissues && existingSoftTissues.length > 0) {
    return existingSoftTissues;
  }
  // Initialize with empty arrays for all soft tissues
  return SOFT_TISSUE_DATA.map(tissue => ({
    ...tissue,
    onExamination: [],
    diagnosis: [],
    treatment: []
  }));
});
const [tmjExaminations, setTMJExaminations] = useState<TMJExamination[]>(() => {
  if (existingTMJExaminations && existingTMJExaminations.length > 0) {
    return existingTMJExaminations;
  }
  // Initialize with empty arrays for all TMJ examinations
  return TMJ_DATA.map(tmj => ({
    ...tmj,
    onExamination: [],
    diagnosis: [],
    treatment: []
  }));
})
  const [selectedSoftTissue, setSelectedSoftTissue] = useState<SoftTissueExamination | null>(null);
  const [selectedTMJ, setSelectedTMJ] = useState<TMJExamination | null>(null);
  const [chartType, setChartType] = useState<"adult" | "pediatric">("adult");
  const [selectedQuadrant, setSelectedQuadrant] = useState<"all" | 1 | 2 | 3 | 4>("all");
  const [showTreatmentPlanForm, setShowTreatmentPlanForm] = useState(false);
  const [selectedStage, setSelectedStage] = useState(1);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlanData | null>(
    existingTreatmentPlan || null
  );
  
  // Multiple Teeth Selection States
  const [selectionMode, setSelectionMode] = useState<"single" | "multiple">("single");
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [multipleSelectionType, setMultipleSelectionType] = useState<
    "full-mouth" | "upper" | "lower" | "upper-right" | "upper-left" | "lower-right" | "lower-left" | "custom"
  >("full-mouth");
  
  // NEW: Multi-tooth modal state
  const [showMultiToothModal, setShowMultiToothModal] = useState(false);
  
  // NEW: Active Tab State
  const [activeTab, setActiveTab] = useState<"teeth" | "soft-tissue" | "tmj">("teeth");
  
  const toothData = chartType === "adult" ? ADULT_TOOTH_DATA : PEDIATRIC_TOOTH_DATA;
  
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

  // Function to get tooth numbers based on selection type
  const getTeethNumbersBySelectionType = (type: string): number[] => {
    const allTeeth = chartType === "adult" 
      ? ADULT_TOOTH_DATA.map(t => t.number)
      : PEDIATRIC_TOOTH_DATA.map(t => t.number);
    
    switch(type) {
      case "full-mouth":
        return allTeeth;
      case "upper":
        return allTeeth.filter(num => num >= 11 && num <= 28);
      case "lower":
        return allTeeth.filter(num => num >= 31 && num <= 48);
      case "upper-right":
        return allTeeth.filter(num => num >= 11 && num <= 18);
      case "upper-left":
        return allTeeth.filter(num => num >= 21 && num <= 28);
      case "lower-right":
        return allTeeth.filter(num => num >= 41 && num <= 48);
      case "lower-left":
        return allTeeth.filter(num => num >= 31 && num <= 38);
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
      setSelectedTeeth(prev => 
        prev.includes(toothNumber)
          ? prev.filter(num => num !== toothNumber)
          : [...prev, toothNumber]
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
    surfaceConditions: {surface: string, conditions: string[]}[];
    notes?: string;
  }) => {
    const updatedConditions = [...toothConditions];
    
    data.teethNumbers.forEach(toothNumber => {
      const existingIndex = updatedConditions.findIndex(tc => tc.toothNumber === toothNumber);
      
      if (existingIndex >= 0) {
        // Update existing condition
        const existing = updatedConditions[existingIndex];
        updatedConditions[existingIndex] = {
          ...existing,
          conditions: [...new Set([...existing.conditions, ...data.conditions])],
          notes: data.notes || existing.notes,
          surfaceConditions: [
            ...existing.surfaceConditions,
            ...data.surfaceConditions.map(sc => ({
              surface: sc.surface,
              conditions: sc.conditions
            }))
          ],
          procedures: [
            ...existing.procedures,
            ...data.procedures.map(p => ({
              ...p,
              date: p.date || new Date().toISOString()
            }))
          ]
        };
      } else {
        // Create new condition
        const tooth = toothData.find(t => t.number === toothNumber);
        updatedConditions.push({
          toothNumber,
          conditions: data.conditions,
          notes: data.notes || "",
          procedures: data.procedures.map(p => ({
            ...p,
            date: p.date || new Date().toISOString()
          })),
          surfaceConditions: data.surfaceConditions.map(sc => ({
            surface: sc.surface,
            conditions: sc.conditions
          })),
          color: "#4b5563"
        });
      }
    });
    
    setToothConditions(updatedConditions);
    setSelectedTeeth([]);
    setShowMultiToothModal(false);
    
    // Trigger any procedure added callbacks
    if (onProcedureAdded && data.procedures.length > 0) {
      data.teethNumbers.forEach(toothNumber => {
        data.procedures.forEach(proc => {
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
    const existingIndex = softTissues.findIndex(st => st.id === data.id);
    
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
    const existingIndex = tmjExaminations.findIndex(tmj => tmj.id === data.id);
    
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
      .filter(tc => 
        tc.conditions.length > 0 || 
        tc.surfaceConditions?.length > 0 || 
        tc.procedures?.length > 0  // No status filter
      )
      .map(tc => ({
        toothNumber: tc.toothNumber,
        conditions: tc.conditions || [],
        surfaceConditions: (tc.surfaceConditions || []).map(sc => ({
          surface: sc.surface,
          conditions: sc.conditions || []
        })),
        procedures: (tc.procedures || []) // No status filter
          .map(p => ({
            name: p.name,
            surface: p.surface || "occlusal",
            cost: p.cost || 0,
            notes: p.notes || "",
            performedAt: p.date || new Date().toISOString()
          }))
      }));
    
    console.log("✅ Performed teeth:", performedTeeth);
    
    // Format planned procedures for treatment plan (NO status)
    const plannedProcedures = toothConditions
      .flatMap(tc => 
        (tc.procedures || []) // No status filter
          .map(p => ({
            toothNumber: tc.toothNumber,
            name: p.name,
            surface: p.surface || "occlusal",
            estimatedCost: p.cost || 0,
            notes: p.notes || "",
            // NO status field
          }))
      );

    console.log("✅ Planned procedures:", plannedProcedures);

    // ✅ Format treatment plan for backend
    let formattedTreatmentPlan = null;
    if (treatmentPlan) {
      console.log("📋 Formatting treatment plan for backend...");
      
      // Check if any procedures are in Stage 1 (for startToday logic)
      const stage1Procedures = treatmentPlan.teeth.flatMap(t => 
        t.procedures.filter(p => p.stage === 1)
      );
      const shouldStartToday = stage1Procedures.length > 0; // Simple logic
      
      console.log(`Stage 1: ${stage1Procedures.length} procedures`);
      console.log(`Should start today: ${shouldStartToday}`);
      
      // Build stages with toothSurfaceProcedures and procedureRefs
      const proceduresByStage: Record<number, any[]> = {};
      
      treatmentPlan.teeth.forEach(toothPlan => {
        toothPlan.procedures.forEach((proc: any) => { 
          const stageNum = (proc as any).stage || 1; 
          if (!proceduresByStage[stageNum]) {
            proceduresByStage[stageNum] = [];
          }
          
          proceduresByStage[stageNum].push({
            toothNumber: toothPlan.toothNumber,
            name: proc.name,
            surface: proc.surface || 'occlusal',
            estimatedCost: proc.estimatedCost || 0,
            notes: proc.notes || '',
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
        const procedureRefs = proceduresInThisStage.map(proc => ({
          toothNumber: proc.toothNumber,
          procedureName: proc.name
        }));
        
        proceduresInThisStage.forEach(proc => {
          if (!toothSurfaceMap[proc.toothNumber]) {
            toothSurfaceMap[proc.toothNumber] = {};
          }
          
          const surfaceKey = proc.surface || 'occlusal';
          if (!toothSurfaceMap[proc.toothNumber][surfaceKey]) {
            toothSurfaceMap[proc.toothNumber][surfaceKey] = [];
          }
          
          if (!toothSurfaceMap[proc.toothNumber][surfaceKey].includes(proc.name)) {
            toothSurfaceMap[proc.toothNumber][surfaceKey].push(proc.name);
          }
        });
        
        // Convert to toothSurfaceProcedures format
        const toothSurfaceProcedures = Object.entries(toothSurfaceMap).map(([toothNumStr, surfaces]) => {
          const surfaceProcedures = Object.entries(surfaces).map(([surface, procedureNames]) => ({
            surface: surface,
            procedureNames: procedureNames
          }));
          
          return {
            toothNumber: parseInt(toothNumStr),
            surfaceProcedures: surfaceProcedures
          };
        });
        
        return {
          stageNumber: stageNumber,
          stageName: stage.stageName || `Stage ${stageNumber}`,
          description: stage.description || '',
          // ✅ Required procedureRefs property
          procedureRefs: procedureRefs,
          status: stage.status || 'pending',
          scheduledDate: stage.scheduledDate || new Date().toISOString().split('T')[0],
          // ✅ Optional toothSurfaceProcedures
          toothSurfaceProcedures: toothSurfaceProcedures,
          notes: stage.notes || '',
          ...(stage.status === 'in-progress' && { startedAt: new Date().toISOString() }),
          ...(stage.status === 'completed' && { completedAt: new Date().toISOString() })
        };
      });
      
      formattedTreatmentPlan = {
        planName: treatmentPlan.planName.trim(),
        description: treatmentPlan.description?.trim() || '',
        teeth: treatmentPlan.teeth.map(toothPlan => ({
          toothNumber: toothPlan.toothNumber,
          priority: toothPlan.priority || 'medium',
          isCompleted: false,
          procedures: toothPlan.procedures.map(proc => ({
            name: proc.name,
            surface: proc.surface || 'occlusal',
            stage: proc.stage || 1,
            estimatedCost: proc.estimatedCost || 0,
            notes: proc.notes || '',
            // NO status field
          }))
        })),
        stages: stagesData,
        startToday: shouldStartToday
      };
      
      console.log("✅ Final treatment plan structure:", {
        planName: formattedTreatmentPlan.planName,
        teethCount: formattedTreatmentPlan.teeth.length,
        stagesCount: formattedTreatmentPlan.stages.length,
        startToday: formattedTreatmentPlan.startToday,
        totalProcedures: formattedTreatmentPlan.teeth.reduce((sum: number, t: any) => 
          sum + t.procedures.length, 0
        )
      });
      
      // Log each stage status
      console.log("📊 Stage Statuses being sent:");
      formattedTreatmentPlan.stages.forEach((stage: any, index: number) => {
        console.log(`  Stage ${stage.stageNumber}: ${stage.stageName} - Status: ${stage.status}`);
      });
    }

    return { 
      performedTeeth, 
      plannedProcedures, 
      treatmentPlan: formattedTreatmentPlan,
      softTissues,
      tmjExaminations
    };
  };
    
  const handleClose = () => {
    console.log("🦷 DentalChart handleClose called");
    
    // Always format and send data, even if empty
    const dentalData = formatDentalDataForAPI();
    
    console.log("📤 Sending dental data to parent:", {
      performedTeeth: dentalData.performedTeeth?.length || 0,
      plannedProcedures: dentalData.plannedProcedures?.length || 0,
      hasTreatmentPlan: !!dentalData.treatmentPlan,
      softTissues: dentalData.softTissues?.length || 0,
      tmjExaminations: dentalData.tmjExaminations?.length || 0,
      treatmentPlan: dentalData.treatmentPlan ? {
        planName: dentalData.treatmentPlan.planName,
        teethCount: dentalData.treatmentPlan.teeth?.length || 0,
        startToday: dentalData.treatmentPlan.startToday
      } : null
    });
    
    if (onSave) {
      onSave(dentalData);
    }
    
    if (onClose) onClose();
  };

  // Function to get teeth sorted by their X position for proper display
  const getSortedTeethByQuadrant = (quadrant: number) => {
    const teethInQuadrant = toothData.filter(t => t.quadrant === quadrant);
    return teethInQuadrant.sort((a, b) => a.position.x - b.position.x);
  };

  const getToothColor = (toothNumber: number) => {
    const condition = toothConditions.find(tc => tc.toothNumber === toothNumber);
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
        const condition = toothConditions.find(tc => tc.toothNumber === tooth.number) || null;
        onToothSelected(tooth, condition);
      }
    }
  };

  const handleSaveToothData = (data: Partial<ToothCondition>) => {
    if (!selectedTooth) return;
    
    const existingIndex = toothConditions.findIndex(
      tc => tc.toothNumber === selectedTooth.number
    );
    
    const updatedCondition: ToothCondition = {
      toothNumber: selectedTooth.number,
      conditions: data.conditions || [],
      notes: data.notes || "",
      procedures: data.procedures || [],
      surfaceConditions: data.surfaceConditions || [],
      color: getToothColor(selectedTooth.number)
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
      caries: toothConditions.filter(tc => tc.conditions.includes("Caries")).length,
      missing: toothConditions.filter(tc => tc.conditions.includes("Missing")).length,
      fillings: toothConditions.filter(tc => tc.conditions.includes("Filling")).length,
      procedures: toothConditions.reduce((sum, tc) => sum + (tc.procedures?.length || 0), 0),
      softTissuesExamined: softTissues.filter(st => 
        st.onExamination.length > 0 || 
        st.diagnosis.length > 0 || 
        st.treatment.length > 0
      ).length,
      tmjExamined: tmjExaminations.filter(tmj => 
        tmj.onExamination.length > 0 || 
        tmj.diagnosis.length > 0 || 
        tmj.treatment.length > 0
      ).length,
    };
    return stats;
  };

  const handleCreateTreatmentPlan = () => {
    setShowTreatmentPlanForm(true);
  };

  const handleSaveTreatmentPlan = (plan: TreatmentPlanData) => {
    console.log("✅ Received plan from form WITH TEETH:", plan);
    
    // Verify that teeth data exists
    if (!plan.teeth || plan.teeth.length === 0) {
      console.error("❌ Treatment plan has no teeth data!");
      alert("Error: Treatment plan must include teeth procedures. Please add procedures to teeth.");
      return;
    }
    
    // CRITICAL FIX: Ensure stages have proper status from the plan
    const enhancedPlan = {
      ...plan,
      stages: plan.stages.map((stage, index) => {
        // Preserve the status from the form (which comes from the stage status toggle buttons)
        const stageFromPlan = plan.stages[index];
        return {
          ...stage,
          status: stageFromPlan?.status || 'pending', // Use the status from the form
          stageNumber: index + 1 // Ensure stage numbers are sequential
        };
      }),
      teeth: plan.teeth
    };
    
    console.log("✅ Enhanced treatment plan with statuses:", enhancedPlan);
    console.log("📊 Stage Statuses:");
    enhancedPlan.stages.forEach((stage, index) => {
      console.log(`  Stage ${index + 1}: ${stage.stageName} - Status: ${stage.status}`);
    });
    
    setTreatmentPlan(enhancedPlan);
    setShowTreatmentPlanForm(false);
  };

  const stats = getConditionSummary();

  // Get teeth for each arch based on selected quadrant
  const getTeethForDisplay = () => {
    if (selectedQuadrant === "all") {
      return {
        upperRight: getSortedTeethByQuadrant(1),
        upperLeft: getSortedTeethByQuadrant(2),
        lowerRight: getSortedTeethByQuadrant(4),
        lowerLeft: getSortedTeethByQuadrant(3)
      };
    } else if (selectedQuadrant === 1) {
      return {
        upperRight: getSortedTeethByQuadrant(1),
        upperLeft: [],
        lowerRight: [],
        lowerLeft: []
      };
    } else if (selectedQuadrant === 2) {
      return {
        upperRight: [],
        upperLeft: getSortedTeethByQuadrant(2),
        lowerRight: [],
        lowerLeft: []
      };
    } else if (selectedQuadrant === 3) {
      return {
        upperRight: [],
        upperLeft: [],
        lowerRight: [],
        lowerLeft: getSortedTeethByQuadrant(3)
      };
    } else if (selectedQuadrant === 4) {
      return {
        upperRight: [],
        upperLeft: [],
        lowerRight: getSortedTeethByQuadrant(4),
        lowerLeft: []
      };
    }
    
    // Default to all
    return {
      upperRight: getSortedTeethByQuadrant(1),
      upperLeft: getSortedTeethByQuadrant(2),
      lowerRight: getSortedTeethByQuadrant(4),
      lowerLeft: getSortedTeethByQuadrant(3)
    };
  };

  const displayTeeth = getTeethForDisplay();
  const upperRightTeeth = displayTeeth.upperRight;
  const upperLeftTeeth = displayTeeth.upperLeft;
  const lowerRightTeeth = displayTeeth.lowerRight;
  const lowerLeftTeeth = displayTeeth.lowerLeft;

  // Render Teeth Tab Content
  const renderTeethTab = () => (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Chart Type:</label>
          <div className="flex border rounded-lg">
            <button
              type="button"
              onClick={() => setChartType("adult")}
              className={`px-3 py-1 text-sm ${chartType === "adult" ? 'bg-primary text-primary-foreground' : 'bg-white'}`}
            >
              Adult (Permanent)
            </button>
            <button
              type="button"
              onClick={() => setChartType("pediatric")}
              className={`px-3 py-1 text-sm ${chartType === "pediatric" ? 'bg-primary text-primary-foreground' : 'bg-white'}`}
            >
              Pediatric (Primary)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Quadrant:</label>
          <div className="flex border rounded-lg">
            <button
              type="button"
              onClick={() => setSelectedQuadrant("all")}
              className={`px-3 py-1 text-sm ${selectedQuadrant === "all" ? 'bg-primary text-primary-foreground' : 'bg-white'}`}
            >
              All
            </button>
            {[1, 2, 3, 4].map(q => (
              <button
                key={q}
                type="button"
                onClick={() => setSelectedQuadrant(q as 1 | 2 | 3 | 4)}
                className={`px-3 py-1 text-sm ${selectedQuadrant === q ? 'bg-primary text-primary-foreground' : 'bg-white'}`}
              >
                Q{q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selection Mode Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Selection Mode:</label>
            <div className="flex border rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setSelectionMode("single");
                  setSelectedTeeth([]);
                }}
                className={`px-3 py-1 text-sm flex items-center gap-2 ${
                  selectionMode === "single" ? 'bg-primary text-primary-foreground' : 'bg-white'
                }`}
              >
                {selectionMode === "single" ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Single Tooth
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectionMode("multiple");
                  handleMultipleSelection("full-mouth");
                }}
                className={`px-3 py-1 text-sm flex items-center gap-2 ${
                  selectionMode === "multiple" ? 'bg-primary text-primary-foreground' : 'bg-white'
                }`}
              >
                {selectionMode === "multiple" ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Multiple Teeth
              </button>
            </div>
          </div>
          
          {/* Open Multi-Tooth Modal Button */}
          {selectionMode === "multiple" && selectedTeeth.length > 0 && (
            <Button 
              onClick={handleOpenMultiToothModal}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Edit {selectedTeeth.length} Teeth
            </Button>
          )}
        </div>

        {/* Multiple Teeth Selection Controls */}
        {selectionMode === "multiple" && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Multiple Teeth Selection</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedTeeth.length} teeth selected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  disabled={selectedTeeth.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { type: "full-mouth", label: "Full Mouth" },
                { type: "upper", label: "Upper Arch" },
                { type: "lower", label: "Lower Arch" },
                { type: "upper-right", label: "Upper Right" },
                { type: "upper-left", label: "Upper Left" },
                { type: "lower-right", label: "Lower Right" },
                { type: "lower-left", label: "Lower Left" },
                { type: "custom", label: "Custom Select" }
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
                  className={`px-3 py-2 border rounded text-sm ${
                    multipleSelectionType === item.type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            
            {multipleSelectionType === "custom" && (
              <div className="mt-3 text-sm text-gray-600">
                <p>Click on individual teeth to select/deselect them</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Teeth Color Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
          <span>Caries</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
          <span>Filling</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
          <span>Crown</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
          <span>Root Canal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#9ca3af]"></div>
          <span>Missing</span>
        </div>
        {/* Selection highlight color */}
        {selectionMode === "multiple" && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#22c55e] border-2 border-white"></div>
            <span>Selected</span>
          </div>
        )}
      </div>

      {/* Teeth Chart */}
      <div className="relative border border-border rounded-xl bg-white p-6">
        {/* Only show Maxillary label if we have upper teeth to display */}
        {(upperRightTeeth.length > 0 || upperLeftTeeth.length > 0) && (
          <div className="text-center mb-6">
            <Badge variant="outline">Maxillary (Upper Arch)</Badge>
          </div>
        )}

        {/* Upper Arch - Only show if we have upper teeth */}
        {(upperRightTeeth.length > 0 || upperLeftTeeth.length > 0) && (
          <div className="flex justify-center items-center gap-4 mb-16">
            {/* Quadrant 1 - Upper Right */}
            {upperRightTeeth.map(tooth => {
              const condition = toothConditions.find(tc => tc.toothNumber === tooth.number);
              const isSelected = selectedTeeth.includes(tooth.number);
              
              return (
                <div key={tooth.number} className="relative group flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => handleToothClick(tooth)}
                    className="relative transition-transform hover:scale-110"
                    disabled={mode === "view" && selectionMode === "multiple"}
                  >
                    <ToothSVG
                      type={tooth.svgName}
                      color={isSelected ? "#22c55e" : getToothColor(tooth.number)}
                      width={chartType === "adult" ? 60 : 56}
                      height={chartType === "adult" ? 60 : 56}
                      rotation={tooth.rotation}
                    />
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute -inset-1 border-2 border-green-500 rounded-lg animate-pulse pointer-events-none"></div>
                    )}
                    {condition && !isSelected && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${condition.conditions.length > 0 ? 'animate-pulse' : ''}`}
                              style={{ backgroundColor: getToothColor(tooth.number) }} />
                          {/* Show indicator if tooth has any procedures */}
                          {condition.procedures?.length > 0 && (
                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                  <div className={`mt-2 text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-green-500 text-white' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {tooth.number}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Tooth #{tooth.number} (FDI): {tooth.name}
                    {isSelected && (
                      <div className="mt-1 text-green-300 text-[10px]">Selected</div>
                    )}
                    {condition && condition.conditions.length > 0 && (
                      <div className="mt-1">
                        {condition.conditions.slice(0, 2).map(c => (
                          <div key={c} className="text-[10px]">• {c}</div>
                        ))}
                        {condition.conditions.length > 2 && (
                          <div className="text-[10px]">+{condition.conditions.length - 2} more</div>
                        )}
                      </div>
                    )}
                    {condition && condition.procedures?.length > 0 && (
                      <div className="mt-1">
                        <div className="text-[10px] text-green-300">
                          {condition.procedures.length} procedure{condition.procedures.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quadrant 2 - Upper Left */}
            {upperLeftTeeth.map(tooth => {
              const condition = toothConditions.find(tc => tc.toothNumber === tooth.number);
              const isSelected = selectedTeeth.includes(tooth.number);
              
              return (
                <div key={tooth.number} className="relative group flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => handleToothClick(tooth)}
                    className="relative transition-transform hover:scale-110"
                    disabled={mode === "view" && selectionMode === "multiple"}
                  >
                    <ToothSVG
                      type={tooth.svgName}
                      color={isSelected ? "#22c55e" : getToothColor(tooth.number)}
                      width={chartType === "adult" ? 60 : 56}
                      height={chartType === "adult" ? 60 : 56}
                      rotation={tooth.rotation}
                    />
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute -inset-1 border-2 border-green-500 rounded-lg animate-pulse pointer-events-none"></div>
                    )}
                    {condition && !isSelected && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${condition.conditions.length > 0 ? 'animate-pulse' : ''}`}
                              style={{ backgroundColor: getToothColor(tooth.number) }} />
                          {/* Show indicator if tooth has any procedures */}
                          {condition.procedures?.length > 0 && (
                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                  <div className={`mt-2 text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-green-500 text-white' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {tooth.number}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Tooth #{tooth.number} (FDI): {tooth.name}
                    {isSelected && (
                      <div className="mt-1 text-green-300 text-[10px]">Selected</div>
                    )}
                    {condition && condition.conditions.length > 0 && (
                      <div className="mt-1">
                        {condition.conditions.slice(0, 2).map(c => (
                          <div key={c} className="text-[10px]">• {c}</div>
                        ))}
                        {condition.conditions.length > 2 && (
                          <div className="text-[10px]">+{condition.conditions.length - 2} more</div>
                        )}
                      </div>
                    )}
                    {condition && condition.procedures?.length > 0 && (
                      <div className="mt-1">
                        <div className="text-[10px] text-green-300">
                          {condition.procedures.length} procedure{condition.procedures.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Only show midline if we have both upper and lower teeth */}
        {(upperRightTeeth.length > 0 || upperLeftTeeth.length > 0) && 
        (lowerRightTeeth.length > 0 || lowerLeftTeeth.length > 0) && (
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0 h-full w-px bg-gray-300"></div>
        )}

        {/* Only show Mandibular label if we have lower teeth to display */}
        {(lowerRightTeeth.length > 0 || lowerLeftTeeth.length > 0) && (
          <div className="text-center mt-12">
            <Badge variant="outline">Mandibular (Lower Arch)</Badge>
          </div>
        )}

        {/* Lower Arch - Only show if we have lower teeth */}
        {(lowerRightTeeth.length > 0 || lowerLeftTeeth.length > 0) && (
          <div className="flex justify-center items-center gap-4 mt-12">
            {/* Quadrant 4 - Lower Right */}
            {lowerRightTeeth.map(tooth => {
              const condition = toothConditions.find(tc => tc.toothNumber === tooth.number);
              const isSelected = selectedTeeth.includes(tooth.number);
              
              return (
                <div key={tooth.number} className="relative group flex flex-col items-center">
                  <div className={`mb-3 text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-green-500 text-white' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {tooth.number}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToothClick(tooth)}
                    className="relative transition-transform hover:scale-110"
                    disabled={mode === "view" && selectionMode === "multiple"}
                  >
                    <ToothSVG
                      type={tooth.svgName}
                      color={isSelected ? "#22c55e" : getToothColor(tooth.number)}
                      width={chartType === "adult" ? 60 : 56}
                      height={chartType === "adult" ? 60 : 56}
                      rotation={tooth.rotation}
                    />
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute -inset-1 border-2 border-green-500 rounded-lg animate-pulse pointer-events-none"></div>
                    )}
                    {condition && !isSelected && (
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${condition.conditions.length > 0 ? 'animate-pulse' : ''}`}
                              style={{ backgroundColor: getToothColor(tooth.number) }} />
                          {/* Show indicator if tooth has any procedures */}
                          {condition.procedures?.length > 0 && (
                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Tooth #{tooth.number} (FDI): {tooth.name}
                    {isSelected && (
                      <div className="mt-1 text-green-300 text-[10px]">Selected</div>
                    )}
                    {condition && condition.conditions.length > 0 && (
                      <div className="mt-1">
                        {condition.conditions.slice(0, 2).map(c => (
                          <div key={c} className="text-[10px]">• {c}</div>
                        ))}
                        {condition.conditions.length > 2 && (
                          <div className="text-[10px]">+{condition.conditions.length - 2} more</div>
                        )}
                      </div>
                    )}
                    {condition && condition.procedures?.length > 0 && (
                      <div className="mt-1">
                        <div className="text-[10px] text-green-300">
                          {condition.procedures.length} procedure{condition.procedures.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quadrant 3 - Lower Left */}
            {lowerLeftTeeth.map(tooth => {
              const condition = toothConditions.find(tc => tc.toothNumber === tooth.number);
              const isSelected = selectedTeeth.includes(tooth.number);
              
              return (
                <div key={tooth.number} className="relative group flex flex-col items-center">
                  <div className={`mb-3 text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-green-500 text-white' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {tooth.number}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToothClick(tooth)}
                    className="relative transition-transform hover:scale-110"
                    disabled={mode === "view" && selectionMode === "multiple"}
                  >
                    <ToothSVG
                      type={tooth.svgName}
                      color={isSelected ? "#22c55e" : getToothColor(tooth.number)}
                      width={chartType === "adult" ? 60 : 56}
                      height={chartType === "adult" ? 60 : 56}
                      rotation={tooth.rotation}
                    />
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute -inset-1 border-2 border-green-500 rounded-lg animate-pulse pointer-events-none"></div>
                    )}
                    {condition && !isSelected && (
                      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${condition.conditions.length > 0 ? 'animate-pulse' : ''}`}
                              style={{ backgroundColor: getToothColor(tooth.number) }} />
                          {/* Show indicator if tooth has any procedures */}
                          {condition.procedures?.length > 0 && (
                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Tooth #{tooth.number} (FDI): {tooth.name}
                    {isSelected && (
                      <div className="mt-1 text-green-300 text-[10px]">Selected</div>
                    )}
                    {condition && condition.conditions.length > 0 && (
                      <div className="mt-1">
                        {condition.conditions.slice(0, 2).map(c => (
                          <div key={c} className="text-[10px]">• {c}</div>
                        ))}
                        {condition.conditions.length > 2 && (
                          <div className="text-[10px]">+{condition.conditions.length - 2} more</div>
                        )}
                      </div>
                    )}
                    {condition && condition.procedures?.length > 0 && (
                      <div className="mt-1">
                        <div className="text-[10px] text-green-300">
                          {condition.procedures.length} procedure{condition.procedures.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Only show quadrant labels when showing all quadrants */}
        {selectedQuadrant === "all" && (
          <>
            <div className="absolute top-4 left-4">
              <Badge className="bg-blue-100 text-blue-800">Quadrant 1 (UR)</Badge>
            </div>
            <div className="absolute top-4 right-4">
              <Badge className="bg-green-100 text-green-800">Quadrant 2 (UL)</Badge>
            </div>
            <div className="absolute bottom-4 right-4">
              <Badge className="bg-yellow-100 text-yellow-800">Quadrant 3 (LL)</Badge>
            </div>
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-red-100 text-red-800">Quadrant 4 (LR)</Badge>
            </div>
          </>
        )}
      </div>
    </div>
  );

// In the renderSoftTissueTab() function, update the grid to show all 8 soft tissues
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
      {SOFT_TISSUE_DATA.map(tissue => {
        const examination = softTissues.find(st => st.id === tissue.id);
        const hasFindings = examination && (
          examination.onExamination.length > 0 ||
          examination.diagnosis.length > 0 ||
          examination.treatment.length > 0
        );
        
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
              <span className="font-medium text-sm text-center">{tissue.name}</span>
              
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
            {softTissues.filter(st => 
              st.onExamination.length > 0 || 
              st.diagnosis.length > 0 || 
              st.treatment.length > 0
            ).length}/{SOFT_TISSUE_DATA.length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3">
          <div className="text-sm text-gray-500">Total Findings</div>
          <div className="text-2xl font-bold text-blue-600">
            {softTissues.reduce((sum, st) => sum + st.onExamination.length, 0)}
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
      {TMJ_DATA.map(tmj => {
        const examination = tmjExaminations.find(t => t.id === tmj.id);
        const hasFindings = examination && (
          examination.onExamination.length > 0 ||
          examination.diagnosis.length > 0 ||
          examination.treatment.length > 0
        );
        
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
            {tmjExaminations.filter(tmj => 
              tmj.onExamination.length > 0 || 
              tmj.diagnosis.length > 0 || 
              tmj.treatment.length > 0
            ).length}/{TMJ_DATA.length}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3">
          <div className="text-sm text-gray-500">Total Findings</div>
          <div className="text-2xl font-bold text-purple-600">
            {tmjExaminations.reduce((sum, tmj) => sum + tmj.onExamination.length, 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3">
          <div className="text-sm text-gray-500">Treatments Planned</div>
          <div className="text-2xl font-bold text-purple-600">
            {tmjExaminations.reduce((sum, tmj) => sum + tmj.treatment.length, 0)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-7xl w-full max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dental Chart (FDI Numbering)</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                {patientName && (
                  <span className="mr-4">Patient: {patientName}</span>
                )}
                {patientUniqueId && (
                  <span>ID: {patientUniqueId}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Add Clear All Button */}
              {mode === "edit" && (
                <Button
                  variant="outline"
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
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
              {onClose && (
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Main Tabs */}
          <div className="mt-6 border-b">
            <div className="flex">
              <button
                type="button"
                onClick={() => setActiveTab("teeth")}
                className={`px-4 py-2 font-medium flex items-center gap-2 ${
                  activeTab === "teeth" ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                Teeth
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("soft-tissue")}
                className={`px-4 py-2 font-medium flex items-center gap-2 ${
                  activeTab === "soft-tissue" ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Stethoscope className="h-4 w-4" />
                Soft Tissue
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tmj")}
                className={`px-4 py-2 font-medium flex items-center gap-2 ${
                  activeTab === "tmj" ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Bone className="h-4 w-4" />
                TMJ
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto">
          {/* Render Active Tab Content */}
          {activeTab === "teeth" && renderTeethTab()}
          {activeTab === "soft-tissue" && renderSoftTissueTab()}
          {activeTab === "tmj" && renderTMJTab()}

          {/* Summary Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Common Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {toothConditions.slice(0, 5).map((tc, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm">Tooth #{tc.toothNumber}</span>
                      <div className="flex gap-1">
                        {tc.conditions.slice(0, 2).map(cond => (
                          <Badge key={cond} variant="outline" className="text-xs">
                            {cond}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Treatment Plan</CardTitle>
              </CardHeader>
              <CardContent>
                {treatmentPlan ? (
                  <div className="space-y-2">
                    <div className="font-medium">{treatmentPlan.planName}</div>
                    {treatmentPlan.description && (
                      <p className="text-sm text-muted-foreground">{treatmentPlan.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {treatmentPlan.stages.length} stages
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {treatmentPlan.teeth.reduce((sum, tooth) => sum + tooth.procedures.length, 0)} procedures
                      </Badge>
                      {/* Add stage status summary */}
                      <div className="text-xs text-gray-500">
                        {treatmentPlan.stages.filter(s => s.status === 'completed').length} completed, 
                        {treatmentPlan.stages.filter(s => s.status === 'in-progress').length} in-progress
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No treatment plan created</p>
                    {mode === "edit" && activeTab === "teeth" && (
                      <Button variant="outline" size="sm" className="w-full" onClick={handleCreateTreatmentPlan}>
                        Create Treatment Plan
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
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
                  {mode === "edit" && !treatmentPlan && activeTab === "teeth" && (
                    <Button variant="outline" className="w-full justify-start" onClick={handleCreateTreatmentPlan}>
                      Generate Treatment Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        
      </Card>

      {/* Single Tooth Popup */}
      {selectedTooth && (
        <ToothPopup
          tooth={selectedTooth}
          condition={toothConditions.find(tc => tc.toothNumber === selectedTooth.number) || null}
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
      {showTreatmentPlanForm && (
        <TreatmentPlanForm
          patientId={patientId}
          existingConditions={toothConditions}
          onClose={() => setShowTreatmentPlanForm(false)}
          onSave={handleSaveTreatmentPlan}
          initialData={treatmentPlan}
        />
      )}
    </div>
  );
}

// Treatment Plan Form Component (Remains the same as before)
interface TreatmentPlanFormProps {
  patientId: string;
  existingConditions: ToothCondition[];
  onClose: () => void;
  onSave: (plan: TreatmentPlanData) => void;
  initialData?: TreatmentPlanData | null;
}

const TreatmentPlanForm: React.FC<TreatmentPlanFormProps> = ({ 
  patientId, 
  existingConditions, 
  onClose, 
  onSave,
  initialData 
}) => {
  const [planName, setPlanName] = useState(initialData?.planName || "Treatment Plan");
  const [description, setDescription] = useState(initialData?.description || "");
  const [stages, setStages] = useState<TreatmentPlanStage[]>(
    initialData?.stages || [
      { stageName: "Initial Treatment", description: "Primary procedures", procedureRefs: [], status: "pending", scheduledDate: new Date().toISOString().split('T')[0] },
      { stageName: "Follow-up", description: "Secondary procedures", procedureRefs: [], status: "pending", scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ]
  );
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState("");
  const [selectedSurface, setSelectedSurface] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [teethPlans, setTeethPlans] = useState<{toothNumber: number, procedures: any[], priority: 'urgent' | 'high' | 'medium' | 'low'}[]>(
    initialData?.teeth.map(t => ({
      toothNumber: t.toothNumber,
      priority: t.priority || 'medium',
      procedures: t.procedures.map(p => ({
        name: p.name,
        surface: p.surface || 'occlusal',
        stage: p.stage || 1,
        estimatedCost: p.estimatedCost || 0,
        notes: p.notes || '',
      }))
    })) || []
  );
  const [selectedPriority, setSelectedPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [selectedStage, setSelectedStage] = useState<number>(1);

  useEffect(() => {
    if (initialData) {
      console.log("📋 TreatmentPlanForm received initial data:", initialData);
      console.log("- Teeth:", initialData.teeth?.length || 0);
      console.log("- Stages:", initialData.stages?.length || 0);
      console.log("- Procedures count:", initialData.teeth?.reduce((sum, t) => sum + t.procedures.length, 0) || 0);
    }
  }, [initialData]);

  const handleAddProcedure = () => {
    if (!selectedTooth || !selectedProcedure || !selectedSurface) {
      alert("Please select tooth, procedure, and surface");
      return;
    }
    
    const toothIndex = teethPlans.findIndex(tp => tp.toothNumber === selectedTooth);
    const newProcedure = {
      name: selectedProcedure,
      surface: selectedSurface,
      stage: selectedStage,
      estimatedCost: estimatedCost || 0,
      notes,
    };
    
    if (toothIndex === -1) {
      setTeethPlans([...teethPlans, { 
        toothNumber: selectedTooth, 
        procedures: [newProcedure],
        priority: selectedPriority
      }]);
    } else {
      const updated = [...teethPlans];
      updated[toothIndex].procedures.push(newProcedure);
      setTeethPlans(updated);
    }
    
    // Reset form
    setSelectedProcedure("");
    setSelectedSurface("");
    setEstimatedCost(0);
    setNotes("");
  };

  const handleSavePlan = () => {
    if (teethPlans.length === 0) {
      alert("Please add at least one tooth procedure before saving the treatment plan");
      return;
    }

    // Format teeth data properly
    const formattedTeeth = teethPlans.map(toothPlan => ({
      toothNumber: toothPlan.toothNumber,
      priority: toothPlan.priority || 'medium',
      procedures: toothPlan.procedures.map(proc => ({
        name: proc.name,
        surface: proc.surface || "occlusal",
        stage: proc.stage || 1,
        estimatedCost: proc.estimatedCost || 0,
        notes: proc.notes || "",
      }))
    }));

    // Format stages with procedureRefs
    const formattedStages = stages.map((stage, index) => {
      const stageNumber = index + 1;
      
      const proceduresInStage = teethPlans.flatMap(toothPlan => 
        toothPlan.procedures
          .filter(proc => proc.stage === stageNumber)
          .map(proc => ({
            toothNumber: toothPlan.toothNumber,
            procedureName: proc.name
          }))
      );
      
      const stageStatus = stage.status || 'pending';
      
      return {
        stageName: stage.stageName || `Stage ${stageNumber}`,
        description: stage.description || '',
        procedureRefs: proceduresInStage,
        status: stageStatus,
        scheduledDate: stage.scheduledDate || new Date(Date.now() + index * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: stage.notes || '',
        ...(stageStatus === 'in-progress' && { startedAt: new Date().toISOString() }),
        ...(stageStatus === 'completed' && { completedAt: new Date().toISOString() })
      };
    });
    
    console.log("📊 Stage Statuses being sent to backend:");
    formattedStages.forEach((stage, idx) => {
      console.log(`  Stage ${idx + 1}: ${stage.stageName} - Status: ${stage.status}`);
    });
    
    const plan: TreatmentPlanData = {
      planName,
      description,
      teeth: formattedTeeth,
      stages: formattedStages
    };
    
    console.log("✅ Saving treatment plan:");
    console.log("- Stages count:", formattedStages.length);
    
    onSave(plan);
  };

  const handleAddStage = () => {
    const newStageNumber = stages.length + 1;
    setStages([
      ...stages,
      {
        stageName: `Stage ${newStageNumber}`,
        description: '',
        procedureRefs: [],
        status: 'pending',
        scheduledDate: new Date(Date.now() + (newStageNumber - 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]);
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 1) {
      alert("At least one stage is required");
      return;
    }
    
    // Check if any procedures are assigned to this stage
    const proceduresInStage = teethPlans.reduce((count, tooth) => {
      return count + tooth.procedures.filter(p => p.stage === index + 1).length;
    }, 0);
    
    if (proceduresInStage > 0) {
      if (!confirm(`Stage ${index + 1} has ${proceduresInStage} procedure(s). Removing the stage will also remove these procedures. Continue?`)) {
        return;
      }
      
      // Remove procedures assigned to this stage completely
      const updatedTeethPlans = teethPlans.map(tooth => ({
        ...tooth,
        procedures: tooth.procedures.filter(proc => proc.stage !== index + 1)
      })).filter(tooth => tooth.procedures.length > 0); // Remove teeth with no procedures
      
      setTeethPlans(updatedTeethPlans);
    }
    
    // Remove the stage
    const updatedStages = stages.filter((_, i) => i !== index);
    
    // Renumber remaining stages to maintain order
    const renumberedStages = updatedStages.map((stage, idx) => ({
      ...stage,
      stageName: stage.stageName.replace(/\d+$/, String(idx + 1))
    }));
    
    setStages(renumberedStages);
    
    // Adjust selected stage if needed
    if (selectedStage > renumberedStages.length) {
      setSelectedStage(renumberedStages.length);
    } else if (selectedStage === index + 1) {
      setSelectedStage(1);
    }
  };

  const handleUpdateStageStatus = (stageIndex: number, newStatus: 'pending' | 'completed' | 'in-progress') => {
    const updatedStages = [...stages];
    updatedStages[stageIndex].status = newStatus;
    setStages(updatedStages);
  };

  const getProceduresByStage = (stageNumber: number) => {
    return teethPlans.flatMap(tooth =>
      tooth.procedures
        .filter(proc => proc.stage === stageNumber)
        .map(proc => ({
          toothNumber: tooth.toothNumber,
          ...proc
        }))
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-lg">
        <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Create Treatment Plan</h3>
            <p className="text-sm text-muted-foreground">Patient ID: {patientId}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Plan Basic Info */}
            <div>
              <label className="block text-sm font-medium mb-2">Plan Name</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Enter plan name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                className="w-full border rounded-lg p-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
            </div>

            {/* Stages Management - WITHOUT REMOVE BUTTON */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Stages Management</h4>
                <Button variant="outline" size="sm" onClick={handleAddStage}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stage
                </Button>
              </div>
              
              <div className="space-y-3">
                {stages.map((stage, index) => {
                  const stageNumber = index + 1;
                  const proceduresInStage = getProceduresByStage(stageNumber);
                  
                  return (
                    <div key={index} className="border rounded p-4 bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Stage {stageNumber}
                          </Badge>
                          <span className="font-medium">{stage.stageName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {proceduresInStage.length} procedure(s)
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Stage Status Badge */}
                      <div className="mb-3">
                        <Badge className={`text-xs ${
                          stage.status === 'completed' ? 'bg-green-100 text-green-700' :
                          stage.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          Status: {stage.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Stage Name</label>
                          <input
                            type="text"
                            className="w-full border rounded p-2 text-sm"
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
                            className="w-full border rounded p-2 text-sm"
                            value={stage.scheduledDate || ''}
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
                            className="w-full border rounded p-2 text-sm"
                            value={stage.description || ''}
                            onChange={(e) => {
                              const updated = [...stages];
                              updated[index].description = e.target.value;
                              setStages(updated);
                            }}
                            rows={2}
                            placeholder="Describe what will be done in this stage"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Procedures */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-4">Add Procedures</h4>
              
              {/* Stage Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Assign to Stage</label>
                <div className="flex flex-wrap gap-2">
                  {stages.map((stage, index) => {
                    const stageNumber = index + 1;
                    const proceduresInStage = getProceduresByStage(stageNumber).length;
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedStage(stageNumber)}
                        className={`px-3 py-2 border rounded-lg flex items-center gap-2 ${
                          selectedStage === stageNumber
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span>Stage {stageNumber}</span>
                        <Badge variant="secondary" className="text-xs">
                          {proceduresInStage}
                        </Badge>
                        <Badge className={`text-[10px] ${
                          stage.status === 'completed' ? 'bg-green-100 text-green-700' :
                          stage.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {stage.status}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tooth Number</label>
                  <select
                    className="w-full border rounded-lg p-2"
                    value={selectedTooth || ""}
                    onChange={(e) => setSelectedTooth(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Select tooth...</option>
                    {[...ADULT_TOOTH_DATA, ...PEDIATRIC_TOOTH_DATA]
                      .filter((tooth, index, self) => 
                        index === self.findIndex(t => t.number === tooth.number)
                      )
                      .sort((a, b) => a.number - b.number)
                      .map(tooth => (
                        <option key={tooth.number} value={tooth.number}>
                          Tooth #{tooth.number} ({tooth.name})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Procedure</label>
                  <select
                    className="w-full border rounded-lg p-2"
                    value={selectedProcedure}
                    onChange={(e) => setSelectedProcedure(e.target.value)}
                  >
                    <option value="">Select procedure...</option>
                    {DENTAL_PROCEDURES.map(proc => (
                      <option key={proc} value={proc}>{proc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Surface</label>
                  <select
                    className="w-full border rounded-lg p-2"
                    value={selectedSurface}
                    onChange={(e) => setSelectedSurface(e.target.value)}
                  >
                    <option value="">Select surface...</option>
                    <option value="mesial">Mesial</option>
                    <option value="distal">Distal</option>
                    <option value="buccal">Buccal</option>
                    <option value="lingual">Lingual</option>
                    <option value="occlusal">Occlusal</option>
                    <option value="entire">Entire Tooth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-2"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    min="0"
                    step="100"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Priority</label>
                <div className="flex gap-2">
                  {(['urgent', 'high', 'medium', 'low'] as const).map(priority => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setSelectedPriority(priority)}
                      className={`px-3 py-1 border rounded capitalize ${
                        selectedPriority === priority
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  className="w-full border rounded-lg p-2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this procedure"
                  rows={2}
                />
              </div>

              <Button
                onClick={handleAddProcedure}
                disabled={!selectedTooth || !selectedProcedure || !selectedSurface}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Procedure to Stage {selectedStage}
              </Button>
            </div>

            {/* Added Procedures */}
            {teethPlans.length > 0 && (
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Added Procedures</h4>
                  <div className="text-sm text-gray-500">
                    Total: {teethPlans.reduce((sum, tp) => sum + tp.procedures.length, 0)} procedures
                  </div>
                </div>
                
                {/* Summary by Stage WITH STATUS TOGGLE BUTTONS AND REMOVE BUTTON */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium mb-3 text-gray-700">Stage Status Management</h5>
                  <div className="space-y-3">
                    {stages.map((stage, index) => {
                      const stageNumber = index + 1;
                      const proceduresInStage = getProceduresByStage(stageNumber);
                      
                      return (
                        <div key={index} className="border rounded-lg p-4 bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Stage {stageNumber}
                              </Badge>
                              <span className="font-medium">{stage.stageName}</span>
                              <Badge variant="outline" className="text-xs">
                                {proceduresInStage.length} procedure(s)
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Current Status Badge */}
                              <Badge className={`text-xs ${
                                stage.status === 'completed' ? 'bg-green-100 text-green-700' :
                                stage.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {stage.status}
                              </Badge>
                              
                              {/* Remove Stage Button - Only show if more than 1 stage */}
                              {stages.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveStage(index)}
                                  className="text-red-500 hover:text-red-700"
                                  title="Remove this stage"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Stage Status Toggle Buttons */}
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Update Status:</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateStageStatus(index, 'pending')}
                                className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                                  stage.status === 'pending' 
                                    ? 'bg-gray-100 text-gray-700 border-gray-300' 
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                                }`}
                                title="Mark as Pending"
                              >
                                Pending
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStageStatus(index, 'in-progress')}
                                className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                                  stage.status === 'in-progress' 
                                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                                }`}
                                title="Mark as In Progress"
                              >
                                In Progress
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStageStatus(index, 'completed')}
                                className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                                  stage.status === 'completed' 
                                    ? 'bg-green-100 text-green-700 border-green-300' 
                                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
                                }`}
                                title="Mark as Completed"
                              >
                                Completed
                              </button>
                            </div>
                          </div>
                          
                          {/* Optional: Show procedures in this stage */}
                          {proceduresInStage.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-gray-500 mb-1">Procedures in this stage:</p>
                              <div className="flex flex-wrap gap-1">
                                {proceduresInStage.slice(0, 3).map((proc, procIdx) => (
                                  <Badge key={procIdx} variant="outline" className="text-[10px]">
                                    T{proc.toothNumber}: {proc.name}
                                  </Badge>
                                ))}
                                {proceduresInStage.length > 3 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    +{proceduresInStage.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {teethPlans.map((toothPlan, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-gray-100">
                            Tooth #{toothPlan.toothNumber}
                          </Badge>
                          {toothPlan.priority && toothPlan.priority !== 'medium' && (
                            <Badge className={`text-xs ${
                              toothPlan.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              toothPlan.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {toothPlan.priority}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {toothPlan.procedures.length} procedure(s)
                        </span>
                      </div>
                      
                      {/* Group procedures by stage */}
                      {(() => {
                        const proceduresByStage: Record<number, any[]> = {};
                        toothPlan.procedures.forEach(proc => {
                          const stage = proc.stage || 1;
                          if (!proceduresByStage[stage]) {
                            proceduresByStage[stage] = [];
                          }
                          proceduresByStage[stage].push(proc);
                        });
                        
                        return Object.entries(proceduresByStage).map(([stageNum, procs]) => (
                          <div key={stageNum} className="mb-3 last:mb-0">
                            <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                              <span>Stage {stageNum}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {procs.length} procedure(s)
                              </Badge>
                              {/* Show stage status */}
                              <Badge className={`text-[10px] ${
                                stages[parseInt(stageNum) - 1]?.status === 'completed' ? 'bg-green-100 text-green-700' :
                                stages[parseInt(stageNum) - 1]?.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {stages[parseInt(stageNum) - 1]?.status || 'pending'}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {procs.map((proc, procIdx) => (
                                <div key={procIdx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{proc.name}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {proc.surface}
                                      </Badge>
                                    </div>
                                    {proc.notes && (
                                      <div className="text-sm text-gray-600 mt-1">{proc.notes}</div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium">₹{proc.estimatedCost}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {teethPlans.length > 0 ? (
              <>
                {teethPlans.length} teeth, {teethPlans.reduce((sum, tp) => sum + tp.procedures.length, 0)} procedures
                <div className="mt-1">
                  Stages: {stages.filter(s => s.status === 'completed').length} completed, 
                  {stages.filter(s => s.status === 'in-progress').length} in-progress, 
                  {stages.filter(s => s.status === 'pending').length} pending
                </div>
              </>
            ) : (
              "No procedures added yet"
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSavePlan} 
              disabled={teethPlans.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save Treatment Plan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};