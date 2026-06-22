import React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { IonSpinner } from '@ionic/react';

const ProtectedRoute: React.FC<RouteProps> = ({ children, ...rest }) => {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <IonSpinner name="crescent" color="primary" />
      </div>
    );
  }

  return (
    <Route {...rest}>
      {session ? children : <Redirect to="/login" />}
    </Route>
  );
};

export default ProtectedRoute;
