// useImagePreloader.tsx - FIXED VERSION
import { useState, useEffect } from 'react';

export const useImagePreloader = (imageUrls: string[]) => {
  const [loaded, setLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    // If no images to preload, mark as loaded immediately
    if (!imageUrls || imageUrls.length === 0) {
      setLoaded(true);
      return;
    }

    let mounted = true;
    let completedCount = 0;
    const totalImages = imageUrls.length;

    const preloadImages = () => {
      imageUrls.forEach((url) => {
        const img = new Image();
        
        // Add cache busting to prevent browser caching issues
        const cacheBustedUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
        
        img.onload = () => {
          if (!mounted) return;
          
          completedCount++;
          setLoadedCount(completedCount);
          
          // Mark as loaded when all images are loaded
          if (completedCount >= totalImages) {
            setLoaded(true);
          }
        };
        
        img.onerror = () => {
          if (!mounted) return;
          
          completedCount++;
          setLoadedCount(completedCount);
          
          // Still mark as loaded even if some fail
          if (completedCount >= totalImages) {
            setLoaded(true);
          }
        };
        
        img.src = cacheBustedUrl;
      });

      // Fallback timeout in case images take too long
      const timeout = setTimeout(() => {
        if (mounted && !loaded) {
          console.log('Image preload timeout, continuing anyway');
          setLoaded(true);
        }
      }, 3000); // 3 second timeout

      return () => clearTimeout(timeout);
    };

    preloadImages();

    return () => {
      mounted = false;
    };
  }, [imageUrls]); // Only re-run if imageUrls changes

  return { loaded, loadedCount };
};