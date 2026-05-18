# PowerShell script to update runtime configuration after deployment
# Usage: .\update-config.ps1 -ApiUrl "https://new-api-domain.com" -BaseUrl "https://new-domain.com"

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl,
    
    [string]$ConfigPath = "dist/assets/config/runtime-config.json"
)

Write-Host "Updating runtime configuration..." -ForegroundColor Green

# Remove trailing slash from URLs if present
$ApiUrl = $ApiUrl.TrimEnd('/')
$BaseUrl = $BaseUrl.TrimEnd('/')

# Extract host from BaseUrl for OAuth
$uri = [System.Uri]$BaseUrl
$oauthHost = "//$($uri.Host)"
if ($uri.Port -ne 80 -and $uri.Port -ne 443) {
    $oauthHost += ":$($uri.Port)"
}

# Create new configuration
$config = @{
    apiBaseUrl = "$ApiUrl/api/services/app"
    baseUrl = "$BaseUrl/"
    assetUrl = "$BaseUrl/SmartOfficerAttachment"
    oauthHost = $oauthHost
    oauthProtocol = $uri.Scheme
    oauthPort = ""
    oauthClientId = ""
    oauthSecret = ""
    oauthPath = "api/TokenAuth/Authenticate"
    isDesktopApp = $false
    production = $true
}

# Convert to JSON
$jsonConfig = $config | ConvertTo-Json -Depth 10

# Check if config file exists
if (Test-Path $ConfigPath) {
    # Backup existing config
    $backupPath = "$ConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $ConfigPath $backupPath
    Write-Host "Backup created: $backupPath" -ForegroundColor Yellow
    
    # Write new config
    $jsonConfig | Out-File -FilePath $ConfigPath -Encoding UTF8
    Write-Host "Configuration updated successfully!" -ForegroundColor Green
    Write-Host "New API URL: $($config.apiBaseUrl)" -ForegroundColor Cyan
    Write-Host "New Base URL: $($config.baseUrl)" -ForegroundColor Cyan
} else {
    Write-Host "Config file not found at: $ConfigPath" -ForegroundColor Red
    Write-Host "Creating new config file..." -ForegroundColor Yellow
    $jsonConfig | Out-File -FilePath $ConfigPath -Encoding UTF8
    Write-Host "Configuration file created!" -ForegroundColor Green
}

Write-Host "`nConfiguration preview:" -ForegroundColor Magenta
Write-Host $jsonConfig -ForegroundColor Gray