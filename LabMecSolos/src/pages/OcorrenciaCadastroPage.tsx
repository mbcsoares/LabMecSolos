import React, { useState } from 'react';
import {
  IonPage, IonContent, IonItem, IonLabel, IonSelect, IonSelectOption,
  IonInput, IonTextarea, IonButton, IonToast, IonSpinner, IonSearchbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { InventarioService } from '../services/InventarioService';
import { queryRows } from '../services/DatabaseService';
import AppBar from '../components/AppBar';
import type { TipoOcorrencia, ItemResumo } from '../models/types';

const TIPOS: { label: string; value: TipoOcorrencia }[] = [
  { label: 'Quebra', value: 'quebra' },
  { label: 'Estoque Insuficiente', value: 'estoque_insuficiente' },
  { label: 'Mal Funcionamento', value: 'mal_funcionamento' },
  { label: 'Validade Expirada', value: 'validade_expirada' },
  { label: 'Outro', value: 'outro' },
];

const OcorrenciaCadastroPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const [tipo, setTipo] = useState<TipoOcorrencia>('outro');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [idItem, setIdItem] = useState<string | undefined>();
  const [buscaItem, setBuscaItem] = useState('');
  const [itensBusca, setItensBusca] = useState<ItemResumo[]>([]);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleBuscaItem = async (termo: string) => {
    setBuscaItem(termo);
    if (termo.length < 2) { setItensBusca([]); return; }
    const result = await queryRows<ItemResumo>(
      "SELECT * FROM itens WHERE status = 'ativo' AND (nome LIKE ? OR codigo LIKE ?) LIMIT 10",
      [`%${termo}%`, `%${termo}%`]
    );
    setItensBusca(result);
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !descricao.trim() || !usuario) return;
    setSaving(true);

    try {
      const result = await InventarioService.criarOcorrencia(
        { tipo, idItem, titulo, descricao },
        usuario.userId
      );
      setShowToast(true);
      setTimeout(() => history.push(`/app/inventario/ocorrencia/${result.id}`), 500);
    } catch {
      setSaving(false);
    }
  };

  const valido = titulo.trim() && descricao.trim();

  return (
    <IonPage>
      <AppBar title="Nova Ocorrencia" />
      <IonContent>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <IonItem>
            <IonLabel position="stacked">Tipo *</IonLabel>
            <IonSelect value={tipo} onIonChange={(e) => setTipo(e.detail.value)}>
              {TIPOS.map((t) => (
                <IonSelectOption key={t.value} value={t.value}>{t.label}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <div>
            <IonSearchbar
              value={buscaItem}
              onIonInput={(e) => handleBuscaItem(e.detail.value || '')}
              placeholder="Selecione um item (opcional)"
              debounce={300}
              style={{ padding: 0 }}
            />
            {itensBusca.length > 0 && (
              <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #E0E0E0', borderRadius: 4 }}>
                {itensBusca.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => { setIdItem(item.id); setBuscaItem(`${item.nome} (${item.codigo})`); setItensBusca([]); }}
                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F0F0F0', fontSize: 13 }}
                  >
                    {item.nome} ({item.codigo})
                  </div>
                ))}
              </div>
            )}
          </div>

          <IonItem>
            <IonLabel position="stacked">Titulo *</IonLabel>
            <IonInput
              value={titulo}
              onIonInput={(e) => setTitulo(e.detail.value || '')}
              placeholder="Descreva o problema em poucas palavras"
              maxlength={100}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Descricao *</IonLabel>
            <IonTextarea
              value={descricao}
              onIonInput={(e) => setDescricao(e.detail.value || '')}
              placeholder="Descreva detalhadamente o ocorrido..."
              rows={6}
              style={{ minHeight: 120 }}
            />
          </IonItem>

          <IonButton expand="block" onClick={handleSubmit} disabled={!valido || saving}>
            {saving ? <IonSpinner name="crescent" /> : 'Registrar Ocorrencia'}
          </IonButton>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Ocorrencia registrada com sucesso."
          duration={1500}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default OcorrenciaCadastroPage;
