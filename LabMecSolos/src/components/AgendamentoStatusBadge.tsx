import React from 'react';
import type { StatusAgendamento } from '../models/types';

interface Props {
  status: StatusAgendamento;
}

const STATUS_MAP: Record<StatusAgendamento, { color: string; label: string }> = {
  solicitado: { color: '#0095DB', label: 'Solicitado' },
  aprovado: { color: '#009d43', label: 'Aprovado' },
  negado: { color: '#C0392B', label: 'Negado' },
  cancelado: { color: '#898888', label: 'Cancelado' },
  finalizado: { color: '#6C3483', label: 'Finalizado' },
};

const AgendamentoStatusBadge: React.FC<Props> = ({ status }) => {
  const cfg = STATUS_MAP[status] || { color: '#898888', label: status };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 12,
        padding: '2px 8px',
        height: 24,
        fontSize: 11,
        fontWeight: 500,
        textTransform: 'uppercase',
        backgroundColor: cfg.color,
        color: '#FFFFFF',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
};

export default AgendamentoStatusBadge;
