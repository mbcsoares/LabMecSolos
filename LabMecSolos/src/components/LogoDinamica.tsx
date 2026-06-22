import React from 'react';
import './LogoDinamica.css';

interface LogoDinamicaProps {
  isLoading?: boolean;
}

export const LogoDinamica: React.FC<LogoDinamicaProps> = ({ isLoading = false }) => {
  return (
    <div className={`logo-wrapper ${isLoading ? 'is-loading' : ''}`}>
      <svg
        viewBox="0 0 400 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="svg-logo"
      >
        {/* Linha Fina Superior */}
        <line x1="0" y1="5" x2="400" y2="5" stroke="#1E56B2" strokeWidth="4" className="camada-linha" />

        {/* Camada 1: Azul */}
        <path d="M 0,15 L 260,15 L 260,25 L 400,25 L 400,45 L 260,45 L 260,35 L 0,35 Z" fill="#225EC3" className="camada c-azul" />

        {/* Camada 2: Verde Piscina */}
        <path d="M 0,48 L 260,48 L 260,42 L 400,42 L 400,62 L 260,62 L 260,58 L 0,58 Z" fill="#88D7C0" className="camada c-verde-claro" />

        {/* Camada 3: Verde Escuro */}
        <path d="M 0,65 L 260,65 L 260,75 L 400,75 L 400,95 L 260,95 L 260,85 L 0,85 Z" fill="#4B937D" className="camada c-verde-escuro" />

        {/* Camada 4: Cinza Claro */}
        <path d="M 0,98 L 260,98 L 260,92 L 400,92 L 400,112 L 260,112 L 260,108 L 0,108 Z" fill="#9CA3AF" className="camada c-cinza-claro" />

        {/* Camada 5: Grafite Escuro */}
        <path d="M 0,115 L 260,115 L 260,125 L 400,125 L 400,145 L 260,145 L 260,135 L 0,135 Z" fill="#374151" className="camada c-grafite" />

        {/* Linha Fina Inferior */}
        <line x1="0" y1="155" x2="400" y2="155" stroke="#374151" strokeWidth="4" className="camada-linha" />
      </svg>
    </div>
  );
};