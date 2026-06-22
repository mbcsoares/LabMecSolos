import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSpinner,
} from '@ionic/react';
import {
  documentTextOutline,
  checkmarkCircleOutline,
  logInOutline,
  warningOutline,
  logOutOutline,
  personAddOutline,
  keyOutline,
  createOutline,
  trashOutline,
  closeCircleOutline,
  ellipseOutline,
  flaskOutline,
  calendarOutline,
  cubeOutline,
} from 'ionicons/icons';
import AppBar from '../components/AppBar';
import { LogService } from '../services/LogService';
import { useAuth } from '../contexts/AuthContext';
import type { LogSistema } from '../models/types';

const ICONE_POR_ACAO: Record<string, string> = {
  login_sucesso: logInOutline,
  login_falha: warningOutline,
  logout: logOutOutline,
  criacao_conta: personAddOutline,
  confirmacao_conta: checkmarkCircleOutline,
  troca_senha: keyOutline,
  edicao_perfil: createOutline,
  exclusao_conta: trashOutline,
  pesquisa_criada: flaskOutline,
  pesquisa_editada: createOutline,
  pesquisa_concluida: checkmarkCircleOutline,
  pesquisa_cancelada: closeCircleOutline,
  pesquisa_excluida: trashOutline,
  colaborador_adicionado: personAddOutline,
  colaborador_removido: closeCircleOutline,
  programa_criado: calendarOutline,
  ponto_coleta_criado: cubeOutline,
  amostra_bruta_registrada: cubeOutline,
  amostra_preparada: flaskOutline,
  amostra_ensaiada_criada: flaskOutline,
  amostra_indeformada_criada: cubeOutline,
  ensaio_criado: flaskOutline,
  ensaio_iniciado: flaskOutline,
  ensaio_concluido: checkmarkCircleOutline,
  ensaio_cancelado: closeCircleOutline,
  determinacao_registrada: documentTextOutline,
  imagem_upload: documentTextOutline,
  imagem_excluida: trashOutline,
  agendamento_solicitado: calendarOutline,
  agendamento_aprovado: checkmarkCircleOutline,
  agendamento_negado: closeCircleOutline,
  agendamento_cancelado_usuario: closeCircleOutline,
  agendamento_cancelado_laboratorio: closeCircleOutline,
  agendamento_data_comparecimento: checkmarkCircleOutline,
  agendamento_finalizado: checkmarkCircleOutline,
  movimentacao_entrada: cubeOutline,
  movimentacao_saida: cubeOutline,
  ocorrencia_aberta: warningOutline,
  ocorrencia_resolvida: checkmarkCircleOutline,
  ocorrencia_fechada: checkmarkCircleOutline,
};

const DESCRICAO_POR_ACAO: Record<string, string> = {
  login_sucesso: 'Login bem-sucedido.',
  login_falha: 'Tentativa de login malsucedida.',
  logout: 'Logout realizado.',
  criacao_conta: 'Conta criada.',
  confirmacao_conta: 'Conta confirmada por e-mail.',
  troca_senha: 'Senha alterada.',
  edicao_perfil: 'Perfil editado.',
  exclusao_conta: 'Conta excluida.',
  pesquisa_criada: 'Pesquisa criada.',
  pesquisa_editada: 'Pesquisa editada.',
  pesquisa_concluida: 'Pesquisa concluida.',
  pesquisa_cancelada: 'Pesquisa cancelada.',
  pesquisa_excluida: 'Pesquisa excluida.',
  colaborador_adicionado: 'Colaborador adicionado a pesquisa.',
  colaborador_removido: 'Colaborador removido da pesquisa.',
  programa_criado: 'Programa de amostragem criado.',
  ponto_coleta_criado: 'Ponto de coleta criado.',
  amostra_bruta_registrada: 'Amostra bruta registrada.',
  amostra_preparada: 'Amostra preparada.',
  amostra_ensaiada_criada: 'Amostra fracionada para ensaio.',
  amostra_indeformada_criada: 'Amostra indeformada registrada.',
  ensaio_criado: 'Ensaio criado.',
  ensaio_iniciado: 'Ensaio iniciado.',
  ensaio_concluido: 'Ensaio concluido.',
  ensaio_cancelado: 'Ensaio cancelado.',
  determinacao_registrada: 'Determinacao registrada.',
  imagem_upload: 'Imagem enviada.',
  imagem_excluida: 'Imagem excluida.',
  agendamento_solicitado: 'Agendamento solicitado.',
  agendamento_aprovado: 'Agendamento aprovado.',
  agendamento_negado: 'Agendamento negado.',
  agendamento_cancelado_usuario: 'Agendamento cancelado.',
  agendamento_cancelado_laboratorio: 'Agendamento cancelado pelo laboratorio.',
  agendamento_data_comparecimento: 'Comparecimento registrado.',
  agendamento_finalizado: 'Agendamento finalizado.',
  movimentacao_entrada: 'Entrada de estoque registrada.',
  movimentacao_saida: 'Saida de estoque registrada.',
  ocorrencia_aberta: 'Ocorrencia aberta.',
  ocorrencia_resolvida: 'Ocorrencia resolvida.',
  ocorrencia_fechada: 'Ocorrencia fechada.',
  permissao_concedida: 'Permissao de colaborador concedida.',
  permissao_revogada: 'Permissao de colaborador revogada.',
  status_ativado: 'Conta ativada.',
  status_desativado: 'Conta desativada.',
  chefia_transferida: 'Permissao de chefia transferida.',
};

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const MODULOS = ['autenticacao', 'agendamento', 'ensaios', 'estoque'] as const;

