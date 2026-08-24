import { MISSING_REQUEST_BODY } from 'utils';
import { z } from 'zod';
import { safeValidate, ZambdaInput } from '../../shared';

export interface HelloworldInput {
  name: string;
}

const HelloworldBodySchema = z.object({
  name: z.string(),
});

export function validateRequestParameters(input: ZambdaInput): HelloworldInput {
  if (!input.body) {
    throw MISSING_REQUEST_BODY;
  }

  const { name } = safeValidate(HelloworldBodySchema, JSON.parse(input.body));

  return {
    name,
  };
}
