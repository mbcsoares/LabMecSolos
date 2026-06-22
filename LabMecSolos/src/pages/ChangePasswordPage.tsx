import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonToast,
} from '@ionic/react';
import { keyOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SenhaService } from '../services/SenhaService';
import PasswordInput from '../components/PasswordInput';
import FormError from '../components/FormError';
import LoadingButton from '../components/LoadingButton';

const ChangePasswordPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = async () => {
    setError('');
    if (!senhaAtual) {
      setError('Digite sua senha atual.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setError('As senhas nao conferem.');
      return;
    }
    if (!usuario) return;

    setLoading(true);
    const result = await SenhaService.alterarSenha(usuario.userId, senhaAtual, novaSenha);
    setLoading(false);

    if (result.sucesso) {
      setShowToast(true);
    } else {
      setError(result.erro || 'Erro ao alterar senha.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/perfil" />
          </IonButtons>
          <IonTitle>Alterar Senha</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <PasswordInput
                value={senhaAtual}
                onChange={setSenhaAtual}
                placeholder="Digite sua senha atual"
                label="Senha Atual"
                disabled={loading}
                autocomplete="current-password"
              />
              <PasswordInput
                value={novaSenha}
                onChange={setNovaSenha}
                placeholder="Minimo 8 caracteres"
                label="Nova Senha"
                disabled={loading}
                autocomplete="new-password"
              />
              <PasswordInput
                value={confirmarSenha}
                onChange={setConfirmarSenha}
                placeholder="Repita a nova senha"
                label="Confirmar Nova Senha"
                disabled={loading}
                autocomplete="new-password"
              />
              <FormError message={error} />
              <LoadingButton
                loading={loading}
                disabled={!senhaAtual || !novaSenha || !confirmarSenha}
                onClick={handleSave}
                label="Alterar Senha"
                color="primary"
                icon={keyOutline}
              />
            </IonCardContent>
          </IonCard>
        </div>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => { setShowToast(false); history.push('/app/perfil'); }}
          message="Senha alterada com sucesso!"
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default ChangePasswordPage;
