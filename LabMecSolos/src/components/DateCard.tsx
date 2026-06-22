import React from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';

interface Props {
  data: string;
  horaInicio: string;
  horaFim: string;
  onHoraInicioChange?: (val: string) => void;
  onHoraFimChange?: (val: string) => void;
  onRemove?: () => void;
  readonly?: boolean;
}

const DateCard: React.FC<Props> = ({ data, horaInicio, horaFim, onHoraInicioChange, onHoraFimChange, onRemove, readonly }) => {
  const dataObj = new Date(data + 'T00:00:00');
  const formatada = dataObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div
      style={{
        borderRadius: 8,
        border: '1px solid var(--app-color-border)',
        padding: 10,
        marginBottom: 8,
        backgroundColor: 'var(--ion-card-background)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-dark)' }}>{formatada}</span>
        {onRemove && !readonly && (
          <button
            onClick={onRemove}
            style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--ion-color-medium)' }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: 18 }} />
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', marginBottom: 2 }}>Início</div>
          {readonly ? (
            <span style={{ fontSize: 14, fontWeight: 500 }}>{horaInicio}</span>
          ) : (
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => onHoraInicioChange?.(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid var(--app-color-border)',
                fontSize: 14,
                backgroundColor: 'var(--ion-background-color)',
              }}
            />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', marginBottom: 2 }}>Fim</div>
          {readonly ? (
            <span style={{ fontSize: 14, fontWeight: 500 }}>{horaFim}</span>
          ) : (
            <input
              type="time"
              value={horaFim}
              onChange={(e) => onHoraFimChange?.(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid var(--app-color-border)',
                fontSize: 14,
                backgroundColor: 'var(--ion-background-color)',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DateCard;
