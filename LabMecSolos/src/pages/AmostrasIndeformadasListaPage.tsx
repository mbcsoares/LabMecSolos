import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonIcon, IonSpinner, IonToast } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { cubeOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import { AmostragemService } from '../services/AmostragemService';
import type { AmostraIndeformada } from '../models/types';

const TIPO_LABELS: Record<string, string> = {
  shelby: 'Shelby', bloco: 'Bloco', anel: 'Anel', outro: 'Outro',
};

const AmostrasIndeformadasListaPage: React.FC = () => {
  const { id: idAmostraBruta } = useParams<{ id: string }>();
  const history = useHistory();
  const [indeformadas, setIndeformadas] = useState<AmostraIndeformada[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!idAmostraBruta) return;
      try {
        const rows = await AmostragemService.listarAmostrasIndeformadas(idAmostraBruta);
        setIndeformadas(rows);
      } catch {
        setToastMsg('Erro ao carregar amostras indeformadas.');
        setShowToast(true);
      }
      setLoading(false);
    };
    load();
  }, [idAmostraBruta]);

  return (
    <IonPage>
      <AppBar title="Amostras Indeformadas" />
      <IonContent>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : indeformadas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <IonIcon icon={cubeOutline} style={{ fontSize: 48, color: 'var(--ion-color-medium)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--ion-color-medium)', margin: 0 }}>Nenhuma amostra indeformada.</p>
          </div>
        ) : (
          indeformadas.map((ai) => (
            <IonCard key={ai.id} style={{ borderRadius: 12, margin: '8px 16px' }} onClick={() => history.push(`/app/ensaios/amostra-indeformada/${ai.id}`)}>
              <IonCardContent>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{ai.numero_amostra}</div>
                <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 4 }}>
                  {TIPO_LABELS[ai.tipo_indeformada] || ai.tipo_indeformada}
                  {ai.altura != null && ` · Alt: ${ai.altura}mm`}
                  {ai.largura != null && ` · Larg: ${ai.largura}mm`}
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

export default AmostrasIndeformadasListaPage;
