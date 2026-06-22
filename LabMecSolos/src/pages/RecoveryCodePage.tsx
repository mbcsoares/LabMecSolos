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
} from '@ionic/react';
import { arrowBackOutline, lockClosedOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { RecuperacaoSenhaService } from '../services/RecuperacaoSenhaService';
import CodeInput from '../components/CodeInput';
import TimerDisplay from '../components/TimerDisplay';
import FormError from '../components/FormError';
import LoadingButton from '../components/LoadingButton';
import './Auth.css';

const RecoveryCodePage: React.FC = () => {
  const history = useHistory();
  const location = useLocation<{ email?: string; codigoGerado?: string }>();
  const email = location.state?.email || '';
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(15 * 60);
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    if (location.state?.codigoGerado) {
      alert(`MVP 1.0 - CODIGO DE VERIFICACAO: ${location.state.codigoGerado}`);
    }
    if (!email) history.replace('/forgot-password');
  }, []);

  useEffect(() => {
    if (expirado) return;
    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) { clearInterval(timer); setExpirado(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [expirado]);

  const handleVerify = async () => {
    setError('');
    if (codigo.length < 6) { setError('Digite o codigo de 6 digitos.'); return; }
    setLoading(true);
    history.push('/new-password', { email: email.toLowerCase().trim(), codigo });
  };

  const handleResend = async () => {
    setError('');
    setLoading(true);
    const result = await RecuperacaoSenhaService.solicitarRecuperacao(email.toLowerCase().trim());
    setLoading(false);
    if (result.sucesso) {
      setTempoRestante(15 * 60);
      setExpirado(false);
      setCodigo('');
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
              <IonCardTitle>Inserir Codigo</IonCardTitle>
              <IonCardSubtitle>Digite o codigo enviado para {email}</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <CodeInput value={codigo} onChange={setCodigo} error={error} disabled={loading} />
              <TimerDisplay seconds={tempoRestante} />
              <FormError message={error} />
              <LoadingButton
                loading={loading}
                disabled={codigo.length < 6 || expirado}
                onClick={handleVerify}
                label="Verificar"
                color="primary"
                icon={lockClosedOutline}
              />
              <div className="auth-links" style={{ justifyContent: 'center' }}>
                <a onClick={handleResend} style={{ color: 'var(--ion-color-primary)', cursor: 'pointer' }}>
                  Reenviar codigo
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
      </IonContent>
    </IonPage>
  );
};

export default RecoveryCodePage;
