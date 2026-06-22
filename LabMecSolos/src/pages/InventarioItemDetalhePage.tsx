import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonCard, IonCardContent, IonList, IonItem,
  IonLabel, IonButton, IonIcon, IonSpinner, IonToast, IonActionSheet,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  arrowBackOutline, removeCircleOutline,
  constructOutline, createOutline, trashOutline, timeOutline,
  qrCodeOutline, flagOutline, cubeOutline,
  checkmarkCircleOutline, cameraOutline, imageOutline,
} from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import { useAuth } from '../contexts/AuthContext';
import { InventarioService } from '../services/InventarioService';
import { ImagemService } from '../services/ImagemService';
import { queryRows } from '../services/DatabaseService';
import TipoBadge from '../components/TipoBadge';
import EstadoBadge from '../components/EstadoBadge';
import EstoqueIndicator from '../components/EstoqueIndicator';
import CalibracaoIndicator from '../components/CalibracaoIndicator';
import GaleriaImagens from '../components/GaleriaImagens';
import ConfirmacaoSenhaDialog from '../components/ConfirmacaoSenhaDialog';
import RegistrarCalibracaoDialog from '../components/RegistrarCalibracaoDialog';
import type { ItemDetalhado } from '../models/types';

function formatarData(iso: string | null): string {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('pt-BR') + ' ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const InventarioItemDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { usuario } = useAuth();
  const isColaborador = usuario?.permissao === 'colaborador' || usuario?.permissao === 'chefia';

  const [item, setItem] = useState<ItemDetalhado | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSenhaDialog, setShowSenhaDialog] = useState(false);
  const [showCalibracaoDialog, setShowCalibracaoDialog] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<string>('success');
  const [numOcorrencias, setNumOcorrencias] = useState(0);
  const [showFotoSheet, setShowFotoSheet] = useState(false);
  const [galeriaKey, setGaleriaKey] = useState(0);

  const handleAdicionarFoto = () => setShowFotoSheet(true);

  const handleCapturarFoto = async (source: CameraSource) => {
    setShowFotoSheet(false);
    if (!usuario) return;

    try {
      const isNative = Capacitor.getPlatform() !== 'web';

      if (!isNative) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const file = target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async () => {
            if (reader.result) {
              await ImagemService.upload('item', id, reader.result as string, null, usuario.userId);
              setGaleriaKey((k) => k + 1);
            }
          };
          reader.readAsDataURL(file);
        };
        input.click();
        return;
      }

      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
      });

      if (photo.dataUrl) {
        await ImagemService.upload('item', id, photo.dataUrl, null, usuario.userId);
        setGaleriaKey((k) => k + 1);
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      if (err?.message?.includes('cancel') || err?.message?.includes('Cancel')) return;
      setToastMsg('Erro ao capturar imagem.');
      setShowToast(true);
    }
  };

  useEffect(() => {
    const load = async () => {
      const detalhe = await InventarioService.obterItem(id);
      setItem(detalhe);
      setLoading(false);

      if (detalhe) {
        const occ = await queryRows<{ total: number }>(
          'SELECT COUNT(*) as total FROM ocorrencias WHERE id_item = ?', [detalhe.id]
        );
        setNumOcorrencias(occ[0]?.total || 0);
      }
    };
    load();
  }, [id]);

  const handleDesativar = async (senha: string): Promise<boolean> => {
    if (!item || !usuario) return false;
    try {
      await InventarioService.desativarItem(item.id, usuario.userId, senha);
      setItem({ ...item, status: 'inativo' });
      setToastColor('success'); setToastMsg('Item desativado.');
      setShowToast(true);
      return true;
    } catch { return false; }
  };

  const handleReativar = async () => {
    if (!item || !usuario) return;
    try {
      await InventarioService.reativarItem(item.id, usuario.userId);
      setItem({ ...item, status: 'ativo' });
      setToastColor('success'); setToastMsg('Item reativado.');
      setShowToast(true);
    } catch { /* */ }
  };

  if (loading || !item) {
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

  const d = item as unknown as Record<string, unknown>;
  const qtd = d.quantidade_atual as number | undefined;
  const pp = d.ponto_pedido as number | null | undefined;
  const unidade = d.unidade_medida as string | undefined;
  const estado = d.estado as string | undefined;
  const dataCal = d.data_ultima_calibracao as string | null;
  const freqCal = d.frequencia_calibracao_dias as number | null;

  return (
    <IonPage>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 8px', background: 'var(--ion-color-primary)' }}>
        <button onClick={() => history.goBack()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FFFFFF', fontSize: 22, padding: '4px 8px' }}>
          <IonIcon icon={arrowBackOutline} />
        </button>
        <span style={{ fontSize: 18, fontWeight: 600, color: '#FFFFFF', flex: 1 }}>{item.nome}</span>
      </div>
      <IonContent>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <TipoBadge tipo={item.tipo} />
                {item.status === 'inativo' && (
                  <span style={{ fontSize: 12, color: '#C0392B', fontWeight: 600 }}>Item Inativo</span>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: 0 }}>
                Categoria: {item.categoria_nome || 'Sem categoria'}
              </p>
            </IonCardContent>
          </IonCard>

          <IonCard style={{ borderRadius: 12 }}>
            <IonCardContent style={{ padding: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)', padding: '12px 16px 0', margin: 0 }}>
                Informacoes Gerais
              </p>
              <IonList>
                <IonItem><IonLabel><small>Codigo</small><div>{item.codigo}</div></IonLabel></IonItem>
                <IonItem><IonLabel><small>Data de Cadastro</small><div>{formatarData(item.data_criacao)}</div></IonLabel></IonItem>
                <IonItem lines="none"><IonLabel><small>Ultima Atualizacao</small><div>{formatarData(item.data_atualizacao)}</div></IonLabel></IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>

          {item.tipo === 'material' && qtd !== undefined && (
            <IonCard style={{ borderRadius: 12 }}>
              <IonCardContent style={{ padding: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)', padding: '12px 16px 0', margin: 0 }}>
                  Material
                </p>
                <IonList>
                  <IonItem><IonLabel><small>Unidade</small><div>{unidade}</div></IonLabel></IonItem>
                  <IonItem><IonLabel><small>Estoque</small><div><EstoqueIndicator quantidade={qtd} pontoPedido={pp || null} unidade={unidade || ''} /></div></IonLabel></IonItem>
                  <IonItem lines="none"><IonLabel><small>Ponto de Pedido</small><div>{pp != null ? pp : 'Nao definido'}</div></IonLabel></IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>
          )}

          {item.tipo === 'utensilio' && qtd !== undefined && (
            <IonCard style={{ borderRadius: 12 }}>
              <IonCardContent style={{ padding: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)', padding: '12px 16px 0', margin: 0 }}>
                  Utensilio
                </p>
                <IonList>
                  <IonItem><IonLabel><small>Unidade</small><div>{unidade}</div></IonLabel></IonItem>
                  <IonItem><IonLabel><small>Estoque</small><div><EstoqueIndicator quantidade={qtd} pontoPedido={pp || null} unidade={unidade || ''} /></div></IonLabel></IonItem>
                  <IonItem><IonLabel><small>Ponto de Pedido</small><div>{pp != null ? pp : 'Nao definido'}</div></IonLabel></IonItem>
                  <IonItem lines="none"><IonLabel><small>Local</small><div>{(d.local_armazenamento as string) || 'Nao definido'}</div></IonLabel></IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>
          )}

          {item.tipo === 'equipamento' && (
            <IonCard style={{ borderRadius: 12 }}>
              <IonCardContent style={{ padding: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)', padding: '12px 16px 0', margin: 0 }}>
                  Equipamento
                </p>
                <IonList>
                  <IonItem><IonLabel><small>Estado</small><div>{estado ? <EstadoBadge estado={estado as never} /> : '\u2014'}</div></IonLabel></IonItem>
                  <IonItem><IonLabel><small>Numero de Serie</small><div>{(d.numero_serie as string) || '\u2014'}</div></IonLabel></IonItem>
                  <IonItem><IonLabel><small>Marca</small><div>{(d.marca as string) || '\u2014'}</div></IonLabel></IonItem>
                  <IonItem><IonLabel><small>Modelo</small><div>{(d.modelo as string) || '\u2014'}</div></IonLabel></IonItem>
                  <IonItem><IonLabel><small>Calibracao</small><div><CalibracaoIndicator dataUltima={dataCal} frequenciaDias={freqCal} /></div></IonLabel></IonItem>
                  <IonItem lines="none"><IonLabel><small>Especificacao</small><div>{(d.especificacao_tecnica as string) || '\u2014'}</div></IonLabel></IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>
          )}

          {isColaborador && (
            <IonCard style={{ borderRadius: 12 }}>
              <IonCardContent style={{ padding: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)', padding: '12px 16px 0', margin: '0 0 8px 0' }}>
                  Acoes
                </p>

                {(item.tipo === 'material' || item.tipo === 'utensilio') && (
                  <IonButton expand="block" fill="clear" onClick={() => history.push(`/app/inventario/item/${item.id}/movimentacoes`)}>
                    <IonIcon slot="start" icon={removeCircleOutline} />
                    Movimentacoes de Estoque
                  </IonButton>
                )}

                {item.tipo === 'equipamento' && (
                  <>
                    <IonButton expand="block" fill="clear" onClick={() => history.push(`/app/inventario/item/${item.id}/alterar-estado`)}>
                      <IonIcon slot="start" icon={constructOutline} />
                      Alterar Estado
                    </IonButton>
                    <IonButton expand="block" fill="clear" onClick={() => setShowCalibracaoDialog(true)}>
                      <IonIcon slot="start" icon={checkmarkCircleOutline} />
                      Registrar Calibracao
                    </IonButton>
                    <IonButton expand="block" fill="clear" onClick={() => history.push(`/app/inventario/item/${item.id}/qrcode`)}>
                      <IonIcon slot="start" icon={qrCodeOutline} />
                      QR Code
                    </IonButton>
                    <IonButton expand="block" fill="clear" onClick={() => history.push(`/app/inventario/item/${item.id}/verificacoes`)}>
                      <IonIcon slot="start" icon={constructOutline} />
                      Verificacoes e Reparos
                    </IonButton>
                  </>
                )}

                {(item.tipo === 'material' || item.tipo === 'utensilio') && (
                  <IonButton expand="block" fill="clear" onClick={() => history.push(`/app/inventario/item/${item.id}/lotes`)}>
                    <IonIcon slot="start" icon={cubeOutline} />
                    Gerenciar Lotes
                  </IonButton>
                )}

                <IonButton expand="block" fill="clear" onClick={() => history.push(`/app/inventario/item/${item.id}/editar`)}>
                  <IonIcon slot="start" icon={createOutline} />
                  Editar
                </IonButton>

                {isColaborador && item.status === 'ativo' && (
                  <IonButton expand="block" fill="clear" color="danger" onClick={() => setShowSenhaDialog(true)}>
                    <IonIcon slot="start" icon={trashOutline} />
                    Desativar Item
                  </IonButton>
                )}

                {isColaborador && item.status === 'inativo' && (
                  <IonButton expand="block" fill="clear" color="success" onClick={handleReativar}>
                    <IonIcon slot="start" icon={checkmarkCircleOutline} />
                    Reativar Item
                  </IonButton>
                )}

                <IonButton expand="block" fill="clear" onClick={() => history.push(`/app/inventario/item/${item.id}/historico-estado`)}>
                  <IonIcon slot="start" icon={timeOutline} />
                  Historico de Estado
                </IonButton>

                {item.tipo === 'equipamento' && (
                  <IonButton expand="block" fill="clear" onClick={() => history.push(`/app/inventario/item/${item.id}/historico-calibracoes`)}>
                    <IonIcon slot="start" icon={checkmarkCircleOutline} />
                    Historico de Calibracoes
                  </IonButton>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {numOcorrencias > 0 && (
            <IonCard style={{ borderRadius: 12 }}>
              <IonCardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ion-color-dark)' }}>
                    <IonIcon icon={flagOutline} style={{ marginRight: 6 }} />
                    Ocorrencias Vinculadas
                  </span>
                  <span
                    onClick={() => history.push('/app/inventario/ocorrencias')}
                    style={{ fontSize: 12, color: 'var(--ion-color-primary)', fontWeight: 500, cursor: 'pointer' }}
                  >
                    {numOcorrencias} ocorrencia(s) &rarr;
                  </span>
                </div>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        <div style={{ padding: '0 16px', marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-medium)', marginBottom: 8 }}>Imagens</div>
          <GaleriaImagens
            key={galeriaKey}
            entidadeTipo="item"
            entidadeId={id}
            editavel={isColaborador}
            idAutor={usuario?.userId}
            onAdicionar={isColaborador ? handleAdicionarFoto : undefined}
          />
        </div>

        <ConfirmacaoSenhaDialog
          isOpen={showSenhaDialog}
          titulo="Confirme sua identidade"
          mensagem="Esta acao exige confirmacao por senha."
          onConfirmar={handleDesativar}
          onCancelar={() => setShowSenhaDialog(false)}
        />

        <RegistrarCalibracaoDialog
          isOpen={showCalibracaoDialog && !!item}
          nomeEquipamento={item?.nome || ''}
          frequenciaAtual={((item as unknown as Record<string, unknown>).frequencia_calibracao_dias as number | null) || null}
          onConfirmar={async (dados) => {
            if (!usuario) return false;
            try {
              await InventarioService.registrarCalibracao(item!.id, usuario.userId, dados);
              setToastColor('success'); setToastMsg('Calibracao registrada.');
              setShowToast(true);
              setShowCalibracaoDialog(false);
              InventarioService.obterItem(item!.id).then(setItem);
              return true;
            } catch { return false; }
          }}
          onCancelar={() => setShowCalibracaoDialog(false)}
        />

        <IonActionSheet
          isOpen={showFotoSheet}
          onDidDismiss={() => setShowFotoSheet(false)}
          header="Adicionar Imagem"
          buttons={[
            { text: 'Camera', icon: cameraOutline, handler: () => handleCapturarFoto(CameraSource.Camera) },
            { text: 'Galeria', icon: imageOutline, handler: () => handleCapturarFoto(CameraSource.Photos) },
            { text: 'Cancelar', role: 'cancel' },
          ]}
        />

        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMsg} duration={2000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default InventarioItemDetalhePage;