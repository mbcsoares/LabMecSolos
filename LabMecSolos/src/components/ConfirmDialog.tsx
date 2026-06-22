import React from 'react';
import {
  IonButton,
} from '@ionic/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  confirmColor = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: 'var(--ion-background-color)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 340,
          width: '85%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
      >
        <h3 style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--ion-color-dark)',
          margin: '0 0 12px 0',
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: 14,
          color: 'var(--ion-color-dark)',
          margin: '0 0 20px 0',
          lineHeight: 1.5,
        }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <IonButton
            fill="outline"
            color="medium"
            onClick={onCancel}
            style={{ fontWeight: 500 }}
            disabled={loading}
          >
            {cancelLabel}
          </IonButton>
          <IonButton
            color={confirmColor}
            onClick={onConfirm}
            style={{ fontWeight: 600 }}
            disabled={loading}
          >
            {confirmLabel}
          </IonButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
