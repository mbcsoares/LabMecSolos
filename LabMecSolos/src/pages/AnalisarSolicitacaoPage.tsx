import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonSelect, IonSelectOption, IonChip, IonSpinner, IonToast, IonAlert } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import AppBar from '../components/AppBar';
import DateCard from '../components/DateCard';
import { AgendamentoService } from '../services/AgendamentoService';
import { queryRows } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import type { Agendamento, AgendamentoData, AgendamentoEnsaio } from '../models/types';

const AnalisarSolicitacaoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [agendamento, setAgendamento] = useState<Agendamento | null>(null);
  const [datas, setDatas] = useState<AgendamentoData[]>([]);
  const [ensaios, setEnsaios] = useState<AgendamentoEnsaio[]>([]);
  const [nomeSolicitante, setNomeSolicitante] = useState('');
  const [pesquisaTitulo, setPesquisaTitulo] = useState('');
  const [tecnicos, setTecnicos] = useState<{ id: string; nome: string }[]>([]);
  const [idTecnico, setIdTecnico] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAprovarAlert, setShowAprovarAlert] = useState(false);
  const [showNegarAlert, setShowNegarAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const carregar = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const ags = await queryRows<Agendamento>('SELECT * FROM agendamentos WHERE id = ?', [id]);
      if (ags.length === 0) { setLoading(false); return; }
      setAgendamento(ags[0]);
      const [users, pts] = await Promise.all([
        queryRows<{ nome: string; sobrenome: string }>('SELECT nome, sobrenome FROM usuarios WHERE id = ?', [ags[0].id_usuario_solicitante]),
        queryRows<{ titulo: string }>('SELECT titulo FROM pesquisas WHERE id = ?', [ags[0].id_pesquisa]),
      ]);
      setNomeSolicitante(users[0] ? `${users[0].nome} ${users[0].sobrenome}` : '');
      setPesquisaTitulo(pts[0]?.titulo || '');
      setDatas(await queryRows<AgendamentoData>('SELECT * FROM agendamento_datas WHERE id_agendamento = ? ORDER BY data_agendada ASC', [id]));
      setEnsaios(await queryRows<AgendamentoEnsaio>('SELECT * FROM agendamento_ensaios WHERE id_agendamento = ?', [id]));
      const tecs = await queryRows<{ id: string; nome: string; sobrenome: string }>("SELECT id, nome, sobrenome FROM usuarios WHERE status = 'ativo' ORDER BY nome ASC");
      setTecnicos(tecs.map((t) => ({ id: t.id, nome: `${t.nome} ${t.sobrenome}` })));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [id]);

  const handleAprovar = async () => {
    if (!id || !idTecnico || !justificativa.trim() || !usuario) return;
    try {
      await AgendamentoService.aprovar(id, { idTecnicoResponsavel: idTecnico, justificativa: justificativa.trim() }, usuario.userId);
      setToastMsg('Agendamento aprovado.');
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
  };

  const handleNegar = async () => {
    if (!id || !justificativa.trim() || !usuario) return;
    try {
      await AgendamentoService.negar(id, { justificativa: justificativa.trim() }, usuario.userId);
      setToastMsg('Agendamento negado.');
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
  };

  if (loading || !agendamento) {
    return <IonPage><AppBar title="Analisar" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>;
  }

  return (
    <IonPage>
      <AppBar title="Analisar Solicitação" />
      <IonContent>
        <div style={{ padding: 16 }}>
          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <IonItem lines="none"><IonLabel position="stacked"><small>Solicitante</small></IonLabel><div style={{ fontWeight: 600 }}>{nomeSolicitante}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Pesquisa</small></IonLabel><div>{pesquisaTitulo}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Contexto</small></IonLabel><div>{agendamento.contexto}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Objetivo</small></IonLabel><div>{agendamento.objetivo}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Ensaios</small></IonLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {ensaios.map((e) => <IonChip key={e.id} outline style={{ fontSize: 11 }}>{e.tipo_ensaio.replace(/_/g, ' ')}</IonChip>)}
                </div>
              </IonItem>
            </IonCardContent>
          </IonCard>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginTop: 16, marginBottom: 8 }}>Datas Solicitadas ({datas.length})</div>
          {datas.map((d) => (
            <DateCard key={d.id} data={d.data_agendada} horaInicio={d.hora_inicio} horaFim={d.hora_fim} readonly />
          ))}

          <div style={{ marginTop: 24, borderTop: '1px solid var(--app-color-border)', paddingTop: 16 }}>
            <IonItem><IonLabel position="stacked">Técnico Responsável *</IonLabel>
              <IonSelect value={idTecnico} onIonChange={(e) => setIdTecnico(e.detail.value)} placeholder="Selecione o técnico">
                {tecnicos.map((t) => <IonSelectOption key={t.id} value={t.id}>{t.nome}</IonSelectOption>)}
              </IonSelect>
            </IonItem>
            <IonItem><IonLabel position="stacked">Justificativa *</IonLabel>
              <IonInput value={justificativa} onIonInput={(e) => setJustificativa(e.detail.value || '')} placeholder="Informe a justificativa..." />
            </IonItem>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <IonButton expand="block" color="success" onClick={() => setShowAprovarAlert(true)} disabled={!idTecnico || !justificativa.trim()}>
                Aprovar
              </IonButton>
              <IonButton expand="block" color="danger" onClick={() => setShowNegarAlert(true)} disabled={!justificativa.trim()}>
                Negar
              </IonButton>
            </div>
          </div>
        </div>

        <IonAlert isOpen={showAprovarAlert} onDidDismiss={() => setShowAprovarAlert(false)}
          header="Confirmar Aprovação" message="Deseja aprovar este agendamento?"
          buttons={[{ text: 'Cancelar', role: 'cancel' }, { text: 'Aprovar', handler: handleAprovar }]} />
        <IonAlert isOpen={showNegarAlert} onDidDismiss={() => setShowNegarAlert(false)}
          header="Confirmar Negação" message="Deseja negar este agendamento?"
          buttons={[{ text: 'Cancelar', role: 'cancel' }, { text: 'Negar', role: 'destructive', handler: handleNegar }]} />
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default AnalisarSolicitacaoPage;
