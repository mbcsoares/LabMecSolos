import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonChip, IonSpinner, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppBar from '../components/AppBar';
import AgendamentoStatusBadge from '../components/AgendamentoStatusBadge';
import { queryRows } from '../services/DatabaseService';
import type { StatusAgendamento } from '../models/types';

const STATUS_OPCOES = [{ label: 'Todos', value: '' }, { label: 'Solicitado', value: 'solicitado' }, { label: 'Aprovado', value: 'aprovado' }, { label: 'Finalizado', value: 'finalizado' }, { label: 'Negado', value: 'negado' }, { label: 'Cancelado', value: 'cancelado' }];

interface AgendamentoResumo {
  id: string;
  objetivo: string;
  nome_solicitante: string;
  pesquisa_titulo: string;
  status: StatusAgendamento;
  data_solicitacao: string;
  total_datas: number;
}

const TodosAgendamentosPage: React.FC = () => {
  const history = useHistory();
  const [agendamentos, setAgendamentos] = useState<AgendamentoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const carregar = async () => {
    setLoading(true);
    try {
      const rows = await queryRows<AgendamentoResumo>(
        `SELECT a.*, u.nome || ' ' || u.sobrenome AS nome_solicitante, p.titulo AS pesquisa_titulo, COUNT(ad.id) AS total_datas
         FROM agendamentos a
         INNER JOIN usuarios u ON a.id_usuario_solicitante = u.id
         INNER JOIN pesquisas p ON a.id_pesquisa = p.id
         LEFT JOIN agendamento_datas ad ON a.id = ad.id_agendamento
         GROUP BY a.id
         ORDER BY a.data_solicitacao DESC`
      );
      setAgendamentos(rows);
    } catch { setToastMsg('Erro ao carregar.'); setShowToast(true); }
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const filtrados = agendamentos.filter((a) => !filtroStatus || a.status === filtroStatus);

  return (
    <IonPage>
      <AppBar title="Todos os Agendamentos" />
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
          <div style={{ textAlign: 'center', padding: 48 }}><p style={{ fontSize: 14, color: 'var(--ion-color-medium)' }}>Nenhum agendamento.</p></div>
        ) : (
          <IonList inset>
            {filtrados.map((a) => (
              <IonItem key={a.id} button onClick={() => history.push(`/app/agendamentos/${a.id}`)} detail>
                <IonLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{a.objetivo}</span>
                    <AgendamentoStatusBadge status={a.status} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{a.nome_solicitante} · {a.pesquisa_titulo}</div>
                  <div style={{ fontSize: 11, color: 'var(--ion-color-medium)' }}>{a.total_datas} data{a.total_datas !== 1 ? 's' : ''} · {new Date(a.data_solicitacao).toLocaleDateString('pt-BR')}</div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default TodosAgendamentosPage;
