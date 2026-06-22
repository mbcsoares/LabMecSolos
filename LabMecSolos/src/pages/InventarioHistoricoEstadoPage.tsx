import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonSpinner, IonIcon } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { timeOutline } from 'ionicons/icons';
import { InventarioService } from '../services/InventarioService';
import AppBar from '../components/AppBar';
import type { HistoricoEstadoEquipamento, ItemDetalhado } from '../models/types';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR') + ' ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const InventarioHistoricoEstadoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<ItemDetalhado | null>(null);
  const [historico, setHistorico] = useState<HistoricoEstadoEquipamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      InventarioService.obterItem(id),
      InventarioService.obterHistoricoEstado(id),
    ]).then(([it, hist]) => {
      setItem(it);
      setHistorico(hist);
      setLoading(false);
    });
  }, [id]);

  return (
    <IonPage>
      <AppBar title={item ? `Historico: ${item.nome}` : 'Historico de Estado'} />
      <IonContent>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : historico.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--ion-color-medium)' }}>
            <IonIcon icon={timeOutline} style={{ fontSize: 48, marginBottom: 12 }} />
            <p style={{ fontSize: 14, margin: 0 }}>Nenhuma alteracao de estado registrada.</p>
          </div>
        ) : (
          <IonList>
            {historico.map((h) => (
              <IonItem key={h.id}>
                <IonLabel>
                  <div style={{ fontSize: 13 }}>
                    {h.estado_anterior || '(inicial)'} &rarr; <strong>{h.estado_novo}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ion-color-medium)' }}>
                    {formatarData(h.data_alteracao)}
                    {h.observacao ? ` — ${h.observacao}` : ''}
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default InventarioHistoricoEstadoPage;
