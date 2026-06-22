import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
} from '@ionic/react';
import {
  calendarOutline,
  flaskOutline,
  timeOutline,
  cubeOutline,
  warningOutline,
  clipboardOutline,
  constructOutline,
  alertCircleOutline,
  homeOutline,
  layersOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppBar from '../components/AppBar';
import GreetingHeader from '../components/GreetingHeader';
import HomeViewPager from '../components/HomeViewPager';
import InfoCard from '../components/InfoCard';
import { AgendamentoService } from '../services/AgendamentoService';
import { AmostragemService } from '../services/AmostragemService';
import { EnsaioBaseService } from '../services/EnsaioBaseService';
import { LogService } from '../services/LogService';
import { CalendarioService } from '../services/CalendarioService';
import { InventarioService } from '../services/InventarioService';
import { PainelGerencialService } from '../services/PainelGerencialService';
import type { LogSistema, IndicadoresVisaoGeral } from '../models/types';
import './Home.css';

const HomePage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();

  const isColaborador = usuario?.permissao === 'colaborador' || usuario?.permissao === 'chefia';
  const isChefia = usuario?.permissao === 'chefia';
  const nome = usuario?.nome || 'Usuario';

  const [proximo, setProximo] = useState<{ data: string; horaInicio: string; horaFim: string; pesquisa: string; tecnico: string } | null>(null);
  const [ensaioAndamento, setEnsaioAndamento] = useState<{ id: string; tipo: string; amostra: string; determinacoes: number; total: number } | null>(null);
  const [atividades, setAtividades] = useState<LogSistema[]>([]);
  const [amostrasMes, setAmostrasMes] = useState(0);
  const [ocorrenciasProprias, setOcorrenciasProprias] = useState(0);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState(0);
  const [calendarioStatus, setCalendarioStatus] = useState<{ label: string; status: string } | null>(null);
  const [dadosKpi, setDadosKpi] = useState<IndicadoresVisaoGeral | null>(null);
  const [estoqueBaixo, setEstoqueBaixo] = useState(0);
  const [resumoDia, setResumoDia] = useState<{ totalAgendamentos: number; tecnicoPlantao: string | null }>({ totalAgendamentos: 0, tecnicoPlantao: null });

  useEffect(() => {
    if (!usuario) return;
    const load = async () => {
      try {
        const mesAtual = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        const periodo = { dataInicio: inicioMes, dataFim: hoje.toISOString(), preset: 'este_mes' as const };

        const cargasComum: Promise<unknown>[] = [
          AgendamentoService.obterProximoAgendamento(usuario.userId),
          EnsaioBaseService.listarPorUsuario(usuario.userId),
          LogService.buscarPorUsuario(usuario.userId, ['autenticacao', 'agendamento', 'ensaios', 'estoque'], 1, 4),
          AmostragemService.contarAmostrasMes(usuario.userId),
        ];

        let dadosColaborador: unknown[] = [];
        let dadosChefia: unknown[] = [];

        if (isColaborador) {
          dadosColaborador = await Promise.all([
            AgendamentoService.contarSolicitacoesPendentes(),
            CalendarioService.obterCalendarioPorMes(mesAtual),
            InventarioService.verificarEstoqueMinimo(),
            AgendamentoService.obterResumoDoDia(),
          ]);
        }

        if (isChefia) {
          dadosChefia = [await PainelGerencialService.obterIndicadoresVisaoGeral(periodo)];
        }

        const [proximoResult, ensaiosResult, logsResult, amostrasResult] = await Promise.all(cargasComum) as [
          { data: string; horaInicio: string; horaFim: string; pesquisa: string; tecnico: string } | null,
          { id: string; tipo_ensaio: string; status: string; amostra_numero?: string; numero_determinacoes?: number }[],
          { logs: LogSistema[]; total: number } | undefined,
          number
        ];

        setProximo(proximoResult);

        const emAndamento = (ensaiosResult || []).find((e) => e.status === 'em_andamento');
        if (emAndamento) {
          setEnsaioAndamento({
            id: emAndamento.id,
            tipo: emAndamento.tipo_ensaio,
            amostra: emAndamento.amostra_numero || '—',
            determinacoes: emAndamento.numero_determinacoes || 0,
            total: Math.max(emAndamento.numero_determinacoes || 0, 3),
          });
        }

        if (logsResult?.logs) setAtividades(logsResult.logs);
        setAmostrasMes(amostrasResult);

        if (isColaborador && dadosColaborador.length >= 4) {
          const [solicitacoes, calendario, estoque, resumo] = dadosColaborador as [number, { status: string; mes_ano: string } | null, { length: number }[], { totalAgendamentos: number; tecnicoPlantao: string | null }];
          setSolicitacoesPendentes(solicitacoes);
          if (calendario) setCalendarioStatus({ label: calendario.mes_ano, status: calendario.status === 'publicado' ? 'Publicado' : 'Pendente' });
          setEstoqueBaixo((estoque || []).length || 0);
          if (resumo) setResumoDia(resumo);
        }

        if (isChefia && dadosChefia.length > 0) {
          setDadosKpi(dadosChefia[0] as IndicadoresVisaoGeral);
        }

        const ocorrData = await InventarioService.listarOcorrencias({}, 1, usuario.userId, true);
        setOcorrenciasProprias(ocorrData?.total || 0);
      } catch {
        /* silencioso */
      }
    };
    load();
  }, [usuario, isColaborador, isChefia]);

  const hoje = new Date().toISOString().split('T')[0];

  const tabMinhaVisao = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {proximo ? (
        <InfoCard
          variant="standard"
          title="Proximo Agendamento"
          titleIcon={calendarOutline}
          linkLabel="Ver detalhes"
          onLinkClick={() => history.push('/app/agendamentos')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 14, color: 'var(--ion-color-medium)' }}>
              {proximo.data} &middot; {proximo.horaInicio} as {proximo.horaFim}
            </span>
            <span style={{ fontSize: 13, color: 'var(--ion-color-dark)' }}>
              Pesquisa: {proximo.pesquisa}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
              Tecnico: {proximo.tecnico}
            </span>
          </div>
        </InfoCard>
      ) : (
        <InfoCard
          variant="standard"
          title="Proximo Agendamento"
          titleIcon={calendarOutline}
          linkLabel="Agendar"
          onLinkClick={() => history.push('/app/agendar')}
        >
          <div style={{ fontSize: 14, color: 'var(--ion-color-medium)' }}>
            Nenhum agendamento futuro encontrado.
          </div>
        </InfoCard>
      )}

      {ensaioAndamento ? (
        <InfoCard
          variant="standard"
          title="Ensaio em Andamento"
          titleIcon={flaskOutline}
          linkLabel="Continuar"
          onLinkClick={() => history.push(`/app/ensaios/${ensaioAndamento.id}/teor-umidade`)}
          progress={ensaioAndamento.total > 0 ? Math.round((ensaioAndamento.determinacoes / ensaioAndamento.total) * 100) : 0}
        >
          <div style={{ fontSize: 14, color: 'var(--ion-color-dark)', fontWeight: 500 }}>
            {ensaioAndamento.tipo === 'teor_umidade' ? 'Teor de Umidade' : ensaioAndamento.tipo}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 2 }}>
            Amostra: {ensaioAndamento.amostra} &middot; {ensaioAndamento.determinacoes} de {ensaioAndamento.total} determinacoes
          </div>
        </InfoCard>
      ) : null}

      <InfoCard
        variant="standard"
        title="Atividade Recente"
        titleIcon={timeOutline}
        linkLabel="Ver todas"
        onLinkClick={() => history.push('/app/atividade')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {atividades.length > 0 ? atividades.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--ion-color-medium)', whiteSpace: 'nowrap' }}>
                {new Date(item.data_criacao).toLocaleDateString('pt-BR')}
              </span>
              <span style={{ color: 'var(--ion-color-dark)' }}>{item.acao}</span>
            </div>
          )) : (
            <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
              Nenhuma atividade recente registrada.
            </div>
          )}
        </div>
      </InfoCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <InfoCard variant="mini" title="Amostras este mes" value={amostrasMes} icon={cubeOutline} />
        <InfoCard
          variant="mini"
          title="Minhas Ocorrencias Abertas"
          value={ocorrenciasProprias}
          icon={warningOutline}
          colorAccent={ocorrenciasProprias > 0 ? '#E6A817' : undefined}
        />
      </div>
    </div>
  );

  const tabLaboratorio = isColaborador ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <InfoCard
        variant="standard"
        title="Solicitacoes de Agendamento"
        titleIcon={clipboardOutline}
        linkLabel="Ver todas"
        onLinkClick={() => history.push('/app/solicitacoes-pendentes')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: '#E8EDF6',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: 20, fontWeight: 700, color: 'var(--ion-color-primary)',
          }}>
            {solicitacoesPendentes}
          </div>
          <span style={{ fontSize: 14, color: 'var(--ion-color-dark)' }}>
            solicitacoes pendentes de aprovacao
          </span>
        </div>
      </InfoCard>

      {calendarioStatus && (
        <InfoCard
          variant="standard"
          title="Calendario do Laboratorio"
          titleIcon={calendarOutline}
          linkLabel="Configurar"
          onLinkClick={() => history.push('/app/configurar-calendario')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '4px 10px', borderRadius: 12,
              backgroundColor: calendarioStatus.status === 'Publicado' ? '#009d4320' : '#E6A81720',
              color: calendarioStatus.status === 'Publicado' ? '#009d43' : '#E6A817',
              fontSize: 12, fontWeight: 500,
            }}>
              {calendarioStatus.label} - {calendarioStatus.status}
            </span>
          </div>
        </InfoCard>
      )}

      <InfoCard
        variant="standard"
        title="Equipamentos Criticos"
        titleIcon={constructOutline}
        linkLabel="Ver inventario"
        onLinkClick={() => history.push('/app/inventario')}
      >
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#C0392B' }}>
              {dadosKpi?.equipamentosCriticos || 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ion-color-medium)' }}>Criticos</div>
          </div>
        </div>
      </InfoCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <InfoCard variant="mini" title="Ocorrencias Abertas" value={dadosKpi?.ocorrenciasAbertas || 0} icon={warningOutline} colorAccent="#C0392B" />
        <InfoCard variant="mini" title="Estoque Baixo" value={estoqueBaixo} icon={layersOutline} colorAccent={estoqueBaixo > 0 ? '#E6A817' : undefined} />
      </div>

      <InfoCard
        variant="standard"
        title="Hoje no Laboratorio"
        titleIcon={homeOutline}
        linkLabel="Ver agenda do dia"
        onLinkClick={() => history.push(`/app/agendar/dia/${hoje}/agendamentos`)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 14, color: 'var(--ion-color-dark)' }}>{resumoDia.totalAgendamentos} agendamentos hoje</span>
          {resumoDia.tecnicoPlantao && (
            <span style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
              Tecnico de plantao: {resumoDia.tecnicoPlantao}
            </span>
          )}
        </div>
      </InfoCard>
    </div>
  ) : null;

  const tabGestao = isChefia && dadosKpi ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        fontSize: 14, fontWeight: 500, color: 'var(--ion-color-medium)',
        padding: '0 4px', textTransform: 'uppercase',
      }}>
        {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <InfoCard variant="kpi" title="Pesquisas Ativas" value={dadosKpi.pesquisasAtivas} colorAccent="var(--ion-color-primary)" />
        <InfoCard variant="kpi" title="Ensaios este Mes" value={dadosKpi.ensaiosPeriodo} colorAccent="var(--ion-color-secondary)" />
        <InfoCard variant="kpi" title="Ocupacao Media" value={`${dadosKpi.ocupacaoMedia}%`} colorAccent="#009d43" />
        <InfoCard variant="kpi" title="Comparecimento" value={`${dadosKpi.taxaComparecimento}%`} colorAccent="#009d43" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <InfoCard variant="mini" title="Equip. Criticos" value={dadosKpi.equipamentosCriticos} icon={constructOutline} colorAccent="#C0392B" />
        <InfoCard variant="mini" title="Ocorrencias Abertas" value={dadosKpi.ocorrenciasAbertas} icon={warningOutline} colorAccent="#E6A817" />
      </div>

      <InfoCard
        variant="standard"
        title="Notificacoes da Gestao"
        titleIcon={alertCircleOutline}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {calendarioStatus && calendarioStatus.status !== 'Publicado' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, backgroundColor: '#E6A817' }} />
              <span style={{ fontSize: 12, color: 'var(--ion-color-dark)' }}>Calendario de {calendarioStatus.label} nao foi publicado</span>
            </div>
          )}
          {dadosKpi.equipamentosCriticos > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, backgroundColor: '#C0392B' }} />
              <span style={{ fontSize: 12, color: 'var(--ion-color-dark)' }}>{dadosKpi.equipamentosCriticos} equipamentos requerem atencao</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, backgroundColor: '#0095DB' }} />
            <span style={{ fontSize: 12, color: 'var(--ion-color-dark)' }}>Taxa de nao comparecimento: {100 - dadosKpi.taxaComparecimento}% este mes</span>
          </div>
          {estoqueBaixo > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, backgroundColor: '#E6A817' }} />
              <span style={{ fontSize: 12, color: 'var(--ion-color-dark)' }}>{estoqueBaixo} itens com estoque abaixo do minimo</span>
            </div>
          )}
        </div>
      </InfoCard>

      <div
        onClick={() => history.push('/app/painel-gerencial')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '12px 0',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-primary)' }}>
          Abrir Painel Gerencial Completo
        </span>
        <span style={{ fontSize: 16, color: 'var(--ion-color-primary)' }}>&rarr;</span>
      </div>
    </div>
  ) : null;

  return (
    <IonPage>
      <AppBar title="Home" />
      <IonContent>
        <div className="home-dashboard">
          <GreetingHeader nome={nome} />
          <HomeViewPager
            tabs={[
              { id: 'minha-visao', label: 'Minha Visao', condition: true, content: tabMinhaVisao },
              { id: 'laboratorio', label: 'Laboratorio', condition: isColaborador, content: tabLaboratorio },
              { id: 'gestao', label: 'Gestao', condition: isChefia, content: tabGestao },
            ]}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
