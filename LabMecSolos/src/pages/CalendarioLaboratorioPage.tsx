import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner, IonButton, IonToast, IonChip } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { calendarOutline, chevronBackOutline, chevronForwardOutline, addOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import MonthGrid from '../components/MonthGrid';
import { CalendarioService } from '../services/CalendarioService';
import { useAuth } from '../contexts/AuthContext';
import type { CalendarioMensalDetalhado } from '../models/types';

const CalendarioLaboratorioPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [calendario, setCalendario] = useState<CalendarioMensalDetalhado | null>(null);
  const [loading, setLoading] = useState(true);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const mesAno = `${ano}-${String(mes).padStart(2, '0')}`;

  const carregar = async () => {
    setLoading(true);
    try {
      const cal = await CalendarioService.obterCalendarioPorMes(mesAno);
      setCalendario(cal);
      setSelecionados([]);
    } catch {
      setToastMsg('Erro ao carregar calendário.');
      setShowToast(true);
    }
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [mesAno]);

  const avancarMes = () => {
    if (mes === 12) { setAno(ano + 1); setMes(1); }
    else setMes(mes + 1);
  };
  const voltarMes = () => {
    if (mes === 1) { setAno(ano - 1); setMes(12); }
    else setMes(mes - 1);
  };

  const handleDayPress = (dia: number) => {
    const disp = calendario?.dias?.find((d) => d.dia === dia);
    if (!calendario || calendario.status !== 'publicado' || !disp || !disp.disponivel) return;

    setSelecionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort((a, b) => a - b)
    );
  };

  const isColaborador = usuario?.permissao === 'colaborador' || usuario?.permissao === 'chefia';

  const nomeMes = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <IonPage>
      <AppBar title="Calendário" />
      <IonContent>
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <button onClick={voltarMes} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}>
              <IonIcon icon={chevronBackOutline} style={{ fontSize: 20, color: 'var(--ion-color-primary)' }} />
            </button>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ion-color-dark)', textTransform: 'capitalize' }}>{nomeMes}</span>
            <button onClick={avancarMes} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}>
              <IonIcon icon={chevronForwardOutline} style={{ fontSize: 20, color: 'var(--ion-color-primary)' }} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ion-color-medium)' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#D5F5E3' }} /> Disponível
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ion-color-medium)' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#FADBD8' }} /> Indisponível
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ion-color-medium)' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#FDEBD0' }} /> Esgotado
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ion-color-medium)' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#E8E8E8' }} /> Não configurado
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : !calendario ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <IonIcon icon={calendarOutline} style={{ fontSize: 48, color: 'var(--ion-color-medium)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--ion-color-medium)', margin: 0 }}>Calendário não disponível para este mês.</p>
          </div>
        ) : (
          <div style={{ padding: '0 12px' }}>
            <MonthGrid
              mesAno={mesAno}
              dias={calendario.dias.map((d) => ({ dia: d.dia, disponivel: d.disponivel === 1 }))}
              capacidadePadrao={calendario.capacidade_padrao}
              calendarioPublicado={calendario.status === 'publicado'}
              selecionados={selecionados}
              onDayPress={handleDayPress}
            />
          </div>
        )}

        {selecionados.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--app-color-border)', marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{selecionados.length} data{selecionados.length > 1 ? 's' : ''} selecionada{selecionados.length > 1 ? 's' : ''}:</span>
              {selecionados.slice(0, 10).map((d) => (
                <IonChip key={d} outline style={{ fontSize: 11, height: 24 }}>{d}/{mes}</IonChip>
              ))}
            </div>
            <IonButton expand="block" onClick={() => history.push('/app/agendar/solicitar', { datas: selecionados.map((d) => `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`) })}>
              <IonIcon slot="start" icon={addOutline} /> Solicitar Agendamento
            </IonButton>
          </div>
        )}

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default CalendarioLaboratorioPage;
