import React from 'react';
import { IonButton, IonSpinner, IonIcon } from '@ionic/react';

interface Props {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  color?: string;
  icon?: string;
}

const LoadingButton: React.FC<Props> = ({ loading, disabled, onClick, label, color = 'primary', icon }) => {
  return (
    <IonButton
      expand="block"
      color={color}
      className="auth-button"
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <IonSpinner name="crescent" /> : label}
      {!loading && icon && <IonIcon slot="end" icon={icon} />}
    </IonButton>
  );
};

export default LoadingButton;
