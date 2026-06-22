import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonToast, IonIcon } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { saveOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import { TeorUmidadeService } from '../services/TeorUmidadeService';
import { useAuth } from '../contexts/AuthContext';
import type { RegistrarDeterminacaoDTO } from '../models/types';

const NovaDeterminacaoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [tara, setTara] = useState('');
  const [m1, setM1] = useState('');
  const [m2, setM2] = useState('');
  const [tempoEstufa, setTempoEstufa] = useState('');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<string>('success');
  const [previewH, setPreviewH] = useState<string | null>(null);
  const [previewFC, setPreviewFC] = useState<string | null>(null);

  const t = parseFloat(tara) || 0;
  const m1v = parseFloat(m1) || 0;
  const m2v = parseFloat(m2) || 0;

  useEffect(() => {
    if (t > 0 && m1v > t && m2v > t && m2v < m1v) {
      try {
        const h = TeorUmidadeService.calcularHC(m1v, m2v, t);
        const fc = TeorUmidadeService.calcularFCIndividual(h);
        setPreviewH(h.toFixed(2));
        setPreviewFC(fc.toFixed(4));
      } catch { setPreviewH(null); setPreviewFC(null); }
    } else {
      setPreviewH(null);
      setPreviewFC(null);
    }
  }, [tara, m1, m2]);

  const handleSalvarParcial = async () => {
    if (!tara || !m1 || !usuario || !id) return;
    const tVal = parseFloat(tara);
    const m1Val = parseFloat(m1);
    if (tVal <= 0 || m1Val <= tVal) {
      setToastMsg('Verifique os valores: M1 deve ser maior que a tara.');
      setShowToast(true);
      return;
    }
    setSaving(true);
    try {
      const dados: RegistrarDeterminacaoDTO = {
        idEnsaioTeorUmidade: id,
        tara: tVal,
        m1: m1Val,
        observacao: obs.trim() || undefined,
      };
      await TeorUmidadeService.registrarDeterminacao(dados, usuario.userId);
      setToastColor('success'); setToastMsg('Determinação parcial salva. Após a estufa, complete com M2.');
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) { setToastColor('danger'); setToastMsg(e.message || 'Erro'); setShowToast(true); }
    setSaving(false);
  };

  const handleSalvarCompleto = async () => {
    if (!tara || !m1 || !m2 || !usuario || !id) return;
    const tVal = parseFloat(tara);
    const m1Val = parseFloat(m1);
    const m2Val = parseFloat(m2);
    if (tVal <= 0 || m1Val <= tVal || m2Val <= tVal || m2Val >= m1Val) {
      setToastMsg('Verifique os valores: M2 deve estar entre Tara e M1.');
      setShowToast(true);
      return;
    }
    setSaving(true);
    try {
      const dados: RegistrarDeterminacaoDTO = {
        idEnsaioTeorUmidade: id,
        tara: tVal,
        m1: m1Val,
        m2: m2Val,
        tempoEstufa: tempoEstufa ? parseFloat(tempoEstufa) : undefined,
        observacao: obs.trim() || undefined,
      };
      await TeorUmidadeService.registrarDeterminacao(dados, usuario.userId);
      setToastColor('success'); setToastMsg('Determinação registrada.');
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) { setToastColor('danger'); setToastMsg(e.message || 'Erro'); setShowToast(true); }
    setSaving(false);
  };

  return (
    <IonPage>
      <AppBar title="Nova Determinação" />
      <IonContent>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginBottom: 12, padding: '8px 12px', borderRadius: 8, backgroundColor: '#E8EDF6', lineHeight: 1.5 }}>
            <strong>Etapa 1:</strong> Pese a tara, o solo úmido (M1) e salve parcialmente.<br />
            <strong>Etapa 2:</strong> Após a estufa (mín. 24h), complete com M2 e tempo.
          </div>

          <IonItem><IonLabel position="stacked">Tara — massa da cápsula vazia (g) *</IonLabel>
            <IonInput type="number" value={tara} onIonInput={(e) => setTara(e.detail.value || '')} />
          </IonItem>
          <IonItem><IonLabel position="stacked">M1 — massa cápsula + solo úmido (g) *</IonLabel>
            <IonInput type="number" value={m1} onIonInput={(e) => setM1(e.detail.value || '')} />
          </IonItem>

          <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', margin: '4px 0 0 16px' }}>
            Se não souber M2 ainda, preencha apenas Tara e M1 e salve parcialmente.
          </div>

          <IonItem><IonLabel position="stacked">M2 — massa cápsula + solo seco (g) (preencher após estufa)</IonLabel>
            <IonInput type="number" value={m2} onIonInput={(e) => setM2(e.detail.value || '')} />
          </IonItem>
          <IonItem><IonLabel position="stacked">Tempo de estufa (horas)</IonLabel><IonInput type="number" value={tempoEstufa} onIonInput={(e) => setTempoEstufa(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Observação</IonLabel><IonInput value={obs} onIonInput={(e) => setObs(e.detail.value || '')} /></IonItem>

          {previewH !== null && previewFC !== null && (
            <div style={{ marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#E8EDF6' }}>
              <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Pré-visualização dos cálculos:</div>
              <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', fontStyle: 'italic' }}>h = ((M1 - M2) / (M2 - Tara)) × 100</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-primary)', marginTop: 4 }}>h_calculado = {previewH}%</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-primary)', marginTop: 4 }}>fc_individual = {previewFC}</div>
            </div>
          )}

          <div style={{ padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <IonButton expand="block" fill="outline" onClick={handleSalvarParcial} disabled={!tara || !m1 || saving}>
              <IonIcon slot="start" icon={saveOutline} />
              {saving ? <IonSpinner /> : 'Salvar Parcial (sem M2)'}
            </IonButton>
            <IonButton expand="block" onClick={handleSalvarCompleto} disabled={!tara || !m1 || !m2 || saving}>
              {saving ? <IonSpinner /> : 'Salvar Completo (com M2)'}
            </IonButton>
          </div>

          <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', textAlign: 'center', marginTop: 4 }}>
            Recomendado: mínimo 24h de estufa a 105-110°C
          </div>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={3000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default NovaDeterminacaoPage;