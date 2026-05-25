param(
    [switch]$WithClaudeBridge,
    [switch]$SkipLaunch
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSCommandPath
$configPath = Join-Path $repoRoot 'hermes_config.yaml'
$helperScript = Join-Path $repoRoot 'hermes_batch_helper.ps1'
$starterHermes = Join-Path $repoRoot 'start_hermes.bat'
$starterCombined = Join-Path $repoRoot 'start_hermes_claude_local.bat'

function Get-ModelPathFromConfig {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $inModelBlock = $false
    foreach ($line in Get-Content $Path) {
        if ($line -match '^model:\s*$') {
            $inModelBlock = $true
            continue
        }

        if ($inModelBlock -and $line -match '^[^\s]') {
            break
        }

        if ($inModelBlock -and $line -match '^\s*path:\s*(.+?)\s*$') {
            $value = $matches[1] -replace '\s+#.*$', ''
            $value = $value.Trim()

            if ($value.Length -ge 2) {
                $firstChar = $value[0]
                $lastChar = $value[$value.Length - 1]
                if (($firstChar -eq '"' -and $lastChar -eq '"') -or ($firstChar -eq "'" -and $lastChar -eq "'")) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
            }

            return $value
        }
    }

    return $null
}

function Set-ModelPathInConfig {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,

        [Parameter(Mandatory = $true)]
        [string]$ModelPath
    )

    $escaped = $ModelPath -replace "'", "''"
    $yamlValue = "'$escaped'"

    $content = Get-Content $Path -Raw
    $updated = [regex]::Replace(
        $content,
        '(?ms)(^model:\s*\r?\n(?:^(?:\s{2,}.+|\s*)\r?\n)*?^\s*path:\s*)(.+?)\s*(\r?\n)',
        ('$1' + $yamlValue + '$3'),
        [System.Text.RegularExpressions.RegexOptions]::Multiline
    )

    if ($updated -eq $content) {
        throw "Could not update model.path in $Path"
    }

    Set-Content -Path $Path -Value $updated -NoNewline
}

function Assert-FileExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        throw "Required file not found: $Path"
    }
}

function Test-CommandAvailable {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name
    )

    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Find-GgufFiles {
    Write-Host '  Scanning common locations for .gguf files...' -ForegroundColor DarkGray

    $candidates = [System.Collections.Generic.List[string]]::new()

    # Targeted sub-folders inside USERPROFILE (avoids slow full-profile recurse)
    $searchRoots = [System.Collections.Generic.List[string]]::new()
    foreach ($sub in @('Downloads', 'Documents', 'Desktop', 'Models', 'model', 'LLM', 'GGUF', 'AI', 'ml', 'data')) {
        $searchRoots.Add("$env:USERPROFILE\$sub")
    }

    # Common model folders on every available drive
    $drives = (Get-PSDrive -PSProvider FileSystem -ErrorAction SilentlyContinue).Root |
              Where-Object { $_ -match '^[A-Z]:\\$' }
    foreach ($drive in $drives) {
        foreach ($sub in @('Models', 'model', 'LLM', 'GGUF', 'AI', 'Coding', 'ml', 'data', 'llm', 'ai')) {
            $searchRoots.Add("$drive$sub")
        }
    }

    foreach ($root in $searchRoots) {
        if (-not (Test-Path $root -ErrorAction SilentlyContinue)) { continue }
        try {
            Get-ChildItem -Path $root -Filter '*.gguf' -Recurse -Depth 6 -File -ErrorAction SilentlyContinue |
                ForEach-Object {
                    if (-not $candidates.Contains($_.FullName)) {
                        $candidates.Add($_.FullName)
                    }
                }
        } catch { }
    }

    return $candidates
}

Assert-FileExists -Path $configPath
Assert-FileExists -Path $starterHermes
Assert-FileExists -Path $starterCombined

if (-not (Test-CommandAvailable -Name 'wsl.exe')) {
    throw 'wsl.exe is not available. Install WSL first.'
}

$currentModelPath = Get-ModelPathFromConfig -Path $configPath

Write-Host ''
Write-Host '========================================'
Write-Host '  Hermes Local Setup Wizard'
Write-Host '========================================'
Write-Host ("Repo root      : {0}" -f $repoRoot)
if (-not [string]::IsNullOrWhiteSpace($currentModelPath)) {
    Write-Host ("Configured model: {0}" -f $currentModelPath)
}
Write-Host ''

$needsModelPath = $true
if (-not [string]::IsNullOrWhiteSpace($currentModelPath) -and (Test-Path $currentModelPath)) {
    $needsModelPath = $false
}

