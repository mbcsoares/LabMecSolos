import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonSpinner, IonToast, IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { informationCircleOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import { MetadadosService } from '../services/MetadadosService';
import { useAuth } from '../contexts/AuthContext';
import type { MetadadosAmostra, MetadadosAmostraDTO } from '../models/types';

const SUCS_OPCOES = ['CL', 'SM', 'CH', 'ML', 'MH', 'SW', 'SP', 'GP', 'GC', 'SC', 'OL', 'OH', 'PT'];
const AASHTO_OPCOES = ['A-1-a', 'A-1-b', 'A-2-4', 'A-2-5', 'A-2-6', 'A-2-7', 'A-3', 'A-4', 'A-5', 'A-6', 'A-7-5', 'A-7-6'];
const CONSISTENCIA_OPCOES = ['Mole', 'Média', 'Rija', 'Dura'];
const TOTAL_CAMPOS = 11;

const MetadadosFormPage: React.FC = () => {
  const { idAmostra } = useParams<{ idAmostra: string }>();
  const history = useHistory();
  const { usuario } = useAuth();

  const [metadados, setMetadados] = useState<MetadadosAmostra | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sucs, setSucs] = useState('');
  const [aashto, setAashto] = useState('');
  const [cor, setCor] = useState('');
  const [textura, setTextura] = useState('');
  const [consistencia, setConsistencia] = useState('');
  const [origemGeologica, setOrigemGeologica] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [uf, setUf] = useState('');
  const [profInicial, setProfInicial] = useState('');
  const [profFinal, setProfFinal] = useState('');
  const [nivelAgua, setNivelAgua] = useState('');

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const isEdicao = !!metadados;

  useEffect(() => {
    if (!idAmostra) return;
    MetadadosService.obterPorAmostra(idAmostra).then((m) => {
      if (m) {
        setMetadados(m);
        setSucs(m.classificacao_sucs || '');
        setAashto(m.classificacao_aashto || '');
        setCor(m.cor || '');
        setTextura(m.textura || '');
        setConsistencia(m.consistencia || '');
        setOrigemGeologica(m.origem_geologica || '');
        setMunicipio(m.municipio || '');
        setUf(m.uf || '');
        setProfInicial(m.profundidade_inicial?.toString() || '');
        setProfFinal(m.profundidade_final?.toString() || '');
        setNivelAgua(m.nivel_agua?.toString() || '');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [idAmostra]);

  const buildDTO = (): MetadadosAmostraDTO => ({
    classificacao_sucs: sucs || undefined,
    classificacao_aashto: aashto || undefined,
    cor: cor.trim() || undefined,
    textura: textura.trim() || undefined,
    consistencia: consistencia || undefined,
    origem_geologica: origemGeologica.trim() || undefined,
    municipio: municipio.trim() || undefined,
    uf: uf.trim().toUpperCase() || undefined,
    profundidade_inicial: profInicial ? parseFloat(profInicial) : undefined,
    profundidade_final: profFinal ? parseFloat(profFinal) : undefined,
    nivel_agua: nivelAgua ? parseFloat(nivelAgua) : undefined,
  });

  const camposPreenchidos = (): number => {
    let c = 0;
    if (sucs) c++; if (aashto) c++; if (cor.trim()) c++; if (textura.trim()) c++; if (consistencia) c++;
    if (origemGeologica.trim()) c++; if (municipio.trim()) c++; if (uf.trim()) c++;
    if (profInicial) c++; if (profFinal) c++; if (nivelAgua) c++;
    return c;
  };

  const handleSalvar = async (marcarCompleto: boolean) => {
    if (!usuario || !idAmostra) return;
    setSaving(true);
    try {
      if (isEdicao && metadados) {
        await MetadadosService.editar(metadados.id, buildDTO(), usuario.userId);
        if (marcarCompleto) await MetadadosService.marcarComoCompleto(metadados.id, usuario.userId);
      } else {
        await MetadadosService.criar(buildDTO(), usuario.userId, idAmostra);
        if (marcarCompleto) {
          const novo = await MetadadosService.obterPorAmostra(idAmostra);
          if (novo) await MetadadosService.marcarComoCompleto(novo.id, usuario.userId);
        }
      }
      setToastMsg(marcarCompleto ? 'Metadados salvos e marcados como completo.' : 'Metadados salvos.');
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
    setSaving(false);
  };

  const pct = Math.round((camposPreenchidos() / TOTAL_CAMPOS) * 100);

  if (loading) {
    return <IonPage><AppBar title="Metadados" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>;
  }

  return (
    <IonPage>
      <AppBar title="Metadados — Amostra" />
      <IonContent>
        <div style={{ padding: 16 }}>
          {metadados && (
            <div style={{ marginBottom: 8 }}>
              <StatusBadge status={metadados.status_preenchimento === 'completo' ? 'success' : 'warning'} label={metadados.status_preenchimento === 'completo' ? 'Completo' : 'Parcial'} />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginBottom: 4 }}>
              Campos preenchidos: {camposPreenchidos()} de {TOTAL_CAMPOS}
            </div>
            <div style={{ height: 6, borderRadius: 3, backgroundColor: '#E8E8E8' }}>
              <div style={{ height: 6, borderRadius: 3, backgroundColor: pct >= 100 ? '#009d43' : '#0095DB', width: `${pct}%` }} />
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginTop: 16, marginBottom: 8 }}>Classificação do Solo</div>
          <IonItem><IonLabel position="stacked">SUCS</IonLabel>
            <IonSelect value={sucs} placeholder="Não preenchido" onIonChange={(e) => setSucs(e.detail.value)}>
              <IonSelectOption value="">—</IonSelectOption>
              {SUCS_OPCOES.map((s) => <IonSelectOption key={s} value={s}>{s}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
          <IonItem><IonLabel position="stacked">AASHTO</IonLabel>
            <IonSelect value={aashto} placeholder="Não preenchido" onIonChange={(e) => setAashto(e.detail.value)}>
              <IonSelectOption value="">—</IonSelectOption>
              {AASHTO_OPCOES.map((a) => <IonSelectOption key={a} value={a}>{a}</IonSelectOption>)}
            </IonSelect>
          </IonItem>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginTop: 16, marginBottom: 8 }}>Características Físicas</div>
          <IonItem><IonLabel position="stacked">Cor</IonLabel><IonInput value={cor} onIonInput={(e) => setCor(e.detail.value || '')} placeholder="Ex: marrom avermelhado" /></IonItem>
          <IonItem><IonLabel position="stacked">Textura</IonLabel><IonInput value={textura} onIonInput={(e) => setTextura(e.detail.value || '')} placeholder="Ex: argilo-arenoso" /></IonItem>
          <IonItem><IonLabel position="stacked">Consistência</IonLabel>
            <IonSelect value={consistencia} placeholder="Não preenchido" onIonChange={(e) => setConsistencia(e.detail.value)}>
              <IonSelectOption value="">—</IonSelectOption>
              {CONSISTENCIA_OPCOES.map((c) => <IonSelectOption key={c} value={c}>{c}</IonSelectOption>)}
            </IonSelect>
          </IonItem>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginTop: 16, marginBottom: 8 }}>Geologia e Localização</div>
          <IonItem><IonLabel position="stacked">Origem Geológica</IonLabel><IonInput value={origemGeologica} onIonInput={(e) => setOrigemGeologica(e.detail.value || '')} placeholder="Ex: Formação Barreiras" /></IonItem>
          <IonItem><IonLabel position="stacked">Município</IonLabel><IonInput value={municipio} onIonInput={(e) => setMunicipio(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">UF</IonLabel><IonInput value={uf} maxlength={2} onIonInput={(e) => setUf(e.detail.value || '')} placeholder="Ex: RN" /></IonItem>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginTop: 16, marginBottom: 8 }}>Profundidade e Nível d'água</div>
          <IonItem><IonLabel position="stacked">Profundidade Inicial (m)</IonLabel><IonInput type="number" value={profInicial} onIonInput={(e) => setProfInicial(e.detail.value || '')} step="0.1" /></IonItem>
          <IonItem><IonLabel position="stacked">Profundidade Final (m)</IonLabel><IonInput type="number" value={profFinal} onIonInput={(e) => setProfFinal(e.detail.value || '')} step="0.1" /></IonItem>
          <IonItem lines="none"><IonLabel position="stacked">Nível d'água (m)</IonLabel><IonInput type="number" value={nivelAgua} onIonInput={(e) => setNivelAgua(e.detail.value || '')} step="0.1" /></IonItem>
          <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', padding: '2px 16px' }}>Se observado durante a coleta</div>

          <IonCard style={{ borderRadius: 12, marginTop: 16 }}>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <IonIcon icon={informationCircleOutline} style={{ fontSize: 20, color: 'var(--ion-color-medium)', marginTop: 2 }} />
                <span style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>Todos os campos são opcionais. Você pode salvar parcialmente e complementar os dados depois.</span>
              </div>
            </IonCardContent>
          </IonCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            <IonButton expand="block" fill="outline" onClick={() => handleSalvar(false)} disabled={saving}>
              {saving ? <IonSpinner /> : 'Salvar (Parcial)'}
            </IonButton>
            <IonButton expand="block" onClick={() => handleSalvar(true)} disabled={saving}>
              {saving ? <IonSpinner /> : 'Marcar como Completo'}
            </IonButton>
            <IonButton expand="block" fill="clear" onClick={() => history.goBack()}>Cancelar</IonButton>
          </div>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default MetadadosFormPage;
