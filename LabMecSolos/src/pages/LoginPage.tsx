import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardContent,
} from '@ionic/react';
import { logInOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoDinamica } from '../components/LogoDinamica';
import '../components/AppTitle.css';
import InstitutionalEmailInput from '../components/InstitutionalEmailInput';
import PasswordInput from '../components/PasswordInput';
import FormError from '../components/FormError';
import LoadingButton from '../components/LoadingButton';
import './Auth.css';

const LoginPage: React.FC = () => {
  const history = useHistory();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      history.push('/app/home');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <IonPage>
      <IonContent>
        <div className="auth-container">
          <LogoDinamica />
          <IonCard className="auth-card">
            <IonCardHeader>
              <h1 className="app-title" style={{ fontSize: 22, margin: '0 0 4px 0' }}>
                LabMecSolos
              </h1>
              <IonCardSubtitle>Entre com sua conta institucional</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <InstitutionalEmailInput value={email} onChange={setEmail} disabled={loading} />
              <PasswordInput
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                disabled={loading}
              />
              <FormError message={error} />
              <LoadingButton
                loading={loading}
                disabled={!email || !password}
                onClick={handleLogin}
                label="Entrar"
                icon={logInOutline}
              />
              <div className="auth-links">
                <a onClick={() => history.push('/forgot-password')} style={{ color: 'var(--ion-color-medium)', cursor: 'pointer' }}>
                  Esqueci minha senha
                </a>
                <a onClick={() => history.push('/register')} style={{ color: 'var(--ion-color-success)', cursor: 'pointer' }}>
                  Criar conta
                </a>
              </div>
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <a onClick={() => history.push('/sobre')} style={{ color: 'var(--ion-color-medium)', cursor: 'pointer', fontSize: 12 }}>
                  Sobre o LabMecSolos
                </a>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
