import React, { useState, useEffect, useCallback } from 'react';
import { IonPage, IonContent, IonSearchbar, IonChip, IonCard, IonCardContent, IonIcon, IonSpinner, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { cubeOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { queryRows } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';

const STATUS_BADGE: Record<string, { status: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
  coletada: { status: 'info', label: 'Coletada' },
  preparada: { status: 'warning', label: 'Preparada' },
  ensaiada: { status: 'success', label: 'Ensaiada' },
  descartada: { status: 'neutral', label: 'Descartada' },
};

interface AmostraUnificada {
  id: string;
  numero_identificacao_campo: string;
  tipo_amostra: string;
  status: string;
  data_coleta: string;
  descricao: string | null;
  pesquisa_titulo: string;
  ponto_identificacao: string;
}

const AmostrasListaUnificadaPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const [amostras, setAmostras] = useState<AmostraUnificada[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setLoading(true);
    try {
      const rows = await queryRows<AmostraUnificada>(
        `SELECT DISTINCT ab.id, ab.numero_identificacao_campo, ab.tipo_amostra, ab.status, ab.data_coleta, ab.descricao,
          pesq.titulo AS pesquisa_titulo, pt.identificacao_plano AS ponto_identificacao
        FROM amostras_brutas ab
        INNER JOIN pontos_coleta pt ON ab.id_ponto_coleta = pt.id
        INNER JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id
        INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id
        LEFT JOIN pesquisa_colaboradores pc ON pesq.id = pc.id_pesquisa AND pc.id_usuario = ?
        WHERE pesq.id_responsavel = ? OR pc.id_usuario = ?
        ORDER BY ab.data_coleta DESC`,
        [usuario.userId, usuario.userId, usuario.userId]
      );
      setAmostras(rows);
    } catch {
      setToastMsg('Erro ao carregar amostras.');
      setShowToast(true);
    }
    setLoading(false);
  }, [usuario]);

  useEffect(() => { carregar(); }, [carregar]);

  const filtradas = amostras.filter((a) => {
    if (filtroTipo && a.tipo_amostra !== filtroTipo) return false;
    if (filtroStatus && a.status !== filtroStatus) return false;
    if (busca) {
      const termo = busca.toLowerCase();
      return (
        a.numero_identificacao_campo.toLowerCase().includes(termo) ||
        (a.descricao && a.descricao.toLowerCase().includes(termo)) ||
        a.pesquisa_titulo.toLowerCase().includes(termo) ||
        a.ponto_identificacao.toLowerCase().includes(termo)
      );
    }
    return true;
  });

  return (
    <IonPage>
      <AppBar title="Minhas Amostras" />
      <IonContent>
        <IonSearchbar
          value={busca}
          onIonInput={(e) => setBusca(e.detail.value || '')}
          debounce={300}
          placeholder="Buscar por número, descrição ou pesquisa"
        />

        <div style={{ display: 'flex', gap: 6, padding: '0 16px 8px', overflowX: 'auto', flexWrap: 'nowrap' }}>
          {[
            { label: 'Todas', tipo: '' },
            { label: 'Deformada', tipo: 'deformada' },
            { label: 'Indeformada', tipo: 'indeformada' },
          ].map((op) => (
            <IonChip key={op.tipo} color={filtroTipo === op.tipo ? 'primary' : 'medium'} outline={filtroTipo !== op.tipo} onClick={() => setFiltroTipo(op.tipo)} style={{ flexShrink: 0 }}>
              {op.label}
            </IonChip>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, padding: '0 16px 8px', overflowX: 'auto', flexWrap: 'nowrap' }}>
          {[
            { label: 'Todos', status: '' },
            { label: 'Coletada', status: 'coletada' },
            { label: 'Preparada', status: 'preparada' },
            { label: 'Ensaiada', status: 'ensaiada' },
            { label: 'Descartada', status: 'descartada' },
          ].map((op) => (
            <IonChip key={op.status} color={filtroStatus === op.status ? 'primary' : 'medium'} outline={filtroStatus !== op.status} onClick={() => setFiltroStatus(op.status)} style={{ flexShrink: 0 }}>
              {op.label}
            </IonChip>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : filtradas.length === 0 ? (
          <EmptyState
            icon={cubeOutline}
            title={busca || filtroTipo || filtroStatus ? 'Nenhuma amostra encontrada com os filtros atuais.' : 'Nenhuma amostra vinculada às suas pesquisas.'}
          />
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', padding: '0 16px 8px' }}>
              {filtradas.length} amostra{filtradas.length !== 1 ? 's' : ''}
            </div>
            {filtradas.map((a) => {
              const badge = STATUS_BADGE[a.status] || { status: 'neutral' as const, label: a.status };
              return (
                <IonCard key={a.id} style={{ borderRadius: 12, margin: '8px 16px' }} onClick={() => history.push(`/app/ensaios/amostra/${a.id}`)}>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ion-color-dark)' }}>{a.numero_identificacao_campo}</span>
                      <StatusBadge status={badge.status} label={badge.label} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 4 }}>
                      {a.tipo_amostra === 'deformada' ? 'Deformada' : 'Indeformada'} &nbsp;·&nbsp; {a.pesquisa_titulo}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', marginTop: 2 }}>
                      Ponto: {a.ponto_identificacao} &nbsp;·&nbsp; {new Date(a.data_coleta).toLocaleDateString('pt-BR')}
                    </div>
                  </IonCardContent>
                </IonCard>
              );
            })}
          </>
        )}
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default AmostrasListaUnificadaPage;
