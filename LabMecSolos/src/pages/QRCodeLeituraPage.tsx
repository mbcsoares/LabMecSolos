import React, { useState } from 'react';
import {
  IonPage, IonContent, IonInput, IonButton, IonIcon, IonSpinner, IonToast,
} from '@ionic/react';
import { searchOutline, cameraOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import AppBar from '../components/AppBar';
import { getDatabase } from '../services/DatabaseService';
import { LogService } from '../services/LogService';
import { useAuth } from '../contexts/AuthContext';

const QRCodeLeituraPage: React.FC = () => {
  const history = useHistory();
  const { usuario } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [scannando, setScannando] = useState(false);
  const [toast, setToast] = useState('');

  const buscarPorCodigo = async (codigoBusca: string) => {
    setErro('');
    if (!codigoBusca.trim()) {
      setErro('Digite um codigo.');
      return;
    }

    const db = await getDatabase();
    const result = await db.query('SELECT id FROM itens WHERE codigo = ?', [codigoBusca.trim()]);
    if (result.values && result.values.length > 0) {
      const idItem = result.values[0].id as string;
      if (usuario?.userId) {
        await LogService.registrar('estoque', 'qr_code_lido', usuario.userId, null, null, null, { id_equipamento: idItem });
      }
      history.push(`/app/inventario/item/${idItem}`);
    } else {
      setErro('Equipamento nao encontrado.');
    }
  };

  const buscarPorId = async (idItem: string) => {
    const db = await getDatabase();
    const result = await db.query('SELECT id FROM itens WHERE id = ?', [idItem]);
    if (result.values && result.values.length > 0) {
      if (usuario?.userId) {
        await LogService.registrar('estoque', 'qr_code_lido', usuario.userId, null, null, null, { id_equipamento: idItem });
      }
      history.push(`/app/inventario/item/${idItem}`);
    } else {
      setErro('Equipamento nao encontrado pelo QR Code.');
    }
  };

  const processarCodigo = async (scannedValue: string) => {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scannedValue)) {
      await buscarPorId(scannedValue);
    } else {
      await buscarPorCodigo(scannedValue);
    }
  };

  const handleBuscar = async () => {
    await buscarPorCodigo(codigo);
  };

  const handleScan = async () => {
    setErro('');
    const isNative = Capacitor.getPlatform() !== 'web';

    if (!isNative) {
      setToast('A leitura por camera esta disponivel apenas no aplicativo Android. Use o campo de texto abaixo.');
      return;
    }

    try {
      setScannando(true);

      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.ALL,
        scanInstructions: 'Aponte a camera para o QR Code',
      });
      setScannando(false);

      const scannedValue = result.ScanResult || '';
      if (!scannedValue) {
        setErro('Nenhum codigo detectado.');
        return;
      }

      await processarCodigo(scannedValue);
    } catch (e: unknown) {
      setScannando(false);
      const err = e as { message?: string };
      if (err?.message?.includes('cancel') || err?.message?.includes('Cancel')) {
        return;
      }
      setErro('Erro ao escanear. Tente novamente.');
    }
  };

  return (
    <IonPage>
      <AppBar title="Escanear QR Code" />
      <IonContent>
        <div style={{
          padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        }}>
          <div onClick={handleScan} style={{
            width: 120, height: 120, border: `3px solid ${scannando ? 'var(--ion-color-warning)' : 'var(--ion-color-primary)'}`,
            borderRadius: 12, margin: '0 auto 24px', display: 'flex',
            justifyContent: 'center', alignItems: 'center', cursor: 'pointer',
            opacity: scannando ? 0.7 : 1,
          }}>
            {scannando ? (
              <IonSpinner name="crescent" color="warning" />
            ) : (
              <div style={{
                width: 80, height: 80, border: '2px dashed var(--ion-color-medium)',
                borderRadius: 4, display: 'flex', justifyContent: 'center', alignItems: 'center',
              }}>
                <IonIcon icon={cameraOutline} style={{ fontSize: 32, color: 'var(--ion-color-primary)' }} />
              </div>
            )}
          </div>

          <IonButton
            expand="block" fill="solid" onClick={handleScan}
            disabled={scannando}
            style={{ width: '100%', maxWidth: 280, marginBottom: 8 }}
          >
            <IonIcon slot="start" icon={cameraOutline} />
            {scannando ? 'Escaneando...' : 'Escanear com Camera'}
          </IonButton>

          <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: '0 0 20px 0' }}>
            ou digite o codigo manualmente
          </p>

          <IonInput
            value={codigo}
            onIonInput={(e) => { setCodigo(e.detail.value || ''); setErro(''); }}
            placeholder="Codigo do equipamento"
            onKeyDown={(e) => { if (e.key === 'Enter') handleBuscar(); }}
            style={{
              border: `1px solid ${erro ? '#C0392B' : '#E0E0E0'}`,
              borderRadius: 8, padding: '8px 16px', width: '100%', maxWidth: 280,
              fontSize: 15, textAlign: 'center', marginBottom: 8,
            }}
          />
          {erro && <p style={{ fontSize: 12, color: '#C0392B', margin: '0 0 8px 0' }}>{erro}</p>}
          <IonButton expand="block" onClick={handleBuscar} disabled={!codigo.trim()} style={{ width: '100%', maxWidth: 280 }}>
            <IonIcon slot="start" icon={searchOutline} />
            Buscar Equipamento
          </IonButton>
        </div>

        <IonToast
          isOpen={!!toast}
          message={toast}
          duration={3000}
          onDidDismiss={() => setToast('')}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default QRCodeLeituraPage;
