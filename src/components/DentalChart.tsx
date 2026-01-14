// DentalChart.tsx - WITH PROPER TOOTH SVG IN MODAL
import React, { useState,useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { X,Plus} from "lucide-react";
import { Badge } from "./ui/badge";

// Import SVG components
import IncisorSVG from "../assets/svg/dental/incisor.svg?react";
import CanineSVG from "../assets/svg/dental/canine.svg?react";
import PremolarSVG from "../assets/svg/dental/premolar.svg?react";
import MolarSVG from "../assets/svg/dental/molar.svg?react";
import WisdomSVG from "../assets/svg/dental/wisdom.svg?react";

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
    status: "planned" | "in-progress" | "completed"; // Add this specific type
    cost?: number;
    notes?: string;
    date?: string;
  }[];
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
      stage?: number; // Make stage optional with ?
      estimatedCost: number;
      notes?: string;
      status: 'planned' | 'in-progress' | 'completed';
    }[];
    priority?: 'urgent' | 'high' | 'medium' | 'low';
  }[];
  stages: TreatmentPlanStage[];
  startToday?: boolean; // Add this for backend
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
    treatmentPlan?: TreatmentPlanData | null; // Allow null
  }) => void;
  onProcedureAdded?: (toothNumber: number, procedure: any) => void;
  existingConditions?: ToothCondition[];
  onToothSelected?: (tooth: ToothData, condition: ToothCondition | null) => void;
  existingTreatmentPlan?: TreatmentPlanData | null
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

// SVG mapping
const TOOTH_SVGS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  incisor: IncisorSVG,
  canine: CanineSVG,
  premolar: PremolarSVG,
  molar: MolarSVG,
  wisdom: WisdomSVG || MolarSVG,
};

