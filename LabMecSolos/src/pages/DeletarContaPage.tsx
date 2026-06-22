import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon,
  IonButton,
  IonSpinner,
  IonCheckbox,
} from '@ionic/react';
import { warningOutline, logOutOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ExclusaoContaService } from '../services/ExclusaoContaService';
import AppBar from '../components/AppBar';
import Snackbar from '../components/Snackbar';

const DeletarContaPage: React.FC = () => {
  const history = useHistory();
  const { usuario, logout: ctxLogout } = useAuth();
  const [senha, setSenha] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackType, setSnackType] = useState<'success' | 'error'>('error');
  const [showSnack, setShowSnack] = useState(false);

  if (!usuario) {
    history.push('/login');
    return null;
  }

  const handleExcluir = async () => {
    if (!senha) return;
    setLoading(true);
    const result = await ExclusaoContaService.excluirConta(usuario.userId, senha);
    setLoading(false);

    if (result.sucesso) {
      setSnackMsg('Conta excluida com sucesso.');
      setSnackType('success');
      setShowSnack(true);
      setTimeout(() => {
        ctxLogout();
        history.push('/login');
      }, 2000);
    } else {
      setSnackMsg(result.erro || 'Erro ao excluir conta.');
      setSnackType('error');
      setShowSnack(true);
    }
  };

  return (
    <IonPage>
      <AppBar title="Deletar Conta" />
      <IonContent>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          <IonCard style={{ borderRadius: 12, borderLeft: '4px solid var(--ion-color-danger)' }}>
            <IonCardContent style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: 'var(--ion-color-danger)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                margin: '0 auto 12px auto',
              }}>
                <IonIcon icon={warningOutline} style={{ fontSize: 28, color: '#FFFFFF' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ion-color-danger)', margin: '0 0 8px 0' }}>
                Acao Irreversivel
              </h3>
              <p style={{ fontSize: 14, color: 'var(--ion-color-dark)', margin: 0, lineHeight: 1.5 }}>
                Sua conta sera <strong>permanentemente excluida</strong> do sistema.
                Voce nao podera mais acessar o LabMecSolos com este usuario.
              </p>
            </IonCardContent>
          </IonCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ion-color-dark)' }}>
              Digite sua senha para confirmar
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha atual"
              disabled={loading}
              style={{
                width: '100%', height: 48, borderRadius: 4,
                border: '2px solid var(--app-color-border)',
                padding: '0 12px', fontSize: 14, boxSizing: 'border-box',
                outline: 'none', backgroundColor: 'var(--ion-background-color)',
                color: 'var(--ion-color-dark)',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IonCheckbox
              checked={confirmado}
              onIonChange={(e) => setConfirmado(e.detail.checked)}
              disabled={loading}
            />
            <span style={{ fontSize: 13, color: 'var(--ion-color-dark)' }}>
              Compreendo que esta acao e irreversivel
            </span>
          </div>

          <IonButton
            expand="block"
            color="danger"
            onClick={handleExcluir}
            disabled={!senha || !confirmado || loading}
            style={{ height: 48, fontWeight: 600 }}
          >
            {loading ? <IonSpinner name="crescent" /> : 'Deletar Minha Conta'}
          </IonButton>

          <IonButton
            expand="block"
            fill="outline"
            color="medium"
            onClick={() => history.goBack()}
          >
            Cancelar
          </IonButton>
        </div>

        <Snackbar
          isOpen={showSnack}
          message={snackMsg}
          type={snackType}
          onDidDismiss={() => setShowSnack(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default DeletarContaPage;
