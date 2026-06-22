import React from 'react';
import { IonIcon, IonButton } from '@ionic/react';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, actionLabel, onAction }) => (
  <div style={{ textAlign: 'center', padding: 48 }}>
    <IonIcon icon={icon} style={{ fontSize: 48, color: 'var(--ion-color-medium)', marginBottom: 12 }} />
    <p style={{ fontSize: 14, color: 'var(--ion-color-dark)', fontWeight: 500, margin: 0 }}>
      {title}
    </p>
    {subtitle && (
      <p style={{ fontSize: 12, color: 'var(--ion-color-medium)', margin: '4px 0 0 0' }}>
        {subtitle}
      </p>
    )}
    {actionLabel && onAction && (
      <IonButton
        fill="outline"
        color="primary"
        size="small"
        onClick={onAction}
        style={{ marginTop: 16, fontWeight: 500 }}
      >
        {actionLabel}
      </IonButton>
    )}
  </div>
);

export default EmptyState;
