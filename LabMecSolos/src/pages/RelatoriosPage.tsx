import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonContent, IonButton, IonIcon, IonSpinner, IonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  cubeOutline, constructOutline, timeOutline,
  documentTextOutline, calendarNumberOutline, downloadOutline,
  flagOutline, calendarOutline, barChartOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import AppBar from '../components/AppBar';
import InfoCard from '../components/InfoCard';
import PeriodoFilter from '../components/PeriodoFilter';
import { PeriodoService } from '../services/PeriodoService';
import { InventarioService } from '../services/InventarioService';
import { RelatorioInventarioService } from '../services/RelatorioInventarioService';
import { RelatorioDashboardService } from '../services/RelatorioDashboardService';
import { exportarPDF } from '../services/PdfBaseService';
import { queryRows } from '../services/DatabaseService';
import type { PeriodoFiltro } from '../models/types';

const RelatoriosPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();

  const [periodo, setPeriodo] = useState<PeriodoFiltro>(() => PeriodoService.resolverPreset('30d'));
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const [invCounts, setInvCounts] = useState({ materiais: 0, utensilios: 0, equipamentos: 0 });
  const [estoqueBaixo, setEstoqueBaixo] = useState(0);
  const [calVencidos, setCalVencidos] = useState(0);
  const [calProximos, setCalProximos] = useState(0);

  const [ocorrenciasAbertas, setOcorrenciasAbertas] = useState(0);
  const [ocorrenciasEmAnalise, setOcorrenciasEmAnalise] = useState(0);
  const [ocorrenciasResolvidas, setOcorrenciasResolvidas] = useState(0);
  const [ocorrenciasFechadas, setOcorrenciasFechadas] = useState(0);
  const [tempoMedioResolucao, setTempoMedioResolucao] = useState<number | null>(null);

  const [totalAgendamentos, setTotalAgendamentos] = useState(0);
  const [agendamentosAprovados, setAgendamentosAprovados] = useState(0);
  const [percentCompareceu, setPercentCompareceu] = useState<number | null>(null);
  const [percentNaoCompareceu, setPercentNaoCompareceu] = useState<number | null>(null);
  const [horasOcupadas, setHorasOcupadas] = useState(0);

  const carregar = useCallback(async (filtro: PeriodoFiltro) => {
    setLoading(true);
    try {
      const dataInicio = `${filtro.dataInicio}T00:00:00.000Z`;
      const dataFim = `${filtro.dataFim}T23:59:59.000Z`;

      const [mat, ute, equi, alertas, cal, occStatus, occTempo, agStats, compStats, compHoras] = await Promise.all([
        queryRows<{ total: number }>("SELECT COUNT(*) as total FROM itens WHERE tipo = 'material' AND status = 'ativo'"),
        queryRows<{ total: number }>("SELECT COUNT(*) as total FROM itens WHERE tipo = 'utensilio' AND status = 'ativo'"),
        queryRows<{ total: number }>("SELECT COUNT(*) as total FROM itens WHERE tipo = 'equipamento' AND status = 'ativo'"),
        InventarioService.verificarEstoqueMinimo(),
        InventarioService.verificarCalibracoes(),
        queryRows<{ status: string; total: number }>(
          `SELECT status, COUNT(*) as total FROM ocorrencias WHERE data_abertura >= ? AND data_abertura <= ? GROUP BY status`,
          [dataInicio, dataFim]
        ),
        queryRows<{ media_dias: number }>(
          `SELECT ROUND(AVG(julianday(data_resolucao) - julianday(data_abertura))) as media_dias
           FROM ocorrencias WHERE status IN ('resolvida','fechada') AND data_resolucao IS NOT NULL
           AND data_abertura >= ? AND data_abertura <= ?`,
          [dataInicio, dataFim]
        ),
        queryRows<{ total: number; aprovados: number }>(
          `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'aprovado' THEN 1 END) as aprovados
           FROM agendamentos WHERE data_solicitacao >= ? AND data_solicitacao <= ?`,
          [dataInicio, dataFim]
        ),
        queryRows<{ compareceram: number; nao_compareceram: number }>(
          `SELECT COUNT(CASE WHEN ad.comparecimento = 'compareceu' THEN 1 END) as compareceram,
                  COUNT(CASE WHEN ad.comparecimento = 'nao_compareceu' THEN 1 END) as nao_compareceram
           FROM agendamento_datas ad
           INNER JOIN agendamentos a ON ad.id_agendamento = a.id
           WHERE a.status = 'aprovado' AND ad.data_agendada >= ? AND ad.data_agendada <= ?`,
          [filtro.dataInicio, filtro.dataFim]
        ),
        queryRows<{ total_horas: number }>(
          `SELECT COALESCE(SUM(
            (CAST(substr(ad.hora_fim,1,2) AS INTEGER)*60 + CAST(substr(ad.hora_fim,4,2) AS INTEGER))
            - (CAST(substr(ad.hora_inicio,1,2) AS INTEGER)*60 + CAST(substr(ad.hora_inicio,4,2) AS INTEGER))
           ) / 60.0, 0) as total_horas
           FROM agendamento_datas ad
           INNER JOIN agendamentos a ON ad.id_agendamento = a.id
           WHERE a.status = 'aprovado' AND ad.comparecimento = 'compareceu'
           AND ad.data_agendada >= ? AND ad.data_agendada <= ?`,
          [filtro.dataInicio, filtro.dataFim]
        ),
      ]);

      setInvCounts({ materiais: mat[0]?.total || 0, utensilios: ute[0]?.total || 0, equipamentos: equi[0]?.total || 0 });
      setEstoqueBaixo(alertas.length);
      setCalVencidos(cal.vencidos);
      setCalProximos(cal.proximosVencimento.length);

      const statsMap = new Map<string, number>();
      for (const o of occStatus) statsMap.set(o.status, o.total);
      setOcorrenciasAbertas(statsMap.get('aberta') || 0);
      setOcorrenciasEmAnalise(statsMap.get('em_analise') || 0);
      setOcorrenciasResolvidas(statsMap.get('resolvida') || 0);
      setOcorrenciasFechadas(statsMap.get('fechada') || 0);
      setTempoMedioResolucao(occTempo[0]?.media_dias ?? null);

      setTotalAgendamentos(agStats[0]?.total || 0);
      setAgendamentosAprovados(agStats[0]?.aprovados || 0);

      const comp = compStats[0];
      const totalAv = (comp?.compareceram || 0) + (comp?.nao_compareceram || 0);
      setPercentCompareceu(totalAv > 0 ? Math.round((comp?.compareceram || 0) / totalAv * 100) : null);
      setPercentNaoCompareceu(totalAv > 0 ? Math.round((comp?.nao_compareceram || 0) / totalAv * 100) : null);
      setHorasOcupadas(Math.round((compHoras[0]?.total_horas || 0) * 10) / 10);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { carregar(periodo); }, [periodo, carregar]);

  const handleExportar = async (tipo: string) => {
    if (!usuario) return;
    setToast(`Gerando relatorio de ${tipo}...`);
    try {
      let dataUrl: string | null = null;
      const dataInicio = `${periodo.dataInicio}T00:00:00.000Z`;
      const dataFim = `${periodo.dataFim}T23:59:59.000Z`;

      switch (tipo) {
        case 'inventario':
          dataUrl = await RelatorioInventarioService.gerarRelatorioInventario(usuario.userId);
          break;
        case 'movimentacoes':
          dataUrl = await RelatorioInventarioService.gerarRelatorioMovimentacoes(dataInicio, dataFim, usuario.userId);
          break;
        case 'calibracoes':
          dataUrl = await RelatorioDashboardService.gerarRelatorioCalibracoes(usuario.userId);
          break;
        case 'ocorrencias':
          dataUrl = await RelatorioDashboardService.gerarRelatorioOcorrencias(dataInicio, dataFim, usuario.userId);
          break;
        case 'agendamentos':
          dataUrl = await RelatorioDashboardService.gerarRelatorioAgendamentos(dataInicio, dataFim, usuario.userId);
          break;
        case 'ocupacao':
          dataUrl = await RelatorioDashboardService.gerarRelatorioOcupacao(periodo.dataInicio, periodo.dataFim, usuario.userId);
          break;
      }

      if (dataUrl) {
        const nomeArq = `Relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`;
        await exportarPDF(dataUrl, nomeArq);
        setToast(`Relatorio de ${tipo} exportado com sucesso.`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('ERRO PDF RELATORIOS:', msg, e);
      setToast('Erro: ' + msg);
    }
  };

  return (
    <IonPage>
      <AppBar title="Relatorios" />
      <IonContent>
        <PeriodoFilter value={periodo} onChange={setPeriodo} />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* SEÇÃO: INVENTÁRIO */}
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ion-color-dark)', marginTop: 4 }}>
              <IonIcon icon={cubeOutline} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Inventario
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <InfoCard variant="kpi" title="Materiais" value={invCounts.materiais}
                colorAccent="#1976D2" onClick={() => history.push('/app/inventario/itens?tipo=material')} />
              <InfoCard variant="kpi" title="Utensilios" value={invCounts.utensilios}
                colorAccent="#1976D2" onClick={() => history.push('/app/inventario/itens?tipo=utensilio')} />
              <InfoCard variant="kpi" title="Equipamentos" value={invCounts.equipamentos}
                colorAccent="#1976D2" onClick={() => history.push('/app/inventario/itens?tipo=equipamento')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <InfoCard variant="kpi" title="Estoque Baixo" value={estoqueBaixo}
                colorAccent={estoqueBaixo > 0 ? '#C0392B' : '#1E8449'}
                onClick={() => history.push('/app/inventario/itens?estoqueBaixo=true')} />
              <InfoCard variant="kpi" title="Cal. Vencidas" value={calVencidos}
                colorAccent={calVencidos > 0 ? '#C0392B' : '#1E8449'}
                onClick={() => history.push('/app/inventario/itens?tipo=equipamento&estado=calibracao_vencida')} />
              <InfoCard variant="kpi" title="Cal. Prox. 30d" value={calProximos}
                colorAccent={calProximos > 0 ? '#E6A817' : '#1E8449'}
                onClick={() => history.push('/app/inventario')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <IonButton expand="block" fill="outline" size="small" onClick={() => handleExportar('inventario')}>
                <IonIcon slot="start" icon={documentTextOutline} />
                Inventario
              </IonButton>
              <IonButton expand="block" fill="outline" size="small" onClick={() => handleExportar('movimentacoes')}>
                <IonIcon slot="start" icon={calendarNumberOutline} />
                Movimentacoes
              </IonButton>
              <IonButton expand="block" fill="outline" size="small" onClick={() => handleExportar('calibracoes')}>
                <IonIcon slot="start" icon={constructOutline} />
                Calibracoes
              </IonButton>
            </div>

            {/* SEÇÃO: OCORRÊNCIAS */}
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ion-color-dark)', marginTop: 8 }}>
              <IonIcon icon={flagOutline} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Ocorrencias
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
              <InfoCard variant="kpi" title="Abertas" value={ocorrenciasAbertas}
                colorAccent="#C0392B"
                onClick={() => history.push('/app/inventario/ocorrencias?status=aberta')} />
              <InfoCard variant="kpi" title="Em Analise" value={ocorrenciasEmAnalise}
                colorAccent="#E6A817"
                onClick={() => history.push('/app/inventario/ocorrencias?status=em_analise')} />
              <InfoCard variant="kpi" title="Resolvidas" value={ocorrenciasResolvidas}
                colorAccent="#1E8449"
                onClick={() => history.push('/app/inventario/ocorrencias?status=resolvida')} />
              <InfoCard variant="kpi" title="Fechadas" value={ocorrenciasFechadas}
                colorAccent="#616A7B"
                onClick={() => history.push('/app/inventario/ocorrencias?status=fechada')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              <InfoCard variant="mini" title="Tempo Medio de Resolucao"
                value={tempoMedioResolucao !== null ? `${tempoMedioResolucao} dias` : '--'}
                icon={timeOutline}
                colorAccent="var(--ion-color-primary)" />
            </div>

            <IonButton expand="block" fill="outline" size="small" onClick={() => handleExportar('ocorrencias')}>
              <IonIcon slot="start" icon={downloadOutline} />
              Exportar Relatorio de Ocorrencias
            </IonButton>

            {/* SEÇÃO: AGENDAMENTOS */}
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ion-color-dark)', marginTop: 8 }}>
              <IonIcon icon={calendarOutline} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Agendamentos
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <InfoCard variant="kpi" title="Total" value={totalAgendamentos}
                colorAccent="#1976D2"
                onClick={() => history.push('/app/todos-agendamentos')} />
              <InfoCard variant="kpi" title="Aprovados" value={agendamentosAprovados}
                colorAccent="#1E8449"
                onClick={() => history.push('/app/todos-agendamentos')} />
              <InfoCard variant="kpi" title="Horas Ocupadas" value={`${horasOcupadas}h`}
                colorAccent="#7D3C98" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <InfoCard variant="kpi" title="Comparecimento"
                value={percentCompareceu !== null ? `${percentCompareceu}%` : '--'}
                colorAccent={percentCompareceu !== null && percentCompareceu >= 80 ? '#1E8449' : '#C0392B'} />
              <InfoCard variant="kpi" title="Nao Comparecimento"
                value={percentNaoCompareceu !== null ? `${percentNaoCompareceu}%` : '--'}
                colorAccent={percentNaoCompareceu !== null && percentNaoCompareceu <= 20 ? '#1E8449' : '#C0392B'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <IonButton expand="block" fill="outline" size="small" onClick={() => handleExportar('agendamentos')}>
                <IonIcon slot="start" icon={documentTextOutline} />
                Agendamentos
              </IonButton>
              <IonButton expand="block" fill="outline" size="small" onClick={() => handleExportar('ocupacao')}>
                <IonIcon slot="start" icon={barChartOutline} />
                Ocupacao
              </IonButton>
            </div>

          </div>
        )}

        <IonToast
          isOpen={!!toast}
          message={toast}
          duration={2500}
          onDidDismiss={() => setToast('')}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default RelatoriosPage;
