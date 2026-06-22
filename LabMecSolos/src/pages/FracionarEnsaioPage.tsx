import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonSpinner, IonToast } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { AmostragemService } from '../services/AmostragemService';
import { useAuth } from '../contexts/AuthContext';
import type { TipoEnsaioDestino, FracionarDTO } from '../models/types';

const TIPO_ENSAIO_OPCOES: { value: TipoEnsaioDestino; label: string }[] = [
  { value: 'teor_umidade', label: 'Teor de Umidade' },
  { value: 'granulometria', label: 'Granulometria' },
  { value: 'compactacao', label: 'Compactação' },
  { value: 'limite_liquidez', label: 'Limite de Liquidez' },
  { value: 'limite_plasticidade', label: 'Limite de Plasticidade' },
  { value: 'cisalhamento_direto', label: 'Cisalhamento Direto' },
  { value: 'adensamento', label: 'Adensamento' },
  { value: 'triaxial', label: 'Triaxial' },
  { value: 'outro', label: 'Outro' },
];

const FracionarEnsaioPage: React.FC = () => {
  const { id, ensaiadaId } = useParams<{ id?: string; ensaiadaId?: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const isEdicao = !!ensaiadaId;
  const [idAmostraPreparada, setIdAmostraPreparada] = useState(id);
  const [numeroAmostra, setNumeroAmostra] = useState('');
  const [tipoEnsaioDestino, setTipoEnsaioDestino] = useState<TipoEnsaioDestino>('teor_umidade');
  const [qtdInicial, setQtdInicial] = useState('');
  const [descricao, setDescricao] = useState('');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [toastColor, setToastColor] = useState<string>('success');
  useEffect(() => {
    if (isEdicao && ensaiadaId) return;
    if (!id) return;
    AmostragemService.listarAmostrasEnsaiadas(id).then((aes) => {
      if (aes.length >= 0) setNumeroAmostra(`AF-${String(aes.length + 1).padStart(3, '0')}`);
    }).catch(() => {});
    setIdAmostraPreparada(id);
  }, [id, ensaiadaId]);

  const handleSave = async () => {
    if (!numeroAmostra.trim() || !qtdInicial || !usuario) return;
    if (!isEdicao && !idAmostraPreparada) return;
    setSaving(true);
    try {
      const dados: FracionarDTO = {
        idAmostraPreparada: idAmostraPreparada || '',
        numeroAmostra: numeroAmostra.trim(), tipoEnsaioDestino,
        quantidadeInicial: parseFloat(qtdInicial),
        descricao: descricao.trim() || undefined, observacoes: obs.trim() || undefined,
      };
      if (isEdicao && ensaiadaId) {
        await AmostragemService.editarEnsaiada(ensaiadaId, dados, usuario.userId);
        setToastColor('success'); setToastMsg('Fracionamento atualizado.');
      } else {
        await AmostragemService.fracionarAmostra(dados, usuario.userId);
        setToastColor('success'); setToastMsg('Fracionamento registrado.');
      }
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) {
      setToastColor('danger'); setToastMsg(e.message || 'Erro ao fracionar.');
      setShowToast(true);
    }
    setSaving(false);
  };

  const handleFinalizar = async () => {
    if (!numeroAmostra.trim() || !qtdInicial || !usuario) return;
    if (!isEdicao && !idAmostraPreparada) return;
    setSaving(true);
    try {
      const dados: FracionarDTO = { idAmostraPreparada: idAmostraPreparada || '', numeroAmostra: numeroAmostra.trim(), tipoEnsaioDestino, quantidadeInicial: parseFloat(qtdInicial), descricao: descricao.trim() || undefined, observacoes: obs.trim() || undefined };
      if (isEdicao && ensaiadaId) {
        await AmostragemService.editarEnsaiada(ensaiadaId, dados, usuario.userId);
        await AmostragemService.finalizarEnsaiada(ensaiadaId, usuario.userId);
        setToastColor('success'); setToastMsg('Salvo e finalizado.');
      } else {
        const novo = await AmostragemService.fracionarAmostra(dados, usuario.userId);
        await AmostragemService.finalizarEnsaiada(novo.id, usuario.userId);
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
      <AppBar title={isEdicao ? 'Editar Fracionamento' : 'Fracionar para Ensaio'} />
      <IonContent>
        <div style={{ padding: 16 }}>
          <IonItem><IonLabel position="stacked">Número da Amostra *</IonLabel><IonInput value={numeroAmostra} onIonInput={(e) => setNumeroAmostra(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Tipo de Ensaio Destino *</IonLabel>
            <IonSelect value={tipoEnsaioDestino} onIonChange={(e) => setTipoEnsaioDestino(e.detail.value)}>
              {TIPO_ENSAIO_OPCOES.map((op) => <IonSelectOption key={op.value} value={op.value}>{op.label}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
          <IonItem><IonLabel position="stacked">Quantidade Inicial *</IonLabel><IonInput type="number" value={qtdInicial} onIonInput={(e) => setQtdInicial(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Descrição</IonLabel><IonInput value={descricao} onIonInput={(e) => setDescricao(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Observações</IonLabel><IonInput value={obs} onIonInput={(e) => setObs(e.detail.value || '')} /></IonItem>
          <div style={{ padding: '16px 8px', display: 'flex', gap: 8 }}>
            <IonButton expand="block" onClick={handleSave} disabled={!numeroAmostra.trim() || !qtdInicial || saving} fill="outline" style={{ flex: 1 }}>
              {saving ? <IonSpinner /> : 'Salvar'}
            </IonButton>
            <IonButton expand="block" onClick={handleFinalizar} disabled={!numeroAmostra.trim() || !qtdInicial || saving} fill="solid" style={{ flex: 1 }}>
              Finalizar
            </IonButton>
          </div>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default FracionarEnsaioPage;