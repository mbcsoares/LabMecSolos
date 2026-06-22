import React, { useState } from 'react';
import { IonChip, IonItem, IonLabel, IonInput } from '@ionic/react';
import { PeriodoService } from '../services/PeriodoService';
import type { PeriodoPreset, PeriodoFiltro } from '../models/types';

interface Props {
  value: PeriodoFiltro;
  onChange: (filtro: PeriodoFiltro) => void;
}

const PRESETS: { label: string; value: PeriodoPreset }[] = [
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: '90 dias', value: '90d' },
  { label: 'Este mês', value: 'este_mes' },
  { label: 'Este semestre', value: 'este_semestre' },
  { label: 'Este ano', value: 'este_ano' },
  { label: 'Personalizado', value: 'personalizado' },
];

const PeriodoFilter: React.FC<Props> = ({ value, onChange }) => {
  const [showCustom, setShowCustom] = useState(value.preset === 'personalizado');
  const [iniCustom, setIniCustom] = useState(value.dataInicio);
  const [fimCustom, setFimCustom] = useState(value.dataFim);

  const handlePreset = (preset: PeriodoPreset) => {
    if (preset === 'personalizado') {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    onChange(PeriodoService.resolverPreset(preset));
  };

  const handleCustomApply = () => {
    if (iniCustom && fimCustom) {
      onChange(PeriodoService.resolverPreset('personalizado', iniCustom, fimCustom));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto', flexWrap: 'nowrap' }}>
        {PRESETS.map((p) => (
          <IonChip
            key={p.value}
            color={value.preset === p.value && !showCustom ? 'primary' : 'medium'}
            outline={value.preset !== p.value}
            onClick={() => handlePreset(p.value)}
            style={{ flexShrink: 0 }}
          >
            {p.label}
          </IonChip>
        ))}
      </div>
      {showCustom && (
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <IonItem style={{ flex: 1 }} lines="none">
            <IonLabel position="stacked"><small>Início</small></IonLabel>
            <IonInput type="date" value={iniCustom} onIonInput={(e) => setIniCustom(e.detail.value || '')} onIonBlur={handleCustomApply} />
          </IonItem>
          <IonItem style={{ flex: 1 }} lines="none">
            <IonLabel position="stacked"><small>Fim</small></IonLabel>
            <IonInput type="date" value={fimCustom} onIonInput={(e) => setFimCustom(e.detail.value || '')} onIonBlur={handleCustomApply} />
          </IonItem>
        </div>
      )}
    </div>
  );
};

export default PeriodoFilter;
