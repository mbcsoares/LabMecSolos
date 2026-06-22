import React from 'react';
import { Redirect } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

const AuthGuard: React.FC<Props> = ({ children }) => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <IonSpinner name="crescent" color="primary" />
      </div>
    );
  }

  if (!usuario) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
};

export default AuthGuard;
