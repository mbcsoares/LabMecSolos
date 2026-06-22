import React, { useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { locateOutline } from 'ionicons/icons';
import { GPSService } from '../services/GPSService';

interface Props {
  valor: string | null;
  onCapturar: (coordenadas: string) => void;
}

const CoordenadasGPS: React.FC<Props> = ({ valor, onCapturar }) => {
  const [capturando, setCapturando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleCapturar = async () => {
    setCapturando(true);
    setErro(null);
    try {
      const coords = await GPSService.capturarCoordenadas();
      const formato = GPSService.formatarParaArmazenamento(coords.latitude, coords.longitude);
      onCapturar(formato);
    } catch (e: any) {
      setErro(e.message || 'Erro ao capturar coordenadas.');
    }
    setCapturando(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--app-color-border)',
            fontSize: 13,
            color: valor ? 'var(--ion-color-dark)' : 'var(--ion-color-medium)',
            backgroundColor: 'var(--ion-background-color)',
            minHeight: 40,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {valor || 'Latitude, Longitude'}
        </div>

        <button
          onClick={handleCapturar}
          disabled={capturando}
          style={{
            background: 'var(--ion-color-primary)',
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
            opacity: capturando ? 0.6 : 1,
          }}
        >
          {capturando ? (
            <IonSpinner name="crescent" style={{ width: 16, height: 16 }} />
          ) : (
            <IonIcon icon={locateOutline} style={{ fontSize: 16 }} />
          )}
          GPS
        </button>
      </div>

      {erro && (
        <div style={{ fontSize: 12, color: 'var(--app-color-error)', marginTop: 4 }}>
          {erro}
        </div>
      )}
    </div>
  );
};

export default CoordenadasGPS;
