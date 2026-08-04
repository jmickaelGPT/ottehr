import { useAuth0 } from '@auth0/auth0-react';
import { FC, ReactElement, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { LoadingScreen } from '../LoadingScreen';

interface ProtectedRouteProps {
  showWhenAuthenticated: ReactElement;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = (props: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const location = useLocation();
  const hasTriggeredRedirect = useRef(false);
  const authError = new URLSearchParams(location.search).get('error');

  console.log('[ProtectedRoute] Auth state:', { isAuthenticated, isLoading, authError });

  useEffect(() => {
    if (!isAuthenticated && !isLoading && !authError && !hasTriggeredRedirect.current) {
      hasTriggeredRedirect.current = true;
      console.log('[ProtectedRoute] Not authenticated, redirecting to login...');
      loginWithRedirect().catch((error) => {
        console.error('[ProtectedRoute] Error redirecting to login:', error);
        hasTriggeredRedirect.current = false;
      });
    }
  }, [authError, isAuthenticated, isLoading, loginWithRedirect]);

  if (!isAuthenticated && !isLoading && authError) {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        Authentication failed ({authError}). Remove or correct VITE_APP_OYSTEHR_CONNECTION_NAME and ensure Auth0
        callbacks include this URL origin.
      </div>
    );
  }

  if (!isAuthenticated && isLoading) {
    console.log('[ProtectedRoute] Loading auth state, showing loading screen...');
    return <LoadingScreen />;
  }

  if (!isAuthenticated && !isLoading) {
    return <LoadingScreen />;
  }

  console.log('[ProtectedRoute] User authenticated, rendering protected route');
  return props.showWhenAuthenticated;
};
