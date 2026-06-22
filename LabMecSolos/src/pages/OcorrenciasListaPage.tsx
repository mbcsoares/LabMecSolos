import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonContent, IonCard, IonCardContent, IonIcon,
  IonFab, IonFabButton, IonInfiniteScroll, IonInfiniteScrollContent,
  IonChip, IonActionSheet, IonSpinner,
} from '@ionic/react';
import { add, flagOutline, chevronForwardOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { InventarioService } from '../services/InventarioService';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import type { OcorrenciaResumo, FiltrosOcorrencia, StatusOcorrencia, TipoOcorrencia } from '../models/types';

const FILTRO_STATUS: { label: string; value: StatusOcorrencia | undefined }[] = [
  { label: 'Todas', value: undefined },
  { label: 'Abertas', value: 'aberta' },
  { label: 'Em Analise', value: 'em_analise' },
  { label: 'Resolvidas', value: 'resolvida' },
  { label: 'Fechadas', value: 'fechada' },
];

const FILTRO_TIPO: { label: string; value: TipoOcorrencia | undefined }[] = [
  { label: 'Todos', value: undefined },
  { label: 'Quebra', value: 'quebra' },
  { label: 'Estoque Insuficiente', value: 'estoque_insuficiente' },
  { label: 'Mal Funcionamento', value: 'mal_funcionamento' },
  { label: 'Validade Expirada', value: 'validade_expirada' },
  { label: 'Outro', value: 'outro' },
];

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

const OcorrenciasListaPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { usuario } = useAuth();
  const isColaborador = usuario?.permissao === 'colaborador' || usuario?.permissao === 'chefia';
  const verTodas = new URLSearchParams(location.search).get('todas') === 'true';
  const apenasProprias = verTodas ? false : !isColaborador;

  const [ocorrencias, setOcorrencias] = useState<OcorrenciaResumo[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosOcorrencia>({});
  const [actionSheet, setActionSheet] = useState('');
  const [tipoFiltroSel, setTipoFiltroSel] = useState('');

  const carregar = useCallback(async (p: number, reset: boolean) => {
    setLoading(true);
    const result = await InventarioService.listarOcorrencias(filtros, p, usuario?.userId, apenasProprias);
    if (reset) setOcorrencias(result.ocorrencias);
    else setOcorrencias((prev) => [...prev, ...result.ocorrencias]);
    setTotal(result.total);
    setPagina(p);
    setLoading(false);
  }, [filtros, usuario, isColaborador]);

  useEffect(() => { carregar(1, true); }, [filtros]);

  const handleInfinite = async (ev: CustomEvent<void>) => {
    await carregar(pagina + 1, false);
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  const tipoLabel = (t: string) => {
    const map: Record<string, string> = {
      quebra: 'Quebra', estoque_insuficiente: 'Estoque Insuficiente',
      mal_funcionamento: 'Mal Funcionamento', validade_expirada: 'Validade Expirada', outro: 'Outro',
    };
    return map[t] || t;
  };

  const statusBadgeStatus = (s: string) => {
    if (s === 'aberta') return 'error' as const;
    if (s === 'em_analise') return 'warning' as const;
    if (s === 'resolvida') return 'success' as const;
    return 'neutral' as const;
  };

  return (
    <IonPage>
      <AppBar title="Ocorrencias" />
      <IonContent>
        <div style={{ display: 'flex', gap: 6, padding: '8px 16px 0', overflowX: 'auto' }}>
          <IonChip onClick={() => setActionSheet('status')} color={filtros.status ? 'primary' : 'medium'} outline={!filtros.status} style={{ flexShrink: 0, fontSize: 12 }}>
            {filtros.status ? FILTRO_STATUS.find((o) => o.value === filtros.status)?.label : 'Status'}
          </IonChip>
          <IonChip onClick={() => setTipoFiltroSel('tipo')} color={filtros.tipo ? 'primary' : 'medium'} outline={!filtros.tipo} style={{ flexShrink: 0, fontSize: 12 }}>
            {filtros.tipo ? FILTRO_TIPO.find((o) => o.value === filtros.tipo)?.label : 'Tipo'}
          </IonChip>
        </div>

        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', padding: '4px 16px 8px' }}>
          {total} ocorrencias encontradas
        </div>

        {loading && ocorrencias.length === 0 ? (
          <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : ocorrencias.length === 0 ? (
          <EmptyState icon={flagOutline} title="Nenhuma ocorrencia encontrada." actionLabel="Nova Ocorrencia" onAction={() => history.push('/app/inventario/ocorrencias/nova')} />
        ) : (
          <>
            {ocorrencias.map((o) => (
              <IonCard key={o.id} style={{ borderRadius: 12, margin: '8px 16px' }} onClick={() => history.push(`/app/inventario/ocorrencia/${o.id}`)}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <StatusBadge status={statusBadgeStatus(o.status)} label={o.status === 'em_analise' ? 'Em Analise' : o.status.charAt(0).toUpperCase() + o.status.slice(1)} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ion-color-dark)' }}>{o.titulo}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <span style={{ color: 'var(--ion-color-primary)', fontWeight: 500 }}>{tipoLabel(o.tipo)}</span>
                        <span style={{ color: 'var(--ion-color-medium)' }}>&middot;</span>
                        <span style={{ color: 'var(--ion-color-medium)' }}>{formatarData(o.data_abertura)}</span>
                        {o.nome_item && <><span style={{ color: 'var(--ion-color-medium)' }}>&middot;</span><span style={{ color: 'var(--ion-color-medium)' }}>{o.nome_item}</span></>}
                      </div>
                    </div>
                    <IonIcon icon={chevronForwardOutline} color="medium" style={{ fontSize: 18, marginTop: 4 }} />
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </>
        )}

        {ocorrencias.length < total && (
          <IonInfiniteScroll onIonInfinite={handleInfinite} threshold="200px">
            <IonInfiniteScrollContent loadingText="Carregando..." />
          </IonInfiniteScroll>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/app/inventario/ocorrencias/nova')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonActionSheet
          isOpen={actionSheet === 'status'}
          onDidDismiss={() => setActionSheet('')}
          header="Status"
          buttons={FILTRO_STATUS.map((o) => ({
            text: o.label,
            handler: () => setFiltros((prev) => ({ ...prev, status: o.value })),
          }))}
        />
        <IonActionSheet
          isOpen={tipoFiltroSel === 'tipo'}
          onDidDismiss={() => setTipoFiltroSel('')}
          header="Tipo"
          buttons={FILTRO_TIPO.map((o) => ({
            text: o.label,
            handler: () => setFiltros((prev) => ({ ...prev, tipo: o.value })),
          }))}
        />
      </IonContent>
    </IonPage>
  );
};

export default OcorrenciasListaPage;
