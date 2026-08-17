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

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDir 'discord-webhook.ps1')

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
        Write-Warning 'Discord: webhook nao configurado - aviso de start ignorado.'
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

    $txtIntro = U8 0x4E,0x61,0x76,0x65,0x67,0x61,0x64,0x6F,0x72,0x65,0x73,0x20,0x61,0x62,0x65,0x72,0x74,0x6F,0x73,0x20,0x63,0x6F,0x6D,0x20,0x62,0x6F,0x74,0x5F,0x6D,0x6F,0x64,0x6F,0x20,0x28,0x63,0x61,0xC3,0xA7,0x61,0x64,0x61,0x73,0x2F,0x69,0x6E,0x76,0x61,0x73,0x6F,0x72,0x29,0x2E
    $lblNivel = U8 0x4E,0xC3,0xAD,0x76,0x65,0x6C,0x20,0x63,0x61,0xC3,0xA7,0x61,0x64,0x61,0x73
    $lblUsuario = U8 0x55,0x73,0x75,0xC3,0xA1,0x72,0x69,0x6F
    $lblHorario = U8 0x48,0x6F,0x72,0xC3,0xA1,0x72,0x69,0x6F

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
        $txtIntro
        ''
        "**Origem:** $origemTexto"
        "**Contas:**"
        ($linhasContas -join [Environment]::NewLine)
        ''
        "**${lblNivel}:** $NivelCacadas"
        "**Computador:** ``$computador``"
        "**${lblUsuario}:** ``$usuario``"
        "**${lblHorario}:** $agora"
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
        Send-DiscordWebhookUtf8 -Url $webhook -Payload $payload
        Write-Host 'Aviso enviado ao Discord.' -ForegroundColor Green
    } catch {
        Write-Warning "Falha ao enviar aviso Discord: $_"
    }
}

function Get-BotModoConta {
    param([hashtable]$Conta)

    if ($Conta.BotModo -eq 'cacadas' -or $Conta.BotModo -eq 'invasor') {
        return $Conta.BotModo
    }

    # Compat: contas antigas sem BotModo
    if ($Conta.Usuario -eq 'Shiroe') { return 'cacadas' }
    return 'invasor'
}

function Test-ContaTemCredenciais {
    param(
        [string]$Usuario,
        [string]$Senha
    )

    return -not [string]::IsNullOrWhiteSpace($Usuario) -and
        -not [string]::IsNullOrWhiteSpace($Senha) -and
        ($Senha -notlike 'PREENCHER*')
}

function Get-UrlLogin {
    param(
        [string]$Base,
        [string]$Usuario,
        [string]$Senha,
        [string]$Nivel,
        [string]$BotModo
    )

    if (-not (Test-ContaTemCredenciais -Usuario $Usuario -Senha $Senha)) {
        return $null
    }

    $root = $Base.TrimEnd('/')
    # Fase 1: sempre invasor nas 3 contas (login + ir para /invasor)
    $q = [ordered]@{
        bot_modo = 'invasor'
        bot_user = $Usuario
        bot_pass = $Senha
    }

    # Shiroe (cacadas): guarda nivel no localStorage para a fase 2
    if ($BotModo -eq 'cacadas') {
        $q['bot_nivel'] = $Nivel
    }

    $pairs = foreach ($key in $q.Keys) {
        '{0}={1}' -f $key, [uri]::EscapeDataString([string]$q[$key])
    }

    return '{0}/?{1}' -f $root, ($pairs -join '&')
}

function Get-UrlCacadas {
    param([string]$Base)

    return '{0}/cacadas?bot_modo=cacadas' -f $Base.TrimEnd('/')
}

function Get-BrowserArgs {
    param(
        [hashtable]$Conta,
        [ValidateSet('Login', 'Jogo')]
        [string]$Fase = 'Login'
    )

    # Fase 2 anonimo: SEM --private/--incognito — senao abre sessao NOVA sem cookies.
    # O executavel ja aberto recebe a URL como nova aba na janela privada existente.
    if ($Fase -eq 'Jogo' -and $Conta.Anonimo) {
        return @()
    }

    $args = @()
    if ($Conta.Anonimo) {
        if ($Conta.Exe -imatch 'chrome') {
            $args += '--incognito'
        } else {
            $args += '--private'
        }
    }

    return $args
}

