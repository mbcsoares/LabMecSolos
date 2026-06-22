import React from 'react';

const BADGE_STYLES: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  responsavel_principal: { bg: '#E6A81720', text: '#B8860B', label: 'Principal', icon: '★' },
  responsavel_secundario: { bg: '#A0A0A020', text: '#707070', label: 'Secundário', icon: '☆' },
  colaborador: { bg: '#E8EDF6', text: '#164194', label: 'Colaborador', icon: '' },
};

interface Props {
  papel: string;
}

const PapelBadge: React.FC<Props> = ({ papel }) => {
  const style = BADGE_STYLES[papel] || BADGE_STYLES.colaborador;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 12,
        padding: '2px 10px',
        fontSize: 11,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.text,
        whiteSpace: 'nowrap',
      }}
    >
      {style.icon && <span style={{ fontSize: 13 }}>{style.icon}</span>}
      {style.label}
    </span>
  );
};

export default PapelBadge;
