import React, { useState, useEffect, useCallback } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonToast, IonSpinner, IonList, IonSegment, IonSegmentButton, IonInfiniteScroll, IonInfiniteScrollContent } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { InventarioService } from '../services/InventarioService';
import AppBar from '../components/AppBar';
import type { ItemDetalhado, LoteMaterial } from '../models/types';

const InventarioEntradaSaidaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const [item, setItem] = useState<ItemDetalhado | null>(null);
  const [tab, setTab] = useState<'entrada' | 'saida' | 'historico'>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loteSel, setLoteSel] = useState('__none__');
  const [lotes, setLotes] = useState<LoteMaterial[]>([]);
  const [solicitante, setSolicitante] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<string>('success');
  const [movs, setMovs] = useState<Record<string, unknown>[]>([]);
  const [movTotal, setMovTotal] = useState(0);
  const [movPagina, setMovPagina] = useState(1);

  useEffect(() => {
    InventarioService.obterItem(id).then(setItem);
    InventarioService.listarLotes(id).then(setLotes);
  }, [id]);

  const carregarMovs = useCallback(async (p: number, reset: boolean) => {
    const result = await InventarioService.listarMovimentacoes(id, p);
    if (reset) setMovs(result.movimentacoes);
    else setMovs((prev) => [...prev, ...result.movimentacoes]);
    setMovTotal(result.total);
    setMovPagina(p);
  }, [id]);

  useEffect(() => { carregarMovs(1, true); }, [tab]);

  const handleInfinite = async (ev: CustomEvent<void>) => {
    await carregarMovs(movPagina + 1, false);
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  const handleAction = async () => {
    if (!usuario || !quantidade) return;
    setSaving(true);
    try {
      if (tab === 'entrada') {
        await InventarioService.registrarEntrada({ idItem: id, quantidade: Number(quantidade), idLote: loteSel === '__none__' ? undefined : loteSel }, usuario.userId);
        setToastColor('success'); setToastMsg('Entrada registrada.');
      } else {
        const obs = solicitante.trim() ? `Solicitante: ${solicitante.trim()}. ` : '';
        await InventarioService.registrarSaida({ idItem: id, quantidade: Number(quantidade), motivo: motivo || 'Uso em ensaio', idLote: loteSel === '__none__' ? undefined : loteSel, observacao: obs || undefined }, usuario.userId);
        setToastColor('success'); setToastMsg('Saida registrada.');
      }
      setShowToast(true);
      setQuantidade('');
      setMotivo('');
      setSolicitante('');
      carregarMovs(1, true);
    } catch (err: unknown) { setToastColor('danger'); setToastMsg((err as Error).message || 'Erro ao registrar.'); setShowToast(true); }
    setSaving(false);
  };

  return (
    <IonPage>
      <AppBar title={item ? `Movimentacoes: ${item.nome}` : 'Movimentacoes'} />
      <IonContent>
        <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as typeof tab)} style={{ margin: 8 }}>
          <IonSegmentButton value="entrada"><IonLabel>Entrada</IonLabel></IonSegmentButton>
          <IonSegmentButton value="saida"><IonLabel>Saida</IonLabel></IonSegmentButton>
          <IonSegmentButton value="historico"><IonLabel>Historico</IonLabel></IonSegmentButton>
        </IonSegment>

        {tab !== 'historico' ? (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <IonItem>
              <IonLabel position="stacked">Quantidade *</IonLabel>
              <IonInput type="number" value={quantidade} onIonInput={(e) => setQuantidade(e.detail.value || '')} />
            </IonItem>
            {tab === 'saida' && (
              <>
                <IonItem>
                  <IonLabel position="stacked">Motivo *</IonLabel>
                  <IonInput value={motivo} onIonInput={(e) => setMotivo(e.detail.value || '')} placeholder="Ex: Consumo em ensaio" />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Solicitante (opcional)</IonLabel>
                  <IonInput value={solicitante} onIonInput={(e) => setSolicitante(e.detail.value || '')} />
                </IonItem>
              </>
            )}
            {lotes.length > 0 && (
              <IonItem>
                <IonLabel position="stacked">Lote (opcional)</IonLabel>
                <IonSelect value={loteSel} onIonChange={(e) => setLoteSel(e.detail.value)}>
                  <IonSelectOption value="__none__">Nenhum</IonSelectOption>
                  {lotes.map((l) => <IonSelectOption key={l.id} value={l.id}>Lote {l.numero_lote} ({l.quantidade_atual})</IonSelectOption>)}
                </IonSelect>
              </IonItem>
            )}
            <IonButton expand="block" onClick={handleAction} disabled={!quantidade || (tab === 'saida' && !motivo) || saving}>
              {saving ? <IonSpinner /> : tab === 'entrada' ? 'Registrar Entrada' : 'Registrar Saida'}
            </IonButton>
          </div>
        ) : (
          <IonList>
            {movs.map((m: Record<string, unknown>, i: number) => (
              <IonItem key={i}>
                <IonLabel>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {m.tipo === 'entrada' ? '\u25B2 Entrada' : '\u25BC Saida'} — {String(m.quantidade)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ion-color-medium)' }}>
                    {new Date(m.data_movimentacao as string).toLocaleDateString('pt-BR')}
                    {m.motivo ? ` — ${m.motivo}` : ''}
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
        {tab === 'historico' && movs.length < movTotal && (
          <IonInfiniteScroll onIonInfinite={handleInfinite} threshold="200px">
            <IonInfiniteScrollContent loadingText="Carregando..." />
          </IonInfiniteScroll>
        )}

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default InventarioEntradaSaidaPage;