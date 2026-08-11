# Azure Deployment Setup (EHR, Billing, Intake)

 
## Environment Files Added

- apps/ehr/env/.env.azure-dev
- apps/ehr/env/.env.azure-beta
- apps/ehr/env/.env.azure-production
- apps/intake/env/.env.azure-dev
- apps/intake/env/.env.azure-beta
- apps/intake/env/.env.azure-production
- apps/billing/env/.env.azure-dev
- apps/billing/env/.env.azure-beta
- apps/billing/env/.env.azure-production

Fill all placeholder values before deploy:
- __PROJECT_ID__
- __EHR_CLIENT_ID__
- __EHR_APPLICATION_ID__
- __INTAKE_CLIENT_ID__
- __BILLING_CLIENT_ID__
- __BILLING_APPLICATION_ID__

## Required Azure CLI Login

Authenticate before deployment:
- az login

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
- npm run build:azure:all -- azure-dev
- npm run build:azure:all -- azure-beta
- npm run build:azure:all -- azure-production

## Deploy Commands

Build + zip + upload all three apps:
- npm run deploy:azure:dev
- npm run deploy:azure:beta
- npm run deploy:azure:production

## Canonical App URLs

Use these as the public-facing app URLs in dev:
- EHR: https://ehr.ottehrdev.innovarehealth.net
- Intake: https://intake.ottehrdev.innovarehealth.net
- Billing: https://billing.ottehrdev.innovarehealth.net

Note: this deploy flow targets Azure App Service (Web Apps). Ensure your canonical DNS hostnames are mapped to the corresponding web apps.

## Local Shell Examples

PowerShell (current session):
```powershell
# Dev
$env:AZURE_WEBAPP_EHR_DEV="InnovareHealthOttEHRDev"
$env:AZURE_WEBAPP_INTAKE_DEV="InnovareHealthOttEHRIntakeDev"
$env:AZURE_WEBAPP_BILLING_DEV="InnovareHealthOttEHRBillingDev"
$env:AZURE_WEBAPP_RESOURCE_GROUP_DEV="IHA-Web-RG"

# Beta
$env:AZURE_WEBAPP_EHR_BETA="InnovareHealthOttEHRBeta"
$env:AZURE_WEBAPP_INTAKE_BETA="InnovareHealthOttEHRIntakeBeta"
$env:AZURE_WEBAPP_BILLING_BETA="InnovareHealthOttEHRBillingBeta"
$env:AZURE_WEBAPP_RESOURCE_GROUP_BETA="IHA-Web-RG"

# Production
$env:AZURE_WEBAPP_EHR_PRODUCTION="InnovareHealthOttEHR"
$env:AZURE_WEBAPP_INTAKE_PRODUCTION="InnovareHealthOttEHRIntake"
$env:AZURE_WEBAPP_BILLING_PRODUCTION="InnovareHealthOttEHRBilling"
$env:AZURE_WEBAPP_RESOURCE_GROUP_PRODUCTION="IHA-Web-RG"

az login
npm run deploy:azure:dev
```

Bash (current session):
```bash
# Dev
export AZURE_WEBAPP_EHR_DEV="InnovareHealthOttEHRDev"
export AZURE_WEBAPP_INTAKE_DEV="InnovareHealthOttEHRIntakeDev"
export AZURE_WEBAPP_BILLING_DEV="InnovareHealthOttEHRBillingDev"
export AZURE_WEBAPP_RESOURCE_GROUP_DEV="IHA-Web-RG"

# Beta
export AZURE_WEBAPP_EHR_BETA="InnovareHealthOttEHRBeta"
export AZURE_WEBAPP_INTAKE_BETA="InnovareHealthOttEHRIntakeBeta"
export AZURE_WEBAPP_BILLING_BETA="InnovareHealthOttEHRBillingBeta"
export AZURE_WEBAPP_RESOURCE_GROUP_BETA="IHA-Web-RG"

# Production
export AZURE_WEBAPP_EHR_PRODUCTION="InnovareHealthOttEHR"
export AZURE_WEBAPP_INTAKE_PRODUCTION="InnovareHealthOttEHRIntake"
export AZURE_WEBAPP_BILLING_PRODUCTION="InnovareHealthOttEHRBilling"
export AZURE_WEBAPP_RESOURCE_GROUP_PRODUCTION="IHA-Web-RG"

az login
RE_WEBAPP_EHR_DEV="InnovareHealthOttEHRDev"
$env:AZURE_WEBAPP_INTAKE_DEV="InnovareHealthOttEHRIntakeDev"
$env:AZURE_WEBAPP_BILLING_DEV="InnovareHealthOttEHRBillingDev"
$env:AZURE_WEBAPP_RESOURCE_GROUP_DEV="IHA-Web-RG"

npm run deploy:azure:dev
```

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
					node-version: 20

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
