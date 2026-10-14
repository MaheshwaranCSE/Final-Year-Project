param (
    [Parameter(Mandatory=$false, Position=0)]
    [string]$PublicIP,

    [Parameter(Mandatory=$false, Position=1)]
    [string]$User = "ec2-user",

    [Parameter(Mandatory=$false)]
    [string]$KeyPath = ""
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "      BlockVault AWS EC2 Automated Uploader & Deployer      " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Resolve Key Path
if (-not $KeyPath) {
    if (Test-Path ".\myproj.pem") {
        $KeyPath = (Resolve-Path ".\myproj.pem").Path
    } elseif ($PSScriptRoot -and (Test-Path "$PSScriptRoot\..\myproj.pem")) {
        $KeyPath = (Resolve-Path "$PSScriptRoot\..\myproj.pem").Path
    }
}

$keyFile = Resolve-Path $KeyPath -ErrorAction SilentlyContinue
if (-not $keyFile) {
    Write-Error "Could not find private key file at: $KeyPath"
    exit 1
}
Write-Host "[OK] Located private key: $($keyFile.Path)" -ForegroundColor Green

# 2. Fix Key Permissions (OpenSSH Windows requirement)
Write-Host "[1/5] Ensuring strict permissions on private key..." -ForegroundColor Yellow
try {
    $acl = Get-Acl $keyFile.Path
    icacls $keyFile.Path /inheritance:r | Out-Null
    icacls $keyFile.Path /grant:r "$($env:USERNAME):(R)" | Out-Null
    icacls $keyFile.Path /remove:g "BUILTIN\Users" "NT AUTHORITY\Authenticated Users" 2>$null | Out-Null
    Write-Host "[OK] Key permissions secured." -ForegroundColor Green
} catch {
    Write-Warning "Could not modify ACLs automatically. Proceeding..."
}

# 3. Prompt for Public IP if not provided
if (-not $PublicIP) {
    $PublicIP = Read-Host "Enter your AWS EC2 Public IPv4 Address or Public DNS hostname"
}

if (-not $PublicIP) {
    Write-Error "EC2 Public IP address is required."
    exit 1
}

# Auto-detect default username if user enters standard AWS DNS
if ($PublicIP -match "compute-1\.amazonaws\.com" -and $User -eq "ec2-user") {
    Write-Host "Tip: If your instance is Ubuntu, use -User ubuntu. Defaulting to: $User" -ForegroundColor Gray
}

$remoteHost = "${User}@${PublicIP}"
Write-Host "Target Host: $remoteHost" -ForegroundColor Cyan

# 4. Package Project
$rootDir = if ($PSScriptRoot) { (Resolve-Path "$PSScriptRoot\..").Path } else { (Get-Location).Path }
$archiveName = "blockvault-package.tar.gz"
$archivePath = "$rootDir\$archiveName"

Write-Host "[2/5] Creating lightweight deployment package (excluding node_modules)..." -ForegroundColor Yellow
if (Test-Path $archivePath) {
    Remove-Item -Force $archivePath
}

# Use tar to package
Set-Location -Path $rootDir
tar -czf $archiveName `
    --exclude="node_modules" `
    --exclude=".git" `
    --exclude="backend/target" `
    --exclude="blockvault-package.tar.gz" `
    --exclude="*.log" `
    .

if (-not (Test-Path $archivePath)) {
    Write-Error "Failed to create archive: $archivePath"
    exit 1
}

$archiveSizeMB = [math]::Round((Get-Item $archivePath).Length / 1MB, 2)
Write-Host "[OK] Created package: $archiveName ($archiveSizeMB MB)" -ForegroundColor Green

# 5. Test SSH Connectivity
Write-Host "[3/5] Testing SSH connection to $remoteHost..." -ForegroundColor Yellow
$sshOpts = @("-i", "$($keyFile.Path)", "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10")

try {
    & ssh @sshOpts $remoteHost "echo 'SSH Connection Successful!'"
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "SSH connection test failed with code $LASTEXITCODE. Check IP and Security Group rules."
    }
} catch {
    Write-Error "SSH failed: $_"
    exit 1
}

# 6. Upload Package via SCP
Write-Host "[4/5] Uploading package to EC2 instance..." -ForegroundColor Yellow
$scpOpts = @("-i", "$($keyFile.Path)", "-o", "StrictHostKeyChecking=no")
& scp @scpOpts $archivePath "${remoteHost}:~/"

if ($LASTEXITCODE -ne 0) {
    Write-Error "SCP upload failed."
    exit 1
}
Write-Host "[OK] Upload completed." -ForegroundColor Green

# 7. Unpack and Run Setup Remotely
Write-Host "[5/5] Unpacking and executing setup on EC2..." -ForegroundColor Yellow
$remoteCommands = @"
mkdir -p ~/blockvault
tar -xzf ~/$archiveName -C ~/blockvault
sed -i 's/\r$//' ~/blockvault/scripts/setup-ec2.sh
chmod +x ~/blockvault/scripts/setup-ec2.sh
bash ~/blockvault/scripts/setup-ec2.sh
"@

& ssh @sshOpts $remoteHost "$remoteCommands"

Write-Host "============================================================" -ForegroundColor Green
Write-Host " BlockVault Deployment Command Completed!                   " -ForegroundColor Green
Write-Host " Access URLs:" -ForegroundColor Cyan
Write-Host " - Frontend: http://${PublicIP}:3000" -ForegroundColor White
Write-Host " - Backend:  http://${PublicIP}:8080" -ForegroundColor White
Write-Host ""
Write-Host " Note: Ensure your AWS EC2 Security Group has inbound rules" -ForegroundColor Yellow
Write-Host " allowing ports 22 (SSH), 3000 (React), and 8080 (Spring Boot)." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
