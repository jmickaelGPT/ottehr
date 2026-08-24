export const index = async (event: any): Promise<{ statusCode: number; body: string }> => {
  console.log('validating input body');
  if (!event.body) {
    throw new Error('No request body provided');
  }

  console.log('extracting search parameters and secrets from the input');
  const { search } = JSON.parse(event.body) as { search: string };
  const secrets = event.secrets as Record<string, string> | undefined;

  console.log('getting the api key from secrets');
  let apiKey: string | undefined;
  const secretKeyName = 'NLM_API_KEY';
  if (secrets != null) {
    apiKey = secrets[secretKeyName];
  } else {
    apiKey = process.env[secretKeyName];
  }

  console.log('validating the api key');
  if (apiKey == null) {
    throw new Error(`Secret or Environment Variable with key ${secretKeyName} was not set.`);
  }

  console.log('searching for the codes');
  const searchResponse: { codes: Array<{ code: string; display: string }> } = { codes: [] };
  try {
    console.log('calling the UMLS Metathesaurus API');
    const icdResponse = await fetch(
      `https://uts-ws.nlm.nih.gov/rest/search/current?apiKey=${apiKey}&pageSize=50&returnIdType=code&inputType=sourceUi&string=${search}&sabs=ICD10CM`
    );

    console.log('validating the API response');
    if (!icdResponse.ok) {
      throw new Error(icdResponse.statusText);
    }

    console.log('formatting the API response');
    const icdResponseBody = (await icdResponse.json()) as {
      result: {
        results: Array<{ ui: string; name: string }>;
      };
    };

    console.log('saving the API response codes to searchResponse');
    searchResponse.codes = icdResponseBody.result.results.map((entry) => ({
      code: entry.ui,
      display: entry.name,
    }));
  } catch (error) {
    // In case of error, throw an error.
    console.error('Error while trying to request NLM ICD10 search endpoint', error);
    throw new Error('Error while trying to get ICD-10 codes');
  }

  console.log('returning searchResponse');
  return {
    statusCode: 200,
    body: JSON.stringify(searchResponse),
  };
};
