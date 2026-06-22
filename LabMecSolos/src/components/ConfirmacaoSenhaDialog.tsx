import React, { useState } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';

interface ConfirmacaoSenhaDialogProps {
  titulo: string;
  mensagem: string;
  isOpen: boolean;
  onConfirmar: (senha: string) => Promise<boolean>;
  onCancelar: () => void;
  onExcedeuTentativas?: () => void;
}

const TENTATIVAS_MAXIMAS = 3;

type EstadoDialogo =
  | { fase: 'aguardando'; tentativas: number; mensagem: string | null }
  | { fase: 'validando'; tentativas: number }
  | { fase: 'erro'; tentativas: number; mensagem: string }
  | { fase: 'cancelado' }
  | { fase: 'confirmado' };

const ConfirmacaoSenhaDialog: React.FC<ConfirmacaoSenhaDialogProps> = ({
  titulo,
  mensagem,
  isOpen,
  onConfirmar,
  onCancelar,
  onExcedeuTentativas,
}) => {
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [estado, setEstado] = useState<EstadoDialogo>({ fase: 'aguardando', tentativas: 0, mensagem: null });

  if (!isOpen) return null;

  const handleConfirmar = async () => {
    if (estado.fase !== 'aguardando' && estado.fase !== 'erro') return;

    const tentativas = estado.fase === 'erro' ? estado.tentativas : estado.tentativas;
    setEstado({ fase: 'validando', tentativas });
    setSenha('');

    const senhaOk = await onConfirmar(senha);

    if (senhaOk) {
      setEstado({ fase: 'confirmado' });
    } else {
      const novasTentativas = tentativas + 1;
      if (novasTentativas >= TENTATIVAS_MAXIMAS) {
        setEstado({ fase: 'cancelado' });
        onExcedeuTentativas?.();
      } else {
        setEstado({
          fase: 'erro',
          tentativas: novasTentativas,
          mensagem: `Senha incorreta. Tentativa ${novasTentativas} de ${TENTATIVAS_MAXIMAS}.`,
        });
      }
    }
  };

  const handleCancelar = () => {
    setEstado({ fase: 'cancelado' });
    onCancelar();
  };

  const estaEnviando = estado.fase === 'validando';
  const excedeu = estado.fase === 'cancelado';
  const confirmado = estado.fase === 'confirmado';
  const erroMsg = estado.fase === 'erro' ? estado.mensagem : null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 9999,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !estaEnviando) handleCancelar(); }}
    >
      <div style={{
        background: 'var(--ion-background-color)', borderRadius: 12, padding: 24,
        maxWidth: 340, width: '85%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ion-color-dark)', margin: '0 0 8px 0' }}>
          {titulo}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--ion-color-dark)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          {excedeu
            ? 'Acao cancelada por excesso de tentativas.'
            : confirmado
            ? 'Senha confirmada com sucesso.'
            : mensagem}
        </p>

        {!excedeu && !confirmado && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ion-color-dark)', display: 'block', marginBottom: 4 }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    if (estado.fase === 'erro') setEstado({ fase: 'aguardando', tentativas: estado.tentativas, mensagem: null });
                  }}
                  placeholder="Digite sua senha"
                  disabled={estaEnviando}
                  style={{
                    width: '100%', height: 48, borderRadius: 4,
                    border: `2px solid ${erroMsg ? '#C0392B' : 'var(--app-color-border)'}`,
                    padding: '0 48px 0 12px', fontSize: 14, boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  style={{
                    position: 'absolute', right: 8, top: 12,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 16, color: 'var(--ion-color-medium)',
                  }}
                >
                  {mostrarSenha ? '\u25C9' : '\u25CE'}
                </button>
              </div>
              {erroMsg && (
                <p style={{ fontSize: 12, color: '#C0392B', margin: '4px 0 0 0' }}>{erroMsg}</p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
              {Array.from({ length: TENTATIVAS_MAXIMAS }).map((_, i) => {
                const tentativasUsadas = estado.fase === 'erro' ? estado.tentativas : estado.fase === 'aguardando' ? estado.tentativas : 0;
                const preenchido = i < tentativasUsadas;
                return (
                  <div
                    key={i}
                    style={{
                      width: 12, height: 12, borderRadius: 6,
                      backgroundColor: preenchido ? '#C0392B' : 'var(--app-color-border)',
                      transition: 'background-color 0.2s',
                    }}
                  />
                );
              })}
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {(excedeu || confirmado) ? (
            <IonButton fill="outline" color="medium" onClick={handleCancelar}>
              Fechar
            </IonButton>
          ) : (
            <>
              <IonButton fill="outline" color="medium" onClick={handleCancelar} disabled={estaEnviando}>
                Cancelar
              </IonButton>
              <IonButton color="primary" onClick={handleConfirmar} disabled={!senha || estaEnviando}>
                {estaEnviando ? <IonSpinner name="crescent" /> : 'Confirmar'}
              </IonButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmacaoSenhaDialog;
