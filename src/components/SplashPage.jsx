'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SplashPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);

    useEffect(() => {
    setIsVisible(true);
    
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 500);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-all duration-700 ease-in-out ${
      isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    }`}>
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8 animate-pulse">
          <Image
            src="/assets/LogoRadio2.svg"
            alt="Columbia"
            width={250}
            height={100}
            className="mx-auto drop-shadow-lg"
            priority
          />
        </div>
      </div>
    </div>
  );
} 