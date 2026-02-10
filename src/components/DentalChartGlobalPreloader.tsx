// components/DentalChartGlobalPreloader.tsx
import React, { useEffect } from 'react';
import { preloadAllDentalSvgs, svgCache } from '../utils/dentalSvgCache';

const DentalChartGlobalPreloader: React.FC = () => {
  useEffect(() => {
    console.log('🦷 Dental chart assets preloading in background...');
    
    // Force preload
    preloadAllDentalSvgs();
    
    // Log status after 500ms
    setTimeout(() => {
      console.log(`🦷 Preloader: Cache has ${svgCache.size} items`);
    }, 500);
  }, []);

  return null;
};

export default DentalChartGlobalPreloader;