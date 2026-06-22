import React from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
} from '@ionic/react';
import {
  clipboardOutline,
  flaskOutline,
  calendarOutline,
  cubeOutline,
  warningOutline,
  timeOutline,
  helpCircleOutline,
  logOutOutline,
  peopleOutline,
  barChartOutline,
  mapOutline,
  settingsOutline,
  documentTextOutline,
  layersOutline,
  listOutline,
  notificationsOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';

function getPerfilLabel(p: string) {
  return p === 'professor' ? 'Professor' : p === 'tecnico' ? 'Tecnico' : 'Aluno';
}

function getPermissaoLabel(p: string) {
  return p === 'chefia' ? 'Chefia' : p === 'colaborador' ? 'Colaborador' : 'Comum';
}

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

const NavigationDrawer: React.FC = () => {
  const { usuario, logout } = useAuth();
  const history = useHistory();

  if (!usuario) return null;

  const p = usuario.permissao;
  const isColaborador = p === 'colaborador' || p === 'chefia';
  const isChefia = p === 'chefia';

  const handleLogout = async () => {
    await logout();
    history.push('/login');
  };

  const menuComum: MenuItem[] = [
    { icon: clipboardOutline, label: 'Pesquisas', route: '/app/pesquisas' },
    { icon: flaskOutline, label: 'Ensaios', route: '/app/ensaios' },
    { icon: calendarOutline, label: 'Calendario', route: '/app/agendar' },
    { icon: timeOutline, label: 'Meus Agendamentos', route: '/app/agendamentos' },
    { icon: cubeOutline, label: 'Inventario', route: '/app/inventario/itens' },
    { icon: warningOutline, label: 'Minhas Ocorrencias', route: '/app/ocorrencias' },
    { icon: notificationsOutline, label: 'Notificacoes', route: '/app/notificacoes' },
  ];

  const menuColaborador: MenuItem[] = isColaborador ? [
    { icon: layersOutline, label: 'Gerenciar Inventario', route: '/app/inventario' },
    { icon: warningOutline, label: 'Ocorrencias', route: '/app/inventario/ocorrencias' },
    { icon: calendarOutline, label: 'Solicitacoes Pendentes', route: '/app/solicitacoes-pendentes' },
    { icon: calendarOutline, label: 'Configurar Calendario', route: '/app/configurar-calendario' },
    { icon: listOutline, label: 'Lista de Calendarios', route: '/app/calendarios' },
    { icon: timeOutline, label: 'Todos Agendamentos', route: '/app/todos-agendamentos' },
    { icon: documentTextOutline, label: 'Relatorios', route: '/app/relatorios' },
  ] : [];

  const menuChefia: MenuItem[] = isChefia ? [
    { icon: peopleOutline, label: 'Gerenciar Usuarios', route: '/app/gerenciar-usuarios' },
    { icon: barChartOutline, label: 'Painel Gerencial', route: '/app/painel-gerencial' },
    { icon: mapOutline, label: 'Estudo Unificado de Solos', route: '/app/mapa-estudo-solos' },
    { icon: settingsOutline, label: 'Config. Laboratorio', route: '/app/configuracoes-laboratorio' },
    { icon: settingsOutline, label: 'Config. do Sistema', route: '/app/configuracoes' },
  ] : [];

  const renderMenuItem = (item: MenuItem, index: number) => (
    <IonMenuToggle key={index}>
      <IonItem
        button
        routerLink={item.route}
        routerDirection="root"
        detail={false}
        style={{ height: 48, '--min-height': '48px' } as React.CSSProperties}
      >
        <IonIcon slot="start" icon={item.icon} style={{ fontSize: 24 }} />
        <IonLabel style={{ fontSize: 14, color: 'var(--ion-text-color)', fontWeight: 400 }}>
          {item.label}
        </IonLabel>
      </IonItem>
    </IonMenuToggle>
  );

  const renderDivider = (key: string) => (
    <div
      key={key}
      style={{
        height: 1,
          backgroundColor: 'var(--app-color-border)',
        margin: '8px 16px',
      }}
    />
  );

  return (
    <>
      <IonHeader>
        <IonToolbar color="primary" style={{ padding: '16px 0' }}>
          <div style={{ padding: '8px 24px' }}>
            <IonTitle style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', padding: 0 }}>
              {usuario.nome} {usuario.sobrenome}
            </IonTitle>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>
              {usuario.email}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0 0' }}>
              {getPermissaoLabel(usuario.permissao)} &middot; {getPerfilLabel(usuario.perfil)}
            </p>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList style={{ padding: 0 }}>
          {menuComum.map(renderMenuItem)}

          {isColaborador && renderDivider('div-colab')}
          {menuColaborador.map(renderMenuItem)}

          {isChefia && renderDivider('div-chef')}
          {menuChefia.map(renderMenuItem)}

          <div style={{ height: 1, backgroundColor: 'var(--app-color-border)', margin: '8px 16px' }} />

          <IonMenuToggle>
            <IonItem button routerLink="/app/ajuda" routerDirection="root" detail={false} style={{ height: 48, '--min-height': '48px' } as React.CSSProperties}>
              <IonIcon slot="start" icon={helpCircleOutline} style={{ fontSize: 24, color: 'var(--ion-color-medium)' }} />
              <IonLabel style={{ fontSize: 14, color: 'var(--ion-text-color)' }}>Ajuda / Sobre</IonLabel>
            </IonItem>
          </IonMenuToggle>

          <IonMenuToggle>
            <IonItem button onClick={handleLogout} detail={false} style={{ height: 48, '--min-height': '48px' } as React.CSSProperties}>
              <IonIcon slot="start" icon={logOutOutline} style={{ fontSize: 24, color: 'var(--ion-color-medium)' }} />
              <IonLabel style={{ fontSize: 14, color: 'var(--ion-text-color)' }}>Sair</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </>
  );
};

export default NavigationDrawer;
