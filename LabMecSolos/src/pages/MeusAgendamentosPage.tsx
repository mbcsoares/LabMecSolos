import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonChip, IonCard, IonCardContent, IonIcon, IonSpinner, IonFab, IonFabButton, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { addOutline, calendarOutline, chevronForwardOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import AgendamentoStatusBadge from '../components/AgendamentoStatusBadge';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { queryRows } from '../services/DatabaseService';
import type { StatusAgendamento } from '../models/types';

const STATUS_OPCOES: { label: string; value: string }[] = [
  { label: 'Todos', value: '' },
  { label: 'Solicitado', value: 'solicitado' },
  { label: 'Aprovado', value: 'aprovado' },
  { label: 'Negado', value: 'negado' },
  { label: 'Cancelado', value: 'cancelado' },
  { label: 'Finalizado', value: 'finalizado' },
];

interface AgendamentoResumo {
  id: string;
  objetivo: string;
  pesquisa_titulo: string;
  status: StatusAgendamento;
  data_solicitacao: string;
  primeira_data: string;
  total_datas: number;
}

const MeusAgendamentosPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const [agendamentos, setAgendamentos] = useState<AgendamentoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const carregar = async () => {
    if (!usuario) return;
    setLoading(true);
    try {
      const rows = await queryRows<AgendamentoResumo>(
        `SELECT a.*, p.titulo AS pesquisa_titulo, MIN(ad.data_agendada) AS primeira_data, COUNT(ad.id) AS total_datas
         FROM agendamentos a
         INNER JOIN pesquisas p ON a.id_pesquisa = p.id
         LEFT JOIN agendamento_datas ad ON a.id = ad.id_agendamento
         WHERE a.id_usuario_solicitante = ?
         GROUP BY a.id
         ORDER BY a.data_solicitacao DESC`,
        [usuario.userId]
      );
      setAgendamentos(rows);
    } catch { setToastMsg('Erro ao carregar.'); setShowToast(true); }
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [usuario]);

  const filtrados = agendamentos.filter((a) => !filtroStatus || a.status === filtroStatus);

  return (
    <IonPage>
      <AppBar title="Meus Agendamentos" />
      <IonContent>
        <div style={{ display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto', flexWrap: 'nowrap' }}>
          {STATUS_OPCOES.map((op) => (
            <IonChip key={op.value} color={filtroStatus === op.value ? 'primary' : 'medium'} outline={filtroStatus !== op.value}
              onClick={() => setFiltroStatus(op.value)} style={{ flexShrink: 0 }}>{op.label}</IonChip>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : filtrados.length === 0 ? (
          <EmptyState icon={calendarOutline} title="Nenhum agendamento encontrado." actionLabel="Agendar" onAction={() => history.push('/app/agendar')} />
        ) : (
          <>
            {filtrados.map((a) => (
              <IonCard key={a.id} style={{ borderRadius: 12, margin: '8px 16px' }} onClick={() => history.push(`/app/agendamentos/${a.id}`)}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)' }}>{a.objetivo}</span>
                        <AgendamentoStatusBadge status={a.status} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                        {a.pesquisa_titulo} &nbsp;·&nbsp; {a.total_datas} data{a.total_datas !== 1 ? 's' : ''}
                        {a.primeira_data ? ` · ${new Date(a.primeira_data + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}
                      </div>
                    </div>
                    <IonIcon icon={chevronForwardOutline} color="medium" style={{ fontSize: 18, marginTop: 4 }} />
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </>
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push('/app/agendar')}><IonIcon icon={addOutline} /></IonFabButton>
        </IonFab>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default MeusAgendamentosPage;
