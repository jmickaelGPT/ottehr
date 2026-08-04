import './index.css';
import { Auth0Provider } from '@auth0/auth0-react';
import { ErrorBoundary } from '@sentry/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

function normalizeAuth0Domain(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

function isLikelyChunkLoadError(errorString: string): boolean {
  return (
    errorString.includes('Failed to fetch dynamically imported module') ||
    errorString.includes('Importing a module script failed') ||
    errorString.includes('error loading dynamically imported module') ||
    errorString.includes('Loading chunk')
  );
}

const VITE_APP_OYSTEHR_APPLICATION_DOMAIN =
  normalizeAuth0Domain(import.meta.env.VITE_APP_OYSTEHR_APPLICATION_DOMAIN) || 'auth.zapehr.com';
const VITE_APP_OYSTEHR_APPLICATION_CLIENT_ID = import.meta.env.VITE_APP_OYSTEHR_APPLICATION_CLIENT_ID || '';
const VITE_APP_OYSTEHR_APPLICATION_AUDIENCE =
  import.meta.env.VITE_APP_OYSTEHR_APPLICATION_AUDIENCE || 'https://api.zapehr.com';
const VITE_APP_OYSTEHR_APPLICATION_REDIRECT_URL =
  import.meta.env.VITE_APP_OYSTEHR_APPLICATION_REDIRECT_URL || window.location.origin;
const VITE_APP_OYSTEHR_CONNECTION_NAME = import.meta.env.VITE_APP_OYSTEHR_CONNECTION_NAME?.trim();
const hasRequiredAuthConfig =
  Boolean(VITE_APP_OYSTEHR_APPLICATION_DOMAIN) && Boolean(import.meta.env.VITE_APP_OYSTEHR_APPLICATION_CLIENT_ID);

export const AUTH0_REDIRECT_URI =
  import.meta.env.VITE_APP_OYSTEHR_APPLICATION_REDIRECT_URL_TELEMED &&
  location.href.includes(import.meta.env.VITE_APP_OYSTEHR_APPLICATION_REDIRECT_URL_TELEMED)
    ? import.meta.env.VITE_APP_OYSTEHR_APPLICATION_REDIRECT_URL_TELEMED
    : VITE_APP_OYSTEHR_APPLICATION_REDIRECT_URL;

if (!hasRequiredAuthConfig) {
  console.error(
    'Auth env vars are missing. Set VITE_APP_OYSTEHR_APPLICATION_DOMAIN and VITE_APP_OYSTEHR_APPLICATION_CLIENT_ID in apps/ehr/env/.env.default.'
  );
}

console.log('[App Startup] Auth0 Configuration:', {
  domain: VITE_APP_OYSTEHR_APPLICATION_DOMAIN,
  clientId: VITE_APP_OYSTEHR_APPLICATION_CLIENT_ID,
  audience: VITE_APP_OYSTEHR_APPLICATION_AUDIENCE,
  redirectUri: AUTH0_REDIRECT_URI,
  connection: VITE_APP_OYSTEHR_CONNECTION_NAME || '(not set)',
});

const auth0AuthorizationParams: Record<string, string> = {
  audience: VITE_APP_OYSTEHR_APPLICATION_AUDIENCE,
  redirect_uri: AUTH0_REDIRECT_URI,
};
if (VITE_APP_OYSTEHR_CONNECTION_NAME) {
  auth0AuthorizationParams.connection = VITE_APP_OYSTEHR_CONNECTION_NAME;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {hasRequiredAuthConfig ? (
        <Auth0Provider
          domain={VITE_APP_OYSTEHR_APPLICATION_DOMAIN}
          clientId={VITE_APP_OYSTEHR_APPLICATION_CLIENT_ID}
          authorizationParams={auth0AuthorizationParams}
          cacheLocation="localstorage"
        >
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.log(String(error), errorInfo);
              // Handle chunk loading failures from deployments
              const errorString = String(error);
              if (isLikelyChunkLoadError(errorString)) {
                const reloadGuardKey = 'ehr:chunk-reload-attempted';
                const alreadyRetried = sessionStorage.getItem(reloadGuardKey) === '1';
                if (!alreadyRetried) {
                  sessionStorage.setItem(reloadGuardKey, '1');
                  console.log('Chunk loading error detected, reloading page once...');
                  location.reload();
                } else {
                  console.error('Chunk loading error persisted after one reload; stopping auto-reload loop.');
                }
              }
            }}
            fallback={<p>An error has occurred</p>}
          >
            <App />
          </ErrorBoundary>
        </Auth0Provider>
      ) : (
        <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
          Missing auth configuration. Set VITE_APP_OYSTEHR_APPLICATION_DOMAIN and VITE_APP_OYSTEHR_APPLICATION_CLIENT_ID
          in apps/ehr/env/.env.default and restart.
        </div>
      )}
    </QueryClientProvider>
  </StrictMode>
);
