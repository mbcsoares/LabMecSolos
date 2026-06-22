import React, { ReactNode } from 'react';
import { IonIcon, IonRippleEffect } from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';

interface InfoCardBaseProps {
  variant: 'standard' | 'mini' | 'kpi';
  title?: string;
  titleIcon?: string;
  value?: string | number;
  valueLabel?: string;
  icon?: string;
  linkLabel?: string;
  onLinkClick?: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  progress?: number;
  onClick?: () => void;
  colorAccent?: string;
}

const InfoCard: React.FC<InfoCardBaseProps> = ({
  variant,
  title,
  titleIcon,
  value,
  valueLabel,
  icon,
  linkLabel,
  onLinkClick,
  children,
  footer,
  progress,
  onClick,
  colorAccent,
}) => {
  const isInteractive = !!onClick || !!onLinkClick;

  if (variant === 'mini') {
    return (
      <div
        onClick={onClick}
        style={{
          background: 'var(--ion-card-background)',
          borderRadius: 8,
          padding: '12px 16px',
          boxShadow: 'var(--app-shadow-card)',
          border: '1px solid var(--app-color-border)',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 72,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {onClick && <IonRippleEffect />}
        {icon && (
          <IonIcon
            icon={icon}
            style={{
              fontSize: 20,
              color: colorAccent || 'var(--ion-color-primary)',
              marginBottom: 4,
            }}
          />
        )}
        <div style={{ fontSize: 24, fontWeight: 600, color: colorAccent || 'var(--ion-color-dark)', lineHeight: 1.1 }}>
          {value ?? '\u00A0'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', marginTop: 2 }}>
          {title}
        </div>
      </div>
    );
  }

  if (variant === 'kpi') {
    return (
      <div
        onClick={onClick}
        style={{
          background: 'var(--ion-card-background)',
          borderRadius: 8,
          padding: '12px 12px',
          boxShadow: 'var(--app-shadow-card)',
          border: '1px solid var(--app-color-border)',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          minHeight: 80,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {onClick && <IonRippleEffect />}
        <div style={{ fontSize: 28, fontWeight: 700, color: colorAccent || 'var(--ion-color-primary)', lineHeight: 1.1 }}>
          {value ?? '\u00A0'}
        </div>
        {valueLabel && (
          <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', marginTop: 2 }}>
            {valueLabel}
          </div>
        )}
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ion-color-dark)', marginTop: 4 }}>
          {title}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--ion-card-background)',
        borderRadius: 8,
        boxShadow: 'var(--app-shadow-card)',
        border: '1px solid var(--app-color-border)',
        marginBottom: 8,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isInteractive && <IonRippleEffect />}

      {title && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px 8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {titleIcon && (
              <IonIcon icon={titleIcon} style={{ fontSize: 20, color: 'var(--ion-color-primary)' }} />
            )}
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ion-color-dark)', textTransform: 'uppercase' }}>
              {title}
            </span>
          </div>
          {linkLabel && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onLinkClick?.();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--ion-color-primary)', fontWeight: 500 }}>
                {linkLabel}
              </span>
              <IonIcon icon={chevronForwardOutline} style={{ fontSize: 14, color: 'var(--ion-color-primary)' }} />
            </div>
          )}
        </div>
      )}

      {title && (
        <div style={{ height: 1, backgroundColor: 'var(--app-color-border)', margin: '0 16px' }} />
      )}

      <div style={{ padding: '12px 16px' }}>
        {progress !== undefined && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>Progresso</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ion-color-primary)' }}>{progress}%</span>
            </div>
            <div style={{ height: 6, backgroundColor: 'var(--app-color-border)', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: 'var(--ion-color-primary)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {value && (
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--ion-color-dark)', marginBottom: 4 }}>
            {value}
          </div>
        )}

        {children}
      </div>

      {footer && (
        <>
        <div style={{ height: 1, backgroundColor: 'var(--app-color-border)', margin: '0 16px' }} />
          <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--ion-color-medium)' }}>
            {footer}
          </div>
        </>
      )}
    </div>
  );
};

export default InfoCard;
