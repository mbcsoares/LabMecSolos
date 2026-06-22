import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonSpinner, IonToast } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { useAuth } from '../contexts/AuthContext';
import { PesquisaService } from '../services/PesquisaService';
import StatusBadge from '../components/StatusBadge';
import type { ContextoPesquisa, CriarPesquisaDTO, EditarPesquisaDTO } from '../models/types';

const CONTEXTO_OPCOES: { value: ContextoPesquisa; label: string }[] = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'pesquisa_cientifica', label: 'Pesquisa Científica' },
  { value: 'academico', label: 'Acadêmico' },
  { value: 'outro', label: 'Outro' },
];

const PesquisaFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const isEdicao = !!id;
  const [loading, setLoading] = useState(isEdicao);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [contexto, setContexto] = useState<ContextoPesquisa>('outro');
  const [descricaoContexto, setDescricaoContexto] = useState('');
  const [saving, setSaving] = useState(false);
  const [finalizado, setFinalizado] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (!isEdicao || !id) return;
    PesquisaService.obterPorId(id).then((p) => {
      if (p) {
        setTitulo(p.titulo);
        setDescricao(p.descricao || '');
        setContexto(p.contexto);
        setDescricaoContexto(p.descricao_contexto || '');
        setFinalizado((p as any).finalizado || 0);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!titulo.trim() || !usuario) return;
    setSaving(true);
    try {
      if (isEdicao && id) {
        const dados: EditarPesquisaDTO = { titulo: titulo.trim(), contexto, descricao: descricao.trim() || undefined, descricaoContexto: descricaoContexto.trim() || undefined };
        await PesquisaService.editar(id, dados, usuario.userId);
        setToastMsg('Pesquisa atualizada.');
      } else {
        const dados: CriarPesquisaDTO = { titulo: titulo.trim(), contexto, descricao: descricao.trim() || undefined, descricaoContexto: descricaoContexto.trim() || undefined };
        await PesquisaService.criar(dados, usuario.userId);
        setToastMsg('Pesquisa criada com sucesso.');
      }
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao salvar pesquisa.');
      setShowToast(true);
    }
    setSaving(false);
  };

  const handleFinalizar = async () => {
    if (!titulo.trim() || !usuario) return;
    setSaving(true);
    try {
      let pesquisaId = id;

      if (isEdicao && id) {
        await PesquisaService.editar(id, { titulo: titulo.trim(), contexto, descricao: descricao.trim() || undefined, descricaoContexto: descricaoContexto.trim() || undefined }, usuario.userId);
      } else {
        const nova = await PesquisaService.criar({ titulo: titulo.trim(), contexto, descricao: descricao.trim() || undefined, descricaoContexto: descricaoContexto.trim() || undefined }, usuario.userId);
        pesquisaId = nova.id;
      }

      if (pesquisaId) {
        await PesquisaService.finalizarPesquisa(pesquisaId, usuario.userId);
      }

      setFinalizado(1);
      setToastMsg('Pesquisa salva e finalizada.');
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao finalizar.');
      setShowToast(true);
    }
    setSaving(false);
  };

  const podeEditar = finalizado !== 1;

  if (loading) {
    return (
      <IonPage><AppBar title="Pesquisa" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>
    );
  }

  return (
    <IonPage>
      <AppBar title={isEdicao ? 'Editar Pesquisa' : 'Nova Pesquisa'} />
      <IonContent>
        <div style={{ padding: 16 }}>
          {finalizado === 1 && (
            <div style={{ marginBottom: 12 }}><StatusBadge status="success" label="Finalizado" /></div>
          )}

          <IonItem>
            <IonLabel position="stacked">Título *</IonLabel>
            <IonInput value={titulo} onIonInput={(e) => setTitulo(e.detail.value || '')} placeholder="Título da pesquisa" disabled={!podeEditar} />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Contexto *</IonLabel>
            <IonSelect value={contexto} onIonChange={(e) => setContexto(e.detail.value)} disabled={!podeEditar}>
              {CONTEXTO_OPCOES.map((op) => (
                <IonSelectOption key={op.value} value={op.value}>{op.label}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {contexto === 'outro' && (
            <IonItem>
              <IonLabel position="stacked">Descrição do Contexto</IonLabel>
              <IonInput value={descricaoContexto} onIonInput={(e) => setDescricaoContexto(e.detail.value || '')} placeholder="Descreva o contexto" disabled={!podeEditar} />
            </IonItem>
          )}

          <IonItem>
            <IonLabel position="stacked">Descrição</IonLabel>
            <IonInput value={descricao} onIonInput={(e) => setDescricao(e.detail.value || '')} placeholder="Descrição da pesquisa (opcional)" disabled={!podeEditar} />
          </IonItem>

          {podeEditar && (
            <div style={{ padding: '16px 8px', display: 'flex', gap: 8 }}>
              <IonButton expand="block" onClick={handleSave} disabled={!titulo.trim() || saving} fill="outline" style={{ flex: 1 }}>
                {saving ? <IonSpinner /> : 'Salvar'}
              </IonButton>
              <IonButton expand="block" onClick={handleFinalizar} disabled={!titulo.trim() || saving} fill="solid" style={{ flex: 1 }}>
                Finalizar
              </IonButton>
            </div>
          )}
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default PesquisaFormPage;
