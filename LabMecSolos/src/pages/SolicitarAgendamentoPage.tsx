import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonSpinner, IonToast, IonIcon, IonSearchbar, IonChip } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { addOutline, closeOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import DateCard from '../components/DateCard';
import { AgendamentoService } from '../services/AgendamentoService';
import { PesquisaService } from '../services/PesquisaService';
import { ItemVerificacaoService, ItemStatus } from '../services/ItemVerificacaoService';
import { useAuth } from '../contexts/AuthContext';
import type { ContextoAgendamento, SolicitarAgendamentoDTO, PesquisaResumo } from '../models/types';

const CONTEXTO_OPCOES: { value: ContextoAgendamento; label: string }[] = [
  { value: 'academico', label: 'Acadêmico' },
  { value: 'pesquisa_cientifica', label: 'Pesquisa Científica' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'outro', label: 'Outro' },
];

const TIPO_ENSAIO_OPCOES = [
  'teor_umidade', 'granulometria', 'compactacao', 'limite_liquidez',
  'limite_plasticidade', 'cisalhamento_direto', 'adensamento', 'triaxial', 'outro',
];

const SolicitarAgendamentoPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const state = history.location.state as { datas?: string[] } | undefined;
  const datasPreSelecionadas = state?.datas || [];

  const [datas, setDatas] = useState<{ dataAgendada: string; horaInicio: string; horaFim: string }[]>(
    datasPreSelecionadas.map((d) => ({ dataAgendada: d, horaInicio: '08:00', horaFim: '10:00' }))
  );
  const [idPesquisa, setIdPesquisa] = useState('');
  const [pesquisas, setPesquisas] = useState<PesquisaResumo[]>([]);
  const [buscaPesquisa, setBuscaPesquisa] = useState('');
  const [showPesquisaList, setShowPesquisaList] = useState(false);
  const [contexto, setContexto] = useState<ContextoAgendamento>('academico');
  const [objetivo, setObjetivo] = useState('');
  const [ensaios, setEnsaios] = useState<string[]>(['teor_umidade']);
  const [itens, setItens] = useState<string[]>([]);
  const [itemStatuses, setItemStatuses] = useState<ItemStatus[]>([]);
  const [showEnsaioPicker, setShowEnsaioPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (usuario) {
      PesquisaService.listarPorUsuario(usuario.userId).then(setPesquisas).catch(() => {});
    }
  }, [usuario]);

  useEffect(() => {
    if (itens.length > 0) {
      ItemVerificacaoService.obterStatusItens(itens).then(setItemStatuses).catch(() => {});
    } else {
      setItemStatuses([]);
    }
  }, [itens]);

  const pesquisasFiltradas = pesquisas.filter((p) =>
    p.titulo.toLowerCase().includes(buscaPesquisa.toLowerCase()) && p.status === 'em_andamento'
  );

  const adicionarEnsaio = (tipo: string) => {
    if (!ensaios.includes(tipo)) setEnsaios([...ensaios, tipo]);
    setShowEnsaioPicker(false);
  };

  const removerEnsaio = (tipo: string) => setEnsaios(ensaios.filter((e) => e !== tipo));

  const atualizarData = (idx: number, campo: 'horaInicio' | 'horaFim', valor: string) => {
    setDatas((prev) => prev.map((d, i) => (i === idx ? { ...d, [campo]: valor } : d)));
  };

  const removerData = (idx: number) => setDatas((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!idPesquisa || !objetivo.trim() || ensaios.length === 0 || datas.length === 0 || !usuario) return;
    setSaving(true);
    try {
      const dados: SolicitarAgendamentoDTO = {
        idPesquisa,
        objetivo: objetivo.trim(),
        contexto,
        datas,
        ensaios: ensaios.map((t) => ({ tipoEnsaio: t })),
        itens: itens.length > 0 ? itens : undefined,
      };
      await AgendamentoService.solicitar(dados, usuario.userId);
      setToastMsg('Agendamento solicitado com sucesso!');
      setShowToast(true);
      setTimeout(() => history.replace('/app/agendamentos'), 800);
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao solicitar.');
      setShowToast(true);
    }
    setSaving(false);
  };

  return (
    <IonPage>
      <AppBar title="Solicitar Agendamento" />
      <IonContent>
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>
            Datas Selecionadas ({datas.length})
          </div>
          {datas.map((d, i) => (
            <DateCard
              key={i}
              data={d.dataAgendada}
              horaInicio={d.horaInicio}
              horaFim={d.horaFim}
              onHoraInicioChange={(v) => atualizarData(i, 'horaInicio', v)}
              onHoraFimChange={(v) => atualizarData(i, 'horaFim', v)}
              onRemove={() => removerData(i)}
            />
          ))}

          <IonItem lines="none"><IonLabel position="stacked">Pesquisa Vinculada *</IonLabel></IonItem>
          <div style={{ padding: '0 16px 8px', position: 'relative' }}>
            <div
              onClick={() => setShowPesquisaList(!showPesquisaList)}
              style={{
                padding: '10px 12px', borderRadius: 8, border: '1px solid var(--app-color-border)',
                backgroundColor: '#F5F5F5', fontSize: 14, cursor: 'pointer',
                color: idPesquisa ? 'var(--ion-color-dark)' : 'var(--ion-color-medium)',
              }}
            >
              {idPesquisa ? pesquisas.find((p) => p.id === idPesquisa)?.titulo || 'Pesquisa selecionada' : 'Selecione uma pesquisa'}
            </div>
            {showPesquisaList && (
              <div style={{ position: 'absolute', zIndex: 10, width: '100%', backgroundColor: 'var(--ion-background-color)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: 200, overflowY: 'auto' }}>
                <IonSearchbar value={buscaPesquisa} onIonInput={(e) => setBuscaPesquisa(e.detail.value || '')} debounce={200} />
                {pesquisasFiltradas.map((p) => (
                  <div key={p.id} onClick={() => { setIdPesquisa(p.id); setShowPesquisaList(false); setBuscaPesquisa(''); }}
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--app-color-border)', cursor: 'pointer', fontSize: 13 }}>
                    {p.titulo}
                  </div>
                ))}
              </div>
            )}
          </div>

          <IonItem>
            <IonLabel position="stacked">Contexto *</IonLabel>
            <IonSelect value={contexto} onIonChange={(e) => setContexto(e.detail.value)}>
              {CONTEXTO_OPCOES.map((op) => <IonSelectOption key={op.value} value={op.value}>{op.label}</IonSelectOption>)}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Objetivo/Descrição das Atividades *</IonLabel>
            <IonInput value={objetivo} onIonInput={(e) => setObjetivo(e.detail.value || '')} placeholder="Descreva as atividades que serão realizadas..." />
          </IonItem>

          <IonItem lines="none"><IonLabel position="stacked">Ensaios Planejados *</IonLabel></IonItem>
          <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ensaios.map((e) => (
              <IonChip key={e} outline style={{ fontSize: 12 }}>
                <IonLabel>{e.replace(/_/g, ' ')}</IonLabel>
                <IonIcon icon={closeOutline} onClick={(ev) => { ev.stopPropagation(); removerEnsaio(e); }} />
              </IonChip>
            ))}
            <IonChip color="primary" onClick={() => setShowEnsaioPicker(!showEnsaioPicker)}>
              <IonIcon icon={addOutline} /> Adicionar
            </IonChip>
          </div>
          {showEnsaioPicker && (
            <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TIPO_ENSAIO_OPCOES.filter((t) => !ensaios.includes(t)).map((t) => (
                <IonChip key={t} onClick={() => adicionarEnsaio(t)} style={{ fontSize: 12 }}>{t.replace(/_/g, ' ')}</IonChip>
              ))}
            </div>
          )}

          {itemStatuses.filter((s) => s.alerta).length > 0 && (
            <div style={{ padding: '8px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#C0392B', marginBottom: 6 }}>Alertas de Itens</div>
              {itemStatuses.filter((s) => s.alerta).map((s) => (
                <div key={s.id} style={{
                  padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                  backgroundColor: s.alerta!.includes('inoperante') || s.alerta!.includes('vencida') ? '#FADBD8' : '#FEF9E7',
                  borderLeft: `4px solid ${s.alerta!.includes('inoperante') || s.alerta!.includes('vencida') ? '#C0392B' : '#E6A817'}`,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{s.nome}</span>
                  <span style={{ fontSize: 11, color: 'var(--ion-color-medium)', display: 'block' }}>{s.alerta}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: '16px 8px' }}>
            <IonButton expand="block" onClick={handleSave} disabled={!idPesquisa || !objetivo.trim() || ensaios.length === 0 || datas.length === 0 || saving}>
              {saving ? <IonSpinner /> : 'Solicitar Agendamento'}
            </IonButton>
          </div>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default SolicitarAgendamentoPage;
