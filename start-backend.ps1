$mavenCmd = "mvn"
if (-not (Get-Command "mvn" -ErrorAction SilentlyContinue)) {
    $fallbackPaths = @(
        "$env:USERPROFILE\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd",
        "$env:USERPROFILE\.m2\wrapper\dists\apache-maven-3.6.3-bin\1iopthnavndlasol9gbrbg6bf2\apache-maven-3.6.3\bin\mvn.cmd"
    )
    foreach ($p in $fallbackPaths) {
        if (Test-Path $p) {
            $mavenCmd = $p
            break
        }
    }
}

Write-Host "Starting BlockVault Spring Boot Backend using $mavenCmd..." -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
& $mavenCmd spring-boot:run
