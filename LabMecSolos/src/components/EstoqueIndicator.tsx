import React from 'react';
import { IonIcon } from '@ionic/react';
import { warningOutline, alertCircleOutline } from 'ionicons/icons';

interface EstoqueIndicatorProps {
  quantidade: number;
  pontoPedido: number | null;
  unidade: string;
}

const EstoqueIndicator: React.FC<EstoqueIndicatorProps> = ({ quantidade, pontoPedido, unidade }) => {
  const abaixoMinimo = pontoPedido !== null && quantidade <= pontoPedido;
  const zerado = quantidade <= 0;

  let color = 'var(--ion-color-dark)';
  let icon = null;

  if (zerado) {
    color = '#C0392B';
    icon = alertCircleOutline;
  } else if (abaixoMinimo) {
    color = '#E6A817';
    icon = warningOutline;
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color, fontSize: 13 }}>
      Estoque: {quantidade} {unidade}
      {icon && <IonIcon icon={icon} style={{ fontSize: 16 }} />}
    </span>
  );
};

export default EstoqueIndicator;
