param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('GetModelBaseUrl', 'GetRepoWslPath', 'TestEndpoint')]
    [string]$Action,

    [string]$ConfigPath,

    [string]$InputPath,

    [string]$BaseUrl,

    [string]$BearerToken
)

$ErrorActionPreference = 'Stop'

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

    throw "Cannot convert path to WSL format: $WindowsPath"
}

function Get-HermesModelConfigValue {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$Key
    )

    if (-not (Test-Path $Path)) {
        return $null
    }

    $inModelBlock = $false
    foreach ($line in Get-Content $Path) {
        if ($line -match '^model:\s*$') {
            $inModelBlock = $true
            continue
        }

        if ($inModelBlock -and $line -match '^[^\s]') {
            break
        }

        if ($inModelBlock -and $line -match ('^\s*' + [regex]::Escape($Key) + ':\s*"?([^"#]+)')) {
            return $matches[1].Trim()
        }
    }

    return $null
}

switch ($Action) {
    'GetModelBaseUrl' {
        if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
            throw 'ConfigPath is required for GetModelBaseUrl.'
        }

        $resolvedBaseUrl = Get-HermesModelConfigValue -Path $ConfigPath -Key 'base_url'
        if (-not [string]::IsNullOrWhiteSpace($resolvedBaseUrl)) {
            [Console]::Out.Write($resolvedBaseUrl)
        }

        exit 0
    }

    'GetRepoWslPath' {
        if ([string]::IsNullOrWhiteSpace($InputPath)) {
            throw 'InputPath is required for GetRepoWslPath.'
        }

        [Console]::Out.Write((Convert-ToWslPath -WindowsPath $InputPath))
        exit 0
    }

    'TestEndpoint' {
        if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
            exit 1
        }

        $modelsUrl = $BaseUrl.TrimEnd('/') + '/models'
        $headers = @{}

        if (-not [string]::IsNullOrWhiteSpace($BearerToken)) {
            $headers['Authorization'] = "Bearer $BearerToken"
        }

        try {
            $requestParams = @{
                Uri = $modelsUrl
                UseBasicParsing = $true
                TimeoutSec = 3
            }

            if ($headers.Count -gt 0) {
                $requestParams['Headers'] = $headers
            }

            $response = Invoke-WebRequest @requestParams
            if ($response.StatusCode -eq 200) {
                exit 0
            }
        } catch {
        }

        exit 1
    }
}