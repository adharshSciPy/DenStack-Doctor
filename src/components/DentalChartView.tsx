// DentalChartView.tsx - For displaying existing dental data with hover effects
import React, { useState, useMemo } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  AlertCircle, 
  Calendar, 
  CheckCircle, 
  Clock,
  X,
  Stethoscope,
  CheckSquare
} from "lucide-react";

// Import the ToothSVG from your existing DentalChart component
interface ToothSVGProps {
  type: string;
  color?: string;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
}

// Use the same ToothSVG component logic from your DentalChart
const ToothSVG: React.FC<ToothSVGProps> = ({
  type,
  color = "#4b5563",
  width = 60,
  height = 60,
  rotation = 0,
  opacity = 1,
}) => {
  const [hasError, setHasError] = useState(false);

  // Same SVG mapping as in your DentalChart
  const TOOTH_SVGS: Record<string, string> = {
    incisor: "/assets/svg/dental/incisor.svg",
    canine: "/assets/svg/dental/canine.svg",
    premolar: "/assets/svg/dental/premolar.svg",
    molar: "/assets/svg/dental/molar.svg",
    wisdom: "/assets/svg/dental/wisdom.svg",
  };

  // Same helper function
  const getHueFromColor = (hexColor: string): number => {
    const colorMap: Record<string, number> = {
      '#ef4444': 0,    // red (caries)
      '#3b82f6': 220,  // blue (filling)
      '#f59e0b': 40,   // orange (crown)
      '#8b5cf6': 270,  // purple (root canal)
      '#9ca3af': 0,    // gray (missing)
      '#22c55e': 140,  // green (selected)
      '#4b5563': 0,    // default gray
      '#d1d5db': 0,    // light gray for no data
    };
    
    return colorMap[hexColor.toLowerCase()] || 0;
  };

  const svgUrl = TOOTH_SVGS[type.toLowerCase()] || TOOTH_SVGS.molar;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`,
        display: "inline-block",
        position: 'relative',
        opacity: opacity,
        transition: 'all 0.2s ease',
      }}
    >
      {svgUrl && !hasError ? (
        <img
          src={svgUrl}
          alt={`${type} tooth`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: color === '#4b5563' || color === '#d1d5db' ? 'none' : 
              `drop-shadow(0 0 2px ${color}) brightness(0.9) sepia(1) hue-rotate(${getHueFromColor(color)}deg) saturate(2)`,
          }}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        // Fallback SVG (same as your DentalChart)
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
      )}
    </div>
  );
};

// Tooth Data Arrays (same as your DentalChart)
const ADULT_TOOTH_DATA = [
  // Upper Right (Quadrant 1) - FDI numbers 18-11
  { number: 18, name: "Third Molar", quadrant: 1, svgName: "wisdom", rotation: 180 },
  { number: 17, name: "Second Molar", quadrant: 1, svgName: "molar", rotation: 180 },
  { number: 16, name: "First Molar", quadrant: 1, svgName: "molar", rotation: 180 },
  { number: 15, name: "Second Premolar", quadrant: 1, svgName: "premolar", rotation: 180 },
  { number: 14, name: "First Premolar", quadrant: 1, svgName: "premolar", rotation: 180 },
  { number: 13, name: "Canine", quadrant: 1, svgName: "canine", rotation: 180 },
  { number: 12, name: "Lateral Incisor", quadrant: 1, svgName: "incisor", rotation: 180 },
  { number: 11, name: "Central Incisor", quadrant: 1, svgName: "incisor", rotation: 180 },

  // Upper Left (Quadrant 2) - FDI numbers 21-28
  { number: 21, name: "Central Incisor", quadrant: 2, svgName: "incisor", rotation: 180 },
  { number: 22, name: "Lateral Incisor", quadrant: 2, svgName: "incisor", rotation: 180 },
  { number: 23, name: "Canine", quadrant: 2, svgName: "canine", rotation: 180 },
  { number: 24, name: "First Premolar", quadrant: 2, svgName: "premolar", rotation: 180 },
  { number: 25, name: "Second Premolar", quadrant: 2, svgName: "premolar", rotation: 180 },
  { number: 26, name: "First Molar", quadrant: 2, svgName: "molar", rotation: 180 },
  { number: 27, name: "Second Molar", quadrant: 2, svgName: "molar", rotation: 180 },
  { number: 28, name: "Third Molar", quadrant: 2, svgName: "wisdom", rotation: 180 },

  // Lower Left (Quadrant 3) - FDI numbers 31-38
  { number: 31, name: "Central Incisor", quadrant: 3, svgName: "incisor", rotation: 0 },
  { number: 32, name: "Lateral Incisor", quadrant: 3, svgName: "incisor", rotation: 0 },
  { number: 33, name: "Canine", quadrant: 3, svgName: "canine", rotation: 0 },
  { number: 34, name: "First Premolar", quadrant: 3, svgName: "premolar", rotation: 0 },
  { number: 35, name: "Second Premolar", quadrant: 3, svgName: "premolar", rotation: 0 },
  { number: 36, name: "First Molar", quadrant: 3, svgName: "molar", rotation: 0 },
  { number: 37, name: "Second Molar", quadrant: 3, svgName: "molar", rotation: 0 },
  { number: 38, name: "Third Molar", quadrant: 3, svgName: "wisdom", rotation: 0 },

  // Lower Right (Quadrant 4) - FDI numbers 41-48
  { number: 41, name: "Central Incisor", quadrant: 4, svgName: "incisor", rotation: 0 },
  { number: 42, name: "Lateral Incisor", quadrant: 4, svgName: "incisor", rotation: 0 },
  { number: 43, name: "Canine", quadrant: 4, svgName: "canine", rotation: 0 },
  { number: 44, name: "First Premolar", quadrant: 4, svgName: "premolar", rotation: 0 },
  { number: 45, name: "Second Premolar", quadrant: 4, svgName: "premolar", rotation: 0 },
  { number: 46, name: "First Molar", quadrant: 4, svgName: "molar", rotation: 0 },
  { number: 47, name: "Second Molar", quadrant: 4, svgName: "molar", rotation: 0 },
  { number: 48, name: "Third Molar", quadrant: 4, svgName: "wisdom", rotation: 0 },
];

const PEDIATRIC_TOOTH_DATA = [
  // Upper Right (Quadrant 1) - Primary teeth 55-51
  { number: 55, name: "Primary Second Molar", quadrant: 1, svgName: "molar", rotation: 180 },
  { number: 54, name: "Primary First Molar", quadrant: 1, svgName: "molar", rotation: 180 },
  { number: 53, name: "Primary Canine", quadrant: 1, svgName: "canine", rotation: 180 },
  { number: 52, name: "Primary Lateral Incisor", quadrant: 1, svgName: "incisor", rotation: 180 },
  { number: 51, name: "Primary Central Incisor", quadrant: 1, svgName: "incisor", rotation: 180 },

  // Upper Left (Quadrant 2) - Primary teeth 61-65
  { number: 61, name: "Primary Central Incisor", quadrant: 2, svgName: "incisor", rotation: 180 },
  { number: 62, name: "Primary Lateral Incisor", quadrant: 2, svgName: "incisor", rotation: 180 },
  { number: 63, name: "Primary Canine", quadrant: 2, svgName: "canine", rotation: 180 },
  { number: 64, name: "Primary First Molar", quadrant: 2, svgName: "molar", rotation: 180 },
  { number: 65, name: "Primary Second Molar", quadrant: 2, svgName: "molar", rotation: 180 },

  // Lower Right (Quadrant 4) - Primary teeth 81-85
  { number: 81, name: "Primary Central Incisor", quadrant: 4, svgName: "incisor", rotation: 0 },
  { number: 82, name: "Primary Lateral Incisor", quadrant: 4, svgName: "incisor", rotation: 0 },
  { number: 83, name: "Primary Canine", quadrant: 4, svgName: "canine", rotation: 0 },
  { number: 84, name: "Primary First Molar", quadrant: 4, svgName: "molar", rotation: 0 },
  { number: 85, name: "Primary Second Molar", quadrant: 4, svgName: "molar", rotation: 0 },

  // Lower Left (Quadrant 3) - Primary teeth 71-75
  { number: 71, name: "Primary Central Incisor", quadrant: 3, svgName: "incisor", rotation: 0 },
  { number: 72, name: "Primary Lateral Incisor", quadrant: 3, svgName: "incisor", rotation: 0 },
  { number: 73, name: "Primary Canine", quadrant: 3, svgName: "canine", rotation: 0 },
  { number: 74, name: "Primary First Molar", quadrant: 3, svgName: "molar", rotation: 0 },
  { number: 75, name: "Primary Second Molar", quadrant: 3, svgName: "molar", rotation: 0 },
];

interface DentalChartViewProps {
  patientData: {
    id: string;
    name: string;
    age: number;
    ageGroup: string;
    gender: string;
    patientUniqueId: string;
  };
  dentalChartData: Array<{
    toothNumber: number;
    toothType: string;
    ageGroup: string;
    conditions: string[];
    surfaceConditions: Array<{
      surface: string;
      conditions: string[];
    }>;
    procedures: Array<{
      type: string;
      name: string;
      surface: string;
      status: string;
      conditionType?: string;
      procedureType?: string;
      cost?: number;
      estimatedCost?: number;
      notes?: string;
      date: string;
      performedBy: string;
      treatmentPlanId?: string;
      visitIds?: string[];
    }>;
    lastUpdated: string;
    lastUpdatedBy: string;
    lastVisitId?: string;
  }>;
  mode?: "compact" | "detailed";
  onToothClick?: (toothData: any) => void;
}

interface ToothTooltipProps {
  toothData: any;
  position: { x: number; y: number };
  onClose: () => void;
}

const ToothTooltip: React.FC<ToothTooltipProps> = ({ toothData, position, onClose }) => {
  return (
    <div 
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-w-sm w-full p-4"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-bold text-lg">Tooth #{toothData.toothNumber}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {toothData.toothType}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {toothData.ageGroup}
            </Badge>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <Calendar className="h-3 w-3" />
        <span>Last updated: {new Date(toothData.lastUpdated).toLocaleDateString()}</span>
      </div>

      {toothData.conditions.length > 0 && (
        <div className="mb-3">
          <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            General Conditions
          </h5>
          <div className="flex flex-wrap gap-1">
            {toothData.conditions.map((condition: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {condition}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {toothData.surfaceConditions.length > 0 && (
        <div className="mb-3">
          <h5 className="font-medium text-sm mb-2">Surface Conditions</h5>
          <div className="space-y-2">
            {toothData.surfaceConditions.map((surface: any, idx: number) => (
              <div key={idx} className="border-l-4 border-blue-200 pl-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm capitalize">{surface.surface}</span>
                  <Badge variant="outline" className="text-xs">
                    {surface.conditions.length} condition(s)
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {surface.conditions.map((condition: string, cIdx: number) => (
                    <Badge key={cIdx} variant="secondary" className="text-xs">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toothData.procedures.length > 0 && (
        <div className="mb-3">
          <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Procedures ({toothData.procedures.length})
          </h5>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {toothData.procedures.map((proc: any, idx: number) => (
              <div key={idx} className={`border-l-4 ${proc.status === 'completed' ? 'border-green-200' : 'border-yellow-200'} pl-3`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm">{proc.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="capitalize">{proc.surface}</span>
                      <span>•</span>
                      <span className={`${proc.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {proc.status}
                      </span>
                      {proc.cost && (
                        <>
                          <span>•</span>
                          <span>₹{proc.cost}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(proc.date).toLocaleDateString()}
                  </Badge>
                </div>
                {proc.notes && (
                  <p className="text-xs text-gray-600 mt-1">{proc.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-3 border-t flex justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>{toothData.procedures.length} total procedures</span>
        </div>
        <button 
          className="text-primary hover:text-primary/80"
          onClick={() => console.log("View detailed history for tooth", toothData.toothNumber)}
        >
          View History →
        </button>
      </div>
    </div>
  );
};

const DentalChartView: React.FC<DentalChartViewProps> = ({
  patientData,
  dentalChartData,
  mode = "detailed",
  onToothClick
}) => {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState<any>(null);

  // Get the appropriate tooth data based on age group
  const toothData = patientData.ageGroup === 'pediatric' ? PEDIATRIC_TOOTH_DATA : ADULT_TOOTH_DATA;

  // Create a map of tooth data for quick lookup
  const toothDataMap = useMemo(() => {
    const map: Record<number, any> = {};
    dentalChartData.forEach(tooth => {
      map[tooth.toothNumber] = tooth;
    });
    return map;
  }, [dentalChartData]);

  // Get tooth by number from the tooth data array
  const getToothByNumber = (toothNumber: number) => {
    return toothData.find(t => t.number === toothNumber);
  };

  // Get tooth color based on conditions and procedures (same logic as DentalChart)
  const getToothColor = (toothNumber: number): string => {
    const tooth = getToothByNumber(toothNumber);
    const toothChartData = toothDataMap[toothNumber];
    
    if (!toothChartData) return "#d1d5db"; // Light gray for no data

    const conditions = toothChartData.conditions || [];
    const procedures = toothChartData.procedures || [];

    if (conditions.includes("Missing")) return "#9ca3af";
    if (conditions.includes("Caries")) return "#ef4444";
    if (conditions.includes("Filling")) return "#3b82f6";
    if (conditions.includes("Crown")) return "#f59e0b";
    if (conditions.includes("Root Canal")) return "#8b5cf6";
    if (conditions.includes("Hypoplastic")) return "#a855f7";
    if (conditions.includes("Discolored")) return "#64748b";
    
    // Check procedures
    if (procedures.some((p: any) => p.name === "Filling" || p.name === "filling")) return "#3b82f6";
    if (procedures.some((p: any) => p.name === "Crown" || p.name === "crown")) return "#f59e0b";
    if (procedures.some((p: any) => p.name.includes("Root Canal"))) return "#8b5cf6";
    
    return "#4b5563"; // Default color for teeth with data
  };

  // Check if tooth has any data
  const hasToothData = (toothNumber: number): boolean => {
    return !!toothDataMap[toothNumber];
  };

  // Handle tooth hover
  const handleToothHover = (toothNumber: number, event: React.MouseEvent) => {
    const toothChartData = toothDataMap[toothNumber];
    if (toothChartData) {
      setHoveredTooth(toothNumber);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
      setTooltipData(toothChartData);
      setShowTooltip(true);
    }
  };

  // Handle tooth click
  const handleToothClick = (toothNumber: number, event: React.MouseEvent) => {
    const toothChartData = toothDataMap[toothNumber];
    if (toothChartData) {
      if (onToothClick) {
        onToothClick(toothChartData);
      } else {
        setTooltipPosition({ x: event.clientX, y: event.clientY });
        setTooltipData(toothChartData);
        setShowTooltip(true);
      }
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const teethWithData = dentalChartData.length;
    const totalProcedures = dentalChartData.reduce((sum, tooth) => 
      sum + (tooth.procedures?.length || 0), 0
    );
    const plannedProcedures = dentalChartData.reduce((sum, tooth) => 
      sum + (tooth.procedures?.filter((p: any) => p.status === 'planned')?.length || 0), 0
    );
    const completedProcedures = dentalChartData.reduce((sum, tooth) => 
      sum + (tooth.procedures?.filter((p: any) => p.status === 'completed')?.length || 0), 0
    );
    
    const allConditions = new Set<string>();
    dentalChartData.forEach(tooth => {
      tooth.conditions?.forEach((cond: string) => allConditions.add(cond));
      tooth.surfaceConditions?.forEach((sc: any) => 
        sc.conditions?.forEach((cond: string) => allConditions.add(cond))
      );
    });

    return {
      teethWithData,
      totalProcedures,
      plannedProcedures,
      completedProcedures,
      uniqueConditions: Array.from(allConditions),
    };
  }, [dentalChartData]);

  // Render a single tooth with the same layout as DentalChart
  const renderTooth = (tooth: any, index: number) => {
    const toothChartData = toothDataMap[tooth.number];
    const hasData = !!toothChartData;
    const isHovered = hoveredTooth === tooth.number;
    const color = getToothColor(tooth.number);
    
    return (
      <div
        key={`${tooth.quadrant}-${tooth.number}-${index}`}
        className="relative group flex flex-col items-center"
      >
        <button
          type="button"
          onClick={(e) => handleToothClick(tooth.number, e)}
          className={`relative transition-all duration-200 ${hasData ? 'cursor-pointer' : 'cursor-default'}`}
          onMouseEnter={(e) => handleToothHover(tooth.number, e)}
          onMouseLeave={() => {
            if (hoveredTooth === tooth.number) {
              setHoveredTooth(null);
              setShowTooltip(false);
            }
          }}
        >
          <div className="p-1 sm:p-1.5">
            <ToothSVG
              type={tooth.svgName}
              color={isHovered ? "#22c55e" : color}
              width={mode === "compact" ? 40 : 50}
              height={mode === "compact" ? 40 : 50}
              rotation={tooth.rotation}
              opacity={hasData ? 1 : 0.3}
            />
          </div>
          
          {hasData && !isHovered && (
            <div className="absolute -top-2 sm:-top-2.5 left-1/2 transform -translate-x-1/2">
              <div className="flex flex-col items-center">
                <div
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${toothChartData.conditions?.length > 0 ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: color }}
                />
                {toothChartData.procedures?.length > 0 && (
                  <div className="mt-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"></div>
                )}
              </div>
            </div>
          )}
          
          {isHovered && (
            <div className="absolute inset-0 bg-green-500/20 rounded-md pointer-events-none"></div>
          )}
        </button>
        
        <div className={`mt-1.5 text-[11px] sm:text-xs font-semibold mb-2 ${
          hasData 
            ? isHovered 
              ? 'text-green-600 scale-110' 
              : 'text-gray-700' 
            : 'text-gray-400'
        } transition-all`}>
          {tooth.number}
        </div>
        
        {/* Quick info badge for compact mode */}
        {mode === "compact" && hasData && (
          <div className="absolute -bottom-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
        )}
      </div>
    );
  };

  // Render quadrant in the same layout as DentalChart
  const renderQuadrant = (teeth: any[], quadrant: number, quadrantName: string) => {
    return (
      <div className="w-full">
        <div className="mb-2">
          <h4 className="text-sm font-medium text-gray-600">{quadrantName}</h4>
        </div>
        <div className="flex justify-center items-center gap-1.5 sm:gap-2">
          {teeth.map((tooth, index) => renderTooth(tooth, index))}
        </div>
      </div>
    );
  };

  // Get teeth for each quadrant
  const upperRightTeeth = toothData.filter(t => t.quadrant === 1);
  const upperLeftTeeth = toothData.filter(t => t.quadrant === 2);
  const lowerLeftTeeth = toothData.filter(t => t.quadrant === 3);
  const lowerRightTeeth = toothData.filter(t => t.quadrant === 4);

  return (
    <div className="relative">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Dental Chart Summary</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Patient:</span> {patientData.name}
                </div>
                <div>
                  <span className="font-medium">Age:</span> {patientData.age} ({patientData.ageGroup})
                </div>
                <div>
                  <span className="font-medium">ID:</span> {patientData.patientUniqueId}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">
                {patientData.ageGroup === 'pediatric' ? 'Pediatric' : 'Adult'} Dentition
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <div className="text-sm text-blue-600">Teeth with Data</div>
              <div className="text-2xl font-bold text-blue-700">{stats.teethWithData}</div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
              <div className="text-sm text-green-600">Total Procedures</div>
              <div className="text-2xl font-bold text-green-700">{stats.totalProcedures}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
              <div className="text-sm text-yellow-600">Planned</div>
              <div className="text-2xl font-bold text-yellow-700">{stats.plannedProcedures}</div>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
              <div className="text-sm text-purple-600">Completed</div>
              <div className="text-2xl font-bold text-purple-700">{stats.completedProcedures}</div>
            </div>
          </div>

          {/* Dental Chart - Same layout as your DentalChart component */}
          <div className="border rounded-lg bg-white p-3 md:p-5">
            {/* Vertical midline */}
            <div className="absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2">
              <div className="w-px h-full bg-gray-200"></div>
            </div>

            {/* Upper Arch */}
            {(upperRightTeeth.length > 0 || upperLeftTeeth.length > 0) && (
              <div className="flex justify-center items-center gap-1.5 sm:gap-2 md:gap-2.5 mb-6 sm:mb-8 md:mb-10">
                {/* Quadrant 1 - Upper Right */}
                <div className="flex justify-end items-center gap-1.5 sm:gap-2">
                  {upperRightTeeth.map((tooth, index) => renderTooth(tooth, index))}
                </div>

                {/* Quadrant 2 - Upper Left */}
                <div className="flex justify-start items-center gap-1.5 sm:gap-2">
                  {upperLeftTeeth.map((tooth, index) => renderTooth(tooth, index))}
                </div>
              </div>
            )}

            {/* Lower Arch */}
            {(lowerRightTeeth.length > 0 || lowerLeftTeeth.length > 0) && (
              <div className="flex justify-center items-center gap-1.5 sm:gap-2 md:gap-2.5 mt-6 sm:mt-8 md:mt-10">
                {/* Quadrant 3 - Lower Left */}
                <div className="flex justify-end items-center gap-1.5 sm:gap-2">
                  {lowerLeftTeeth.map((tooth, index) => renderTooth(tooth, index))}
                </div>

                {/* Quadrant 4 - Lower Right */}
                <div className="flex justify-start items-center gap-1.5 sm:gap-2">
                  {lowerRightTeeth.map((tooth, index) => renderTooth(tooth, index))}
                </div>
              </div>
            )}

            {/* Quadrant Labels - Same as DentalChart */}
            <div className="absolute top-2 left-2">
              <Badge className="bg-blue-50 text-blue-700 text-xs border border-blue-200">
                Q1(UL)
              </Badge>
            </div>
            
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-50 text-green-700 text-xs border border-green-200">
                Q2(UR)
              </Badge>
            </div>
            
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-yellow-50 text-yellow-700 text-xs border border-yellow-200">
                Q3(LL)
              </Badge>
            </div>
            
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-red-50 text-red-700 text-xs border border-red-200">
                Q4(LR)
              </Badge>
            </div>
          </div>

          {/* Legend - Same colors as DentalChart */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
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
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#d1d5db]"></div>
              <span className="text-gray-700">No Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#22c55e]"></div>
              <span className="text-gray-700">Hovered</span>
            </div>
          </div>

          {/* Summary of all teeth with data */}
          {mode === "detailed" && dentalChartData.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Teeth with Dental History</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dentalChartData.map((tooth) => (
                  <div 
                    key={tooth.toothNumber}
                    className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => handleToothClick(tooth.toothNumber, e)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Tooth #{tooth.toothNumber}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {tooth.conditions.slice(0, 2).map((cond, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {cond}
                            </Badge>
                          ))}
                          {tooth.conditions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{tooth.conditions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {tooth.procedures.length} procedures
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(tooth.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tooltip */}
      {showTooltip && tooltipData && (
        <ToothTooltip
          toothData={tooltipData}
          position={tooltipPosition}
          onClose={() => setShowTooltip(false)}
        />
      )}
    </div>
  );
};

export default DentalChartView;