import { MISSING_REQUEST_BODY } from 'utils/lib/types/errors';
import { z } from 'zod';
import { ZambdaInput } from '../../shared/types/common';
import { safeValidate } from '../../shared/validation';

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
