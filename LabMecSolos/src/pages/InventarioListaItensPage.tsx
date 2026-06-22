import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage, IonContent, IonSearchbar, IonCard, IonCardContent,
  IonIcon, IonFab, IonFabButton, IonInfiniteScroll, IonInfiniteScrollContent,
  IonChip, IonActionSheet, IonSpinner, IonButton, IonToast,
} from '@ionic/react';
import { add, cubeOutline, eyeOffOutline, scanOutline, chevronForwardOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { useAuth } from '../contexts/AuthContext';
import { InventarioService } from '../services/InventarioService';
import { getDatabase } from '../services/DatabaseService';
import { LogService } from '../services/LogService';
import AppBar from '../components/AppBar';
import TipoBadge from '../components/TipoBadge';
import EmptyState from '../components/EmptyState';
import EstoqueIndicator from '../components/EstoqueIndicator';
import EstadoBadge from '../components/EstadoBadge';
import type { ItemResumo, FiltrosItem, TipoItem, EstadoEquipamento, CategoriaItem } from '../models/types';

const TIPO_OPCOES: { label: string; value: TipoItem | undefined }[] = [
  { label: 'Todos', value: undefined }, { label: 'Material', value: 'material' },
  { label: 'Utensilio', value: 'utensilio' }, { label: 'Equipamento', value: 'equipamento' },
];

const STATUS_OPCOES: { label: string; value: string | undefined }[] = [
  { label: 'Ativos', value: 'ativo' }, { label: 'Inativos', value: 'inativo' },
  { label: 'Todos', value: undefined },
];

const ESTADO_OPCOES: { label: string; value: EstadoEquipamento | undefined }[] = [
  { label: 'Todos', value: undefined }, { label: 'Disponivel', value: 'disponivel' },
  { label: 'Em Manutencao', value: 'em_manutencao' }, { label: 'Inoperante', value: 'inoperante' },
  { label: 'Calibracao Vencida', value: 'calibracao_vencida' },
];

const InventarioListaItensPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { usuario } = useAuth();
  const isColaborador = usuario?.permissao === 'colaborador' || usuario?.permissao === 'chefia';

  const initialFilters = (): FiltrosItem => {
    const params = new URLSearchParams(location.search);
    const tipoParam = params.get('tipo') as TipoItem | null;
    const filtro: FiltrosItem = { status: 'ativo' };
    if (tipoParam) filtro.tipo = tipoParam;
    return filtro;
  };

  const [itens, setItens] = useState<ItemResumo[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<FiltrosItem>(initialFilters());
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [actionSheet, setActionSheet] = useState('');
  const [scannando, setScannando] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    InventarioService.listarCategorias(true).then(setCategorias);
  }, []);

  const carregar = useCallback(async (p: number, reset: boolean) => {
    setLoading(true);
    try {
      const result = await InventarioService.listarItens({ ...filtros, busca }, p);
      if (reset) setItens(result.itens);
      else setItens((prev) => [...prev, ...result.itens]);
      setTotal(result.total);
      setPagina(p);
    } catch { /* */ }
    setLoading(false);
  }, [filtros, busca]);

  useEffect(() => { carregar(1, true); }, [filtros, busca]);

  const handleInfinite = async (ev: CustomEvent<void>) => {
    await carregar(pagina + 1, false);
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  const quantidadeAcima = (row: ItemResumo) => {
    return (row as unknown as Record<string, unknown>).quantidade_atual as number | undefined;
  };

  const pontoPedidoAcima = (row: ItemResumo) => {
    return (row as unknown as Record<string, unknown>).ponto_pedido as number | null | undefined;
  };

  const handleScan = async () => {
    const isNative = Capacitor.getPlatform() !== 'web';

    if (!isNative) {
      setToastMsg('A leitura por camera esta disponivel apenas no aplicativo Android.');
      return;
    }

    try {
      setScannando(true);

      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
        scanInstructions: 'Aponte a camera para o QR Code',
      });
      setScannando(false);

      const scannedValue = result.ScanResult || '';
      if (!scannedValue) {
        setToastMsg('Nenhum codigo detectado.');
        return;
      }

      const db = await getDatabase();

      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scannedValue)) {
        const r = await db.query('SELECT id FROM itens WHERE id = ?', [scannedValue]);
        if (r.values && r.values.length > 0) {
          const idItem = r.values[0].id as string;
          if (usuario?.userId) {
            await LogService.registrar('estoque', 'qr_code_lido', usuario.userId, null, null, null, { id_equipamento: idItem });
          }
          history.push(`/app/inventario/item/${idItem}`);
          return;
        }
      } else {
        const r = await db.query('SELECT id FROM itens WHERE codigo = ?', [scannedValue]);
        if (r.values && r.values.length > 0) {
          const idItem = r.values[0].id as string;
          if (usuario?.userId) {
            await LogService.registrar('estoque', 'qr_code_lido', usuario.userId, null, null, null, { id_equipamento: idItem });
          }
          history.push(`/app/inventario/item/${idItem}`);
          return;
        }
      }

      setToastMsg('Equipamento nao encontrado.');
    } catch (e: unknown) {
      setScannando(false);
      const err = e as { message?: string };
      if (err?.message?.includes('cancel') || err?.message?.includes('Cancel')) {
        return;
      }
      setToastMsg('Erro ao escanear. Tente novamente.');
    }
  };

  return (
    <IonPage>
      <AppBar title="Itens" />
      <IonContent>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px' }}>
          <IonSearchbar
            value={busca}
            onIonInput={(e) => setBusca(e.detail.value || '')}
            placeholder="Buscar por nome ou codigo"
            debounce={300}
            style={{ padding: 0, flex: 1 }}
          />
          <IonButton
            fill="clear"
            onClick={handleScan}
            disabled={scannando}
            style={{ height: 44, width: 44, margin: 0, flexShrink: 0 }}
          >
            <IonIcon icon={scanOutline} slot="icon-only" style={{ fontSize: 22 }} />
          </IonButton>
        </div>

        <div style={{ display: 'flex', gap: 6, padding: '0 16px 8px', overflowX: 'auto' }}>
          <IonChip onClick={() => setActionSheet('tipo')} color={filtros.tipo ? 'primary' : 'medium'} outline={!filtros.tipo} style={{ flexShrink: 0, fontSize: 12 }}>
            {filtros.tipo ? TIPO_OPCOES.find((o) => o.value === filtros.tipo)?.label : 'Tipo'}
          </IonChip>
          {isColaborador && (
            <IonChip onClick={() => setActionSheet('status')} color={filtros.status !== 'ativo' ? 'primary' : 'medium'} outline={filtros.status === 'ativo'} style={{ flexShrink: 0, fontSize: 12 }}>
              {filtros.status === 'ativo' ? 'Ativos' : filtros.status === 'inativo' ? 'Inativos' : 'Todos'}
            </IonChip>
          )}
          <IonChip onClick={() => setActionSheet('categoria')} color={filtros.idCategoria ? 'primary' : 'medium'} outline={!filtros.idCategoria} style={{ flexShrink: 0, fontSize: 12 }}>
            {filtros.idCategoria ? categorias.find((c) => c.id === filtros.idCategoria)?.nome : 'Categoria'}
          </IonChip>
          {filtros.tipo === 'equipamento' && (
            <IonChip onClick={() => setActionSheet('estado')} color={filtros.estado ? 'primary' : 'medium'} outline={!filtros.estado} style={{ flexShrink: 0, fontSize: 12 }}>
              {filtros.estado ? ESTADO_OPCOES.find((o) => o.value === filtros.estado)?.label : 'Estado'}
            </IonChip>
          )}
          {filtros.tipo !== 'equipamento' && (
            <IonChip onClick={() => setFiltros((prev) => ({ ...prev, estoqueBaixo: !prev.estoqueBaixo }))} color={filtros.estoqueBaixo ? 'warning' : 'medium'} outline={!filtros.estoqueBaixo} style={{ flexShrink: 0, fontSize: 12 }}>
              Estoque Baixo
            </IonChip>
          )}
        </div>

        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', padding: '0 16px 8px' }}>
          {total} itens encontrados
        </div>

        {loading && itens.length === 0 ? (
          <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : itens.length === 0 ? (
          <EmptyState icon={cubeOutline} title="Nenhum item encontrado." />
        ) : (
          <>
            {itens.map((item) => {
              const qtd = quantidadeAcima(item);
              const pp = pontoPedidoAcima(item);
              const unidade = (item as unknown as Record<string, unknown>).unidade_medida as string | undefined;
              const estado = (item as unknown as Record<string, unknown>).estado as string | undefined;

              return (
                <IonCard key={item.id} style={{ borderRadius: 12, margin: '8px 16px' }} onClick={() => history.push(`/app/inventario/item/${item.id}`)}>
                  <IonCardContent>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: item.status === 'inativo' ? 'var(--ion-color-medium)' : 'var(--ion-color-dark)' }}>
                            {item.nome}
                            {item.status === 'inativo' && <IonIcon icon={eyeOffOutline} style={{ fontSize: 14, marginLeft: 6, verticalAlign: 'middle' }} />}
                          </span>
                          <TipoBadge tipo={item.tipo} />
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginBottom: 2 }}>
                          {item.codigo}
                        </div>
                        {item.tipo === 'equipamento' && estado ? (
                          <EstadoBadge estado={estado as EstadoEquipamento} />
                        ) : qtd !== undefined && unidade ? (
                          <EstoqueIndicator quantidade={qtd} pontoPedido={pp || null} unidade={unidade} />
                        ) : null}
                      </div>
                      <IonIcon icon={chevronForwardOutline} color="medium" style={{ fontSize: 18, marginTop: 4 }} />
                    </div>
                  </IonCardContent>
                </IonCard>
              );
            })}
          </>
        )}

        {itens.length < total && (
          <IonInfiniteScroll onIonInfinite={handleInfinite} threshold="200px">
            <IonInfiniteScrollContent loadingText="Carregando..." />
          </IonInfiniteScroll>
        )}

        {isColaborador && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => history.push('/app/inventario/novo-item')}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}

        <IonActionSheet isOpen={actionSheet === 'tipo'} onDidDismiss={() => setActionSheet('')} header="Tipo"
          buttons={TIPO_OPCOES.map((o) => ({ text: o.label, handler: () => setFiltros((prev) => ({ ...prev, tipo: o.value, estado: o.value !== 'equipamento' ? undefined : prev.estado })) }))} />
        <IonActionSheet isOpen={actionSheet === 'status'} onDidDismiss={() => setActionSheet('')} header="Status"
          buttons={STATUS_OPCOES.map((o) => ({ text: o.label, handler: () => setFiltros((prev) => ({ ...prev, status: o.value as FiltrosItem['status'] })) }))} />
        <IonActionSheet isOpen={actionSheet === 'categoria'} onDidDismiss={() => setActionSheet('')} header="Categoria"
          buttons={[{ text: 'Todas', handler: () => setFiltros((prev) => ({ ...prev, idCategoria: undefined })) },
          ...categorias.map((c) => ({ text: c.nome, handler: () => setFiltros((prev) => ({ ...prev, idCategoria: c.id })) }))]} />
        <IonActionSheet isOpen={actionSheet === 'estado'} onDidDismiss={() => setActionSheet('')} header="Estado"
          buttons={ESTADO_OPCOES.map((o) => ({ text: o.label, handler: () => setFiltros((prev) => ({ ...prev, estado: o.value })) }))} />

        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          duration={2500}
          onDidDismiss={() => setToastMsg('')}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default InventarioListaItensPage;
