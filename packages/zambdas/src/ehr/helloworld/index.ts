import { APIGatewayProxyResult } from 'aws-lambda';
import { wrapHandler, ZambdaInput } from '../../shared';
import { validateRequestParameters } from './validateRequestParameters';

const ZAMBDA_NAME = 'helloworld';

export const index = wrapHandler(ZAMBDA_NAME, async (input: ZambdaInput): Promise<APIGatewayProxyResult> => {
  console.group('validateRequestParameters');
  const validatedParameters = validateRequestParameters(input);
  const { name } = validatedParameters;
  console.groupEnd();
  console.debug('validateRequestParameters success');

  // Console log the message
  const message = `Hello ${name}, welcome to the exciting Oystehr world!`;
  console.log(message);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message,
    }),
  };
});
