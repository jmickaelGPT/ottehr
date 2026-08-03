import { useAuth0 } from '@auth0/auth0-react';
import { FC, ReactElement } from 'react';
import { LoadingScreen } from '../LoadingScreen';

interface ProtectedRouteProps {
  showWhenAuthenticated: ReactElement;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = (props: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  console.log('[ProtectedRoute] Auth state:', { isAuthenticated, isLoading });

  if (!isAuthenticated && isLoading) {
    console.log('[ProtectedRoute] Loading auth state, showing loading screen...');
    return <LoadingScreen />;
  }

  if (!isAuthenticated && !isLoading) {
    console.log('[ProtectedRoute] Not authenticated and loading complete, redirecting to login...');
    loginWithRedirect().catch((error) => {
      console.error('[ProtectedRoute] Error redirecting to login:', error);
      throw new Error(`Error calling loginWithRedirect Auth0 ${error}`);
    });
  }

  console.log('[ProtectedRoute] User authenticated, rendering protected route');
  return props.showWhenAuthenticated;
};
