import React, { useState, useEffect } from 'react';
import { IonItem, IonLabel, IonIcon, IonSpinner } from '@ionic/react';
import { flaskOutline } from 'ionicons/icons';
import { AmostragemService } from '../services/AmostragemService';
import type { AmostraEnsaiada } from '../models/types';

interface Props {
  tipoEnsaio: string;
  onSelect: (amostra: AmostraEnsaiada) => void;
}

const AmostraSearchSelect: React.FC<Props> = ({ tipoEnsaio, onSelect }) => {
  const [amostras, setAmostras] = useState<AmostraEnsaiada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const result = await AmostragemService.listarAmostrasEnsaiadas('');
        if (!cancelled) {
          const filtradas = result.filter((a) => a.tipo_ensaio_destino === tipoEnsaio);
          setAmostras(filtradas);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [tipoEnsaio]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
        <IonSpinner name="crescent" color="primary" />
      </div>
    );
  }

  if (amostras.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 16 }}>
        <IonIcon icon={flaskOutline} style={{ fontSize: 32, color: 'var(--ion-color-medium)', marginBottom: 8 }} />
        <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: 0 }}>
          Nenhuma amostra disponível para este tipo de ensaio.
        </p>
      </div>
    );
  }

  return (
    <div>
      {amostras.map((a) => (
        <IonItem key={a.id} button onClick={() => onSelect(a)} detail>
          <IonLabel>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{a.numero_amostra}</div>
            <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
              {a.tipo_ensaio_destino} — Qtd: {a.quantidade_inicial}
            </div>
          </IonLabel>
        </IonItem>
      ))}
    </div>
  );
};

export default AmostraSearchSelect;
