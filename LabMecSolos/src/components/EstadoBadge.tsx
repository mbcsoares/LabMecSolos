import React from 'react';
import type { EstadoEquipamento } from '../models/types';

const estadoStyles: Record<EstadoEquipamento, { cor: string; label: string }> = {
  disponivel: { cor: '#009d43', label: 'Disponivel' },
  em_manutencao: { cor: '#0095DB', label: 'Em Manutencao' },
  inoperante: { cor: '#C0392B', label: 'Inoperante' },
  calibracao_vencida: { cor: '#E6A817', label: 'Calibracao Vencida' },
};

interface EstadoBadgeProps {
  estado: EstadoEquipamento;
}

const EstadoBadge: React.FC<EstadoBadgeProps> = ({ estado }) => {
  const s = estadoStyles[estado];

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
      <span style={{
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: s.cor, display: 'inline-block', flexShrink: 0,
      }} />
      <span style={{ color: 'var(--ion-color-dark)' }}>{s.label}</span>
    </span>
  );
};

export default EstadoBadge;
