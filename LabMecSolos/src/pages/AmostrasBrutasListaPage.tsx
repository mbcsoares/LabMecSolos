import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonChip, IonCard, IonCardContent, IonIcon, IonSpinner, IonFab, IonFabButton, IonButton } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { cubeOutline, addOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import FinalizacaoPendente from '../components/FinalizacaoPendente';
import { AmostragemService } from '../services/AmostragemService';
import { queryRows } from '../services/DatabaseService';
import type { AmostraBruta, PontoColeta } from '../models/types';

const STATUS_BADGE: Record<string, { status: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
  coletada: { status: 'info', label: 'Coletada' },
  preparada: { status: 'warning', label: 'Preparada' },
  ensaiada: { status: 'success', label: 'Ensaiada' },
  descartada: { status: 'neutral', label: 'Descartada' },
};

const AmostrasBrutasListaPage: React.FC = () => {
  const { pontoId } = useParams<{ pontoId: string }>();
  const history = useHistory();
  const [amostras, setAmostras] = useState<AmostraBruta[]>([]);
  const [ponto, setPonto] = useState<PontoColeta | null>(null);
  const [contexto, setContexto] = useState<{ pesquisaTitulo: string; programaObjetivo: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!pontoId) return;
      try {
        const [pt, rows] = await Promise.all([
          AmostragemService.obterPontoColeta(pontoId),
          AmostragemService.listarAmostrasBrutas(pontoId),
        ]);
        setPonto(pt);
        setAmostras(rows);

        const ctx = await queryRows<{ pesquisa_titulo: string; programa_objetivo: string }>(
          `SELECT pesq.titulo AS pesquisa_titulo, prog.objetivo AS programa_objetivo
           FROM pontos_coleta pt2
           INNER JOIN programas_amostragem prog ON pt2.id_programa_amostragem = prog.id
           INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id
           WHERE pt2.id = ?`,
          [pontoId]
        );
        if (ctx.length > 0) setContexto({ pesquisaTitulo: ctx[0].pesquisa_titulo, programaObjetivo: ctx[0].programa_objetivo });
      } catch {}
      setLoading(false);
    };
    load();
  }, [pontoId]);

  const filtradas = amostras.filter((a) => !filtroTipo || a.tipo_amostra === filtroTipo);

  return (
    <IonPage>
      <AppBar title={ponto ? `Ponto ${ponto.identificacao_plano}` : 'Amostras Brutas'} />
      <IonContent>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : (
          <>
            {ponto && (
              <div style={{ padding: '0 16px' }}>
                <IonCard style={{ borderRadius: 12 }}>
                  <IonCardContent>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Detalhes do Ponto</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ion-color-dark)', marginBottom: 8 }}>
                      {ponto.identificacao_plano}
                    </div>
                    {contexto && (
                      <>
                        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginBottom: 4 }}>
                          Pesquisa: {contexto.pesquisaTitulo}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginBottom: 4 }}>
                          Programa: {contexto.programaObjetivo}
                        </div>
                      </>
                    )}
                    {ponto.coordenadas && (
                      <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginBottom: 4 }}>
                        Coordenadas: {ponto.coordenadas}
                      </div>
                    )}
                    {ponto.descricao_local && (
                      <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                        {ponto.descricao_local}
                      </div>
                    )}
                    {!contexto && !ponto.coordenadas && !ponto.descricao_local && (
                      <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>Nenhuma informacao adicional.</div>
                    )}
                    {ponto.finalizado === 0 && (
                      <IonButton fill="outline" size="small" onClick={() => history.push(`/app/ensaios/ponto/${pontoId}/editar`)} style={{ marginTop: 8 }}>
                        Editar
                      </IonButton>
                    )}
                  </IonCardContent>
                </IonCard>
              </div>
            )}
            {ponto && <FinalizacaoPendente finalizado={ponto.finalizado} />}
            <div style={{ display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto' }}>
          {[{ label: 'Todas', value: '' }, { label: 'Deformada', value: 'deformada' }, { label: 'Indeformada', value: 'indeformada' }].map((op) => (
            <IonChip key={op.value} color={filtroTipo === op.value ? 'primary' : 'medium'} outline={filtroTipo !== op.value} onClick={() => setFiltroTipo(op.value)} style={{ flexShrink: 0 }}>{op.label}</IonChip>
          ))}
        </div>

        {filtradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <IonIcon icon={cubeOutline} style={{ fontSize: 48, color: 'var(--ion-color-medium)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--ion-color-medium)', margin: 0 }}>Nenhuma amostra bruta registrada.</p>
          </div>
        ) : (
          filtradas.map((a) => {
            const badge = STATUS_BADGE[a.status] || { status: 'neutral' as const, label: a.status };
            return (
              <IonCard key={a.id} style={{ borderRadius: 12, margin: '8px 16px' }} onClick={() => history.push(`/app/ensaios/amostra/${a.id}`)}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{a.numero_identificacao_campo}</span>
                    <StatusBadge status={badge.status} label={badge.label} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 4 }}>
                    {a.tipo_amostra === 'deformada' ? 'Deformada' : 'Indeformada'} &nbsp;·&nbsp; {new Date(a.data_coleta).toLocaleDateString('pt-BR')}
                  </div>
                </IonCardContent>
              </IonCard>
            );
          })
        )}

        {ponto?.finalizado === 1 && (
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => history.push(`/app/ensaios/ponto/${pontoId}/amostra/novo`)}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
        )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AmostrasBrutasListaPage;
