import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

const ColaboradorGuard: React.FC<Props> = ({ children }) => {
  const { usuario } = useAuth();

  if (!usuario || (usuario.permissao !== 'colaborador' && usuario.permissao !== 'chefia')) {
    return <Redirect to="/app/home" />;
  }

  return <>{children}</>;
};

export default ColaboradorGuard;
