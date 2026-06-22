import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSegment, IonSegmentButton, IonLabel, IonIcon, IonSpinner, IonButton, IonToast, IonCard, IonCardContent, IonItem, IonFab, IonFabButton, IonAlert } from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { addOutline, peopleOutline, layersOutline, documentTextOutline, cubeOutline, flaskOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import FinalizacaoPendente from '../components/FinalizacaoPendente';
import MembroCard from '../components/MembroCard';
import { PesquisaService } from '../services/PesquisaService';
import { UsuarioService } from '../services/UsuarioService';
import { useAuth } from '../contexts/AuthContext';
import type { PesquisaResumo, ProgramaAmostragem } from '../models/types';

const STATUS_BADGE: Record<string, { status: 'success' | 'warning' | 'error' | 'info' | 'neutral'; label: string }> = {
  em_andamento: { status: 'info', label: 'Em Andamento' },
  concluida: { status: 'success', label: 'Concluída' },
  cancelada: { status: 'neutral', label: 'Cancelada' },
};

const TIPO_ENSAIO_LABELS: Record<string, string> = {
  teor_umidade: 'Teor de Umidade', granulometria: 'Granulometria', compactacao: 'Compactação',
  limite_liquidez: 'Limite de Liquidez', limite_plasticidade: 'Limite de Plasticidade',
  cisalhamento_direto: 'Cisalhamento Direto', adensamento: 'Adensamento', triaxial: 'Triaxial',
};

const PesquisaDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [pesquisa, setPesquisa] = useState<PesquisaResumo | null>(null);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [programas, setProgramas] = useState<ProgramaAmostragem[]>([]);
  const [amostras, setAmostras] = useState<any[]>([]);
  const [ensaios, setEnsaios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('visao_geral');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [showExcluirAlert, setShowExcluirAlert] = useState(false);
  const [responsavel, setResponsavel] = useState<{ nome: string; sobrenome: string } | null>(null);

  const meuPapel = pesquisa?.meu_papel;
  const isRespPrincipal = meuPapel === 'responsavel_principal';
  const isRespSecundario = meuPapel === 'responsavel_secundario';
  const podeGerenciar = isRespPrincipal || isRespSecundario;
  const badge = STATUS_BADGE[pesquisa?.status || ''] || { status: 'neutral' as const, label: '' };

  const recarregarEquipe = async () => {
    if (!id) return;
    try {
      const colab = await PesquisaService.listarColaboradores(id);
      setColaboradores(colab);
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao recarregar equipe.');
      setShowToast(true);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const p = await PesquisaService.obterPorId(id);
        const resp = p ? await UsuarioService.obterNome(p.id_responsavel) : null;
        const colab = await PesquisaService.listarColaboradores(id);
        const prog = await PesquisaService.listarProgramas(id);
        const ams = await PesquisaService.listarAmostrasBrutas(id);
        const ens = await PesquisaService.listarEnsaios(id);
        const papel = usuario ? await PesquisaService.obterPapelUsuario(id, usuario.userId) : null;
        setPesquisa(p ? { ...p, meu_papel: papel } : null);
        setResponsavel(resp);
        setColaboradores(colab);
        setProgramas(prog);
        setAmostras(ams);
        setEnsaios(ens);
      } catch {
        setToastMsg('Erro ao carregar dados da pesquisa.');
        setShowToast(true);
      }
      setLoading(false);
    };
    load();
  }, [id, usuario]);

  const handleConcluir = async () => {
    if (!id || !usuario) return;
    try {
      await PesquisaService.concluir(id, usuario.userId);
      setPesquisa((prev) => prev ? { ...prev, status: 'concluida', data_fim: new Date().toISOString() } : null);
      setToastMsg('Pesquisa concluída.');
      setShowToast(true);
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao concluir.');
      setShowToast(true);
    }
  };

  const handleCancelar = async (motivo: string) => {
    if (!motivo || !id || !usuario) return;
    try {
      await PesquisaService.cancelar(id, motivo, usuario.userId);
      setPesquisa((prev) => prev ? { ...prev, status: 'cancelada', data_fim: new Date().toISOString() } : null);
      setToastMsg('Pesquisa cancelada.');
      setShowToast(true);
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao cancelar.');
      setShowToast(true);
    }
  };

  const handleExcluir = async () => {
    if (!id || !usuario) return;
    try {
      await PesquisaService.excluir(id, usuario.userId);
      history.goBack();
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao excluir.');
      setShowToast(true);
    }
  };

  if (loading || !pesquisa) {
    return (
      <IonPage>
        <AppBar title="Pesquisa" />
        <IonContent>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <AppBar title={pesquisa.titulo} />
      <IonContent>
        <IonSegment scrollable value={tab} onIonChange={(e) => setTab(e.detail.value as string)}>
          <IonSegmentButton value="visao_geral"><IonLabel>Visão Geral</IonLabel></IonSegmentButton>
          <IonSegmentButton value="amostras"><IonLabel>Amostras</IonLabel></IonSegmentButton>
          <IonSegmentButton value="ensaios"><IonLabel>Ensaios</IonLabel></IonSegmentButton>
          <IonSegmentButton value="programas"><IonLabel>Programas</IonLabel></IonSegmentButton>
          <IonSegmentButton value="relatorio"><IonLabel>Relatório</IonLabel></IonSegmentButton>
        </IonSegment>

        {tab === 'visao_geral' && (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <StatusBadge status={badge.status} label={badge.label} />
            </div>
            <FinalizacaoPendente finalizado={pesquisa.finalizado} />

            <IonCard style={{ borderRadius: 12 }}>
              <IonCardContent>
                <IonItem lines="none"><IonLabel position="stacked"><small>Descrição</small></IonLabel><div style={{ fontSize: 14 }}>{pesquisa.descricao || '—'}</div></IonItem>
                <IonItem lines="none"><IonLabel position="stacked"><small>Contexto</small></IonLabel><div style={{ fontSize: 14 }}>{pesquisa.contexto}</div></IonItem>
                <IonItem lines="none"><IonLabel position="stacked"><small>Data de Criação</small></IonLabel><div style={{ fontSize: 14 }}>{new Date(pesquisa.data_criacao).toLocaleDateString('pt-BR')}</div></IonItem>
                {pesquisa.data_fim && <IonItem lines="none"><IonLabel position="stacked"><small>Data de Fim</small></IonLabel><div style={{ fontSize: 14 }}>{new Date(pesquisa.data_fim).toLocaleDateString('pt-BR')}</div></IonItem>}
              </IonCardContent>
            </IonCard>

            {pesquisa.status === 'em_andamento' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {podeGerenciar && (
                  <>
                    <IonButton expand="block" fill="outline" onClick={() => history.push(`/app/ensaios/pesquisa/${id}/editar`)}>Editar</IonButton>
                    <IonButton expand="block" color="success" onClick={handleConcluir}>Concluir Pesquisa</IonButton>
                    <IonButton expand="block" color="warning" onClick={() => setShowCancelAlert(true)}>Cancelar Pesquisa</IonButton>
                  </>
                )}
                {isRespPrincipal && (
                  <IonButton expand="block" color="danger" onClick={() => setShowExcluirAlert(true)}>Excluir Pesquisa</IonButton>
                )}
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              <div style={{ padding: '4px 0' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)' }}>Responsável Principal</span>
              </div>
              <MembroCard id={pesquisa.id_responsavel} nome={responsavel?.nome || ''} sobrenome={responsavel?.sobrenome || ''} papel="responsavel_principal" />

              {colaboradores.filter((c: any) => c.papel === 'responsavel_secundario').length > 0 && (
                <div style={{ padding: '12px 0 4px' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)' }}>Responsáveis Secundários</span>
                </div>
              )}
              {colaboradores.filter((c: any) => c.papel === 'responsavel_secundario').map((c: any) => (
                <MembroCard key={c.id} id={c.id_usuario} nome={c.nome} sobrenome={c.sobrenome} papel="responsavel_secundario" onRebaixar={isRespPrincipal ? () => { PesquisaService.rebaixarSecundario(id!, c.id_usuario, usuario!.userId).then(recarregarEquipe); } : undefined} onRemover={podeGerenciar ? () => { PesquisaService.removerColaborador(id!, c.id_usuario, usuario!.userId).then(recarregarEquipe); } : undefined} />
              ))}

              <div style={{ padding: '12px 0 4px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)' }}>Colaboradores</span>
              </div>
              {colaboradores.filter((c: any) => c.papel === 'colaborador').map((c: any) => (
                <MembroCard key={c.id} id={c.id_usuario} nome={c.nome} sobrenome={c.sobrenome} papel="colaborador" onPromover={isRespPrincipal ? () => { PesquisaService.promoverSecundario(id!, c.id_usuario, usuario!.userId).then(recarregarEquipe); } : undefined} onRemover={podeGerenciar ? () => { PesquisaService.removerColaborador(id!, c.id_usuario, usuario!.userId).then(recarregarEquipe); } : undefined} />
              ))}

              {colaboradores.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <IonIcon icon={peopleOutline} style={{ fontSize: 32, color: 'var(--ion-color-medium)', marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: 0 }}>Nenhum colaborador adicionado.</p>
                </div>
              )}

              {podeGerenciar && (
                <div style={{ padding: '8px 0' }}>
                  <IonButton expand="block" onClick={() => history.push(`/app/ensaios/pesquisa/${id}/adicionar-colaborador`)}>
                    <IonIcon slot="start" icon={addOutline} /> Adicionar Colaborador
                  </IonButton>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'amostras' && (
          <div style={{ padding: 16 }}>
            {amostras.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <IonIcon icon={cubeOutline} style={{ fontSize: 36, color: 'var(--ion-color-medium)', marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: 0 }}>Nenhuma amostra bruta registrada.</p>
              </div>
            ) : (
              amostras.map((ab: any) => (
                <IonCard key={ab.id} style={{ borderRadius: 12, marginBottom: 8 }} onClick={() => history.push(`/app/ensaios/amostra/${ab.id}`)}>
                  <IonCardContent>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{ab.numero_identificacao_campo}</div>
                    <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 4 }}>
                      {ab.tipo_amostra === 'deformada' ? 'Deformada' : 'Indeformada'} &nbsp;·&nbsp; Ponto: {ab.ponto_plano} &nbsp;·&nbsp; {ab.status}
                    </div>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </div>
        )}

        {tab === 'ensaios' && (
          <div style={{ padding: 16 }}>
            {ensaios.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <IonIcon icon={flaskOutline} style={{ fontSize: 36, color: 'var(--ion-color-medium)', marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: 0 }}>Nenhum ensaio registrado.</p>
              </div>
            ) : (
              ensaios.map((e: any) => (
                <IonCard key={e.id} style={{ borderRadius: 12, marginBottom: 8 }} onClick={() => history.push(`/app/ensaios/${e.id}`)}>
                  <IonCardContent>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{TIPO_ENSAIO_LABELS[e.tipo_ensaio] || e.tipo_ensaio}</div>
                    <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 4 }}>
                      Amostra: {e.amostra_numero || e.amostra_campo || '—'} &nbsp;·&nbsp; {e.status}
                    </div>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </div>
        )}

        {tab === 'programas' && (
          <div style={{ padding: 16 }}>
            {programas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <IonIcon icon={layersOutline} style={{ fontSize: 36, color: 'var(--ion-color-medium)', marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: 0 }}>Nenhum programa de amostragem.</p>
              </div>
            ) : (
              programas.map((prog) => (
                <IonCard key={prog.id} style={{ borderRadius: 12, marginBottom: 8 }} onClick={() => history.push(`/app/ensaios/pesquisa/${id}/programa/${prog.id}`)}>
                  <IonCardContent>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)' }}>{prog.objetivo}</div>
                    <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 4 }}>
                      {prog.endereco_coleta || 'Sem endereço'} &nbsp;·&nbsp; {prog.status}
                    </div>
                  </IonCardContent>
                </IonCard>
              ))
            )}
          </div>
        )}

        {tab === 'programas' && (pesquisa as any).finalizado === 1 && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => history.push(`/app/novo-programa?pesquisa=${id}`)}>
              <IonIcon icon={addOutline} />
            </IonFabButton>
          </IonFab>
        )}

        {tab === 'relatorio' && (
          <div style={{ padding: 16, textAlign: 'center' }}>
            <IonCard style={{ borderRadius: 12 }}>
              <IonCardContent>
                <div style={{ padding: 24 }}>
                  <IonIcon icon={documentTextOutline} style={{ fontSize: 48, color: 'var(--ion-color-medium)', marginBottom: 12 }} />
                  <p style={{ fontSize: 14, color: 'var(--ion-color-dark)', margin: '0 0 8px' }}>
                    Resumo Consolidado da Pesquisa
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: 0 }}>
                    Programas: {programas.length} &nbsp;·&nbsp; Amostras: {amostras.length} &nbsp;·&nbsp; Ensaios: {ensaios.length}
                  </p>
                </div>
                <IonButton expand="block" fill="outline" onClick={() => history.push(`/app/ensaios/${id}/relatorio`)}>
                  <IonIcon slot="start" icon={documentTextOutline} /> Gerar Relatório Consolidado
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        <IonAlert
          isOpen={showCancelAlert}
          onDidDismiss={({ detail }) => {
            setShowCancelAlert(false);
            if (detail.role === 'confirm') {
              const motivo = detail.data?.values?.motivo?.trim() || '';
              if (motivo) handleCancelar(motivo);
            }
            setCancelMotivo('');
          }}
          header="Cancelar Pesquisa"
          message="Informe o motivo do cancelamento:"
          inputs={[{ name: 'motivo', type: 'text', placeholder: 'Motivo', value: cancelMotivo, handler: (e: any) => setCancelMotivo(e.value) }]}
          buttons={[
            { text: 'Voltar', role: 'cancel' },
            { text: 'Confirmar', role: 'confirm' },
          ]}
        />

        <IonAlert
          isOpen={showExcluirAlert}
          onDidDismiss={() => setShowExcluirAlert(false)}
          header="Excluir Pesquisa"
          message="Tem certeza que deseja excluir esta pesquisa permanentemente? Esta ação não pode ser desfeita."
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Excluir', role: 'destructive', handler: handleExcluir },
          ]}
        />

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default PesquisaDetalhePage;
