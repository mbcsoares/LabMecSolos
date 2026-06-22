import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonToast,
  IonSpinner,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  starOutline,
  star,
  closeCircleOutline,
  trashOutline,
  swapHorizontalOutline,
  checkmarkCircleOutline,
  timeOutline,
  arrowBackOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { AdminService } from '../services/AdminService';
import { ValidacaoAdminService } from '../services/ValidacaoAdminService';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import ConfirmacaoSenhaDialog from '../components/ConfirmacaoSenhaDialog';
import ConfirmarAtivacaoDialog from '../components/ConfirmarAtivacaoDialog';
import ConfirmarDesativacaoDialog from '../components/ConfirmarDesativacaoDialog';
import ConfirmarExclusaoDialog from '../components/ConfirmarExclusaoDialog';
import type { UsuarioDetalhado } from '../models/types';

function formatarData(iso: string | null): string {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('pt-BR') + ' ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(nome: string, sobrenome: string): string {
  return `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase();
}

type AcaoTipo = 'conceder' | 'concederChefia' | 'revogar' | 'ativar' | 'desativar' | 'excluir' | null;

const AdminUsuarioDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario: chefe } = useAuth();
  const [usuario, setUsuario] = useState<UsuarioDetalhado | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSenhaDialog, setShowSenhaDialog] = useState(false);
  const [showAtivarDialog, setShowAtivarDialog] = useState(false);
  const [showDesativarDialog, setShowDesativarDialog] = useState(false);
  const [showExcluirDialog, setShowExcluirDialog] = useState(false);
  const [acaoAtual, setAcaoAtual] = useState<AcaoTipo>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');
  const [totalChefes, setTotalChefes] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [detalhes, chefes] = await Promise.all([
        AdminService.obterDetalhesUsuario(id),
        ValidacaoAdminService.contarChefesAtivos(),
      ]);
      setUsuario(detalhes);
      setTotalChefes(chefes);
      setLoading(false);
    };
    load();
  }, [id]);

  const mostrarToast = (msg: string, color: string = 'success') => {
    setToastMessage(msg);
    setToastColor(color);
    setShowToast(true);
  };

  const handleSenhaConfirm = async (senha: string): Promise<boolean> => {
    if (!usuario || !chefe) return false;

    try {
      if (acaoAtual === 'conceder') {
        const r = await AdminService.concederColaborador(usuario.id, chefe.userId, senha);
        if (r.sucesso) {
          mostrarToast('Permissao de colaborador concedida.');
          setUsuario({ ...usuario, permissao: 'colaborador' });
          return true;
        }
        mostrarToast(r.erro || 'Erro.', 'danger');
      } else if (acaoAtual === 'concederChefia') {
        const r = await AdminService.concederChefia(usuario.id, chefe.userId, senha);
        if (r.sucesso) {
          mostrarToast('Permissao de chefia concedida.');
          setUsuario({ ...usuario, permissao: 'chefia' });
          setTotalChefes((prev) => prev + 1);
          return true;
        }
        mostrarToast(r.erro || 'Erro.', 'danger');
      } else if (acaoAtual === 'revogar') {
        const r = await AdminService.revogarColaborador(usuario.id, chefe.userId, senha);
        if (r.sucesso) {
          mostrarToast('Permissao de colaborador revogada.');
          setUsuario({ ...usuario, permissao: 'comum' });
          return true;
        }
        mostrarToast(r.erro || 'Erro.', 'danger');
      } else if (acaoAtual === 'desativar') {
        const r = await AdminService.desativarUsuario(usuario.id, chefe.userId, senha);
        if (r.sucesso) {
          mostrarToast('Usuario desativado.');
          setUsuario({ ...usuario, status: 'inativo' });
          return true;
        }
        mostrarToast(r.erro || 'Erro.', 'danger');
      } else if (acaoAtual === 'excluir') {
        const r = await AdminService.excluirUsuario(usuario.id, chefe.userId, senha);
        if (r.sucesso) {
          mostrarToast('Usuario excluido.');
          setUsuario({ ...usuario, status: 'excluido' });
          return true;
        }
        mostrarToast(r.erro || 'Erro.', 'danger');
      }
    } catch {
      mostrarToast('Erro ao executar acao.', 'danger');
    }

    return false;
  };

  const handleAtivar = async () => {
    if (!usuario || !chefe) return;
    const r = await AdminService.ativarUsuario(usuario.id, chefe.userId);
    if (r.sucesso) {
      mostrarToast('Usuario ativado.');
      setUsuario({ ...usuario, status: 'ativo' });
    } else {
      mostrarToast(r.erro || 'Erro.', 'danger');
    }
    setShowAtivarDialog(false);
  };

  const isChefeLogado = chefe?.permissao === 'chefia';

  if (loading || !usuario) {
    return (
      <IonPage>
        <AppBar title="Detalhes do Usuario" />
        <IonContent>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const nomeCompleto = `${usuario.nome} ${usuario.sobrenome}`;
  const podeConceder = usuario.permissao === 'comum' && usuario.status === 'ativo';
  const podeRevogar = usuario.permissao === 'colaborador' && usuario.status === 'ativo';
  const podeTransferir = usuario.perfil === 'professor' && usuario.status === 'ativo' && usuario.permissao !== 'chefia';
  const podeAtivar = usuario.status === 'inativo';
  const podeDesativar = usuario.status === 'ativo' && usuario.permissao !== 'chefia';
  const podeExcluir = usuario.status !== 'excluido' && usuario.permissao !== 'chefia';

  return (
    <IonPage>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 8px',
        background: 'var(--ion-color-primary)',
      }}>
        <button
          onClick={() => history.goBack()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFFFFF', fontSize: 22, padding: '4px 8px' }}
        >
          <IonIcon icon={arrowBackOutline} />
        </button>
        <span style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF' }}>Detalhes do Usuario</span>
      </div>

      <IonContent>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <IonCard style={{ borderRadius: 12, textAlign: 'center' }}>
            <IonCardContent style={{ padding: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: 'var(--ion-color-primary)', color: '#FFFFFF',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                fontSize: 24, fontWeight: 700, margin: '0 auto 12px auto',
              }}>
                {getInitials(usuario.nome, usuario.sobrenome)}
              </div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: 20, color: 'var(--ion-color-dark)' }}>
                {nomeCompleto}
              </h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                <StatusBadge
                  status={usuario.status === 'ativo' ? 'success' : usuario.status === 'inativo' ? 'neutral' : 'error'}
                  label={usuario.status === 'ativo' ? 'Ativo' : usuario.status === 'inativo' ? 'Inativo' : 'Excluido'}
                />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 12, padding: '2px 8px', height: 24, fontSize: 11, fontWeight: 500, backgroundColor: '#164194', color: '#FFFFFF' }}>
                  {usuario.permissao === 'chefia' ? (
                    <IonIcon icon={star} style={{ fontSize: 14 }} />
                  ) : usuario.permissao === 'colaborador' ? (
                    <IonIcon icon={starOutline} style={{ fontSize: 14 }} />
                  ) : null}
                  {usuario.permissao === 'chefia' ? 'Chefia' : usuario.permissao === 'colaborador' ? 'Colaborador' : 'Comum'}
                </span>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent style={{ padding: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)', padding: '12px 16px 0', margin: 0 }}>
                Dados Pessoais
              </p>
              <IonList>
                <IonItem><IonLabel><small>Nome</small><div>{usuario.nome}</div></IonLabel></IonItem>
                <IonItem><IonLabel><small>Sobrenome</small><div>{usuario.sobrenome}</div></IonLabel></IonItem>
                <IonItem><IonLabel><small>Genero</small><div>{usuario.genero === 'masculino' ? 'Masculino' : usuario.genero === 'feminino' ? 'Feminino' : 'Nao informado'}</div></IonLabel></IonItem>
                <IonItem><IonLabel><small>Matricula</small><div>{usuario.matricula}</div></IonLabel></IonItem>
                <IonItem lines="none"><IonLabel><small>E-mail</small><div>{usuario.email}</div></IonLabel></IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent style={{ padding: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)', padding: '12px 16px 0', margin: 0 }}>
                Dados do Sistema
              </p>
              <IonList>
                <IonItem><IonLabel><small>Perfil</small><div>{usuario.perfil === 'professor' ? 'Professor' : usuario.perfil === 'tecnico' ? 'Tecnico' : 'Aluno'}</div></IonLabel></IonItem>
                <IonItem><IonLabel><small>Permissao</small><div>{usuario.permissao === 'chefia' ? 'Chefia' : usuario.permissao === 'colaborador' ? 'Colaborador' : 'Comum'}</div></IonLabel></IonItem>
                <IonItem><IonLabel><small>Status</small><div><StatusBadge status={usuario.status === 'ativo' ? 'success' : usuario.status === 'inativo' ? 'neutral' : 'error'} label={usuario.status === 'ativo' ? 'Ativo' : usuario.status === 'inativo' ? 'Inativo' : 'Excluido'} /></div></IonLabel></IonItem>
                <IonItem><IonLabel><small>Data de criacao</small><div>{formatarData(usuario.data_criacao)}</div></IonLabel></IonItem>
                <IonItem><IonLabel><small>Ultima atualizacao</small><div>{formatarData(usuario.data_atualizacao)}</div></IonLabel></IonItem>
                {usuario.status === 'excluido' && (
                  <IonItem lines="none"><IonLabel><small>Data de exclusao</small><div>{formatarData(usuario.data_exclusao)}</div></IonLabel></IonItem>
                )}
              </IonList>
            </IonCardContent>
          </IonCard>

          {isChefeLogado && (
            <IonCard style={{ borderRadius: 12 }}>
              <IonCardContent style={{ padding: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)', padding: '12px 16px 0', margin: '0 0 8px 0' }}>
                  Acoes Administrativas
                </p>

                {podeConceder && (
                  <IonButton expand="block" fill="clear" color="secondary" style={{ fontWeight: 500 }}
                    onClick={() => { setAcaoAtual('conceder'); setShowSenhaDialog(true); }}>
                    <IonIcon slot="start" icon={starOutline} />
                    Conceder Colaborador
                  </IonButton>
                )}

                {podeRevogar && (
                  <IonButton expand="block" fill="clear" color="warning" style={{ fontWeight: 500 }}
                    onClick={() => { setAcaoAtual('revogar'); setShowSenhaDialog(true); }}>
                    <IonIcon slot="start" icon={closeCircleOutline} />
                    Revogar Colaborador
                  </IonButton>
                )}

                {podeTransferir && totalChefes < 2 && (
                  <IonButton expand="block" fill="clear" style={{ fontWeight: 500, color: '#E6A817' }}
                    onClick={() => { setAcaoAtual('concederChefia'); setShowSenhaDialog(true); }}>
                    <IonIcon slot="start" icon={star} />
                    Conceder Chefia
                  </IonButton>
                )}

                {podeTransferir && totalChefes >= 2 && (
                  <IonButton expand="block" fill="clear" style={{ fontWeight: 500, color: '#E6A817' }}
                    onClick={() => history.push('/app/admin/transferir-chefia', {
                      idDestino: usuario.id,
                      nomeDestino: nomeCompleto,
                    })}>
                    <IonIcon slot="start" icon={swapHorizontalOutline} />
                    Transferir Chefia
                  </IonButton>
                )}

                {podeAtivar && (
                  <IonButton expand="block" fill="clear" color="success" style={{ fontWeight: 500 }}
                    onClick={() => setShowAtivarDialog(true)}>
                    <IonIcon slot="start" icon={checkmarkCircleOutline} />
                    Ativar
                  </IonButton>
                )}

                {(usuario.status === 'ativo' || usuario.status === 'inativo') && usuario.permissao === 'chefia' ? (
                  <div style={{ padding: '8px 16px 16px' }}>
                    <IonButton expand="block" fill="clear" color="medium" disabled style={{ fontWeight: 500 }}>
                      <IonIcon slot="start" icon={closeCircleOutline} />
                      Desativar — Contas de chefia nao podem ser desativadas.
                    </IonButton>
                  </div>
                ) : podeDesativar ? (
                  <IonButton expand="block" fill="clear" color="warning" style={{ fontWeight: 500 }}
                    onClick={() => setShowDesativarDialog(true)}>
                    <IonIcon slot="start" icon={closeCircleOutline} />
                    Desativar
                  </IonButton>
                ) : null}

                {(usuario.status !== 'excluido') && usuario.permissao === 'chefia' ? (
                  <div style={{ padding: '8px 16px 16px' }}>
                    <IonButton expand="block" fill="clear" color="medium" disabled style={{ fontWeight: 500 }}>
                      <IonIcon slot="start" icon={trashOutline} />
                      Excluir — Contas de chefia nao podem ser excluidas.
                    </IonButton>
                  </div>
                ) : podeExcluir ? (
                  <IonButton expand="block" fill="clear" color="danger" style={{ fontWeight: 500 }}
                    onClick={() => setShowExcluirDialog(true)}>
                    <IonIcon slot="start" icon={trashOutline} />
                    Excluir
                  </IonButton>
                ) : null}

                <IonButton expand="block" fill="clear" style={{ fontWeight: 500, marginBottom: 8 }}
                  onClick={() => history.push(`/app/admin/usuario/${usuario.id}/historico`)}>
                  <IonIcon slot="start" icon={timeOutline} />
                  Ver Historico
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        <ConfirmacaoSenhaDialog
          isOpen={showSenhaDialog}
          titulo="Confirme sua identidade"
          mensagem="Esta acao exige confirmacao por senha."
          onConfirmar={handleSenhaConfirm}
          onCancelar={() => { setShowSenhaDialog(false); setAcaoAtual(null); }}
        />

        <ConfirmarAtivacaoDialog
          isOpen={showAtivarDialog}
          nomeUsuario={nomeCompleto}
          onConfirmar={handleAtivar}
          onCancelar={() => setShowAtivarDialog(false)}
        />

        <ConfirmarDesativacaoDialog
          isOpen={showDesativarDialog}
          nomeUsuario={nomeCompleto}
          onConfirmar={async () => {
            setShowDesativarDialog(false);
            setAcaoAtual('desativar');
            setShowSenhaDialog(true);
          }}
          onCancelar={() => setShowDesativarDialog(false)}
        />

        <ConfirmarExclusaoDialog
          isOpen={showExcluirDialog}
          nomeUsuario={nomeCompleto}
          onConfirmar={async () => {
            setShowExcluirDialog(false);
            setAcaoAtual('excluir');
            setShowSenhaDialog(true);
          }}
          onCancelar={() => setShowExcluirDialog(false)}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminUsuarioDetalhePage;