const MODULO_LABELS: Record<string, string> = {
  autenticacao: 'Autenticacao',
  agendamento: 'Agendamento',
  ensaios: 'Ensaios',
  estoque: 'Estoque',
  administracao: 'Administracao',
};

const AtividadePage: React.FC = () => {
  const { usuario } = useAuth();
  const [logs, setLogs] = useState<LogSistema[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [moduloFiltro, setModuloFiltro] = useState<string>('todos');

  const carregar = useCallback(async (p: number, reset: boolean) => {
    if (!usuario) return;
    const filtroMod = moduloFiltro === 'todos' ? [...MODULOS] : [moduloFiltro];
    setLoading(true);
    try {
      const result = await LogService.buscarPorUsuario(usuario.userId, filtroMod, p, 20);
      if (reset) {
        setLogs(result.logs);
      } else {
        setLogs((prev) => [...prev, ...result.logs]);
      }
      setTotal(result.total);
      setPagina(p);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [usuario, moduloFiltro]);

  useEffect(() => {
    carregar(1, true);
  }, [carregar]);

  const handleInfinite = async (ev: CustomEvent<void>) => {
    await carregar(pagina + 1, false);
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  return (
    <IonPage>
      <AppBar title="Minha Atividade" />
      <IonContent>
        <IonSegment
          value={moduloFiltro}
          onIonChange={(e) => setModuloFiltro(e.detail.value as string)}
          style={{ margin: '8px 16px' }}
        >
          <IonSegmentButton value="todos">
            <IonLabel>Todos</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="autenticacao">
            <IonLabel>Autenticacao</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="ensaios">
            <IonLabel>Ensaios</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="agendamento">
            <IonLabel>Agendamento</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="estoque">
            <IonLabel>Estoque</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {loading && logs.length === 0 ? (
          <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <IonIcon icon={documentTextOutline} style={{ fontSize: 48, color: 'var(--ion-color-medium)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--ion-color-medium)', margin: 0 }}>
              Nenhuma atividade registrada.
            </p>
          </div>
        ) : (
          <IonList style={{ margin: 0 }}>
            {logs.map((log) => (
              <IonItem key={log.id}>
                <IonIcon
                  slot="start"
                  icon={ICONE_POR_ACAO[log.acao] || ellipseOutline}
                  style={{ fontSize: 22, color: 'var(--ion-color-primary)' }}
                />
                <IonLabel>
                  <div style={{ fontSize: 13, color: 'var(--ion-color-dark)' }}>
                    {DESCRICAO_POR_ACAO[log.acao] || log.acao}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', marginTop: 2 }}>
                    {formatarData(log.data_criacao)}
                  </div>
                </IonLabel>
                <div slot="end" style={{ fontSize: 10, color: 'var(--ion-color-medium)', textTransform: 'uppercase' }}>
                  {MODULO_LABELS[log.modulo] || log.modulo}
                </div>
              </IonItem>
            ))}
          </IonList>
        )}

        {logs.length < total && (
          <IonInfiniteScroll onIonInfinite={handleInfinite} threshold="200px">
            <IonInfiniteScrollContent loadingText="Carregando..." />
          </IonInfiniteScroll>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AtividadePage;
