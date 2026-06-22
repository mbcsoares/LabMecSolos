import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonItem, IonLabel, IonButton, IonSpinner, IonToast, IonIcon } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppBar from '../components/AppBar';
import { CalendarioService } from '../services/CalendarioService';
import type { DisponibilidadeDia } from '../models/types';

const DetalhesDiaPage: React.FC = () => {
  const { data } = useParams<{ data: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const isColaborador = usuario?.permissao === 'colaborador' || usuario?.permissao === 'chefia';
  const [disponibilidade, setDisponibilidade] = useState<DisponibilidadeDia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!data) return;
    const [ano, mes] = data.split('-');
    const mesAno = `${ano}-${mes}`;
    const dia = parseInt(data.split('-')[2]);
    CalendarioService.verificarDisponibilidade(mesAno, dia).then(setDisponibilidade).catch(() => {}).finally(() => setLoading(false));
  }, [data]);

  const dataFormatada = data ? new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  if (loading) {
    return <IonPage><AppBar title="Detalhes do Dia" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>;
  }

  return (
    <IonPage>
      <AppBar title="Detalhes do Dia" />
      <IonContent>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ion-color-dark)', marginBottom: 16, textTransform: 'capitalize' }}>{dataFormatada}</div>

          {!disponibilidade || !disponibilidade.disponivel ? (
            <IonCard style={{ borderRadius: 12 }}>
              <IonCardContent>
                <IonItem lines="none"><IonLabel position="stacked"><small>Status</small></IonLabel><div style={{ color: '#C0392B', fontWeight: 600 }}>Indisponível</div></IonItem>
                <IonItem lines="none"><IonLabel position="stacked"><small>Motivo</small></IonLabel><div>{disponibilidade?.motivo || 'Calendário não configurado.'}</div></IonItem>
              </IonCardContent>
            </IonCard>
          ) : (
            <IonCard style={{ borderRadius: 12 }}>
              <IonCardContent>
                <IonItem lines="none"><IonLabel position="stacked"><small>Status</small></IonLabel><div style={{ color: '#1E8449', fontWeight: 600 }}>Disponível</div></IonItem>
                <IonItem lines="none"><IonLabel position="stacked"><small>Horário de Funcionamento</small></IonLabel><div>{disponibilidade.horaAbertura} - {disponibilidade.horaFechamento}</div></IonItem>
                <IonItem lines="none"><IonLabel position="stacked"><small>Capacidade</small></IonLabel><div>{disponibilidade.capacidade} agendamentos</div></IonItem>
              </IonCardContent>
            </IonCard>
          )}

          {disponibilidade?.disponivel && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <IonButton expand="block" fill="outline" onClick={() => history.goBack()}>
                Selecionar este dia
              </IonButton>
              {isColaborador && (
                <IonButton expand="block" fill="solid" onClick={() => history.push(`/app/agendar/dia/${data}/agendamentos`)}>
                  Ver Agendamentos
                </IonButton>
              )}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DetalhesDiaPage;
