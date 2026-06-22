import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonToast, IonCard, IonCardContent, IonAlert } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppBar from '../components/AppBar';
import AdminGuard from '../components/AdminGuard';
import { ConfiguracaoSistemaService } from '../services/ConfiguracaoSistemaService';
import { LogExportService } from '../services/LogExportService';
import { useAuth } from '../contexts/AuthContext';
import type { PeriodoPreset } from '../models/types';

const ConfiguracoesSistemaPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const [retencao, setRetencao] = useState('365');
  const [antecMin, setAntecMin] = useState('2');
  const [antecMax, setAntecMax] = useState('60');
  const [prazo, setPrazo] = useState('24');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportInicio, setExportInicio] = useState('');
  const [exportFim, setExportFim] = useState('');
  const [exportModulos, setExportModulos] = useState<string[]>(['autenticacao', 'administracao', 'estoque', 'ensaios', 'agendamento', 'sistema']);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [ultimaLimpeza, setUltimaLimpeza] = useState('Nunca executada');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ret = await ConfiguracaoSistemaService.obter('tempo_retencao_logs_dias');
        const min = await ConfiguracaoSistemaService.obter('antecedencia_minima_dias');
        const max = await ConfiguracaoSistemaService.obter('antecedencia_maxima_dias');
        const prz = await ConfiguracaoSistemaService.obter('prazo_cancelamento_horas');
        const limp = await ConfiguracaoSistemaService.obter('ultima_limpeza_logs');
        if (ret) setRetencao(ret);
        if (min) setAntecMin(min);
        if (max) setAntecMax(max);
        if (prz) setPrazo(prz);
        if (limp) setUltimaLimpeza(new Date(limp).toLocaleDateString('pt-BR') + ' ' + new Date(limp).toLocaleTimeString('pt-BR'));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleSalvarLogs = async () => {
    if (!usuario) return;
    setSaving(true);
    try {
      await ConfiguracaoSistemaService.definir('tempo_retencao_logs_dias', retencao, usuario.userId);
      setToastMsg('Configuração de logs salva.');
      setShowToast(true);
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
    setSaving(false);
  };

  const handleSalvarAgendamento = async () => {
    if (!usuario) return;
    setSaving(true);
    try {
      await ConfiguracaoSistemaService.definir('antecedencia_minima_dias', antecMin, usuario.userId);
      await ConfiguracaoSistemaService.definir('antecedencia_maxima_dias', antecMax, usuario.userId);
      await ConfiguracaoSistemaService.definir('prazo_cancelamento_horas', prazo, usuario.userId);
      setToastMsg('Parâmetros de agendamento salvos.');
      setShowToast(true);
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
    setSaving(false);
  };

  const handleForcarLimpeza = async () => {
    if (!usuario) return;
    setSaving(true);
    try {
      const total = await LogExportService.forcarLimpezaLogs(usuario.userId);
      await ConfiguracaoSistemaService.registrarLimpezaLogs();
      setUltimaLimpeza(new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'));
      setToastMsg(`${total} registros removidos.`);
      setShowToast(true);
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
    setSaving(false);
  };

  const MODULOS = ['autenticacao', 'administracao', 'estoque', 'ensaios', 'agendamento', 'sistema'];

  if (loading) {
    return <IonPage><AppBar title="Configurações" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>;
  }

  return (
    <IonPage>
      <AppBar title="Configurações do Sistema" />
      <IonContent>
        <div style={{ padding: 16 }}>
          {/* Seção: Logs */}
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Logs do Sistema</div>
          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <IonItem><IonLabel position="stacked">Tempo de retenção (dias)</IonLabel>
                <IonInput type="number" value={retencao} onIonInput={(e) => setRetencao(e.detail.value || '365')} />
              </IonItem>
              <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', padding: '0 16px' }}>Logs com idade superior serão excluídos automaticamente.</div>
              <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', padding: '8px 16px' }}>Última limpeza: {ultimaLimpeza}</div>
              <div style={{ padding: '8px 0', display: 'flex', gap: 8 }}>
                <IonButton expand="block" fill="outline" size="small" onClick={handleSalvarLogs} disabled={saving}>Salvar</IonButton>
                <IonButton expand="block" fill="outline" size="small" onClick={() => setShowExportModal(true)}>Exportar Logs</IonButton>
                <IonButton expand="block" fill="outline" size="small" color="warning" onClick={handleForcarLimpeza} disabled={saving}>Forçar Limpeza</IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Seção: Parâmetros de Agendamento */}
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>Parâmetros de Agendamento</div>
          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <IonItem><IonLabel position="stacked">Antecedência mínima (dias)</IonLabel>
                <IonInput type="number" value={antecMin} onIonInput={(e) => setAntecMin(e.detail.value || '2')} />
              </IonItem>
              <IonItem><IonLabel position="stacked">Antecedência máxima (dias)</IonLabel>
                <IonInput type="number" value={antecMax} onIonInput={(e) => setAntecMax(e.detail.value || '60')} />
              </IonItem>
              <IonItem><IonLabel position="stacked">Prazo de cancelamento (horas)</IonLabel>
                <IonInput type="number" value={prazo} onIonInput={(e) => setPrazo(e.detail.value || '24')} />
              </IonItem>
              <IonButton expand="block" onClick={handleSalvarAgendamento} disabled={saving} style={{ marginTop: 8 }}>
                {saving ? <IonSpinner /> : 'Salvar Configurações'}
              </IonButton>
            </IonCardContent>
          </IonCard>

          {/* Seção: Sobre */}
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>Sobre o Sistema</div>
          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <IonItem lines="none"><IonLabel position="stacked"><small>Nome</small></IonLabel><div>LabMecSolos</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Descrição</small></IonLabel><div>Laboratório de Mecânica dos Solos</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Versão</small></IonLabel><div>1.0.0 (MVP)</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Autor</small></IonLabel><div>Micael Bruno Cassiano Soares</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Contato</small></IonLabel><div>micaelbruno2011@gmail.com</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Normas</small></IonLabel>
                <div style={{ fontSize: 13 }}>
                  <div>ABNT NBR ISO/IEC 17025:2017</div>
                  <div>ABNT NBR 6457:2024</div>
                </div>
              </IonItem>
            </IonCardContent>
          </IonCard>
        </div>

        <IonAlert isOpen={showExportModal}
          onDidDismiss={({ detail }) => {
            setShowExportModal(false);
            if (detail.role === 'confirm' && usuario) {
              const inicio = detail.data?.values?.inicio;
              const fim = detail.data?.values?.fim;
              if (inicio && fim) {
                LogExportService.exportarLogs(inicio, fim, exportModulos, usuario.userId)
                  .then(() => { setToastMsg('Logs exportados.'); setShowToast(true); })
                  .catch((e: any) => { setToastMsg(e.message || 'Erro'); setShowToast(true); });
              } else {
                setToastMsg('Selecione o período.');
                setShowToast(true);
              }
            }
          }}
          header="Exportar Logs"
          message="Selecione o período e os módulos."
          inputs={[
            { name: 'inicio', type: 'date', label: 'Início', handler: (e: any) => setExportInicio(e.value) },
            { name: 'fim', type: 'date', label: 'Fim', handler: (e: any) => setExportFim(e.value) },
          ]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Exportar', role: 'confirm' },
          ]}
        />

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

const ConfiguracoesSistemaPageWithGuard: React.FC = () => (
  <AdminGuard><ConfiguracoesSistemaPage /></AdminGuard>
);

export default ConfiguracoesSistemaPageWithGuard;
