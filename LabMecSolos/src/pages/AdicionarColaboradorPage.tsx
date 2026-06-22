import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSearchbar, IonItem, IonLabel, IonIcon, IonSpinner, IonButton, IonToast } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { personAddOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import { PesquisaService } from '../services/PesquisaService';
import { useAuth } from '../contexts/AuthContext';
import { queryRows } from '../services/DatabaseService';

const AdicionarColaboradorPage: React.FC = () => {
  const { id: idPesquisa } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [busca, setBusca] = useState('');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await queryRows<any>("SELECT id, nome, sobrenome, email, perfil FROM usuarios WHERE status = 'ativo' ORDER BY nome ASC");
        setUsuarios(rows);
      } catch {
        setToastMsg('Erro ao carregar usuários.');
        setShowToast(true);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtrados = usuarios.filter((u) => {
    const termo = busca.toLowerCase();
    return u.nome?.toLowerCase().includes(termo) || u.sobrenome?.toLowerCase().includes(termo) || u.email?.toLowerCase().includes(termo);
  });

  const handleAdicionar = async (idUsuarioAdicionar: string) => {
    if (!idPesquisa || !usuario) return;
    try {
      await PesquisaService.adicionarColaborador(idPesquisa, idUsuarioAdicionar, usuario.userId);
      setToastMsg('Colaborador adicionado.');
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao adicionar.');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <AppBar title="Adicionar Colaborador" />
      <IonContent>
        <IonSearchbar value={busca} onIonInput={(e) => setBusca(e.detail.value || '')} debounce={300} placeholder="Buscar usuário" />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <IonIcon icon={personAddOutline} style={{ fontSize: 48, color: 'var(--ion-color-medium)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--ion-color-medium)', margin: 0 }}>Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', padding: '0 16px 8px' }}>{filtrados.length} usuários</div>
            {filtrados.map((u) => (
              <IonItem key={u.id}>
                <IonLabel>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{u.nome} {u.sobrenome}</div>
                  <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{u.email} — {u.perfil}</div>
                </IonLabel>
                <IonButton slot="end" fill="clear" size="small" onClick={() => handleAdicionar(u.id)}>Adicionar</IonButton>
              </IonItem>
            ))}
          </>
        )}

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default AdicionarColaboradorPage;
