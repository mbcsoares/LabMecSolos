import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { ConfiguracaoLaboratorioService } from '../services/ConfiguracaoLaboratorioService';
import { useAuth } from '../contexts/AuthContext';
import type { ConfiguracaoLaboratorio } from '../models/types';

const ConfiguracoesLaboratorioPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const [config, setConfig] = useState<ConfiguracaoLaboratorio | null>(null);
  const [min, setMin] = useState('2');
  const [max, setMax] = useState('60');
  const [prazo, setPrazo] = useState('24');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    ConfiguracaoLaboratorioService.obter().then((c) => {
      setConfig(c);
      setMin(String(c.antecedencia_minima_dias));
      setMax(String(c.antecedencia_maxima_dias));
      setPrazo(String(c.prazo_cancelamento_horas));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!usuario) return;
    setSaving(true);
    try {
      await ConfiguracaoLaboratorioService.atualizar({
        antecedenciaMinimaDias: parseInt(min) || 2,
        antecedenciaMaximaDias: parseInt(max) || 60,
        prazoCancelamentoHoras: parseInt(prazo) || 24,
      }, usuario.userId);
      setToastMsg('Configurações salvas.');
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
    setSaving(false);
  };

  if (loading) {
    return <IonPage><AppBar title="Configurações" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>;
  }

  return (
    <IonPage>
      <AppBar title="Configurações do Laboratório" />
      <IonContent>
        <div style={{ padding: 16 }}>
          <IonItem><IonLabel position="stacked">Antecedência Mínima (dias)</IonLabel>
            <IonInput type="number" value={min} onIonInput={(e) => setMin(e.detail.value || '2')} /></IonItem>
          <IonItem><IonLabel position="stacked">Antecedência Máxima (dias)</IonLabel>
            <IonInput type="number" value={max} onIonInput={(e) => setMax(e.detail.value || '60')} /></IonItem>
          <IonItem><IonLabel position="stacked">Prazo de Cancelamento (horas)</IonLabel>
            <IonInput type="number" value={prazo} onIonInput={(e) => setPrazo(e.detail.value || '24')} /></IonItem>

          <div style={{ padding: '16px 8px' }}>
            <IonButton expand="block" onClick={handleSave} disabled={saving}>
              {saving ? <IonSpinner /> : 'Salvar Configurações'}
            </IonButton>
          </div>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default ConfiguracoesLaboratorioPage;
