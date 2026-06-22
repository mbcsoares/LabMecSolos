import React, { useState, useEffect } from 'react';
import {
  IonIcon, IonSpinner, IonButton, IonModal, IonContent,
} from '@ionic/react';
import { cameraOutline, imageOutline, trashOutline, closeOutline } from 'ionicons/icons';
import { ImagemService } from '../services/ImagemService';
import type { Imagem, EntidadeTipoImagem } from '../models/types';

interface Props {
  entidadeTipo: EntidadeTipoImagem;
  entidadeId: string;
  editavel?: boolean;
  idAutor?: string;
  onAdicionar?: () => void;
}

const GaleriaImagens: React.FC<Props> = ({ entidadeTipo, entidadeId, editavel, idAutor, onAdicionar }) => {
  const [imagens, setImagens] = useState<Imagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagemAmpliada, setImagemAmpliada] = useState<Imagem | null>(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const result = await ImagemService.listarPorEntidade(entidadeTipo, entidadeId);
      setImagens(result);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [entidadeTipo, entidadeId]);

  const handleExcluir = async (imgId: string) => {
    try {
      await ImagemService.excluir(imgId, idAutor || '');
      setImagens((prev) => prev.filter((i) => i.id !== imgId));
    } catch { /* */ }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
        <IonSpinner name="crescent" color="primary" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {editavel && onAdicionar && (
          <div
            onClick={onAdicionar}
            style={{
              aspectRatio: '1',
              borderRadius: 8,
              border: '2px dashed var(--ion-color-medium)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              backgroundColor: '#F8F9FA',
            }}
          >
            <IonIcon icon={cameraOutline} style={{ fontSize: 28, color: 'var(--ion-color-medium)' }} />
            <span style={{ fontSize: 11, color: 'var(--ion-color-medium)', marginTop: 4 }}>Adicionar</span>
          </div>
        )}
        {imagens.map((img) => (
          <div
            key={img.id}
            onClick={() => setImagemAmpliada(img)}
            style={{
              position: 'relative',
              aspectRatio: '1',
              borderRadius: 8,
              overflow: 'hidden',
              backgroundColor: '#E8EDF6',
            }}
          >
            <img
              src={img.url}
              alt={img.descricao || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {editavel && (
              <button
                onClick={() => handleExcluir(img.id)}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  borderRadius: 4,
                  padding: 4,
                  cursor: 'pointer',
                  color: '#FFF',
                }}
              >
                <IonIcon icon={trashOutline} style={{ fontSize: 14 }} />
              </button>
            )}
          </div>
        ))}
      </div>

      {imagens.length === 0 && !(editavel && onAdicionar) && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <IonIcon icon={imageOutline} style={{ fontSize: 36, color: 'var(--ion-color-medium)', marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: 0 }}>Nenhuma imagem registrada.</p>
        </div>
      )}

      <IonModal isOpen={!!imagemAmpliada} onDidDismiss={() => setImagemAmpliada(null)}>
        <IonContent style={{ '--background': '#000' } as React.CSSProperties}>
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <IonButton
              fill="clear"
              onClick={() => setImagemAmpliada(null)}
              style={{
                position: 'absolute', top: 8, right: 8, zIndex: 10,
                '--color': '#FFF',
              } as React.CSSProperties}
            >
              <IonIcon icon={closeOutline} slot="icon-only" style={{ fontSize: 24 }} />
            </IonButton>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
              {imagemAmpliada && (
                <img
                  src={imagemAmpliada.url}
                  alt={imagemAmpliada.descricao || ''}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
            {imagemAmpliada?.descricao && (
              <p style={{
                textAlign: 'center', color: '#FFF', fontSize: 13,
                padding: '12px 16px', margin: 0, opacity: 0.8,
              }}>
                {imagemAmpliada.descricao}
              </p>
            )}
          </div>
        </IonContent>
      </IonModal>
    </div>
  );
};

export default GaleriaImagens;
