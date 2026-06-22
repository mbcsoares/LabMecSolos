import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonCard, IonCardContent, IonLabel, IonIcon, IonButton, IonInput, IonToast, IonSpinner, IonAlert, IonSegment, IonSegmentButton } from '@ionic/react';
import { trashOutline, add, chevronForwardOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { InventarioService } from '../services/InventarioService';
import { executeSql } from '../services/DatabaseService';
import AppBar from '../components/AppBar';
import type { CategoriaItem } from '../models/types';

const CategoriasPage: React.FC = () => {
  const { usuario } = useAuth();
  const isColaborador = usuario?.permissao === 'colaborador' || usuario?.permissao === 'chefia';
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<string>('success');
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [apenasAtivas, setApenasAtivas] = useState(true);

  const carregar = async () => {
    setLoading(true);
    setCategorias(await InventarioService.listarCategorias(apenasAtivas));
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [apenasAtivas]);

  const resetForm = () => { setNome(''); setDescricao(''); setEditId(null); setShowForm(false); };

  const handleSave = async () => {
    if (!nome.trim() || !usuario) return;
    setSaving(true);
    try {
      if (editId) {
        await InventarioService.editarCategoria(editId, { nome, descricao }, usuario.userId);
        setToastColor('success'); setToastMsg('Categoria editada.');
      } else {
        await InventarioService.criarCategoria({ nome, descricao }, usuario.userId);
        setToastColor('success'); setToastMsg('Categoria criada.');
      }
      setShowToast(true);
      resetForm();
      carregar();
    } catch { /* */ }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!showDelete || !usuario) return;
    await InventarioService.desativarCategoria(showDelete, usuario.userId);
    setShowDelete(null);
    setToastColor('success'); setToastMsg('Categoria desativada.');
    setShowToast(true);
    carregar();
  };

  const handleReativar = async (id: string) => {
    if (!usuario) return;
    await executeSql("UPDATE categorias_item SET status = 'ativa', data_atualizacao = ? WHERE id = ?", [new Date().toISOString(), id]);
    setToastColor('success'); setToastMsg('Categoria reativada.');
    setShowToast(true);
    carregar();
  };

  return (
    <IonPage>
      <AppBar title="Categorias" />
      <IonContent>
        <IonSegment value={apenasAtivas ? 'ativas' : 'todas'} onIonChange={(e) => setApenasAtivas(e.detail.value === 'ativas')} style={{ margin: 8 }}>
          <IonSegmentButton value="ativas"><IonLabel>Ativas</IonLabel></IonSegmentButton>
          <IonSegmentButton value="todas"><IonLabel>Todas</IonLabel></IonSegmentButton>
        </IonSegment>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><IonSpinner name="crescent" color="primary" /></div>
        ) : (
          <>
            {categorias.map((c) => (
              <IonCard key={c.id} style={{ borderRadius: 12, margin: '8px 16px' }}
                onClick={() => isColaborador && c.status === 'ativa' ? (setEditId(c.id), setNome(c.nome), setDescricao(c.descricao || ''), setShowForm(true)) : undefined}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: c.status === 'inativa' ? 'var(--ion-color-medium)' : 'var(--ion-color-dark)' }}>
                        {c.nome}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                        {c.descricao || 'Sem descricao'}
                        {c.status === 'inativa' && <span style={{ color: '#C0392B', marginLeft: 6, fontWeight: 500 }}>{'\u00B7 Inativa'}</span>}
                      </div>
                    </div>
                    {isColaborador && c.status === 'ativa' && (
                      <IonIcon icon={chevronForwardOutline} color="medium" style={{ fontSize: 18 }} />
                    )}
                    {isColaborador && c.status === 'inativa' && (
                      <IonButton fill="clear" size="small" color="success" onClick={(e) => { e.stopPropagation(); handleReativar(c.id); }}>
                        Reativar
                      </IonButton>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </>
        )}

        {isColaborador && (
          <IonButton expand="block" onClick={() => { resetForm(); setShowForm(true); }} style={{ margin: 16 }}>
            <IonIcon slot="start" icon={add} /> Nova Categoria
          </IonButton>
        )}

        {showForm && (
          <div style={{ padding: 16, borderTop: '1px solid var(--app-color-border)' }}>
            <IonInput value={nome} onIonInput={(e) => setNome(e.detail.value || '')} placeholder="Nome da categoria" style={{ border: '1px solid var(--app-color-border)', borderRadius: 4, padding: '8px 12px', marginBottom: 8 }} />
            <IonInput value={descricao} onIonInput={(e) => setDescricao(e.detail.value || '')} placeholder="Descricao (opcional)" style={{ border: '1px solid var(--app-color-border)', borderRadius: 4, padding: '8px 12px', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <IonButton fill="outline" onClick={resetForm}>Cancelar</IonButton>
              <IonButton onClick={handleSave} disabled={!nome.trim() || saving}>{saving ? <IonSpinner /> : 'Salvar'}</IonButton>
              {editId && (
                <IonButton color="danger" fill="outline" onClick={() => setShowDelete(editId)}><IonIcon icon={trashOutline} /></IonButton>
              )}
            </div>
          </div>
        )}

        <IonAlert isOpen={!!showDelete} onDidDismiss={() => setShowDelete(null)} header="Desativar categoria" message="Tem certeza?" buttons={[{ text: 'Cancelar', role: 'cancel' }, { text: 'Desativar', handler: handleDelete }]} />
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default CategoriasPage;