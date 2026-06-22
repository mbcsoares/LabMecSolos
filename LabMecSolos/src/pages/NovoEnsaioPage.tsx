import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonSpinner, IonToast, IonActionSheet,
} from '@ionic/react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import AppBar from '../components/AppBar';
import { EnsaioBaseService } from '../services/EnsaioBaseService';
import { queryRows } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import type { TipoEnsaioDestino, CriarEnsaioDTO } from '../models/types';

const TIPO_ENSAIO_OPCOES: { value: TipoEnsaioDestino; label: string; norma: string }[] = [
  { value: 'teor_umidade', label: 'Teor de Umidade', norma: 'ABNT NBR 6457' },
  { value: 'granulometria', label: 'Granulometria', norma: 'ABNT NBR 7181' },
  { value: 'compactacao', label: 'Compactação', norma: 'ABNT NBR 7182' },
  { value: 'limite_liquidez', label: 'Limite de Liquidez', norma: 'ABNT NBR 6459' },
  { value: 'limite_plasticidade', label: 'Limite de Plasticidade', norma: 'ABNT NBR 7180' },
  { value: 'cisalhamento_direto', label: 'Cisalhamento Direto', norma: '\u2014' },
  { value: 'adensamento', label: 'Adensamento', norma: 'ABNT NBR 12007' },
  { value: 'triaxial', label: 'Triaxial', norma: '\u2014' },
  { value: 'outro', label: 'Outro', norma: '' },
];

interface AmostraDisponivel {
  id: string;
  numero_amostra: string;
  pesquisa_titulo: string;
  numero_identificacao_campo: string;
  tipo: 'ensaiada' | 'indeformada';
}

