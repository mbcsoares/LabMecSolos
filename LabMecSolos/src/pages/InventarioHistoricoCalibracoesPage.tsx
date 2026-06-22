import React, { useState, useEffect, useCallback } from 'react';
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonSpinner, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { timeOutline, checkmarkCircleOutline, personOutline, businessOutline, ribbonOutline } from 'ionicons/icons';
import { InventarioService } from '../services/InventarioService';
import AppBar from '../components/AppBar';
import type { ItemDetalhado } from '../models/types';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR') + ' ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const InventarioHistoricoCalibracoesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<ItemDetalhado | null>(null);
  const [calibracoes, setCalibracoes] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    InventarioService.obterItem(id).then(setItem);
  }, [id]);

  const carregar = useCallback(async (p: number, reset: boolean) => {
    setLoading(true);
    const result = await InventarioService.listarHistoricoCalibracoes(id, p);
    if (reset) setCalibracoes(result.calibracoes);
    else setCalibracoes((prev) => [...prev, ...result.calibracoes]);
    setTotal(result.total);
    setPagina(p);
    setLoading(false);
  }, [id]);

  useEffect(() => { carregar(1, true); }, []);

  const handleInfinite = async (ev: CustomEvent<void>) => {
    await carregar(pagina + 1, false);
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  const parseDados = (row: Record<string, unknown>) => {
    return (row._dados as Record<string, unknown>) || {};
  };

  return (
    <IonPage>
      <AppBar title={item ? `Calibracoes: ${item.nome}` : 'Historico de Calibracoes'} />
      <IonContent>
        {loading && calibracoes.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : calibracoes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--ion-color-medium)' }}>
            <IonIcon icon={timeOutline} style={{ fontSize: 48, marginBottom: 12 }} />
            <p style={{ fontSize: 14, margin: 0 }}>Nenhuma calibracao registrada.</p>
          </div>
        ) : (
          <IonList>
            {calibracoes.map((c, i) => {
              const d = parseDados(c);
              const isManual = d.recalibrado === true;
              return (
                <IonItem key={c.id as string || i}>
                  <IonIcon slot="start" icon={checkmarkCircleOutline} style={{ color: isManual ? '#009d43' : 'var(--ion-color-medium)', fontSize: 22 }} />
                  <IonLabel>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-dark)', marginBottom: 2 }}>
                      {isManual ? 'Calibracao Registrada' : 'Verificacao Automatica'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', marginBottom: 4 }}>
                      {formatarData(c.data_criacao as string)}
                    </div>
                    {isManual && (
                      <>
                        {d.profissional && (
                          <div style={{ fontSize: 12, color: 'var(--ion-color-dark)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IonIcon icon={personOutline} style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} />
                            {d.profissional as string}
                          </div>
                        )}
                        {d.empresa && (
                          <div style={{ fontSize: 12, color: 'var(--ion-color-dark)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IonIcon icon={businessOutline} style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} />
                            {d.empresa as string}
                          </div>
                        )}
                        {d.certificado && (
                          <div style={{ fontSize: 12, color: 'var(--ion-color-dark)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <IonIcon icon={ribbonOutline} style={{ fontSize: 14, color: 'var(--ion-color-medium)' }} />
                            Certificado: {d.certificado as string}
                          </div>
                        )}
                        {d.frequencia_dias && (
                          <div style={{ fontSize: 11, color: 'var(--ion-color-primary)', marginTop: 2 }}>
                            Validade: {d.frequencia_dias as number} dias
                          </div>
                        )}
                      </>
                    )}
                  </IonLabel>
                </IonItem>
              );
            })}
          </IonList>
        )}

        {calibracoes.length < total && (
          <IonInfiniteScroll onIonInfinite={handleInfinite} threshold="200px">
            <IonInfiniteScrollContent loadingText="Carregando..." />
          </IonInfiniteScroll>
        )}
      </IonContent>
    </IonPage>
  );
};

export default InventarioHistoricoCalibracoesPage;
