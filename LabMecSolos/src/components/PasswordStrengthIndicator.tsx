import React from 'react';
import { SenhaService } from '../services/SenhaService';

interface Props {
  password: string;
}

const PasswordStrengthIndicator: React.FC<Props> = ({ password }) => {
  const { erros } = SenhaService.validarForcaSenha(password);
  const criteriaMet = 4 - erros.length;

  const getColor = () => {
    if (criteriaMet === 0) return '#c5000b';
    if (criteriaMet <= 2) return '#ff6600';
    if (criteriaMet === 3) return '#e6b800';
    return '#009d43';
  };

  const getLabel = () => {
    if (criteriaMet === 0) return 'Fraca';
    if (criteriaMet <= 2) return 'Media';
    if (criteriaMet === 3) return 'Boa';
    return 'Forte';
  };

  if (!password) return null;

  return (
    <div style={{ padding: '4px 16px 0 16px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i < criteriaMet ? getColor() : '#e0e0e0',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: getColor(), fontWeight: 600 }}>{getLabel()}</span>
        <span style={{ color: getColor() }}>{criteriaMet}/4</span>
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
