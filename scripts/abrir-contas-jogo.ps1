# Abre Chrome + Opera com abas cacadas e invasor para cada conta configurada.
# Requer Inject Code com auto-run (atkSOS + atkInvSOS) ja configurado em cada navegador.
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\abrir-contas-jogo.ps1
#   powershell -ExecutionPolicy Bypass -File .\abrir-contas-jogo.ps1 -Origem auto

param(
    [ValidateSet('manual', 'auto')]
    [string]$Origem = 'manual'
)

$ErrorActionPreference = 'Stop'

$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configPath = Join-Path $scriptDir 'contas-jogo.config.ps1'

if (-not (Test-Path $configPath)) {
    Write-Error "Config nao encontrado: $configPath`nCopie contas-jogo.config.example.ps1 para contas-jogo.config.ps1"
}

. $configPath

if (-not (Get-Variable -Name 'AvisarDiscordStart' -Scope Script -ErrorAction SilentlyContinue)) {
    $AvisarDiscordStart = $true
}
if (-not (Get-Variable -Name 'DiscordStartSilencioso' -Scope Script -ErrorAction SilentlyContinue)) {
    $DiscordStartSilencioso = $false
}

function Get-DiscordWebhookStart {
    if (-not [string]::IsNullOrWhiteSpace($DiscordWebhookUrl)) {
        return $DiscordWebhookUrl
    }

    $discordConfig = Join-Path $scriptDir 'discord-pc-ligado.config.ps1'
    if (Test-Path $discordConfig) {
        . $discordConfig
        if (-not [string]::IsNullOrWhiteSpace($DiscordWebhookUrl)) {
            if (-not (Get-Variable -Name 'DiscordStartSilencioso' -Scope Script -ErrorAction SilentlyContinue) -or
                -not $script:DiscordStartSilencioso) {
                if ($null -ne $EnviarSilencioso) {
                    $script:DiscordStartSilencioso = [bool]$EnviarSilencioso
                }
            }
            return $DiscordWebhookUrl
        }
    }

    return $null
}

function Send-DiscordStartAviso {
    param(
        [string[]]$ContasAbertas,
        [string[]]$ContasIgnoradas,
        [string]$OrigemStart
    )

    if (-not $AvisarDiscordStart) { return }

    $webhook = Get-DiscordWebhookStart
    if ([string]::IsNullOrWhiteSpace($webhook)) {
        Write-Warning 'Discord: webhook nao configurado — aviso de start ignorado.'
        return
    }

    $agora = Get-Date -Format 'dd/MM/yyyy HH:mm:ss'
    $computador = $env:COMPUTERNAME
    $usuario = $env:USERNAME
    $origemTexto = if ($OrigemStart -eq 'auto') {
        'Auto-start (~5 min apos logon)'
    } else {
        'Atalho manual'
    }

    $linhasContas = foreach ($nome in $ContasAbertas) {
        "- $nome"
    }
    if ($ContasIgnoradas.Count -gt 0) {
        $linhasContas += ''
        $linhasContas += '**Nao abertas:**'
        foreach ($nome in $ContasIgnoradas) {
            $linhasContas += "- $nome"
        }
    }

    $descricao = @(
        'Navegadores abertos com caçadas + invasor.'
        ''
        "**Origem:** $origemTexto"
        "**Contas:**"
        ($linhasContas -join [Environment]::NewLine)
        ''
        "**Nivel caçadas:** $NivelCacadas"
        "**Computador:** ``$computador``"
        "**Usuario:** ``$usuario``"
        "**Horario:** $agora"
    ) -join [Environment]::NewLine

    $payload = @{
        username = 'Shadow of Shinobi'
        embeds = @(
            @{
                title = 'Contas iniciadas'
                description = $descricao
                color = 3447003
                timestamp = (Get-Date).ToUniversalTime().ToString('o')
            }
        )
    }

    if ($DiscordStartSilencioso) {
        $payload.flags = 4096
    }

    try {
        $json = $payload | ConvertTo-Json -Depth 6 -Compress
        $bytes = $Utf8NoBom.GetBytes($json)
        Invoke-WebRequest -Uri $webhook -Method Post -Body $bytes -ContentType 'application/json; charset=utf-8' -UseBasicParsing | Out-Null
        Write-Host 'Aviso enviado ao Discord.' -ForegroundColor Green
    } catch {
        Write-Warning "Falha ao enviar aviso Discord: $_"
    }
}

function Get-SetupUrl {
    param(
        [string]$Base,
        [string]$Usuario,
        [string]$Senha,
        [string]$Nivel
    )

    if ([string]::IsNullOrWhiteSpace($Usuario) -or [string]::IsNullOrWhiteSpace($Senha)) {
        return $null
    }

    if ($Senha -like 'PREENCHER*') {
        return $null
    }

    $q = @{
        bot_user  = $Usuario
        bot_pass  = $Senha
        bot_nivel = $Nivel
    }

    $pairs = foreach ($key in $q.Keys) {
        '{0}={1}' -f $key, [uri]::EscapeDataString([string]$q[$key])
    }

    return '{0}/?{1}' -f $Base.TrimEnd('/'), ($pairs -join '&')
}

function Start-ContaJogo {
    param(
        [hashtable]$Conta,
        [string]$Base,
        [string]$Nivel
    )

    $exe = $Conta.Exe
    if (-not (Test-Path $exe)) {
        Write-Warning "Executavel nao encontrado ($($Conta.Rotulo)): $exe"
        return $false
    }

    $setup = Get-SetupUrl -Base $Base -Usuario $Conta.Usuario -Senha $Conta.Senha -Nivel $Nivel
    $urls = @()

    if ($setup) {
        $urls += $setup
    } elseif ($Conta.Anonimo) {
        Write-Warning "$($Conta.Rotulo): modo anonimo sem senha no config - login pode falhar."
    }

    $urls += @(
        '{0}/cacadas' -f $Base.TrimEnd('/')
        '{0}/invasor' -f $Base.TrimEnd('/')
    )

    $args = @()
    if ($Conta.Anonimo) {
        if ($exe -imatch 'chrome') {
            $args += '--incognito'
        } else {
            $args += '--private'
        }
    }
    $args += $urls

    Write-Host "Abrindo: $($Conta.Rotulo)" -ForegroundColor Cyan
    Write-Host "  URLs: $($urls -join ' | ')"

    Start-Process -FilePath $exe -ArgumentList $args | Out-Null
    return $true
}

Write-Host ''
Write-Host '=== Shadow of Shinobi - abrir contas ===' -ForegroundColor Green
Write-Host ''

$i = 0
$contasAbertas = @()
$contasIgnoradas = @()

foreach ($conta in $Contas) {
    if ($i -gt 0 -and $IntervaloEntreContas -gt 0) {
        Start-Sleep -Seconds $IntervaloEntreContas
    }
    if (Start-ContaJogo -Conta $conta -Base $UrlBase -Nivel $NivelCacadas) {
        $contasAbertas += $conta.Rotulo
    } else {
        $contasIgnoradas += $conta.Rotulo
    }
    $i++
}

Send-DiscordStartAviso -ContasAbertas $contasAbertas -ContasIgnoradas $contasIgnoradas -OrigemStart $Origem

Write-Host ''
Write-Host 'Pronto. Inject Code deve rodar automaticamente (auto-run ON).' -ForegroundColor Green
Write-Host "Edite senhas em contas-jogo.config.ps1 (Shizuo e Sora) se ainda nao preencheu." -ForegroundColor Yellow
Write-Host ''
