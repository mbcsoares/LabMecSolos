import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonCard, IonCardContent, IonButton,
  IonToast, IonSpinner, IonIcon, IonTextarea, IonItem, IonLabel,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { arrowBackOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { InventarioService } from '../services/InventarioService';
import { queryRows } from '../services/DatabaseService';
import StatusBadge from '../components/StatusBadge';

function formatarData(iso: string | null): string {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('pt-BR') + ' ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const OcorrenciaDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const isColaborador = usuario?.permissao === 'colaborador' || usuario?.permissao === 'chefia';
  const [ocorrencia, setOcorrencia] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolucaoTexto, setResolucaoTexto] = useState('');
  const [showResolucaoInput, setShowResolucaoInput] = useState(false);
  const [acaoAlvo, setAcaoAlvo] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    queryRows('SELECT * FROM ocorrencias WHERE id = ?', [id]).then((rows) => {
      setOcorrencia(rows.length > 0 ? rows[0] as Record<string, unknown> : null);
      setLoading(false);
    });
  }, [id]);

  const alterarStatus = async (novoStatus: string) => {
    if (!ocorrencia || !usuario) return;
    try {
      await InventarioService.alterarStatusOcorrencia(
        id, novoStatus as never, usuario.userId,
        (novoStatus === 'resolvida' || novoStatus === 'fechada') ? resolucaoTexto : undefined
      );
      setOcorrencia({ ...ocorrencia, status: novoStatus, id_usuario_responsavel: usuario.userId, resolucao: resolucaoTexto || ocorrencia.resolucao });
      setShowResolucaoInput(false);
      setResolucaoTexto('');
      setShowToast(true);
    } catch {
      setShowToast(true);
    }
  };

  const statusBadgeStatus = (s: string) => {
    if (s === 'aberta') return 'error' as const;
    if (s === 'em_analise') return 'warning' as const;
    if (s === 'resolvida') return 'success' as const;
    return 'neutral' as const;
  };

  if (loading || !ocorrencia) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const status = ocorrencia.status as string;
  const tipoLabel = (t: string) => {
    const map: Record<string, string> = { quebra: 'Quebra', estoque_insuficiente: 'Estoque Insuficiente', mal_funcionamento: 'Mal Funcionamento', validade_expirada: 'Validade Expirada', outro: 'Outro' };
    return map[t] || t;
  };

  return (
    <IonPage>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 8px', background: 'var(--ion-color-primary)' }}>
        <button onClick={() => history.goBack()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFFFFF', fontSize: 22, padding: '4px 8px' }}>
          <IonIcon icon={arrowBackOutline} />
        </button>
        <span style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF' }}>Ocorrencia</span>
      </div>
      <IonContent>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <StatusBadge status={statusBadgeStatus(status)} label={status === 'em_analise' ? 'Em Analise' : status.charAt(0).toUpperCase() + status.slice(1)} />
            <span style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{formatarData(ocorrencia.data_abertura as string)}</span>
          </div>

          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: 'var(--ion-color-dark)' }}>{ocorrencia.titulo as string}</h3>
              <div style={{ fontSize: 12, color: 'var(--ion-color-primary)', fontWeight: 500, marginBottom: 8 }}>
                {tipoLabel(ocorrencia.tipo as string)}
              </div>
              <p style={{ fontSize: 14, color: 'var(--ion-color-dark)', lineHeight: 1.5, margin: 0 }}>
                {(ocorrencia.descricao || '') as string}
              </p>
            </IonCardContent>
          </IonCard>

          {(status === 'resolvida' || status === 'fechada') && (ocorrencia.resolucao as string) && (
            <IonCard style={{ borderRadius: 12 }}>
              <IonCardContent>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-dark)', margin: '0 0 4px 0' }}>Resolucao</p>
                <p style={{ fontSize: 14, color: 'var(--ion-color-dark)', margin: 0 }}>{ocorrencia.resolucao as string}</p>
                {(ocorrencia.data_resolucao as string) && <p style={{ fontSize: 11, color: 'var(--ion-color-medium)', margin: '4px 0 0 0' }}>{formatarData(ocorrencia.data_resolucao as string)}</p>}
              </IonCardContent>
            </IonCard>
          )}

          {showResolucaoInput && (
            <IonCard style={{ borderRadius: 12, borderLeft: '4px solid var(--ion-color-primary)' }}>
              <IonCardContent>
                <IonItem>
                  <IonLabel position="stacked">Resolucao *</IonLabel>
                  <IonTextarea
                    value={resolucaoTexto}
                    onIonInput={(e) => setResolucaoTexto(e.detail.value || '')}
                    placeholder="Descreva a resolucao..."
                    rows={3}
                  />
                </IonItem>
                <IonButton expand="block" color="primary" disabled={!resolucaoTexto.trim()} onClick={() => alterarStatus(acaoAlvo)} style={{ marginTop: 8 }}>
                  Confirmar
                </IonButton>
              </IonCardContent>
            </IonCard>
          )}

          {isColaborador && !showResolucaoInput && (
            <>
              {status === 'aberta' && (
                <IonButton expand="block" color="warning" onClick={async () => { if (usuario) { await alterarStatus('em_analise'); } }}>
                  Em Analise
                </IonButton>
              )}
              {status === 'em_analise' && (
                <>
                  <IonButton expand="block" color="success" onClick={() => { setAcaoAlvo('resolvida'); setShowResolucaoInput(true); }}>
                    Resolver
                  </IonButton>
                  <IonButton expand="block" color="medium" onClick={() => { setAcaoAlvo('fechada'); setShowResolucaoInput(true); }}>
                    Fechar
                  </IonButton>
                </>
              )}
              {(status === 'resolvida' || status === 'fechada') && (
                <IonButton expand="block" color="primary" onClick={async () => { if (usuario) { await alterarStatus('aberta'); } }}>
                  Reabrir
                </IonButton>
              )}
            </>
          )}
        </div>

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message="Status atualizado." duration={2000} color="success" position="top" />
      </IonContent>
    </IonPage>
  );
};

export default OcorrenciaDetalhePage;