import React, { useRef } from 'react';
import { IonItem, IonLabel, IonInput, IonIcon } from '@ionic/react';
import { keyOutline } from 'ionicons/icons';

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  length?: number;
}

const CodeInput: React.FC<Props> = ({ value, onChange, error, disabled, onKeyDown, length = 6 }) => {
  const inputsRef = useRef<(HTMLIonInputElement | null)[]>([]);

  const handleChange = (index: number, char: string) => {
    if (!/^\d*$/.test(char)) return;

    const newValue = value.split('');
    newValue[index] = char;
    const joined = newValue.join('').slice(0, length);
    onChange(joined);

    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.setFocus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.setFocus();
    }
    if (e.key === 'Enter' && value.length === length && onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div style={{ padding: '4px 0' }}>
      <IonItem lines="none">
        <IonIcon icon={keyOutline} slot="start" color={error ? 'danger' : 'primary'} style={{ fontSize: 20 }} />
        <IonLabel position="stacked" style={{ marginBottom: 8 }}>Codigo de Verificacao</IonLabel>
      </IonItem>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '0 16px' }}>
        {Array.from({ length }).map((_, i) => (
          <IonInput
            key={i}
            ref={(el) => { inputsRef.current[i] = el; }}
            value={value[i] || ''}
            onIonInput={(e) => handleChange(i, (e.detail.value || '').slice(-1))}
            onKeyDown={(e) => handleKeyDown(i, e)}
            maxlength={1}
            type="text"
            inputmode="numeric"
            disabled={disabled}
            style={{
              width: 44,
              height: 52,
              textAlign: 'center',
              fontSize: 22,
              fontWeight: 700,
              border: `2px solid ${error ? 'var(--ion-color-danger)' : value[i] ? 'var(--ion-color-primary)' : '#d0d0d0'}`,
              borderRadius: 8,
              '--padding-start': 0,
              '--padding-end': 0,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CodeInput;
