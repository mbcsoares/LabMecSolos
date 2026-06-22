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
} from '@ionic/react';
import { keyOutline, arrowBackOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { RecuperacaoSenhaService } from '../services/RecuperacaoSenhaService';
import InstitutionalEmailInput from '../components/InstitutionalEmailInput';
import FormError from '../components/FormError';
import LoadingButton from '../components/LoadingButton';
import './Auth.css';

const ForgotPasswordPage: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecover = async () => {
    setError('');
    setLoading(true);
    const result = await RecuperacaoSenhaService.solicitarRecuperacao(email);
    setLoading(false);
    if (result.sucesso) {
      history.push('/recovery-code', { email: email.toLowerCase().trim() });
    } else {
      setError(result.mensagem);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div className="auth-container">
          <IonCard className="auth-card">
            <IonCardHeader>
              <IonCardTitle>Recuperar Senha</IonCardTitle>
              <IonCardSubtitle>Informe seu e-mail institucional cadastrado</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <InstitutionalEmailInput value={email} onChange={setEmail} disabled={loading} />
              <FormError message={error} />
              <LoadingButton
                loading={loading}
                disabled={!email}
                onClick={handleRecover}
                label="Enviar Codigo"
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
      </IonContent>
    </IonPage>
  );
};

export default ForgotPasswordPage;
