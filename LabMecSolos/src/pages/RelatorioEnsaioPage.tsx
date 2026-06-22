import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner, IonButton, IonToast, IonIcon } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { downloadOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import { EnsaioBaseService } from '../services/EnsaioBaseService';
import { TeorUmidadeService } from '../services/TeorUmidadeService';
import { RelatorioEnsaioService } from '../services/RelatorioEnsaioService';
import { exportarPDF } from '../services/PdfBaseService';
import { useAuth } from '../contexts/AuthContext';
import type { DeterminacaoTeorUmidade } from '../models/types';

const RelatorioEnsaioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const gerar = async () => {
      if (!id) return;
      try {
        const ensaio = await EnsaioBaseService.obterEnsaioDetalhado(id);
        if (!ensaio) {
          setToastMsg('Ensaio não encontrado.');
          setShowToast(true);
          setLoading(false);
          return;
        }

        if (ensaio.status !== 'concluido') {
          setToastMsg('Apenas ensaios concluídos geram relatório.');
          setShowToast(true);
          setLoading(false);
          return;
        }

        let determinacoes: DeterminacaoTeorUmidade[] | undefined;
        if (ensaio.tipo_ensaio === 'teor_umidade') {
          determinacoes = await TeorUmidadeService.listarDeterminacoes(id);
        }

        const url = await RelatorioEnsaioService.gerarRelatorioEnsaio(ensaio, determinacoes, usuario?.userId);
        setDataUrl(url);
      } catch (e: any) {
        const msg = e?.message || String(e);
        console.error('ERRO PDF ENSAIO:', msg, e);
        setToastMsg(msg || 'Erro ao gerar relatório.');
        setShowToast(true);
      }
      setLoading(false);
    };
    gerar();
  }, [id]);

  const handleExportar = async () => {
    if (!dataUrl) return;
    setExporting(true);
    try {
      const nomeArquivo = `ensaio_${id?.slice(0, 8)}.pdf`;
      await exportarPDF(dataUrl, nomeArquivo);
      setToastMsg('PDF exportado com sucesso.');
      setShowToast(true);
    } catch (e: any) {
      setToastMsg(e.message || 'Erro ao exportar PDF.');
      setShowToast(true);
    }
    setExporting(false);
  };

  return (
    <IonPage>
      <AppBar title="Relatório de Ensaio" />
      <IonContent>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 16 }}>
            <IonSpinner name="crescent" color="primary" />
            <p style={{ fontSize: 14, color: 'var(--ion-color-medium)', margin: 0 }}>Gerando relatório...</p>
          </div>
        ) : dataUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'flex-end' }}>
              <IonButton size="small" fill="outline" onClick={handleExportar} disabled={exporting}>
                <IonIcon slot="start" icon={downloadOutline} />
                {exporting ? 'Exportando...' : 'Exportar PDF'}
              </IonButton>
            </div>
            <iframe
              src={dataUrl}
              style={{ flex: 1, width: '100%', border: 'none', minHeight: '80vh' }}
              title="Relatório de Ensaio"
            />
          </div>
        ) : null}
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default RelatorioEnsaioPage;
