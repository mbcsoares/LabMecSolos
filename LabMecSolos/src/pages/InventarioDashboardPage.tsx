import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonIcon, IonSpinner, IonButton, IonAlert, IonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  flaskOutline, cubeOutline, settingsOutline, folderOutline,
  warningOutline, alertCircleOutline, timeOutline, flagOutline,
  constructOutline, documentTextOutline, calendarNumberOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import AppBar from '../components/AppBar';
import InfoCard from '../components/InfoCard';
import { InventarioService } from '../services/InventarioService';
import { InventarioJobs } from '../services/InventarioJobs';
import { RelatorioInventarioService } from '../services/RelatorioInventarioService';
import { exportarPDF } from '../services/PdfBaseService';
import { queryRows } from '../services/DatabaseService';
import type { AlertaEstoque } from '../models/types';

const InventarioDashboardPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const [counts, setCounts] = useState({ materiais: 0, utensilios: 0, equipamentos: 0, categorias: 0 });
  const [alertasEstoque, setAlertasEstoque] = useState<AlertaEstoque[]>([]);
  const [calVencidos, setCalVencidos] = useState<{ id: string; nome: string; diasRestantes: number }[]>([]);
  const [calProximos, setCalProximos] = useState<{ id: string; nome: string; diasRestantes: number }[]>([]);
  const [ocorrenciasAbertas, setOcorrenciasAbertas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCalAlert, setShowCalAlert] = useState(false);
  const [calMessage, setCalMessage] = useState('');
  const [showItemsAlert, setShowItemsAlert] = useState(false);
  const [itemsAlertHeader, setItemsAlertHeader] = useState('');
  const [itemsAlertMessage, setItemsAlertMessage] = useState('');
  const [showPeriodoDialog, setShowPeriodoDialog] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [relatorioToast, setRelatorioToast] = useState('');
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [mat, ute, equi, cat] = await Promise.all([
          queryRows<{ total: number }>("SELECT COUNT(*) as total FROM itens WHERE tipo = 'material' AND status = 'ativo'"),
          queryRows<{ total: number }>("SELECT COUNT(*) as total FROM itens WHERE tipo = 'utensilio' AND status = 'ativo'"),
          queryRows<{ total: number }>("SELECT COUNT(*) as total FROM itens WHERE tipo = 'equipamento' AND status = 'ativo'"),
          queryRows<{ total: number }>("SELECT COUNT(*) as total FROM categorias_item WHERE status = 'ativa'"),
        ]);
        setCounts({
          materiais: mat[0]?.total || 0,
          utensilios: ute[0]?.total || 0,
          equipamentos: equi[0]?.total || 0,
          categorias: cat[0]?.total || 0,
        });

        const [alertas, ocorr] = await Promise.all([
          InventarioService.verificarEstoqueMinimo(),
          queryRows<{ total: number }>("SELECT COUNT(*) as total FROM ocorrencias WHERE status = 'aberta'"),
        ]);
        setAlertasEstoque(alertas);
        setOcorrenciasAbertas(ocorr[0]?.total || 0);

        const cal = await InventarioService.verificarCalibracoes();
        setCalVencidos(cal.todosItens.filter((e) => e.diasRestantes <= 0));
        setCalProximos(cal.todosItens.filter((e) => e.diasRestantes > 0 && e.diasRestantes <= 30));
      } catch { /* */ }
      setLoading(false);
    };
    load();
  }, []);

  const handleAlertaClick = (items: { id: string; nome: string }[], header: string) => {
    if (items.length === 1) {
      history.push(`/app/inventario/item/${items[0].id}`);
    } else {
      setItemsAlertHeader(header);
      setItemsAlertMessage(items.map((it) => `${it.nome}`).join('\n'));
      setShowItemsAlert(true);
    }
  };

  const temAlertas = alertasEstoque.length > 0 || calVencidos.length > 0 || calProximos.length > 0 || ocorrenciasAbertas > 0;

  const isColaborador = usuario?.permissao === 'colaborador' || usuario?.permissao === 'chefia';

  const handleGerarRelatorioInventario = async () => {
    if (!usuario || gerandoRelatorio) return;
    setGerandoRelatorio(true);
    try {
      const dataUrl = await RelatorioInventarioService.gerarRelatorioInventario(usuario.userId);
      await exportarPDF(dataUrl, `Relatorio_Inventario_${new Date().toISOString().split('T')[0]}.pdf`);
      setRelatorioToast('Relatorio de inventario gerado com sucesso.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('ERRO PDF INVENTARIO:', msg, e);
      setRelatorioToast('Erro ao gerar: ' + msg);
    }
    setGerandoRelatorio(false);
  };

  const handleGerarRelatorioMovimentacoes = async () => {
    if (!usuario || gerandoRelatorio) return;
    const hoje = new Date().toISOString().split('T')[0];
    const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDataInicio(trintaDiasAtras);
    setDataFim(hoje);
    setShowPeriodoDialog(true);
  };

  const handleConfirmarPeriodo = async () => {
    if (!dataInicio || !dataFim || !usuario) return;
    setShowPeriodoDialog(false);
    setGerandoRelatorio(true);
    try {
      const dataFimAjustada = `${dataFim}T23:59:59.000Z`;
      const dataInicioAjustada = `${dataInicio}T00:00:00.000Z`;
      const dataUrl = await RelatorioInventarioService.gerarRelatorioMovimentacoes(dataInicioAjustada, dataFimAjustada, usuario.userId);
      await exportarPDF(dataUrl, `Relatorio_Movimentacoes_${dataInicio}_a_${dataFim}.pdf`);
      setRelatorioToast('Relatorio de movimentacoes gerado com sucesso.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('ERRO PDF MOVIMENTACOES:', msg, e);
      setRelatorioToast('Erro ao gerar: ' + msg);
    }
    setGerandoRelatorio(false);
  };

  return (
    <IonPage>
      <AppBar title="Inventario" />
      <IonContent>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
              <IonSpinner name="crescent" color="primary" />
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <InfoCard variant="kpi" title="Materiais" value={counts.materiais} icon={flaskOutline}
                  onClick={() => history.push('/app/inventario/itens?tipo=material')} />
                <InfoCard variant="kpi" title="Utensilios" value={counts.utensilios} icon={cubeOutline}
                  onClick={() => history.push('/app/inventario/itens?tipo=utensilio')} />
                <InfoCard variant="kpi" title="Equipamentos" value={counts.equipamentos} icon={settingsOutline}
                  onClick={() => history.push('/app/inventario/itens?tipo=equipamento')} />
                <InfoCard variant="kpi" title="Categorias" value={counts.categorias} icon={folderOutline}
                  onClick={() => history.push('/app/inventario/categorias')} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <IonButton expand="block" fill="outline" onClick={() => history.push('/app/inventario/itens')}>
                  <IonIcon slot="start" icon={cubeOutline} />
                  Todos os Itens
                </IonButton>
                <IonButton expand="block" fill="outline" onClick={async () => {
                  if (!usuario) return;
                  const r = await InventarioJobs.verificarCalibracaoJob(usuario.userId);
                  const vencidos = r.proximosVencimento.filter((e) => e.diasRestantes <= 0);
                  const proximos = r.proximosVencimento.filter((e) => e.diasRestantes > 0);
                  const linhas: string[] = [`Total: ${r.totalEquipamentos} equipamentos verificados.`];
                  if (vencidos.length > 0) linhas.push(`Vencidos: ${r.vencidos} — ${vencidos.map((e) => e.nome).join(', ')}`);
                  if (proximos.length > 0) linhas.push(`Proximos: ${proximos.map((e) => `${e.nome} (${e.diasRestantes}d)`).join(', ')}`);
                  else if (vencidos.length === 0) linhas.push('Nenhum equipamento com calibracao pendente.');
                  setCalMessage(linhas.join('\n'));
                  setShowCalAlert(true);
                }}>
                  <IonIcon slot="start" icon={constructOutline} />
                  Verificar Calibracoes
                </IonButton>
              </div>

              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)', margin: '8px 0 0 0' }}>Alertas</p>

              {!temAlertas ? (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--ion-color-medium)' }}>
                  <IonIcon icon={flagOutline} style={{ fontSize: 32, color: '#009d43', marginBottom: 8 }} />
                  <p style={{ fontSize: 13, margin: 0 }}>Nenhum alerta no momento.</p>
                </div>
              ) : (
                <>
                  {alertasEstoque.length > 0 && (
                    <div onClick={() => handleAlertaClick(alertasEstoque.map((a) => ({ id: a.idItem, nome: a.nome })), 'Estoque Baixo')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--app-alert-warning-bg)', borderRadius: 8, cursor: 'pointer', border: '1px solid #E6A81730' }}>
                      <IonIcon icon={warningOutline} style={{ color: '#E6A817', fontSize: 20 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-dark)' }}>Estoque Baixo</div>
                        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                          {alertasEstoque.length === 1 ? alertasEstoque[0].nome : `${alertasEstoque.length} itens abaixo do ponto de pedido`}
                        </div>
                      </div>
                    </div>
                  )}
                  {calVencidos.length > 0 && (
                    <div onClick={() => handleAlertaClick(calVencidos, 'Calibracoes Vencidas')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--app-alert-danger-bg)', borderRadius: 8, cursor: 'pointer', border: '1px solid #C0392B30' }}>
                      <IonIcon icon={alertCircleOutline} style={{ color: '#C0392B', fontSize: 20 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-dark)' }}>Calibracoes Vencidas</div>
                        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                          {calVencidos.length === 1 ? calVencidos[0].nome : `${calVencidos.length} equipamentos`}
                        </div>
                      </div>
                    </div>
                  )}
                  {calProximos.length > 0 && (
                    <div onClick={() => handleAlertaClick(calProximos, 'Calibracoes Proximas')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--app-alert-warning-bg)', borderRadius: 8, cursor: 'pointer', border: '1px solid #E6A81730' }}>
                      <IonIcon icon={timeOutline} style={{ color: '#E6A817', fontSize: 20 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-dark)' }}>Calibracoes Proximas</div>
                        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                          {calProximos.length === 1 ? calProximos[0].nome : `${calProximos.length} equipamentos`}
                        </div>
                      </div>
                    </div>
                  )}
                  {ocorrenciasAbertas > 0 && (
                    <div onClick={() => history.push('/app/inventario/ocorrencias?status=aberta')}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--app-alert-danger-bg)', borderRadius: 8, cursor: 'pointer', border: '1px solid #C0392B30' }}>
                      <IonIcon icon={flagOutline} style={{ color: '#C0392B', fontSize: 20 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-dark)' }}>Ocorrencias Abertas</div>
                        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{ocorrenciasAbertas} ocorrencias</div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {isColaborador && (
                <>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)', margin: '16px 0 4px 0' }}>Relatorios</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <IonButton expand="block" fill="outline" color="primary"
                      onClick={handleGerarRelatorioInventario} disabled={gerandoRelatorio}>
                      <IonIcon slot="start" icon={documentTextOutline} />
                      {gerandoRelatorio ? 'Gerando...' : 'Inventario'}
                    </IonButton>
                    <IonButton expand="block" fill="outline" color="primary"
                      onClick={handleGerarRelatorioMovimentacoes} disabled={gerandoRelatorio}>
                      <IonIcon slot="start" icon={calendarNumberOutline} />
                      {gerandoRelatorio ? 'Gerando...' : 'Movimentacoes'}
                    </IonButton>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <IonAlert isOpen={showCalAlert} onDidDismiss={() => setShowCalAlert(false)} header="Verificacao de Calibracoes" message={calMessage} buttons={['OK']} />
        <IonAlert isOpen={showItemsAlert} onDidDismiss={() => setShowItemsAlert(false)} header={itemsAlertHeader} message={itemsAlertMessage} buttons={['OK']} />
        <IonAlert
          isOpen={showPeriodoDialog}
          onDidDismiss={() => setShowPeriodoDialog(false)}
          header="Periodo do Relatorio"
          inputs={[
            { name: 'dataInicio', type: 'date', label: 'Data de Inicio', value: dataInicio },
            { name: 'dataFim', type: 'date', label: 'Data de Fim', value: dataFim },
          ]}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: 'Gerar',
              handler: (dados: Record<string, string>) => {
                setDataInicio(dados.dataInicio);
                setDataFim(dados.dataFim);
                setTimeout(() => handleConfirmarPeriodo(), 100);
              },
            },
          ]}
        />
        <IonToast
          isOpen={!!relatorioToast}
          message={relatorioToast}
          duration={2500}
          onDidDismiss={() => setRelatorioToast('')}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default InventarioDashboardPage;
