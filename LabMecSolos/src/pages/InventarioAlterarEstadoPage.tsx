import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonButton, IonToast, IonSpinner } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { InventarioService, TRANSICOES_ESTADO_EQUIPAMENTO } from '../services/InventarioService';
import AppBar from '../components/AppBar';
import EstadoBadge from '../components/EstadoBadge';
import type { EstadoEquipamento } from '../models/types';

const InventarioAlterarEstadoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [estadoAtual, setEstadoAtual] = useState<string>('');
  const [novoEstado, setNovoEstado] = useState<string>('');
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    InventarioService.obterItem(id).then((it) => {
      const e = (it as unknown as Record<string, unknown>).estado as string;
      setEstadoAtual(e);
    });
  }, [id]);

  const estadosPermitidos = estadoAtual ? TRANSICOES_ESTADO_EQUIPAMENTO[estadoAtual as EstadoEquipamento] || [] : [];

  const handleSave = async () => {
    if (!novoEstado || !usuario) return;
    setSaving(true);
    try {
      await InventarioService.alterarEstado(id, novoEstado as EstadoEquipamento, observacao || null, usuario.userId);
      setShowToast(true);
    } catch { /* */ }
    setSaving(false);
  };

  return (
    <IonPage>
      <AppBar title="Alterar Estado" />
      <IonContent>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 14 }}>
            Estado atual: {estadoAtual ? <EstadoBadge estado={estadoAtual as EstadoEquipamento} /> : '...'}
          </div>
          <IonItem>
            <IonLabel position="stacked">Novo Estado</IonLabel>
            <IonSelect value={novoEstado} onIonChange={(e) => setNovoEstado(e.detail.value)} placeholder="Selecione">
              {estadosPermitidos.map((e) => (
                <IonSelectOption key={e} value={e}>{e === 'disponivel' ? 'Disponivel' : e === 'em_manutencao' ? 'Em Manutencao' : e === 'inoperante' ? 'Inoperante' : 'Calibracao Vencida'}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Observacao</IonLabel>
            <IonInput value={observacao} onIonInput={(e) => setObservacao(e.detail.value || '')} placeholder="Opcional" />
          </IonItem>
          <IonButton expand="block" onClick={handleSave} disabled={!novoEstado || saving}>
            {saving ? <IonSpinner /> : 'Alterar Estado'}
          </IonButton>
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => { setShowToast(false); history.goBack(); }} message="Estado alterado." duration={2000} color="success" position="top" />
      </IonContent>
    </IonPage>
  );
};

export default InventarioAlterarEstadoPage;