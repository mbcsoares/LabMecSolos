import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonSpinner, IonToast,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import AppBar from '../components/AppBar';
import CoordenadasGPS from '../components/CoordenadasGPS';
import { AmostragemService } from '../services/AmostragemService';
import { useAuth } from '../contexts/AuthContext';
import type { TipoAmostra, ClassificacaoAmostra, RegistrarAmostraBrutaDTO } from '../models/types';

const AmostraBrutaFormPage: React.FC = () => {
  const { pontoId, id } = useParams<{ pontoId?: string; id?: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const isEdicao = !!id;
  const [numeroCampo, setNumeroCampo] = useState('');
  const [tipoAmostra, setTipoAmostra] = useState<TipoAmostra>('deformada');
  const [classificacao, setClassificacao] = useState<ClassificacaoAmostra>('superficial');
  const [metodoColeta, setMetodoColeta] = useState('');
  const [operadorColeta, setOperadorColeta] = useState('');
  const [dataColeta, setDataColeta] = useState(new Date().toISOString().split('T')[0]);
  const [descricao, setDescricao] = useState('');
  const [coordenadasGps, setCoordenadasGps] = useState('');
  const [pesoBrutoCampo, setPesoBrutoCampo] = useState('');
  const [profundidadeColeta, setProfundidadeColeta] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [toastColor, setToastColor] = useState<string>('success');
  useEffect(() => {
    if (isEdicao && id) {
      AmostragemService.obterAmostraBruta(id).then((a) => {
        if (a) {
          setNumeroCampo(a.numero_identificacao_campo);
          setTipoAmostra(a.tipo_amostra);
          setClassificacao(a.classificacao || 'superficial');
          setMetodoColeta(a.metodo_coleta || '');
          setOperadorColeta(a.operador_coleta || '');
          setDataColeta(a.data_coleta);
          setCoordenadasGps(a.coordenadas_gps || '');
          setPesoBrutoCampo(a.peso_bruto_campo ? String(a.peso_bruto_campo) : '');
          setProfundidadeColeta(a.profundidade_coleta ? String(a.profundidade_coleta) : '');
          setDescricao(a.descricao || '');
        }
      }).catch(() => {});
      return;
    }
    if (!pontoId) return;
    AmostragemService.obterPontoColeta(pontoId).then((ponto) => {
      if (ponto?.coordenadas) setCoordenadasGps(ponto.coordenadas);
    }).catch(() => {});
    AmostragemService.listarAmostrasBrutas(pontoId).then((amostras) => {
      setNumeroCampo(`AB-${String(amostras.length + 1).padStart(3, '0')}`);
    }).catch(() => {});
  }, [id, pontoId]);

  const handleSave = async () => {
    if (!numeroCampo.trim() || !usuario) return;
    if (!isEdicao && !pontoId) return;
    setSaving(true);
    try {
      if (isEdicao && id) {
        const dados: RegistrarAmostraBrutaDTO = {
          idPontoColeta: '', tipoAmostra, classificacao, dataColeta,
          numeroIdentificacaoCampo: numeroCampo.trim(), metodoColeta: metodoColeta.trim() || undefined,
          operadorColeta: operadorColeta.trim() || undefined,
          profundidadeColeta: profundidadeColeta ? parseFloat(profundidadeColeta) : undefined,
          descricao: descricao.trim() || undefined,
          coordenadasGps: coordenadasGps.trim() || undefined,
          pesoBrutoCampo: pesoBrutoCampo ? parseFloat(pesoBrutoCampo) : undefined,
        };
        await AmostragemService.editarAmostraBruta(id, dados, usuario.userId);
        setToastColor('success'); setToastMsg('Amostra atualizada.');
        setShowToast(true);
      } else {
        const dados: RegistrarAmostraBrutaDTO = {
          idPontoColeta: pontoId!,
          numeroIdentificacaoCampo: numeroCampo.trim(),
          tipoAmostra,
          classificacao,
          metodoColeta: metodoColeta.trim() || undefined,
          operadorColeta: operadorColeta.trim() || undefined,
          dataColeta,
          descricao: descricao.trim() || undefined,
          coordenadasGps: coordenadasGps.trim() || undefined,
          pesoBrutoCampo: pesoBrutoCampo ? parseFloat(pesoBrutoCampo) : undefined,
          profundidadeColeta: profundidadeColeta ? parseFloat(profundidadeColeta) : undefined,
        };
        const novaAmostra = await AmostragemService.registrarAmostraBruta(dados, usuario.userId);

        setToastColor('success'); setToastMsg('Amostra bruta registrada.');
        setShowToast(true);
      }
      setTimeout(() => history.goBack(), 800);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setToastMsg(err.message || 'Erro ao registrar amostra.');
      setShowToast(true);
    }
    setSaving(false);
  };

  const handleFinalizar = async () => {
    if (!numeroCampo.trim() || !usuario) return;
    if (!isEdicao && !pontoId) return;
    setSaving(true);
    try {
      if (isEdicao && id) {
        const dados: RegistrarAmostraBrutaDTO = { idPontoColeta: '', tipoAmostra, classificacao, dataColeta, numeroIdentificacaoCampo: numeroCampo.trim(), metodoColeta: metodoColeta.trim() || undefined, operadorColeta: operadorColeta.trim() || undefined, profundidadeColeta: profundidadeColeta ? parseFloat(profundidadeColeta) : undefined, descricao: descricao.trim() || undefined, coordenadasGps: coordenadasGps.trim() || undefined, pesoBrutoCampo: pesoBrutoCampo ? parseFloat(pesoBrutoCampo) : undefined };
        await AmostragemService.editarAmostraBruta(id, dados, usuario.userId);
        await AmostragemService.finalizarAmostraBruta(id, usuario.userId);
        setToastColor('success'); setToastMsg('Salvo e finalizado.');
      } else {
        const dados: RegistrarAmostraBrutaDTO = { idPontoColeta: pontoId!, tipoAmostra, classificacao, dataColeta, numeroIdentificacaoCampo: numeroCampo.trim(), metodoColeta: metodoColeta.trim() || undefined, operadorColeta: operadorColeta.trim() || undefined, profundidadeColeta: profundidadeColeta ? parseFloat(profundidadeColeta) : undefined, descricao: descricao.trim() || undefined, coordenadasGps: coordenadasGps.trim() || undefined, pesoBrutoCampo: pesoBrutoCampo ? parseFloat(pesoBrutoCampo) : undefined };
        const novo = await AmostragemService.registrarAmostraBruta(dados, usuario.userId);
        await AmostragemService.finalizarAmostraBruta(novo.id, usuario.userId);
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
      <AppBar title={isEdicao ? 'Editar Amostra Bruta' : 'Registrar Amostra Bruta'} />
      <IonContent>
        <div style={{ padding: 16 }}>
          <IonItem><IonLabel position="stacked">Número de Campo *</IonLabel><IonInput value={numeroCampo} onIonInput={(e) => setNumeroCampo(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Tipo de Amostra *</IonLabel>
            <IonSelect value={tipoAmostra} onIonChange={(e) => setTipoAmostra(e.detail.value)}>
              <IonSelectOption value="deformada">Deformada</IonSelectOption>
              <IonSelectOption value="indeformada">Indeformada</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem><IonLabel position="stacked">Classificação *</IonLabel>
            <IonSelect value={classificacao} onIonChange={(e) => setClassificacao(e.detail.value)}>
              <IonSelectOption value="superficial">Superficial</IonSelectOption>
              <IonSelectOption value="profunda">Profunda</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem><IonLabel position="stacked">Método de Coleta</IonLabel><IonInput value={metodoColeta} onIonInput={(e) => setMetodoColeta(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Operador da Coleta</IonLabel><IonInput value={operadorColeta} onIonInput={(e) => setOperadorColeta(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Data da Coleta *</IonLabel><IonInput type="date" value={dataColeta} onIonInput={(e) => setDataColeta(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Coordenadas GPS</IonLabel></IonItem>
          <div style={{ padding: '0 16px 8px' }}><CoordenadasGPS valor={coordenadasGps || null} onCapturar={setCoordenadasGps} /></div>
          <IonItem><IonLabel position="stacked">Peso Bruto em Campo</IonLabel><IonInput type="number" value={pesoBrutoCampo} onIonInput={(e) => setPesoBrutoCampo(e.detail.value || '')} placeholder="g" /></IonItem>
          <IonItem><IonLabel position="stacked">Profundidade da Coleta</IonLabel><IonInput type="number" value={profundidadeColeta} onIonInput={(e) => setProfundidadeColeta(e.detail.value || '')} placeholder="m" /></IonItem>
          <IonItem><IonLabel position="stacked">Descrição</IonLabel><IonInput value={descricao} onIonInput={(e) => setDescricao(e.detail.value || '')} /></IonItem>

          <div style={{ padding: '16px 8px', display: 'flex', gap: 8 }}>
            <IonButton expand="block" onClick={handleSave} disabled={!numeroCampo.trim() || saving} fill="outline" style={{ flex: 1 }}>
              {saving ? <IonSpinner /> : 'Salvar'}
            </IonButton>
            <IonButton expand="block" onClick={handleFinalizar} disabled={!numeroCampo.trim() || saving} fill="solid" style={{ flex: 1 }}>
              Finalizar
            </IonButton>
          </div>
        </div>

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default AmostraBrutaFormPage;