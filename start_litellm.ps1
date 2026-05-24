$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSCommandPath
$configPath = Join-Path $repoRoot 'litellm.proxy.yaml'
$launcherPath = Join-Path $repoRoot 'hermes_litellm.sh'

function Convert-ToWslPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$WindowsPath
    )

    $resolvedPath = (Resolve-Path $WindowsPath).Path
    if ($resolvedPath -match '^([A-Za-z]):\\(.*)$') {
        $drive = $matches[1].ToLowerInvariant()
        $rest = $matches[2] -replace '\\', '/'
        return "/mnt/$drive/$rest"
    }

    throw "Kann Pfad nicht in WSL umwandeln: $WindowsPath"
}

if (-not (Test-Path $configPath)) {
    throw "LiteLLM-Konfiguration nicht gefunden: $configPath"
}

if (-not (Test-Path $launcherPath)) {
    throw "LiteLLM-Launcher nicht gefunden: $launcherPath"
}

$listenHost = if ([string]::IsNullOrWhiteSpace($env:HERMES_LITELLM_HOST)) { '127.0.0.1' } else { $env:HERMES_LITELLM_HOST.Trim() }
$listenPort = if ([string]::IsNullOrWhiteSpace($env:HERMES_LITELLM_PORT)) { '4000' } else { $env:HERMES_LITELLM_PORT.Trim() }
$debugFlag = if ([string]::IsNullOrWhiteSpace($env:HERMES_LITELLM_DEBUG)) { '0' } else { $env:HERMES_LITELLM_DEBUG.Trim() }
$requestTimeout = if ([string]::IsNullOrWhiteSpace($env:HERMES_LITELLM_REQUEST_TIMEOUT)) { '240' } else { $env:HERMES_LITELLM_REQUEST_TIMEOUT.Trim() }

$wslRepoRoot = Convert-ToWslPath -WindowsPath $repoRoot
$wslConfigPath = Convert-ToWslPath -WindowsPath $configPath
$wslLauncherPath = Convert-ToWslPath -WindowsPath $launcherPath

Write-Host ''
Write-Host '========================================'
Write-Host '  LiteLLM Proxy for Claude Code'
Write-Host '========================================'
Write-Host ("Config : {0}" -f $configPath)
Write-Host ("Host   : {0}" -f $listenHost)
Write-Host ("Port   : {0}" -f $listenPort)
Write-Host ("Mode   : Claude Code -> LiteLLM -> llama.cpp")
Write-Host ''

$wslCommand = "cd '$wslRepoRoot'; HERMES_LITELLM_CONFIG='$wslConfigPath' HERMES_LITELLM_HOST='$listenHost' HERMES_LITELLM_PORT='$listenPort' HERMES_LITELLM_DEBUG='$debugFlag' HERMES_LITELLM_REQUEST_TIMEOUT='$requestTimeout' bash '$wslLauncherPath'"

& wsl.exe -d Ubuntu -- sh -lc $wslCommand