// components/DentalSvgComponents.tsx
import React, { useState, useEffect } from 'react';
import { getCachedSvg, isSvgCached, cacheSvg, getSvgUrlFromCache,svgCache } from '../utils/dentalSvgCache';

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
const debugLog = (component: string, key: string, status: string) => {
  console.log(`🦷 ${component} [${key}]: ${status}`);
};
// ====== OPTIMIZED TOOTH SVG COMPONENT ======
export const ToothSVG = React.memo(({
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
  const cacheKey = type.toLowerCase();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    debugLog('ToothSVG', cacheKey, `Component mounted, checking cache...`);
    
    // Check cache immediately
    if (isSvgCached(cacheKey)) {
      debugLog('ToothSVG', cacheKey, 'Found in cache');
      setIsLoaded(true);
      return;
    }

    debugLog('ToothSVG', cacheKey, 'Not in cache, trying to load...');
    
    // Try to load from URL
    const svgUrl = getSvgUrlFromCache(type, 'tooth');
    if (svgUrl) {
      debugLog('ToothSVG', cacheKey, `Loading from URL: ${svgUrl}`);
      cacheSvg(svgUrl, cacheKey)
        .then(() => {
          debugLog('ToothSVG', cacheKey, 'Loaded successfully');
          setIsLoaded(true);
        })
        .catch((err) => {
          console.error(`Failed to load SVG for ${cacheKey}:`, err);
          debugLog('ToothSVG', cacheKey, 'Load failed');
          setHasError(true);
        });
    } else {
      debugLog('ToothSVG', cacheKey, 'No URL found for type');
      setHasError(true);
    }
  }, [cacheKey, type]);

  // Log current cache status
  useEffect(() => {
    console.log(`🦷 Current cache keys:`, Array.from(svgCache.keys()));
  }, []);

  // Fast render with cached image
  if (isLoaded && !hasError) {
    const cachedImg = getCachedSvg(cacheKey);
    if (cachedImg) {
      debugLog('ToothSVG', cacheKey, 'Rendering cached image');
      return (
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `rotate(${rotation}deg)`,
            display: "inline-block",
            position: 'relative',
          }}
        >
          <img
            src={cachedImg.src}
            alt={`${type} tooth`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: color === '#4b5563' ? 'none' : 
                `drop-shadow(0 0 2px ${color}) brightness(0.9) sepia(1) hue-rotate(${getHueFromColor(color)}deg) saturate(2)`,
            }}
            loading="eager"
            decoding="sync"
          />
        </div>
      );
    }
  }

  debugLog('ToothSVG', cacheKey, 'Rendering placeholder');
  
  // Instant placeholder (no loading spinner)
  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${rotation}deg)`,
        display: "inline-block",
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '6px',
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
        {/* Debug overlay */}
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
      </div>
    </div>
  );
});

ToothSVG.displayName = 'ToothSVG';

// ====== OPTIMIZED SOFT TISSUE SVG COMPONENT ======
export const SoftTissueSVG = React.memo(({
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
  const cacheKey = `soft-${type.toLowerCase()}`;
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isSvgCached(cacheKey)) {
      setIsLoaded(true);
      return;
    }

    const svgUrl = getSvgUrlFromCache(type, 'softTissue');
    if (svgUrl) {
      cacheSvg(svgUrl, cacheKey)
        .then(() => setIsLoaded(true))
        .catch(() => setHasError(true));
    } else {
      setHasError(true);
    }
  }, [cacheKey, type]);

  if (isLoaded && !hasError) {
    const cachedImg = getCachedSvg(cacheKey);
    if (cachedImg) {
      return (
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            display: "inline-block",
            position: 'relative',
          }}
        >
          <img
            src={cachedImg.src}
            alt={`${type} soft tissue`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: color === '#4b5563' || color === '#3b82f6' ? 'none' : 
                `drop-shadow(0 0 1px ${color})`,
            }}
            loading="eager"
            decoding="sync"
          />
        </div>
      );
    }
  }

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: "inline-block",
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '8px',
        }}
      />
    </div>
  );
});

SoftTissueSVG.displayName = 'SoftTissueSVG';

// ====== OPTIMIZED TMJ SVG COMPONENT ======
export const TMJSVG = React.memo(({
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
  const cacheKey = `tmj-${type.toLowerCase()}`;
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isSvgCached(cacheKey)) {
      setIsLoaded(true);
      return;
    }

    const svgUrl = getSvgUrlFromCache(type, 'tmj');
    if (svgUrl) {
      cacheSvg(svgUrl, cacheKey)
        .then(() => setIsLoaded(true))
        .catch(() => setHasError(true));
    } else {
      setHasError(true);
    }
  }, [cacheKey, type]);

  if (isLoaded && !hasError) {
    const cachedImg = getCachedSvg(cacheKey);
    if (cachedImg) {
      return (
        <div
          style={{
            width: `${width}px`,
            height: `${height}px`,
            display: "inline-block",
            position: 'relative',
          }}
        >
          <img
            src={cachedImg.src}
            alt={`${type} TMJ`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: color === '#4b5563' || color === '#8b5cf6' ? 'none' : 
                `drop-shadow(0 0 1px ${color})`,
            }}
            loading="eager"
            decoding="sync"
          />
        </div>
      );
    }
  }

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: "inline-block",
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '50%',
        }}
      />
    </div>
  );
});

TMJSVG.displayName = 'TMJSVG';