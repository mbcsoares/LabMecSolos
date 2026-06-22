import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Redirect } from 'react-router-dom';
import AppBar from '../components/AppBar';

const ProgramasListaPage: React.FC = () => (
  <IonPage><AppBar title="Programas" /><IonContent><div style={{ textAlign: 'center', padding: 48 }}><p>Use os detalhes da pesquisa para ver os programas.</p></div></IonContent></IonPage>
);

export default ProgramasListaPage;
