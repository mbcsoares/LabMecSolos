import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import AppBar from '../components/AppBar';

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, subtitle }) => (
  <IonPage>
    <AppBar title={title} />
    <IonContent>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        padding: 24,
        textAlign: 'center',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#E8EDF6',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 28,
          marginBottom: 16,
        }}>
          &#x1F6A7;
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ion-color-dark)', margin: '0 0 8px 0' }}>
          {title}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--ion-color-medium)', margin: 0, lineHeight: 1.5 }}>
          {subtitle || 'Este modulo esta em desenvolvimento e sera disponibilizado em breve.'}
        </p>
      </div>
    </IonContent>
  </IonPage>
);

export default PlaceholderPage;
