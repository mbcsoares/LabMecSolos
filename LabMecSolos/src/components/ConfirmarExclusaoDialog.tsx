import React, { useState } from 'react';

interface ConfirmarExclusaoDialogProps {
  isOpen: boolean;
  nomeUsuario: string;
  onConfirmar: () => Promise<void>;
  onCancelar: () => void;
}

const ConfirmarExclusaoDialog: React.FC<ConfirmarExclusaoDialogProps> = ({
  isOpen,
  nomeUsuario,
  onConfirmar,
  onCancelar,
}) => {
  const [textoDigitado, setTextoDigitado] = useState('');
  const textoValido = textoDigitado === 'EXCLUIR';

  if (!isOpen) return null;

  const handleConfirmar = () => {
    if (!textoValido) return;
    onConfirmar();
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 9999,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}
    >
      <div style={{
        background: 'var(--ion-background-color)', borderRadius: 12, padding: 24,
        maxWidth: 360, width: '88%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        border: '2px solid #C0392B',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: '#C0392B', display: 'flex',
            justifyContent: 'center', alignItems: 'center',
            margin: '0 auto 12px auto', fontSize: 28, color: '#FFFFFF',
          }}>
            &#9888;
          </div>
          <h3 style={{
            fontSize: 18, fontWeight: 700, color: '#C0392B',
            margin: '0 0 8px 0', textTransform: 'uppercase',
          }}>
            ATENCAO
          </h3>
          <p style={{ fontSize: 14, color: 'var(--ion-color-dark)', margin: 0, lineHeight: 1.5 }}>
            Esta acao e <strong>irreversivel</strong>. O usuario <strong>{nomeUsuario}</strong> sera permanentemente excluido do sistema.
          </p>
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-dark)', margin: '0 0 8px 0' }}>
          Digite EXCLUIR para confirmar:
        </p>

        <div style={{ position: 'relative', marginBottom: 20 }}>
          <input
            type="text"
            value={textoDigitado}
            onChange={(e) => setTextoDigitado(e.target.value)}
            placeholder="Digite EXCLUIR"
            style={{
              width: '100%', height: 48, borderRadius: 4,
              border: `2px solid ${textoDigitado.length > 0 ? (textoValido ? '#009d43' : '#C0392B') : 'var(--app-color-border)'}`,
              padding: '0 40px 0 12px', fontSize: 14, boxSizing: 'border-box',
              outline: 'none', fontWeight: 600,
            }}
          />
          {textoDigitado.length > 0 && (
            <span style={{
              position: 'absolute', right: 12, top: 14,
              fontSize: 16, color: textoValido ? '#009d43' : '#C0392B',
            }}>
              {textoValido ? '\u2713' : '\u2717'}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button
            onClick={onCancelar}
            style={{
              padding: '10px 20px', borderRadius: 8, border: '1px solid var(--ion-color-medium)',
              background: 'transparent', color: 'var(--ion-color-medium)',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!textoValido}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: textoValido ? '#C0392B' : 'var(--app-color-border)',
              color: textoValido ? '#FFFFFF' : '#898888',
              fontSize: 14, fontWeight: 600, cursor: textoValido ? 'pointer' : 'not-allowed',
            }}
          >
            Excluir Usuario
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmarExclusaoDialog;
