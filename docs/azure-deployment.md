# Azure Deployment Setup (EHR, Billing, Intake)

## Prerequisites

1. Fill every `__PLACEHOLDER__` in the selected environment files before building:
   - `apps/ehr/env/.env.azure-<environment>`
   - `apps/intake/env/.env.azure-<environment>`
   - `apps/billing/env/.env.azure-<environment>`
2. Authenticate and select the Innovare Health Azure subscription:

```powershell
az login
az account set --subscription "58708d34-f80d-4f94-b0a2-0eb93fc308bb"
az account show --query "{name:name, subscriptionId:id}" --output table
```

Azure builds fail before compilation when their environment file is missing or contains unresolved placeholders.

## Required Azure Web App Variables

The deploy script targets Azure Web Apps and can infer default app names. You can override names with env vars:

Dev:
- AZURE_WEBAPP_EHR_DEV
- AZURE_WEBAPP_INTAKE_DEV
- AZURE_WEBAPP_BILLING_DEV
- AZURE_WEBAPP_RESOURCE_GROUP_DEV (optional, defaults to IHA-Web-RG)

Beta:
- AZURE_WEBAPP_EHR_BETA
- AZURE_WEBAPP_INTAKE_BETA
- AZURE_WEBAPP_BILLING_BETA
- AZURE_WEBAPP_RESOURCE_GROUP_BETA (optional, defaults to IHA-Web-RG)

Production:
- AZURE_WEBAPP_EHR_PRODUCTION
- AZURE_WEBAPP_INTAKE_PRODUCTION
- AZURE_WEBAPP_BILLING_PRODUCTION
- AZURE_WEBAPP_RESOURCE_GROUP_PRODUCTION (optional, defaults to IHA-Web-RG)

Deploy uses `az webapp deploy --type zip` for each app.

## Startup Commands

Run app with Azure mode env values:
- npm run ehr:start:azure:dev
- npm run ehr:start:azure:beta
- npm run ehr:start:azure:production
- npm run billing:start:azure:dev
- npm run billing:start:azure:beta
- npm run billing:start:azure:production
- npm run intake:start:azure:dev
- npm run intake:start:azure:beta
- npm run intake:start:azure:production

## Build Commands

Build all apps for one Azure mode:

```powershell
npm run build:azure:dev
npm run build:azure:beta
npm run build:azure:production
```

Build billing only for one Azure mode:

```powershell
npm run billing:build:azure:dev
npm run billing:build:azure:beta
npm run billing:build:azure:production
```

## Deploy Commands

Build + zip + upload all three apps:

```powershell
npm run deploy:azure:dev
npm run deploy:azure:beta
npm run deploy:azure:production
```

Build + zip + upload billing only:

```powershell
npm run deploy:azure:billing:dev
npm run deploy:azure:billing:beta
npm run deploy:azure:billing:production
```

Billing-only deployments target:
- Dev: `InnovareHealthOttEHRBillingDev`
- Beta: `InnovareHealthOttEHRBillingBeta`
- Production: `InnovareHealthOttEHRBilling`

## Canonical App URLs

Use these as the public-facing app URLs in dev:
- EHR: https://ehr.ottehrdev.innovarehealth.net
- Intake: https://intake.ottehrdev.innovarehealth.net
- Billing: https://billing.ottehrdev.innovarehealth.net

Note: this deploy flow targets Azure App Service (Web Apps). Ensure your canonical DNS hostnames are mapped to the corresponding web apps.

## GitHub Actions Example

Store the web app names (and optional resource groups) as repository or environment secrets, then expose them in the deploy job:

```yaml
name: Deploy Azure Apps

on:
	workflow_dispatch:
		inputs:
			target_env:
				description: Target environment
				required: true
				type: choice
				options:
					- dev
					- beta
					- production

jobs:
	deploy:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4

			- uses: actions/setup-node@v4
				with:
					node-version: 22

			- name: Install dependencies
				run: npm ci

			- name: Azure login
				uses: azure/login@v2
				with:
					creds: ${{ secrets.AZURE_CREDENTIALS }}

			- name: Deploy apps
				env:
					AZURE_WEBAPP_EHR_DEV: ${{ secrets.AZURE_WEBAPP_EHR_DEV }}
					AZURE_WEBAPP_INTAKE_DEV: ${{ secrets.AZURE_WEBAPP_INTAKE_DEV }}
					AZURE_WEBAPP_BILLING_DEV: ${{ secrets.AZURE_WEBAPP_BILLING_DEV }}
					AZURE_WEBAPP_RESOURCE_GROUP_DEV: ${{ secrets.AZURE_WEBAPP_RESOURCE_GROUP_DEV }}
					AZURE_WEBAPP_EHR_BETA: ${{ secrets.AZURE_WEBAPP_EHR_BETA }}
					AZURE_WEBAPP_INTAKE_BETA: ${{ secrets.AZURE_WEBAPP_INTAKE_BETA }}
					AZURE_WEBAPP_BILLING_BETA: ${{ secrets.AZURE_WEBAPP_BILLING_BETA }}
					AZURE_WEBAPP_RESOURCE_GROUP_BETA: ${{ secrets.AZURE_WEBAPP_RESOURCE_GROUP_BETA }}
					AZURE_WEBAPP_EHR_PRODUCTION: ${{ secrets.AZURE_WEBAPP_EHR_PRODUCTION }}
					AZURE_WEBAPP_INTAKE_PRODUCTION: ${{ secrets.AZURE_WEBAPP_INTAKE_PRODUCTION }}
					AZURE_WEBAPP_BILLING_PRODUCTION: ${{ secrets.AZURE_WEBAPP_BILLING_PRODUCTION }}
					AZURE_WEBAPP_RESOURCE_GROUP_PRODUCTION: ${{ secrets.AZURE_WEBAPP_RESOURCE_GROUP_PRODUCTION }}
				run: npm run deploy:azure:${{ inputs.target_env }}
```

Zip artifacts are generated at:
- deploy/apps_upload/azure/dist
