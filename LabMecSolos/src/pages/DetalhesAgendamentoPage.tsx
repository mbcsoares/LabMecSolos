import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonItem, IonLabel, IonButton, IonChip, IonSpinner, IonToast, IonIcon, IonAlert } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { closeCircleOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import AgendamentoStatusBadge from '../components/AgendamentoStatusBadge';
import DateCard from '../components/DateCard';
import { AgendamentoService } from '../services/AgendamentoService';
import { queryRows } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import type { Agendamento, AgendamentoData, AgendamentoEnsaio } from '../models/types';

const DetalhesAgendamentoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const isColaborador = usuario?.permissao === 'colaborador' || usuario?.permissao === 'chefia';
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [datas, setDatas] = useState<AgendamentoData[]>([]);
  const [ensaios, setEnsaios] = useState<AgendamentoEnsaio[]>([]);
  const [pesquisaTitulo, setPesquisaTitulo] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const carregar = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const ags = await queryRows<Agendamento>('SELECT * FROM agendamentos WHERE id = ?', [id]);
      if (ags.length > 0) {
        setAgendamento(ags[0]);
        const pts = await queryRows<{ titulo: string }>('SELECT titulo FROM pesquisas WHERE id = ?', [ags[0].id_pesquisa]);
        setPesquisaTitulo(pts[0]?.titulo || '');
        setDatas(await queryRows<AgendamentoData>('SELECT * FROM agendamento_datas WHERE id_agendamento = ? ORDER BY data_agendada ASC', [id]));
        setEnsaios(await queryRows<AgendamentoEnsaio>('SELECT * FROM agendamento_ensaios WHERE id_agendamento = ?', [id]));
      }
    } catch { setToastMsg('Erro ao carregar.'); setShowToast(true); }
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [id]);

  const handleCancelar = async (motivo: string) => {
    if (!id || !motivo || !usuario) return;
    try {
      await AgendamentoService.cancelarPeloUsuario(id, motivo, usuario.userId);
      setToastMsg('Agendamento cancelado.');
      setShowToast(true);
      carregar();
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
  };

  if (loading || !agendamento) {
    return <IonPage><AppBar title="Agendamento" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>;
  }

  return (
    <IonPage>
      <AppBar title="Detalhes" />
      <IonContent>
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 16 }}><AgendamentoStatusBadge status={agendamento.status} /></div>
          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <IonItem lines="none"><IonLabel position="stacked"><small>Pesquisa</small></IonLabel><div>{pesquisaTitulo}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Objetivo</small></IonLabel><div>{agendamento.objetivo}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Contexto</small></IonLabel><div>{agendamento.contexto}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Solicitado em</small></IonLabel><div>{new Date(agendamento.data_solicitacao).toLocaleDateString('pt-BR')}</div></IonItem>
              {agendamento.data_aprovacao && <IonItem lines="none"><IonLabel position="stacked"><small>Aprovado em</small></IonLabel><div>{new Date(agendamento.data_aprovacao).toLocaleDateString('pt-BR')}</div></IonItem>}
            </IonCardContent>
          </IonCard>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginTop: 16, marginBottom: 8 }}>Ensaios</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ensaios.map((e) => <IonChip key={e.id} outline style={{ fontSize: 12 }}>{e.tipo_ensaio.replace(/_/g, ' ')}</IonChip>)}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginTop: 16, marginBottom: 8 }}>Datas ({datas.length})</div>
          {datas.map((d) => (
            <div key={d.id} style={{ marginBottom: 8 }}>
              <DateCard data={d.data_agendada} horaInicio={d.hora_inicio} horaFim={d.hora_fim} readonly />
              {agendamento.status === 'aprovado' && isColaborador && (
                <IonButton
                  expand="block" fill="outline" size="small"
                  style={{ marginTop: 4 }}
                  onClick={() => history.push(`/app/agendamentos-dia/${d.data_agendada}/comparecimento`, { dataId: d.id })}
                >
                  Registrar Comparecimento
                </IonButton>
              )}
            </div>
          ))}

          {agendamento.status === 'aprovado' && (
            <div style={{ marginTop: 16 }}>
              <IonButton expand="block" color="warning" onClick={() => setShowCancelAlert(true)}>
                <IonIcon slot="start" icon={closeCircleOutline} /> Cancelar Agendamento
              </IonButton>
            </div>
          )}
        </div>

        <IonAlert isOpen={showCancelAlert}
          onDidDismiss={({ detail }) => {
            setShowCancelAlert(false);
            if (detail.role === 'confirm') {
              const motivo = detail.data?.values?.motivo?.trim() || '';
              if (motivo) handleCancelar(motivo);
            }
            setCancelMotivo('');
          }}
          header="Cancelar Agendamento" message="Informe o motivo do cancelamento:"
          inputs={[{ name: 'motivo', type: 'text', placeholder: 'Motivo', value: cancelMotivo, handler: (e: any) => setCancelMotivo(e.value) }]}
          buttons={[{ text: 'Voltar', role: 'cancel' }, { text: 'Confirmar', role: 'confirm' }]} />
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default DetalhesAgendamentoPage;
