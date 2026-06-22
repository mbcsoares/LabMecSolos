import React, { useState } from 'react';
import {
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/react';

interface TabDefinition {
  id: string;
  label: string;
  condition: boolean;
  content: React.ReactNode;
}

interface HomeViewPagerProps {
  tabs: TabDefinition[];
}

const HomeViewPager: React.FC<HomeViewPagerProps> = ({ tabs }) => {
  const visibleTabs = tabs.filter((t) => t.condition);
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || '');

  const activeContent = visibleTabs.find((t) => t.id === activeTab)?.content;

  if (visibleTabs.length === 0) return null;

  return (
    <div>
      <IonSegment
        value={activeTab}
        onIonChange={(e) => setActiveTab(e.detail.value as string)}
        style={{
          margin: '12px 16px 0',
          background: 'var(--ion-background-color)',
          borderRadius: 0,
          borderBottom: '1px solid var(--app-color-border)',
        }}
      >
        {visibleTabs.map((tab) => (
          <IonSegmentButton
            key={tab.id}
            value={tab.id}
            style={{
              '--indicator-color': 'var(--ion-color-primary)',
              '--indicator-height': '3px',
              '--color': 'var(--ion-color-medium)',
              '--color-checked': 'var(--ion-color-primary)',
              fontSize: 13,
              fontWeight: 500,
              textTransform: 'none',
              minHeight: 48,
              '--padding-top': 0,
              '--padding-bottom': 0,
            } as React.CSSProperties}
          >
            <IonLabel>{tab.label}</IonLabel>
          </IonSegmentButton>
        ))}
      </IonSegment>

      <div style={{ padding: '12px 16px' }}>
        {activeContent}
      </div>
    </div>
  );
};

export default HomeViewPager;
