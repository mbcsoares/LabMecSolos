import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonSpinner, IonToast } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import AppBar from '../components/AppBar';
import AgendamentoStatusBadge from '../components/AgendamentoStatusBadge';
import ComparecimentoToggle from '../components/ComparecimentoToggle';
import { queryRows } from '../services/DatabaseService';
import type { ComparecimentoStatus } from '../models/types';

interface AgendamentoDiaResumo {
  id: string;
  data_id: string;
  objetivo: string;
  nome_solicitante: string;
  pesquisa_titulo: string;
  hora_inicio: string;
  hora_fim: string;
  comparecimento: ComparecimentoStatus | null;
  ensaios: string;
}

const AgendamentosDiaPage: React.FC = () => {
  const { data } = useParams<{ data: string }>();
  const history = useHistory();
  const [agendamentos, setAgendamentos] = useState<AgendamentoDiaResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const carregar = async () => {
    if (!data) return;
    setLoading(true);
    try {
      const rows = await queryRows<AgendamentoDiaResumo>(
        `SELECT a.id, ad.id AS data_id, a.objetivo, u.nome || ' ' || u.sobrenome AS nome_solicitante,
          p.titulo AS pesquisa_titulo, ad.hora_inicio, ad.hora_fim, ad.comparecimento,
          GROUP_CONCAT(DISTINCT ae.tipo_ensaio) AS ensaios
         FROM agendamentos a
         INNER JOIN usuarios u ON a.id_usuario_solicitante = u.id
         INNER JOIN pesquisas p ON a.id_pesquisa = p.id
         INNER JOIN agendamento_datas ad ON a.id = ad.id_agendamento
         LEFT JOIN agendamento_ensaios ae ON a.id = ae.id_agendamento
         WHERE a.status = 'aprovado' AND ad.data_agendada = ?
         GROUP BY a.id, ad.id
         ORDER BY ad.hora_inicio ASC`,
        [data]
      );
      setAgendamentos(rows);
    } catch { setToastMsg('Erro ao carregar.'); setShowToast(true); }
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [data]);

  const dataFormatada = data ? new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }) : '';

  return (
    <IonPage>
      <AppBar title={`Agendamentos - ${dataFormatada}`} />
      <IonContent>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : agendamentos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}><p style={{ fontSize: 14, color: 'var(--ion-color-medium) ' }}>Nenhum agendamento para este dia.</p></div>
        ) : (
          <IonList inset>
            {agendamentos.map((a) => (
              <IonItem key={a.data_id} button onClick={() => history.push(`/app/agendamentos-dia/${data}/comparecimento`, { dataId: a.data_id })} detail>
                <IonLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{a.nome_solicitante}</span>
                    <span style={{ fontSize: 12, color: 'var(--ion-color-dark)' }}>{a.hora_inicio} - {a.hora_fim}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{a.pesquisa_titulo} · {a.objetivo}</div>
                  <div style={{ marginTop: 4 }}><ComparecimentoToggle status={a.comparecimento} readonly /></div>
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

export default AgendamentosDiaPage;
