import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonSpinner, IonToast,
} from '@ionic/react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import AppBar from '../components/AppBar';
import CoordenadasGPS from '../components/CoordenadasGPS';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';
import { AmostragemService } from '../services/AmostragemService';
import type { ObjetivoPrograma, CriarProgramaDTO } from '../models/types';

const OBJETIVO_OPCOES: { value: ObjetivoPrograma; label: string }[] = [
  { value: 'investigacao_exploratoria', label: 'Investigacao Exploratoria' },
  { value: 'investigacao_confirmatoria', label: 'Investigacao Confirmatoria' },
  { value: 'investigacao_detalhada', label: 'Investigacao Detalhada' },
  { value: 'remediacao', label: 'Remediacao' },
  { value: 'outro', label: 'Outro' },
];

const ProgramaFormPage: React.FC = () => {
  const location = useLocation();
  const { programaId } = useParams<{ programaId?: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const isEdicao = !!programaId;
  const queryParams = new URLSearchParams(location.search);
  const idPesquisa = queryParams.get('pesquisa') || '';
  const [objetivo, setObjetivo] = useState<ObjetivoPrograma>('investigacao_exploratoria');
  const [enderecoColeta, setEnderecoColeta] = useState('');
  const [coordenadas, setCoordenadas] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [toastColor, setToastColor] = useState<string>('success');
  useEffect(() => {
    if (!isEdicao || !programaId) return;
    AmostragemService.obterPrograma(programaId).then((p) => {
      if (p) {
        setObjetivo(p.objetivo);
        setEnderecoColeta(p.endereco_coleta || '');
        setCoordenadas(p.coordenadas || '');
        setDescricao(p.descricao || '');
      }
    }).catch(() => {});
  }, [programaId]);

  const handleSave = async () => {
    if (!usuario) return;
    if (!isEdicao && !idPesquisa) return;
    setSaving(true);
    try {
      if (isEdicao && programaId) {
        await AmostragemService.editarPrograma(programaId, { objetivo, enderecoColeta: enderecoColeta.trim() || undefined, coordenadas: coordenadas.trim() || undefined, descricao: descricao.trim() || undefined }, usuario.userId);
        setToastColor('success'); setToastMsg('Programa atualizado.');
      } else {
        const dados: CriarProgramaDTO = { idPesquisa, objetivo, enderecoColeta: enderecoColeta.trim() || undefined, coordenadas: coordenadas.trim() || undefined, descricao: descricao.trim() || undefined };
        await AmostragemService.criarPrograma(dados, usuario.userId);
        setToastColor('success'); setToastMsg('Programa criado.');
      }
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) {
      setToastColor('danger'); setToastMsg(e.message || 'Erro ao salvar.');
      setShowToast(true);
    }
    setSaving(false);
  };

  const handleFinalizar = async () => {
    if (!objetivo || !usuario) return;
    if (!isEdicao && !idPesquisa) return;
    setSaving(true);
    try {
      const dados = { objetivo, enderecoColeta: enderecoColeta.trim() || undefined, coordenadas: coordenadas.trim() || undefined, descricao: descricao.trim() || undefined };
      if (isEdicao && programaId) {
        await AmostragemService.editarPrograma(programaId, dados, usuario.userId);
        await AmostragemService.finalizarPrograma(programaId, usuario.userId);
        setToastColor('success'); setToastMsg('Salvo e finalizado.');
      } else {
        const novo = await AmostragemService.criarPrograma({ idPesquisa, ...dados } as CriarProgramaDTO, usuario.userId);
        await AmostragemService.finalizarPrograma(novo.id, usuario.userId);
        setToastColor('success'); setToastMsg('Criado e finalizado.');
      }
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) {
      setToastColor('danger'); setToastMsg(e.message || 'Erro ao finalizar.');
      setShowToast(true);
    }
    setSaving(false);
  };

  return (
    <IonPage>
      <AppBar title={isEdicao ? 'Editar Programa' : 'Novo Programa'} />
      <IonContent>
        <div style={{ padding: 16 }}>
          <IonItem><IonLabel position="stacked">Objetivo *</IonLabel>
            <IonSelect value={objetivo} onIonChange={(e) => setObjetivo(e.detail.value)}>
              {OBJETIVO_OPCOES.map((o) => <IonSelectOption key={o.value} value={o.value}>{o.label}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
          <IonItem><IonLabel position="stacked">Endereco de Coleta</IonLabel><IonInput value={enderecoColeta} onIonInput={(e) => setEnderecoColeta(e.detail.value || '')} /></IonItem>
          <IonItem lines="none"><IonLabel position="stacked">Coordenadas</IonLabel></IonItem>
          <div style={{ padding: '0 16px 8px' }}><CoordenadasGPS valor={coordenadas || null} onCapturar={setCoordenadas} /></div>
          <IonItem><IonLabel position="stacked">Descricao</IonLabel><IonInput value={descricao} onIonInput={(e) => setDescricao(e.detail.value || '')} /></IonItem>
          <div style={{ padding: '16px 8px', display: 'flex', gap: 8 }}>
            <IonButton expand="block" onClick={handleSave} disabled={saving} fill="outline" style={{ flex: 1 }}>
              {saving ? <IonSpinner /> : 'Salvar'}
            </IonButton>
            <IonButton expand="block" onClick={handleFinalizar} disabled={!objetivo || saving} fill="solid" style={{ flex: 1 }}>
              Finalizar
            </IonButton>
          </div>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default ProgramaFormPage;