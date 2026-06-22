import React from 'react';

interface ConfirmarDesativacaoDialogProps {
  isOpen: boolean;
  nomeUsuario: string;
  onConfirmar: () => Promise<void>;
  onCancelar: () => void;
}

const ConfirmarDesativacaoDialog: React.FC<ConfirmarDesativacaoDialogProps> = ({
  isOpen,
  nomeUsuario,
  onConfirmar,
  onCancelar,
}) => (
  <div
    style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: isOpen ? 'flex' : 'none',
      justifyContent: 'center', alignItems: 'center', zIndex: 9999,
    }}
    onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}
  >
    <div style={{
      background: 'var(--ion-background-color)', borderRadius: 12, padding: 24,
      maxWidth: 340, width: '85%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#E6A817', display: 'flex',
        justifyContent: 'center', alignItems: 'center',
        margin: '0 auto 16px auto', fontSize: 28, color: '#FFFFFF',
      }}>
        &#9888;
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ion-color-dark)', margin: '0 0 8px 0' }}>
        Desativar Usuario
      </h3>
      <p style={{ fontSize: 14, color: 'var(--ion-color-dark)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
        Deseja desativar o usuario <strong>{nomeUsuario}</strong>? O usuario nao podera acessar o sistema ate ser reativado.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <button
          onClick={onCancelar}
          style={{
            padding: '10px 20px', borderRadius: 8, border: '1px solid var(--ion-color-primary)',
            background: 'transparent', color: 'var(--ion-color-primary)',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirmar}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: '#E6A817', color: '#2c2926',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Desativar
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmarDesativacaoDialog;