if ($needsModelPath) {
    if (-not [string]::IsNullOrWhiteSpace($currentModelPath)) {
        Write-Host ("  Configured path not found: {0}" -f $currentModelPath) -ForegroundColor Yellow
    }
    Write-Host ''
    Write-Host 'No valid GGUF model is configured. Looking for models on this machine...' -ForegroundColor Yellow

    $scanChoice = Read-Host 'Scan this machine for .gguf files automatically? [Y/n]'
    $doScan = $scanChoice -notmatch '^[Nn]'

    $foundModels = [System.Collections.Generic.List[string]]::new()
    if ($doScan) {
        $foundModels = Find-GgufFiles
    }

    $newModelPath = $null

    if ($foundModels.Count -gt 0) {
        Write-Host ''
        Write-Host 'Found GGUF models:' -ForegroundColor Cyan
        for ($i = 0; $i -lt $foundModels.Count; $i++) {
            $sizeStr = ''
            try {
                $sizeGB = (Get-Item $foundModels[$i]).Length / 1GB
                $sizeStr = '  ({0:F1} GB)' -f $sizeGB
            } catch { }
            Write-Host ('  [{0}] {1}{2}' -f ($i + 1), $foundModels[$i], $sizeStr)
        }
        Write-Host '  [M] Enter a path manually'
        Write-Host '  [Q] Quit setup'
        Write-Host ''

        $selPrompt = "Select model [1-$($foundModels.Count)], M, or Q"
        $choice = Read-Host $selPrompt

        if ($choice -match '^\d+$') {
            $idx = [int]$choice - 1
            if ($idx -ge 0 -and $idx -lt $foundModels.Count) {
                $newModelPath = $foundModels[$idx]
            } else {
                Write-Host 'Number out of range. Falling back to manual entry.' -ForegroundColor Yellow
            }
        } elseif ($choice -ieq 'Q') {
            Write-Host 'Setup cancelled.' -ForegroundColor Yellow
            exit 0
        }

        # Manual entry if M was chosen or selection was invalid
        if ($null -eq $newModelPath) {
            Write-Host ''
            Write-Host 'Example: E:\Models\Qwen\Qwen3-27B-Q4_K_M.gguf'
            $newModelPath = Read-Host 'GGUF model path (or press Enter to abort)'
        }
    } else {
        if ($doScan) {
            Write-Host ''
            Write-Host 'No .gguf files found in common locations.' -ForegroundColor Yellow
        }
        Write-Host ''
        Write-Host 'Where to get a model:' -ForegroundColor Cyan
        Write-Host '  https://huggingface.co/bartowski  (curated Q4_K_M / Q5_K_M builds)'
        Write-Host '  Recommended: Qwen3-14B-Q4_K_M.gguf or Qwen3-30B-A3B-Q4_K_M.gguf'
        Write-Host ''
        Write-Host 'After downloading, enter the full path below.'
        Write-Host 'Example: E:\Models\Qwen\Qwen3-14B-Q4_K_M.gguf'
        Write-Host ''
        $newModelPath = Read-Host 'GGUF model path (or press Enter to abort)'
    }

    if ([string]::IsNullOrWhiteSpace($newModelPath)) {
        throw 'Setup aborted because model path was empty.'
    }

    if (-not (Test-Path $newModelPath)) {
        throw "The provided model path does not exist: $newModelPath"
    }

    Set-ModelPathInConfig -Path $configPath -ModelPath $newModelPath
    Write-Host ("Updated model.path in hermes_config.yaml to: {0}" -f $newModelPath) -ForegroundColor Green
}

$wslPathInfo = ''
if (Test-Path $helperScript) {
    $wslPathInfo = & powershell -NoProfile -ExecutionPolicy Bypass -File $helperScript -Action GetRepoWslPath -InputPath $repoRoot
}
if (-not [string]::IsNullOrWhiteSpace($wslPathInfo)) {
    Write-Host ("WSL repo path   : {0}" -f $wslPathInfo)
}

Write-Host ''
Write-Host 'Checklist:'
Write-Host ' - WSL2 + Ubuntu installed'
Write-Host ' - Hermes installed in /root/.hermes/hermes-agent (inside WSL)'
Write-Host ' - llama.cpp binaries available under tools/llama.cpp'
Write-Host ''

if ($SkipLaunch) {
    Write-Host 'Setup finished. Launch skipped (-SkipLaunch).'
    exit 0
}

if ($WithClaudeBridge) {
    Write-Host 'Launching: Hermes + Claude local bridge mode'
    & $starterCombined
} else {
    Write-Host 'Launching: Hermes direct mode'
    & $starterHermes
}

exit $LASTEXITCODE
