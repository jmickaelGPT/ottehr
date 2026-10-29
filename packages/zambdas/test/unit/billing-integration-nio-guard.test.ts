import { Secrets } from 'utils/lib/secrets';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// FEATURE_FLAGS_CONFIG is a frozen compile-time constant, so tests toggle it through a
// hoisted mutable object standing in for the module.
const flags = vi.hoisted(() => ({ customOrganizationsEnabled: false }));
vi.mock('utils/lib/ottehr-config/feature-flags', () => ({ FEATURE_FLAGS_CONFIG: flags }));

import { shouldUseCandid, shouldUseOttehrBilling } from '../../src/shared/candid';

const secretsWith = (billingIntegration?: string): Secrets =>
  ({ BILLING_INTEGRATION: billingIntegration }) as unknown as Secrets;

describe('shouldUseCandid NIO guard', () => {
  beforeEach(() => {
    flags.customOrganizationsEnabled = false;
  });

  describe('with non-insurance organizations off (legacy truth table)', () => {
    it.each(['candid', 'all', 'ottehr'])('supports the legacy billing flag %s', (value) => {
      const legacySecrets: Secrets = { BILLING_INTEGRATION_FEATURE_FLAG: value };
      expect(shouldUseCandid(legacySecrets)).toBe(shouldUseCandid(secretsWith(value)));
      expect(shouldUseOttehrBilling(legacySecrets)).toBe(shouldUseOttehrBilling(secretsWith(value)));
    });

    it('prefers the current billing setting over the legacy flag', () => {
      const secrets: Secrets = { BILLING_INTEGRATION: 'ottehr', BILLING_INTEGRATION_FEATURE_FLAG: 'candid' };
      expect(shouldUseCandid(secrets)).toBe(false);
      expect(shouldUseOttehrBilling(secrets)).toBe(true);
    });

    it.each([
      ['candid', true],
      ['all', true],
      ['ottehr', false],
    ])('BILLING_INTEGRATION=%s → %s', (value, expected) => {
      expect(shouldUseCandid(secretsWith(value))).toBe(expected);
    });

    it('defaults unset BILLING_INTEGRATION to Candid', () => {
      expect(shouldUseCandid(secretsWith(undefined))).toBe(true);
      expect(shouldUseCandid(secretsWith(''))).toBe(true);
    });
  });

  describe('with non-insurance organizations on', () => {
    beforeEach(() => {
      flags.customOrganizationsEnabled = true;
    });

    it('keeps the guard active for the legacy billing flag', () => {
      expect(() => shouldUseCandid({ BILLING_INTEGRATION_FEATURE_FLAG: 'candid' })).toThrow(
        'Non-insurance organizations need Ottehr billing as the system of record'
      );
      expect(shouldUseCandid({ BILLING_INTEGRATION_FEATURE_FLAG: 'ottehr' })).toBe(false);
    });

    it('returns false for BILLING_INTEGRATION=ottehr', () => {
      expect(shouldUseCandid(secretsWith('ottehr'))).toBe(false);
    });

    it('returns true for BILLING_INTEGRATION=all — Candid runs alongside Ottehr billing for claim comparison', () => {
      expect(shouldUseCandid(secretsWith('all'))).toBe(true);
    });

    it('throws for candid-only BILLING_INTEGRATION', () => {
      expect(() => shouldUseCandid(secretsWith('candid'))).toThrow(
        'Non-insurance organizations need Ottehr billing as the system of record'
      );
    });

    it('throws for unset BILLING_INTEGRATION, naming the unset value', () => {
      expect(() => shouldUseCandid(secretsWith(undefined))).toThrow("BILLING_INTEGRATION is '(unset)'");
    });
  });
});

describe('shouldUseOttehrBilling', () => {
  it('is untouched by the NIO flag', () => {
    for (const nio of [false, true]) {
      flags.customOrganizationsEnabled = nio;
      expect(shouldUseOttehrBilling(secretsWith('ottehr'))).toBe(true);
      expect(shouldUseOttehrBilling(secretsWith('all'))).toBe(true);
      expect(shouldUseOttehrBilling(secretsWith('candid'))).toBe(false);
      expect(shouldUseOttehrBilling(secretsWith(undefined))).toBe(false);
    }
  });
});
