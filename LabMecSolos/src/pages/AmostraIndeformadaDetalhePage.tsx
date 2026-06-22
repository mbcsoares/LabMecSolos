import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonItem, IonLabel, IonButton, IonIcon, IonSpinner, IonToast, IonActionSheet } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { cameraOutline, imageOutline, flaskOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import AppBar from '../components/AppBar';
import FinalizacaoPendente from '../components/FinalizacaoPendente';
import GaleriaImagens from '../components/GaleriaImagens';
import { AmostragemService } from '../services/AmostragemService';
import { ImagemService } from '../services/ImagemService';
import { queryRows } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import type { AmostraIndeformada } from '../models/types';

const TIPO_LABELS: Record<string, string> = {
  shelby: 'Shelby', bloco: 'Bloco', anel: 'Anel', outro: 'Outro',
};

const FORMATO_LABELS: Record<string, string> = {
  cilindrico: 'Cilíndrico', cubico: 'Cúbico', prismatico: 'Prismático', irregular: 'Irregular',
};

const AmostraIndeformadaDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [amostra, setAmostra] = useState<AmostraIndeformada | null>(null);
  const [contexto, setContexto] = useState<{ pesquisaTitulo: string; pontoPlano: string; amostraCampo: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showFotoSheet, setShowFotoSheet] = useState(false);
  const [galeriaKey, setGaleriaKey] = useState(0);
  const [ensaioExistente, setEnsaioExistente] = useState<{ id: string } | null>(null);
  const handleAdicionarFoto = () => setShowFotoSheet(true);

  const handleCapturarFoto = async (source: CameraSource) => {
    setShowFotoSheet(false);
    if (!usuario || !id) return;
    try {
      const isNative = Capacitor.getPlatform() !== 'web';
      if (!isNative) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async () => {
            if (reader.result) {
              await ImagemService.upload('amostra_indeformada', id, reader.result as string, null, usuario.userId);
              setGaleriaKey((k) => k + 1);
            }
          };
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      }
      const photo = await Camera.getPhoto({ quality: 80, allowEditing: false, resultType: CameraResultType.DataUrl, source });
      if (photo.dataUrl) {
        await ImagemService.upload('amostra_indeformada', id, photo.dataUrl, null, usuario.userId);
        setGaleriaKey((k) => k + 1);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      if (err?.message?.includes('cancel') || err?.message?.includes('Cancel')) return;
      setToastMsg('Erro ao capturar imagem.');
      setShowToast(true);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const ai = await AmostragemService.obterAmostraIndeformada(id);
        setAmostra(ai);
        const ctx = await queryRows<{ pesquisa_titulo: string; ponto_plano: string; amostra_campo: string }>(
          `SELECT pesq.titulo AS pesquisa_titulo, pc.identificacao_plano AS ponto_plano,
                  ab.numero_identificacao_campo AS amostra_campo
           FROM amostras_indeformadas ai2
           INNER JOIN amostras_brutas ab ON ai2.id_amostra_bruta = ab.id
           INNER JOIN pontos_coleta pc ON ab.id_ponto_coleta = pc.id
           INNER JOIN programas_amostragem prog ON pc.id_programa_amostragem = prog.id
           INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id
           WHERE ai2.id = ?`,
          [id]
        );
        if (ctx.length > 0) setContexto({ pesquisaTitulo: ctx[0].pesquisa_titulo, pontoPlano: ctx[0].ponto_plano, amostraCampo: ctx[0].amostra_campo });
        const ens = await queryRows<{ id: string }>(
          'SELECT id FROM ensaios WHERE id_amostra_indeformada = ?', [id]
        );
        if (ens.length > 0) setEnsaioExistente(ens[0]);
      } catch {
        setToastMsg('Erro ao carregar amostra indeformada.');
        setShowToast(true);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading || !amostra) {
    return (
      <IonPage><AppBar title="Amostra Indeformada" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>
    );
  }

  return (
    <IonPage>
      <AppBar title={amostra.numero_amostra} />
      <IonContent>
        <div style={{ padding: 16 }}>
          {contexto && (
            <IonCard style={{ borderRadius: 12, marginBottom: 12 }}>
              <IonCardContent>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 4 }}>Contexto</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ion-color-dark)', marginBottom: 4 }}>{contexto.pesquisaTitulo}</div>
                <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>Ponto: {contexto.pontoPlano} &middot; Amostra: {contexto.amostraCampo}</div>
              </IonCardContent>
            </IonCard>
          )}
          <FinalizacaoPendente finalizado={amostra.finalizado} />

          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <IonItem lines="none"><IonLabel position="stacked"><small>Tipo</small></IonLabel><div>{TIPO_LABELS[amostra.tipo_indeformada] || amostra.tipo_indeformada}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Formato</small></IonLabel><div>{FORMATO_LABELS[amostra.formato] || amostra.formato}</div></IonItem>
              {amostra.altura != null && <IonItem lines="none"><IonLabel position="stacked"><small>Altura</small></IonLabel><div>{amostra.altura} mm</div></IonItem>}
              {amostra.largura != null && <IonItem lines="none"><IonLabel position="stacked"><small>Largura</small></IonLabel><div>{amostra.largura} mm</div></IonItem>}
              {amostra.comprimento != null && <IonItem lines="none"><IonLabel position="stacked"><small>Comprimento</small></IonLabel><div>{amostra.comprimento} mm</div></IonItem>}
              <IonItem lines="none"><IonLabel position="stacked"><small>Condição</small></IonLabel><div>{amostra.condicao || '—'}</div></IonItem>
              {amostra.observacoes && <IonItem lines="none"><IonLabel position="stacked"><small>Observações</small></IonLabel><div>{amostra.observacoes}</div></IonItem>}
              <IonItem lines="none"><IonLabel position="stacked"><small>Data de Criação</small></IonLabel><div>{new Date(amostra.data_criacao).toLocaleDateString('pt-BR')}</div></IonItem>
            </IonCardContent>
          </IonCard>

          {amostra.finalizado === 0 && (
            <IonButton expand="block" fill="outline" style={{ marginTop: 8 }} onClick={() => history.push(`/app/ensaios/amostra-indeformada/${id}/editar`)}>
              Editar
            </IonButton>
          )}
          {ensaioExistente ? (
            <IonButton expand="block" style={{ marginTop: 8 }} onClick={() => history.push(`/app/ensaios/${ensaioExistente.id}`)}>
              <IonIcon slot="start" icon={flaskOutline} /> Ver Ensaio
            </IonButton>
          ) : amostra.finalizado === 1 && (
            <IonButton expand="block" style={{ marginTop: 8 }} onClick={() => history.push(`/app/novo-ensaio?amostra=${id}`)}>
              <IonIcon slot="start" icon={flaskOutline} /> Criar Ensaio
            </IonButton>
          )}

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Imagens</div>
            <GaleriaImagens
              key={galeriaKey}
              entidadeTipo="amostra_indeformada"
              entidadeId={id!}
              editavel
              idAutor={usuario?.userId}
              onAdicionar={handleAdicionarFoto}
            />
          </div>
        </div>

        <IonActionSheet
          isOpen={showFotoSheet}
          onDidDismiss={() => setShowFotoSheet(false)}
          header="Adicionar Imagem"
          buttons={[
            { text: 'Camera', icon: cameraOutline, handler: () => handleCapturarFoto(CameraSource.Camera) },
            { text: 'Galeria', icon: imageOutline, handler: () => handleCapturarFoto(CameraSource.Photos) },
            { text: 'Cancelar', role: 'cancel' },
          ]}
        />
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default AmostraIndeformadaDetalhePage;
