import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonButton, IonSpinner, IonToast, IonIcon,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { downloadOutline, shareOutline } from 'ionicons/icons';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { InventarioService } from '../services/InventarioService';
import { useAuth } from '../contexts/AuthContext';
import AppBar from '../components/AppBar';
import type { ItemDetalhado } from '../models/types';

const QRCodeVisualizacaoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const [item, setItem] = useState<ItemDetalhado | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [gerando, setGerando] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const load = async () => {
      const it = await InventarioService.obterItem(id);
      setItem(it);
      if (it && usuario?.userId) {
        try {
          const dataUrl = await InventarioService.gerarQRCode(id, usuario.userId);
          setQrDataUrl(dataUrl);
        } catch { /* fallback */ }
      }
      setGerando(false);
    };
    load();
  }, [id, usuario?.userId]);

  const handleSalvar = async () => {
    if (!qrDataUrl) return;
    const nomeArquivo = `QRCode_${item?.codigo || id}.png`;
    const isNative = Capacitor.getPlatform() !== 'web';

    try {
      if (isNative) {
        const base64 = qrDataUrl.split(',')[1] || qrDataUrl;
        await Filesystem.writeFile({
          path: `Download/${nomeArquivo}`,
          data: base64,
          directory: Directory.ExternalStorage,
          recursive: true,
        });
        setToast(`Imagem salva em Download/${nomeArquivo}`);
      } else {
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setToast('Imagem salva com sucesso.');
      }
    } catch {
      setToast('Erro ao salvar imagem.');
    }
  };

  const handleCompartilhar = async () => {
    if (!qrDataUrl) return;

    try {
      const blob = await (await fetch(qrDataUrl)).blob();
      const file = new File([blob], `QRCode_${item?.codigo || id}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: `QR Code: ${item?.nome}`,
          text: `QR Code do equipamento ${item?.codigo}`,
          files: [file],
        });
      } else {
        setToast('Compartilhamento nao disponivel neste dispositivo.');
      }
    } catch (e: unknown) {
      const err = e as { message?: string; name?: string };
      if (err?.message?.includes('cancel') || err?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(item?.codigo || id);
        setToast('Codigo copiado para a area de transferencia.');
      } catch {
        setToast('Erro ao compartilhar.');
      }
    }
  };

  if (!item || gerando) {
    return (
      <IonPage>
        <AppBar title="QR Code" />
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
      <AppBar title={`QR Code: ${item.nome}`} />
      <IonContent>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 32, textAlign: 'center',
        }}>
          <div style={{
            width: 224, height: 224, backgroundColor: '#ffffff',
            borderRadius: 12, display: 'flex', justifyContent: 'center',
            alignItems: 'center', border: '2px solid #E0E0E0',
            marginBottom: 16, padding: 12,
          }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200 }} />
            ) : (
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ion-color-medium)' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>&#9633;</div>
                <div>QR Code</div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ion-color-dark)', marginBottom: 4 }}>
            {item.nome}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ion-color-medium)', marginBottom: 16 }}>
            Codigo: {item.codigo}
          </div>
          <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: '0 0 24px 0' }}>
            Escaneie este codigo para acessar a ficha do equipamento.
          </p>
          <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 320 }}>
            <IonButton expand="block" fill="outline" color="primary" onClick={handleSalvar} style={{ flex: 1 }}>
              <IonIcon slot="start" icon={downloadOutline} />
              Salvar Imagem
            </IonButton>
            <IonButton expand="block" fill="solid" color="primary" onClick={handleCompartilhar} style={{ flex: 1 }}>
              <IonIcon slot="start" icon={shareOutline} />
              Compartilhar
            </IonButton>
          </div>
        </div>

        <IonToast
          isOpen={!!toast}
          message={toast}
          duration={2500}
          onDidDismiss={() => setToast('')}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default QRCodeVisualizacaoPage;
