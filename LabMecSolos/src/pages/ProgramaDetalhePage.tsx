import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonItem, IonLabel, IonIcon, IonSpinner, IonButton, IonFab, IonFabButton, IonToast } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { addOutline, layersOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import FinalizacaoPendente from '../components/FinalizacaoPendente';
import { useAuth } from '../contexts/AuthContext';
import { AmostragemService } from '../services/AmostragemService';
import { queryRows } from '../services/DatabaseService';
import type { ProgramaAmostragem, PontoColeta } from '../models/types';

const ProgramaDetalhePage: React.FC = () => {
  const { programaId } = useParams<{ programaId: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [programa, setPrograma] = useState<ProgramaAmostragem | null>(null);
  const [pontos, setPontos] = useState<PontoColeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [contexto, setContexto] = useState<{ pesquisaTitulo: string; nomeResponsavel: string } | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!programaId) return;
      try {
        const prog = await AmostragemService.obterPrograma(programaId);
        setPrograma(prog);
        const pts = await AmostragemService.listarPontosColeta(programaId);
        setPontos(pts);

        const ctx = await queryRows<{ pesquisa_titulo: string; nome_responsavel: string }>(
          `SELECT pesq.titulo AS pesquisa_titulo, u.nome || ' ' || u.sobrenome AS nome_responsavel
           FROM programas_amostragem prog
           INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id
           INNER JOIN usuarios u ON pesq.id_responsavel = u.id
           WHERE prog.id = ?`,
          [programaId]
        );
        if (ctx.length > 0) setContexto({ pesquisaTitulo: ctx[0].pesquisa_titulo, nomeResponsavel: ctx[0].nome_responsavel });
      } catch {
        setToastMsg('Erro ao carregar dados do programa.');
        setShowToast(true);
      }
      setLoading(false);
    };
    load();
  }, [programaId]);

  if (loading || !programa) {
    return (
      <IonPage><AppBar title="Programa" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>
    );
  }

  return (
    <IonPage>
      <AppBar title="Programa" />
      <IonContent>
        <div style={{ padding: 16 }}>
          {contexto && (
            <IonCard style={{ borderRadius: 12, marginBottom: 12 }}>
              <IonCardContent>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 4 }}>Pesquisa</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ion-color-dark)', marginBottom: 6 }}>{contexto.pesquisaTitulo}</div>
                <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>Responsável: {contexto.nomeResponsavel}</div>
              </IonCardContent>
            </IonCard>
          )}
          <FinalizacaoPendente finalizado={programa.finalizado} />

          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <IonItem lines="none"><IonLabel position="stacked"><small>Objetivo</small></IonLabel><div style={{ fontSize: 14 }}>{programa.objetivo}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Endereço</small></IonLabel><div style={{ fontSize: 14 }}>{programa.endereco_coleta || '—'}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Coordenadas</small></IonLabel><div style={{ fontSize: 14 }}>{programa.coordenadas || '—'}</div></IonItem>
              <IonItem lines="none"><IonLabel position="stacked"><small>Status</small></IonLabel><div style={{ fontSize: 14 }}>{programa.status}</div></IonItem>
              {programa.descricao && <IonItem lines="none"><IonLabel position="stacked"><small>Descrição</small></IonLabel><div style={{ fontSize: 14 }}>{programa.descricao}</div></IonItem>}
              {programa.finalizado === 0 && programa.status === 'ativo' && (
                <IonItem lines="none">
                  <IonButton fill="outline" size="small" onClick={() => history.push(`/app/ensaios/programa/${programaId}/editar`)}>
                    Editar
                  </IonButton>
                </IonItem>
              )}
            </IonCardContent>
          </IonCard>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginTop: 16, marginBottom: 8 }}>
            Pontos de Coleta ({pontos.length})
          </div>

          {pontos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <IonIcon icon={layersOutline} style={{ fontSize: 36, color: 'var(--ion-color-medium)', marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: 0 }}>Nenhum ponto de coleta.</p>
            </div>
          ) : (
            pontos.map((pt) => (
              <IonCard key={pt.id} style={{ borderRadius: 12, marginBottom: 8 }} onClick={() => history.push(`/app/ensaios/ponto/${pt.id}/amostras`)}>
                <IonCardContent>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{pt.identificacao_plano}</div>
                  <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 4 }}>
                    {pt.coordenadas || 'Sem coordenadas'}
                  </div>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>

        {programa.finalizado === 1 && (
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push(`/app/ensaios/programa/${programaId}/ponto/novo`)}><IonIcon icon={addOutline} /></IonFabButton>
        </IonFab>
        )}
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default ProgramaDetalhePage;
