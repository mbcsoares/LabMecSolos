import React from 'react';
import { IonToast } from '@ionic/react';

type SnackbarType = 'success' | 'error' | 'warning' | 'info';

interface SnackbarProps {
  isOpen: boolean;
  message: string;
  type?: SnackbarType;
  duration?: number;
  onDidDismiss: () => void;
}

const typeColors: Record<SnackbarType, string> = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'medium',
};

const Snackbar: React.FC<SnackbarProps> = ({
  isOpen,
  message,
  type = 'info',
  duration = 2500,
  onDidDismiss,
}) => (
  <IonToast
    isOpen={isOpen}
    onDidDismiss={onDidDismiss}
    message={message}
    duration={duration}
    color={typeColors[type]}
    position="bottom"
    style={{
      '--border-radius': '8px',
      '--box-shadow': '0 4px 16px rgba(0,0,0,0.12)',
      textAlign: 'center',
      fontSize: 14,
      margin: '0 16px 16px',
    } as React.CSSProperties}
  />
);

export default Snackbar;
