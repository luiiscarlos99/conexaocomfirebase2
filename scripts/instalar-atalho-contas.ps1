# Cria atalho na Area de Trabalho e (opcional) abre contas ao logar no Windows.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\instalar-atalho-contas.ps1
#
# Parametros:
#   -AutoStartup   Instala tarefa agendada no logon (sem perguntar)
#   -SemStartup    So cria o atalho na area de trabalho

param(
    [switch]$AutoStartup,
    [switch]$SemStartup
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$launcherBat = Join-Path $scriptDir 'abrir-contas-jogo.bat'
$launcherPs1 = Join-Path $scriptDir 'abrir-contas-jogo.ps1'
$taskName = 'ShadowOfShinobi-AbrirContas'
$atalhoNome = 'Shadow of Shinobi - Contas.lnk'
$desktop = [Environment]::GetFolderPath('Desktop')
$atalhoPath = Join-Path $desktop $atalhoNome

if (-not (Test-Path $launcherPs1)) {
    Write-Error "Script nao encontrado: $launcherPs1"
}

function New-Atalho {
    param(
        [string]$Caminho,
        [string]$Alvo,
        [string]$Argumentos,
        [string]$Diretorio,
        [string]$Descricao
    )

    $shell = New-Object -ComObject WScript.Shell
    $lnk = $shell.CreateShortcut($Caminho)
    $lnk.TargetPath = $Alvo
    if ($Argumentos) { $lnk.Arguments = $Argumentos }
    $lnk.WorkingDirectory = $Diretorio
    $lnk.Description = $Descricao
    $lnk.Save()
}

Write-Host ''
Write-Host '=== Instalar atalho - Shadow of Shinobi ===' -ForegroundColor Green
Write-Host ''

New-Atalho `
    -Caminho $atalhoPath `
    -Alvo $launcherBat `
    -Argumentos '' `
    -Diretorio $scriptDir `
    -Descricao 'Abre Chrome e Opera com as 3 contas (portao caçadas + invasor)'

Write-Host "Atalho criado na Area de Trabalho:" -ForegroundColor Cyan
Write-Host "  $atalhoPath"
Write-Host ''

$instalarStartup = $false
if ($AutoStartup) {
    $instalarStartup = $true
} elseif (-not $SemStartup) {
    $resp = Read-Host 'Abrir contas automaticamente ao ligar o PC / logar? (s/N)'
    $instalarStartup = ($resp -eq 's' -or $resp -eq 'S')
}

if ($instalarStartup) {
    $configPath = Join-Path $scriptDir 'contas-jogo.config.ps1'
    if (-not (Test-Path $configPath)) {
        Write-Warning "Arquivo de config nao encontrado: $configPath"
        Write-Warning 'Copie contas-jogo.config.example.ps1 para contas-jogo.config.ps1 antes de usar o auto-start.'
        $instalarStartup = $false
    } else {
        . $configPath
        if (-not (Get-Variable -Name 'ScriptAbrirNavegadores' -Scope Script -ErrorAction SilentlyContinue)) {
            $script:ScriptAbrirNavegadores = $false
        }
        if (-not $ScriptAbrirNavegadores) {
            Write-Warning 'ScriptAbrirNavegadores=$false no config — auto-start nao sera instalado.'
            $instalarStartup = $false
        }
    }
}

if ($instalarStartup) {
    $action = New-ScheduledTaskAction `
        -Execute 'powershell.exe' `
        -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPs1`" -Origem auto"

    $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    $trigger.Delay = 'PT5M'

    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Description 'Abre navegadores com contas Shadow of Shinobi apos logon.' `
        -Force | Out-Null

    Write-Host "Tarefa agendada instalada: $taskName" -ForegroundColor Green
    Write-Host 'Dispara ~5 minutos apos cada logon neste usuario.'
    Write-Host ''
    Write-Host 'Remover auto-start:'
    Write-Host "  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
} else {
    $existente = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existente) {
        Write-Host "Tarefa '$taskName' ja existia - nao foi alterada." -ForegroundColor Yellow
        Write-Host 'Para remover: Unregister-ScheduledTask -TaskName' $taskName '-Confirm:$false'
    }
}

Write-Host ''
Write-Host 'Pronto. Duplo clique no atalho da Area de Trabalho para abrir as contas.' -ForegroundColor Green
Write-Host ''
