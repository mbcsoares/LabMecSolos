import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonItem, IonLabel, IonButton, IonIcon, IonSpinner, IonToast, IonAlert, IonActionSheet } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { playOutline, closeCircleOutline, checkmarkCircleOutline, calculatorOutline, documentTextOutline, locateOutline, cameraOutline, imageOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import FinalizacaoPendente from '../components/FinalizacaoPendente';
import GaleriaImagens from '../components/GaleriaImagens';
import { EnsaioBaseService } from '../services/EnsaioBaseService';
import { ImagemService } from '../services/ImagemService';
import { queryRows } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import type { EnsaioDetalhado } from '../models/types';

const TIPO_LABELS: Record<string, string> = {
  teor_umidade: 'Teor de Umidade', granulometria: 'Granulometria', compactacao: 'Compactação',
  limite_liquidez: 'Limite de Liquidez', limite_plasticidade: 'Limite de Plasticidade',
  cisalhamento_direto: 'Cisalhamento Direto', adensamento: 'Adensamento', triaxial: 'Triaxial',
};

const STATUS_BADGE: Record<string, { status: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
  nao_iniciado: { status: 'neutral', label: 'Não Iniciado' },
  em_andamento: { status: 'info', label: 'Em Andamento' },
  concluido: { status: 'success', label: 'Concluído' },
  cancelado: { status: 'error', label: 'Cancelado' },
};

const EnsaioDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [ensaio, setEnsaio] = useState<EnsaioDetalhado | null>(null);
  const [contexto, setContexto] = useState<{ pesquisaTitulo: string; pontoPlano: string; amostraNumero: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
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
              await ImagemService.upload('ensaio', id, reader.result as string, null, usuario.userId);
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
        await ImagemService.upload('ensaio', id, photo.dataUrl, null, usuario.userId);
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
        const e = await EnsaioBaseService.obterEnsaioDetalhado(id);
        setEnsaio(e);

        const ctx = await queryRows<{ pesquisa_titulo: string; ponto_plano: string; amostra_numero: string }>(
          `SELECT pesq.titulo AS pesquisa_titulo, pc.identificacao_plano AS ponto_plano,
                  COALESCE(ae.numero_amostra, ai.numero_amostra) AS amostra_numero
           FROM ensaios e2
           LEFT JOIN amostras_ensaiadas ae ON e2.id_amostra_ensaiada = ae.id
           LEFT JOIN amostras_preparadas ap ON ae.id_amostra_preparada = ap.id
           LEFT JOIN amostras_brutas ab1 ON ap.id_amostra_bruta = ab1.id
           LEFT JOIN amostras_indeformadas ai ON e2.id_amostra_indeformada = ai.id
           LEFT JOIN amostras_brutas ab2 ON ai.id_amostra_bruta = ab2.id
           LEFT JOIN pontos_coleta pc ON (ab1.id_ponto_coleta = pc.id OR ab2.id_ponto_coleta = pc.id)
           LEFT JOIN programas_amostragem prog ON pc.id_programa_amostragem = prog.id
           LEFT JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id
           WHERE e2.id = ?`,
          [id]
        );
        if (ctx.length > 0) setContexto({ pesquisaTitulo: ctx[0].pesquisa_titulo, pontoPlano: ctx[0].ponto_plano, amostraNumero: ctx[0].amostra_numero });
      } catch {
        setToastMsg('Erro ao carregar ensaio.');
        setShowToast(true);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleIniciar = async () => {
    if (!id) return;
    try { await EnsaioBaseService.iniciarEnsaio(id, usuario?.userId || ''); setEnsaio((prev) => prev ? { ...prev, status: 'em_andamento' } : null); setToastMsg('Ensaio iniciado.'); setShowToast(true); } catch (e: any) { setToastMsg(e.message || 'Erro ao iniciar ensaio.'); setShowToast(true); }
  };

  const handleCancelar = async (motivo: string) => {
    if (!motivo || !id) return;
    try { await EnsaioBaseService.cancelarEnsaio(id, motivo, usuario?.userId || ''); setEnsaio((prev) => prev ? { ...prev, status: 'cancelado' } : null); setToastMsg('Ensaio cancelado.'); setShowToast(true); } catch (e: any) { setToastMsg(e.message || 'Erro ao cancelar ensaio.'); setShowToast(true); }
  };

  const handleRastreabilidade = async () => {
    if (!ensaio) return;
    try {
      if (ensaio.id_amostra_ensaiada) {
        const rows = await queryRows<{ id_amostra_bruta: string }>(
          `SELECT ap.id_amostra_bruta FROM amostras_ensaiadas ae INNER JOIN amostras_preparadas ap ON ae.id_amostra_preparada = ap.id WHERE ae.id = ?`,
          [ensaio.id_amostra_ensaiada]
        );
        if (rows.length > 0) { history.push(`/app/ensaios/amostra/${rows[0].id_amostra_bruta}/rastreabilidade`); return; }
      }
      if (ensaio.id_amostra_indeformada) {
        const rows = await queryRows<{ id_amostra_bruta: string }>(
          `SELECT id_amostra_bruta FROM amostras_indeformadas WHERE id = ?`,
          [ensaio.id_amostra_indeformada]
        );
        if (rows.length > 0) { history.push(`/app/ensaios/amostra/${rows[0].id_amostra_bruta}/rastreabilidade`); return; }
      }
    } catch {
      setToastMsg('Erro ao carregar rastreabilidade.');
      setShowToast(true);
    }
  };

  if (loading || !ensaio) {
    return (
      <IonPage><AppBar title="Ensaio" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>
    );
  }

  const badge = STATUS_BADGE[ensaio.status] || { status: 'neutral' as const, label: ensaio.status };

  return (
    <IonPage>
      <AppBar title={TIPO_LABELS[ensaio.tipo_ensaio] || ensaio.tipo_ensaio} />
      <IonContent>
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 16 }}><StatusBadge status={badge.status} label={badge.label} /></div>
          <FinalizacaoPendente finalizado={ensaio.finalizado ?? 0} />

          {contexto && (
            <IonCard style={{ borderRadius: 12, marginBottom: 12 }}>
              <IonCardContent>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 4 }}>Contexto</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ion-color-dark)', marginBottom: 4 }}>{contexto.pesquisaTitulo}</div>
                <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                  Ponto: {contexto.pontoPlano} &middot; Amostra: {contexto.amostraNumero}
                </div>
              </IonCardContent>
            </IonCard>
          )}

          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <IonItem lines="none"><IonLabel position="stacked"><small>Tipo</small></IonLabel><div>{TIPO_LABELS[ensaio.tipo_ensaio] || ensaio.tipo_ensaio}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Norma</small></IonLabel><div>{ensaio.norma_referencia || '—'}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Executante</small></IonLabel><div>{ensaio.nome_executante || '—'}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Temperatura Ambiente</small></IonLabel><div>{ensaio.temperatura_ambiente ? `${ensaio.temperatura_ambiente}°C` : '—'}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Umidade Ambiente</small></IonLabel><div>{ensaio.umidade_ambiente ? `${ensaio.umidade_ambiente}%` : '—'}</div></IonItem>
              {ensaio.data_inicio && <IonItem lines="none"><IonLabel position="stacked"><small>Data de Início</small></IonLabel><div>{new Date(ensaio.data_inicio).toLocaleDateString('pt-BR')}</div></IonItem>}
              {ensaio.data_fim && <IonItem lines="none"><IonLabel position="stacked"><small>Data de Fim</small></IonLabel><div>{new Date(ensaio.data_fim).toLocaleDateString('pt-BR')}</div></IonItem>}
              {ensaio.h_medio !== undefined && ensaio.h_medio !== null && (
                <>
                  <IonItem lines="none"><IonLabel position="stacked"><small>h_médio</small></IonLabel><div>{ensaio.h_medio.toFixed(2)}%</div></IonItem>
                  <IonItem lines="none"><IonLabel position="stacked"><small>Desvio Padrão</small></IonLabel><div>{ensaio.desvio_padrao?.toFixed(4) || '—'}</div></IonItem>
                  <IonItem lines="none"><IonLabel position="stacked"><small>fc_médio</small></IonLabel><div>{ensaio.fc_medio?.toFixed(4) || '—'}</div></IonItem>
                </>
              )}
            </IonCardContent>
          </IonCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {ensaio.status === 'nao_iniciado' && ensaio.finalizado !== 1 && (
              <IonButton expand="block" fill="outline" onClick={() => history.push(`/app/ensaios/${id}/editar`)}>
                Editar
              </IonButton>
            )}
            {ensaio.status === 'nao_iniciado' && ensaio.finalizado === 1 && (
              <IonButton expand="block" onClick={handleIniciar}><IonIcon slot="start" icon={playOutline} /> Iniciar Ensaio</IonButton>
            )}
            {ensaio.status === 'em_andamento' && ensaio.tipo_ensaio === 'teor_umidade' && (
              <IonButton expand="block" onClick={() => history.push(`/app/ensaios/${id}/teor-umidade`)}>
                <IonIcon slot="start" icon={calculatorOutline} /> Executar Teor de Umidade
              </IonButton>
            )}
            {(ensaio.status === 'nao_iniciado' || ensaio.status === 'em_andamento') && (
              <IonButton expand="block" color="warning" onClick={() => setShowCancelAlert(true)}><IonIcon slot="start" icon={closeCircleOutline} /> Cancelar Ensaio</IonButton>
            )}
            {ensaio.status === 'concluido' && (
              <IonButton expand="block" fill="outline" onClick={() => history.push(`/app/ensaios/${id}/relatorio`)}>
                <IonIcon slot="start" icon={documentTextOutline} /> Relatório
              </IonButton>
            )}
            {(ensaio.id_amostra_ensaiada || ensaio.id_amostra_indeformada) && (
              <IonButton expand="block" fill="outline" onClick={handleRastreabilidade}>
                <IonIcon slot="start" icon={locateOutline} /> Rastreabilidade
              </IonButton>
            )}
          </div>
        </div>
        <div style={{ padding: '0 16px', marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Imagens</div>
          <GaleriaImagens
            key={galeriaKey}
            entidadeTipo="ensaio"
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
        <IonAlert
          isOpen={showCancelAlert}
          onDidDismiss={({ detail }) => {
            setShowCancelAlert(false);
            if (detail.role === 'confirm') {
              const motivo = detail.data?.values?.motivo?.trim() || '';
              if (motivo) handleCancelar(motivo);
            }
            setCancelMotivo('');
          }}
          header="Cancelar Ensaio"
          message="Informe o motivo do cancelamento:"
          inputs={[{ name: 'motivo', type: 'text', placeholder: 'Motivo', value: cancelMotivo, handler: (e: any) => setCancelMotivo(e.value) }]}
          buttons={[
            { text: 'Voltar', role: 'cancel' },
            { text: 'Confirmar', role: 'confirm' },
          ]}
        />
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default EnsaioDetalhePage;
