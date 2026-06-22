import React from 'react';

interface GreetingHeaderProps {
  nome: string;
}

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Bom dia', emoji: '\u2600\uFE0F' };
  if (hour < 18) return { text: 'Boa tarde', emoji: '\uD83C\uDF24\uFE0F' };
  return { text: 'Boa noite', emoji: '\uD83C\uDF19' };
}

const GreetingHeader: React.FC<GreetingHeaderProps> = ({ nome }) => {
  const greeting = getGreeting();

  return (
    <div style={{ padding: '16px 16px 0 16px' }}>
      <h1 style={{
        fontSize: 22,
        fontWeight: 600,
        color: 'var(--ion-color-dark)',
        margin: '0 0 4px 0',
      }}>
        {greeting.text}, {nome}! {greeting.emoji}
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: 0 }}>
        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
};

export default GreetingHeader;
