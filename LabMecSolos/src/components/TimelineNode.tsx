import React from 'react';

interface Props {
  ativo: boolean;
  icone?: string;
  titulo: string;
  subtitulos: string[];
  statusColor?: string;
  statusLabel?: string;
}

const TimelineNode: React.FC<Props> = ({ ativo, icone, titulo, subtitulos, statusColor, statusLabel }) => {
  return (
    <div style={{ display: 'flex', gap: 12, minHeight: 60, opacity: ativo ? 1 : 0.5 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: ativo ? '#164194' : '#A0A0A0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 16, filter: 'invert(1)' }}>{icone || '●'}</span>
        </div>
      </div>

      <div style={{ flex: 1, paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)' }}>{titulo}</span>
          {statusLabel && (
            <span
              style={{
                display: 'inline-block',
                borderRadius: 10,
                padding: '1px 8px',
                fontSize: 10,
                fontWeight: 600,
                backgroundColor: statusColor ? `${statusColor}20` : 'var(--app-color-border)',
                color: statusColor || '#666',
              }}
            >
              {statusLabel}
            </span>
          )}
        </div>
        {subtitulos.filter(Boolean).map((s, i) => (
          <div key={i} style={{ fontSize: 12, color: 'var(--ion-color-medium)', lineHeight: 1.5 }}>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineNode;
