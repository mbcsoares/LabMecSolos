import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSpinner,
} from '@ionic/react';
import {
  notificationsOutline,
  warningOutline,
  alertCircleOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import AppBar from '../components/AppBar';
import EmptyState from '../components/EmptyState';
import { LogService } from '../services/LogService';
import { useAuth } from '../contexts/AuthContext';
import { Preferences } from '@capacitor/preferences';
import type { LogSistema } from '../models/types';

const ICONE_POR_GRAVIDADE: Record<string, string> = {
  critical: alertCircleOutline,
  warning: warningOutline,
  info: informationCircleOutline,
};

const COR_POR_GRAVIDADE: Record<string, string> = {
  critical: '#C0392B',
  warning: '#E6A817',
  info: '#0095DB',
};

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function extrairMensagem(log: LogSistema): string {
  try {
    if (log.detalhes) {
      const detalhes = JSON.parse(log.detalhes);
      if (detalhes.mensagem) return detalhes.mensagem;
      if (detalhes.tipo) return `Notificacao: ${detalhes.tipo}`;
    }
  } catch { /* fallthrough */ }
  return log.acao.replace(/^notificacao_/, '').replace(/_/g, ' ');
}

function extrairGravidade(log: LogSistema): string {
  try {
    if (log.detalhes) {
      const detalhes = JSON.parse(log.detalhes);
      if (detalhes.gravidade) return detalhes.gravidade;
    }
  } catch { /* fallthrough */ }
  return 'info';
}

const NotificacoesPage: React.FC = () => {
  const { usuario } = useAuth();
  const [logs, setLogs] = useState<LogSistema[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async (p: number, reset: boolean) => {
    setLoading(true);
    try {
      const p2 = usuario?.permissao;
      let excluidos: string[] = [];
      if (p2 === 'comum') excluidos = ['estoque', 'sistema', 'agendamento'];
      else if (p2 === 'colaborador') excluidos = ['sistema'];
      const result = await LogService.listarNotificacoes(p, 20, excluidos);
      if (reset) {
        setLogs(result.logs);
      } else {
        setLogs((prev) => [...prev, ...result.logs]);
      }
      setTotal(result.total);
      setPagina(p);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregar(1, true);
    Preferences.set({ key: 'ultima_leitura_notificacoes', value: new Date().toISOString() });
  }, [carregar]);

  const handleInfinite = async (ev: CustomEvent<void>) => {
    await carregar(pagina + 1, false);
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  return (
    <IonPage>
      <AppBar title="Notificacoes" />
      <IonContent>
        {loading && logs.length === 0 ? (
          <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={notificationsOutline} title="Nenhuma notificacao recente." />
        ) : (
          <>
            {logs.map((log) => {
              const gravidade = extrairGravidade(log);
              return (
                <IonCard key={log.id} style={{ borderRadius: 12, margin: '8px 16px' }}>
                  <IonCardContent style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <IonIcon
                        icon={ICONE_POR_GRAVIDADE[gravidade] || informationCircleOutline}
                        style={{ fontSize: 22, color: COR_POR_GRAVIDADE[gravidade] || '#0095DB', flexShrink: 0, marginTop: 2 }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 13, color: 'var(--ion-color-dark)' }}>
                          {extrairMensagem(log)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--ion-color-medium)' }}>
                          {formatarData(log.data_criacao)}
                        </span>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              );
            })}
          </>
        )}

        {logs.length < total && (
          <IonInfiniteScroll onIonInfinite={handleInfinite} threshold="200px">
            <IonInfiniteScrollContent loadingText="Carregando..." />
          </IonInfiniteScroll>
        )}
      </IonContent>
    </IonPage>
  );
};

export default NotificacoesPage;
