// utils/dentalSvgCache.ts
// Production-ready SVG cache with proper cleanup

// ====== GLOBAL SVG CACHE ======
export let svgCache: Map<string, HTMLImageElement>;
export let svgLoadingPromises: Map<string, Promise<HTMLImageElement>>;
let isInitialized = false;

// SVG URL imports - single source of truth
export const svgUrls = {
  // Teeth
  incisor: "/assets/svg/dental/incisor.svg",
  canine: "/assets/svg/dental/canine.svg",
  premolar: "/assets/svg/dental/premolar.svg",
  molar: "/assets/svg/dental/molar.svg",
  wisdom: "/assets/svg/dental/wisdom.svg",
  
  // Soft Tissue
  "soft-tongue": "/assets/svg/softTissue/Tongue.svg",
  "soft-gingiva": "/assets/svg/softTissue/Gingiva.svg",
  "soft-palate": "/assets/svg/softTissue/Palate.svg",
  "soft-buccal-mucosa": "/assets/svg/softTissue/BuccalMucosa.svg",
  "soft-floor-of-mouth": "/assets/svg/softTissue/FloorOfTheMouth.svg",
  "soft-labial-mucosa": "/assets/svg/softTissue/LabialMucosa.svg",
  "soft-salivary-glands": "/assets/svg/softTissue/SalivaryGlands.svg",
  "soft-frenum": "/assets/svg/softTissue/Frenum.svg",
  
  // TMJ
  "tmj-left": "/assets/svg/tmj/LeftTMJ.svg",
  "tmj-right": "/assets/svg/tmj/RightTMJ.svg",
  "tmj-both": "/assets/svg/tmj/BothTMJ.svg",
} as const;

// Type definitions for better TypeScript support
export type SvgKey = keyof typeof svgUrls;
export type SvgCategory = 'tooth' | 'softTissue' | 'tmj';

// Initialize cache once
const initializeCache = () => {
  if (isInitialized) return;
  
  svgCache = new Map<string, HTMLImageElement>();
  svgLoadingPromises = new Map<string, Promise<HTMLImageElement>>();
  isInitialized = true;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🦷 SVG Cache initialized');
  }
};

// Function to preload and cache an SVG
export const cacheSvg = (url: string, key: string): Promise<HTMLImageElement> => {
  initializeCache();
  
  // Return cached image
  if (svgCache.has(key)) {
    return Promise.resolve(svgCache.get(key)!);
  }

  // Return existing loading promise
  if (svgLoadingPromises.has(key)) {
    return svgLoadingPromises.get(key)!;
  }

  // Create new loading promise
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      svgCache.set(key, img);
      svgLoadingPromises.delete(key);
      resolve(img);
    };
    
    img.onerror = (err) => {
      svgLoadingPromises.delete(key);
      reject(new Error(`Failed to load SVG: ${key} from ${url}`));
    };
    
    img.src = url;
    img.decoding = 'async';
  });

  svgLoadingPromises.set(key, promise);
  return promise;
};

// Preload all SVGs - CALL THIS ONCE at app start
export const preloadAllDentalSvgs = (): void => {
  initializeCache();
  
  // Check if already preloaded
  if (svgCache.size === Object.keys(svgUrls).length) {
    return;
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log('🦷 Preloading dental SVGs globally...');
  }

  Object.entries(svgUrls).forEach(([key, url]) => {
    cacheSvg(url, key).catch((err) => {
      if (isDevelopment) {
        console.warn(`⚠️ Failed to load SVG: ${key}`, err);
      }
    });
  });
  
  // Use link preloading for better performance
  if (typeof document !== 'undefined') {
    Object.values(svgUrls).forEach(url => {
      // Check if preload already exists
      const existing = document.querySelector(`link[href="${url}"]`);
      if (!existing) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.setAttribute('data-svg-preload', 'true');
        document.head.appendChild(link);
      }
    });
  }
};

// Get SVG URL by type and category
export const getSvgUrlFromCache = (
  type: string, 
  category: SvgCategory
): string | null => {
  let key: string;
  const normalizedType = type.toLowerCase();
  
  switch (category) {
    case 'softTissue':
      key = `soft-${normalizedType}`;
      break;
    case 'tmj':
      // Remove duplicate "tmj-" prefix if present
      key = `tmj-${normalizedType.replace('tmj-', '')}`;
      break;
    default:
      key = normalizedType;
  }
  
  return svgUrls[key as SvgKey] || null;
};

// Get cached image by key
export const getCachedSvg = (key: string): HTMLImageElement | null => {
  initializeCache();
  return svgCache.get(key) || null;
};

// Check if SVG is cached
export const isSvgCached = (key: string): boolean => {
  initializeCache();
  return svgCache.has(key);
};

// Cleanup function (call when app unmounts)
export const cleanupSvgCache = (): void => {
  if (svgCache) {
    svgCache.clear();
  }
  if (svgLoadingPromises) {
    svgLoadingPromises.clear();
  }
  
  // Remove preload links
  if (typeof document !== 'undefined') {
    document.querySelectorAll('link[data-svg-preload="true"]').forEach(link => {
      link.remove();
    });
  }
  
  isInitialized = false;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🦷 SVG Cache cleaned up');
  }
};

// Helper to get all available keys
export const getAvailableSvgKeys = (): string[] => {
  return Object.keys(svgUrls);
};

// Helper to get cache stats (development only)
export const getCacheStats = () => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return {
    cached: svgCache?.size || 0,
    loading: svgLoadingPromises?.size || 0,
    total: Object.keys(svgUrls).length,
  };
};

// Initialize immediately in browser
if (typeof window !== 'undefined') {
  initializeCache();
  
  // Start preloading after initial paint for better UX
  const startPreloading = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(preloadAllDentalSvgs, 500);
      });
    } else {
      setTimeout(preloadAllDentalSvgs, 500);
    }
  };
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(startPreloading);
  } else {
    startPreloading();
  }
}