import React from 'react';
import { IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';

interface Props {
  finalizado: number;
}

const FinalizacaoPendente: React.FC<Props> = ({ finalizado }) => {
  if (finalizado !== 0) return null;

  return (
    <IonCard style={{ borderRadius: 12, marginBottom: 12, background: 'var(--app-alert-info-bg)', border: '1px solid var(--app-color-border)' }}>
      <IonCardContent style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <IonIcon icon={alertCircleOutline} style={{ fontSize: 20, flexShrink: 0, marginTop: 1, color: '#856404' }} />
          <div style={{ color: '#856404' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Dados pendentes de finalização</div>
            <div style={{ fontSize: 12, marginTop: 2, opacity: 0.85 }}>
              Finalize o preenchimento para habilitar os próximos passos do fluxo.
            </div>
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default FinalizacaoPendente;
