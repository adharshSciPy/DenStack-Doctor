
const preloadDentalAssets = () => {
  const svgPaths = [
    '/assets/svg/dental/incisor.svg',
    '/assets/svg/dental/canine.svg',
    '/assets/svg/dental/premolar.svg',
    '/assets/svg/dental/molar.svg',
    '/assets/svg/dental/wisdom.svg',
    '/assets/svg/softTissue/Tongue.svg',
    '/assets/svg/softTissue/Gingiva.svg',
    '/assets/svg/softTissue/Palate.svg',
    '/assets/svg/softTissue/BuccalMucosa.svg',
    '/assets/svg/softTissue/FloorOfTheMouth.svg',
    '/assets/svg/softTissue/LabialMucosa.svg',
    '/assets/svg/softTissue/SalivaryGlands.svg',
    '/assets/svg/softTissue/Frenum.svg',
    '/assets/svg/tmj/LeftTMJ.svg',
    '/assets/svg/tmj/RightTMJ.svg',
    '/assets/svg/tmj/BothTMJ.svg',
  ];

  // Start preloading in the background
  svgPaths.forEach(url => {
    const img = new Image();
    img.src = url;
  });

  console.log('🔄 Preloading dental assets in background...');
};