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
import { useParams, useHistory } from 'react-router-dom';
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
  starOutline,
  star,
  closeCircleOutline,
  swapHorizontalOutline,
  ellipseOutline,
  arrowBackOutline,
} from 'ionicons/icons';
import { AdminService } from '../services/AdminService';
import type { LogSistema, UsuarioDetalhado } from '../models/types';

const ICONE_POR_ACAO: Record<string, string> = {
  login_sucesso: logInOutline,
  login_falha: warningOutline,
  logout: logOutOutline,
  criacao_conta: personAddOutline,
  confirmacao_conta: checkmarkCircleOutline,
  troca_senha: keyOutline,
  edicao_perfil: createOutline,
  exclusao_conta: trashOutline,
  permissao_concedida: star,
  permissao_revogada: starOutline,
  status_ativado: checkmarkCircleOutline,
  status_desativado: closeCircleOutline,
  conta_excluida_chefia: trashOutline,
  chefia_transferida: swapHorizontalOutline,
};

const DESCRICAO_POR_ACAO: Record<string, string> = {
  login_sucesso: 'Login bem-sucedido.',
  login_falha: 'Tentativa de login malsucedida.',
  logout: 'Logout realizado.',
  criacao_conta: 'Conta criada.',
  confirmacao_conta: 'Conta confirmada por e-mail.',
  troca_senha: 'Senha alterada.',
  edicao_perfil: 'Perfil editado.',
  exclusao_conta: 'Conta excluida pelo proprio usuario.',
  permissao_concedida: 'Permissao de colaborador concedida.',
  permissao_revogada: 'Permissao de colaborador revogada.',
  status_ativado: 'Conta ativada.',
  status_desativado: 'Conta desativada.',
  conta_excluida_chefia: 'Conta excluida pela chefia.',
  chefia_transferida: 'Permissao de chefia transferida.',
  acao_critica_negada: 'Acao administrativa negada por excesso de tentativas de senha.',
};

function formatarData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const AdminUsuarioHistoricoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [logs, setLogs] = useState<LogSistema[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [moduloFiltro, setModuloFiltro] = useState<'todos' | 'autenticacao' | 'administracao'>('todos');
  const [usuario, setUsuario] = useState<UsuarioDetalhado | null>(null);

  const modulosBusca = moduloFiltro === 'todos' ? ['autenticacao', 'administracao'] : [moduloFiltro];

  useEffect(() => {
    AdminService.obterDetalhesUsuario(id).then(setUsuario);
  }, [id]);

  const carregar = useCallback(async (p: number, reset: boolean) => {
    setLoading(true);
    try {
      const result = await AdminService.obterHistoricoUsuario(id, p);
      const filtrados = result.logs.filter((l) => modulosBusca.includes(l.modulo));
      if (reset) {
        setLogs(filtrados);
      } else {
        setLogs((prev) => [...prev, ...filtrados]);
      }
      setTotal(filtrados.length < 20 ? (reset ? filtrados.length : logs.length + filtrados.length) : result.total);
      setPagina(p);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [id, moduloFiltro]);

  useEffect(() => {
    carregar(1, true);
  }, [moduloFiltro]);

  const handleInfinite = async (ev: CustomEvent<void>) => {
    await carregar(pagina + 1, false);
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  return (
    <IonPage>
      <IonContent>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '12px 8px',
          borderBottom: '1px solid #E0E0E0', background: 'var(--ion-color-primary)',
        }}>
          <button
            onClick={() => history.goBack()}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#FFFFFF', fontSize: 22, padding: '4px 8px',
            }}
          >
            <IonIcon icon={arrowBackOutline} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF' }}>
            Historico: {usuario ? `${usuario.nome} ${usuario.sobrenome}` : '...'}
          </span>
        </div>

        <IonSegment
          value={moduloFiltro}
          onIonChange={(e) => setModuloFiltro(e.detail.value as typeof moduloFiltro)}
          style={{ margin: '8px 16px' }}
        >
          <IonSegmentButton value="todos">
            <IonLabel>Todos</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="autenticacao">
            <IonLabel>Autenticacao</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="administracao">
            <IonLabel>Administracao</IonLabel>
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
              Nenhuma acao registrada para este usuario.
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
                  {log.modulo}
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

export default AdminUsuarioHistoricoPage;
