// components/DentalSvgComponents.tsx
import React, { useState, useEffect } from 'react';
import { 
  getCachedSvg, 
  isSvgCached, 
  cacheSvg, 
  getSvgUrlFromCache, 
  svgCache 
} from '../utils/dentalSvgCache';

// Helper to get hue from color
const getHueFromColor = (hexColor: string): number => {
  const colorMap: Record<string, number> = {
    '#ef4444': 0,    // red (caries)
    '#3b82f6': 220,  // blue (filling)
    '#f59e0b': 40,   // orange (crown)
    '#8b5cf6': 270,  // purple (root canal)
    '#9ca3af': 0,    // gray (missing)
    '#22c55e': 140,  // green (selected)
    '#4b5563': 0,    // default gray
  };
  
  return colorMap[hexColor.toLowerCase()] || 0;
};

// Production-safe debug logging
const debugLog = (component: string, key: string, status: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🦷 ${component} [${key}]: ${status}`);
  }
};

// Helper to generate consistent cache keys
const getCacheKey = (type: string, category: 'tooth' | 'softTissue' | 'tmj'): string => {
  const normalizedType = type.toLowerCase();
  
  switch (category) {
    case 'softTissue':
      return `soft-${normalizedType}`;
    case 'tmj':
      // Remove duplicate "tmj-" prefix if present
      const cleanType = normalizedType.replace('tmj-', '');
      return `tmj-${cleanType}`;
    default:
      return normalizedType;
  }
};

// Generic SVG component factory
const createSvgComponent = (
  componentName: string,
  defaultCategory: 'tooth' | 'softTissue' | 'tmj',
  defaultColor: string = "#4b5563",
  getCustomFilter?: (color: string, defaultColor: string) => string
) => {
  const SvgComponent = React.memo(({
    type,
    color = defaultColor,
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
    const cacheKey = getCacheKey(type, defaultCategory);
    const [isLoaded, setIsLoaded] = useState(() => isSvgCached(cacheKey));
    const [hasError, setHasError] = useState(false);
    const isDevelopment = process.env.NODE_ENV === 'development';

    useEffect(() => {
      debugLog(componentName, cacheKey, `Component mounted, checking cache...`);
      
      if (isLoaded) return;

      const svgUrl = getSvgUrlFromCache(type, defaultCategory);
      
      if (!svgUrl) {
        debugLog(componentName, cacheKey, 'No URL found for type');
        setHasError(true);
        return;
      }

      debugLog(componentName, cacheKey, `Loading from URL: ${svgUrl}`);
      cacheSvg(svgUrl, cacheKey)
        .then(() => {
          debugLog(componentName, cacheKey, 'Loaded successfully');
          setIsLoaded(true);
        })
        .catch((err) => {
          if (isDevelopment) {
            console.error(`Failed to load SVG for ${cacheKey}:`, err);
          }
          debugLog(componentName, cacheKey, 'Load failed');
          setHasError(true);
        });
    }, [cacheKey, type, isLoaded]);

    // Log cache status in development
    useEffect(() => {
      if (isDevelopment) {
        debugLog(componentName, cacheKey, 'Component rendered');
      }
    }, [cacheKey, isDevelopment]);

    // Render cached image
    if (isLoaded && !hasError) {
      const cachedImg = getCachedSvg(cacheKey);
      if (cachedImg) {
        debugLog(componentName, cacheKey, 'Rendering cached image');
        
        const filter = getCustomFilter 
          ? getCustomFilter(color, defaultColor)
          : color === defaultColor ? 'none' : `drop-shadow(0 0 1px ${color})`;
        
        return (
          <div
            style={{
              width: `${width}px`,
              height: `${height}px`,
              transform: rotation ? `rotate(${rotation}deg)` : undefined,
              display: "inline-block",
              position: 'relative',
            }}
            data-svg-key={cacheKey}
            data-svg-loaded="true"
          >
            <img
              src={cachedImg.src}
              alt={`${type} ${defaultCategory}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter,
              }}
              loading="eager"
              decoding="sync"
              onError={() => setHasError(true)}
            />
          </div>
        );
      }
    }

    // Render placeholder
    debugLog(componentName, cacheKey, 'Rendering placeholder');
    
    const placeholderStyle = {
      width: `${width}px`,
      height: `${height}px`,
      transform: rotation ? `rotate(${rotation}deg)` : undefined,
      display: "inline-block" as const,
      position: 'relative' as const,
    };

    return (
      <div style={placeholderStyle} data-svg-key={cacheKey} data-svg-loaded="false">
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: defaultCategory === 'tmj' ? '50%' : '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '75%',
              height: '75%',
              backgroundColor: '#f1f5f9',
              borderRadius: '3px',
            }}
          />
          {isDevelopment && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '8px',
              color: '#666',
              fontWeight: 'bold',
            }}>
              {type}
            </div>
          )}
        </div>
      </div>
    );
  });

  SvgComponent.displayName = componentName;
  return SvgComponent;
};

// ====== OPTIMIZED TOOTH SVG COMPONENT ======
export const ToothSVG = createSvgComponent(
  'ToothSVG',
  'tooth',
  "#4b5563",
  (color, defaultColor) => {
    return color === defaultColor ? 'none' : 
      `drop-shadow(0 0 2px ${color}) brightness(0.9) sepia(1) hue-rotate(${getHueFromColor(color)}deg) saturate(2)`;
  }
);

// ====== OPTIMIZED SOFT TISSUE SVG COMPONENT ======
export const SoftTissueSVG = createSvgComponent(
  'SoftTissueSVG',
  'softTissue',
  "#4b5563"
);

// ====== OPTIMIZED TMJ SVG COMPONENT ======
export const TMJSVG = createSvgComponent(
  'TMJSVG',
  'tmj',
  "#4b5563"
);

// Export helper for development/debugging
export const SvgCacheStatus = () => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  const [cacheSize, setCacheSize] = useState(0);
  
  useEffect(() => {
    const updateSize = () => {
      setCacheSize(svgCache?.size || 0);
    };
    
    updateSize();
    const interval = setInterval(updateSize, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      zIndex: 9999,
    }}>
      SVG Cache: {cacheSize} items
    </div>
  );
};