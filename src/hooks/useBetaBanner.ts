import { useState, useEffect } from 'react';

const BETA_BANNER_KEY = 'beta-banner-dismissed';
const LAUNCH_DATE = new Date('2025-10-01');

export const useBetaBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if we're past launch date
    const now = new Date();
    if (now >= LAUNCH_DATE) {
      setIsVisible(false);
      return;
    }

    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem(BETA_BANNER_KEY);
    setIsVisible(!dismissed);
  }, []);

  const dismissBanner = () => {
    localStorage.setItem(BETA_BANNER_KEY, 'true');
    setIsVisible(false);
  };

  return {
    isVisible,
    dismissBanner
  };
};