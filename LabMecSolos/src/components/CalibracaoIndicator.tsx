import React from 'react';

interface CalibracaoIndicatorProps {
  dataUltima: string | null;
  frequenciaDias: number | null;
}

const CalibracaoIndicator: React.FC<CalibracaoIndicatorProps> = ({ dataUltima, frequenciaDias }) => {
  if (!dataUltima || !frequenciaDias) {
    return <span style={{ color: 'var(--ion-color-medium)', fontSize: 13 }}>Nao calibrado</span>;
  }

  const ultima = new Date(dataUltima);
  const proxima = new Date(ultima);
  proxima.setDate(proxima.getDate() + frequenciaDias);

  const hoje = new Date();
  const diasRestantes = Math.ceil((proxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  let color = 'var(--ion-color-dark)';
  if (diasRestantes <= 0) color = '#C0392B';
  else if (diasRestantes <= 30) color = '#E6A817';

  const status = diasRestantes <= 0 ? 'Vencida' : `Em ${diasRestantes} dias`;

  return (
    <span style={{ color, fontSize: 13 }}>
      Proxima calibracao: {proxima.toLocaleDateString('pt-BR')} ({status})
    </span>
  );
};

export default CalibracaoIndicator;
