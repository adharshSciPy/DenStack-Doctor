// DentalChartView.tsx - Updated for proper full-page modal view
import React, { useState, useMemo, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  AlertCircle, 
  Calendar, 
  CheckCircle, 
  Clock,
  X,
  Stethoscope,
  CheckSquare,
  Loader2,
  ArrowLeft,
  User,
  FileText,
  Grid,
  ChevronDown
} from "lucide-react";
import { Button } from "./ui/button";
import DentalLoader from './DentalLoader';
import { useImagePreloader } from "../hooks/useImagePreloader";

// Import ToothSVG from your existing DentalChart component
interface ToothSVGProps {
  type: string;
  color?: string;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
}

const ToothSVG: React.FC<ToothSVGProps> = ({
  type,
  color = "#4b5563",
  width = 60,
  height = 60,
  rotation = 0,
  opacity = 1,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const TOOTH_SVGS: Record<string, string> = {
    incisor: "/assets/svg/dental/incisor.svg",
    canine: "/assets/svg/dental/canine.svg",
    premolar: "/assets/svg/dental/premolar.svg",
    molar: "/assets/svg/dental/molar.svg",
    wisdom: "/assets/svg/dental/wisdom.svg",
  };

  const getHueFromColor = (hexColor: string): number => {
    const colorMap: Record<string, number> = {
      '#ef4444': 0,    // red (caries)
      '#3b82f6': 220,  // blue (filling)
      '#f59e0b': 40,   // orange (crown)
      '#8b5cf6': 270,  // purple (root canal)
      '#9ca3af': 0,    // gray (missing)
      '#22c55e': 140,  // green (hovered)
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
        opacity: isLoaded ? opacity : 0,
        transition: 'opacity 0.3s ease',
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
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
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

// Tooth Data Arrays
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
  patientId: string;
  onClose?: () => void;
}

const DentalChartView: React.FC<DentalChartViewProps> = ({
  patientId,
  onClose,
}) => {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"teeth" | "summary" | "history">("teeth");
  
  // Preload all SVG images
  const allSvgUrls = React.useMemo(() => {
    return [
      '/assets/svg/dental/incisor.svg',
      '/assets/svg/dental/canine.svg',
      '/assets/svg/dental/premolar.svg',
      '/assets/svg/dental/molar.svg',
      '/assets/svg/dental/wisdom.svg',
    ];
  }, []);
  
  const { isLoading: imagesLoading } = useImagePreloader(allSvgUrls);

  // Fetch dental chart data
  useEffect(() => {
    const fetchDentalChart = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `http://localhost:8002/api/v1/patient-service/patient/dental-chart/${patientId}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dental chart: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch dental chart data');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching dental chart');
        console.error('Error fetching dental chart:', err);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchDentalChart();
    }
  }, [patientId]);

  // Show loader while images are loading OR data is loading
  if (imagesLoading || loading) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center">
        <DentalLoader />
      </div>
    );
  }

  // Get the appropriate tooth data based on age group
  const toothData = useMemo(() => {
    if (!data) return ADULT_TOOTH_DATA;
    return data.patient.ageGroup === 'pediatric' ? PEDIATRIC_TOOTH_DATA : ADULT_TOOTH_DATA;
  }, [data]);

  // Create a map of tooth data for quick lookup
  const toothDataMap = useMemo(() => {
    if (!data?.dentalChart) return {};
    
    const map: Record<number, any> = {};
    data.dentalChart.forEach((tooth: any) => {
      map[tooth.toothNumber] = tooth;
    });
    return map;
  }, [data]);

  // Get tooth by number from the tooth data array
  const getToothByNumber = (toothNumber: number) => {
    return toothData.find(t => t.number === toothNumber);
  };

  // Get tooth color based on conditions and procedures
  const getToothColor = (toothNumber: number): string => {
    const toothChartData = toothDataMap[toothNumber];
    
    // If no data for this tooth, return dimmed color
    if (!toothChartData) return "#d1d5db";

    const conditions = toothChartData.conditions || [];
    const procedures = toothChartData.procedures || [];

    // Priority-based coloring
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
    
    // If tooth has any data but no specific condition/procedure, use default
    return "#4b5563";
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
      setTooltipPosition({ x: event.clientX, y: event.clientY });
      setTooltipData(toothChartData);
      setShowTooltip(true);
    }
  };

  // Statistics from API response
  const stats = data?.summary || {
    totalTeeth: 0,
    teethWithConditions: 0,
    teethWithProcedures: 0,
    totalProcedures: 0,
    plannedProcedures: 0,
    completedProcedures: 0,
    uniqueConditions: [],
    uniqueProcedureTypes: []
  };

  // Get tooth size based on screen width
  const getToothSize = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 42; 
      if (width < 768) return 46; 
      if (width < 1024) return 50; 
      if (width < 1280) return 54; 
      return 58; 
    }
    return 52;
  };

  // Render a single tooth
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
              width={getToothSize()}
              height={getToothSize()}
              rotation={tooth.rotation}
              opacity={hasData ? 1 : 0.3}
            />
          </div>
          
          {/* Indicators for teeth with data */}
          {hasData && !isHovered && (
            <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
              <div className="flex flex-col items-center">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${toothChartData.conditions?.length > 0 ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: color }}
                />
                {toothChartData.procedures?.length > 0 && (
                  <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500"></div>
                )}
              </div>
            </div>
          )}
          
          {/* Hover effect overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-green-500/20 rounded-md pointer-events-none"></div>
          )}
        </button>
        
        {/* Tooth number */}
        <div className={`mt-1.5 text-xs font-semibold mb-2 ${
          hasData 
            ? isHovered 
              ? 'text-green-600 scale-110' 
              : 'text-gray-700' 
            : 'text-gray-400'
        } transition-all`}>
          {tooth.number}
        </div>
      </div>
    );
  };

  // Get teeth for each quadrant
  const upperRightTeeth = toothData.filter(t => t.quadrant === 1);
  const upperLeftTeeth = toothData.filter(t => t.quadrant === 2);
  const lowerLeftTeeth = toothData.filter(t => t.quadrant === 3);
  const lowerRightTeeth = toothData.filter(t => t.quadrant === 4);

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Consultation
              </Button>
            )}
            <h1 className="text-2xl font-semibold">Dental History</h1>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Error Loading Dental History</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              )}
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-hidden">
      {/* Header - Fixed at top */}
      <div className="bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Consultation</span>
            </Button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">Dental History</h1>
            {data?.patient && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                <div className="flex items-center gap-1 sm:gap-2">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {data.patient.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span>Age: {data.patient.age}</span>
                  <Badge variant="outline" className="text-xs">
                    {data.patient.ageGroup === 'pediatric' ? 'Pediatric' : 'Adult'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate max-w-[100px] sm:max-w-none">
                    ID: {data.patient.patientUniqueId}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-xs">
            View Only
          </Badge>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b bg-gray-50">
        <div className="px-4 sm:px-6 py-2">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              type="button"
              onClick={() => setActiveTab("teeth")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === "teeth"
                  ? "bg-white border border-b-0 border-gray-300 text-primary rounded-t-lg"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
              Teeth Chart
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === "summary"
                  ? "bg-white border border-b-0 border-gray-300 text-primary rounded-t-lg"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 whitespace-nowrap ${
                activeTab === "history"
                  ? "bg-white border border-b-0 border-gray-300 text-primary rounded-t-lg"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        {activeTab === "teeth" ? (
          <div className="max-w-6xl mx-auto">
            {/* Statistics Cards */}
            {data?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-blue-600 font-medium">Teeth with Data</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-700 mt-1">{stats.totalTeeth}</div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-green-600 font-medium">Total Procedures</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-700 mt-1">{stats.totalProcedures}</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-yellow-600 font-medium">Planned</div>
                  <div className="text-xl sm:text-2xl font-bold text-yellow-700 mt-1">{stats.plannedProcedures}</div>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-purple-600 font-medium">Completed</div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">{stats.completedProcedures}</div>
                </div>
              </div>
            )}

            {/* Dental Chart */}
            <div className="border border-gray-300 rounded-xl bg-white p-3 sm:p-4 md:p-5 relative mb-6">
              {/* Vertical midline */}
              <div className="absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2">
                <div className="w-px h-full bg-gray-200"></div>
              </div>

              {/* Upper Arch */}
              <div className="flex justify-center items-center gap-1 sm:gap-1.5 md:gap-2.5 mb-4 sm:mb-6 md:mb-10">
                {/* Quadrant 1 - Upper Right */}
                {upperRightTeeth.map((tooth, index) => renderTooth(tooth, index))}

                {/* Quadrant 2 - Upper Left */}
                {upperLeftTeeth.map((tooth, index) => renderTooth(tooth, index))}
              </div>

              {/* Lower Arch */}
              <div className="flex justify-center items-center gap-1 sm:gap-1.5 md:gap-2.5 mt-4 sm:mt-6 md:mt-10">
                {/* Quadrant 4 - Lower Right */}
                {lowerRightTeeth.map((tooth, index) => renderTooth(tooth, index))}

                {/* Quadrant 3 - Lower Left */}
                {lowerLeftTeeth.map((tooth, index) => renderTooth(tooth, index))}
              </div>

              {/* Quadrant Labels */}
              {/* {selectedQuadrant === "all" && (
                <>
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
                </>
              )} */}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#ef4444]"></div>
                <span className="text-gray-700">Caries</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#3b82f6]"></div>
                <span className="text-gray-700">Filling</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#f59e0b]"></div>
                <span className="text-gray-700">Crown</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#8b5cf6]"></div>
                <span className="text-gray-700">Root Canal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#9ca3af]"></div>
                <span className="text-gray-700">Missing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#d1d5db]"></div>
                <span className="text-gray-700">No Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#22c55e]"></div>
                <span className="text-gray-700">Hovered</span>
              </div>
            </div>
          </div>
        ) : activeTab === "summary" ? (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Conditions Summary */}
              <Card>
                <CardHeader className="py-3 sm:py-4">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    Conditions Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-3 sm:py-4">
                  {stats.uniqueConditions && stats.uniqueConditions.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {stats.uniqueConditions.map((condition: string, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm">{condition}</span>
                          <Badge variant="outline" className="text-xs">
                            {toothData.filter(t => 
                              toothDataMap[t.number]?.conditions?.includes(condition)
                            ).length}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs sm:text-sm">No conditions recorded</p>
                  )}
                </CardContent>
              </Card>

              {/* Procedures Summary */}
              <Card>
                <CardHeader className="py-3 sm:py-4">
                  <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    Procedures Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-3 sm:py-4">
                  {stats.uniqueProcedureTypes && stats.uniqueProcedureTypes.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {stats.uniqueProcedureTypes.map((procedure: string, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm">{procedure}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {data.dentalChart.reduce((count: number, tooth: any) => 
                                count + (tooth.procedures?.filter((p: any) => 
                                  p.name === procedure
                                ).length || 0), 0)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs sm:text-sm">No procedures recorded</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Teeth with History */}
            {data?.dentalChart && data.dentalChart.length > 0 && (
              <Card className="mt-4 sm:mt-6">
                <CardHeader className="py-3 sm:py-4">
                  <CardTitle className="text-sm sm:text-base">Teeth with Dental History</CardTitle>
                </CardHeader>
                <CardContent className="py-3 sm:py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {data.dentalChart.map((tooth: any) => (
                      <div 
                        key={tooth.toothNumber}
                        className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={(e) => handleToothClick(tooth.toothNumber, e)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm sm:text-base">Tooth #{tooth.toothNumber}</div>
                            <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                              {tooth.conditions.slice(0, 2).map((cond: string, idx: number) => (
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
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {tooth.procedures.length} procedures
                            </div>
                            <div className="text-xs text-gray-500">
                              Last: {new Date(tooth.lastUpdated).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Treatment Timeline */}
            <Card>
              <CardHeader className="py-3 sm:py-4">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  Treatment History Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="py-3 sm:py-4">
                {data?.dentalChart && data.dentalChart.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {data.dentalChart
                      .flatMap((tooth: any) => 
                        (tooth.procedures || []).map((proc: any) => ({
                          ...proc,
                          toothNumber: tooth.toothNumber
                        }))
                      )
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((procedure: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-blue-200 pl-3 sm:pl-4 py-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-sm sm:text-base">Tooth #{procedure.toothNumber}: {procedure.name}</div>
                              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 mt-1">
                                <span className="capitalize">{procedure.surface}</span>
                                <span>•</span>
                                <span className={`${procedure.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {procedure.status}
                                </span>
                                {procedure.cost && (
                                  <>
                                    <span>•</span>
                                    <span>₹{procedure.cost}</span>
                                  </>
                                )}
                              </div>
                              {procedure.notes && (
                                <p className="text-xs sm:text-sm text-gray-600 mt-2">{procedure.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xs sm:text-sm font-medium">
                                {new Date(procedure.date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(procedure.date).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">No treatment history available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="border-t px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 flex-shrink-0 bg-white">
        <div className="text-xs sm:text-sm text-gray-500">
          {data?.dentalChart?.length || 0} teeth with dental history
          {stats.totalProcedures > 0 && (
            <span className="ml-2 sm:ml-3">
              • {stats.totalProcedures} total procedures
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            Print Report
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            Export as PDF
          </Button>
          {onClose && (
            <Button onClick={onClose} size="sm" className="text-xs sm:text-sm">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && tooltipData && (
        <div
          className="fixed z-[1000] bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-xs"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y + 10}px`,
          }}
        >
          <div className="font-semibold mb-1">Tooth #{tooltipData.toothNumber}</div>
          {tooltipData.conditions && tooltipData.conditions.length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-gray-300 mb-1">Conditions:</div>
              <div className="flex flex-wrap gap-1">
                {tooltipData.conditions.map((cond: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-gray-700 rounded text-xs">
                    {cond}
                  </span>
                ))}
              </div>
            </div>
          )}
          {tooltipData.procedures && tooltipData.procedures.length > 0 && (
            <div>
              <div className="text-xs text-gray-300 mb-1">Procedures:</div>
              {tooltipData.procedures.map((proc: any, idx: number) => (
                <div key={idx} className="text-xs mb-1">
                  • {proc.name} ({proc.surface})
                </div>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-2">
            Click for details
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalChartView;