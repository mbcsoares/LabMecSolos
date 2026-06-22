import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton, IonSpinner, IonToast,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import AppBar from '../components/AppBar';
import CoordenadasGPS from '../components/CoordenadasGPS';
import { AmostragemService } from '../services/AmostragemService';
import { useAuth } from '../contexts/AuthContext';
import type { CriarPontoDTO } from '../models/types';

const PontoColetaFormPage: React.FC = () => {
  const { programaId, pontoId } = useParams<{ programaId?: string; pontoId?: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const isEdicao = !!pontoId;
  const [identificacaoPlano, setIdentificacaoPlano] = useState('');
  const [coordenadas, setCoordenadas] = useState('');
  const [descricaoLocal, setDescricaoLocal] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [toastColor, setToastColor] = useState<string>('success');
  useEffect(() => {
    if (isEdicao && pontoId) {
      AmostragemService.obterPontoColeta(pontoId).then((p) => {
        if (p) {
          setIdentificacaoPlano(p.identificacao_plano);
          setCoordenadas(p.coordenadas || '');
          setDescricaoLocal(p.descricao_local || '');
          setProgramaId(p.id_programa_amostragem);
        }
      }).catch(() => {});
      return;
    }
    if (!programaId) return;
    AmostragemService.listarPontosColeta(programaId).then((pts) => {
      setIdentificacaoPlano(`PT-${String(pts.length + 1).padStart(3, '0')}`);
    }).catch(() => {});
  }, [programaId, pontoId]);

  const [programaIdState, setProgramaId] = useState(programaId || '');

  const handleSave = async () => {
    if (!identificacaoPlano.trim() || !usuario) return;
    if (!isEdicao && !programaIdState) return;
    setSaving(true);
    try {
      if (isEdicao && pontoId) {
        await AmostragemService.editarPontoColeta(pontoId, { identificacaoPlano, coordenadas: coordenadas.trim() || undefined, descricaoLocal: descricaoLocal.trim() || undefined }, usuario.userId);
        setToastColor('success'); setToastMsg('Ponto de coleta atualizado.');
      } else {
        const dados: CriarPontoDTO = { idProgramaAmostragem: programaIdState, identificacaoPlano: identificacaoPlano.trim(), coordenadas: coordenadas.trim() || undefined, descricaoLocal: descricaoLocal.trim() || undefined };
        await AmostragemService.criarPontoColeta(dados, usuario.userId);
        setToastColor('success'); setToastMsg('Ponto de coleta criado.');
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
    if (!identificacaoPlano.trim() || !usuario) return;
    if (!isEdicao && !programaIdState) return;
    setSaving(true);
    try {
      if (isEdicao && pontoId) {
        await AmostragemService.editarPontoColeta(pontoId, { identificacaoPlano, coordenadas: coordenadas.trim() || undefined, descricaoLocal: descricaoLocal.trim() || undefined }, usuario.userId);
        await AmostragemService.finalizarPontoColeta(pontoId, usuario.userId);
        setToastColor('success'); setToastMsg('Salvo e finalizado.');
      } else {
        const dados: CriarPontoDTO = { idProgramaAmostragem: programaIdState, identificacaoPlano: identificacaoPlano.trim(), coordenadas: coordenadas.trim() || undefined, descricaoLocal: descricaoLocal.trim() || undefined };
        const novo = await AmostragemService.criarPontoColeta(dados, usuario.userId);
        await AmostragemService.finalizarPontoColeta(novo.id, usuario.userId);
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
      <AppBar title={isEdicao ? 'Editar Ponto de Coleta' : 'Novo Ponto de Coleta'} />
      <IonContent>
        <div style={{ padding: 16 }}>
          <IonItem><IonLabel position="stacked">Identificacao no Plano *</IonLabel><IonInput value={identificacaoPlano} onIonInput={(e) => setIdentificacaoPlano(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Coordenadas</IonLabel></IonItem>
          <div style={{ padding: '0 16px 8px' }}><CoordenadasGPS valor={coordenadas || null} onCapturar={setCoordenadas} /></div>
          <IonItem><IonLabel position="stacked">Descricao do Local</IonLabel><IonInput value={descricaoLocal} onIonInput={(e) => setDescricaoLocal(e.detail.value || '')} /></IonItem>
          <div style={{ padding: '16px 8px', display: 'flex', gap: 8 }}>
            <IonButton expand="block" onClick={handleSave} disabled={!identificacaoPlano.trim() || saving} fill="outline" style={{ flex: 1 }}>
              {saving ? <IonSpinner /> : 'Salvar'}
            </IonButton>
            <IonButton expand="block" onClick={handleFinalizar} disabled={!identificacaoPlano.trim() || saving} fill="solid" style={{ flex: 1 }}>
              Finalizar
            </IonButton>
          </div>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default PontoColetaFormPage;