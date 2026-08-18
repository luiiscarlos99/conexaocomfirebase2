# Instala tarefa agendada: aviso Discord ~1 min após logon
# Execute como Administrador (opcional) ou usuário normal:
#   powershell -ExecutionPolicy Bypass -File ".\instalar-tarefa-startup.ps1"

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$scriptPath = Join-Path $scriptDir 'discord-pc-ligado.ps1'
$configPath = Join-Path $scriptDir 'discord-webhooks.config.ps1'
$legacyConfigPath = Join-Path $scriptDir 'discord-pc-ligado.config.ps1'
$taskName = 'Discord-Aviso-PC-Ligado'

if (-not (Test-Path $scriptPath)) {
    Write-Error "Script não encontrado: $scriptPath"
}

if (-not (Test-Path $configPath) -and -not (Test-Path $legacyConfigPath)) {
    Write-Host ''
    Write-Host 'ATENÇÃO: Crie o arquivo de config antes de instalar:' -ForegroundColor Yellow
    Write-Host '  Copie: discord-webhooks.config.example.ps1 -> discord-webhooks.config.ps1' -ForegroundColor Yellow
    Write-Host ''
    $continuar = Read-Host 'Continuar mesmo assim? (s/N)'
    if ($continuar -ne 's' -and $continuar -ne 'S') { exit 1 }
}

$action = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5)

# Espera ~60s após logon para rede estabilizar (além do retry interno do script)
$trigger.Delay = 'PT1M'

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description 'Envia aviso no Discord quando este PC liga / usuário entra no Windows.' `
    -Force | Out-Null

Write-Host ''
Write-Host "Tarefa instalada: $taskName" -ForegroundColor Green
Write-Host 'Dispara: ~1 minuto após cada logon neste usuário.'
Write-Host ''
Write-Host 'Testar agora:'
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$scriptPath`""
Write-Host ''
Write-Host 'Remover tarefa:'
Write-Host "  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
