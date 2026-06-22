import React from 'react';
import { IonIcon } from '@ionic/react';
import { warningOutline } from 'ionicons/icons';

interface Props {
  nomeEquipamento: string;
  diasVencido: number;
}

const CalibracaoAlert: React.FC<Props> = ({ nomeEquipamento, diasVencido }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 8,
        backgroundColor: '#E6A81720',
        border: '1px solid #E6A817',
        marginTop: 8,
      }}
    >
      <IonIcon icon={warningOutline} style={{ color: '#E6A817', fontSize: 18, flexShrink: 0 }} />
      <div style={{ fontSize: 12, color: '#B8860B', lineHeight: 1.4 }}>
        <strong>{nomeEquipamento}</strong> está com calibração vencida há {Math.abs(diasVencido)} {Math.abs(diasVencido) === 1 ? 'dia' : 'dias'}.
      </div>
    </div>
  );
};

export default CalibracaoAlert;
