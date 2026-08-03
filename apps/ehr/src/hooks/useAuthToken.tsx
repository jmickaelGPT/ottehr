import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';

let _token: string | undefined = undefined;

export function useAuthToken(): string | undefined {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [token, setToken] = useState<string | undefined>(_token);

  useEffect(() => {
    console.log('[useAuthToken] Effect triggered:', { isAuthenticated, hasToken: !!_token });
    
    if (isAuthenticated && !_token) {
      console.log('[useAuthToken] Retrieving token from Auth0...');
      getAccessTokenSilently()
        .then((newToken) => {
          console.log('[useAuthToken] Token retrieved successfully:', {
            tokenLength: newToken?.length,
            tokenPreview: newToken?.substring(0, 20) + '...',
          });
          _token = newToken;
          setToken(newToken);
        })
        .catch((error) => {
          console.error('[useAuthToken] Failed to get token from Auth0:', error);
        });
    } else if (!isAuthenticated) {
      console.log('[useAuthToken] User not authenticated');
    }
  }, [isAuthenticated, getAccessTokenSilently, setToken]);

  useEffect(() => {
    console.log('[useAuthToken] Token state updated:', { hasToken: !!token, tokenLength: token?.length });
  }, [token]);

  return token;
}
