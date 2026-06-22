import React from 'react';
import { IonIcon } from '@ionic/react';
import { createOutline, alertCircleOutline } from 'ionicons/icons';

interface Props {
  numero: number;
  tara: number;
  m1: number;
  m2: number;
  hCalculado: number | null;
  fcIndividual: number | null;
  tempoEstufa: number | null;
  observacao?: string | null;
  onCompletar?: () => void;
  onClick?: () => void;
}

const ehPendente = (hCalculado: number | null) => hCalculado === null;

const DeterminacaoCard: React.FC<Props> = ({ numero, tara, m1, m2, hCalculado, fcIndividual, tempoEstufa, observacao, onCompletar, onClick }) => {
  const pendente = ehPendente(hCalculado);

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 8,
        border: `2px solid ${pendente ? '#E6A817' : 'var(--app-color-border)'}`,
        padding: 12,
        marginBottom: 8,
        backgroundColor: pendente ? 'var(--app-alert-warning-bg)' : 'var(--ion-card-background)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-primary)' }}>
            Determinação #{numero}
          </span>
          {pendente && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
              backgroundColor: '#E6A81720', color: '#E6A817',
            }}>
              <IonIcon icon={alertCircleOutline} style={{ fontSize: 12, verticalAlign: 'middle', marginRight: 2 }} />
              Pendente
            </span>
          )}
        </div>
        {onCompletar && pendente && (
          <button
            onClick={onCompletar}
            style={{
              background: 'none',
              border: 'none',
              padding: 4,
              borderRadius: 4,
              color: 'var(--ion-color-medium)',
              cursor: 'pointer',
            }}
          >
            <IonIcon icon={createOutline} style={{ fontSize: 16 }} />
          </button>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginBottom: 6 }}>
        Tara: {tara.toFixed(2)}g &nbsp;|&nbsp; M1: {m1.toFixed(2)}g &nbsp;|&nbsp; M2: {pendente ? '—' : `${m2.toFixed(2)}g`}
      </div>

      {!pendente && hCalculado !== null && fcIndividual !== null && (
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ion-color-dark)' }}>
          h = {hCalculado.toFixed(2)}% &nbsp;|&nbsp; fc = {fcIndividual.toFixed(4)}
        </div>
      )}

      {tempoEstufa !== null && (
        <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', marginTop: 4 }}>
          Tempo estufa: {tempoEstufa}h
        </div>
      )}
    </div>
  );
};

export default DeterminacaoCard;
