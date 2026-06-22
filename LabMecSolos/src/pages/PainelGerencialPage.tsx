import React, { useState, useEffect, useCallback } from 'react';
import { IonPage, IonContent, IonSegment, IonSegmentButton, IonLabel, IonCard, IonCardContent, IonItem, IonList, IonSpinner, IonToast, IonChip, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { flaskOutline, calendarOutline, cubeOutline, warningOutline, analyticsOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import AdminGuard from '../components/AdminGuard';
import PeriodoFilter from '../components/PeriodoFilter';
import { PainelGerencialService } from '../services/PainelGerencialService';
import { PeriodoService } from '../services/PeriodoService';
import type { PeriodoFiltro, IndicadoresVisaoGeral, DadosPesquisasEnsaios, DadosUsoLaboratorio, DadosInventarioResumo } from '../models/types';

const PainelGerencialPage: React.FC = () => {
  const history = useHistory();
  const [tab, setTab] = useState('visao-geral');
  const [periodo, setPeriodo] = useState<PeriodoFiltro>(PeriodoService.resolverPreset('este_mes'));
  const [visaoGeral, setVisaoGeral] = useState<IndicadoresVisaoGeral | null>(null);
  const [pesquisasEnsaios, setPesquisasEnsaios] = useState<DadosPesquisasEnsaios | null>(null);
  const [usoLab, setUsoLab] = useState<DadosUsoLaboratorio | null>(null);
  const [inventario, setInventario] = useState<DadosInventarioResumo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'visao-geral') {
        setVisaoGeral(await PainelGerencialService.obterIndicadoresVisaoGeral(periodo));
      } else if (tab === 'pesquisas') {
        setPesquisasEnsaios(await PainelGerencialService.obterDadosPesquisasEnsaios(periodo));
      } else if (tab === 'uso-lab') {
        setUsoLab(await PainelGerencialService.obterDadosUsoLaboratorio(periodo));
      } else if (tab === 'inventario') {
        setInventario(await PainelGerencialService.obterDadosInventarioResumo());
      }
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao carregar dados.');
      setShowToast(true);
    }
    setLoading(false);
  }, [tab, periodo]);

  useEffect(() => { carregar(); }, [carregar]);

  const renderKpiCard = (title: string, value: number | string, icon: string, color: string, onClick?: () => void) => (
    <IonCard style={{ borderRadius: 12, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <IonCardContent style={{ textAlign: 'center', padding: 16 }}>
        <IonIcon icon={icon} style={{ fontSize: 28, color, marginBottom: 8 }} />
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ion-color-dark)' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 4 }}>{title}</div>
      </IonCardContent>
    </IonCard>
  );

  const renderBarra = (valor: number, max: number, color: string) => (
    <div style={{ height: 8, borderRadius: 4, backgroundColor: '#E8E8E8', flex: 1, minWidth: 60 }}>
      <div style={{ height: 8, borderRadius: 4, backgroundColor: color, width: `${max > 0 ? Math.min((valor / max) * 100, 100) : 0}%` }} />
    </div>
  );

  return (
    <IonPage>
      <AppBar title="Painel Gerencial" />
      <IonContent>
        <PeriodoFilter value={periodo} onChange={setPeriodo} />

        <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as string)}>
          <IonSegmentButton value="visao-geral"><IonLabel>Visão Geral</IonLabel></IonSegmentButton>
          <IonSegmentButton value="pesquisas"><IonLabel>Pesquisas e Ensaios</IonLabel></IonSegmentButton>
          <IonSegmentButton value="uso-lab"><IonLabel>Uso do Laboratório</IonLabel></IonSegmentButton>
          <IonSegmentButton value="inventario"><IonLabel>Inventário</IonLabel></IonSegmentButton>
        </IonSegment>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : (
          <div style={{ padding: 16 }}>
            {/* TAB: Visão Geral */}
            {tab === 'visao-geral' && visaoGeral && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  {renderKpiCard('Pesquisas Ativas', visaoGeral.pesquisasAtivas, flaskOutline, '#0095DB')}
                  {renderKpiCard('Ensaios no Período', visaoGeral.ensaiosPeriodo, analyticsOutline, '#009d43')}
                  {renderKpiCard('Taxa Comparecimento', `${visaoGeral.taxaComparecimento}%`, calendarOutline, '#6C3483')}
                  {renderKpiCard('Equip. Críticos', visaoGeral.equipamentosCriticos, warningOutline, visaoGeral.equipamentosCriticos > 0 ? '#C0392B' : '#898888')}
                  {renderKpiCard('Ocorr. Abertas', visaoGeral.ocorrenciasAbertas, warningOutline, visaoGeral.ocorrenciasAbertas > 0 ? '#E6A817' : '#898888')}
                  {renderKpiCard('Métricas', '-', cubeOutline, '#898888')}
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Ensaios por Mês</div>
                <IonCard style={{ borderRadius: 12, marginBottom: 16 }}>
                  <IonCardContent>
                    {visaoGeral.ensaiosPorMes.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', textAlign: 'center' }}>Sem dados</p>
                    ) : (
                      visaoGeral.ensaiosPorMes.map((e) => (
                        <div key={e.mes} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ width: 60, fontSize: 11, color: 'var(--ion-color-medium)' }}>{e.mes}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 30 }}>{e.total}</span>
                          {renderBarra(e.total, Math.max(...visaoGeral.ensaiosPorMes.map((x) => x.total), 1), '#0095DB')}
                        </div>
                      ))
                    )}
                  </IonCardContent>
                </IonCard>

                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Comparecimento</div>
                <IonCard style={{ borderRadius: 12, marginBottom: 16 }}>
                  <IonCardContent>
                    {visaoGeral.comparecimento.map((c) => (
                      <div key={c.comparecimento} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13 }}>{c.comparecimento === 'compareceu' ? '✓ Compareceu' : c.comparecimento === 'nao_compareceu' ? '✗ Não Compareceu' : c.comparecimento}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{c.total}</span>
                      </div>
                    ))}
                  </IonCardContent>
                </IonCard>
              </>
            )}

            {/* TAB: Pesquisas e Ensaios */}
            {tab === 'pesquisas' && pesquisasEnsaios && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Ensaios por Tipo</div>
                <IonCard style={{ borderRadius: 12, marginBottom: 16 }}>
                  <IonCardContent>
                    {pesquisasEnsaios.ensaiosPorTipo.map((e) => (
                      <div key={e.tipo_ensaio} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ flex: 1, fontSize: 12 }}>{e.tipo_ensaio.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 30 }}>{e.total}</span>
                        {renderBarra(e.total, Math.max(...pesquisasEnsaios.ensaiosPorTipo.map((x) => x.total), 1), '#009d43')}
                      </div>
                    ))}
                  </IonCardContent>
                </IonCard>

                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Pesquisas Recentes</div>
                {pesquisasEnsaios.pesquisasRecentes.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--ion-color-medium)' }}>Nenhuma pesquisa no período.</p>
                ) : (
                  <IonList inset>
                    {pesquisasEnsaios.pesquisasRecentes.slice(0, 5).map((p: any) => (
                      <IonItem key={p.id} button onClick={() => history.push(`/app/ensaios/pesquisa/${p.id}`)} detail>
                        <IonLabel>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{p.titulo}</div>
                          <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{p.contexto} · {p.status}</div>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                )}

                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginTop: 16, marginBottom: 8 }}>Resultados</div>
                {pesquisasEnsaios.resultadosEnsaios.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--ion-color-medium)' }}>Nenhum resultado no período.</p>
                ) : (
                  <IonList inset>
                    {pesquisasEnsaios.resultadosEnsaios.slice(0, 5).map((r: any, i: number) => (
                      <IonItem key={i}>
                        <IonLabel>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{r.pesquisa_titulo}</div>
                          <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                            {r.numero_amostra} · h_médio: {r.h_medio?.toFixed(2)}% · {r.data_fim ? new Date(r.data_fim).toLocaleDateString('pt-BR') : ''}
                          </div>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </>
            )}

            {/* TAB: Uso do Laboratório */}
            {tab === 'uso-lab' && usoLab && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Ocupação por Dia da Semana</div>
                <IonCard style={{ borderRadius: 12, marginBottom: 16 }}>
                  <IonCardContent>
                    {usoLab.ocupacaoPorDiaSemana.map((d) => (
                      <div key={d.dia_semana} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 70, fontSize: 11, color: 'var(--ion-color-medium)' }}>{d.dia_semana}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 30 }}>{d.total}</span>
                        {renderBarra(d.total, Math.max(...usoLab.ocupacaoPorDiaSemana.map((x) => x.total), 1), '#0095DB')}
                      </div>
                    ))}
                  </IonCardContent>
                </IonCard>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <IonCard style={{ borderRadius: 12 }}>
                    <IonCardContent>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Usuários Frequentes</div>
                      {usoLab.usuariosFrequentes.slice(0, 5).map((u, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                          <span>{u.nome}</span>
                          <span style={{ fontWeight: 600 }}>{u.total}</span>
                        </div>
                      ))}
                    </IonCardContent>
                  </IonCard>
                  <IonCard style={{ borderRadius: 12 }}>
                    <IonCardContent>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Técnicos</div>
                      {usoLab.tecnicosSupervisoes.slice(0, 5).map((t, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                          <span>{t.nome}</span>
                          <span style={{ fontWeight: 600 }}>{t.total}</span>
                        </div>
                      ))}
                    </IonCardContent>
                  </IonCard>
                </div>

                <IonCard style={{ borderRadius: 12, marginTop: 16 }}>
                  <IonCardContent>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Estatísticas</div>
                    <IonItem lines="none"><IonLabel position="stacked"><small>Agendamentos</small></IonLabel><div>{usoLab.estatisticas.totalAgendamentos}</div></IonItem>
                    <IonItem lines="none"><IonLabel position="stacked"><small>Datas</small></IonLabel><div>{usoLab.estatisticas.totalDatas}</div></IonItem>
                    <IonItem lines="none"><IonLabel position="stacked"><small>Comparecimento</small></IonLabel><div>{usoLab.estatisticas.taxaComparecimento}% ({usoLab.estatisticas.compareceram}/{usoLab.estatisticas.compareceram + usoLab.estatisticas.naoCompareceram})</div></IonItem>
                    <IonItem lines="none"><IonLabel position="stacked"><small>Cancelamentos</small></IonLabel><div>{usoLab.estatisticas.cancelados}</div></IonItem>
                  </IonCardContent>
                </IonCard>
              </>
            )}

            {/* TAB: Inventário */}
            {tab === 'inventario' && inventario && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Equipamentos por Estado</div>
                <IonCard style={{ borderRadius: 12, marginBottom: 16 }}>
                  <IonCardContent>
                    {inventario.equipamentosPorEstado.map((e) => (
                      <div key={e.estado} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ flex: 1, fontSize: 12 }}>{e.estado.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 30 }}>{e.total}</span>
                        {renderBarra(e.total, Math.max(...inventario.equipamentosPorEstado.map((x) => x.total), 1), '#0095DB')}
                      </div>
                    ))}
                  </IonCardContent>
                </IonCard>

                {inventario.equipamentosCalibracaoVencida.length > 0 && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#C0392B', marginBottom: 8 }}>
                      <IonIcon icon={warningOutline} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      Calibração Vencida
                    </div>
                    <IonList inset>
                      {inventario.equipamentosCalibracaoVencida.map((e: any, i: number) => (
                        <IonItem key={i}>
                          <IonLabel>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{e.nome}</div>
                            <div style={{ fontSize: 12, color: '#C0392B' }}>
                              {e.dias_vencido} dias vencido · {e.estado}
                            </div>
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  </>
                )}

                {inventario.materiaisEstoqueBaixo.length > 0 && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#E6A817', marginBottom: 8, marginTop: 16 }}>
                      <IonIcon icon={warningOutline} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      Estoque Baixo
                    </div>
                    <IonList inset>
                      {inventario.materiaisEstoqueBaixo.map((m: any, i: number) => (
                        <IonItem key={i}>
                          <IonLabel>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{m.nome}</div>
                            <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                              {m.quantidade_atual} {m.unidade_medida} / Ponto pedido: {m.ponto_pedido}
                            </div>
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  </>
                )}

                <div style={{ padding: '16px 0' }}>
                  <IonChip color="primary" onClick={() => history.push('/app/inventario')} style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
                    Abrir Inventário Completo →
                  </IonChip>
                </div>
              </>
            )}
          </div>
        )}
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

// Wrapper com AdminGuard para R175
const PainelGerencialPageWithGuard: React.FC = () => (
  <AdminGuard><PainelGerencialPage /></AdminGuard>
);

export default PainelGerencialPageWithGuard;
