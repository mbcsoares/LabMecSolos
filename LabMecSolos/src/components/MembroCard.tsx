import React from 'react';
import { IonIcon } from '@ionic/react';
import { personCircleOutline, arrowUpOutline, arrowDownOutline, closeCircleOutline } from 'ionicons/icons';
import PapelBadge from './PapelBadge';

const PAPEL_LABELS: Record<string, string> = {
  responsavel_principal: 'Responsável Principal',
  responsavel_secundario: 'Responsável Secundário',
  colaborador: 'Colaborador',
};

interface Props {
  id: string;
  nome: string;
  sobrenome: string;
  papel: string;
  onPromover?: (id: string) => void;
  onRebaixar?: (id: string) => void;
  onRemover?: (id: string) => void;
}

const MembroCard: React.FC<Props> = ({ id, nome, sobrenome, papel, onPromover, onRebaixar, onRemover }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid var(--app-color-border)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#E8EDF6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IonIcon icon={personCircleOutline} style={{ fontSize: 24, color: 'var(--ion-color-primary)' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ion-color-dark)' }}>
          {nome} {sobrenome}
        </div>
        <PapelBadge papel={papel} />
      </div>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {onPromover && papel === 'colaborador' && (
          <button
            onClick={() => onPromover(id)}
            style={{
              background: 'none',
              border: 'none',
              padding: 6,
              borderRadius: 6,
              color: '#B8860B',
              cursor: 'pointer',
            }}
            title="Promover a Responsável Secundário"
          >
            <IonIcon icon={arrowUpOutline} style={{ fontSize: 20 }} />
          </button>
        )}
        {onRebaixar && papel === 'responsavel_secundario' && (
          <button
            onClick={() => onRebaixar(id)}
            style={{
              background: 'none',
              border: 'none',
              padding: 6,
              borderRadius: 6,
              color: 'var(--app-color-attention)',
              cursor: 'pointer',
            }}
            title="Rebaixar a Colaborador"
          >
            <IonIcon icon={arrowDownOutline} style={{ fontSize: 20 }} />
          </button>
        )}
        {onRemover && papel !== 'responsavel_principal' && (
          <button
            onClick={() => onRemover(id)}
            style={{
              background: 'none',
              border: 'none',
              padding: 6,
              borderRadius: 6,
              color: 'var(--app-color-error)',
              cursor: 'pointer',
            }}
            title="Remover da equipe"
          >
            <IonIcon icon={closeCircleOutline} style={{ fontSize: 20 }} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MembroCard;
