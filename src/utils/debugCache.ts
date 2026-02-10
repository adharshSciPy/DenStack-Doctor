// utils/debugSvgCache.ts
import { svgCache } from './dentalSvgCache';

export const logSvgCacheStatus = () => {
  console.log('🦷 SVG Cache Status:');
  console.log(`Cache size: ${svgCache.size}`);
  
  if (svgCache.size === 0) {
    console.warn('⚠️ SVG cache is empty!');
  } else {
    svgCache.forEach((img, key) => {
      console.log(`✅ ${key}: ${img.complete ? 'Loaded' : 'Loading'}, src: ${img.src.substring(0, 50)}...`);
    });
  }
};