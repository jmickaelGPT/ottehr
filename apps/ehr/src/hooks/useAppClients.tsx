import Oystehr from '@oystehr/sdk';
import { useEffect } from 'react';
import { getSelectors } from 'utils';
import { create } from 'zustand';
import { useAuthToken } from './useAuthToken';

interface ApiClientsState {
  oystehr?: Oystehr;
  oystehrZambda?: Oystehr;
}

const useApiClientsStore = create<ApiClientsState>()(() => ({
  oystehr: undefined,
  oystehrZambda: undefined,
}));

export function useApiClients(): ApiClientsState {
  const token = useAuthToken();
  const { oystehr, oystehrZambda } = getSelectors(useApiClientsStore, ['oystehr', 'oystehrZambda']);

  useEffect(() => {
    console.log('[useApiClients] FHIR Effect triggered:', {
      hasToken: !!token,
      hasOystehr: !!oystehr,
      tokenMatch: oystehr?.config.accessToken === token,
    });
    
    if (!oystehr || oystehr.config.accessToken !== token) {
      console.log('[useApiClients] Creating/Updating FHIR Oystehr client with token:', {
        tokenPreview: token?.substring(0, 20) + '...',
        fhirApiUrl: import.meta.env.VITE_APP_FHIR_API_URL,
      });
      useApiClientsStore.setState({
        oystehr: new Oystehr({
          accessToken: token,
          fhirApiUrl: import.meta.env.VITE_APP_FHIR_API_URL,
          projectApiUrl: import.meta.env.VITE_APP_PROJECT_API_URL,
          projectId: import.meta.env.VITE_APP_PROJECT_ID,
        }),
      });
    }
  }, [oystehr, token]);

  useEffect(() => {
    console.log('[useApiClients] Zambda Effect triggered:', {
      hasToken: !!token,
      hasOystehrZambda: !!oystehrZambda,
      tokenMatch: oystehrZambda?.config.accessToken === token,
    });
    
    if (!oystehrZambda || oystehrZambda.config.accessToken !== token) {
      console.log('[useApiClients] Creating/Updating Zambda Oystehr client with token:', {
        tokenPreview: token?.substring(0, 20) + '...',
        projectApiZambdaUrl: import.meta.env.VITE_APP_PROJECT_API_ZAMBDA_URL,
        isLocal: import.meta.env.VITE_APP_IS_LOCAL,
      });
      const zambdaConfig: ConstructorParameters<typeof Oystehr>[0] = {
        accessToken: token,
        fhirApiUrl: import.meta.env.VITE_APP_FHIR_API_URL,
        projectApiUrl: import.meta.env.VITE_APP_PROJECT_API_ZAMBDA_URL,
        projectId: import.meta.env.VITE_APP_PROJECT_ID,
        retry: {
          retries: 0,
        },
      };
      if (import.meta.env.VITE_APP_IS_LOCAL === 'true') {
        zambdaConfig.services = {
          zambdaApiUrl: import.meta.env.VITE_APP_PROJECT_API_ZAMBDA_URL,
        };
      }
      useApiClientsStore.setState({
        oystehrZambda: new Oystehr(zambdaConfig),
      });
    }
  }, [oystehrZambda, token]);

  return { oystehr, oystehrZambda };
}
