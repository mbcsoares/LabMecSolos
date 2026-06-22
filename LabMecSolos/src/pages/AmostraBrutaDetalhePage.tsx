import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonItem, IonLabel, IonButton, IonIcon, IonSpinner, IonToast, IonActionSheet } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { beakerOutline, cubeOutline, listOutline, globeOutline, cameraOutline, imageOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import FinalizacaoPendente from '../components/FinalizacaoPendente';
import GaleriaImagens from '../components/GaleriaImagens';
import { AmostragemService } from '../services/AmostragemService';
import { ImagemService } from '../services/ImagemService';
import { queryRows } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import type { AmostraBruta } from '../models/types';

const STATUS_BADGE: Record<string, { status: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
  coletada: { status: 'info', label: 'Coletada' },
  preparada: { status: 'warning', label: 'Preparada' },
  ensaiada: { status: 'success', label: 'Ensaiada' },
  descartada: { status: 'neutral', label: 'Descartada' },
};

const AmostraBrutaDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [amostra, setAmostra] = useState<AmostraBruta | null>(null);
  const [contexto, setContexto] = useState<{ pesquisaTitulo: string; pontoPlano: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showFotoSheet, setShowFotoSheet] = useState(false);
  const [galeriaKey, setGaleriaKey] = useState(0);

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
              await ImagemService.upload('amostra_bruta', id, reader.result as string, null, usuario.userId);
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
        await ImagemService.upload('amostra_bruta', id, photo.dataUrl, null, usuario.userId);
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
        const a = await AmostragemService.obterAmostraBruta(id);
        setAmostra(a);

        const ctx = await queryRows<{ pesquisa_titulo: string; ponto_plano: string }>(
          `SELECT pesq.titulo AS pesquisa_titulo, pc.identificacao_plano AS ponto_plano
           FROM amostras_brutas ab
           INNER JOIN pontos_coleta pc ON ab.id_ponto_coleta = pc.id
           INNER JOIN programas_amostragem prog ON pc.id_programa_amostragem = prog.id
           INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id
           WHERE ab.id = ?`,
          [id]
        );
        if (ctx.length > 0) setContexto({ pesquisaTitulo: ctx[0].pesquisa_titulo, pontoPlano: ctx[0].ponto_plano });
      } catch {
        setToastMsg('Erro ao carregar amostra.');
        setShowToast(true);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading || !amostra) {
    return (
      <IonPage><AppBar title="Amostra" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>
    );
  }

  const badge = STATUS_BADGE[amostra.status] || { status: 'neutral' as const, label: amostra.status };

  return (
    <IonPage>
      <AppBar title={amostra.numero_identificacao_campo} />
      <IonContent>
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <StatusBadge status={badge.status} label={badge.label} />
          </div>
          <FinalizacaoPendente finalizado={amostra.finalizado} />

          {contexto && (
            <IonCard style={{ borderRadius: 12, marginBottom: 12 }}>
              <IonCardContent>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 4 }}>Contexto</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ion-color-dark)', marginBottom: 4 }}>{contexto.pesquisaTitulo}</div>
                <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>Ponto: {contexto.pontoPlano}</div>
              </IonCardContent>
            </IonCard>
          )}

          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <IonItem lines="none"><IonLabel position="stacked"><small>Tipo</small></IonLabel><div>{amostra.tipo_amostra === 'deformada' ? 'Deformada' : 'Indeformada'}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Classificação</small></IonLabel><div>{amostra.classificacao || '—'}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Data da Coleta</small></IonLabel><div>{new Date(amostra.data_coleta).toLocaleDateString('pt-BR')}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Operador da Coleta</small></IonLabel><div>{amostra.operador_coleta || '—'}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Método de Coleta</small></IonLabel><div>{amostra.metodo_coleta || '—'}</div></IonItem>
              {amostra.profundidade_coleta != null && <IonItem lines="none"><IonLabel position="stacked"><small>Profundidade</small></IonLabel><div>{amostra.profundidade_coleta} m</div></IonItem>}
              {amostra.peso_bruto_campo != null && <IonItem lines="none"><IonLabel position="stacked"><small>Peso Bruto em Campo</small></IonLabel><div>{amostra.peso_bruto_campo} g</div></IonItem>}
              <IonItem lines="none"><IonLabel position="stacked"><small>Coordenadas GPS</small></IonLabel><div>{amostra.coordenadas_gps || '—'}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Descrição</small></IonLabel><div>{amostra.descricao || '—'}</div></IonItem>
            </IonCardContent>
          </IonCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {amostra.finalizado === 0 && (
              <IonButton expand="block" fill="outline" onClick={() => history.push(`/app/ensaios/amostra/${id}/editar`)}>
                Editar
              </IonButton>
            )}
            {amostra.tipo_amostra === 'deformada' && amostra.finalizado === 1 && (
              <IonButton expand="block" onClick={() => history.push(`/app/ensaios/amostra/${id}/preparar`)}>
                <IonIcon slot="start" icon={beakerOutline} /> Preparar Amostra
              </IonButton>
            )}
            {amostra.tipo_amostra === 'indeformada' && amostra.finalizado === 1 && (
              <IonButton expand="block" onClick={() => history.push(`/app/ensaios/amostra/${id}/indeformada`)}>
                <IonIcon slot="start" icon={cubeOutline} /> Registrar Amostra Indeformada
              </IonButton>
            )}
            {amostra.tipo_amostra === 'deformada' && amostra.status !== 'coletada' && (
              <IonButton expand="block" fill="outline" onClick={() => history.push(`/app/ensaios/amostra-preparada/${id}/preparadas`)}>
                <IonIcon slot="start" icon={listOutline} /> Ver Amostras Preparadas
              </IonButton>
            )}
            {amostra.tipo_amostra === 'indeformada' && amostra.status !== 'coletada' && (
              <IonButton expand="block" fill="outline" onClick={() => history.push(`/app/ensaios/amostra/${id}/indeformadas`)}>
                <IonIcon slot="start" icon={listOutline} /> Ver Amostras Indeformadas
              </IonButton>
            )}
            <IonButton expand="block" fill="outline" onClick={() => history.push(`/app/ensaios/amostra/${id}/rastreabilidade`)}>Rastreabilidade</IonButton>
            <IonButton expand="block" fill="outline" onClick={() => history.push(`/app/geotecnico/metadados/${id}`)}>
              <IonIcon slot="start" icon={globeOutline} /> Metadados
            </IonButton>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Imagens</div>
            <GaleriaImagens
              key={galeriaKey}
              entidadeTipo="amostra_bruta"
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

export default AmostraBrutaDetalhePage;
