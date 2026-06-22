import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonAlert,
  IonToast,
  IonButton,
  IonSpinner,
  IonToggle,
} from '@ionic/react';
import {
  personCircleOutline,
  mailOutline,
  idCardOutline,
  schoolOutline,
  createOutline,
  lockClosedOutline,
  trashOutline,
  informationCircleOutline,
  logOutOutline,
  chevronForwardOutline,
  warningOutline,
  moonOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { logout } from '../services/AuthService';
import { ExclusaoContaService } from '../services/ExclusaoContaService';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';

function getPerfilLabel(p: string) {
  return p === 'professor' ? 'Professor' : p === 'tecnico' ? 'Tecnico' : 'Aluno';
}

function getPermissaoLabel(p: string) {
  return p === 'chefia' ? 'Chefia' : p === 'colaborador' ? 'Colaborador' : 'Comum';
}

const PerfilPage: React.FC = () => {
  const history = useHistory();
  const { usuario, logout: ctxLogout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [deleteSenha, setDeleteSenha] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);

  if (!usuario) {
    return (
      <IonPage>
        <AppBar title="Perfil" />
        <IonContent>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const handleLogout = async () => {
    await logout();
    ctxLogout();
    history.push('/login');
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await ExclusaoContaService.excluirConta(usuario.userId, deleteSenha);
    setDeleting(false);

    if (result.sucesso) {
      setShowToast(true);
    } else {
      setDeleteError(result.erro || 'Erro ao excluir conta.');
    }
  };

  const handleToastDismiss = () => {
    setShowToast(false);
    ctxLogout();
    history.push('/login');
  };

  const permissaoStatus =
    usuario.permissao === 'chefia' ? 'success' :
    usuario.permissao === 'colaborador' ? 'info' : 'neutral';

  return (
    <IonPage>
      <AppBar title="Perfil" />
      <IonContent>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent style={{ textAlign: 'center', padding: 24 }}>
              <IonIcon icon={personCircleOutline} style={{ fontSize: 64, color: 'var(--ion-color-primary)', marginBottom: 8 }} />
              <h2 style={{ margin: '4px 0', fontSize: 20, color: 'var(--ion-color-dark)' }}>
                {usuario.nome} {usuario.sobrenome}
              </h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                <StatusBadge status={permissaoStatus} label={getPermissaoLabel(usuario.permissao)} />
                <StatusBadge status="neutral" label={getPerfilLabel(usuario.perfil)} />
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <IonItem lines="full">
                <IonIcon icon={mailOutline} slot="start" color="medium" />
                <IonLabel>
                  <div style={{ fontSize: 11, color: 'var(--ion-color-medium)' }}>E-mail</div>
                  <div style={{ fontSize: 14 }}>{usuario.email}</div>
                </IonLabel>
              </IonItem>
              <IonItem lines="full">
                <IonIcon icon={idCardOutline} slot="start" color="medium" />
                <IonLabel>
                  <div style={{ fontSize: 11, color: 'var(--ion-color-medium)' }}>Permissao</div>
                  <div style={{ fontSize: 14 }}>
                    <StatusBadge status={permissaoStatus} label={getPermissaoLabel(usuario.permissao)} />
                  </div>
                </IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonIcon icon={schoolOutline} slot="start" color="medium" />
                <IonLabel>
                  <div style={{ fontSize: 11, color: 'var(--ion-color-medium)' }}>Perfil</div>
                  <div style={{ fontSize: 14 }}>{getPerfilLabel(usuario.perfil)}</div>
                </IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>

          <IonList style={{ borderRadius: 12, overflow: 'hidden' }}>
            <IonItem lines="full">
              <IonIcon icon={moonOutline} slot="start" color="medium" />
              <IonLabel>Modo Escuro</IonLabel>
              <IonToggle slot="end" checked={isDark} onIonChange={toggleTheme} />
            </IonItem>
            <IonItem button onClick={() => history.push('/app/editar-perfil')}>
              <IonIcon icon={createOutline} slot="start" color="primary" />
              <IonLabel>Editar Perfil</IonLabel>
              <IonIcon icon={chevronForwardOutline} slot="end" color="medium" />
            </IonItem>
            <IonItem button onClick={() => history.push('/app/alterar-senha')}>
              <IonIcon icon={lockClosedOutline} slot="start" color="warning" />
              <IonLabel>Alterar Senha</IonLabel>
              <IonIcon icon={chevronForwardOutline} slot="end" color="medium" />
            </IonItem>
            <IonItem button onClick={() => setShowDeleteSection(!showDeleteSection)}>
              <IonIcon icon={trashOutline} slot="start" color="danger" />
              <IonLabel color="danger">Deletar Conta</IonLabel>
              <IonIcon icon={chevronForwardOutline} slot="end" color="medium" />
            </IonItem>
          </IonList>

          {showDeleteSection && (
            <IonCard style={{ borderRadius: 12, borderLeft: '4px solid var(--ion-color-danger)' }}>
              <IonCardContent>
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <IonIcon icon={warningOutline} style={{ fontSize: 32, color: 'var(--ion-color-danger)', marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: 0, lineHeight: 1.5 }}>
                    Esta acao e <strong>irreversivel</strong>. Sua conta sera marcada como excluida e voce nao podera mais acessa-la.
                  </p>
                </div>
                <input
                  type="password"
                  value={deleteSenha}
                  onChange={(e) => { setDeleteSenha(e.target.value); setDeleteError(''); }}
                  placeholder="Digite sua senha para confirmar"
                  disabled={deleting}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 4,
                    border: `2px solid ${deleteError ? 'var(--ion-color-danger)' : '#E0E0E0'}`,
                    padding: '0 12px',
                    fontSize: 14,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                {deleteError && (
                  <p style={{ fontSize: 12, color: 'var(--ion-color-danger)', margin: '4px 0 0 0' }}>{deleteError}</p>
                )}
                <IonButton
                  expand="block"
                  color="danger"
                  style={{ marginTop: 12, height: 48, fontWeight: 600 }}
                  onClick={() => setShowDeleteAlert(true)}
                  disabled={deleting || !deleteSenha}
                >
                  {deleting ? <IonSpinner name="crescent" /> : 'Excluir Minha Conta'}
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          <IonList style={{ borderRadius: 12, overflow: 'hidden' }}>
            <IonItem button onClick={() => history.push('/app/ajuda')}>
              <IonIcon icon={informationCircleOutline} slot="start" color="medium" />
              <IonLabel>Sobre o App</IonLabel>
              <IonIcon icon={chevronForwardOutline} slot="end" color="medium" />
            </IonItem>
            <IonItem button onClick={() => setShowLogoutAlert(true)}>
              <IonIcon icon={logOutOutline} slot="start" color="medium" />
              <IonLabel>Sair</IonLabel>
            </IonItem>
          </IonList>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ion-color-medium)', margin: 8 }}>
            Versao 0.0.1
          </p>
        </div>

        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Sair"
          message="Tem certeza que deseja sair?"
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Sair', handler: handleLogout },
          ]}
        />

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirmacao Final"
          message="Tem certeza que deseja excluir sua conta? Esta acao e irreversivel."
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Sim, excluir permanentemente', handler: handleDelete },
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={handleToastDismiss}
          message="Conta excluida com sucesso."
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default PerfilPage;
