param(
  [string]$EnvName = "local",
  [ValidateSet("apply", "plan")]
  [string]$Action = "apply"
)

$ErrorActionPreference = "Stop"

$autoApprove = ""
if ($env:CI -eq "true") {
  $autoApprove = "--auto-approve"
}

Write-Host "Deploying environment: $EnvName"

npm run bundle-zambdas

$previousEnv = $env:ENV
$hadPreviousEnv = Test-Path Env:ENV
$env:ENV = $EnvName
npm run generate
if ($hadPreviousEnv) {
  $env:ENV = $previousEnv
} else {
  Remove-Item Env:ENV -ErrorAction SilentlyContinue
}

Remove-Item -Path "aws_override.tf" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "gcp_override.tf" -Force -ErrorAction SilentlyContinue

npm run terraform-init
& terraform workspace select $EnvName

if (Select-String -Path "$EnvName.tfvars" -Pattern "^aws_profile" -Quiet) {
  Copy-Item -Path "aws.tf.override" -Destination "aws_override.tf" -Force
}

if (Select-String -Path "$EnvName.tfvars" -Pattern "^gcp_project" -Quiet) {
  Copy-Item -Path "gcp.tf.override" -Destination "gcp_override.tf" -Force
}

npm run terraform-init

if ($Action -eq "apply") {
  $tfArgs = @("apply", "-no-color", "-parallelism=20", "-var-file=$EnvName.tfvars")
  if ($autoApprove) {
    $tfArgs += $autoApprove
  }
  & terraform @tfArgs
} else {
  & terraform plan -no-color -parallelism=20 -var-file="$EnvName.tfvars"
}
