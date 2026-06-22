import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
  IonToast,
} from '@ionic/react';
import { arrowBackOutline, keyOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { RecuperacaoSenhaService } from '../services/RecuperacaoSenhaService';
import PasswordInput from '../components/PasswordInput';
import FormError from '../components/FormError';
import LoadingButton from '../components/LoadingButton';
import './Auth.css';

const NewPasswordPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ email?: string; codigo?: string }>();
  const email = location.state?.email || '';
  const codigo = location.state?.codigo || '';
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = async () => {
    setError('');
    if (novaSenha !== confirmarSenha) { setError('As senhas nao conferem.'); return; }
    setLoading(true);
    const result = await RecuperacaoSenhaService.redefinirSenha(email.toLowerCase().trim(), codigo, novaSenha);
    setLoading(false);
    if (result.sucesso) {
      setShowToast(true);
    } else {
      setError(result.erro || 'Erro ao redefinir senha.');
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div className="auth-container">
          <IonCard className="auth-card">
            <IonCardHeader>
              <IonCardTitle>Nova Senha</IonCardTitle>
              <IonCardSubtitle>Defina sua nova senha de acesso</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
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
                disabled={!novaSenha || !confirmarSenha}
                onClick={handleSave}
                label="Salvar"
                color="primary"
                icon={keyOutline}
              />
              <div className="auth-links" style={{ justifyContent: 'center', marginTop: 8 }}>
                <a onClick={() => history.push('/login')} style={{ color: 'var(--ion-color-primary)', cursor: 'pointer' }}>
                  <IonIcon icon={arrowBackOutline} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Voltar ao login
                </a>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => { setShowToast(false); history.push('/login'); }}
          message="Senha alterada com sucesso!"
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default NewPasswordPage;
