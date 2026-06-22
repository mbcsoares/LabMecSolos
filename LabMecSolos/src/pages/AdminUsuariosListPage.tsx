import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonPage,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonChip,
  IonActionSheet,
  IonSpinner,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { personCircleOutline, starOutline, star } from 'ionicons/icons';
import { AdminService } from '../services/AdminService';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import type { FiltrosUsuario, UsuarioListItem, StatusUsuario, PerfilUsuario, PermissaoUsuario, GeneroUsuario } from '../models/types';

function getInitials(nome: string, sobrenome: string): string {
  return `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase();
}

const FILTRO_STATUS: { label: string; value: StatusUsuario | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Ativo', value: 'ativo' },
  { label: 'Inativo', value: 'inativo' },
  { label: 'Excluido', value: 'excluido' },
];

const FILTRO_PERFIL: { label: string; value: PerfilUsuario | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Professor', value: 'professor' },
  { label: 'Tecnico', value: 'tecnico' },
  { label: 'Aluno', value: 'aluno' },
];

const FILTRO_PERMISSAO: { label: string; value: PermissaoUsuario | null }[] = [
  { label: 'Todas', value: null },
  { label: 'Comum', value: 'comum' },
  { label: 'Colaborador', value: 'colaborador' },
  { label: 'Chefia', value: 'chefia' },
];

const FILTRO_GENERO: { label: string; value: GeneroUsuario | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Masculino', value: 'masculino' },
  { label: 'Feminino', value: 'feminino' },
  { label: 'Nao informado', value: 'nao_informado' },
];

const AdminUsuariosListPage: React.FC = () => {
  const history = useHistory();
  const [usuarios, setUsuarios] = useState<UsuarioListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState<FiltrosUsuario>({
    status: null, perfil: null, permissao: null, genero: null,
  });
  const [actionSheet, setActionSheet] = useState<{ tipo: string; aberto: boolean }>({ tipo: '', aberto: false });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const carregar = useCallback(async (p: number, reset: boolean) => {
    setLoading(true);
    try {
      const termoBusca = busca.trim() || undefined;
      const result = await AdminService.listarUsuarios(p, filtros, termoBusca);
      if (reset) {
        setUsuarios(result.usuarios);
      } else {
        setUsuarios((prev) => [...prev, ...result.usuarios]);
      }
      setTotal(result.total);
      setPagina(p);
    } catch {
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [filtros, busca]);

  useEffect(() => {
    carregar(1, true);
  }, [filtros]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      carregar(1, true);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [busca]);

  const handleInfinite = async (ev: CustomEvent<void>) => {
    await carregar(pagina + 1, false);
    (ev.target as HTMLIonInfiniteScrollElement).complete();
  };

  const getFiltroOpcoes = (tipo: string) => {
    switch (tipo) {
      case 'status': return FILTRO_STATUS;
      case 'perfil': return FILTRO_PERFIL;
      case 'permissao': return FILTRO_PERMISSAO;
      case 'genero': return FILTRO_GENERO;
      default: return [];
    }
  };

  const getFiltroLabel = (tipo: string): string => {
    const v = filtros[tipo as keyof FiltrosUsuario];
    if (!v) return tipo.charAt(0).toUpperCase() + tipo.slice(1);
    const opcoes = getFiltroOpcoes(tipo);
    return opcoes.find((o) => o.value === v)?.label || v;
  };

  const handleFiltroSelect = (tipo: string, value: string | null) => {
    setFiltros((prev) => ({ ...prev, [tipo]: value }));
    setActionSheet({ tipo: '', aberto: false });
  };

  return (
    <IonPage>
      <AppBar title="Gerenciar Usuarios" />
      <IonContent>
        <div style={{ padding: '8px 16px' }}>
          <IonSearchbar
            value={busca}
            onIonInput={(e) => setBusca(e.detail.value || '')}
            placeholder="Buscar por nome, matricula ou e-mail"
            debounce={0}
            style={{ padding: 0 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, padding: '0 16px 8px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {(['status', 'perfil', 'permissao', 'genero'] as const).map((tipo) => (
            <IonChip
              key={tipo}
              onClick={() => setActionSheet({ tipo, aberto: true })}
              color={filtros[tipo] ? 'primary' : 'medium'}
              outline={!filtros[tipo]}
              style={{ flexShrink: 0, fontSize: 12 }}
            >
              {getFiltroLabel(tipo)}
            </IonChip>
          ))}
        </div>

        {loading && usuarios.length === 0 ? (
          <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : usuarios.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <IonIcon icon={personCircleOutline} style={{ fontSize: 48, color: 'var(--ion-color-medium)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--ion-color-medium)', margin: 0 }}>
              {busca || Object.values(filtros).some(Boolean)
                ? 'Nenhum usuario encontrado com os filtros atuais.'
                : 'Nenhum usuario cadastrado.'}
            </p>
          </div>
        ) : (
          <>
            <IonList style={{ margin: 0 }}>
              {usuarios.map((u) => (
                <IonItem
                  key={u.id}
                  button
                  onClick={() => history.push(`/app/admin/usuario/${u.id}`)}
                >
                  <div
                    slot="start"
                    style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: 'var(--ion-color-primary)',
                      color: '#FFFFFF', display: 'flex',
                      justifyContent: 'center', alignItems: 'center',
                      fontSize: 14, fontWeight: 600,
                    }}
                  >
                    {getInitials(u.nome, u.sobrenome)}
                  </div>
                  <IonLabel>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ion-color-dark)' }}>
                      {u.nome} {u.sobrenome}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 2 }}>
                      {u.matricula}
                    </div>
                  </IonLabel>
                  <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusBadge
                      status={u.status === 'ativo' ? 'success' : u.status === 'inativo' ? 'neutral' : 'error'}
                      label={u.status === 'ativo' ? 'Ativo' : u.status === 'inativo' ? 'Inativo' : 'Excluido'}
                    />
                    {u.permissao === 'chefia' ? (
                      <IonIcon icon={star} style={{ color: '#E6A817', fontSize: 18 }} />
                    ) : u.permissao === 'colaborador' ? (
                      <IonIcon icon={starOutline} style={{ color: '#898888', fontSize: 18 }} />
                    ) : null}
                  </div>
                </IonItem>
              ))}
            </IonList>

            {usuarios.length < total && (
              <IonInfiniteScroll onIonInfinite={handleInfinite} threshold="200px">
                <IonInfiniteScrollContent loadingText="Carregando..." />
              </IonInfiniteScroll>
            )}
          </>
        )}

        <IonActionSheet
          isOpen={actionSheet.aberto && actionSheet.tipo === 'status'}
          onDidDismiss={() => setActionSheet({ tipo: '', aberto: false })}
          header="Status"
          buttons={FILTRO_STATUS.map((o) => ({
            text: o.label,
            handler: () => handleFiltroSelect('status', o.value),
          }))}
        />
        <IonActionSheet
          isOpen={actionSheet.aberto && actionSheet.tipo === 'perfil'}
          onDidDismiss={() => setActionSheet({ tipo: '', aberto: false })}
          header="Perfil"
          buttons={FILTRO_PERFIL.map((o) => ({
            text: o.label,
            handler: () => handleFiltroSelect('perfil', o.value),
          }))}
        />
        <IonActionSheet
          isOpen={actionSheet.aberto && actionSheet.tipo === 'permissao'}
          onDidDismiss={() => setActionSheet({ tipo: '', aberto: false })}
          header="Permissao"
          buttons={FILTRO_PERMISSAO.map((o) => ({
            text: o.label,
            handler: () => handleFiltroSelect('permissao', o.value),
          }))}
        />
        <IonActionSheet
          isOpen={actionSheet.aberto && actionSheet.tipo === 'genero'}
          onDidDismiss={() => setActionSheet({ tipo: '', aberto: false })}
          header="Genero"
          buttons={FILTRO_GENERO.map((o) => ({
            text: o.label,
            handler: () => handleFiltroSelect('genero', o.value),
          }))}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminUsuariosListPage;
