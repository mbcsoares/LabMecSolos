import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner, IonButton, IonToast, IonIcon } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { downloadOutline } from 'ionicons/icons';
import AppBar from '../components/AppBar';
import { PesquisaService } from '../services/PesquisaService';
import { RelatorioEnsaioService } from '../services/RelatorioEnsaioService';
import { exportarPDF } from '../services/PdfBaseService';
import { queryRows } from '../services/DatabaseService';
import { useAuth } from '../contexts/AuthContext';
import type { EnsaioDetalhado } from '../models/types';

const RelatorioPesquisaPage: React.FC = () => {
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
        const pesquisa = await PesquisaService.obterPorId(id);
        if (!pesquisa) {
          setToastMsg('Pesquisa não encontrada.');
          setShowToast(true);
          setLoading(false);
          return;
        }

        const programas = await PesquisaService.listarProgramas(id);

        const todosEnsaios = await queryRows<EnsaioDetalhado>(`
          SELECT DISTINCT e.*
          FROM ensaios e
          LEFT JOIN amostras_ensaiadas ae ON e.id_amostra_ensaiada = ae.id
          LEFT JOIN amostras_preparadas ap ON ae.id_amostra_preparada = ap.id
          LEFT JOIN amostras_brutas ab1 ON ap.id_amostra_bruta = ab1.id
          LEFT JOIN amostras_indeformadas ai ON e.id_amostra_indeformada = ai.id
          LEFT JOIN amostras_brutas ab2 ON ai.id_amostra_bruta = ab2.id
          LEFT JOIN pontos_coleta pt ON (ab1.id_ponto_coleta = pt.id OR ab2.id_ponto_coleta = pt.id)
          LEFT JOIN programas_amostragem prog ON pt.id_programa_amostragem = prog.id
          WHERE prog.id_pesquisa = ?
          ORDER BY e.tipo_ensaio ASC
        `, [id]);

        const url = await RelatorioEnsaioService.gerarRelatorioPesquisa(pesquisa, programas, todosEnsaios, usuario?.userId);
        setDataUrl(url);
      } catch (e: any) {
        const msg = e?.message || String(e);
        console.error('ERRO PDF PESQUISA:', msg, e);
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
      const nomeArquivo = `pesquisa_${id?.slice(0, 8)}.pdf`;
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
      <AppBar title="Relatório Consolidado" />
      <IonContent>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 16 }}>
            <IonSpinner name="crescent" color="primary" />
            <p style={{ fontSize: 14, color: 'var(--ion-color-medium)', margin: 0 }}>Gerando relatório consolidado...</p>
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
              title="Relatório Consolidado"
            />
          </div>
        ) : null}
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default RelatorioPesquisaPage;
