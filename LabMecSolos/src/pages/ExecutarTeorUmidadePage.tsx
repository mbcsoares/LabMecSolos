import React, { useState, useEffect, useCallback } from 'react';
import { IonPage, IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSpinner, IonToast, IonCard, IonCardContent, IonList, IonSelect, IonSelectOption, IonAlert } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { addOutline, calculatorOutline, warningOutline, documentTextOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import StatusBadge from '../components/StatusBadge';
import ProgressoEnsaio from '../components/ProgressoEnsaio';
import DeterminacaoCard from '../components/DeterminacaoCard';
import CalibracaoAlert from '../components/CalibracaoAlert';
import { TeorUmidadeService } from '../services/TeorUmidadeService';
import { EnsaioBaseService } from '../services/EnsaioBaseService';
import { EquipamentoIntegrationService } from '../services/EquipamentoIntegrationService';
import { ENSAIOS_CONFIG } from '../config/ensaios.config';
import { useAuth } from '../contexts/AuthContext';
import type { EnsaioDetalhado, DeterminacaoTeorUmidade, EquipamentoEnsaio } from '../models/types';

const ExecutarTeorUmidadePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const [ensaio, setEnsaio] = useState<EnsaioDetalhado | null>(null);
  const [determinacoes, setDeterminacoes] = useState<DeterminacaoTeorUmidade[]>([]);
  const [equipamentos, setEquipamentos] = useState<EquipamentoEnsaio[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempEstufa, setTempEstufa] = useState('105');
  const [idEstufa, setIdEstufa] = useState('');
  const [idBalanca, setIdBalanca] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [estufaAlert, setEstufaAlert] = useState<EquipamentoEnsaio | null>(null);
  const [balancaAlert, setBalancaAlert] = useState<EquipamentoEnsaio | null>(null);

  const [previewHM, setPreviewHM] = useState<number | null>(null);
  const [previewDP, setPreviewDP] = useState<number | null>(null);
  const [previewFM, setPreviewFM] = useState<number | null>(null);
  const [detSelecionada, setDetSelecionada] = useState<DeterminacaoTeorUmidade | null>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);

  const carregar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const e = await EnsaioBaseService.obterEnsaioDetalhado(id);
      setEnsaio(e);
      if (e) {
        setTempEstufa(e.temperatura_estufa ? String(e.temperatura_estufa) : '105');
        setIdEstufa(e.id_estufa || '');
        setIdBalanca(e.id_balanca || '');
      }
      const dets = await TeorUmidadeService.listarDeterminacoes(id);
      setDeterminacoes(dets);
      const eqps = await EquipamentoIntegrationService.buscarEquipamentos();
      setEquipamentos(eqps);
    } catch {
      setToastMsg('Erro ao carregar dados do ensaio.');
      setShowToast(true);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    if (determinacoes.length >= ENSAIOS_CONFIG.TEOR_UMIDADE.DETERMINACOES_MINIMAS && id) {
      TeorUmidadeService.calcularHMedio(id).then((hm) => {
        setPreviewHM(hm);
        TeorUmidadeService.calcularDesvioPadrao(id).then((dp) => {
          setPreviewDP(dp);
          setPreviewFM(TeorUmidadeService.calcularFCMedio(hm));
        });
      }).catch(() => {
        setPreviewHM(null);
        setPreviewDP(null);
        setPreviewFM(null);
      });
    }
  }, [determinacoes.length, id]);

  const handleSalvarParametros = async () => {
    if (!id) return;
    try {
      const temp = parseFloat(tempEstufa);
      if (temp < 105 || temp > 110) { setToastMsg('Temperatura deve estar entre 105°C e 110°C.'); setShowToast(true); return; }
      await EnsaioBaseService.atualizarParametrosTeorUmidade(id, temp, idEstufa || null, idBalanca || null);
      setToastMsg('Parâmetros salvos.'); setShowToast(true);
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao salvar parâmetros.');
      setShowToast(true);
    }
  };

  const handleConcluir = async () => {
    if (!id) return;
    try {
      const resultado = await TeorUmidadeService.concluirEnsaio(id, usuario?.userId || '');
      setEnsaio((prev) => prev ? { ...prev, status: 'concluido', h_medio: resultado.hMedio, desvio_padrao: resultado.desvioPadrao, fc_medio: resultado.fcMedio } : null);
      setToastMsg(`Ensaio concluído. h_médio = ${resultado.hMedio.toFixed(2)}%`);
      setShowToast(true);
    } catch (e: any) { setToastMsg(e.message || 'Erro'); setShowToast(true); }
  };

  const estufaSelecionada = equipamentos.find((eq) => eq.id === idEstufa);
  const balancaSelecionada = equipamentos.find((eq) => eq.id === idBalanca);

  if (loading || !ensaio) {
    return (
      <IonPage><AppBar title="Teor de Umidade" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>
    );
  }

  return (
    <IonPage>
      <AppBar title="Teor de Umidade" />
      <IonContent>
        <div style={{ padding: 16 }}>
          <ProgressoEnsaio atual={determinacoes.length} minimo={ENSAIOS_CONFIG.TEOR_UMIDADE.DETERMINACOES_MINIMAS} />

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Parâmetros do Ensaio</div>

          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <IonItem><IonLabel position="stacked">Temperatura da Estufa (°C)</IonLabel>
                <IonInput type="number" value={tempEstufa} onIonInput={(e) => setTempEstufa(e.detail.value || '')} placeholder="105-110" />
              </IonItem>
              <IonItem><IonLabel position="stacked">Estufa Utilizada</IonLabel>
                <IonSelect value={idEstufa} interface="popover" onIonChange={(e) => { setIdEstufa(e.detail.value); const eq = equipamentos.find((x) => x.id === e.detail.value); setEstufaAlert(eq?.calibracaoVencida ? eq : null); }}>
                  <IonSelectOption value="">Nenhuma</IonSelectOption>
                  {equipamentos.map((eq) => <IonSelectOption key={eq.id} value={eq.id}>{eq.nome}</IonSelectOption>)}
                </IonSelect>
              </IonItem>
              {estufaAlert?.calibracaoVencida && <CalibracaoAlert nomeEquipamento={estufaAlert.nome} diasVencido={estufaAlert.diasRestantes} />}
              <IonItem><IonLabel position="stacked">Balança Utilizada</IonLabel>
                <IonSelect value={idBalanca} interface="popover" onIonChange={(e) => { setIdBalanca(e.detail.value); const eq = equipamentos.find((x) => x.id === e.detail.value); setBalancaAlert(eq?.calibracaoVencida ? eq : null); }}>
                  <IonSelectOption value="">Nenhuma</IonSelectOption>
                  {equipamentos.map((eq) => <IonSelectOption key={eq.id} value={eq.id}>{eq.nome}</IonSelectOption>)}
                </IonSelect>
              </IonItem>
              {balancaAlert?.calibracaoVencida && <CalibracaoAlert nomeEquipamento={balancaAlert.nome} diasVencido={balancaAlert.diasRestantes} />}
              <div style={{ padding: '8px 0' }}>
                <IonButton expand="block" fill="outline" size="small" onClick={handleSalvarParametros}>Salvar Parâmetros</IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)' }}>Determinações ({determinacoes.length})</span>
            {ensaio.status === 'em_andamento' && (
              <IonButton size="small" fill="clear" onClick={() => history.push(`/app/ensaios/${id}/determinacao/novo`)}>
                <IonIcon slot="start" icon={addOutline} /> Nova
              </IonButton>
            )}
          </div>

          {determinacoes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <IonIcon icon={calculatorOutline} style={{ fontSize: 48, color: 'var(--ion-color-medium)', marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: 'var(--ion-color-medium)', margin: 0 }}>Nenhuma determinação registrada. Mínimo de 3 para concluir.</p>
            </div>
          ) : (
            determinacoes.map((d) => (
              <DeterminacaoCard
                key={d.id}
                numero={d.numero_determinacao}
                tara={d.tara}
                m1={d.m1}
                m2={d.m2}
                hCalculado={d.h_calculado}
                fcIndividual={d.fc_individual}
                tempoEstufa={d.tempo_estufa}
                observacao={d.observacao}
                onClick={() => { setDetSelecionada(d); setShowDetalhes(true); }}
                onCompletar={(d.h_calculado === null && ensaio.status === 'em_andamento') ? () => history.push(`/app/determinacao/${d.id}`) : undefined}
              />
            ))
          )}

          {determinacoes.length >= ENSAIOS_CONFIG.TEOR_UMIDADE.DETERMINACOES_MINIMAS && ensaio.status === 'em_andamento' && (
            <div style={{ marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#E8EDF6' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-primary)', marginBottom: 8 }}>Resultados Preliminares</div>
              <div style={{ fontSize: 14 }}>h_médio: <strong>{previewHM?.toFixed(2) || '—'}</strong>%</div>
              <div style={{ fontSize: 14, marginTop: 4 }}>Desvio Padrão: <strong>{previewDP?.toFixed(4) || '—'}</strong></div>
              <div style={{ fontSize: 14, marginTop: 4 }}>fc_médio: <strong>{previewFM?.toFixed(4) || '—'}</strong></div>
            </div>
          )}

          {ensaio.status === 'em_andamento' && (
            <div style={{ marginTop: 16 }}>
              <IonButton expand="block" color="success" onClick={handleConcluir} disabled={determinacoes.length < ENSAIOS_CONFIG.TEOR_UMIDADE.DETERMINACOES_MINIMAS}>
                Concluir Ensaio
              </IonButton>
            </div>
          )}

          {ensaio.status === 'concluido' && ensaio.h_medio !== undefined && (
            <div style={{ marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#009d4320' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-success)', marginBottom: 8 }}>Resultados Finais</div>
              <div style={{ fontSize: 14 }}>h_médio: <strong>{ensaio.h_medio.toFixed(2)}%</strong></div>
              <div style={{ fontSize: 14, marginTop: 4 }}>Desvio Padrão: <strong>{ensaio.desvio_padrao?.toFixed(4)}</strong></div>
              <div style={{ fontSize: 14, marginTop: 4 }}>fc_médio: <strong>{ensaio.fc_medio?.toFixed(4)}</strong></div>
              <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 4 }}>{determinacoes.length} determinações</div>
              <IonButton expand="block" fill="outline" style={{ marginTop: 12 }} onClick={() => history.push(`/app/ensaios/${id}/relatorio`)}>
                <IonIcon slot="start" icon={documentTextOutline} /> Visualizar Relatório
              </IonButton>
            </div>
          )}
        </div>

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />

        <IonAlert
          isOpen={showDetalhes}
          onDidDismiss={() => setShowDetalhes(false)}
          header={`Determinação #${detSelecionada?.numero_determinacao ?? ''}`}
          message={
            detSelecionada
              ? `Tara: ${detSelecionada.tara.toFixed(2)} g<br/>` +
                `M1 (úmido): ${detSelecionada.m1.toFixed(2)} g<br/>` +
                `M2 (seco): ${(detSelecionada.h_calculado !== null) ? detSelecionada.m2.toFixed(2) + ' g' : '— (pendente)'}<br/>` +
                `Tempo estufa: ${detSelecionada.tempo_estufa ? detSelecionada.tempo_estufa + ' h' : '—'}<br/><br/>` +
                `h = ${detSelecionada.h_calculado !== null ? detSelecionada.h_calculado.toFixed(2) + '%' : '—'}<br/>` +
                `fc = ${detSelecionada.fc_individual !== null ? detSelecionada.fc_individual.toFixed(4) : '—'}<br/><br/>` +
                `Obs.: ${detSelecionada.observacao || '—'}`
              : ''
          }
          buttons={[{ text: 'Fechar', role: 'cancel' }]}
        />
      </IonContent>
    </IonPage>
  );
};

export default ExecutarTeorUmidadePage;
