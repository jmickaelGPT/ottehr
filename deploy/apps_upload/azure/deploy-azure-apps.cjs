const { spawnSync } = require('node:child_process');
const { existsSync, mkdirSync } = require('node:fs');
const https = require('node:https');
const { join, resolve } = require('node:path');

const rootDir = resolve(__dirname, '..', '..', '..');

const envArg = process.argv[2];
if (!envArg || !['dev', 'beta', 'production'].includes(envArg)) {
  console.error('Usage: node deploy/apps_upload/azure/deploy-azure-apps.cjs <dev|beta|production>');
  process.exit(1);
}

const billingOnly = String(process.env.BILLING_ONLY || '').toLowerCase() === 'true';

const modeByEnv = {
  dev: 'azure-dev',
  beta: 'azure-beta',
  production: 'azure-production',
};

const envMode = modeByEnv[envArg];

const defaultWebAppByEnv = {
  dev: {
    ehr: 'InnovareHealthOttEHRDev',
    intake: 'InnovareHealthOttEHRIntakeDev',
    billing: 'InnovareHealthOttEHRBillingDev',
  },
  beta: {
    ehr: 'InnovareHealthOttEHRBeta',
    intake: 'InnovareHealthOttEHRIntakeBeta',
    billing: 'InnovareHealthOttEHRBillingBeta',
  },
  production: {
    ehr: 'InnovareHealthOttEHR',
    intake: 'InnovareHealthOttEHRIntake',
    billing: 'InnovareHealthOttEHRBilling',
  },
};

const resourceGroupByEnv = {
  dev: process.env.AZURE_WEBAPP_RESOURCE_GROUP_DEV || 'IHA-Web-RG',
  beta: process.env.AZURE_WEBAPP_RESOURCE_GROUP_BETA || 'IHA-Web-RG',
  production: process.env.AZURE_WEBAPP_RESOURCE_GROUP_PRODUCTION || 'IHA-Web-RG',
};

const webAppByEnv = {
  dev: {
    ehr: process.env.AZURE_WEBAPP_EHR_DEV || defaultWebAppByEnv.dev.ehr,
    intake: process.env.AZURE_WEBAPP_INTAKE_DEV || defaultWebAppByEnv.dev.intake,
    billing: process.env.AZURE_WEBAPP_BILLING_DEV || defaultWebAppByEnv.dev.billing,
  },
  beta: {
    ehr: process.env.AZURE_WEBAPP_EHR_BETA || defaultWebAppByEnv.beta.ehr,
    intake: process.env.AZURE_WEBAPP_INTAKE_BETA || defaultWebAppByEnv.beta.intake,
    billing: process.env.AZURE_WEBAPP_BILLING_BETA || defaultWebAppByEnv.beta.billing,
  },
  production: {
    ehr: process.env.AZURE_WEBAPP_EHR_PRODUCTION || defaultWebAppByEnv.production.ehr,
    intake: process.env.AZURE_WEBAPP_INTAKE_PRODUCTION || defaultWebAppByEnv.production.intake,
    billing: process.env.AZURE_WEBAPP_BILLING_PRODUCTION || defaultWebAppByEnv.production.billing,
  },
};

const canonicalDomainByEnv = {
  dev: {
    ehr: 'ehr.ottehrdev.innovarehealth.net',
    intake: 'intake.ottehrdev.innovarehealth.net',
    billing: 'billing.ottehrdev.innovarehealth.net',
  },
  beta: {
    ehr: 'ehr.ottehrbeta.innovarehealth.net',
    intake: 'intake.ottehrbeta.innovarehealth.net',
    billing: 'billing.ottehrbeta.innovarehealth.net',
  },
  production: {
    ehr: 'ehr.ottehr.innovarehealth.net',
    intake: 'intake.ottehr.innovarehealth.net',
    billing: 'billing.ottehr.innovarehealth.net',
  },
};

const webApps = webAppByEnv[envArg];
const targetApps = billingOnly ? ['billing'] : ['ehr', 'intake', 'billing'];

