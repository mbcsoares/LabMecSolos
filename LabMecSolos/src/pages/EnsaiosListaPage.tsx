import React, { useState, useEffect, useCallback } from 'react';
import { IonPage, IonContent, IonChip, IonCard, IonCardContent, IonIcon, IonSpinner, IonFab, IonFabButton, IonToast } from '@ionic/react';
import { addOutline, flaskOutline, chevronForwardOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { EnsaioBaseService } from '../services/EnsaioBaseService';
import { useAuth } from '../contexts/AuthContext';
import type { EnsaioDetalhado } from '../models/types';

const STATUS_BADGE: Record<string, { status: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
  nao_iniciado: { status: 'neutral', label: 'Não Iniciado' },
  em_andamento: { status: 'info', label: 'Em Andamento' },
  concluido: { status: 'success', label: 'Concluído' },
  cancelado: { status: 'error', label: 'Cancelado' },
};

const TIPO_LABELS: Record<string, string> = {
  teor_umidade: 'Teor de Umidade',
  granulometria: 'Granulometria',
  compactacao: 'Compactação',
  limite_liquidez: 'Limite de Liquidez',
  limite_plasticidade: 'Limite de Plasticidade',
  cisalhamento_direto: 'Cisalhamento Direto',
  adensamento: 'Adensamento',
  triaxial: 'Triaxial',
};

const EnsaiosListaPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const [ensaios, setEnsaios] = useState<EnsaioDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setLoading(true);
    try {
      const result = await EnsaioBaseService.listarPorUsuario(usuario.userId);
      setEnsaios(result);
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao carregar ensaios.');
      setShowToast(true);
    }
    setLoading(false);
  }, [usuario]);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = ensaios.filter((e) => {
    if (filtroStatus && e.status !== filtroStatus) return false;
    if (filtroTipo && e.tipo_ensaio !== filtroTipo) return false;
    return true;
  });

  const tiposUnicos = [...new Set(ensaios.map((e) => e.tipo_ensaio))];

  return (
    <IonPage>
      <AppBar title="Ensaios" />
      <IonContent>
        <div style={{ display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto', flexWrap: 'nowrap' }}>
          {[{ label: 'Todos', value: '' }, { label: 'Não Iniciado', value: 'nao_iniciado' }, { label: 'Em Andamento', value: 'em_andamento' }, { label: 'Concluído', value: 'concluido' }, { label: 'Cancelado', value: 'cancelado' }].map((op) => (
            <IonChip key={op.value} color={filtroStatus === op.value ? 'primary' : 'medium'} outline={filtroStatus !== op.value} onClick={() => setFiltroStatus(op.value)} style={{ flexShrink: 0 }}>{op.label}</IonChip>
          ))}
        </div>

        {tiposUnicos.length > 0 && (
          <div style={{ display: 'flex', gap: 6, padding: '0 16px 8px', overflowX: 'auto', flexWrap: 'nowrap' }}>
            <IonChip color={filtroTipo === '' ? 'primary' : 'medium'} outline={filtroTipo !== ''} onClick={() => setFiltroTipo('')} style={{ flexShrink: 0 }}>Todos os tipos</IonChip>
            {tiposUnicos.map((t) => (
              <IonChip key={t} color={filtroTipo === t ? 'primary' : 'medium'} outline={filtroTipo !== t} onClick={() => setFiltroTipo(t)} style={{ flexShrink: 0 }}>{TIPO_LABELS[t] || t}</IonChip>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : filtrados.length === 0 ? (
          <EmptyState icon={flaskOutline} title="Nenhum ensaio encontrado." actionLabel="Criar Ensaio" onAction={() => history.push('/app/novo-ensaio')} />
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', padding: '0 16px 8px' }}>{filtrados.length} ensaio{filtrados.length !== 1 ? 's' : ''}</div>
            {filtrados.map((e) => {
              const badge = STATUS_BADGE[e.status] || { status: 'neutral' as const, label: e.status };
              return (
                <IonCard key={e.id} style={{ borderRadius: 12, margin: '8px 16px' }} onClick={() => history.push(`/app/ensaios/${e.id}`)}>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)' }}>{TIPO_LABELS[e.tipo_ensaio] || e.tipo_ensaio}</span>
                          <StatusBadge status={badge.status} label={badge.label} />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                          {e.nome_executante || '—'} &nbsp;·&nbsp; {new Date(e.data_criacao).toLocaleDateString('pt-BR')}
                        </div>
                        {e.h_medio !== undefined && e.h_medio !== null && (
                          <div style={{ fontSize: 12, color: 'var(--ion-color-success)' }}>h_médio: {e.h_medio.toFixed(2)}%</div>
                        )}
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
          <IonFabButton onClick={() => history.push('/app/novo-ensaio')}><IonIcon icon={addOutline} /></IonFabButton>
        </IonFab>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default EnsaiosListaPage;
