import React from 'react';

interface Props {
  seconds: number;
}

const TimerDisplay: React.FC<Props> = ({ seconds }) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const isExpired = seconds <= 0;
  const isWarning = seconds <= 60;

  return (
    <div style={{
      textAlign: 'center',
      padding: '8px 0',
      fontSize: 13,
      fontWeight: 600,
      color: isExpired ? 'var(--ion-color-danger)' : isWarning ? 'var(--ion-color-warning)' : 'var(--ion-color-medium)',
    }}>
      {isExpired ? 'Codigo expirado' : `Expira em ${formatted}`}
    </div>
  );
};

export default TimerDisplay;
