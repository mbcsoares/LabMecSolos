import React from 'react';

interface Props {
  atual: number;
  minimo: number;
}

const ProgressoEnsaio: React.FC<Props> = ({ atual, minimo }) => {
  const pct = Math.min(100, Math.round((atual / minimo) * 100));
  const completo = atual >= minimo;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ion-color-medium)' }}>
          Progresso
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: completo ? 'var(--ion-color-success)' : 'var(--ion-color-warning)' }}>
          {atual}/{minimo}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          backgroundColor: 'var(--app-color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            backgroundColor: completo ? 'var(--ion-color-success)' : 'var(--ion-color-primary)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

export default ProgressoEnsaio;
