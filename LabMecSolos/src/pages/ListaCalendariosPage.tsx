import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonSpinner, IonToast, IonChip } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { queryRows } from '../services/DatabaseService';
import type { CalendarioMensal } from '../models/types';

const ListaCalendariosPage: React.FC = () => {
  const history = useHistory();
  const [calendarios, setCalendarios] = useState<CalendarioMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    queryRows<CalendarioMensal>(
      'SELECT * FROM calendario_mensal ORDER BY mes_ano DESC'
    ).then(setCalendarios).catch(() => { setToastMsg('Erro ao carregar.'); setShowToast(true); }).finally(() => setLoading(false));
  }, []);

  return (
    <IonPage>
      <AppBar title="Calendários" />
      <IonContent>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : calendarios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}><p style={{ fontSize: 14, color: 'var(--ion-color-medium)' }}>Nenhum calendário criado.</p></div>
        ) : (
          <IonList inset>
            {calendarios.map((c) => (
              <IonItem key={c.id} button onClick={() => history.push(`/app/configurar-calendario`, { mesAno: c.mes_ano })} detail>
                <IonLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{c.mes_ano}</span>
                    <IonChip color={c.status === 'publicado' ? 'success' : 'warning'} outline style={{ fontSize: 10, height: 20 }}>
                      {c.status === 'publicado' ? 'Publicado' : 'Em configuração'}
                    </IonChip>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                    {c.hora_abertura_padrao} - {c.hora_fechamento_padrao} · Cap: {c.capacidade_padrao}
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default ListaCalendariosPage;
