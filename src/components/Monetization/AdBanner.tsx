import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdBannerProps {
  className?: string;
  style?: React.CSSProperties;
  format?: 'auto' | 'fluid' | 'rectangle';
  slotId?: string; // Optional: specific slot ID if user creates units manually later
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  className = '', 
  style = {}, 
  format = 'auto',
  slotId = '1234567890' // Placeholder slot
}) => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (window.adsbygoogle && adRef.current) {
         // Check if the ad is already populated to avoid double push
         if (adRef.current.innerHTML === '') {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
         }
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <div className={`ad-container my-8 text-center ${className}`} style={{ minHeight: '100px', ...style }}>
      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Publicidade</div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-3474819177178762"
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdBanner;
