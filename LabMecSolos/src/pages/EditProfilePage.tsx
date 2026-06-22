import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { personOutline, saveOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkSession, updateProfile } from '../services/AuthService';
import { SenhaService } from '../services/SenhaService';
import { queryRows } from '../services/DatabaseService';
import { SessionData, Usuario } from '../models/types';
import PasswordInput from '../components/PasswordInput';
import FormError from '../components/FormError';
import LoadingButton from '../components/LoadingButton';

const EditProfilePage: React.FC = () => {
  const history = useHistory();
  const { atualizarUsuario } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [genero, setGenero] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const load = async () => {
      const s = await checkSession();
      if (!s) { history.push('/login'); return; }
      setSession(s);
      setNome(s.nome);
      setSobrenome(s.sobrenome);
      setGenero('');
      setLoading(false);
    };
    load();
  }, [history]);

  const handleSave = async () => {
    setError('');
    if (!senhaAtual) {
      setError('Digite sua senha atual para confirmar as alteracoes.');
      return;
    }
    if (!session) return;
    setSaving(true);
    try {
      const rows = await queryRows<Usuario>('SELECT senha_hash FROM usuarios WHERE id = ?', [session.userId]);
      if (rows.length === 0) {
        setError('Usuario nao encontrado.');
        setSaving(false);
        return;
      }
      const senhaOk = await SenhaService.verificarSenha(senhaAtual, rows[0].senha_hash);
      if (!senhaOk) {
        setError('Senha atual incorreta.');
        setSaving(false);
        return;
      }
    } catch {
      setError('Erro ao verificar senha. Tente novamente.');
      setSaving(false);
      return;
    }
    const result = await updateProfile(session.userId, nome, sobrenome, genero || 'nao_informado');
    setSaving(false);
    if (result.success) {
      atualizarUsuario({
        ...session,
        nome,
        sobrenome,
      });
      setShowToast(true);
    } else {
      setError(result.message);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <div className="auth-container"><IonSpinner name="crescent" color="primary" /></div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/app/perfil" />
          </IonButtons>
          <IonTitle>Editar Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <IonItem>
                <IonIcon icon={personOutline} slot="start" color="primary" />
                <IonLabel position="stacked">Nome</IonLabel>
                <IonInput value={nome} onIonInput={(e) => setNome(e.detail.value || '')} placeholder="Seu nome" disabled={saving} />
              </IonItem>
              <IonItem>
                <IonIcon icon={personOutline} slot="start" color="primary" />
                <IonLabel position="stacked">Sobrenome</IonLabel>
                <IonInput value={sobrenome} onIonInput={(e) => setSobrenome(e.detail.value || '')} placeholder="Seu sobrenome" disabled={saving} />
              </IonItem>
              <IonItem>
                <IonIcon icon={personOutline} slot="start" color="primary" />
                <IonLabel position="stacked">Genero</IonLabel>
                <IonSelect value={genero} onIonChange={(e) => setGenero(e.detail.value)} placeholder="Selecione" disabled={saving}>
                  <IonSelectOption value="masculino">Masculino</IonSelectOption>
                  <IonSelectOption value="feminino">Feminino</IonSelectOption>
                  <IonSelectOption value="nao_informado">Prefiro nao informar</IonSelectOption>
                </IonSelect>
              </IonItem>
              <PasswordInput
                value={senhaAtual}
                onChange={setSenhaAtual}
                placeholder="Senha atual (obrigatoria)"
                label="Senha Atual"
                disabled={saving}
              />
              <FormError message={error} />
              <LoadingButton
                loading={saving}
                disabled={!nome || !sobrenome || !senhaAtual}
                onClick={handleSave}
                label="Salvar Alteracoes"
                color="primary"
                icon={saveOutline}
              />
            </IonCardContent>
          </IonCard>
        </div>
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => { setShowToast(false); history.push('/app/perfil'); }}
          message="Perfil atualizado com sucesso!"
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProfilePage;
