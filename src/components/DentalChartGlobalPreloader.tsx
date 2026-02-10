// components/DentalChartGlobalPreloader.tsx
import React, { useEffect } from 'react';
import { preloadAllDentalSvgs } from '../utils/dentalSvgCache';

const DentalChartGlobalPreloader: React.FC = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🦷 Dental chart assets preloading in background...');
    }
    
    // Use requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadAllDentalSvgs();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        preloadAllDentalSvgs();
      }, 100);
    }
  }, []);

  return null;
};

export default DentalChartGlobalPreloader;