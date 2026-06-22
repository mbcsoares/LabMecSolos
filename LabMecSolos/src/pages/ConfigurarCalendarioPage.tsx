import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonToast, IonChip, IonIcon } from '@ionic/react';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { addOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import MonthGrid from '../components/MonthGrid';
import { CalendarioService } from '../services/CalendarioService';
import { useAuth } from '../contexts/AuthContext';
import type { CalendarioMensalDetalhado, CriarCalendarioDTO } from '../models/types';

const ConfigurarCalendarioPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { usuario } = useAuth();

  const queryMes = new URLSearchParams(location.search).get('mes') || '';
  const [mesInicial] = useState(queryMes);
  const hojeAno = new Date().getFullYear();
  const hojeMes = new Date().getMonth() + 1;

  const [ano, setAno] = useState(
    mesInicial ? parseInt(mesInicial.split('-')[0]) : hojeAno
  );
  const [mes, setMes] = useState(
    mesInicial ? parseInt(mesInicial.split('-')[1]) : hojeMes
  );
  const [horaAbertura, setHoraAbertura] = useState('08:00');
  const [horaFechamento, setHoraFechamento] = useState('18:00');
  const [capacidade, setCapacidade] = useState('3');
  const [observacoes, setObservacoes] = useState('');
  const [calendario, setCalendario] = useState<CalendarioMensalDetalhado | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const mesAno = `${ano}-${String(mes).padStart(2, '0')}`;

  useEffect(() => {
    history.replace(location.pathname + `?mes=${mesAno}`);
  }, [mesAno]);

  const carregar = async () => {
    setLoading(true);
    try {
      const cal = await CalendarioService.obterCalendarioPorMes(mesAno);
      setCalendario(cal);
      if (cal) {
        setHoraAbertura(cal.hora_abertura_padrao);
        setHoraFechamento(cal.hora_fechamento_padrao);
        setCapacidade(String(cal.capacidade_padrao));
        setObservacoes(cal.observacoes || '');
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [mesAno]);

  const handleCriarSalvar = async () => {
    if (!usuario) return;
    setSaving(true);
    try {
      const dados: CriarCalendarioDTO = {
        mesAno,
        horaAberturaPadrao: horaAbertura,
        horaFechamentoPadrao: horaFechamento,
        capacidadePadrao: parseInt(capacidade) || 3,
        observacoes: observacoes.trim() || undefined,
      };
      if (calendario) {
        await CalendarioService.editarCalendario(calendario.id, dados, usuario.userId);
      } else {
        await CalendarioService.criarCalendario(dados, usuario.userId);
      }
      setToastMsg('Calendário salvo.');
      setShowToast(true);
      carregar();
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
    setSaving(false);
  };

  const handlePublicar = async () => {
    if (!calendario || !usuario) return;
    setSaving(true);
    try {
      await CalendarioService.publicarCalendario(calendario.id, usuario.userId);
      setToastMsg('Calendário publicado.');
      setShowToast(true);
      carregar();
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
    setSaving(false);
  };

  return (
    <IonPage>
      <AppBar title="Configurar Calendário" />
      <IonContent>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            <select value={ano} onChange={(e) => setAno(parseInt(e.target.value))} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--app-color-border)', fontSize: 14 }}>
              {[2025, 2026, 2027, 2028].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} style={{ padding: 8, borderRadius: 8, border: '1px solid var(--app-color-border)', fontSize: 14 }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{new Date(2020, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })}</option>)}
            </select>
          </div>

          {calendario?.status && (
            <IonChip color={calendario.status === 'publicado' ? 'success' : 'warning'} style={{ marginBottom: 12 }}>
              {calendario.status === 'publicado' ? 'Publicado' : 'Em configuração'}
            </IonChip>
          )}

          <IonItem><IonLabel position="stacked">Horário de Abertura</IonLabel>
            <IonInput type="time" value={horaAbertura} onIonInput={(e) => setHoraAbertura(e.detail.value || '08:00')} /></IonItem>
          <IonItem><IonLabel position="stacked">Horário de Fechamento</IonLabel>
            <IonInput type="time" value={horaFechamento} onIonInput={(e) => setHoraFechamento(e.detail.value || '18:00')} /></IonItem>
          <IonItem><IonLabel position="stacked">Capacidade Padrão</IonLabel>
            <IonInput type="number" value={capacidade} onIonInput={(e) => setCapacidade(e.detail.value || '3')} /></IonItem>
          <IonItem><IonLabel position="stacked">Observações</IonLabel>
            <IonInput value={observacoes} onIonInput={(e) => setObservacoes(e.detail.value || '')} /></IonItem>

          <IonButton expand="block" fill="outline" onClick={handleCriarSalvar} disabled={saving} style={{ marginTop: 8 }}>
            {saving ? <IonSpinner /> : calendario ? 'Salvar Alterações' : 'Criar Calendário'}
          </IonButton>

          {calendario && calendario.status !== 'publicado' && (
            <IonButton expand="block" color="success" onClick={handlePublicar} disabled={saving} style={{ marginTop: 8 }}>
              Publicar Calendário
            </IonButton>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><IonSpinner name="crescent" color="primary" /></div>
          ) : calendario ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>
                {calendario.dias.filter((d) => d.disponivel === 0).length} dia{calendario.dias.filter((d) => d.disponivel === 0).length !== 1 ? 's' : ''} indisponíve{calendario.dias.filter((d) => d.disponivel === 0).length !== 1 ? 'is' : 'l'}
              </div>
              <MonthGrid
                mesAno={mesAno}
                dias={calendario.dias.map((d) => ({ dia: d.dia, disponivel: d.disponivel === 1 }))}
                capacidadePadrao={calendario.capacidade_padrao}
                calendarioPublicado={true}
                editavel
                onDayPress={(dia) => history.push(`/app/configurar-calendario/${calendario.id}/dia/${dia}`, { calendarioId: calendario.id, dia })}
              />
            </div>
          ) : null}
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default ConfigurarCalendarioPage;