const NovoEnsaioPage: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { usuario } = useAuth();
  const { ensaioId } = useParams<{ ensaioId?: string }>();
  const isEdicao = !!ensaioId;
  const queryParams = new URLSearchParams(location.search);
  const amostraPreSelecionada = queryParams.get('amostra') || '';
  const [tipoEnsaio, setTipoEnsaio] = useState<TipoEnsaioDestino>('teor_umidade');
  const [norma, setNorma] = useState('ABNT NBR 6457');
  const [amostrasDisponiveis, setAmostrasDisponiveis] = useState<AmostraDisponivel[]>([]);
  const [idAmostraEnsaiada, setIdAmostraEnsaiada] = useState(amostraPreSelecionada);
  const [idAmostraIndeformada, setIdAmostraIndeformada] = useState('');
  const [mostrarSheetAmostra, setMostrarSheetAmostra] = useState(false);
  const [executantes, setExecutantes] = useState<{ id: string; nome: string; sobrenome: string }[]>([]);
  const [idExecutante, setIdExecutante] = useState('');
  const [tempAmbiente, setTempAmbiente] = useState('');
  const [umidadeAmbiente, setUmidadeAmbiente] = useState('');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [toastColor, setToastColor] = useState<string>('success');
  useEffect(() => {
    if (isEdicao && ensaioId) {
      EnsaioBaseService.obterEnsaioDetalhado(ensaioId).then((e) => {
        if (e) {
          setTipoEnsaio(e.tipo_ensaio);
          setNorma(e.norma_referencia || '');
          setIdAmostraEnsaiada(e.id_amostra_ensaiada || '');
          setIdAmostraIndeformada(e.id_amostra_indeformada || '');
          setIdExecutante(e.id_executante);
          setTempAmbiente(e.temperatura_ambiente ? String(e.temperatura_ambiente) : '');
          setUmidadeAmbiente(e.umidade_ambiente ? String(e.umidade_ambiente) : '');
          setObs(e.observacoes || '');
        }
      }).catch(() => {});
    }
    queryRows<{ id: string; nome: string; sobrenome: string }>(
      "SELECT id, nome, sobrenome FROM usuarios WHERE status = 'ativo' ORDER BY nome ASC"
    ).then(setExecutantes).catch(() => {});
  }, [ensaioId]);

  useEffect(() => {
    const carregarAmostras = async () => {
      try {
        const ensaiadas = await queryRows<AmostraDisponivel>(
          `SELECT ae.id, ae.numero_amostra, pesq.titulo AS pesquisa_titulo,
                  ab.numero_identificacao_campo, 'ensaiada' AS tipo
           FROM amostras_ensaiadas ae
           INNER JOIN amostras_preparadas ap ON ae.id_amostra_preparada = ap.id
           INNER JOIN amostras_brutas ab ON ap.id_amostra_bruta = ab.id
           INNER JOIN pontos_coleta pt ON ab.id_ponto_coleta = pt.id
           INNER JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id
           INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id
           WHERE ae.tipo_ensaio_destino = ?
             AND (NOT EXISTS (SELECT 1 FROM ensaios WHERE id_amostra_ensaiada = ae.id)
                  ${isEdicao && idAmostraEnsaiada ? 'OR ae.id = ?' : ''})
           ORDER BY ae.numero_amostra ASC`,
          isEdicao && idAmostraEnsaiada
            ? [tipoEnsaio, idAmostraEnsaiada]
            : [tipoEnsaio]
        );

        const indeformadas = await queryRows<AmostraDisponivel>(
          `SELECT ai.id, ai.numero_amostra, pesq.titulo AS pesquisa_titulo,
                  ab.numero_identificacao_campo, 'indeformada' AS tipo
           FROM amostras_indeformadas ai
           INNER JOIN amostras_brutas ab ON ai.id_amostra_bruta = ab.id
           INNER JOIN pontos_coleta pt ON ab.id_ponto_coleta = pt.id
           INNER JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id
           INNER JOIN pesquisas pesq ON prog.id_pesquisa = pesq.id
           WHERE (NOT EXISTS (SELECT 1 FROM ensaios WHERE id_amostra_indeformada = ai.id)
                  ${isEdicao && idAmostraIndeformada ? 'OR ai.id = ?' : ''})
           ORDER BY ai.numero_amostra ASC`,
          isEdicao && idAmostraIndeformada ? [idAmostraIndeformada] : []
        );

        setAmostrasDisponiveis([...ensaiadas, ...indeformadas]);
        if (!isEdicao && amostraPreSelecionada) {
          const todas = [...ensaiadas, ...indeformadas];
          const pre = todas.find(a => a.id === amostraPreSelecionada);
          if (pre) {
            if (pre.tipo === 'ensaiada') {
              setIdAmostraEnsaiada(pre.id);
              setIdAmostraIndeformada('');
            } else {
              setIdAmostraIndeformada(pre.id);
              setIdAmostraEnsaiada('');
            }
          }
        } else if (!isEdicao) {
          setIdAmostraEnsaiada('');
          setIdAmostraIndeformada('');
        }
      } catch { /* */ }
    };
    carregarAmostras();
  }, [tipoEnsaio]);

  const amostraSelecionada = amostrasDisponiveis.find(
    (a) => a.id === idAmostraEnsaiada || a.id === idAmostraIndeformada
  );

  const handleSelecionarAmostra = (a: AmostraDisponivel) => {
    setMostrarSheetAmostra(false);
    if (a.tipo === 'ensaiada') {
      setIdAmostraEnsaiada(a.id);
      setIdAmostraIndeformada('');
    } else {
      setIdAmostraIndeformada(a.id);
      setIdAmostraEnsaiada('');
    }
  };

  const handleSave = async () => {
    if (!usuario || !idExecutante) return;
    if (!idAmostraEnsaiada && !idAmostraIndeformada) return;
    setSaving(true);
    try {
      const dados: CriarEnsaioDTO = {
        tipoEnsaio,
        normaReferencia: norma || undefined,
        idAmostraEnsaiada: idAmostraEnsaiada || undefined,
        idAmostraIndeformada: idAmostraIndeformada || undefined,
        idExecutante,
        temperaturaAmbiente: tempAmbiente ? parseFloat(tempAmbiente) : undefined,
        umidadeAmbiente: umidadeAmbiente ? parseFloat(umidadeAmbiente) : undefined,
        observacoes: obs.trim() || undefined,
      };
      if (isEdicao && ensaioId) {
        await EnsaioBaseService.editarEnsaio(ensaioId, dados, usuario.userId);
        setToastColor('success'); setToastMsg('Ensaio atualizado.');
      } else {
        await EnsaioBaseService.criarEnsaio(dados, usuario.userId);
        setToastColor('success'); setToastMsg('Ensaio criado.');
      }
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setToastMsg(err.message || 'Erro ao criar ensaio.');
      setShowToast(true);
    }
    setSaving(false);
  };

  const handleFinalizar = async () => {
    if (!usuario || !idExecutante) return;
    if (!idAmostraEnsaiada && !idAmostraIndeformada) return;
    setSaving(true);
    try {
      const dados: CriarEnsaioDTO = { tipoEnsaio, normaReferencia: norma || undefined, idAmostraEnsaiada: idAmostraEnsaiada || undefined, idAmostraIndeformada: idAmostraIndeformada || undefined, idExecutante, temperaturaAmbiente: tempAmbiente ? parseFloat(tempAmbiente) : undefined, umidadeAmbiente: umidadeAmbiente ? parseFloat(umidadeAmbiente) : undefined, observacoes: obs.trim() || undefined };
      if (isEdicao && ensaioId) {
        await EnsaioBaseService.editarEnsaio(ensaioId, dados, usuario.userId);
        await EnsaioBaseService.finalizarEnsaio(ensaioId, usuario.userId);
        setToastColor('success'); setToastMsg('Salvo e finalizado.');
      } else {
        const novo = await EnsaioBaseService.criarEnsaio(dados, usuario.userId);
        await EnsaioBaseService.finalizarEnsaio(novo.id, usuario.userId);
        setToastColor('success'); setToastMsg('Criado e finalizado.');
      }
      setShowToast(true);
      setTimeout(() => history.goBack(), 800);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setToastMsg(err.message || 'Erro ao finalizar.');
      setShowToast(true);
    }
    setSaving(false);
  };

  return (
    <IonPage>
      <AppBar title={isEdicao ? 'Editar Ensaio' : 'Novo Ensaio'} />
      <IonContent>
        <div style={{ padding: 16 }}>
          <IonItem><IonLabel position="stacked">Tipo de Ensaio *</IonLabel>
            <IonSelect value={tipoEnsaio} onIonChange={(e) => { setTipoEnsaio(e.detail.value); const op = TIPO_ENSAIO_OPCOES.find((o) => o.value === e.detail.value); setNorma(op?.norma || ''); }}>
              {TIPO_ENSAIO_OPCOES.map((op) => <IonSelectOption key={op.value} value={op.value}>{op.label}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
          <IonItem><IonLabel position="stacked">Norma de Referência</IonLabel><IonInput value={norma} onIonInput={(e) => setNorma(e.detail.value || '')} /></IonItem>

          <IonItem button onClick={() => setMostrarSheetAmostra(true)}>
            <IonLabel position="stacked">Amostra</IonLabel>
            <div style={{ fontSize: 14, padding: '8px 0' }}>
              {amostraSelecionada
                ? `${amostraSelecionada.numero_amostra} (${amostraSelecionada.numero_identificacao_campo}) — ${amostraSelecionada.pesquisa_titulo}`
                : `${amostrasDisponiveis.length} amostra(s) disponiveis — toque para selecionar`}
            </div>
          </IonItem>

          <IonItem><IonLabel position="stacked">Executante *</IonLabel>
            <IonSelect value={idExecutante} onIonChange={(e) => setIdExecutante(e.detail.value)}>
              {executantes.map((u) => <IonSelectOption key={u.id} value={u.id}>{u.nome} {u.sobrenome}</IonSelectOption>)}
            </IonSelect>
          </IonItem>
          <IonItem><IonLabel position="stacked">Temperatura Ambiente (°C)</IonLabel><IonInput type="number" value={tempAmbiente} onIonInput={(e) => setTempAmbiente(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Umidade Ambiente (%)</IonLabel><IonInput type="number" value={umidadeAmbiente} onIonInput={(e) => setUmidadeAmbiente(e.detail.value || '')} /></IonItem>
          <IonItem><IonLabel position="stacked">Observações</IonLabel><IonInput value={obs} onIonInput={(e) => setObs(e.detail.value || '')} /></IonItem>
          <div style={{ padding: '16px 8px', display: 'flex', gap: 8 }}>
            <IonButton expand="block" onClick={handleSave} disabled={!idExecutante || (!idAmostraEnsaiada && !idAmostraIndeformada) || saving} fill="outline" style={{ flex: 1 }}>
              {saving ? <IonSpinner /> : 'Salvar'}
            </IonButton>
            <IonButton expand="block" onClick={handleFinalizar} disabled={!idExecutante || (!idAmostraEnsaiada && !idAmostraIndeformada) || saving} fill="solid" style={{ flex: 1 }}>
              Finalizar
            </IonButton>
          </div>
        </div>

        <IonActionSheet
          isOpen={mostrarSheetAmostra}
          onDidDismiss={() => setMostrarSheetAmostra(false)}
          header="Selecionar Amostra"
          buttons={[
            ...amostrasDisponiveis.map((a) => ({
              text: `${a.numero_amostra} (${a.numero_identificacao_campo}) — ${a.pesquisa_titulo}`,
              handler: () => handleSelecionarAmostra(a),
            })),
            { text: 'Cancelar', role: 'cancel' },
          ]}
        />

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default NovoEnsaioPage;