for (const app of targetApps) {
  const webAppName = webApps[app];
  if (!webAppName) {
    console.error(`Missing Azure Web App name for ${app} in ${envArg}.`);
    process.exit(1);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
    ...options,
  });
  if (result.error) {
    console.error(`Failed to run command: ${command} ${args.join(' ')}`);
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function zipBuild(app) {
  const zipDir = join(rootDir, 'deploy', 'apps_upload', 'azure', 'dist');
  mkdirSync(zipDir, { recursive: true });

  const sourceDir = join(rootDir, 'apps', app, 'build');
  if (!existsSync(sourceDir)) {
    console.error(`Build output not found for ${app}: ${sourceDir}`);
    process.exit(1);
  }

  const zipPath = join(zipDir, `${app}-${envArg}.zip`);

  if (process.platform === 'win32') {
    run('powershell', [
      '-NoProfile',
      '-Command',
      `Compress-Archive -Path \"${sourceDir}\\*\" -DestinationPath \"${zipPath}\" -Force`,
    ]);
  } else {
    run('zip', ['-r', zipPath, '.'], { cwd: sourceDir, shell: false });
  }

  return zipPath;
}

function deployBuildToWebApp(app, zipPath) {
  const webAppName = webApps[app];
  const resourceGroup = resourceGroupByEnv[envArg];

  console.log(`Deploying ${app} to Azure Web App ${webAppName} (RG: ${resourceGroup})`);
  run('az', [
    'webapp',
    'deploy',
    '--name',
    webAppName,
    '--resource-group',
    resourceGroup,
    '--src-path',
    zipPath,
    '--type',
    'zip',
  ]);
}

function fetchResponseHeaders(hostname) {
  return new Promise((resolvePromise, rejectPromise) => {
    const request = https.request(
      {
        protocol: 'https:',
        hostname,
        path: '/',
        method: 'HEAD',
        timeout: 8000,
      },
      (response) => {
        response.resume();
        resolvePromise(response.headers);
      }
    );

    request.on('timeout', () => {
      request.destroy(new Error('Request timed out'));
    });
    request.on('error', rejectPromise);
    request.end();
  });
}

function looksLikeAzureAppService(headers) {
  const serverHeader = String(headers.server || '').toLowerCase();
  const setCookieHeaders = Array.isArray(headers['set-cookie'])
    ? headers['set-cookie'].join(';')
    : String(headers['set-cookie'] || '');
  const hasArrAffinityCookie = /arraffinity/i.test(setCookieHeaders);

  return serverHeader.includes('microsoft-iis') || hasArrAffinityCookie;
}

async function runCanonicalDomainPreflight() {
  const canonicalDomains = canonicalDomainByEnv[envArg];

  for (const app of targetApps) {
    const domain = canonicalDomains[app];
    try {
      const headers = await fetchResponseHeaders(domain);
      if (looksLikeAzureAppService(headers)) {
        console.log(`[preflight] ${app} canonical domain resolves to Azure App Service: https://${domain}`);
      } else {
        console.warn(`[preflight] Warning: ${app} canonical domain is not currently served by App Service: https://${domain}`);
        console.warn(`[preflight] This deploy targets Azure Web Apps. Verify DNS/custom-domain routing if traffic does not update.`);
      }
    } catch (error) {
      console.warn(
        `[preflight] Warning: unable to verify canonical domain for ${app} (https://${domain}): ${error.message}`
      );
    }
  }
}

async function main() {
  console.log(`Deploying Azure web apps for environment: ${envArg} (mode: ${envMode})`);
  if (billingOnly) {
    console.log('Deploying billing only.');
  }
  await runCanonicalDomainPreflight();

  run('npm', ['run', 'build:azure:all', '--', envMode]);

  const zipped = {};
  for (const app of targetApps) {
    zipped[app] = zipBuild(app);
  }
  console.log('Created zip artifacts:', zipped);

  for (const app of targetApps) {
    deployBuildToWebApp(app, zipped[app]);
  }

  console.log('Azure Web App deploy completed successfully.');
}

main().catch((error) => {
  console.error('Azure app deploy failed:', error);
  process.exit(1);
});
