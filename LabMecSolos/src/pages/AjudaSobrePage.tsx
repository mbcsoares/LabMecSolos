import React from 'react';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon,
} from '@ionic/react';
import {
  documentTextOutline,
  linkOutline,
  calculatorOutline,
  cloudDownloadOutline,
  calendarOutline,
  mapOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  businessOutline,
} from 'ionicons/icons';
import AppBar from '../components/AppBar';
import { LogoDinamica } from '../components/LogoDinamica';
import { useAuth } from '../contexts/AuthContext';
import '../components/AppTitle.css';

const AjudaSobrePage: React.FC = () => {
  const { usuario } = useAuth();

  return (
  <IonPage>
    {usuario && <AppBar title="Sobre" />}
    <IonContent>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 8px' }}>
          <LogoDinamica />
          <h1 className="app-title" style={{ fontSize: 22, margin: '0 0 4px 0' }}>
            LabMecSolos
          </h1>
        </div>

        <IonCard style={{ borderRadius: 12 }}>
          <IonCardContent>
            <p style={{ fontSize: 14, color: 'var(--ion-color-dark)', margin: 0, lineHeight: 1.6 }}>
              O <strong>LabMecSolos</strong> e uma plataforma digital desenvolvida para apoiar a gestao, a execucao e o acompanhamento de atividades laboratoriais e de pesquisa em mecanica dos solos. Projetado para atender a comunidade academica e tecnica da Universidade Federal do Rio Grande do Norte (UFRN), o aplicativo integra desde o agendamento de bancadas ate o registro geoespacial dos resultados.
            </p>
          </IonCardContent>
        </IonCard>

        <IonCard style={{ borderRadius: 12 }}>
          <IonCardContent>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: 'var(--ion-color-primary)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
              }}>
                <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 20, color: '#FFFFFF' }} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ion-color-dark)' }}>O que o sistema oferece</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PilarItem
                icon={linkOutline}
                color="#164194"
                title="Rastreabilidade de Pesquisas"
                desc="Vinculo direto entre pesquisadores, pontos de coleta georreferenciados, amostras e ensaios realizados."
              />
              <PilarItem
                icon={calculatorOutline}
                color="#009d43"
                title="Automacao de Calculos"
                desc="Calculos automaticos e validacoes instantaneas durante o preenchimento dos dados do ensaio."
              />
              <PilarItem
                icon={cloudDownloadOutline}
                color="#0095DB"
                title="Operacao em Campo e Laboratorio"
                desc="Registro de dados mesmo em locais sem acesso a internet, com sincronizacao posterior."
              />
              <PilarItem
                icon={calendarOutline}
                color="#E6A817"
                title="Gestao Transparente"
                desc="Calendario dinamico para agendamento de espaco e consulta a disponibilidade de equipamentos."
              />
              <PilarItem
                icon={mapOutline}
                color="#C0392B"
                title="Inteligencia Geoespacial"
                desc="Mapa interativo que consolida pesquisas finalizadas para visualizacao unificada dos dados geotecnicos da regiao."
              />
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard style={{ borderRadius: 12 }}>
          <IonCardContent>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: '#009d43',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
              }}>
                <IonIcon icon={documentTextOutline} style={{ fontSize: 20, color: '#FFFFFF' }} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ion-color-dark)' }}>Normas Tecnicas e Qualidade</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <NormaCard
                label="ABNT NBR ISO/IEC 17025:2017"
                desc="Aplicada no controle do inventario, gerenciando o estado de calibracao, as manutencoes periodicas e a identificacao patrimonial dos equipamentos por QR Code."
              />
              <NormaCard
                label="ABNT NBR 6457:2024"
                desc="Aplicada nas validacoes do ensaio de Teor de Umidade, monitorando as determinacoes minimas exigidas e as faixas termicas adequadas para a secagem em estufa."
              />
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard style={{ borderRadius: 12 }}>
          <IonCardContent>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: 'var(--ion-color-dark)',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
              }}>
                <IonIcon icon={informationCircleOutline} style={{ fontSize: 20, color: '#FFFFFF' }} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ion-color-dark)' }}>Informacoes de Registro</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <RegistroRow label="Versao" value="1.0.0 (MVP)" />
              <RegistroRow label="Lancamento" value="Junho de 2026" />
              <RegistroRow label="Desenvolvimento" value="Micael Bruno Cassiano Soares" />
              <RegistroRow label="Contato" value="micaelbruno2011@gmail.com" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--app-color-border)' }}>
              <IonIcon icon={businessOutline} style={{ fontSize: 16, color: 'var(--ion-color-medium)' }} />
              <span style={{ fontSize: 13, color: 'var(--ion-color-dark)' }}>
                UFRN — Universidade Federal do Rio Grande do Norte
              </span>
            </div>
          </IonCardContent>
        </IonCard>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--ion-color-medium)', margin: '0 0 16px' }}>
          Laboratorio de Mecanica dos Solos
        </p>
      </div>
    </IonContent>
  </IonPage>
  );
};

const PilarItem: React.FC<{ icon: string; color: string; title: string; desc: string }> = ({ icon, color, title, desc }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
    <div style={{
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: `${color}18`,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      flexShrink: 0, marginTop: 2,
    }}>
      <IonIcon icon={icon} style={{ fontSize: 16, color }} />
    </div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-dark)' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', lineHeight: 1.4 }}>{desc}</div>
    </div>
  </div>
);

const NormaCard: React.FC<{ label: string; desc: string }> = ({ label, desc }) => (
  <div style={{
    backgroundColor: 'var(--ion-color-light)',
    borderRadius: 8,
    padding: 10,
  }}>
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ion-color-dark)' }}>{label}</div>
    <div style={{ fontSize: 12, color: 'var(--ion-color-medium)', marginTop: 4, lineHeight: 1.4 }}>{desc}</div>
  </div>
);

const RegistroRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 12, color: 'var(--ion-color-medium)', minWidth: 100 }}>{label}</span>
    <span style={{ fontSize: 13, color: 'var(--ion-color-dark)', fontWeight: 500 }}>{value}</span>
  </div>
);

export default AjudaSobrePage;
