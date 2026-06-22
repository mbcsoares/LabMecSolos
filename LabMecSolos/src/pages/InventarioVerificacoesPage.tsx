import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonToast, IonSpinner, IonList, IonSegment, IonSegmentButton } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { InventarioService } from '../services/InventarioService';
import AppBar from '../components/AppBar';
import type { ItemDetalhado, RegistroEquipamento } from '../models/types';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

const InventarioVerificacoesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const [item, setItem] = useState<ItemDetalhado | null>(null);
  const [tab, setTab] = useState<'registrar' | 'lista'>('registrar');
  const [tipo, setTipo] = useState<'verificacao' | 'reparo'>('verificacao');
  const [descricao, setDescricao] = useState('');
  const [resultado, setResultado] = useState('');
  const [observacao, setObservacao] = useState('');
  const [dataProxima, setDataProxima] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [registros, setRegistros] = useState<RegistroEquipamento[]>([]);

  useEffect(() => {
    InventarioService.obterItem(id).then(setItem);
    InventarioService.listarRegistrosEquipamento(id).then(setRegistros);
  }, [id]);

  const handleSave = async () => {
    if (!descricao.trim() || !resultado || !usuario) return;
    setSaving(true);
    try {
      await InventarioService.registrarVerificacaoReparo(
        { idEquipamento: id, tipo, descricao, resultado, observacao, dataProximaVerificacao: dataProxima || undefined },
        usuario.userId
      );
      setShowToast(true);
      setDescricao(''); setResultado(''); setObservacao(''); setDataProxima('');
      InventarioService.listarRegistrosEquipamento(id).then(setRegistros);
    } catch { /* */ }
    setSaving(false);
  };

  const resultados = tipo === 'verificacao' ? ['conforme', 'nao_conforme'] : ['concluido', 'pendente'];

  return (
    <IonPage>
      <AppBar title={item ? `Verificacoes: ${item.nome}` : 'Verificacoes'} />
      <IonContent>
        <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as typeof tab)} style={{ margin: 8 }}>
          <IonSegmentButton value="registrar"><IonLabel>Registrar</IonLabel></IonSegmentButton>
          <IonSegmentButton value="lista"><IonLabel>Histórico</IonLabel></IonSegmentButton>
        </IonSegment>

        {tab === 'registrar' ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <IonItem><IonLabel position="stacked">Tipo</IonLabel><IonSelect value={tipo} onIonChange={(e) => { setTipo(e.detail.value); setResultado(''); }}><IonSelectOption value="verificacao">Verificacao</IonSelectOption><IonSelectOption value="reparo">Reparo</IonSelectOption></IonSelect></IonItem>
            <IonItem><IonLabel position="stacked">Descricao *</IonLabel><IonInput value={descricao} onIonInput={(e) => setDescricao(e.detail.value || '')} /></IonItem>
            <IonItem><IonLabel position="stacked">Resultado</IonLabel><IonSelect value={resultado} onIonChange={(e) => setResultado(e.detail.value)}>{resultados.map((r) => <IonSelectOption key={r} value={r}>{r === 'conforme' ? 'Conforme' : r === 'nao_conforme' ? 'Nao Conforme' : r === 'concluido' ? 'Concluido' : 'Pendente'}</IonSelectOption>)}</IonSelect></IonItem>
            <IonItem><IonLabel position="stacked">Observacao</IonLabel><IonInput value={observacao} onIonInput={(e) => setObservacao(e.detail.value || '')} /></IonItem>
            <IonItem><IonLabel position="stacked">Proxima Verificacao</IonLabel><IonInput type="date" value={dataProxima} onIonInput={(e) => setDataProxima(e.detail.value || '')} /></IonItem>
            <IonButton expand="block" onClick={handleSave} disabled={!descricao.trim() || !resultado || saving}>{saving ? <IonSpinner /> : 'Registrar'}</IonButton>
          </div>
        ) : (
          <IonList>
            {registros.map((r) => (
              <IonItem key={r.id}>
                <IonLabel>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.tipo === 'verificacao' ? 'Verificacao' : 'Reparo'} — {r.resultado}</div>
                  <div style={{ fontSize: 12, color: 'var(--ion-color-dark)' }}>{r.descricao}</div>
                  <div style={{ fontSize: 11, color: 'var(--ion-color-medium)' }}>{formatarData(r.data_registro)}{r.data_proxima_verificacao ? ` | Prox: ${formatarData(r.data_proxima_verificacao)}` : ''}</div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message="Registrado." duration={2000} color="success" position="top" />
      </IonContent>
    </IonPage>
  );
};

export default InventarioVerificacoesPage;