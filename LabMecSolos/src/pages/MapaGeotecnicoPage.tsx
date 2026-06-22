import React, { useState, useEffect, useCallback } from 'react';
import { IonPage, IonContent, IonSegment, IonSegmentButton, IonLabel, IonItem, IonList, IonSelect, IonSelectOption, IonChip, IonButton, IonSpinner, IonToast, IonSearchbar, IonAlert } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { downloadOutline, funnelOutline } from 'ionicons/icons';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AppBar from '../components/AppBar';
import AdminGuard from '../components/AdminGuard';
import { GeotecnicoService } from '../services/GeotecnicoService';
import { ExportacaoGeotecnicoService } from '../services/ExportacaoGeotecnicoService';
import { useAuth } from '../contexts/AuthContext';
import type { VistaPontoGeotecnico, FiltrosMapa } from '../models/types';

const TIPOS_ENSAIO = ['teor_umidade', 'granulometria', 'compactacao', 'limite_liquidez', 'limite_plasticidade', 'cisalhamento_direto', 'adensamento', 'triaxial'];

const getMarkerColor = (p: VistaPontoGeotecnico) => {
  if (p.tipo_amostra === 'deformada') return p.total_ensaios_concluidos > 0 ? '#3B82F6' : '#F97316';
  return p.total_ensaios_concluidos > 0 ? '#22C55E' : '#EAB308';
};

function criarDivIcon(cor: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color:${cor};width:20px;height:20px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}

function parsearCoordenadas(gps: string): [number, number] | null {
  if (!gps || !gps.includes(',')) return null;
  const [lat, lng] = gps.split(',').map(Number);
  if (isNaN(lat) || isNaN(lng)) return null;
  return [lat, lng];
}

const CENTRO_PADRAO: [number, number] = [-5.7950, -35.2083];

const MapaGeotecnicoPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const [tab, setTab] = useState('mapa');
  const [pontos, setPontos] = useState<VistaPontoGeotecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipoEnsaio, setFiltroTipoEnsaio] = useState('');
  const [filtroSucs, setFiltroSucs] = useState('');
  const [filtroContexto, setFiltroContexto] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [opcoesSucs, setOpcoesSucs] = useState<string[]>([]);
  const [opcoesContexto, setOpcoesContexto] = useState<string[]>([]);
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('data_coleta');
  const [pagina, setPagina] = useState(1);
  const ITENS_POR_PAGINA = 20;
  const [showPopup, setShowPopup] = useState(false);
  const [pontoSelecionado, setPontoSelecionado] = useState<VistaPontoGeotecnico | null>(null);
  const [detalhesPonto, setDetalhesPonto] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const buildFiltros = useCallback((): FiltrosMapa => ({
    tipoEnsaio: filtroTipoEnsaio || undefined,
    classificacaoSucs: filtroSucs || undefined,
    contexto: filtroContexto || undefined,
    dataInicio: filtroDataInicio || undefined,
    dataFim: filtroDataFim || undefined,
  }), [filtroTipoEnsaio, filtroSucs, filtroContexto, filtroDataInicio, filtroDataFim]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const pts = await GeotecnicoService.obterPontos(buildFiltros());
      setPontos(pts);
      setOpcoesSucs(await GeotecnicoService.obterValoresUnicos('classificacao_sucs'));
      setOpcoesContexto(await GeotecnicoService.obterValoresUnicos('contexto_pesquisa'));
    } catch {}
    setLoading(false);
  }, [buildFiltros]);

  useEffect(() => { carregar(); }, [carregar]);

  const handlePontoClick = async (ponto: VistaPontoGeotecnico) => {
    setPontoSelecionado(ponto);
    try {
      setDetalhesPonto(await GeotecnicoService.obterDetalhesPonto(ponto.id_amostra));
    } catch { setDetalhesPonto(null); }
    setShowPopup(true);
  };

  const handleExportGeoJSON = async () => {
    if (!usuario) return;
    try {
      await ExportacaoGeotecnicoService.salvarGeoJSON(await GeotecnicoService.exportarGeoJSON(buildFiltros(), usuario.userId));
      setToastMsg('GeoJSON exportado.'); setShowToast(true);
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
  };

  const handleExportCSV = async () => {
    if (!usuario) return;
    try {
      await ExportacaoGeotecnicoService.salvarCSV(await GeotecnicoService.exportarCSV(buildFiltros(), usuario.userId));
      setToastMsg('CSV exportado.'); setShowToast(true);
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
  };

  const limparFiltros = () => {
    setFiltroTipoEnsaio(''); setFiltroSucs(''); setFiltroContexto('');
    setFiltroDataInicio(''); setFiltroDataFim('');
  };

  const hasFiltros = filtroTipoEnsaio || filtroSucs || filtroContexto || filtroDataInicio || filtroDataFim;

  const dadosFiltrados = pontos.filter((p) => {
    if (!busca) return true;
    const t = busca.toLowerCase();
    return (p.numero_identificacao_campo.toLowerCase().includes(t) || p.identificacao_plano.toLowerCase().includes(t) || p.titulo_pesquisa.toLowerCase().includes(t) || p.nome_responsavel.toLowerCase().includes(t));
  });

  const dadosOrdenados = [...dadosFiltrados].sort((a, b) => {
    if (ordenacao === 'data_coleta') return b.data_coleta.localeCompare(a.data_coleta);
    if (ordenacao === 'sucs') return (a.classificacao_sucs || '').localeCompare(b.classificacao_sucs || '');
    return a.id_amostra.localeCompare(b.id_amostra);
  });

  const totalPaginas = Math.ceil(dadosOrdenados.length / ITENS_POR_PAGINA);
  const dadosPaginados = dadosOrdenados.slice((pagina - 1) * ITENS_POR_PAGINA, pagina * ITENS_POR_PAGINA);

  return (
    <IonPage>
      <AppBar title="Estudo Unificado de Solos" />
      <IonContent>
        <div style={{ display: 'flex', gap: 4, padding: '4px 16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <IonSelect value={filtroTipoEnsaio} placeholder="Tipo de Ensaio" onIonChange={(e) => setFiltroTipoEnsaio(e.detail.value)} interface="popover" style={{ flex: '1 1 140px', maxWidth: 180 }}>
            <IonSelectOption value="">Todos</IonSelectOption>
            {TIPOS_ENSAIO.map((t) => <IonSelectOption key={t} value={t}>{t.replace(/_/g, ' ')}</IonSelectOption>)}
          </IonSelect>
          <IonSelect value={filtroSucs} placeholder="SUCS" onIonChange={(e) => setFiltroSucs(e.detail.value)} interface="popover" style={{ flex: '1 1 100px', maxWidth: 140 }}>
            <IonSelectOption value="">Todos</IonSelectOption>
            {opcoesSucs.map((s) => <IonSelectOption key={s} value={s}>{s}</IonSelectOption>)}
          </IonSelect>
          <IonSelect value={filtroContexto} placeholder="Contexto" onIonChange={(e) => setFiltroContexto(e.detail.value)} interface="popover" style={{ flex: '1 1 120px', maxWidth: 160 }}>
            <IonSelectOption value="">Todos</IonSelectOption>
            {opcoesContexto.map((c) => <IonSelectOption key={c} value={c}>{c}</IonSelectOption>)}
          </IonSelect>
          {hasFiltros && (
            <IonChip color="medium" outline onClick={limparFiltros} style={{ fontSize: 11, height: 28 }}>
              Limpar
            </IonChip>
          )}
        </div>

        <IonSegment value={tab} onIonChange={(e) => setTab(e.detail.value as string)}>
          <IonSegmentButton value="mapa"><IonLabel>Mapa ({pontos.length})</IonLabel></IonSegmentButton>
          <IonSegmentButton value="dados"><IonLabel>Dados</IonLabel></IonSegmentButton>
        </IonSegment>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : (
          <>
            {tab === 'mapa' && (
              <div style={{ height: '55vh', width: '100%', position: 'relative' }}>
                <MapContainer center={CENTRO_PADRAO} zoom={7} maxZoom={60} minZoom={3} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" />
                  {pontos.map((p) => {
                    const coords = parsearCoordenadas(p.coordenadas_gps);
                    if (!coords) return null;
                    return (
                      <Marker key={p.id_amostra} position={coords} icon={criarDivIcon(getMarkerColor(p))}>
                        <Popup>
                          <div style={{ fontSize: 12, lineHeight: 1.5, minWidth: 220 }}>
                            <strong>{p.numero_identificacao_campo}</strong> — {p.identificacao_plano}<br />
                            Tipo: {p.tipo_amostra} · Status: {p.status_amostra}<br />
                            Coleta: {new Date(p.data_coleta).toLocaleDateString('pt-BR')}<br />
                            Coord: {p.coordenadas_gps}<br />
                            SUCS: {p.classificacao_sucs || '—'} · w: {p.teor_umidade ? `${p.teor_umidade.toFixed(1)}%` : '—'}<br />
                            Ensaios: {p.total_ensaios_concluidos}<br />
                            Metadados: {p.status_preenchimento || 'não preenchidos'}<br />
                            Pesquisa: {p.titulo_pesquisa}<br />
                            <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                              <button onClick={() => history.push(`/app/geotecnico/metadados/${p.id_amostra}`)} style={{ padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>Editar Metadados</button>
                              <button onClick={() => history.push(`/app/ensaios/pesquisa/${p.id_pesquisa}`)} style={{ padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>Ver Pesquisa</button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
                <div style={{
                  position: 'absolute', bottom: 8, right: 8, zIndex: 1000,
                  backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 8,
                  padding: '8px 12px', fontSize: 11, lineHeight: 1.6,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)', minWidth: 190,
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 12 }}>Amostras Brutas</div>
                  <div><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3B82F6', marginRight: 6 }} /> Deformada — Ensaiada</div>
                  <div><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#F97316', marginRight: 6 }} /> Deformada — Não Ensaiada</div>
                  <div><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22C55E', marginRight: 6 }} /> Indeformada — Ensaiada</div>
                  <div><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EAB308', marginRight: 6 }} /> Indeformada — Não Ensaiada</div>
                </div>
              </div>
            )}

            {tab === 'dados' && (
              <div style={{ padding: 8 }}>
                <IonSearchbar value={busca} onIonInput={(e) => { setBusca(e.detail.value || ''); setPagina(1); }} debounce={300} placeholder="Buscar por ID, plano, pesquisa ou responsável" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px' }}>
                  <span style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{dadosFiltrados.length} pontos</span>
                  <IonSelect value={ordenacao} onIonChange={(e) => setOrdenacao(e.detail.value)} interface="popover" style={{ maxWidth: 160 }}>
                    <IonSelectOption value="data_coleta">Data da coleta</IonSelectOption>
                    <IonSelectOption value="sucs">SUCS</IonSelectOption>
                    <IonSelectOption value="id">ID</IonSelectOption>
                  </IonSelect>
                </div>
                <IonList inset>
                  {dadosPaginados.map((p) => (
                    <IonItem key={p.id_amostra} button onClick={() => handlePontoClick(p)} detail>
                      <IonLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getMarkerColor(p) }} />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{p.numero_identificacao_campo}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ion-color-medium)' }}>
                          {new Date(p.data_coleta).toLocaleDateString('pt-BR')} · SUCS: {p.classificacao_sucs || '—'} · w: {p.teor_umidade ? `${p.teor_umidade.toFixed(1)}%` : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--ion-color-medium)' }}>
                          {p.titulo_pesquisa} · <strong>{p.nome_responsavel}</strong>
                        </div>
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>
                {totalPaginas > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 8 }}>
                    <IonButton size="small" fill="outline" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</IonButton>
                    <span style={{ fontSize: 12 }}>Pág. {pagina} de {totalPaginas}</span>
                    <IonButton size="small" fill="outline" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>Próximo</IonButton>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 8, padding: '8px 16px', borderTop: '1px solid var(--app-color-border)' }}>
          <IonButton expand="block" fill="outline" size="small" onClick={handleExportGeoJSON}>GeoJSON</IonButton>
          <IonButton expand="block" fill="outline" size="small" onClick={handleExportCSV}>CSV</IonButton>
        </div>

        <IonAlert isOpen={showPopup} onDidDismiss={() => setShowPopup(false)}
          header={pontoSelecionado?.numero_identificacao_campo || 'Ponto'}
          message={pontoSelecionado ? (
            `Plano: ${pontoSelecionado.identificacao_plano}\nTipo: ${pontoSelecionado.tipo_amostra} · Status: ${pontoSelecionado.status_amostra}\nColeta: ${new Date(pontoSelecionado.data_coleta).toLocaleDateString('pt-BR')}\nCoord: ${pontoSelecionado.coordenadas_gps}\n\nSUCS: ${pontoSelecionado.classificacao_sucs || '—'} · AASHTO: ${pontoSelecionado.classificacao_aashto || '—'}\nCor: ${pontoSelecionado.cor || '—'} · Textura: ${pontoSelecionado.textura || '—'}\nOrigem: ${pontoSelecionado.origem_geologica || '—'}\nMunicípio: ${pontoSelecionado.municipio || '—'}/${pontoSelecionado.uf || '—'}\nw: ${pontoSelecionado.teor_umidade ? pontoSelecionado.teor_umidade.toFixed(1) + '%' : '—'} · Ensaios: ${pontoSelecionado.total_ensaios_concluidos}\n\nMetadados: ${pontoSelecionado.status_preenchimento || 'não preenchidos'}\nCampos: ${detalhesPonto?.metadadosCamposPreenchidos || 0}/11\n\nPesquisa: ${pontoSelecionado.titulo_pesquisa}\nResponsável: ${pontoSelecionado.nome_responsavel}`
          ) : ''}
          buttons={[
            { text: 'Fechar', role: 'cancel' },
            { text: 'Editar Metadados', handler: () => { if (pontoSelecionado) history.push(`/app/geotecnico/metadados/${pontoSelecionado.id_amostra}`); } },
            { text: 'Ver Pesquisa', handler: () => { if (pontoSelecionado) history.push(`/app/ensaios/pesquisa/${pontoSelecionado.id_pesquisa}`); } },
          ]}
        />
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

const MapaGeotecnicoPageWithGuard: React.FC = () => <AdminGuard><MapaGeotecnicoPage /></AdminGuard>;
export default MapaGeotecnicoPageWithGuard;
