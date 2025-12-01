import React from 'react';

const LazySpeedInsights = React.lazy(async () => {
  const mod = await import('@vercel/speed-insights');
  // Some builds export the component as a named export
  return { default: mod.SpeedInsights ?? (mod as any).default } as any;
});

const SpeedInsightsWrapper: React.FC = () => {
  // Only include in production builds to avoid noise during development
  if (process.env.NODE_ENV !== 'production') return null;

  return (
    <React.Suspense fallback={null}>
      <LazySpeedInsights />
    </React.Suspense>
  );
};

export default SpeedInsightsWrapper;
