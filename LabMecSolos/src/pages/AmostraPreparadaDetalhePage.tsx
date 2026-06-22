import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonItem, IonLabel, IonButton, IonIcon, IonSpinner, IonToast, IonActionSheet } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { flaskOutline, cameraOutline, imageOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import AppBar from '../components/AppBar';
import FinalizacaoPendente from '../components/FinalizacaoPendente';
import GaleriaImagens from '../components/GaleriaImagens';
import { AmostragemService } from '../services/AmostragemService';
import { ImagemService } from '../services/ImagemService';
import { queryRows } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import type { AmostraPreparada, AmostraEnsaiada } from '../models/types';

const AmostraPreparadaDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [amostra, setAmostra] = useState<AmostraPreparada | null>(null);
  const [ensaiadas, setEnsaiadas] = useState<AmostraEnsaiada[]>([]);
  const [contexto, setContexto] = useState<{ pesquisaTitulo: string; pontoPlano: string; amostraCampo: string } | null>(null);
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
              await ImagemService.upload('amostra_preparada', id, reader.result as string, null, usuario.userId);
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
        await ImagemService.upload('amostra_preparada', id, photo.dataUrl, null, usuario.userId);
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
        const ap = await AmostragemService.obterAmostraPreparada(id);
        setAmostra(ap);
        const ensRows = await AmostragemService.listarAmostrasEnsaiadas(id);
        setEnsaiadas(ensRows);

        const ctx = await queryRows<{ pesquisa_titulo: string; ponto_plano: string; amostra_campo: string }>(
          `SELECT pesq.titulo AS pesquisa_titulo, pc.identificacao_plano AS ponto_plano,
                  ab.numero_identificacao_campo AS amostra_campo
           FROM amostras_preparadas ap2
           INNER JOIN amostras_brutas ab ON ap2.id_amostra_bruta = ab.id
           INNER JOIN pontos_coleta pc ON ab.id_ponto_coleta = pc.id
           INNER JOIN programas_amostragem prog ON pc.id_programa_amostragem = prog.id
           INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id
           WHERE ap2.id = ?`,
          [id]
        );
        if (ctx.length > 0) setContexto({ pesquisaTitulo: ctx[0].pesquisa_titulo, pontoPlano: ctx[0].ponto_plano, amostraCampo: ctx[0].amostra_campo });
      } catch {
        setToastMsg('Erro ao carregar dados da amostra preparada.');
        setShowToast(true);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading || !amostra) {
    return (
      <IonPage><AppBar title="Amostra Preparada" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>
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
              <IonItem lines="none"><IonLabel position="stacked"><small>Método de Preparo</small></IonLabel><div>{amostra.metodo_preparo === 'sem_secagem_previa' ? 'Sem Secagem Prévia' : 'Com Secagem Prévia'}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Método de Secagem</small></IonLabel><div>{amostra.metodo_secagem === 'ao_ar' ? 'Ao Ar' : amostra.metodo_secagem === 'estufa_60c' ? 'Estufa 60°C' : amostra.metodo_secagem || '—'}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Normatização</small></IonLabel><div>{amostra.normatizacao || '—'}</div></IonItem>
              {amostra.descricao_inicial && <IonItem lines="none"><IonLabel position="stacked"><small>Descrição Inicial</small></IonLabel><div>{amostra.descricao_inicial}</div></IonItem>}
              <IonItem lines="none"><IonLabel position="stacked"><small>Qtd. Pré-Quarteamento</small></IonLabel><div>{amostra.quantidade_pre_quarteamento}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Qtd. Pós-Quarteamento</small></IonLabel><div>{amostra.quantidade_pos_quarteamento}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Data do Preparo</small></IonLabel><div>{new Date(amostra.data_preparo).toLocaleDateString('pt-BR')}</div></IonItem>
              {amostra.observacoes && <IonItem lines="none"><IonLabel position="stacked"><small>Observações</small></IonLabel><div>{amostra.observacoes}</div></IonItem>}
            </IonCardContent>
          </IonCard>

          {amostra.finalizado === 0 && (
            <IonButton expand="block" fill="outline" style={{ marginTop: 8 }} onClick={() => history.push(`/app/ensaios/amostra-preparada/${id}/editar`)}>
              Editar
            </IonButton>
          )}

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)' }}>Fracionamentos ({ensaiadas.length})</span>
            </div>
            {ensaiadas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <IonIcon icon={flaskOutline} style={{ fontSize: 36, color: 'var(--ion-color-medium)', marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: 0 }}>Nenhum fracionamento registrado.</p>
              </div>
            ) : (
              ensaiadas.map((ae) => (
                <IonCard key={ae.id} style={{ borderRadius: 12, marginBottom: 8 }} onClick={async () => {
                  const ensaio = await queryRows<{ id: string }>(
                    'SELECT id FROM ensaios WHERE id_amostra_ensaiada = ?', [ae.id]
                  );
                  if (ensaio.length > 0) {
                    history.push(`/app/ensaios/${ensaio[0].id}`);
                  } else {
                    history.push(`/app/novo-ensaio?amostra=${ae.id}`);
                  }
                }}>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{ae.numero_amostra}</div>
                        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 4 }}>
                          {ae.tipo_ensaio_destino} — Qtd: {ae.quantidade_inicial}
                        </div>
                      </div>
                      {ae.finalizado === 0 && (
                      <IonButton fill="outline" size="small" onClick={(e) => { e.stopPropagation(); history.push(`/app/ensaios/amostra-ensaiada/${ae.id}/editar`); }}>
                        Editar
                      </IonButton>
                      )}
                    </div>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </div>

          {amostra.finalizado === 1 && (
          <IonButton expand="block" style={{ marginTop: 16 }} onClick={() => history.push(`/app/ensaios/amostra-preparada/${id}/fracionar`)}>
            <IonIcon slot="start" icon={flaskOutline} /> Fracionar para Ensaio
          </IonButton>
          )}
        </div>
        <div style={{ padding: '0 16px', marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Imagens</div>
          <GaleriaImagens
            key={galeriaKey}
            entidadeTipo="amostra_preparada"
            entidadeId={id!}
            editavel
            idAutor={usuario?.userId}
            onAdicionar={handleAdicionarFoto}
          />
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

export default AmostraPreparadaDetalhePage;
