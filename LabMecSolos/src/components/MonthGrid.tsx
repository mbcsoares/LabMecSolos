import React from 'react';

interface DayCellProps {
  dia: number;
  disponivel: boolean;
  ocupado: number;
  capacidade: number;
  selecionado: boolean;
  calendarioPublicado: boolean;
  onPress: () => void;
}

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const DayCell: React.FC<DayCellProps> = ({ dia, disponivel, ocupado, capacidade, selecionado, calendarioPublicado, onPress }) => {
  let bg = '#E8E8E8';
  let textColor = 'var(--ion-color-medium)';

  if (calendarioPublicado) {
    if (!disponivel) {
      bg = '#FADBD8';
      textColor = '#C0392B';
    } else if (ocupado >= capacidade) {
      bg = '#FDEBD0';
      textColor = '#E67E22';
    } else {
      bg = '#D5F5E3';
      textColor = '#1E8449';
    }
  }

  return (
    <div
      onClick={onPress}
      style={{
        width: '100%',
        aspectRatio: '1',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: bg,
        cursor: 'pointer',
        border: selecionado ? '2px solid var(--ion-color-primary)' : '2px solid transparent',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{dia}</span>
      {calendarioPublicado && disponivel && capacidade > 0 && (
        <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>
          {Array.from({ length: capacidade }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 4,
                borderRadius: 2,
                backgroundColor: i < capacidade - ocupado ? '#1E8449' : '#E67E22',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface MonthGridProps {
  mesAno: string;
  dias: { dia: number; disponivel: boolean }[];
  diasOcupacao?: Record<number, number>;
  capacidadePadrao?: number;
  editavel?: boolean;
  selecionados?: number[];
  calendarioPublicado?: boolean;
  onDayPress: (dia: number) => void;
}

const MonthGrid: React.FC<MonthGridProps> = ({
  mesAno,
  dias,
  diasOcupacao = {},
  capacidadePadrao = 0,
  calendarioPublicado = false,
  selecionados = [],
  onDayPress,
}) => {
  const [anoStr, mesStr] = mesAno.split('-');
  const ano = parseInt(anoStr);
  const mes = parseInt(mesStr);
  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay();
  const ultimoDia = new Date(ano, mes, 0).getDate();

  const diaMap: Record<number, { disponivel: boolean }> = {};
  dias.forEach((d) => { diaMap[d.dia] = d; });

  const cells: (number | null)[] = [];
  for (let i = 0; i < primeiroDiaSemana; i++) cells.push(null);
  for (let dia = 1; dia <= ultimoDia; dia++) cells.push(dia);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {SEMANA.map((s, idx) => (
          <div key={idx} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--ion-color-medium)', padding: '4px 0' }}>
            {s}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((dia, idx) =>
          dia === null ? (
            <div key={`e-${idx}`} />
          ) : (
            <DayCell
              key={dia}
              dia={dia}
              disponivel={diaMap[dia]?.disponivel ?? false}
              ocupado={diasOcupacao[dia] || 0}
              capacidade={capacidadePadrao}
              selecionado={selecionados.includes(dia)}
              calendarioPublicado={calendarioPublicado}
              onPress={() => onDayPress(dia)}
            />
          )
        )}
      </div>
    </div>
  );
};

export default MonthGrid;
