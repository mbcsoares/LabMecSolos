import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonSpinner, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppBar from '../components/AppBar';
import AgendamentoStatusBadge from '../components/AgendamentoStatusBadge';
import { queryRows } from '../services/DatabaseService';

interface SolicitacaoResumo {
  id: string;
  objetivo: string;
  nome_solicitante: string;
  pesquisa_titulo: string;
  data_solicitacao: string;
  total_datas: number;
  ensaios: string;
}

const SolicitacoesPendentesPage: React.FC = () => {
  const history = useHistory();
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const carregar = async () => {
    setLoading(true);
    try {
      const rows = await queryRows<SolicitacaoResumo>(
        `SELECT a.*, u.nome || ' ' || u.sobrenome AS nome_solicitante, p.titulo AS pesquisa_titulo,
          GROUP_CONCAT(DISTINCT ae.tipo_ensaio) AS ensaios,
          MIN(ad.data_agendada) AS primeira_data, COUNT(ad.id) AS total_datas
         FROM agendamentos a
         INNER JOIN usuarios u ON a.id_usuario_solicitante = u.id
         INNER JOIN pesquisas p ON a.id_pesquisa = p.id
         LEFT JOIN agendamento_ensaios ae ON a.id = ae.id_agendamento
         LEFT JOIN agendamento_datas ad ON a.id = ad.id_agendamento
         WHERE a.status = 'solicitado'
         GROUP BY a.id
         ORDER BY a.data_solicitacao ASC`
      );
      setSolicitacoes(rows);
    } catch { setToastMsg('Erro ao carregar.'); setShowToast(true); }
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  return (
    <IonPage>
      <AppBar title="Solicitações Pendentes" />
      <IonContent>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : solicitacoes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ fontSize: 14, color: 'var(--ion-color-medium)' }}>Nenhuma solicitação pendente.</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', padding: '8px 16px' }}>{solicitacoes.length} solicitação{solicitacoes.length !== 1 ? 'ões' : ''}</div>
            <IonList inset>
              {solicitacoes.map((s) => (
                <IonItem key={s.id} button onClick={() => history.push(`/app/solicitacoes-pendentes/${s.id}`)} detail>
                  <IonLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{s.objetivo}</span>
                      <AgendamentoStatusBadge status="solicitado" />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                      {s.nome_solicitante} · {s.pesquisa_titulo}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', marginTop: 2 }}>
                      {s.total_datas} data{s.total_datas !== 1 ? 's' : ''} · {new Date(s.data_solicitacao).toLocaleDateString('pt-BR')}
                    </div>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </>
        )}
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default SolicitacoesPendentesPage;
