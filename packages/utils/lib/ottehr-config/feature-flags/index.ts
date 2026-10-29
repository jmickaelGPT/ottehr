import type { FeatureFlagsConfig } from 'config-types/config/feature-flags';
import { FeatureFlagsConfigSchema } from 'config-types/config/feature-flags';

const FEATURE_FLAGS_DATA: FeatureFlagsConfig & { formsEnabled: boolean } = {
  labOrdersEnabled: true,
  inHouseLabsEnabled: true,
  radiologyEnabled: true,
  nursingOrdersEnabled: true,
  supervisorApprovalEnabled: true,
  demoVisitsEnabled: true,
  globalTemplatesEnabled: true,
  formsEnabled: true,
  legacyDataEnabled: true,
  mailingPaperStatementsEnabled: true,
  automatedPatientOutreachEnabled: true,
  legacyPatientFollowupsEnabled: false,
  skipSendingVisitNoteToPatientPortalEnabled: false,
  sendgridEnabled: false,
  // ON in core for testing + demoing the full FHIR-managed catalog flow.
  // Per-customer configs under local/secrets/<customer>/... omit this field
  // and land at undefined (falsy → FHIR categories suppressed) — customers
  // opt in explicitly by setting `dynamicServiceCategoriesEnabled: true`.
  dynamicServiceCategoriesEnabled: true,
};

export const FEATURE_FLAGS_CONFIG = Object.freeze({
  ...FEATURE_FLAGS_DATA,
  ...FeatureFlagsConfigSchema.parse(FEATURE_FLAGS_DATA),
});
