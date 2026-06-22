import React, { useEffect } from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { SessionService } from '../services/SessionService';
import { LogoDinamica } from '../components/LogoDinamica';
import '../components/AppTitle.css';

const SplashPage: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const session = await SessionService.validateSession();
        if (!cancelled) {
          setTimeout(() => {
            if (!cancelled) {
              history.replace(session ? '/app/home' : '/login');
            }
          }, 2000);
        }
      } catch {
        if (!cancelled) {
          setTimeout(() => history.replace('/login'), 2000);
        }
      }
    };

    init();

    return () => { cancelled = true; };
  }, [history]);

  return (
    <IonPage>
      <IonContent>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#1a1a2e',
          color: '#ffffff',
        }}>
          <h1 className="app-title" style={{ fontSize: 28, margin: '0 0 20px 0', textShadow: '0 0 20px rgba(22,65,148,0.3)' }}>
            LabMecSolos
          </h1>
          <LogoDinamica isLoading={true} />
          <IonSpinner name="crescent" color="light" style={{ marginTop: 24 }} />
          <div style={{ fontSize: 12, marginTop: 16, opacity: 0.6 }}>Laboratorio de Mecanica dos Solos</div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SplashPage;
