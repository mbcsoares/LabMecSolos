import React, { useState } from 'react';
import { IonButton, IonSpinner } from '@ionic/react';

interface RegistrarCalibracaoDialogProps {
  isOpen: boolean;
  nomeEquipamento: string;
  frequenciaAtual: number | null;
  onConfirmar: (dados: {
    dataCalibracao: string;
    profissional: string;
    empresa: string;
    certificado: string;
    frequenciaDias: number;
    observacao: string;
  }) => Promise<boolean>;
  onCancelar: () => void;
}

const RegistrarCalibracaoDialog: React.FC<RegistrarCalibracaoDialogProps> = ({
  isOpen,
  nomeEquipamento,
  frequenciaAtual,
  onConfirmar,
  onCancelar,
}) => {
  const hoje = new Date().toISOString().split('T')[0];
  const [dataCalibracao, setDataCalibracao] = useState(hoje);
  const [profissional, setProfissional] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [certificado, setCertificado] = useState('');
  const [frequenciaDias, setFrequenciaDias] = useState(frequenciaAtual ? String(frequenciaAtual) : '180');
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  if (!isOpen) return null;

  const valido = dataCalibracao && profissional.trim() && frequenciaDias && Number(frequenciaDias) > 0;

  const handleConfirmar = async () => {
    if (!valido) return;
    setSaving(true);
    setErro('');
    const ok = await onConfirmar({
      dataCalibracao,
      profissional: profissional.trim(),
      empresa: empresa.trim(),
      certificado: certificado.trim(),
      frequenciaDias: Number(frequenciaDias),
      observacao: observacao.trim(),
    });
    setSaving(false);
    if (!ok) setErro('Erro ao registrar calibracao.');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 40, borderRadius: 4,
    border: '1px solid var(--app-color-border)', padding: '0 12px', fontSize: 14,
    boxSizing: 'border-box', outline: 'none', marginBottom: 8,
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'flex-start', zIndex: 9999,
        overflowY: 'auto', padding: '40px 0',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}
    >
      <div style={{
        background: 'var(--ion-background-color)', borderRadius: 12, padding: 24,
        maxWidth: 380, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ion-color-dark)', margin: '0 0 4px 0' }}>
          Registrar Calibracao
        </h3>
        <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: '0 0 16px 0' }}>
          {nomeEquipamento}
        </p>

        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ion-color-dark)', display: 'block', marginBottom: 2 }}>Data da Calibracao *</label>
        <input type="date" value={dataCalibracao} onChange={(e) => setDataCalibracao(e.target.value)} style={inputStyle} />

        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ion-color-dark)', display: 'block', marginBottom: 2 }}>Profissional Habilitado *</label>
        <input type="text" value={profissional} onChange={(e) => setProfissional(e.target.value)} placeholder="Nome do tecnico/engenheiro" style={inputStyle} />

        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ion-color-dark)', display: 'block', marginBottom: 2 }}>Empresa</label>
        <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Empresa responsavel (opcional)" style={inputStyle} />

        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ion-color-dark)', display: 'block', marginBottom: 2 }}>Certificado</label>
        <input type="text" value={certificado} onChange={(e) => setCertificado(e.target.value)} placeholder="Numero do certificado (opcional)" style={inputStyle} />

        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ion-color-dark)', display: 'block', marginBottom: 2 }}>Validade (dias) *</label>
        <input type="number" value={frequenciaDias} onChange={(e) => setFrequenciaDias(e.target.value)} placeholder="Ex: 180" style={inputStyle} />

        <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ion-color-dark)', display: 'block', marginBottom: 2 }}>Observacao</label>
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          placeholder="Notas complementares (opcional)"
          rows={3}
          style={{ ...inputStyle, height: 72, padding: '8px 12px', resize: 'vertical' }}
        />

        {erro && <p style={{ fontSize: 12, color: '#C0392B', margin: '0 0 8px 0' }}>{erro}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <IonButton fill="outline" color="medium" onClick={onCancelar} disabled={saving}>Cancelar</IonButton>
          <IonButton color="primary" onClick={handleConfirmar} disabled={!valido || saving}>
            {saving ? <IonSpinner name="crescent" /> : 'Registrar'}
          </IonButton>
        </div>
      </div>
    </div>
  );
};

export default RegistrarCalibracaoDialog;
