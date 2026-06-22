import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonSpinner, IonToast } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { AmostragemService } from '../services/AmostragemService';
import { useAuth } from '../contexts/AuthContext';
import type { TipoIndeformada, FormatoIndeformada, RegistrarIndeformadaDTO } from '../models/types';

const RegistrarIndeformadaPage: React.FC = () => {
  const { id: idAmostraBruta, indeformadaId } = useParams<{ id?: string; indeformadaId?: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const isEdicao = !!indeformadaId;
  const [numeroAmostra, setNumeroAmostra] = useState('');
  const [tipoIndeformada, setTipoIndeformada] = useState<TipoIndeformada>('shelby');
  const [formato, setFormato] = useState<FormatoIndeformada>('cilindrico');
  const [altura, setAltura] = useState('');
  const [largura, setLargura] = useState('');
  const [comprimento, setComprimento] = useState('');
  const [condicao, setCondicao] = useState('');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [toastColor, setToastColor] = useState<string>('success');
  useEffect(() => {
    if (isEdicao && indeformadaId) {
      AmostragemService.listarAmostrasIndeformadas('_').catch(() => {});
      AmostragemService.obterAmostraBruta('_').catch(() => {});
      return;
    }
    if (!idAmostraBruta) return;
    AmostragemService.listarAmostrasIndeformadas(idAmostraBruta).then((ais) => {
      setNumeroAmostra(`AI-${String(ais.length + 1).padStart(3, '0')}`);
    }).catch(() => {});
  }, [idAmostraBruta, indeformadaId]);

  const handleSave = async () => {
    if (!numeroAmostra.trim() || !usuario) return;
    if (!isEdicao && !idAmostraBruta) return;
    setSaving(true);
    try {
      const dados: RegistrarIndeformadaDTO = {
        idAmostraBruta: idAmostraBruta || '',
        numeroAmostra: numeroAmostra.trim(), tipoIndeformada, formato,
        altura: altura ? parseFloat(altura) : undefined,
        largura: largura ? parseFloat(largura) : undefined,
        comprimento: comprimento ? parseFloat(comprimento) : undefined,
        condicao: condicao.trim() || undefined, observacoes: obs.trim() || undefined,
      };
      if (isEdicao && indeformadaId) {
        await AmostragemService.editarIndeformada(indeformadaId, dados, usuario.userId);
        setToastColor('success'); setToastMsg('Amostra indeformada atualizada.');
      } else {
        await AmostragemService.registrarIndeformada(dados, usuario.userId);
        setToastColor('success'); setToastMsg('Amostra indeformada registrada.');
      }
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) {
      setToastColor('danger'); setToastMsg(e.message || 'Erro ao registrar.');
      setShowToast(true);
    }
    setSaving(false);
  };

  const handleFinalizar = async () => {
    if (!numeroAmostra.trim() || !usuario) return;
    if (!isEdicao && !idAmostraBruta) return;
    setSaving(true);
    try {
      const dados: RegistrarIndeformadaDTO = { idAmostraBruta: idAmostraBruta || '', numeroAmostra: numeroAmostra.trim(), tipoIndeformada, formato, altura: altura ? parseFloat(altura) : undefined, largura: largura ? parseFloat(largura) : undefined, comprimento: comprimento ? parseFloat(comprimento) : undefined, condicao: condicao.trim() || undefined, observacoes: obs.trim() || undefined };
      if (isEdicao && indeformadaId) {
        await AmostragemService.editarIndeformada(indeformadaId, dados, usuario.userId);
        await AmostragemService.finalizarIndeformada(indeformadaId, usuario.userId);
        setToastColor('success'); setToastMsg('Salvo e finalizado.');
      } else {
        const novo = await AmostragemService.registrarIndeformada(dados, usuario.userId);
        await AmostragemService.finalizarIndeformada(novo.id, usuario.userId);
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
      <AppBar title={isEdicao ? 'Editar Amostra Indeformada' : 'Registrar Amostra Indeformada'} />
      <IonContent>
        <div style={{ padding: 16 }}>
          <IonItem><IonLabel position="stacked">Número da Amostra *</IonLabel><IonInput value={numeroAmostra} onIonInput={(e) => setNumeroAmostra(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Tipo *</IonLabel>
            <IonSelect value={tipoIndeformada} onIonChange={(e) => setTipoIndeformada(e.detail.value)}>
              <IonSelectOption value="shelby">Shelby</IonSelectOption>
              <IonSelectOption value="bloco">Bloco</IonSelectOption>
              <IonSelectOption value="anel">Anel</IonSelectOption>
              <IonSelectOption value="outro">Outro</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem><IonLabel position="stacked">Formato</IonLabel>
            <IonSelect value={formato} onIonChange={(e) => setFormato(e.detail.value)}>
              <IonSelectOption value="cilindrico">Cilíndrico</IonSelectOption>
              <IonSelectOption value="cubico">Cúbico</IonSelectOption>
              <IonSelectOption value="prismatico">Prismático</IonSelectOption>
              <IonSelectOption value="irregular">Irregular</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem><IonLabel position="stacked">Altura (mm)</IonLabel><IonInput type="number" value={altura} onIonInput={(e) => setAltura(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Largura (mm)</IonLabel><IonInput type="number" value={largura} onIonInput={(e) => setLargura(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Comprimento (mm)</IonLabel><IonInput type="number" value={comprimento} onIonInput={(e) => setComprimento(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Condição</IonLabel><IonInput value={condicao} onIonInput={(e) => setCondicao(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Observações</IonLabel><IonInput value={obs} onIonInput={(e) => setObs(e.detail.value || '')} /></IonItem>
          <div style={{ padding: '16px 8px', display: 'flex', gap: 8 }}>
            <IonButton expand="block" onClick={handleSave} disabled={!numeroAmostra.trim() || saving} fill="outline" style={{ flex: 1 }}>
              {saving ? <IonSpinner /> : 'Salvar'}
            </IonButton>
            <IonButton expand="block" onClick={handleFinalizar} disabled={!numeroAmostra.trim() || saving} fill="solid" style={{ flex: 1 }}>
              Finalizar
            </IonButton>
          </div>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default RegistrarIndeformadaPage;