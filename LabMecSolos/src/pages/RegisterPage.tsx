import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import {
  personOutline,
  idCardOutline,
  schoolOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { CadastroService } from '../services/CadastroService';
import InstitutionalEmailInput from '../components/InstitutionalEmailInput';
import PasswordInput from '../components/PasswordInput';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import FormError from '../components/FormError';
import './Auth.css';

const RegisterPage: React.FC = () => {
  const history = useHistory();
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [genero, setGenero] = useState('');
  const [matricula, setMatricula] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (senha !== confirmarSenha) {
      setError('As senhas nao conferem.');
      return;
    }

    setLoading(true);
    const result = await CadastroService.criarPreCadastro({
      nome,
      sobrenome,
      genero,
      matricula,
      email,
      senha,
      perfil,
    });
    setLoading(false);

    if (result.sucesso) {
      history.push('/confirm-account', {
        email: email.toLowerCase().trim(),
        codigoGerado: result.codigo,
      });
    } else {
      setError(result.erro || 'Erro ao criar pre-cadastro.');
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div className="auth-container">
          <IonCard className="auth-card">
            <IonCardHeader>
              <IonCardTitle>Criar Conta</IonCardTitle>
              <IonCardSubtitle>Preencha seus dados</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonIcon icon={personOutline} slot="start" color="success" />
                <IonLabel position="stacked">Nome</IonLabel>
                <IonInput value={nome} onIonInput={(e) => setNome(e.detail.value || '')} placeholder="Seu nome" disabled={loading} />
              </IonItem>
              <IonItem>
                <IonIcon icon={personOutline} slot="start" color="success" />
                <IonLabel position="stacked">Sobrenome</IonLabel>
                <IonInput value={sobrenome} onIonInput={(e) => setSobrenome(e.detail.value || '')} placeholder="Seu sobrenome" disabled={loading} />
              </IonItem>
              <IonItem>
                <IonIcon icon={personOutline} slot="start" color="success" />
                <IonLabel position="stacked">Genero</IonLabel>
                <IonSelect value={genero} onIonChange={(e) => setGenero(e.detail.value)} placeholder="Selecione" disabled={loading}>
                  <IonSelectOption value="masculino">Masculino</IonSelectOption>
                  <IonSelectOption value="feminino">Feminino</IonSelectOption>
                  <IonSelectOption value="nao_informado">Prefiro nao informar</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonIcon icon={idCardOutline} slot="start" color="success" />
                <IonLabel position="stacked">Matricula</IonLabel>
                <IonInput value={matricula} onIonInput={(e) => setMatricula(e.detail.value || '')} placeholder="Numero de matricula" disabled={loading} />
              </IonItem>
              <InstitutionalEmailInput value={email} onChange={setEmail} disabled={loading} />
              <IonItem>
                <IonIcon icon={schoolOutline} slot="start" color="success" />
                <IonLabel position="stacked">Perfil</IonLabel>
                <IonSelect value={perfil} onIonChange={(e) => setPerfil(e.detail.value)} placeholder="Selecione" disabled={loading}>
                  <IonSelectOption value="aluno">Aluno</IonSelectOption>
                  <IonSelectOption value="professor">Professor</IonSelectOption>
                  <IonSelectOption value="tecnico">Tecnico</IonSelectOption>
                </IonSelect>
              </IonItem>
              <PasswordInput value={senha} onChange={setSenha} placeholder="Minimo 8 caracteres" label="Senha" disabled={loading} autocomplete="new-password" />
              <PasswordStrengthIndicator password={senha} />
              <PasswordInput value={confirmarSenha} onChange={setConfirmarSenha} placeholder="Repita a senha" label="Confirmar Senha" disabled={loading} autocomplete="new-password" />
              <FormError message={error} />
              <IonButton expand="block" color="success" className="auth-button" onClick={handleSubmit} disabled={loading}>
                {loading ? <IonSpinner name="crescent" /> : 'Cadastrar'}
                {!loading && <IonIcon slot="end" icon={checkmarkCircleOutline} />}
              </IonButton>
              <div className="auth-links" style={{ justifyContent: 'center' }}>
                <a onClick={() => history.push('/login')} style={{ color: 'var(--ion-color-primary)', cursor: 'pointer' }}>
                  <IonIcon icon={arrowBackOutline} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Ja tenho conta
                </a>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RegisterPage;
