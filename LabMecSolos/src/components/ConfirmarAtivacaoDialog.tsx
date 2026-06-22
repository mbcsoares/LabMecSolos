import React, { useState } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';

interface ConfirmarAtivacaoDialogProps {
  isOpen: boolean;
  nomeUsuario: string;
  onConfirmar: () => Promise<void>;
  onCancelar: () => void;
}

const ConfirmarAtivacaoDialog: React.FC<ConfirmarAtivacaoDialogProps> = ({
  isOpen,
  nomeUsuario,
  onConfirmar,
  onCancelar,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirmar = async () => {
    setLoading(true);
    await onConfirmar();
    setLoading(false);
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 9999,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}
    >
      <div style={{
        background: 'var(--ion-background-color)', borderRadius: 12, padding: 24,
        maxWidth: 340, width: '85%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: '#009d43', display: 'flex',
          justifyContent: 'center', alignItems: 'center',
          margin: '0 auto 16px auto', fontSize: 28, color: '#FFFFFF',
        }}>
          &#10003;
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ion-color-dark)', margin: '0 0 8px 0' }}>
          Ativar Usuario
        </h3>
        <p style={{ fontSize: 14, color: 'var(--ion-color-dark)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          Deseja ativar o usuario <strong>{nomeUsuario}</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <IonButton fill="outline" color="medium" onClick={onCancelar} disabled={loading}>
            Cancelar
          </IonButton>
          <IonButton color="success" onClick={handleConfirmar} disabled={loading}>
            {loading ? <IonSpinner name="crescent" /> : 'Ativar'}
          </IonButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmarAtivacaoDialog;
