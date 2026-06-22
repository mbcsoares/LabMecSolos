import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonSpinner, IonToast,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { AmostragemService } from '../services/AmostragemService';
import { useAuth } from '../contexts/AuthContext';
import type { MetodoPreparo, MetodoSecagem, PrepararAmostraDTO } from '../models/types';

const PrepararAmostraPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [idAmostraBruta, setIdAmostraBruta] = useState(id);
  const [numeroAmostra, setNumeroAmostra] = useState('');
  const [normatizacao, setNormatizacao] = useState('');
  const [metodoPreparo, setMetodoPreparo] = useState<MetodoPreparo>('sem_secagem_previa');
  const [metodoSecagem, setMetodoSecagem] = useState<MetodoSecagem>('ao_ar');
  const [dataPreparo, setDataPreparo] = useState(new Date().toISOString().split('T')[0]);
  const [qtdPre, setQtdPre] = useState('');
  const [qtdPos, setQtdPos] = useState('');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [toastColor, setToastColor] = useState<string>('success');
  useEffect(() => {
    if (!id) return;
    AmostragemService.obterAmostraPreparada(id).then((ap) => {
      if (ap) {
        setEditingId(id);
        setIdAmostraBruta(ap.id_amostra_bruta);
        setNumeroAmostra(ap.numero_amostra);
        setNormatizacao(ap.normatizacao || '');
        setMetodoPreparo(ap.metodo_preparo);
        setMetodoSecagem(ap.metodo_secagem);
        setDataPreparo(ap.data_preparo);
        setQtdPre(String(ap.quantidade_pre_quarteamento));
        setQtdPos(String(ap.quantidade_pos_quarteamento));
        setObs(ap.observacoes || '');
        return;
      }
      AmostragemService.listarAmostrasPreparadas(id).then((aps) => {
        setNumeroAmostra(`AP-${String(aps.length + 1).padStart(3, '0')}`);
      }).catch(() => {});
    }).catch(() => {
      AmostragemService.listarAmostrasPreparadas(id).then((aps) => {
        setNumeroAmostra(`AP-${String(aps.length + 1).padStart(3, '0')}`);
      }).catch(() => {});
    });
  }, [id]);

  const handleSave = async () => {
    if (!numeroAmostra.trim() || !qtdPre || !qtdPos || !usuario || !idAmostraBruta) return;
    setSaving(true);
    try {
      const dados: PrepararAmostraDTO = {
        idAmostraBruta, numeroAmostra: numeroAmostra.trim(), normatizacao: normatizacao.trim() || undefined,
        metodoPreparo, metodoSecagem, dataPreparo, idResponsavelPreparo: usuario.userId,
        quantidadePreQuarteamento: parseFloat(qtdPre), quantidadePosQuarteamento: parseFloat(qtdPos),
        observacoes: obs.trim() || undefined,
      };
      if (editingId) {
        await AmostragemService.editarPreparada(editingId, dados, usuario.userId);
        setToastColor('success'); setToastMsg('Amostra preparada atualizada.');
      } else {
        await AmostragemService.prepararAmostra(dados, usuario.userId);
        setToastColor('success'); setToastMsg('Amostra preparada com sucesso.');
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
    if (!numeroAmostra.trim() || !qtdPre || !qtdPos || !usuario || !idAmostraBruta) return;
    setSaving(true);
    try {
      const dados: PrepararAmostraDTO = { idAmostraBruta, numeroAmostra: numeroAmostra.trim(), normatizacao: normatizacao.trim() || undefined, metodoPreparo, metodoSecagem, dataPreparo, idResponsavelPreparo: usuario.userId, quantidadePreQuarteamento: parseFloat(qtdPre), quantidadePosQuarteamento: parseFloat(qtdPos), observacoes: obs.trim() || undefined };
      if (editingId) {
        await AmostragemService.editarPreparada(editingId, dados, usuario.userId);
        await AmostragemService.finalizarPreparada(editingId, usuario.userId);
        setToastColor('success'); setToastMsg('Salvo e finalizado.');
      } else {
        const novo = await AmostragemService.prepararAmostra(dados, usuario.userId);
        await AmostragemService.finalizarPreparada(novo.id, usuario.userId);
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
      <AppBar title={editingId ? 'Editar Amostra Preparada' : 'Preparar Amostra'} />
      <IonContent>
        <div style={{ padding: 16 }}>
          <IonItem><IonLabel position="stacked">Número da Amostra *</IonLabel><IonInput value={numeroAmostra} onIonInput={(e) => setNumeroAmostra(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Método de Preparo *</IonLabel>
            <IonSelect value={metodoPreparo} onIonChange={(e) => setMetodoPreparo(e.detail.value)}>
              <IonSelectOption value="sem_secagem_previa">Sem Secagem Prévia</IonSelectOption>
              <IonSelectOption value="com_secagem_previa">Com Secagem Prévia</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem><IonLabel position="stacked">Método de Secagem</IonLabel>
            <IonSelect value={metodoSecagem} onIonChange={(e) => setMetodoSecagem(e.detail.value)}>
              <IonSelectOption value="ao_ar">Ao Ar</IonSelectOption>
              <IonSelectOption value="estufa_60c">Estufa 60°C</IonSelectOption>
              <IonSelectOption value="outro">Outro</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem><IonLabel position="stacked">Data do Preparo *</IonLabel><IonInput type="date" value={dataPreparo} onIonInput={(e) => setDataPreparo(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Normatização</IonLabel><IonInput value={normatizacao} onIonInput={(e) => setNormatizacao(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Qtd Pré-Quarteamento *</IonLabel><IonInput type="number" value={qtdPre} onIonInput={(e) => setQtdPre(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Qtd Pós-Quarteamento *</IonLabel><IonInput type="number" value={qtdPos} onIonInput={(e) => setQtdPos(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Observações</IonLabel><IonInput value={obs} onIonInput={(e) => setObs(e.detail.value || '')} /></IonItem>
          <div style={{ padding: '16px 8px', display: 'flex', gap: 8 }}>
            <IonButton expand="block" onClick={handleSave} disabled={!numeroAmostra.trim() || !qtdPre || !qtdPos || saving} fill="outline" style={{ flex: 1 }}>
              {saving ? <IonSpinner /> : 'Salvar'}
            </IonButton>
            <IonButton expand="block" onClick={handleFinalizar} disabled={!numeroAmostra.trim() || !qtdPre || !qtdPos || saving} fill="solid" style={{ flex: 1 }}>
              Finalizar
            </IonButton>
          </div>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default PrepararAmostraPage;