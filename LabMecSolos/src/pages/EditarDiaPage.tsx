import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonToggle, IonButton, IonSpinner, IonToast } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { CalendarioService } from '../services/CalendarioService';
import { queryRows } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import type { CalendarioDia } from '../models/types';

const EditarDiaPage: React.FC = () => {
  const { idCalendario, dia } = useParams<{ idCalendario: string; dia: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const diaNum = parseInt(dia);
  const [diaData, setDiaData] = useState<CalendarioDia | null>(null);
  const [disponivel, setDisponivel] = useState(true);
  const [horaAbertura, setHoraAbertura] = useState('');
  const [horaFechamento, setHoraFechamento] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (!idCalendario || !dia) return;
    queryRows<CalendarioDia>(
      'SELECT * FROM calendario_dias WHERE id_calendario_mensal = ? AND dia = ?',
      [idCalendario, diaNum]
    ).then((rows) => {
      if (rows.length > 0) {
        const d = rows[0];
        setDiaData(d);
        setDisponivel(d.disponivel === 1);
        setHoraAbertura(d.hora_abertura || '');
        setHoraFechamento(d.hora_fechamento || '');
        setCapacidade(d.capacidade ? String(d.capacidade) : '');
        setMotivo(d.motivo || '');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [idCalendario, dia]);

  const handleSave = async () => {
    if (!idCalendario || !usuario) return;
    setSaving(true);
    try {
      await CalendarioService.editarDia(idCalendario, diaNum, {
        disponivel,
        horaAbertura: horaAbertura || undefined,
        horaFechamento: horaFechamento || undefined,
        capacidade: capacidade ? parseInt(capacidade) : undefined,
        motivo: !disponivel ? motivo : undefined,
      }, usuario.userId);
      setToastMsg('Dia atualizado.');
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
    setSaving(false);
  };

  if (loading) {
    return <IonPage><AppBar title={`Dia ${diaNum}`} /><IonContent><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>;
  }

  return (
    <IonPage>
      <AppBar title={`Editar Dia ${diaNum}`} />
      <IonContent>
        <div style={{ padding: 16 }}>
          <IonItem lines="none">
            <IonLabel>Disponível</IonLabel>
            <IonToggle checked={disponivel} onIonChange={(e) => setDisponivel(e.detail.checked)} />
          </IonItem>

          <IonItem><IonLabel position="stacked">Horário de Abertura (alternativo)</IonLabel>
            <IonInput type="time" value={horaAbertura} onIonInput={(e) => setHoraAbertura(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Horário de Fechamento (alternativo)</IonLabel>
            <IonInput type="time" value={horaFechamento} onIonInput={(e) => setHoraFechamento(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Capacidade (alternativa)</IonLabel>
            <IonInput type="number" value={capacidade} onIonInput={(e) => setCapacidade(e.detail.value || '')} /></IonItem>

          {!disponivel && (
            <IonItem><IonLabel position="stacked">Motivo da Indisponibilidade *</IonLabel>
              <IonInput value={motivo} onIonInput={(e) => setMotivo(e.detail.value || '')} placeholder="Informe o motivo" /></IonItem>
          )}

          <IonButton expand="block" onClick={handleSave} disabled={saving || (!disponivel && !motivo.trim())} style={{ marginTop: 16 }}>
            {saving ? <IonSpinner /> : 'Salvar'}
          </IonButton>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default EditarDiaPage;
