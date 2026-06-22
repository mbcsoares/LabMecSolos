import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonToast,
  IonSpinner,
  IonIcon,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { informationCircleOutline, warningOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { AdminService } from '../services/AdminService';
import AppBar from '../components/AppBar';
import ConfirmacaoSenhaDialog from '../components/ConfirmacaoSenhaDialog';
import type { UsuarioListItem } from '../models/types';

const AdminTransferirChefiaPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const [chefes, setChefes] = useState<UsuarioListItem[]>([]);
  const [professores, setProfessores] = useState<UsuarioListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [idOrigem, setIdOrigem] = useState<string | null>(null);
  const [idDestino, setIdDestino] = useState<string | null>(null);
  const [checkboxMarcado, setCheckboxMarcado] = useState(false);
  const [alerta, setAlerta] = useState<string | null>(null);
  const [erroValidacao, setErroValidacao] = useState('');
  const [showSenhaDialog, setShowSenhaDialog] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const [c, p] = await Promise.all([
        AdminService.obterChefesAtuais(),
        AdminService.obterProfessoresElegiveis(),
      ]);
      setChefes(c);
      setProfessores(p);
      setLoading(false);
    };
    load();
  }, []);

  const origemValida = idOrigem !== null;
  const destinoValido = idDestino !== null && idDestino !== idOrigem;
  const formValido = origemValida && destinoValido && checkboxMarcado;

  const handleSenhaConfirm = async (senha: string): Promise<boolean> => {
    if (!usuario || !idOrigem || !idDestino) return false;

    const result = await AdminService.transferirChefia(
      idOrigem,
      idDestino,
      usuario.userId,
      senha
    );

    if (result.sucesso && result.alerta) {
      setAlerta(result.alerta);
      setShowSenhaDialog(false);
      return false; // A transferência NÃO foi executada; alerta exibido
    }

    if (result.sucesso) {
      setToastMessage('Chefia transferida com sucesso.');
      setShowToast(true);
      setShowSenhaDialog(false);
      return true;
    }

    return false;
  };

  const handleAlertaContinuar = async () => {
    setAlerta(null);
    setShowSenhaDialog(true);
  };

  if (loading) {
    return (
      <IonPage>
        <AppBar title="Transferir Chefia" />
        <IonContent>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <AppBar title="Transferir Chefia" />
      <IonContent>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <IonCard style={{ borderRadius: 8, borderLeft: '4px solid var(--ion-color-secondary)' }}>
            <IonCardContent style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <IonIcon icon={informationCircleOutline} style={{ fontSize: 22, color: 'var(--ion-color-secondary)', marginTop: 2 }} />
              <p style={{ fontSize: 13, color: 'var(--ion-color-dark)', margin: 0, lineHeight: 1.5 }}>
                A transferencia de chefia e irreversivel para o chefe que a realiza. O chefe de origem voltara para permissao 'comum'.
              </p>
            </IonCardContent>
          </IonCard>

          {alerta && (
            <IonCard style={{ borderRadius: 8, borderLeft: '4px solid #E6A817' }}>
              <IonCardContent style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon icon={warningOutline} style={{ fontSize: 22, color: '#E6A817' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)' }}>Atencao</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ion-color-dark)', margin: 0 }}>{alerta}</p>
                <button
                  onClick={handleAlertaContinuar}
                  style={{
                    padding: '10px 16px', borderRadius: 8, border: 'none',
                    background: '#E6A817', color: '#2c2926',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end',
                  }}
                >
                  Entendo, continuar
                </button>
              </IonCardContent>
            </IonCard>
          )}

          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ion-color-dark)', margin: '0 0 4px 0' }}>
              Transferir de:
            </p>
            <IonSelect
              value={idOrigem}
              placeholder="Selecione um chefe de origem"
              onIonChange={(e) => setIdOrigem(e.detail.value)}
              style={{
                border: `1px solid ${!origemValida && erroValidacao ? '#C0392B' : '#E0E0E0'}`,
                borderRadius: 4, padding: '8px 12px', fontSize: 14,
              }}
            >
              {chefes.map((c) => (
                <IonSelectOption key={c.id} value={c.id}>
                  {c.nome} {c.sobrenome} ({c.matricula})
                </IonSelectOption>
              ))}
            </IonSelect>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ion-color-dark)', margin: '0 0 4px 0' }}>
              Transferir para:
            </p>
            <IonSelect
              value={idDestino}
              placeholder="Selecione um professor destinatario"
              onIonChange={(e) => setIdDestino(e.detail.value)}
              style={{
                border: `1px solid ${!destinoValido && erroValidacao ? '#C0392B' : '#E0E0E0'}`,
                borderRadius: 4, padding: '8px 12px', fontSize: 14,
              }}
            >
              {professores.map((p) => (
                <IonSelectOption key={p.id} value={p.id}>
                  {p.nome} {p.sobrenome} ({p.matricula})
                </IonSelectOption>
              ))}
            </IonSelect>
            {!destinoValido && erroValidacao && (
              <p style={{ fontSize: 12, color: '#C0392B', margin: '4px 0 0 0' }}>{erroValidacao}</p>
            )}
          </div>

          <IonItem lines="none" style={{ fontSize: 13 }}>
            <IonCheckbox
              checked={checkboxMarcado}
              onIonChange={(e) => setCheckboxMarcado(e.detail.checked)}
              slot="start"
            />
            <IonLabel>Entendo que esta acao e irreversivel por mim.</IonLabel>
          </IonItem>

          {erroValidacao && !origemValida && (
            <p style={{ fontSize: 12, color: '#C0392B', margin: 0 }}>{erroValidacao}</p>
          )}

          <button
            onClick={() => {
              if (!origemValida) { setErroValidacao('Selecione um chefe de origem.'); return; }
              if (!destinoValido) { setErroValidacao('O destinatario nao pode ser o mesmo que a origem.'); return; }
              if (!checkboxMarcado) { setErroValidacao('Voce precisa confirmar que entende a irreversibilidade.'); return; }
              setErroValidacao('');
              setShowSenhaDialog(true);
            }}
            disabled={loading}
            style={{
              padding: '14px', borderRadius: 8, border: 'none',
              background: formValido ? 'var(--ion-color-primary)' : '#E0E0E0',
              color: formValido ? '#FFFFFF' : '#898888',
              fontSize: 15, fontWeight: 600, cursor: formValido ? 'pointer' : 'not-allowed',
              marginTop: 8,
            }}
          >
            Transferir Chefia
          </button>
        </div>

        <ConfirmacaoSenhaDialog
          isOpen={showSenhaDialog}
          titulo="Confirme sua identidade"
          mensagem="Esta acao exige confirmacao por senha."
          onConfirmar={handleSenhaConfirm}
          onCancelar={() => setShowSenhaDialog(false)}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => { setShowToast(false); history.push('/app/gerenciar-usuarios'); }}
          message={toastMessage}
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminTransferirChefiaPage;
