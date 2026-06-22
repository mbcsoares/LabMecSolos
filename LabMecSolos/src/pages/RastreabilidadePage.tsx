import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner, IonToast } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import AppBar from '../components/AppBar';
import TimelineNode from '../components/TimelineNode';
import { AmostragemService } from '../services/AmostragemService';
import type { Rastreabilidade as RastreabilidadeType } from '../models/types';

const RastreabilidadePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [data, setData] = useState<RastreabilidadeType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const r = await AmostragemService.obterRastreabilidade(id);
        setData(r);
      } catch {
        setToastMsg('Erro ao carregar rastreabilidade.');
        setShowToast(true);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <IonPage><AppBar title="Rastreabilidade" /><IonContent><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><IonSpinner name="crescent" color="primary" /></div></IonContent></IonPage>
    );
  }

  if (!data) {
    return (
      <IonPage><AppBar title="Rastreabilidade" /><IonContent><div style={{ textAlign: 'center', padding: 48 }}><p style={{ color: 'var(--ion-color-medium)' }}>Dados de rastreabilidade não encontrados.</p></div></IonContent></IonPage>
    );
  }

  const statusColor = (status: string) => {
    const map: Record<string, string> = { em_andamento: '#0095DB', concluida: '#009d43', cancelada: '#898888', coletada: '#0095DB', preparada: '#E6A817', ensaiada: '#009d43', descartada: '#898888' };
    return map[status] || '#898888';
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = { em_andamento: 'Em Andamento', concluida: 'Concluída', cancelada: 'Cancelada', coletada: 'Coletada', preparada: 'Preparada', ensaiada: 'Ensaiada', descartada: 'Descartada', nao_iniciado: 'Não Iniciado', em_andamento_e: 'Em Andamento', concluido: 'Concluído', cancelado: 'Cancelado' };
    return map[status] || status;
  };

  return (
    <IonPage>
      <AppBar title="Rastreabilidade" />
      <IonContent>
        <div style={{ padding: 16 }}>
          <TimelineNode ativo={true} icone="📄" titulo={data.pesquisa_titulo} subtitulos={[]} statusColor={statusColor('em_andamento')} statusLabel="Pesquisa" />
          <TimelineNode ativo={true} icone="📑" titulo={data.programa_objetivo || 'Programa'} subtitulos={[]} statusLabel="Programa" />
          <TimelineNode ativo={true} icone="📍" titulo={data.identificacao_plano} subtitulos={[]} statusLabel="Ponto" />
          <TimelineNode
            ativo={true}
            icone="🧱"
            titulo={data.numero_identificacao_campo}
            subtitulos={[
              `Tipo: ${data.tipo_amostra === 'deformada' ? 'Deformada' : 'Indeformada'}`,
              `Coleta: ${data.data_coleta ? new Date(data.data_coleta).toLocaleDateString('pt-BR') : '—'}`,
              data.coordenadas_gps ? `GPS: ${data.coordenadas_gps}` : '',
            ]}
            statusColor={statusColor(data.status)}
            statusLabel={statusLabel(data.status)}
          />

          {data.preparada_id && (
            <TimelineNode
              ativo={true}
              icone="🧪"
              titulo={data.preparada_numero || 'Amostra Preparada'}
              subtitulos={[`Método: ${data.metodo_preparo || '—'}`]}
              statusLabel="Preparada"
            />
          )}

          {data.ensaiada_id && (
            <TimelineNode
              ativo={true}
              icone="⚗️"
              titulo={data.ensaiada_numero || 'Amostra Ensaiada'}
              subtitulos={[`Ensaio: ${data.tipo_ensaio_destino || '—'}`]}
              statusLabel="Ensaiada"
            />
          )}

          {data.indeformada_id && (
            <TimelineNode
              ativo={true}
              icone="🔬"
              titulo={data.indeformada_numero || 'Amostra Indeformada'}
              subtitulos={[]}
              statusLabel="Indeformada"
            />
          )}

          {data.ensaio_id && (
            <TimelineNode
              ativo={true}
              icone="📊"
              titulo={data.tipo_ensaio || 'Ensaio'}
              subtitulos={[
                data.data_inicio ? `Início: ${new Date(data.data_inicio).toLocaleDateString('pt-BR')}` : '',
                data.data_fim ? `Fim: ${new Date(data.data_fim).toLocaleDateString('pt-BR')}` : '',
              ].filter(Boolean)}
              statusColor={statusColor(data.ensaio_status || '')}
              statusLabel={statusLabel(data.ensaio_status || '')}
            />
          )}
        </div>
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default RastreabilidadePage;
