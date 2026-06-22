import React, { useEffect, useState } from 'react';
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
import { arrowBackOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { CadastroService } from '../services/CadastroService';
import CodeInput from '../components/CodeInput';
import TimerDisplay from '../components/TimerDisplay';
import FormError from '../components/FormError';
import LoadingButton from '../components/LoadingButton';
import './Auth.css';

const ConfirmAccountPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ email?: string; codigoGerado?: string }>();
  const email = location.state?.email || '';
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [tempoRestante, setTempoRestante] = useState(15 * 60);
  const [expirado, setExpirado] = useState(false);
  const [reenvios, setReenvios] = useState(0);

  useEffect(() => {
    if (location.state?.codigoGerado) {
      alert(`MVP 1.0 - CODIGO DE VERIFICACAO: ${location.state.codigoGerado}`);
    }
    if (!email) {
      history.replace('/register');
    }
  }, []);

  useEffect(() => {
    if (expirado) return;
    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpirado(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [expirado]);

  const handleVerify = async () => {
    setError('');
    if (codigo.length < 6) {
      setError('Digite o codigo de 6 digitos.');
      return;
    }
    setLoading(true);
    const result = await CadastroService.confirmarConta(email.toLowerCase().trim(), codigo);
    setLoading(false);
    if (result.sucesso) {
      setToastMessage('Conta criada com sucesso!');
      setShowToast(true);
    } else {
      setError(result.erro || 'Erro ao confirmar conta.');
    }
  };

  const handleResend = async () => {
    if (reenvios >= 3) {
      setError('Numero maximo de reenvios atingido. Inicie um novo cadastro.');
      return;
    }
    setError('');
    const result = await CadastroService.reenviarCodigo(email.toLowerCase().trim());
    if (result.sucesso) {
      setReenvios((r) => r + 1);
      setTempoRestante(15 * 60);
      setExpirado(false);
      setCodigo('');
      setToastMessage('Codigo reenviado!');
      setShowToast(true);
    } else {
      setError(result.erro || 'Erro ao reenviar codigo.');
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div className="auth-container">
          <IonCard className="auth-card">
            <IonCardHeader>
              <IonCardTitle>Confirmar Conta</IonCardTitle>
              <IonCardSubtitle>Informe o codigo enviado para {email}</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <CodeInput value={codigo} onChange={setCodigo} error={error} disabled={loading} />
              <TimerDisplay seconds={tempoRestante} />
              <FormError message={error} />
              <LoadingButton
                loading={loading}
                disabled={codigo.length < 6 || expirado}
                onClick={handleVerify}
                label="Confirmar"
                color="success"
                icon={checkmarkCircleOutline}
              />
              <div className="auth-links" style={{ justifyContent: 'center' }}>
                <a onClick={handleResend} style={{ color: reenvios >= 3 ? 'var(--ion-color-medium)' : 'var(--ion-color-success)', cursor: reenvios >= 3 ? 'default' : 'pointer' }}>
                  Reenviar codigo ({3 - reenvios} restantes)
                </a>
              </div>
              <div className="auth-links" style={{ justifyContent: 'center' }}>
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
          onDidDismiss={() => {
            setShowToast(false);
            if (toastMessage === 'Conta criada com sucesso!') history.push('/login');
          }}
          message={toastMessage}
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default ConfirmAccountPage;
