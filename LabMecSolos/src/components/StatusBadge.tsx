import React from 'react';

type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: BadgeStatus;
  label: string;
}

const statusColors: Record<BadgeStatus, { bg: string; text: string }> = {
  success: { bg: '#009d43', text: '#FFFFFF' },
  warning: { bg: '#E6A817', text: '#2c2926' },
  error: { bg: '#C0392B', text: '#FFFFFF' },
  info: { bg: '#0095DB', text: '#FFFFFF' },
  neutral: { bg: '#898888', text: '#FFFFFF' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const colors = statusColors[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 12,
        padding: '2px 8px',
        height: 24,
        fontSize: 11,
        fontWeight: 500,
        textTransform: 'uppercase',
        backgroundColor: colors.bg,
        color: colors.text,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
