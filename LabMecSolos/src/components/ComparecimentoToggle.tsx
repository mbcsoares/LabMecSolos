import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, closeCircleOutline, ellipseOutline } from 'ionicons/icons';
import type { ComparecimentoStatus } from '../models/types';

interface Props {
  status: ComparecimentoStatus | null;
  onChange?: (compareceu: boolean) => void;
  readonly?: boolean;
}

const ComparecimentoToggle: React.FC<Props> = ({ status, onChange, readonly }) => {
  if (readonly || status !== null) {
    if (status === 'compareceu') {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#009d43', fontSize: 13, fontWeight: 600 }}>
          <IonIcon icon={checkmarkCircleOutline} />
          Compareceu
        </span>
      );
    }
    if (status === 'nao_compareceu') {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#C0392B', fontSize: 13, fontWeight: 600 }}>
          <IonIcon icon={closeCircleOutline} />
          Não Compareceu
        </span>
      );
    }
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--ion-color-medium)', fontSize: 13 }}>
        <IonIcon icon={ellipseOutline} />
        Pendente
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => onChange?.(true)}
        style={{
          flex: 1,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #009d43',
          backgroundColor: 'var(--ion-background-color)',
          color: '#009d43',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Compareceu
      </button>
      <button
        onClick={() => onChange?.(false)}
        style={{
          flex: 1,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #C0392B',
          backgroundColor: 'var(--ion-background-color)',
          color: '#C0392B',
          fontWeight: 600,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Não Compareceu
      </button>
    </div>
  );
};

export default ComparecimentoToggle;