const ToothSVG = ({ 
  type, 
  color = "#4b5563", 
  width = 48,
  height = 48,
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

  // Create SVG path for each segment (90-degree arcs)
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
        return { x: 100, y: 30, anchor: "middle" }; // Top
      case "mesial":
        return { x: 30, y: 100, anchor: "middle" }; // Left
      case "lingual":
        return { x: 100, y: 170, anchor: "middle" }; // Bottom
      case "distal":
        return { x: 170, y: 100, anchor: "middle" }; // Right
      case "occlusal":
        return { x: 100, y: 100, anchor: "middle" }; // Center
      default:
        return { x: 0, y: 0, anchor: "middle" };
    }
  };
  

  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Segmented Circle Diagram */}
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
    status: "planned" | "in-progress" | "completed";
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

  // NEW: Add procedure
  const handleAddProcedure = () => {
    const procedureName = prompt("Enter procedure name:");
    if (!procedureName) return;
    
    const surface = prompt("Enter surface (occlusal, buccal, lingual, mesial, distal):") || "occlusal";
    const cost = Number(prompt("Enter estimated cost:") || 0);
    const notes = prompt("Enter notes (optional):") || "";
    
    const newProcedure = {
      name: procedureName,
      surface,
      status: "planned" as const,
      cost,
      notes
    };
    
    setProcedures([...procedures, newProcedure]);
  };

  // NEW: Update procedure status
  const handleProcedureStatusToggle = (index: number, newStatus: "planned" | "in-progress" | "completed") => {
    const updated = [...procedures];
    updated[index].status = newStatus;
    if (newStatus === "completed") {
      updated[index].date = new Date().toISOString();
    }
    setProcedures(updated);
  };

  // NEW: Remove procedure
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
                              <Badge className={`text-xs ${
                                proc.status === 'completed' ? 'bg-green-100 text-green-700' :
                                proc.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {proc.status}
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
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => handleProcedureStatusToggle(index, 'planned')}
                                className={`px-2 py-1 text-xs rounded ${
                                  proc.status === 'planned' 
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title="Mark as Planned"
                              >
                                P
                              </button>
                              <button
                                type="button"
                                onClick={() => handleProcedureStatusToggle(index, 'completed')}
                                className={`px-2 py-1 text-xs rounded ${
                                  proc.status === 'completed' 
                                    ? 'bg-green-100 text-green-700 border border-green-300' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title="Mark as Completed"
                              >
                                C
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveProcedure(index)}
                                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                title="Remove Procedure"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
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

export default function DentalChart({
  patientId,
  visitId,
  mode = "edit", // Default to edit for consultation
  patientName,
  patientUniqueId,
  onClose,
  onSave,
  onProcedureAdded,
  existingConditions = [],
  onToothSelected,
  existingTreatmentPlan,
}: DentalChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<ToothData | null>(null);
  const [toothConditions, setToothConditions] = useState<ToothCondition[]>(existingConditions);
  const [chartType, setChartType] = useState<"adult" | "pediatric">("adult");
  const [selectedQuadrant, setSelectedQuadrant] = useState<"all" | 1 | 2 | 3 | 4>("all");
  const [showTreatmentPlanForm, setShowTreatmentPlanForm] = useState(false);
  const [selectedStage, setSelectedStage] = useState(1);
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlanData | null>(
    existingTreatmentPlan || null
  );
  
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
const formatDentalDataForAPI = () => {
  console.log("🦷 Formatting dental data for API...");
  
  // Format performed teeth (completed procedures)
  const performedTeeth = toothConditions
    .filter(tc => 
      tc.conditions.length > 0 || 
      tc.surfaceConditions?.length > 0 || 
      tc.procedures?.some(p => p.status === "completed")
    )
    .map(tc => ({
      toothNumber: tc.toothNumber,
      conditions: tc.conditions || [],
      surfaceConditions: (tc.surfaceConditions || []).map(sc => ({
        surface: sc.surface,
        conditions: sc.conditions || []
      })),
      procedures: (tc.procedures || [])
        .filter(p => p.status === "completed")
        .map(p => ({
          name: p.name,
          surface: p.surface || "occlusal",
          status: p.status as "completed",
          cost: p.cost || 0,
          notes: p.notes || "",
          performedAt: p.date || new Date().toISOString()
        }))
    }));
  
  console.log("✅ Performed teeth:", performedTeeth);
  
  // Format planned procedures for treatment plan
  const plannedProcedures = toothConditions
    .flatMap(tc => 
      (tc.procedures || [])
        .filter(p => p.status === "planned" || p.status === "in-progress")
        .map(p => ({
          toothNumber: tc.toothNumber,
          name: p.name,
          surface: p.surface || "occlusal",
          estimatedCost: p.cost || 0,
          notes: p.notes || "",
          status: p.status as "planned" | "in-progress"
        }))
    );

  console.log("✅ Planned procedures:", plannedProcedures);

  // ✅ FIXED: Format treatment plan for backend
  let formattedTreatmentPlan = null;
  if (treatmentPlan) {
    console.log("📋 Formatting treatment plan for backend...");
    
    // Check if any procedures in Stage 1 are marked as completed
    const stage1Procedures = treatmentPlan.teeth.flatMap(t => 
      t.procedures.filter(p => p.stage === 1)
    );
    const completedInStage1 = stage1Procedures.filter(p => p.status === "completed");
    const shouldStartToday = completedInStage1.length > 0;
    
    console.log(`Stage 1: ${stage1Procedures.length} total, ${completedInStage1.length} completed`);
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
          status: proc.status || 'planned'
        });
      });
    });
    
    // Create stages data
    const stagesData = Object.entries(proceduresByStage).map(([stageNumStr, procs]) => {
      const stageNumber = parseInt(stageNumStr);
      
      // Group procedures by tooth and surface for toothSurfaceProcedures
      const toothSurfaceMap: Record<number, Record<string, string[]>> = {};
      
      // Create procedureRefs array
      const procedureRefs = procs.map(proc => ({
        toothNumber: proc.toothNumber,
        procedureName: proc.name
      }));
      
      procs.forEach(proc => {
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
      
      // Find matching stage from treatmentPlan.stages
      const stageInput = treatmentPlan.stages?.find((s: any) => 
        s.stageNumber === stageNumber || s.stage === stageNumber
      );
      
      const stageStatus = (() => {
        if (stageNumber === 1 && shouldStartToday) {
          const allCompleted = procs.every(p => p.status === 'completed');
          return allCompleted ? 'completed' : 'in-progress';
        }
        return 'pending';
      })() as 'pending' | 'completed' | 'in-progress';
      
      return {
        stageNumber: stageNumber,
        stageName: stageInput?.stageName || `Stage ${stageNumber}`,
        description: stageInput?.description || '',
        // ✅ FIXED: Add the required procedureRefs property
        procedureRefs: procedureRefs,
        status: stageStatus,
        scheduledDate: stageInput?.scheduledDate || new Date().toISOString().split('T')[0],
        // ✅ Keep the optional toothSurfaceProcedures
        toothSurfaceProcedures: toothSurfaceProcedures,
        notes: stageInput?.notes || ''
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
          status: proc.status || 'planned'
        }))
      })),
      stages: stagesData,
      startToday: shouldStartToday // ✅ CRITICAL: This tells backend to start the plan
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
  }

  return { 
    performedTeeth, 
    plannedProcedures, 
    treatmentPlan: formattedTreatmentPlan 
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
    setSelectedTooth(tooth);
    if (onToothSelected) {
      const condition = toothConditions.find(tc => tc.toothNumber === tooth.number) || null;
      onToothSelected(tooth, condition);
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
      procedures: toothConditions.reduce((sum, tc) => sum + (tc.procedures?.length || 0), 0)
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
  
  // Ensure all procedures have status field
  const enhancedTeeth = plan.teeth.map(tooth => ({
    ...tooth,
    procedures: tooth.procedures.map(proc => ({
      ...proc,
      status: proc.status || 'planned' // Default to 'planned' if not set
    }))
  }));
  
  const enhancedPlan = {
    ...plan,
    teeth: enhancedTeeth
  };
  
  console.log("✅ Enhanced treatment plan with statuses:", enhancedPlan);
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
              {onClose && (
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
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

            <div className="flex items-center gap-4 ml-auto">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Affected Teeth</div>
                <div className="text-lg font-semibold">{stats.affectedTeeth}/{stats.totalTeeth}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Treatment Plan</div>
                <div className="text-lg font-semibold">{treatmentPlan ? "Created" : "None"}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-3 text-xs">
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
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto">
          <div className="relative border border-border rounded-xl bg-white p-6">
            {/* Only show Maxillary label if we have upper teeth to display */}
            {(upperRightTeeth.length > 0 || upperLeftTeeth.length > 0) && (
              <div className="text-center mb-6">
                <Badge variant="outline">Maxillary (Upper Arch)</Badge>
              </div>
            )}

            {/* Upper Arch - Only show if we have upper teeth */}
            {(upperRightTeeth.length > 0 || upperLeftTeeth.length > 0) && (
              <div className="flex justify-center items-center gap-2 mb-12">
                {/* Quadrant 1 - Upper Right */}
                {upperRightTeeth.map(tooth => {
                  const condition = toothConditions.find(tc => tc.toothNumber === tooth.number);
                  return (
                    <div key={tooth.number} className="relative group flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => handleToothClick(tooth)}
                        className="relative transition-transform hover:scale-110"
                        disabled={mode === "view"}
                      >
                        <ToothSVG
                          type={tooth.svgName}
                          color={getToothColor(tooth.number)}
                          width={chartType === "adult" ? 44 : 40}
                          height={chartType === "adult" ? 44 : 40}
                          rotation={tooth.rotation}
                        />
                        {condition && (
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${condition.conditions.length > 0 ? 'animate-pulse' : ''}`}
                                   style={{ backgroundColor: getToothColor(tooth.number) }} />
                              {condition.procedures?.some(p => p.status === "completed") && (
                                <div className="mt-1 w-2 h-2 rounded-full bg-green-500"></div>
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                      <div className="mt-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">
                        {tooth.number}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Tooth #{tooth.number} (FDI): {tooth.name}
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
                      </div>
                    </div>
                  );
                })}

                {/* Quadrant 2 - Upper Left */}
                {upperLeftTeeth.map(tooth => {
                  const condition = toothConditions.find(tc => tc.toothNumber === tooth.number);
                  return (
                    <div key={tooth.number} className="relative group flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => handleToothClick(tooth)}
                        className="relative transition-transform hover:scale-110"
                        disabled={mode === "view"}
                      >
                        <ToothSVG
                          type={tooth.svgName}
                          color={getToothColor(tooth.number)}
                          width={chartType === "adult" ? 44 : 40}
                          height={chartType === "adult" ? 44 : 40}
                          rotation={tooth.rotation}
                        />
                        {condition && (
                          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${condition.conditions.length > 0 ? 'animate-pulse' : ''}`}
                                   style={{ backgroundColor: getToothColor(tooth.number) }} />
                              {condition.procedures?.some(p => p.status === "completed") && (
                                <div className="mt-1 w-2 h-2 rounded-full bg-green-500"></div>
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                      <div className="mt-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">
                        {tooth.number}
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Tooth #{tooth.number} (FDI): {tooth.name}
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
              <div className="flex justify-center items-center gap-2 mt-12">
                {/* Quadrant 4 - Lower Right */}
                {lowerRightTeeth.map(tooth => {
                  const condition = toothConditions.find(tc => tc.toothNumber === tooth.number);
                  return (
                    <div key={tooth.number} className="relative group flex flex-col items-center">
                      <div className="mb-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">
                        {tooth.number}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToothClick(tooth)}
                        className="relative transition-transform hover:scale-110"
                        disabled={mode === "view"}
                      >
                        <ToothSVG
                          type={tooth.svgName}
                          color={getToothColor(tooth.number)}
                          width={chartType === "adult" ? 44 : 40}
                          height={chartType === "adult" ? 44 : 40}
                          rotation={tooth.rotation}
                        />
                        {condition && (
                          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${condition.conditions.length > 0 ? 'animate-pulse' : ''}`}
                                   style={{ backgroundColor: getToothColor(tooth.number) }} />
                              {condition.procedures?.some(p => p.status === "completed") && (
                                <div className="mt-1 w-2 h-2 rounded-full bg-green-500"></div>
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Tooth #{tooth.number} (FDI): {tooth.name}
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
                      </div>
                    </div>
                  );
                })}

                {/* Quadrant 3 - Lower Left */}
                {lowerLeftTeeth.map(tooth => {
                  const condition = toothConditions.find(tc => tc.toothNumber === tooth.number);
                  return (
                    <div key={tooth.number} className="relative group flex flex-col items-center">
                      <div className="mb-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center">
                        {tooth.number}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToothClick(tooth)}
                        className="relative transition-transform hover:scale-110"
                        disabled={mode === "view"}
                      >
                        <ToothSVG
                          type={tooth.svgName}
                          color={getToothColor(tooth.number)}
                          width={chartType === "adult" ? 44 : 40}
                          height={chartType === "adult" ? 44 : 40}
                          rotation={tooth.rotation}
                        />
                        {condition && (
                          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${condition.conditions.length > 0 ? 'animate-pulse' : ''}`}
                                   style={{ backgroundColor: getToothColor(tooth.number) }} />
                              {condition.procedures?.some(p => p.status === "completed") && (
                                <div className="mt-1 w-2 h-2 rounded-full bg-green-500"></div>
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Tooth #{tooth.number} (FDI): {tooth.name}
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
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No treatment plan created</p>
                    {mode === "edit" && (
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
                  {mode === "edit" && !treatmentPlan && (
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

      {selectedTooth && (
        <ToothPopup
          tooth={selectedTooth}
          condition={toothConditions.find(tc => tc.toothNumber === selectedTooth.number) || null}
          mode={mode}
          onClose={() => setSelectedTooth(null)}
          onSave={handleSaveToothData}
        />
      )}

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

// Treatment Plan Form Component
// Treatment Plan Form Component - UPDATED
interface TreatmentPlanFormProps {
  patientId: string;
  existingConditions: ToothCondition[];
  onClose: () => void;
  onSave: (plan: TreatmentPlanData) => void;
  initialData?: TreatmentPlanData | null; // Add this
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
        status: p.status || 'planned'
      }))
    })) || []
  );
  const [selectedPriority, setSelectedPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [selectedStage, setSelectedStage] = useState<number>(1);

  // Add useEffect to log when initialData changes
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
      stage: selectedStage, // Add stage number
      estimatedCost: estimatedCost || 0,
      notes,
      status: "planned" as const
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
  // ✅ CRITICAL: Ensure teeth data is included
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
      stage: proc.stage || 1, // Use the stage from the procedure
      estimatedCost: proc.estimatedCost || 0,
      notes: proc.notes || "",
      status: proc.status || 'planned'
    }))
  }));

  // Format stages with procedureRefs
  const formattedStages = stages.map((stage, index) => {
    const stageNumber = index + 1;
    
    // Get procedures for this stage
    const proceduresInStage = teethPlans.flatMap(toothPlan => 
      toothPlan.procedures
        .filter(proc => proc.stage === stageNumber)
        .map(proc => ({
          toothNumber: toothPlan.toothNumber,
          procedureName: proc.name
        }))
    );
    
    return {
      stageName: stage.stageName || `Stage ${stageNumber}`,
      description: stage.description || '',
      procedureRefs: proceduresInStage, // <-- Add this!
      status: 'pending' as const,
      scheduledDate: stage.scheduledDate || new Date(Date.now() + index * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: stage.notes || ''
    };
  });
  
  // ✅ This is the format that backend expects
  const plan: TreatmentPlanData = {
    planName,
    description,
    teeth: formattedTeeth,
    stages: formattedStages
  };
  
  console.log("✅ Saving treatment plan:");
  console.log("- Plan Name:", planName);
  console.log("- Teeth count:", formattedTeeth.length);
  console.log("- Total procedures:", formattedTeeth.reduce((sum, t) => sum + t.procedures.length, 0));
  console.log("- Stages count:", formattedStages.length);
  console.log("- Procedure refs by stage:");
  formattedStages.forEach((stage, idx) => {
    console.log(`  Stage ${idx + 1}:`, stage.procedureRefs.length, "procedures");
  });
  
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
      if (!confirm(`Stage ${index + 1} has ${proceduresInStage} procedure(s). Removing it will reassign them to Stage 1. Continue?`)) {
        return;
      }
      
      // Reassign procedures to stage 1
      const updatedTeethPlans = teethPlans.map(tooth => ({
        ...tooth,
        procedures: tooth.procedures.map(proc => ({
          ...proc,
          stage: proc.stage === index + 1 ? 1 : proc.stage
        }))
      }));
      setTeethPlans(updatedTeethPlans);
    }
    
    // Remove the stage
    const updatedStages = stages.filter((_, i) => i !== index);
    setStages(updatedStages);
    
    // Adjust selected stage if needed
    if (selectedStage > updatedStages.length) {
      setSelectedStage(updatedStages.length);
    }
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

            {/* Stages Management */}
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
                        {stages.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStage(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
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
                
                {/* Summary by Stage */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium mb-2 text-gray-700">Summary by Stage</h5>
                  <div className="flex flex-wrap gap-2">
                    {stages.map((stage, index) => {
                      const stageNumber = index + 1;
                      const proceduresInStage = getProceduresByStage(stageNumber);
                      if (proceduresInStage.length === 0) return null;
                      
                      return (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                          Stage {stageNumber}: {proceduresInStage.length} procedure(s)
                        </Badge>
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
                                      {/* Status badge */}
                                      <Badge className={`text-xs ${
                                        proc.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        proc.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {proc.status || 'planned'}
                                      </Badge>
                                    </div>
                                    {proc.notes && (
                                      <div className="text-sm text-gray-600 mt-1">{proc.notes}</div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium">₹{proc.estimatedCost}</span>
                                    
                                    {/* Status toggle buttons */}
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...teethPlans];
                                          updated[idx].procedures[procIdx].status = 'planned';
                                          setTeethPlans(updated);
                                        }}
                                        className={`px-2 py-1 text-xs rounded ${
                                          proc.status === 'planned' 
                                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                        title="Mark as Planned"
                                      >
                                        P
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...teethPlans];
                                          updated[idx].procedures[procIdx].status = 'completed';
                                          updated[idx].procedures[procIdx].completedAt = new Date().toISOString();
                                          setTeethPlans(updated);
                                        }}
                                        className={`px-2 py-1 text-xs rounded ${
                                          proc.status === 'completed' 
                                            ? 'bg-green-100 text-green-700 border border-green-300' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                        title="Mark as Completed"
                                      >
                                        C
                                      </button>
                                    </div>
                                    
                                    {/* Remove button */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updated = [...teethPlans];
                                        updated[idx].procedures.splice(procIdx, 1);
                                        if (updated[idx].procedures.length === 0) {
                                          updated.splice(idx, 1);
                                        }
                                        setTeethPlans(updated);
                                      }}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
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