function Open-NavegadorUrl {
    param(
        [hashtable]$Conta,
        [string]$Url,
        [ValidateSet('Login', 'Jogo')]
        [string]$Fase = 'Login'
    )

    $exe = $Conta.Exe
    if (-not (Test-Path $exe)) {
        Write-Warning "Executavel nao encontrado ($($Conta.Rotulo)): $exe"
        return $false
    }

    $args = Get-BrowserArgs -Conta $Conta -Fase $Fase
    $rotulo = if ($Fase -eq 'Login') { 'Login' } else { 'Jogo' }
    $modoLog = if ($Fase -eq 'Login') { 'invasor' } else { 'cacadas' }

    Write-Host "  $rotulo [$($Conta.Rotulo) | bot_modo=$modoLog]" -ForegroundColor Cyan
    if ($Fase -eq 'Jogo' -and $Conta.Anonimo) {
        Write-Host '    (nova aba na janela privada ja aberta — sem --private na fase 2)' -ForegroundColor DarkGray
    }
    Write-Host "    $Url"

    Start-Process -FilePath $exe -ArgumentList ($args + $Url) | Out-Null
    return $true
}

Write-Host ''
Write-Host '=== Shadow of Shinobi - abrir contas ===' -ForegroundColor Green
Write-Host ''

$esperaLogin = if ($IntervaloAposSetup) { $IntervaloAposSetup } else { 60 }
$contasAbertas = @()
$contasIgnoradas = @()

$contasLogin = @($Contas | Where-Object {
    Test-ContaTemCredenciais -Usuario $_.Usuario -Senha $_.Senha
})

# --- Fase 1: abas de login (todas as contas com senha) ---
if ($contasLogin.Count -gt 0) {
    Write-Host '--- Fase 1: login (bot_modo=invasor nas 3 contas) ---' -ForegroundColor Green
    Write-Host '  Shizuo/Sora ficam no invasor. Shiroe loga aqui e abre caçadas na fase 2.' -ForegroundColor DarkGray
    $i = 0
    foreach ($conta in $contasLogin) {
        if ($i -gt 0 -and $IntervaloEntreContas -gt 0) {
            Start-Sleep -Seconds $IntervaloEntreContas
        }

        if ($conta.Anonimo -and ($conta.Senha -like 'PREENCHER*' -or [string]::IsNullOrWhiteSpace($conta.Senha))) {
            Write-Warning "$($conta.Rotulo): modo anonimo sem senha no config - login pode falhar."
        }

        $botModo = Get-BotModoConta -Conta $conta
        $urlLogin = Get-UrlLogin -Base $UrlBase -Usuario $conta.Usuario -Senha $conta.Senha -Nivel $NivelCacadas -BotModo $botModo

        if (Open-NavegadorUrl -Conta $conta -Url $urlLogin -Fase Login) {
            if ($contasAbertas -notcontains $conta.Rotulo) {
                $contasAbertas += $conta.Rotulo
            }
        } else {
            if ($contasIgnoradas -notcontains $conta.Rotulo) {
                $contasIgnoradas += $conta.Rotulo
            }
        }

        $i++
    }

    Write-Host ''
    Write-Host "Aguardando ${esperaLogin}s para o bot concluir os logins..." -ForegroundColor DarkGray
    Start-Sleep -Seconds $esperaLogin
    Write-Host ''
}

# --- Fase 2: so caçadas (Shiroe) ---
$contasCacadas = @($Contas | Where-Object { Get-BotModoConta -Conta $_ -eq 'cacadas' })

if ($contasCacadas.Count -gt 0) {
    Write-Host '--- Fase 2: caçadas ---' -ForegroundColor Green
    $urlCacadas = Get-UrlCacadas -Base $UrlBase

    $i = 0
    foreach ($conta in $contasCacadas) {
        if ($i -gt 0 -and $IntervaloEntreContas -gt 0) {
            Start-Sleep -Seconds $IntervaloEntreContas
        }

        if (Open-NavegadorUrl -Conta $conta -Url $urlCacadas -Fase Jogo) {
            if ($contasAbertas -notcontains $conta.Rotulo) {
                $contasAbertas += $conta.Rotulo
            }
        } else {
            if ($contasIgnoradas -notcontains $conta.Rotulo) {
                $contasIgnoradas += $conta.Rotulo
            }
        }

        $i++
    }
} elseif ($contasLogin.Count -eq 0) {
    Write-Host '--- Fase 2: caçadas ---' -ForegroundColor Yellow
    Write-Host '  Nenhuma conta com BotModo=cacadas no config.' -ForegroundColor Yellow
}

Send-DiscordStartAviso -ContasAbertas $contasAbertas -ContasIgnoradas $contasIgnoradas -OrigemStart $Origem

Write-Host ''
Write-Host 'Pronto. Fase 1 = login invasor (3 contas) | 60s | Fase 2 = caçadas (Shiroe).' -ForegroundColor Green
Write-Host 'Edite BotModo e senhas em contas-jogo.config.ps1 se necessario.' -ForegroundColor Yellow
Write-Host ''
