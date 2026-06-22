import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonButton, IonToast, IonSpinner, IonActionSheet } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { InventarioService } from '../services/InventarioService';
import AppBar from '../components/AppBar';
import type { CriarItemDTO, CategoriaItem, TipoItem } from '../models/types';

const InventarioItemCadastroPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const isEdit = !!id;

  const [tipo, setTipo] = useState<TipoItem>('material');
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [idCategoria, setIdCategoria] = useState<string | undefined>();
  const [unidadeMedida, setUnidadeMedida] = useState('unidade');
  const [pontoPedido, setPontoPedido] = useState('');
  const [localArmazenamento, setLocalArmazenamento] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [especificacaoTecnica, setEspecificacaoTecnica] = useState('');
  const [frequenciaCalibracaoDias, setFrequenciaCalibracaoDias] = useState('');
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<string>('success');
  const [showUnidade, setShowUnidade] = useState(false);

  useEffect(() => {
    InventarioService.listarCategorias(true).then(setCategorias);
    if (isEdit) {
      InventarioService.obterItem(id!).then((item) => {
        if (item) {
          setTipo(item.tipo);
          setNome(item.nome);
          setCodigo(item.codigo);
          setIdCategoria(item.id_categoria || '__none__');
          const d = item as unknown as Record<string, unknown>;
          setUnidadeMedida(d.unidade_medida as string || 'unidade');
          setPontoPedido(d.ponto_pedido ? String(d.ponto_pedido) : '');
          setLocalArmazenamento(d.local_armazenamento as string || '');
          setNumeroSerie(d.numero_serie as string || '');
          setMarca(d.marca as string || '');
          setModelo(d.modelo as string || '');
          setEspecificacaoTecnica(d.especificacao_tecnica as string || '');
          setFrequenciaCalibracaoDias(d.frequencia_calibracao_dias ? String(d.frequencia_calibracao_dias) : '');
        }
      });
    }
  }, [id]);

  const handleSave = async () => {
    if (!nome.trim() || !codigo.trim() || !usuario) return;
    setSaving(true);
    try {
      const dados: CriarItemDTO = {
        tipo, nome, codigo, idCategoria: idCategoria === '__none__' ? undefined : idCategoria,
        unidadeMedida: tipo !== 'equipamento' ? unidadeMedida : undefined,
        pontoPedido: pontoPedido ? Number(pontoPedido) : undefined,
        localArmazenamento: tipo === 'utensilio' ? localArmazenamento : undefined,
        numeroSerie: tipo === 'equipamento' ? numeroSerie : undefined,
        marca: tipo === 'equipamento' ? marca : undefined,
        modelo: tipo === 'equipamento' ? modelo : undefined,
        especificacaoTecnica: tipo === 'equipamento' ? especificacaoTecnica : undefined,
        frequenciaCalibracaoDias: tipo === 'equipamento' && frequenciaCalibracaoDias ? Number(frequenciaCalibracaoDias) : undefined,
      };

      if (isEdit) {
        await InventarioService.editarItem(id!, dados, usuario.userId);
        setToastColor('success'); setToastMsg('Item editado.');
      } else {
        const novo = await InventarioService.criarItem(dados, usuario.userId);
        setToastColor('success'); setToastMsg('Item criado.');
        setTimeout(() => history.replace(`/app/inventario/item/${novo.id}`), 800);
        return;
      }
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch { /* */ }
    setSaving(false);
  };

  return (
    <IonPage>
      <AppBar title={isEdit ? 'Editar Item' : 'Cadastrar Item'} />
      <IonContent>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <IonItem>
            <IonLabel position="stacked">Tipo</IonLabel>
            <IonSelect value={tipo} onIonChange={(e) => setTipo(e.detail.value)} disabled={isEdit}>
              <IonSelectOption value="material">Material</IonSelectOption>
              <IonSelectOption value="utensilio">Utensilio</IonSelectOption>
              <IonSelectOption value="equipamento">Equipamento</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Nome *</IonLabel>
            <IonInput value={nome} onIonInput={(e) => setNome(e.detail.value || '')} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Codigo *</IonLabel>
            <IonInput value={codigo} onIonInput={(e) => setCodigo(e.detail.value || '')} disabled={isEdit} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Categoria</IonLabel>
            <IonSelect value={idCategoria} onIonChange={(e) => setIdCategoria(e.detail.value === '__none__' ? undefined : e.detail.value)}>
              <IonSelectOption value="__none__">Nenhuma</IonSelectOption>
              {categorias.map((c) => <IonSelectOption key={c.id} value={c.id}>{c.nome}</IonSelectOption>)}
            </IonSelect>
          </IonItem>

          {(tipo === 'material' || tipo === 'utensilio') && (
            <>
              <IonItem button onClick={() => setShowUnidade(true)}>
                <IonLabel position="stacked">Unidade: {unidadeMedida}</IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Ponto de Pedido</IonLabel>
                <IonInput type="number" value={pontoPedido} onIonInput={(e) => setPontoPedido(e.detail.value || '')} placeholder="Opcional" />
              </IonItem>
              {tipo === 'utensilio' && (
                <IonItem>
                  <IonLabel position="stacked">Local de Armazenamento</IonLabel>
                  <IonInput value={localArmazenamento} onIonInput={(e) => setLocalArmazenamento(e.detail.value || '')} placeholder="Opcional" />
                </IonItem>
              )}
            </>
          )}

          {tipo === 'equipamento' && (
            <>
              <IonItem><IonLabel position="stacked">Numero de Serie</IonLabel><IonInput value={numeroSerie} onIonInput={(e) => setNumeroSerie(e.detail.value || '')} /></IonItem>
              <IonItem><IonLabel position="stacked">Marca</IonLabel><IonInput value={marca} onIonInput={(e) => setMarca(e.detail.value || '')} /></IonItem>
              <IonItem><IonLabel position="stacked">Modelo</IonLabel><IonInput value={modelo} onIonInput={(e) => setModelo(e.detail.value || '')} /></IonItem>
              <IonItem><IonLabel position="stacked">Especificacao Tecnica</IonLabel><IonInput value={especificacaoTecnica} onIonInput={(e) => setEspecificacaoTecnica(e.detail.value || '')} /></IonItem>
              <IonItem><IonLabel position="stacked">Freq. Calibracao (dias)</IonLabel><IonInput type="number" value={frequenciaCalibracaoDias} onIonInput={(e) => setFrequenciaCalibracaoDias(e.detail.value || '')} placeholder="Opcional" /></IonItem>
            </>
          )}

          <IonButton expand="block" onClick={handleSave} disabled={!nome.trim() || !codigo.trim() || saving}>
            {saving ? <IonSpinner /> : isEdit ? 'Salvar Alteracoes' : 'Cadastrar Item'}
          </IonButton>
        </div>

        <IonActionSheet isOpen={showUnidade} onDidDismiss={() => setShowUnidade(false)} header="Unidade de Medida"
          buttons={tipo === 'material' ? ['kg','g','tonelada','L','mL','unidade','m','cm','mm','m²','m³','pacote','rolo','folha'].map((u) => ({ text: u, handler: () => setUnidadeMedida(u) }))
            : ['unidade','jogo','par','conjunto','caixa'].map((u) => ({ text: u, handler: () => setUnidadeMedida(u) }))} />
        <IonToast isOpen={showToast} onDidDismiss={() => { setShowToast(false); history.goBack(); }} message={toastMsg} duration={1500} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default InventarioItemCadastroPage;