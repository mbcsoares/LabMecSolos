import React, { useEffect, useState } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonBadge,
} from '@ionic/react';
import { notificationsOutline, personCircleOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { LogService } from '../services/LogService';
import { useAuth } from '../contexts/AuthContext';

interface AppBarProps {
  title: string;
}

const AppBar: React.FC<AppBarProps> = ({ title }) => {
  const [count, setCount] = useState(0);
  const { usuario } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const p = usuario?.permissao;
        if (p === 'comum') { setCount(0); return; }
        const excluidos = p === 'colaborador' ? ['sistema'] : [];
        const { value } = await Preferences.get({ key: 'ultima_leitura_notificacoes' });
        const desde = value || new Date(0).toISOString();
        const n = await LogService.contarNotificacoesNaoLidas(desde, excluidos);
        setCount(n);
      } catch { setCount(0); }
    };
    load();
  }, [usuario]);

  return (
    <IonHeader>
      <IonToolbar color="primary">
        <IonButtons slot="start">
          <IonMenuButton />
        </IonButtons>
        <IonTitle>{title}</IonTitle>
        <IonButtons slot="end">
          <IonButton routerLink="/app/notificacoes">
            <IonIcon slot="icon-only" icon={notificationsOutline} />
            {count > 0 && (
              <IonBadge color="danger" style={{
                position: 'absolute',
                top: 4,
                right: 4,
                fontSize: 10,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                padding: '0 4px',
              }}>
                {count > 99 ? '99+' : count}
              </IonBadge>
            )}
          </IonButton>
          <IonButton routerLink="/app/perfil">
            <IonIcon slot="icon-only" icon={personCircleOutline} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default AppBar;
