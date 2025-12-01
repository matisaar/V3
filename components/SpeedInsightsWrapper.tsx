import React, { useEffect, useState } from 'react';

const isValidComponent = (C: any) => {
  return typeof C === 'function' || (C && (C.$$typeof || C.render));
};

const SpeedInsightsWrapper: React.FC = () => {
  // Only include in production builds by default to avoid noise during development.
  // You can enable in other environments by setting `VITE_ENABLE_SPEED_INSIGHTS=true`.
  const enabledInDev = Boolean((import.meta as any).env?.VITE_ENABLE_SPEED_INSIGHTS === 'true');
  if (process.env.NODE_ENV !== 'production' && !enabledInDev) return null;

  const [Comp, setComp] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Import the React-specific entry to get the `SpeedInsights` component
        const mod = await import('@vercel/speed-insights/react');
        const candidate = mod.SpeedInsights ?? (mod as any).default ?? mod;
        if (mounted && isValidComponent(candidate)) {
          setComp(() => candidate as React.ComponentType);
        } else {
          console.warn('SpeedInsights: no usable component export found from @vercel/speed-insights/react, skipping render.');
        }
      } catch (err) {
        console.warn('Failed to load @vercel/speed-insights/react:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!Comp) return null;

  return <Comp />;
};

export default SpeedInsightsWrapper;
