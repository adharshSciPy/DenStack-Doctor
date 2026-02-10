// utils/dentalSvgCache.ts
// This runs ONCE when your app starts, not when DentalChart loads

// ====== GLOBAL SVG CACHE (Shared across entire app) ======
export const svgCache = new Map<string, HTMLImageElement>();
export const svgLoadingPromises = new Map<string, Promise<HTMLImageElement>>();

// SVG URL imports - MAKE SURE THESE PATHS ARE CORRECT
export const svgUrls = {
  // Teeth
  incisor: "/assets/svg/dental/incisor.svg",
  canine: "/assets/svg/dental/canine.svg",
  premolar: "/assets/svg/dental/premolar.svg",
  molar: "/assets/svg/dental/molar.svg",
  wisdom: "/assets/svg/dental/wisdom.svg",
  
  // Soft Tissue
  tongue: "/assets/svg/softTissue/Tongue.svg",
  gingiva: "/assets/svg/softTissue/Gingiva.svg",
  palate: "/assets/svg/softTissue/Palate.svg",
  "buccal-mucosa": "/assets/svg/softTissue/BuccalMucosa.svg",
  "floor-of-mouth": "/assets/svg/softTissue/FloorOfTheMouth.svg",
  "labial-mucosa": "/assets/svg/softTissue/LabialMucosa.svg",
  "salivary-glands": "/assets/svg/softTissue/SalivaryGlands.svg",
  frenum: "/assets/svg/softTissue/Frenum.svg",
  
  // TMJ
  "tmj-left": "/assets/svg/tmj/LeftTMJ.svg",
  "tmj-right": "/assets/svg/tmj/RightTMJ.svg",
  "tmj-both": "/assets/svg/tmj/BothTMJ.svg",
};

// Function to preload and cache an SVG
export const cacheSvg = (url: string, key: string): Promise<HTMLImageElement> => {
  console.log(`🦷 cacheSvg called for ${key}: ${url}`);
  
  if (svgCache.has(key)) {
    console.log(`✅ ${key} already in cache`);
    return Promise.resolve(svgCache.get(key)!);
  }

  if (svgLoadingPromises.has(key)) {
    console.log(`⏳ ${key} already loading`);
    return svgLoadingPromises.get(key)!;
  }

  console.log(`🚀 Starting load for ${key}`);
  
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      console.log(`✅ Loaded ${key} successfully`);
      svgCache.set(key, img);
      svgLoadingPromises.delete(key);
      resolve(img);
    };
    
    img.onerror = (err) => {
      console.error(`❌ Failed to load ${key}:`, err, `URL: ${url}`);
      svgLoadingPromises.delete(key);
      reject(err);
    };
    
    img.src = url;
    console.log(`📤 Set src for ${key}: ${url}`);
  });

  svgLoadingPromises.set(key, promise);
  return promise;
};

// Preload all dental SVGs immediately when this module loads
export const preloadAllDentalSvgs = () => {
  console.log('🦷 Preloading dental SVGs globally...');
  console.log('Available URLs:', Object.keys(svgUrls));
  
  Object.entries(svgUrls).forEach(([key, url]) => {
    console.log(`Preloading ${key}: ${url}`);
    cacheSvg(url, key).catch((err) => {
      // Silent fail - we'll handle missing images gracefully
      console.warn(`⚠️ Failed to load SVG: ${key}`, err);
    });
  });
  
  // Also preload using link[rel=preload] for better performance
  if (typeof document !== 'undefined') {
    Object.values(svgUrls).forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
      console.log(`🔗 Added preload for: ${url}`);
    });
  }
};

// Get SVG URL by type and category
// utils/dentalSvgCache.ts
export const getSvgUrlFromCache = (type: string, category: 'tooth' | 'softTissue' | 'tmj'): string | null => {
  let key = '';
  
  if (category === 'softTissue') {
    key = type.toLowerCase();
  } else if (category === 'tmj') {
    // Remove "tmj-" prefix if it already exists to avoid duplication
    key = type.toLowerCase().replace(/^tmj-/, '');
    key = `tmj-${key}`; // Now add it once
  } else {
    key = type.toLowerCase();
  }
  
  const url = svgUrls[key as keyof typeof svgUrls];
  console.log(`🔍 getSvgUrlFromCache: type=${type}, category=${category}, key=${key}, found=${!!url}`);
  
  return url || null;
};

// Get cached image by key
export const getCachedSvg = (key: string): HTMLImageElement | null => {
  const cached = svgCache.get(key);
  console.log(`🔍 getCachedSvg: ${key}, found=${!!cached}`);
  return cached || null;
};

// Check if SVG is cached
export const isSvgCached = (key: string): boolean => {
  const isCached = svgCache.has(key);
  console.log(`🔍 isSvgCached: ${key}, ${isCached}`);
  return isCached;
};

// Start preloading immediately when module loads (runs once)
if (typeof window !== 'undefined') {
  console.log('🦷 SVG Cache module loaded in browser');
  // Start preloading after a tiny delay to not block initial page load
  setTimeout(() => {
    console.log('🦷 Starting SVG preload...');
    preloadAllDentalSvgs();
    
    // Log cache status after 1 second
    setTimeout(() => {
      console.log('🦷 Cache status after 1s:');
      console.log(`Total cached: ${svgCache.size}`);
      console.log(`Loading promises: ${svgLoadingPromises.size}`);
    }, 1000);
  }, 100);
}