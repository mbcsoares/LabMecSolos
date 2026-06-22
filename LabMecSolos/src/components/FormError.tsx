import React from 'react';

interface Props {
  message: string;
}

const FormError: React.FC<Props> = ({ message }) => {
  if (!message) return null;

  return (
    <div style={{
      fontSize: 13,
      color: 'var(--ion-color-danger)',
      margin: '8px 0 4px 0',
      minHeight: 20,
      textAlign: 'center',
    }}>
      {message}
    </div>
  );
};

export default FormError;
