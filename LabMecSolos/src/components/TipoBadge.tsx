import React from 'react';
import type { TipoItem } from '../models/types';

const tipoStyles: Record<TipoItem, { bg: string; text: string; label: string }> = {
  material: { bg: '#E8EDF6', text: '#164194', label: 'Material' },
  utensilio: { bg: '#E6F4EC', text: '#0c662f', label: 'Utensilio' },
  equipamento: { bg: '#F0E6F6', text: '#6B21A8', label: 'Equipamento' },
};

interface TipoBadgeProps {
  tipo: TipoItem;
}

const TipoBadge: React.FC<TipoBadgeProps> = ({ tipo }) => {
  const s = tipoStyles[tipo];

  return (
    <span style={{
      display: 'inline-block',
      borderRadius: 8,
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 500,
      backgroundColor: s.bg,
      color: s.text,
    }}>
      {s.label}
    </span>
  );
};

export default TipoBadge;
