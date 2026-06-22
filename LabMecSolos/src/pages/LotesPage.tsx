import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonButton, IonToast, IonSpinner, IonSegment, IonSegmentButton, IonIcon } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { alertCircleOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { InventarioService } from '../services/InventarioService';
import AppBar from '../components/AppBar';
import type { ItemDetalhado, LoteMaterial } from '../models/types';

const LotesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const [item, setItem] = useState<ItemDetalhado | null>(null);
  const [tab, setTab] = useState<'lista' | 'cadastrar'>('lista');
  const [lotes, setLotes] = useState<LoteMaterial[]>([]);
  const [numeroLote, setNumeroLote] = useState('');
  const [dataRecebimento, setDataRecebimento] = useState(new Date().toISOString().split('T')[0]);
  const [dataValidade, setDataValidade] = useState('');
  const [qtdeInicial, setQtdeInicial] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [toastColor, setToastColor] = useState<string>('success');
  const carregar = () => { InventarioService.listarLotes(id).then(setLotes); };

  useEffect(() => {
    InventarioService.obterItem(id).then((it) => { setItem(it); carregar(); });
  }, [id]);

  const handleCadastrar = async () => {
    if (!numeroLote.trim() || !dataRecebimento || !qtdeInicial || !usuario) return;
    setSaving(true);
    try {
      await InventarioService.criarLote({ idMaterial: id, numeroLote, dataRecebimento, dataValidade: dataValidade || undefined, quantidadeInicial: Number(qtdeInicial) }, usuario.userId);
      setToastColor('success'); setToastMsg('Lote criado.');
      setShowToast(true);
      setTab('lista');
      setNumeroLote(''); setDataRecebimento(''); setDataValidade(''); setQtdeInicial('');
      carregar();
    } catch { /* */ }
    setSaving(false);
  };

  const statusIcon = (s: string) => s === 'vencido' ? <IonIcon icon={alertCircleOutline} color="danger" style={{ marginRight: 6 }} /> : null;

  return (
    <IonPage>
      <AppBar title={item ? `Lotes: ${item.nome}` : 'Lotes'} />
      <IonContent>
        <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as typeof tab)} style={{ margin: 8 }}>
          <IonSegmentButton value="lista"><IonLabel>Lotes</IonLabel></IonSegmentButton>
          <IonSegmentButton value="cadastrar"><IonLabel>Cadastrar</IonLabel></IonSegmentButton>
        </IonSegment>

        {tab === 'lista' ? (
          <>
            {lotes.map((l) => (
              <IonCard key={l.id} style={{ borderRadius: 12, margin: '8px 16px' }}>
                <IonCardContent>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {statusIcon(l.status)}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ion-color-dark)' }}>Lote {l.numero_lote}</div>
                      <div style={{ fontSize: 11, color: 'var(--ion-color-medium)' }}>
                        {l.quantidade_atual}/{l.quantidade_inicial} | {l.status}
                        {l.data_validade ? ` | Val: ${new Date(l.data_validade).toLocaleDateString('pt-BR')}` : ''}
                      </div>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </>
        ) : (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <IonItem><IonLabel position="stacked">Numero do Lote *</IonLabel><IonInput value={numeroLote} onIonInput={(e) => setNumeroLote(e.detail.value || '')} /></IonItem>
            <IonItem><IonLabel position="stacked">Data de Recebimento *</IonLabel><IonInput type="date" value={dataRecebimento} onIonInput={(e) => setDataRecebimento(e.detail.value || '')} /></IonItem>
            <IonItem><IonLabel position="stacked">Data de Validade</IonLabel><IonInput type="date" value={dataValidade} onIonInput={(e) => setDataValidade(e.detail.value || '')} /></IonItem>
            <IonItem><IonLabel position="stacked">Quantidade Inicial *</IonLabel><IonInput type="number" value={qtdeInicial} onIonInput={(e) => setQtdeInicial(e.detail.value || '')} /></IonItem>
            <IonButton expand="block" onClick={handleCadastrar} disabled={!numeroLote.trim() || !dataRecebimento || !qtdeInicial || saving}>
              {saving ? <IonSpinner /> : 'Cadastrar Lote'}
            </IonButton>
          </div>
        )}
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default LotesPage;