import React from 'react';
import { IonItem, IonLabel, IonInput, IonIcon } from '@ionic/react';
import { lockClosedOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autocomplete?: string;
}

const PasswordInput: React.FC<Props> = ({ value, onChange, placeholder, error, label, disabled, onKeyDown, autocomplete }) => {
  const [show, setShow] = React.useState(false);

  return (
    <IonItem>
      <IonIcon icon={lockClosedOutline} slot="start" color={error ? 'danger' : 'primary'} />
      <IonLabel position="stacked">{label || 'Senha'}</IonLabel>
      <IonInput
        type={show ? 'text' : 'password'}
        value={value}
        onIonInput={(e) => onChange(e.detail.value || '')}
        onKeyDown={onKeyDown}
        placeholder={placeholder || 'Digite sua senha'}
        autocomplete={autocomplete as any || 'current-password'}
        disabled={disabled}
      />
      <IonIcon
        icon={show ? eyeOffOutline : eyeOutline}
        slot="end"
        onClick={() => setShow(!show)}
        style={{ cursor: 'pointer', opacity: 0.6 }}
      />
    </IonItem>
  );
};

export default PasswordInput;
