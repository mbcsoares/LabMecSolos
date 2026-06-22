import React from 'react';
import { IonItem, IonLabel, IonInput, IonIcon } from '@ionic/react';
import { mailOutline } from 'ionicons/icons';
import { ValidacaoService } from '../services/ValidacaoService';

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  autocomplete?: string;
}

const InstitutionalEmailInput: React.FC<Props> = ({ value, onChange, error, disabled, onKeyDown, placeholder, autocomplete }) => {
  const validate = (val: string) => {
    if (!val) return undefined;
    const result = ValidacaoService.validarEmailInstitucional(val);
    return result.valido ? undefined : result.erro;
  };

  const displayError = error || validate(value);

  return (
    <IonItem>
      <IonIcon icon={mailOutline} slot="start" color={displayError ? 'danger' : 'primary'} />
      <IonLabel position="stacked">E-mail Institucional</IonLabel>
      <IonInput
        type="email"
        value={value}
        onIonInput={(e) => onChange(e.detail.value || '')}
        onKeyDown={onKeyDown}
        placeholder={placeholder || 'seu@ufrn.br'}
        autocomplete={autocomplete as any || 'email'}
        disabled={disabled}
      />
      {displayError && (
        <div slot="helper" style={{ color: 'var(--ion-color-danger)', fontSize: 11 }}>
          {displayError}
        </div>
      )}
    </IonItem>
  );
};

export default InstitutionalEmailInput;
