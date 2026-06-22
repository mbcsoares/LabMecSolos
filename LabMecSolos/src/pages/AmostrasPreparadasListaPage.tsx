import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonIcon, IonSpinner, IonFab, IonFabButton, IonToast } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { addOutline, beakerOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import { AmostragemService } from '../services/AmostragemService';
import type { AmostraPreparada } from '../models/types';

const AmostrasPreparadasListaPage: React.FC = () => {
  const { id: idAmostraBruta } = useParams<{ id: string }>();
  const history = useHistory();
  const [preparadas, setPreparadas] = useState<AmostraPreparada[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!idAmostraBruta) return;
      try {
        const rows = await AmostragemService.listarAmostrasPreparadas(idAmostraBruta);
        setPreparadas(rows);
      } catch {
        setToastMsg('Erro ao carregar amostras preparadas.');
        setShowToast(true);
      }
      setLoading(false);
    };
    load();
  }, [idAmostraBruta]);

  return (
    <IonPage>
      <AppBar title="Amostras Preparadas" />
      <IonContent>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : preparadas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <IonIcon icon={beakerOutline} style={{ fontSize: 48, color: 'var(--ion-color-medium)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--ion-color-medium)', margin: 0 }}>Nenhuma amostra preparada.</p>
          </div>
        ) : (
          preparadas.map((ap) => (
            <IonCard key={ap.id} style={{ borderRadius: 12, margin: '8px 16px' }} onClick={() => history.push(`/app/ensaios/amostra-preparada/${ap.id}`)}>
              <IonCardContent>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{ap.numero_amostra}</div>
                <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 4 }}>
                  {ap.metodo_preparo === 'sem_secagem_previa' ? 'Sem Secagem' : 'Com Secagem'} &nbsp;·&nbsp; Pré: {ap.quantidade_pre_quarteamento} &nbsp;·&nbsp; Pós: {ap.quantidade_pos_quarteamento}
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default AmostrasPreparadasListaPage;
