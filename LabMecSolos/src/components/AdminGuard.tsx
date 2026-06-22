import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

const AdminGuard: React.FC<Props> = ({ children }) => {
  const { usuario } = useAuth();

  if (!usuario || usuario.permissao !== 'chefia') {
    return <Redirect to="/app/home" />;
  }

  return <>{children}</>;
};

export default AdminGuard;
