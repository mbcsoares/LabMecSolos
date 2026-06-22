import React, { useState, useEffect, useCallback } from 'react';
import { IonPage, IonContent, IonSearchbar, IonChip, IonCard, IonCardContent, IonIcon, IonSpinner, IonFab, IonFabButton, IonToast } from '@ionic/react';
import { addOutline, flaskOutline, chevronForwardOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import PapelBadge from '../components/PapelBadge';
import EmptyState from '../components/EmptyState';
import { PesquisaService } from '../services/PesquisaService';
import { useAuth } from '../contexts/AuthContext';
import type { PesquisaResumo } from '../models/types';

const STATUS_OPCOES = [
  { label: 'Todas', value: '' },
  { label: 'Em Andamento', value: 'em_andamento' },
  { label: 'Concluídas', value: 'concluida' },
  { label: 'Canceladas', value: 'cancelada' },
];

const STATUS_BADGE: Record<string, { status: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
  em_andamento: { status: 'info', label: 'Em Andamento' },
  concluida: { status: 'success', label: 'Concluída' },
  cancelada: { status: 'neutral', label: 'Cancelada' },
};

const PesquisasListaPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const [pesquisas, setPesquisas] = useState<PesquisaResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const result = await PesquisaService.listarPorUsuario(usuario?.userId || '');
      setPesquisas(result);
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao carregar pesquisas.');
      setShowToast(true);
    }
    setLoading(false);
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtradas = pesquisas.filter((p) => {
    const matchBusca = !busca || p.titulo.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = !filtroStatus || p.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const STATUS_CHIP_COLORS: Record<string, string> = {
    em_andamento: 'primary',
    concluida: 'success',
    cancelada: 'medium',
  };

  return (
    <IonPage>
      <AppBar title="Minhas Pesquisas" />
      <IonContent>
        <IonSearchbar
          value={busca}
          onIonInput={(e) => setBusca(e.detail.value || '')}
          debounce={300}
          placeholder="Buscar por título"
        />

        <div style={{ display: 'flex', gap: 6, padding: '0 16px 8px', overflowX: 'auto', flexWrap: 'nowrap' }}>
          {STATUS_OPCOES.map((op) => (
            <IonChip
              key={op.value}
              color={filtroStatus === op.value ? 'primary' : 'medium'}
              outline={filtroStatus !== op.value}
              onClick={() => setFiltroStatus(op.value)}
              style={{ flexShrink: 0 }}
            >
              {op.label}
            </IonChip>
          ))}
        </div>

        {loading && pesquisas.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : filtradas.length === 0 ? (
          <EmptyState
            icon={flaskOutline}
            title={busca || filtroStatus ? 'Nenhuma pesquisa encontrada com os filtros atuais.' : 'Nenhuma pesquisa encontrada.'}
            actionLabel={!busca && !filtroStatus ? 'Criar Pesquisa' : undefined}
            onAction={!busca && !filtroStatus ? () => history.push('/app/nova-pesquisa') : undefined}
          />
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', padding: '0 16px 8px' }}>
              {filtradas.length} pesquisa{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
            </div>
            {filtradas.map((p) => {
              const badge = STATUS_BADGE[p.status] || { status: 'neutral' as const, label: p.status };
              return (
                <IonCard key={p.id} style={{ borderRadius: 12, margin: '8px 16px' }} onClick={() => history.push(`/app/ensaios/pesquisa/${p.id}`)}>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ion-color-dark)' }}>{p.titulo}</span>
                          <StatusBadge status={badge.status} label={badge.label} />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginBottom: 4 }}>
                          {p.contexto} &nbsp;·&nbsp; {new Date(p.data_criacao).toLocaleDateString('pt-BR')}
                        </div>
                        {p.meu_papel && <PapelBadge papel={p.meu_papel} />}
                      </div>
                      <IonIcon icon={chevronForwardOutline} color="medium" style={{ fontSize: 18, marginTop: 4 }} />
                    </div>
                  </IonCardContent>
                </IonCard>
              );
            })}
          </>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/app/nova-pesquisa')}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default PesquisasListaPage;
