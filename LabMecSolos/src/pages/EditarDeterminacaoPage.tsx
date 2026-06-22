import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonToast, IonIcon } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { checkmarkCircleOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import { TeorUmidadeService } from '../services/TeorUmidadeService';
import { queryRows } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import type { DeterminacaoTeorUmidade } from '../models/types';

const EditarDeterminacaoPage: React.FC = () => {
  const { id: determinacaoId } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [det, setDet] = useState<DeterminacaoTeorUmidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [m2, setM2] = useState('');
  const [tempoEstufa, setTempoEstufa] = useState('');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<string>('success');
  const [previewH, setPreviewH] = useState<string | null>(null);
  const [previewFC, setPreviewFC] = useState<string | null>(null);

  const carregar = async () => {
    if (!determinacaoId) return;
    setLoading(true);
    try {
      const rows = await queryRows<DeterminacaoTeorUmidade>(
        'SELECT * FROM determinacoes_teor_umidade WHERE id = ?',
        [determinacaoId]
      );
      if (rows.length > 0) {
        setDet(rows[0]);
        setObs(rows[0].observacao || '');
      }
    } catch (e: any) {
      setToastColor('danger'); setToastMsg(e.message || 'Erro ao carregar.');
      setShowToast(true);
    }
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const tara = det?.tara || 0;
  const m1Val = det?.m1 || 0;
  const m2Val = parseFloat(m2) || 0;

  useEffect(() => {
    if (tara > 0 && m1Val > tara && m2Val > tara && m2Val < m1Val) {
      try {
        const h = TeorUmidadeService.calcularHC(m1Val, m2Val, tara);
        const fc = TeorUmidadeService.calcularFCIndividual(h);
        setPreviewH(h.toFixed(2));
        setPreviewFC(fc.toFixed(4));
      } catch { setPreviewH(null); setPreviewFC(null); }
    } else {
      setPreviewH(null);
      setPreviewFC(null);
    }
  }, [m2]);

  const handleCompletar = async () => {
    if (!det || !m2 || !usuario) return;
    const m2Val = parseFloat(m2);
    if (m2Val <= tara || m2Val >= m1Val) {
      setToastMsg('M2 deve estar entre Tara e M1.');
      setShowToast(true);
      return;
    }
    setSaving(true);
    try {
      await TeorUmidadeService.editarDeterminacao(
        determinacaoId,
        m2Val,
        tempoEstufa ? parseFloat(tempoEstufa) : null,
        obs.trim() || null,
        usuario.userId
      );
      setToastColor('success'); setToastMsg('Determinação completada.');
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) { setToastColor('danger'); setToastMsg(e.message || 'Erro'); setShowToast(true); }
    setSaving(false);
  };

  if (loading || !det) {
    return (
      <IonPage><AppBar title="Completar Determinação" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>
    );
  }

  return (
    <IonPage>
      <AppBar title={`Completar Determinação #${det.numero_determinacao}`} />
      <IonContent>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginBottom: 12, padding: '8px 12px', borderRadius: 8, backgroundColor: '#E8EDF6', lineHeight: 1.5 }}>
            <strong>Dados já registrados:</strong><br />
            Tara: {det.tara.toFixed(2)}g &nbsp;|&nbsp; M1: {det.m1.toFixed(2)}g<br />
            Agora preencha M2 (após estufa) para completar.
          </div>

          <IonItem><IonLabel position="stacked">M2 — massa cápsula + solo seco (g) *</IonLabel>
            <IonInput type="number" value={m2} onIonInput={(e) => setM2(e.detail.value || '')} placeholder={`> ${tara.toFixed(1)}`} />
          </IonItem>
          <IonItem><IonLabel position="stacked">Tempo de estufa (horas)</IonLabel>
            <IonInput type="number" value={tempoEstufa} onIonInput={(e) => setTempoEstufa(e.detail.value || '')} />
          </IonItem>
          <IonItem><IonLabel position="stacked">Observação (adicionar)</IonLabel>
            <IonInput value={obs} onIonInput={(e) => setObs(e.detail.value || '')} />
          </IonItem>

          {previewH && previewFC && (
            <div style={{ marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#E8EDF6' }}>
              <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Pré-visualização:</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-primary)' }}>h_calculado = {previewH}%</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-primary)', marginTop: 4 }}>fc_individual = {previewFC}</div>
            </div>
          )}

          <div style={{ padding: '16px 8px' }}>
            <IonButton expand="block" color="success" onClick={handleCompletar} disabled={!m2 || saving}>
              <IonIcon slot="start" icon={checkmarkCircleOutline} />
              {saving ? <IonSpinner /> : 'Finalizar Determinação'}
            </IonButton>
          </div>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default EditarDeterminacaoPage;