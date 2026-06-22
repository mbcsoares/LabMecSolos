import React from 'react';

interface SkeletonLoaderProps {
  type: 'card' | 'kpi' | 'mini' | 'line';
  count?: number;
}

const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--app-color-border) 25%, transparent 50%, var(--app-color-border) 75%)',
  backgroundSize: '200% 100%',
  borderRadius: 4,
  animation: 'shimmer 1.5s ease-in-out infinite',
};

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 1 }) => {
  if (typeof document !== 'undefined' && !document.getElementById('shimmer-style')) {
    const style = document.createElement('style');
    style.id = 'shimmer-style';
    style.textContent = shimmerKeyframes;
    document.head.appendChild(style);
  }

  const renderCard = () => (
    <div key={Math.random()} style={{
      background: 'var(--ion-card-background)',
      borderRadius: 8,
      padding: 16,
      boxShadow: 'var(--app-shadow-card)',
      border: '1px solid var(--app-color-border)',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ ...shimmerStyle, width: '40%', height: 16 }} />
        <div style={{ ...shimmerStyle, width: '20%', height: 12 }} />
      </div>
      <div style={{ ...shimmerStyle, width: '80%', height: 14, marginBottom: 8 }} />
      <div style={{ ...shimmerStyle, width: '60%', height: 14, marginBottom: 8 }} />
      <div style={{ ...shimmerStyle, width: '100%', height: 6, marginTop: 12, borderRadius: 3 }} />
    </div>
  );

  const renderKpi = () => (
    <div key={Math.random()} style={{
      background: 'var(--ion-card-background)',
      borderRadius: 8,
      padding: '12px 12px',
      boxShadow: 'var(--app-shadow-card)',
      border: '1px solid var(--app-color-border)',
      textAlign: 'center',
      minHeight: 80,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{ ...shimmerStyle, width: 48, height: 28, marginBottom: 8 }} />
      <div style={{ ...shimmerStyle, width: '70%', height: 12 }} />
    </div>
  );

  const renderMini = () => (
    <div key={Math.random()} style={{
      background: 'var(--ion-card-background)',
      borderRadius: 8,
      padding: '12px 16px',
      boxShadow: 'var(--app-shadow-card)',
      border: '1px solid var(--app-color-border)',
      minHeight: 72,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>
      <div style={{ ...shimmerStyle, width: 32, height: 24, marginBottom: 6 }} />
      <div style={{ ...shimmerStyle, width: '80%', height: 10 }} />
    </div>
  );

  const renderLine = () => (
    <div key={Math.random()} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
      <div style={{ ...shimmerStyle, width: 60, height: 12 }} />
      <div style={{ ...shimmerStyle, width: '60%', height: 12 }} />
    </div>
  );

  const renderItem = () => {
    switch (type) {
      case 'card': return renderCard();
      case 'kpi': return renderKpi();
      case 'mini': return renderMini();
      case 'line': return renderLine();
    }
  };

  return (
    <div>
      {Array.from({ length: count }, () => renderItem())}
    </div>
  );
};

export default SkeletonLoader;
