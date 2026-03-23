import React, { useEffect } from 'react';
import { preloadAllDentalSvgs } from '../utils/dentalSvgCache';

const PRELOAD_KEY = 'dentalSvgsPreloaded';

const DentalChartGlobalPreloader: React.FC = () => {
  useEffect(() => {
    if (sessionStorage.getItem(PRELOAD_KEY) === 'true') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🦷 Dental SVGs already preloaded this session, skipping.');
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🦷 Dental chart assets preloading in background...');
    }

    const run = () => {
      preloadAllDentalSvgs();
      sessionStorage.setItem(PRELOAD_KEY, 'true');
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Dental SVGs preloaded and cached for this session.');
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(run);
    } else {
      setTimeout(run, 100);
    }
  }, []);

  return null;
};

export default DentalChartGlobalPreloader;